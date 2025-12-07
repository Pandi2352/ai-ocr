import api from './axiosInstance';

export interface IdentityResult {
    _id: string;
    docA_Id: string | { _id: string; originalName: string; analysis: string };
    docB_Id: string | { _id: string; originalName: string; analysis: string };
    verificationResult: {
        face_match?: {
            detected: boolean;
            match_confidence: number;
            remarks: string;
        };
        text_match?: {
            name_match: boolean;
            dob_match: boolean;
            id_number_match: boolean;
            consistency_score: number;
        };
        fraud_checks?: {
            visual_authenticity: string;
            tampering_detected: boolean;
            details: string[];
        };
        summary?: string;
        [key: string]: any;
    };
    overallStatus: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' | 'PENDING' | 'FAILED';
    fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
}

export const identityApi = {
    verify: async (docA_Id: string, docB_Id: string) => {
        const response = await api.post('/identity/verify', { docA_Id, docB_Id });
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/identity/history');
        return response.data;
    }
};
