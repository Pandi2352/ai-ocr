import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { generateEmbeddings, generateText } from '../utils/llm';
import { vectorIndex } from '../utils/vector';
import { RAG_QA_PROMPT, RAG_CHAT_PROMPT } from '../utils/rag-prompts';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';
import { logger } from '../utils/logger';

// Helper to chunk text
const chunkText = (text: string, chunkSize: number = 1000, overlap: number = 200): string[] => {
    const chunks: string[] = [];
    let index = 0;
    while (index < text.length) {
        chunks.push(text.slice(index, index + chunkSize));
        index += (chunkSize - overlap);
    }
    return chunks;
};

/**
 * Checks if vectors exist for the given OCR ID. If not, ingests them on the fly.
 */
const ensureVectorsExist = async (ocrId: string) => {
    const ocrRecord = await OCRResult.findById(ocrId);
    if (!ocrRecord) throw new HttpException(404, 'OCR Record not found');

    // If already processed, skip
    if (ocrRecord.status.rag === 'SUCCESS') {
        return;
    }

    if (!ocrRecord.analysis) throw new HttpException(400, 'No analysis text available to ingest');

    logger.info(`Lazy ingestion triggered for ${ocrId}`);
    const text = ocrRecord.analysis;
    const chunks = chunkText(text);

    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await generateEmbeddings(chunk);

        vectors.push({
            id: `${ocrId}-chunk-${i}`,
            vector: embedding,
            metadata: {
                ocrId: ocrId,
                text: chunk,
                chunkIndex: i
            }
        });
    }

    if (vectors.length > 0) {
        await vectorIndex.upsert(vectors);
    }

    // Update status
    ocrRecord.status.rag = 'SUCCESS';
    await ocrRecord.save();
    logger.info(`Lazy ingestion completed for ${ocrId}`);
};

// Kept for backward compatibility or manual triggering, but reuses logic
export const ingestDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId } = req.body;
        if (!ocrId) throw new HttpException(400, 'ocrId is required');

        await ensureVectorsExist(ocrId);

        sendSuccess(res, `Ingestion ensured for ${ocrId}`);
    } catch (error) {
        next(error);
    }
};

/**
 * SEARCH = Single Turn Q&A
 * User asks a question, gets a direct answer based on the document.
 */
export const searchDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId, query, question } = req.body;
        const searchQuery = query || question;

        if (!searchQuery) throw new HttpException(400, 'Query or Question is required');

        // Lazy Ingestion
        if (ocrId) {
            await ensureVectorsExist(ocrId);
        }

        // 1. Retrieve Context
        const filterStr = ocrId ? `ocrId = '${ocrId}'` : "";
        const queryEmbedding = await generateEmbeddings(searchQuery);

        const queryResult = await vectorIndex.query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true,
            filter: filterStr
        });

        const contextChunks = queryResult.map(match => match.metadata?.text || "").filter(t => t);
        const uniqueContext = Array.from(new Set(contextChunks)).join("\n---\n");

        if (!uniqueContext) {
            return sendSuccess(res, "Answer", { answer: "No relevant context found in this document." });
        }

        // 2. Generate Answer (RAG)
        const prompt = RAG_QA_PROMPT
            .replace('{{CONTEXT}}', uniqueContext)
            .replace('{{QUESTION}}', searchQuery);

        const answer = await generateText(prompt);

        sendSuccess(res, 'Answer generated', {
            answer: answer,
            sources: queryResult.map(m => ({ id: m.id, score: m.score }))
        });

    } catch (error) {
        next(error);
    }
};

/**
 * CHAT = Multi-Turn Conversation
 * Maintains history context.
 */
export const chatWithDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId, question, history } = req.body; // history: [{ role: 'user', content: '...' }, { role: 'ai', content: '...' }]
        if (!question) throw new HttpException(400, 'Question is required');

        if (ocrId) {
            await ensureVectorsExist(ocrId);
        }

        const filterStr = ocrId ? `ocrId = '${ocrId}'` : "";

        // 1. Embed question
        const questionEmbedding = await generateEmbeddings(question);

        // 2. Query Vector DB
        const queryResult = await vectorIndex.query({
            vector: questionEmbedding,
            topK: 5,
            includeMetadata: true,
            filter: filterStr
        });

        // 3. Construct Context
        const contextChunks = queryResult.map(match => match.metadata?.text || "").filter(t => t);
        const uniqueContext = Array.from(new Set(contextChunks)).join("\n---\n");

        if (!uniqueContext) {
            return sendSuccess(res, "Answer", { answer: "No relevant context found." });
        }

        // 4. Format History
        let historyText = "No previous history.";
        if (history && Array.isArray(history)) {
            historyText = history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
        }

        // 5. Generate Answer with History
        const prompt = RAG_CHAT_PROMPT
            .replace('{{CONTEXT}}', uniqueContext)
            .replace('{{HISTORY}}', historyText)
            .replace('{{QUESTION}}', question);

        const answer = await generateText(prompt);

        sendSuccess(res, 'Answer generated', {
            answer: answer,
            sources: queryResult.map(m => ({ id: m.id, score: m.score }))
        });

    } catch (error) {
        next(error);
    }
};
