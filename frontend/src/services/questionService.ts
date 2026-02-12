import api from './api';
import type { Question } from '../types/question';

export interface QuestionQueryParams {
    category?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
}

export const questionService = {
    /**
     * Get all questions with optional filtering
     */
    async getQuestions(params?: QuestionQueryParams): Promise<Question[]> {
        const response = await api.get<Question[]>('/questions', { params });
        return response.data;
    },

    /**
     * Get a single question by ID
     */
    async getQuestion(id: string): Promise<Question> {
        const response = await api.get<Question>(`/questions/${id}`);
        return response.data;
    },

    /**
     * Get a random question for practice
     */
    async getRandomQuestion(category?: string, difficulty?: string): Promise<Question> {
        const response = await api.get<Question>('/questions/random', {
            params: { category, difficulty },
        });
        return response.data;
    },

    /**
     * Get all available categories
     */
    async getCategories(): Promise<string[]> {
        const response = await api.get<string[]>('/questions/categories');
        return response.data;
    },
};

export default questionService;
