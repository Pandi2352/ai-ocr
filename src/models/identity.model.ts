import mongoose, { Schema, Document } from 'mongoose';
import { generateUUID } from '../utils/uuid';

export interface IIdentityResult extends Omit<Document, '_id'> {
    _id: string;
    docA_Id: string;
    docB_Id: string;
    verificationResult: Record<string, any>; // Stores the full 8-part JSON analysis
    overallStatus: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' | 'PENDING' | 'FAILED';
    fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: Date;
    updatedAt: Date;
}

const IdentityResultSchema: Schema = new Schema(
    {
        _id: { type: String, default: generateUUID },
        docA_Id: { type: String, required: true, ref: 'OCRResult' },
        docB_Id: { type: String, required: true, ref: 'OCRResult' },
        verificationResult: { type: Schema.Types.Mixed, default: {} },
        overallStatus: {
            type: String,
            enum: ['APPROVED', 'REJECTED', 'MANUAL_REVIEW', 'PENDING', 'FAILED'],
            default: 'PENDING'
        },
        fraudRisk: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: 'LOW'
        }
    },
    { timestamps: true }
);

export const IdentityResult = mongoose.model<IIdentityResult>('IdentityResult', IdentityResultSchema);
