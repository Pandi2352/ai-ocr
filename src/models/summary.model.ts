import mongoose, { Schema, Document } from 'mongoose';
import { generateUUID } from '../utils/uuid';

export interface ISummaryResult extends Omit<Document, '_id'> {
    _id: string;
    ocrId: string;
    summary: string;
    customPrompt?: string;
    createdAt: Date;
}

const SummaryResultSchema: Schema = new Schema(
    {
        _id: { type: String, default: generateUUID },
        ocrId: { type: String, required: true, ref: 'OCRResult' },
        summary: { type: String, required: true },
        customPrompt: { type: String, default: null }
    },
    { timestamps: true }
);

export const SummaryResult = mongoose.model<ISummaryResult>('SummaryResult', SummaryResultSchema);
