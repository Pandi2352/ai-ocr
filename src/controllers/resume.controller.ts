import { Request, Response, NextFunction } from 'express';
import { OCRResult } from '../models/ocr.model';
import { ResumeResult } from '../models/resume.model';
import { generateText } from '../utils/llm';
import { RESUME_ANALYSIS_PROMPT } from '../utils/resume.prompts';
import { sendSuccess } from '../utils/response';
import { HttpException } from '../exceptions/HttpException';

export const analyzeResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ocrId, job_description } = req.body;

        if (!ocrId || !job_description) {
            throw new HttpException(400, 'ocrId and job_description are required');
        }

        const ocrDoc = await OCRResult.findById(ocrId);
        if (!ocrDoc) {
            throw new HttpException(404, 'Resume Parsing Record not found');
        }

        if (!ocrDoc.analysis) {
            throw new HttpException(400, 'Resume must be processed/analyzed first');
        }

        const prompt = `${RESUME_ANALYSIS_PROMPT}

=== JOB DESCRIPTION ===
${job_description}

=== RESUME CONTENT ===
${ocrDoc.analysis}
`;

        const rawResult = await generateText(prompt);

        let jsonResult: any = {};
        try {
            const jsonStr = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonResult = JSON.parse(jsonStr);
        } catch (e) {
            jsonResult = { error: "Failed to parse result", raw: rawResult };
        }

        const candidateProfile = jsonResult.candidate_profile || {};
        const matchInfo = jsonResult.match_analysis || {};
        const score = matchInfo.overall_match_percentage || 0;

        const resumeRecord = await ResumeResult.create({
            ocrId,
            jobDescription: job_description,
            parsedProfile: candidateProfile,
            matchResult: matchInfo,
            overallMatchScore: score
        });

        sendSuccess(res, 'Resume Analysis & Matching Completed', resumeRecord);

    } catch (error) {
        next(error);
    }
};

export const getResumeHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const history = await ResumeResult.find()
            .populate('ocrId', 'originalName')
            .sort({ createdAt: -1 });
        sendSuccess(res, 'Resume history retrieved', history);
    } catch (error) {
        next(error);
    }
};
