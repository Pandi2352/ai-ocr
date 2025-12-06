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
    META_JSON_PROMPT
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

export const analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = new Date();
    let ocrRecord: any = null;

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
            analysis: '', // Pending
            timing: {
                startTime: startTime
            },
            status: {
                upload: 'SUCCESS',
                visualProcessing: 'PENDING',
                overall: 'PENDING'
            }
        });

        let finalPrompt = '';
        let analysisResult = '';

        // Handle File Types
        if (mimetype === 'text/plain' || mimetype === 'text/csv' || extension === 'txt' || extension === 'csv') {
            const content = await readTextFile(filePath);
            finalPrompt = `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}\n\n${META_JSON_PROMPT}`;
            analysisResult = await generateText(finalPrompt);

        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') {
            const content = await extractTextFromDocx(filePath);
            finalPrompt = `${PDF_EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT:\n${content}\n\n${META_JSON_PROMPT}`;
            analysisResult = await generateText(finalPrompt);

        } else {
            // Media Files
            let contextPrompt = PDF_EXTRACTION_PROMPT;

            if (mimetype.startsWith('image/')) {
                contextPrompt = IMAGE_CONTEXT_PROMPT;
            } else if (mimetype.startsWith('audio/')) {
                contextPrompt = AUDIO_CONTEXT_PROMPT;
            } else if (mimetype.startsWith('video/')) {
                contextPrompt = VIDEO_CONTEXT_PROMPT;
            } else if (mimetype === 'application/pdf') {
                contextPrompt = PDF_EXTRACTION_PROMPT;
            }

            finalPrompt = `${contextPrompt}\n\n${META_JSON_PROMPT}`;

            const uploadResult = await uploadFileToGemini(filePath, mimetype);

            analysisResult = await generateMultimodalContent(finalPrompt, {
                mimeType: uploadResult.mimeType,
                fileUri: uploadResult.uri
            });
        }

        // Parse JSON Result
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

        // Cleanup
        fs.unlinkSync(filePath);

        // Update Record with Success
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        ocrRecord.analysis = cleanAnalysis;
        ocrRecord.metadata = jsonResult;
        ocrRecord.timing.endTime = endTime;
        ocrRecord.timing.duration = duration;
        ocrRecord.status.visualProcessing = 'SUCCESS';
        ocrRecord.status.overall = 'SUCCESS';
        await ocrRecord.save();

        sendSuccess(res, 'File analyzed successfully', {
            id: ocrRecord._id,
            status: ocrRecord.status,
            timing: ocrRecord.timing,
            metadata: jsonResult,
            analysis: cleanAnalysis
        });

    } catch (error: any) {
        // Cleanup
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        // Update Record with Failure
        if (ocrRecord) {
            const endTime = new Date();
            ocrRecord.timing.endTime = endTime;
            ocrRecord.timing.duration = endTime.getTime() - startTime.getTime();
            ocrRecord.status.visualProcessing = 'FAILED';
            ocrRecord.status.overall = 'FAILED';
            // Optionally save error message in analysis or new field if desired, 
            // for now just marking status.
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

        // Calculate live duration if still running
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
            filename: ocrRecord.originalName,
            createdAt: ocrRecord.createdAt
        });

    } catch (error) {
        next(error);
    }
};

export const getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = req.query;
        const { skip, limit: limitNum, page: pageNum } = getPagination(page as string, limit as string);

        const total = await OCRResult.countDocuments();
        const files = await OCRResult.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .select('-analysis'); // Exclude heavy analysis content for list view

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
