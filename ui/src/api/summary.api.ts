import api from './axiosInstance';

export const summaryApi = {
    generate: async (ocrId: string, prompt?: string) => {
        const res = await api.post('/summary', { ocrId, prompt });
        return res.data;
    },
    getList: async (page = 1, limit = 10, search = '', order = 'desc') => {
        const res = await api.get('/summary', { params: { page, limit, search, order } });
        return res.data;
    },
    getHistory: async (ocrId: string) => {
        const res = await api.get(`/summary/history/${ocrId}`);
        return res.data;
    }
};
