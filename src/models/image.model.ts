import mongoose, { Schema, Document } from 'mongoose';
import { generateUUID } from '../utils/uuid';

export interface IImageResult extends Omit<Document, '_id'> {
    _id: string;
    ocrId: string;
    imageUrl: string;
    prompt: string;
    createdAt: Date;
}

const ImageResultSchema: Schema = new Schema(
    {
        _id: { type: String, default: generateUUID },
        ocrId: { type: String, required: true, ref: 'OCRResult' },
        imageUrl: { type: String, required: true },
        prompt: { type: String, required: true }
    },
    { timestamps: true }
);

export const ImageResult = mongoose.model<IImageResult>('ImageResult', ImageResultSchema);
