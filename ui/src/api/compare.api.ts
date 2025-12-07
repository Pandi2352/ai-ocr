import api from './axiosInstance';

export interface ComparisonResult {
    _id: string;
    sourceOcrId: { _id: string; originalName: string } | string;
    targetOcrId: { _id: string; originalName: string } | string;
    comparisonResult: {
        summary: {
            total_changes: number;
            added: number;
            removed: number;
            modified: number;
            pages_affected: number;
            similarity_score: number;
        };
        changes: Array<{
            page?: number;
            change_type: 'text_modified' | 'text_added' | 'text_removed';
            old_text?: string;
            new_text?: string;
            category: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            confidence: number;
            semantic_change: string;
        }>;
    };
    createdAt: string;
}

export const compareApi = {
    compare: async (sourceId: string, targetId: string) => {
        const response = await api.post('/compare', { sourceId, targetId });
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/compare');
        return response.data;
    }
};
