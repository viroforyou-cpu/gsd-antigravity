import api from './api';
import type { AnswerKey } from '../types/question';

// Backend session question type (with full question data)
interface SessionQuestion {
    question: {
        id: string;
        stem: string;
        options: Record<string, string>;
        correct_answer: string;
        difficulty: string;
        category: string;
        source_reference?: string;
        explanation?: string;
    };
    order: number;
    user_answer: string | null;
    is_correct: boolean | null;
    time_spent_seconds: number;
}

interface SessionCreateRequest {
    category?: string;
    difficulty?: string;
    question_count: number;
    user_id?: string;
}

interface SessionResponse {
    id: string;
    user_id?: string;
    questions: SessionQuestion[];
    started_at: string;
    completed_at?: string;
    status: string;
    settings: Record<string, unknown>;
    time_spent_seconds: number;
}

interface AnswerSubmitRequest {
    question_id: string;
    answer: string;
    time_spent_seconds?: number;
}

interface AnswerDetail {
    question_id: string;
    user_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    explanation?: string;
}

interface SessionResult {
    id: string;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    answers: AnswerDetail[];
    started_at: string;
    completed_at: string;
}

export const sessionService = {
    /**
     * Create a new practice session
     */
    async createSession(
        category: string = 'all',
        questionCount: number = 5,
        difficulty?: string,
        userId?: string
    ): Promise<SessionResponse> {
        const request: SessionCreateRequest = {
            category: category === 'all' ? undefined : category,
            question_count: questionCount,
            difficulty,
            user_id: userId,
        };
        const response = await api.post<SessionResponse>('/sessions/', request);
        return response.data;
    },

    /**
     * Get session details
     */
    async getSession(sessionId: string): Promise<SessionResponse> {
        const response = await api.get<SessionResponse>(`/sessions/${sessionId}`);
        return response.data;
    },

    /**
     * Submit an answer for a question in the session
     */
    async submitAnswer(
        sessionId: string,
        questionId: string,
        answer: AnswerKey,
        timeSpentSeconds?: number
    ): Promise<SessionResponse> {
        const request: AnswerSubmitRequest = {
            question_id: questionId,
            answer,
            time_spent_seconds: timeSpentSeconds,
        };
        const response = await api.post<SessionResponse>(`/sessions/${sessionId}/answer`, request);
        return response.data;
    },

    /**
     * Complete a session and get results
     */
    async completeSession(sessionId: string): Promise<SessionResult> {
        const response = await api.post<SessionResult>(`/sessions/${sessionId}/complete`);
        return response.data;
    },

    /**
     * Get session review with all answers
     */
    async getSessionReview(sessionId: string): Promise<SessionResult> {
        const response = await api.get<SessionResult>(`/sessions/${sessionId}/review`);
        return response.data;
    },

    /**
     * Get all sessions for a user
     */
    async getUserSessions(userId: string, limit: number = 20, offset: number = 0): Promise<SessionResponse[]> {
        const response = await api.get<SessionResponse[]>(`/sessions/user/${userId}`, {
            params: { limit, offset },
        });
        return response.data;
    },
};

// Export types for use in components
export type {
    SessionQuestion,
    SessionResponse,
    SessionResult,
    AnswerDetail,
};

export default sessionService;
