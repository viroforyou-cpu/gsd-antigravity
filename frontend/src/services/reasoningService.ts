import api from './api';
import type { AllReasoningResult, ReasoningStrategy } from '../types/reasoning';

export const reasoningService = {
    async analyzeQuestion(questionId: string): Promise<AllReasoningResult[]> {
        const response = await api.post<AllReasoningResult[]>(`/reasoning/analyze/${questionId}`);
        return response.data;
    },

    async getReasoningByStrategy(
        questionId: string,
        strategy: ReasoningStrategy
    ): Promise<AllReasoningResult> {
        const response = await api.get<AllReasoningResult>(
            `/reasoning/${strategy}/${questionId}`
        );
        return response.data;
    },
};

export default reasoningService;
