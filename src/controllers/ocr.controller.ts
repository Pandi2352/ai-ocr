import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import mammoth from 'mammoth';
import mime from 'mime-types';
import { uploadFileToGemini, generateMultimodalContent, generateText } from '../utils/llm';
import { sendSuccess } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { HttpException } from '../exceptions/HttpException';
import {
    PDF_EXTRACTION_PROMPT,
    IMAGE_CONTEXT_PROMPT,
    AUDIO_CONTEXT_PROMPT,
    VIDEO_CONTEXT_PROMPT,
    META_JSON_PROMPT,
    ENRICHMENT_PROMPT
} from '../utils/prompts';
import { logger } from '../utils/logger';
import { OCRResult } from '../models/ocr.model';

const extractTextFromDocx = async (filePath: string): Promise<string> => {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
};

const readTextFile = async (filePath: string): Promise<string> => {
    return fs.promises.readFile(filePath, 'utf-8');
};

// Background Task Function
const runBackgroundEnrichment = async (ocrId: string, filePath: string, mimetype: string, fileUri?: string) => {
    logger.info(`Starting background enrichment for ${ocrId}`);

    try {
        const ocrRecord = await OCRResult.findById(ocrId);
        if (!ocrRecord) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return;
        }

        let enrichmentResultString = '';
        let prompt = ENRICHMENT_PROMPT;

        if (fileUri) {
            enrichmentResultString = await generateMultimodalContent(prompt, { mimeType: mimetype, fileUri: fileUri });
        } else {
            prompt = `${ENRICHMENT_PROMPT}\n\nCONTEXT:\n${ocrRecord.analysis}`;
            enrichmentResultString = await generateText(prompt);
        }

        // 1. Extract JSON Metadata
        let enrichmentData: any = { mermaid: '' };
        try {
            const jsonMatch = enrichmentResultString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                enrichmentData = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            logger.warn(`Failed to parse Enrichment JSON for ${ocrId}`);
        }

        // 2. Extract Mermaid (Priority: JSON > Markdown Block)
        let mermaidCode = enrichmentData.mermaid || '';
        if (!mermaidCode || mermaidCode.trim() === '') {
            const mermaidMatch = enrichmentResultString.match(/```mermaid\n([\s\S]*?)\n```/);
            if (mermaidMatch && mermaidMatch[1]) {
                mermaidCode = mermaidMatch[1].trim();
            }
        }

        // Update DB
        ocrRecord.mindmap = mermaidCode;
        ocrRecord.status.enrichment = 'SUCCESS';

        const finalEndTime = new Date();
        ocrRecord.timing.endTime = finalEndTime;
        ocrRecord.timing.duration = finalEndTime.getTime() - ocrRecord.timing.startTime.getTime();

        if (ocrRecord.status.visualProcessing === 'SUCCESS') {
            ocrRecord.status.overall = 'SUCCESS';
        }

        await ocrRecord.save();
        logger.info(`Background enrichment completed for ${ocrId}`);

    } catch (error: any) {
        logger.error(`Background enrichment failed for ${ocrId}: ${error.message}`);
        await OCRResult.findByIdAndUpdate(ocrId, {
            'status.enrichment': 'FAILED'
        });
    } finally {
        // Safe Cleanup
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                logger.warn(`Failed to delete temp file ${filePath}`);
            }
        }
    }
};


export const analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = new Date();
    let ocrRecord: any = null;
    let geminiFileUri: string | undefined = undefined;
    let shouldDeleteFileImmediately = true;

    try {
        if (!req.file) {
            throw new HttpException(400, 'File is required');
        }

        const { path: filePath, mimetype } = req.file;
        const extension = mime.extension(mimetype);

        logger.info(`Analyzing file: ${req.file.originalname} (${mimetype})`);

        // Create Initial Record
        ocrRecord = await OCRResult.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            analysis: '',
            mindmap: '',
            timing: { startTime },
            status: {
                upload: 'SUCCESS',
                visualProcessing: 'PENDING',
                enrichment: 'PENDING',
                overall: 'PENDING'
            }
        });

        let finalPrompt = '';
        let analysisResult = '';

        // Phase 1: Main Extraction (Sync)
        if (mimetype === 'text/plain' || mimetype === 'text/csv' || extension === 'txt' || extension === 'csv') {
            const content = await readTextFile(filePath);
            finalPrompt = `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}\n\n${META_JSON_PROMPT}`;
            analysisResult = await generateText(finalPrompt);
            shouldDeleteFileImmediately = true;

        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') {
            const content = await extractTextFromDocx(filePath);
            finalPrompt = `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}\n\n${META_JSON_PROMPT}`;
            analysisResult = await generateText(finalPrompt);
            shouldDeleteFileImmediately = true;

        } else {
            // Media Files
            let contextPrompt = PDF_EXTRACTION_PROMPT;
            if (mimetype.startsWith('image/')) contextPrompt = IMAGE_CONTEXT_PROMPT;
            else if (mimetype.startsWith('audio/')) contextPrompt = AUDIO_CONTEXT_PROMPT;
            else if (mimetype.startsWith('video/')) contextPrompt = VIDEO_CONTEXT_PROMPT;

            finalPrompt = `${contextPrompt}\n\n${META_JSON_PROMPT}`;

            const uploadResult = await uploadFileToGemini(filePath, mimetype);
            geminiFileUri = uploadResult.uri;

            analysisResult = await generateMultimodalContent(finalPrompt, {
                mimeType: uploadResult.mimeType,
                fileUri: uploadResult.uri
            });

            // If Image, KEEP file for background processing (cropping)
            if (mimetype.startsWith('image/')) {
                shouldDeleteFileImmediately = false;
            }
        }

        // Parse Phase 1 JSON
        let jsonResult = { title: '', description: '', thumbnail: '' };
        let cleanAnalysis = analysisResult;

        try {
            const jsonMatch = analysisResult.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonResult = JSON.parse(jsonMatch[1]);
                cleanAnalysis = analysisResult.replace(/```json\n[\s\S]*?\n```/, '').trim();
            } else {
                const firstBrace = analysisResult.lastIndexOf('{');
                const lastBrace = analysisResult.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    const potentialJson = analysisResult.substring(firstBrace, lastBrace + 1);
                    jsonResult = JSON.parse(potentialJson);
                    cleanAnalysis = analysisResult.substring(0, firstBrace).trim();
                }
            }
        } catch (e) {
            logger.warn('Failed to parse Meta JSON');
        }

        // Partial Cleanup
        if (shouldDeleteFileImmediately) {
            try { fs.unlinkSync(filePath); } catch (e) { }
        }

        // Update Record (Phase 1 Complete)
        ocrRecord.analysis = cleanAnalysis;
        ocrRecord.metadata = jsonResult;
        ocrRecord.status.visualProcessing = 'SUCCESS';
        await ocrRecord.save();

        // Trigger Background Phase
        // Hand over the filePath if we kept it. Background task will handle deletion.
        runBackgroundEnrichment(ocrRecord._id, filePath, mimetype, geminiFileUri);

        // Send Response
        sendSuccess(res, 'File analyzed successfully (Enrichment running in background)', {
            id: ocrRecord._id,
            status: ocrRecord.status,
            metadata: jsonResult,
            analysis: cleanAnalysis
        });

    } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        if (ocrRecord) {
            ocrRecord.status.visualProcessing = 'FAILED';
            ocrRecord.status.overall = 'FAILED';
            await ocrRecord.save();
        }
        next(error);
    }
};

export const getFileStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const ocrRecord = await OCRResult.findById(id);

        if (!ocrRecord) {
            throw new HttpException(404, 'OCR Record not found');
        }

        let duration = ocrRecord.timing.duration;
        if (ocrRecord.status.overall === 'PENDING' && ocrRecord.timing.startTime) {
            duration = new Date().getTime() - new Date(ocrRecord.timing.startTime).getTime();
        }

        sendSuccess(res, 'File status retrieved successfully', {
            id: ocrRecord._id,
            status: ocrRecord.status,
            timing: {
                ...ocrRecord.timing,
                duration
            },
            filename: ocrRecord.filename, // Storage filename
            originalName: ocrRecord.originalName, // Original upload name
            mimetype: ocrRecord.mimetype,
            size: ocrRecord.size,
            metadata: ocrRecord.metadata,
            mindmap: ocrRecord.mindmap,
            analysis: ocrRecord.analysis, // Include analysis
            summary: ocrRecord.summary, // Include summary
            entityResult: ocrRecord.entityResult, // Include entityResult
            createdAt: ocrRecord.createdAt
        });

    } catch (error) {
        next(error);
    }
};

export const getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, order } = req.query;
        const { skip, limit: limitNum, page: pageNum } = getPagination(page as string, limit as string);

        const filter: any = {};
        if (search) {
            filter.originalName = { $regex: search, $options: 'i' };
        }

        const sortDirection = order === 'asc' ? 1 : -1;

        const total = await OCRResult.countDocuments(filter);
        const files = await OCRResult.find(filter)
            .sort({ createdAt: sortDirection })
            .skip(skip)
            .limit(limitNum)
            .select('-analysis'); // Exclude heavy fields

        sendSuccess(res, 'Files retrieved successfully', {
            data: files,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getSummaries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, order } = req.query;
        const { skip, limit: limitNum, page: pageNum } = getPagination(page as string, limit as string);

        const filter: any = { summary: { $ne: '' } }; // Only fetch items with a summary
        if (search) {
            filter.originalName = { $regex: search, $options: 'i' };
        }

        const sortDirection = order === 'asc' ? 1 : -1;

        const total = await OCRResult.countDocuments(filter);
        const files = await OCRResult.find(filter)
            .sort({ createdAt: sortDirection })
            .skip(skip)
            .limit(limitNum)
            .select('originalName summary createdAt status mimetype');

        sendSuccess(res, 'Summaries retrieved successfully', {
            data: files,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getEntities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, order } = req.query;
        const { skip, limit: limitNum, page: pageNum } = getPagination(page as string, limit as string);

        const filter: any = { entityResult: { $ne: {} } }; // Only fetch items with entities
        if (search) {
            filter.originalName = { $regex: search, $options: 'i' };
        }

        const sortDirection = order === 'asc' ? 1 : -1;

        const total = await OCRResult.countDocuments(filter);
        const files = await OCRResult.find(filter)
            .sort({ createdAt: sortDirection })
            .skip(skip)
            .limit(limitNum)
            .select('originalName entityResult createdAt status mimetype');

        sendSuccess(res, 'Entities retrieved successfully', {
            data: files,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};
