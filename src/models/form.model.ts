import mongoose, { Schema, Document } from 'mongoose';
import { generateUUID } from '../utils/uuid';

export interface IFormResult extends Omit<Document, '_id'> {
    _id: string;
    ocrId: string;
    formType: string;
    formData: Record<string, any>;
    meta: {
        missingFields: string[];
        confidence?: number;
    };
    createdAt: Date;
}

const FormResultSchema: Schema = new Schema(
    {
        _id: { type: String, default: generateUUID },
        ocrId: { type: String, required: true, ref: 'OCRResult' },
        formType: { type: String, default: 'custom' },
        formData: { type: Schema.Types.Mixed, default: {} },
        meta: {
            missingFields: { type: [String], default: [] },
            confidence: { type: Number }
        }
    },
    { timestamps: true }
);

export const FormResult = mongoose.model<IFormResult>('FormResult', FormResultSchema);
