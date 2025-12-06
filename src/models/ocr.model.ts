import mongoose, { Schema, Document } from 'mongoose';

export interface IOCRResult extends Document {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    analysis: string;
    metadata: {
        title: string;
        description: string;
        thumbnail: string;
    };
    timing: {
        startTime: Date;
        endTime?: Date;
        duration?: number;
    };
    status: {
        upload: 'PENDING' | 'SUCCESS' | 'FAILED';
        visualProcessing: 'PENDING' | 'SUCCESS' | 'FAILED';
        rag: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
        overall: 'PENDING' | 'SUCCESS' | 'FAILED';
    };
    createdAt: Date;
}

const OCRResultSchema: Schema = new Schema(
    {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
        analysis: { type: String, default: '' },
        metadata: {
            title: { type: String, default: '' },
            description: { type: String, default: '' },
            thumbnail: { type: String, default: '' },
        },
        timing: {
            startTime: { type: Date, required: true },
            endTime: { type: Date },
            duration: { type: Number },
        },
        status: {
            upload: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
            visualProcessing: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
            rag: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED'], default: 'SKIPPED' },
            overall: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
        },
    },
    { timestamps: true }
);

export const OCRResult = mongoose.model<IOCRResult>('OCRResult', OCRResultSchema);
