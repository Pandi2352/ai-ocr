import api from './axiosInstance';

export interface OCRResult {
    _id: string;
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
    mindmap: string;
    entityResult: Record<string, any>;
    summary: string;
    timing: {
        startTime: string;
        endTime?: string;
        duration?: number;
    };
    status: {
        upload: 'PENDING' | 'SUCCESS' | 'FAILED';
        visualProcessing: 'PENDING' | 'SUCCESS' | 'FAILED';
        enrichment: 'PENDING' | 'SUCCESS' | 'FAILED';
        rag: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
        overall: 'PENDING' | 'SUCCESS' | 'FAILED';
    };
    createdAt: string;
}

export const ocrApi = {
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/ocr/analyze', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    getList: async (page = 1, limit = 10, search = '', order: 'asc' | 'desc' = 'desc') => {
        const response = await api.get('/ocr/list', {
            params: { page, limit, search, order },
        });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/ocr/status/${id}`);
        return response.data;
    },
};
