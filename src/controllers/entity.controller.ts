import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { EntityResult } from '../models/entity.model';
import { generateText } from '../utils/llm';
import { generateEntityPrompt, AUTO_ENTITY_EXTRACTION_PROMPT } from '../utils/prompts';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';
import { logger } from '../utils/logger';

export const extractEntities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId, fields } = req.body;

        if (!ocrId) {
            throw new HttpException(400, 'ocrId is required');
        }

        // Removed strict check for fields presence to allow auto-extraction

        const ocrRecord = await OCRResult.findById(ocrId);
        if (!ocrRecord) {
            throw new HttpException(404, 'OCR Record not found');
        }

        if (!ocrRecord.analysis) {
            throw new HttpException(400, 'Analysis text not found. Please wait for OCR to complete.');
        }

        let prompt;
        if (fields && Array.isArray(fields) && fields.length > 0) {
            logger.info(`Starting entity extraction for ${ocrId} with fields: ${fields.join(', ')}`);
            const dynamicPrompt = generateEntityPrompt(fields);
            prompt = `${dynamicPrompt}\n\nTEXT TO ANALYZE:\n${ocrRecord.analysis}`;
        } else {
            logger.info(`Starting auto-entity extraction for ${ocrId}`);
            prompt = `${AUTO_ENTITY_EXTRACTION_PROMPT}\n\nTEXT TO ANALYZE:\n${ocrRecord.analysis}`;
        }

        const aiResponse = await generateText(prompt);

        let entities = {};

        // Parse JSON
        try {
            // Remove markdown code blocks if present
            const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            entities = parsed;
        } catch (e) {
            logger.warn(`Failed to parse entity JSON for ${ocrId}: ${aiResponse}`);
        }

        const result = await EntityResult.create({
            ocrId: ocrRecord._id,
            entities: entities
        });

        // Also save to OCRResult as requested
        ocrRecord.entityResult = entities;
        await ocrRecord.save();

        sendSuccess(res, 'Entities extracted successfully', result);

    } catch (error) {
        next(error);
    }
};
