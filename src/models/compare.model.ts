import mongoose, { Schema, Document } from 'mongoose';
import { generateUUID } from '../utils/uuid';

export interface ICompareResult extends Omit<Document, '_id'> {
    _id: string;
    sourceOcrId: string;
    targetOcrId: string;
    comparisonResult: Record<string, any>; // The detailed JSON output
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    createdAt: Date;
    updatedAt: Date;
}

const CompareResultSchema: Schema = new Schema(
    {
        _id: { type: String, default: generateUUID },
        sourceOcrId: { type: String, required: true, ref: 'OCRResult' },
        targetOcrId: { type: String, required: true, ref: 'OCRResult' },
        comparisonResult: { type: Schema.Types.Mixed, default: {} },
        status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' }
    },
    { timestamps: true }
);

export const CompareResult = mongoose.model<ICompareResult>('CompareResult', CompareResultSchema);
