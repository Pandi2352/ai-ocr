import api from './axiosInstance';

export interface ImageGenResult {
    imageUrl: string;
    prompt: string;
}

export const imageApi = {
    generate: async (ocrId: string) => {
        const response = await api.post('/image/generate', { ocrId });
        return response.data;
    }
};
