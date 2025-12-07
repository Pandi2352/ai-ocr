import api from './axiosInstance';

export interface ResumeResult {
    _id: string;
    ocrId: string | { _id: string; originalName: string };
    jobDescription: string;
    overallMatchScore: number;
    parsedProfile: {
        personal_info: {
            name: string;
            email: string;
            phone: string;
            location: string;
            linkedin: string;
        };
        work_experience: Array<{
            company: string;
            title: string;
            duration: string;
            summary: string;
        }>;
        skills: {
            hard_skills: string[];
            soft_skills: string[];
            tools: string[];
        };
        education: Array<{
            degree: string;
            university: string;
            year: string;
        }>;
        projects: Array<{
            name: string;
            tech_stack: string[];
            description: string;
        }>;
        certifications: string[];
    };
    matchResult: {
        overall_match_percentage: number;
        match_status: string;
        skill_breakdown: {
            matched_hard_skills: string[];
            missing_hard_skills: string[];
            matched_soft_skills: string[];
            missing_soft_skills: string[];
        };
        experience_match: {
            required_years: number;
            candidate_years: number;
            status: string;
            gap_analysis: string;
        };
        final_verdict: {
            recommendation: string;
            reasoning: string;
        };
    };
    createdAt: string;
}

export const resumeApi = {
    analyze: async (ocrId: string, job_description: string) => {
        const response = await api.post('/resume/analyze', { ocrId, job_description });
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/resume/history');
        return response.data;
    }
};
