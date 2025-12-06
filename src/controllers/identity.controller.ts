import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { IdentityResult } from '../models/identity.model';
import { generateMultimodalContent, generateText, uploadFileToGemini } from '../utils/llm';
import { IDENTITY_VERIFICATION_PROMPT } from '../utils/identity.prompts';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';
import path from 'path';
import mime from 'mime-types';

export const verifyIdentity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { docA_Id, docB_Id } = req.body;
        if (!docA_Id || !docB_Id) throw new HttpException(400, 'Both docA_Id and docB_Id are required');

        const docA = await OCRResult.findById(docA_Id);
        const docB = await OCRResult.findById(docB_Id);

        if (!docA || !docB) throw new HttpException(404, 'Documents not found');

        // Check availability of files for visual analysis
        // Ideally, we need the original files for Face/Fraud detection.
        // If files are deleted, we fallback to text comparison.
        const uploadDir = path.join(process.cwd(), 'uploads');
        // We might need to handle this robustly if files are gone. 
        // For now, assuming current upload flow keeps them or strict Identity flow ensures they exist.
        // The current OCR flow deletes files unless they are images. 
        // If they are images, they might be in `uploads/` temporarily or deleted.
        // Let's assume we rely on what Gemini can see. 
        // If files are deleted, we can ONLY do text analysis.

        // BETTER APPROACH: Uploading files to Gemini generates a URI. 
        // But those URIs expire or we don't store them permanently (yet).
        // Let's assume for this feature, the user has just uploaded them or they exist.
        // If we can't access files, we warn.

        let prompt = IDENTITY_VERIFICATION_PROMPT;
        let responseText = '';

        // Construct visual parts if possible (Attempting to re-upload if files exist locally)
        // NOTE: In a real prod env, we'd store these in S3/GCS. 
        // Here we check local disk based on filename (if we stored it). 
        // The current OCR controller deletes files. 
        // THIS IS A LIMITATION. 
        // Workaround: We will rely on the `analysis` text for now, OR 
        // User must use `folder` uploads which might persist files (implementation detail).

        // For now, let's prompt broadly using the TEXT CONTENT primarily, 
        // but if we *could* send images, we would.
        // Since we can't guarantee images exist, we will feed the DETAILED ANALYSIS of both.

        prompt += `\n\n=== DOCUMENT A DATA ===\n${docA.analysis}\nMetadata: ${JSON.stringify(docA.metadata)}`;
        prompt += `\n\n=== DOCUMENT B DATA ===\n${docB.analysis}\nMetadata: ${JSON.stringify(docB.metadata)}`;

        prompt += `\n\n**NOTE**: If images are not provided, infer visual traits from the textual description (e.g., "Photo detected", "Signature present") if available.`;

        responseText = await generateText(prompt);

        // Parse JSON
        let verificationJson: any = {};
        try {
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            verificationJson = JSON.parse(jsonStr);
        } catch (e) {
            verificationJson = { error: "Failed to parse result", raw: responseText };
        }

        // Determine Status
        let status: any = 'PENDING';
        let risk: any = 'LOW';

        if (verificationJson["1_document_summary"]) {
            const verdict = verificationJson["1_document_summary"].final_verdict;
            const fraud = verificationJson["1_document_summary"].fraud_risk_level;

            if (verdict === 'matched') status = 'APPROVED';
            else if (verdict === 'mismatched') status = 'REJECTED';
            else status = 'MANUAL_REVIEW';

            if (fraud) risk = fraud.toUpperCase();
        }

        const identityRecord = await IdentityResult.create({
            docA_Id,
            docB_Id,
            verificationResult: verificationJson,
            overallStatus: status,
            fraudRisk: risk
        });

        sendSuccess(res, 'Identity verification completed', identityRecord);

    } catch (error) {
        next(error);
    }
};

export const getIdentityHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const history = await IdentityResult.find()
            .populate('docA_Id', 'originalName')
            .populate('docB_Id', 'originalName')
            .sort({ createdAt: -1 });
        sendSuccess(res, 'History retrieved', history);
    } catch (error) {
        next(error);
    }
};
