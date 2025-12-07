import api from './axiosInstance';

export const ragApi = {
    ingest: async (ocrId: string) => {
        const response = await api.post('/rag/ingest', { ocrId });
        return response.data;
    },
    chat: async (question: string, ocrId?: string) => {
        const response = await api.post('/rag/chat', { question, ocrId });
        return response.data;
    },
    search: async (query: string, ocrId?: string) => {
        const response = await api.post('/rag/search', { query, ocrId });
        return response.data;
    }
};
