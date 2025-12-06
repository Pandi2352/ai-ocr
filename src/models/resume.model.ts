import mongoose, { Schema, Document } from 'mongoose';
import { generateUUID } from '../utils/uuid';

export interface IResumeResult extends Omit<Document, '_id'> {
    _id: string;
    ocrId: string;
    jobDescription: string;
    parsedProfile: Record<string, any>; // Stores extracted candidate info (Skills, Exp, etc.)
    matchResult: Record<string, any>;   // Stores the JD Match Score & Gaps
    overallMatchScore: number;
    createdAt: Date;
    updatedAt: Date;
}

const ResumeResultSchema: Schema = new Schema(
    {
        _id: { type: String, default: generateUUID },
        ocrId: { type: String, required: true, ref: 'OCRResult' },
        jobDescription: { type: String, required: true },
        parsedProfile: { type: Schema.Types.Mixed, default: {} },
        matchResult: { type: Schema.Types.Mixed, default: {} },
        overallMatchScore: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export const ResumeResult = mongoose.model<IResumeResult>('ResumeResult', ResumeResultSchema);
