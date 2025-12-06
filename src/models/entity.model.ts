import mongoose, { Schema, Document } from 'mongoose';
import { generateUUID } from '../utils/uuid';

export interface IEntityResult extends Omit<Document, '_id'> {
    _id: string;
    ocrId: string;
    entities: Record<string, string | null>; // Dynamic object
    createdAt: Date;
}

const EntityResultSchema: Schema = new Schema(
    {
        _id: { type: String, default: generateUUID },
        ocrId: { type: String, required: true, ref: 'OCRResult' },
        entities: { type: Schema.Types.Mixed, default: {} } // Allow any structure
    },
    { timestamps: true }
);

export const EntityResult = mongoose.model<IEntityResult>('EntityResult', EntityResultSchema);
