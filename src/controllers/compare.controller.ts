import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { CompareResult } from '../models/compare.model';
import { generateText } from '../utils/llm';
import { COMPARE_DOCUMENT_PROMPT } from '../utils/compare.prompts';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';

export const compareDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sourceId, targetId } = req.body;

        if (!sourceId || !targetId) {
            throw new HttpException(400, 'Both sourceId and targetId are required');
        }

        // 1. Fetch Documents
        const sourceDoc = await OCRResult.findById(sourceId);
        const targetDoc = await OCRResult.findById(targetId);

        if (!sourceDoc || !targetDoc) {
            throw new HttpException(404, 'One or both documents not found');
        }

        if (!sourceDoc.analysis || !targetDoc.analysis) {
            throw new HttpException(400, 'Documents must be analyzed before comparison');
        }

        // 2. Prepare Prompt
        const prompt = `${COMPARE_DOCUMENT_PROMPT}

=== SOURCE DOCUMENT (Original) ===
${sourceDoc.analysis}

=== TARGET DOCUMENT (New) ===
${targetDoc.analysis}
`;

        // 3. Call LLM
        const rawResult = await generateText(prompt);

        // 4. Parse JSON
        let comparisonJson: any = {};
        try {
            // Cleanup potential markdown formatting
            const jsonStr = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
            comparisonJson = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Comparison JSON Parse Error", e);
            comparisonJson = { error: "Failed to parse comparison result", raw: rawResult };
        }

        // 5. Save Result
        const comparisonRecord = await CompareResult.create({
            sourceOcrId: sourceId,
            targetOcrId: targetId,
            comparisonResult: comparisonJson,
            status: 'SUCCESS'
        });

        // 6. Respond
        sendSuccess(res, 'Comparison completed successfully', comparisonRecord);

    } catch (error) {
        next(error);
    }
};

export const getComparisonHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const history = await CompareResult.find()
            .populate('sourceOcrId', 'originalName')
            .populate('targetOcrId', 'originalName')
            .sort({ createdAt: -1 });

        sendSuccess(res, 'Comparison history retrieved', history);
    } catch (error) {
        next(error);
    }
};
