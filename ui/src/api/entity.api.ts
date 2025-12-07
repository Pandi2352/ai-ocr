import api from './axiosInstance';

export const entityApi = {
    extract: async (ocrId: string, fields?: any) => {
        const res = await api.post('/entities', { ocrId, fields });
        return res.data;
    },
    getList: async (page = 1, limit = 10, search = '', order = 'desc') => {
        const res = await api.get('/entities', { params: { page, limit, search, order } });
        return res.data;
    },
    getHistory: async (ocrId: string) => {
        const res = await api.get(`/entities/history/${ocrId}`);
        return res.data;
    }
};
