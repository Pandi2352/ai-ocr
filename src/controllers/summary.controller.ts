import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { SummaryResult } from '../models/summary.model';
import { generateText } from '../utils/llm';
import { AUTO_SUMMARY_PROMPT } from '../utils/prompts';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';
import { logger } from '../utils/logger';

export const generateSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId, prompt: customPrompt } = req.body;

        if (!ocrId) {
            throw new HttpException(400, 'ocrId is required');
        }

        const ocrRecord = await OCRResult.findById(ocrId);
        if (!ocrRecord) {
            throw new HttpException(404, 'OCR Record not found');
        }

        if (!ocrRecord.analysis) {
            throw new HttpException(400, 'Analysis text not found. Please wait for OCR to complete.');
        }

        let finalPrompt;
        if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim().length > 0) {
            logger.info(`Starting custom summarization for ${ocrId}`);
            finalPrompt = `${customPrompt}\n\nTEXT TO SUMMARIZE:\n${ocrRecord.analysis}`;
        } else {
            logger.info(`Starting auto summarization for ${ocrId}`);
            finalPrompt = `${AUTO_SUMMARY_PROMPT}\n\nTEXT TO SUMMARIZE:\n${ocrRecord.analysis}`;
        }

        const aiResponse = await generateText(finalPrompt);

        const result = await SummaryResult.create({
            ocrId: ocrRecord._id,
            summary: aiResponse,
            customPrompt: customPrompt || null
        });

        // Sync with OCRResult
        ocrRecord.summary = aiResponse;
        await ocrRecord.save();

        sendSuccess(res, 'Summary generated successfully', result);

    } catch (error) {
        next(error);
    }
};
