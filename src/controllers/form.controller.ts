import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { FormResult } from '../models/form.model';
import { generateText } from '../utils/llm';
import { generateFormPrompt } from '../utils/prompts';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';
import { logger } from '../utils/logger';

export const fillForm = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId, schema, formType } = req.body;

        if (!ocrId) {
            throw new HttpException(400, 'ocrId is required');
        }

        if (!schema || typeof schema !== 'object') {
            throw new HttpException(400, 'schema object is required to define the form structure');
        }

        const ocrRecord = await OCRResult.findById(ocrId);
        if (!ocrRecord) {
            throw new HttpException(404, 'OCR Record not found');
        }

        if (!ocrRecord.analysis) {
            throw new HttpException(400, 'Analysis text not found. Please wait for OCR to complete.');
        }

        const prompt = generateFormPrompt(schema);
        const finalPrompt = `${prompt}\n\nTEXT TO MAP:\n${ocrRecord.analysis}`;

        logger.info(`Starting form filling for ${ocrId}`);
        const aiResponse = await generateText(finalPrompt);

        let formData = {};
        let missingFields: string[] = [];

        try {
            const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            formData = parsed.form_data || {};
            missingFields = parsed.missing_fields || [];
        } catch (e) {
            logger.warn(`Failed to parse form JSON for ${ocrId}: ${aiResponse}`);
        }

        const result = await FormResult.create({
            ocrId: ocrRecord._id,
            formType: formType || 'custom',
            formData: formData,
            meta: {
                missingFields: missingFields
            }
        });

        // Note: intentionally NOT saving to OCRResult as per user request (separate DB only)

        sendSuccess(res, 'Form filled successfully', result);

    } catch (error) {
        next(error);
    }
};
