import api from './axiosInstance';

export interface FormResultModel {
    _id: string;
    ocrId: string;
    formType: string;
    formData: Record<string, any>;
    meta: {
        missingFields: string[];
    };
    createdAt: string;
}

export const formApi = {
    fill: async (ocrId: string, schema: Record<string, any>, formType: string = 'custom') => {
        const response = await api.post('/forms/fill', { ocrId, schema, formType });
        return response.data;
    }
};
