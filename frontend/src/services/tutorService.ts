/**
 * Tutor Service - API client for AI Tutor feature.
 *
 * Phase 22: AI Tutor Mode
 */

import api from './api';
import type {
    TutorSessionCreate,
    TutorSessionWithMessages,
    TutorSessionEndRequest,
    TutorSessionEndResponse,
    HintRequest,
    HintResponse,
    ExplanationRequest,
    ExplanationResponse,
    AnswerAnalysisRequest,
    AnswerAnalysisResponse,
    UserQuestionRequest,
    TutorResponse,
    TutorHistoryResponse,
    LearningInsightsResponse,
    TutorDashboardStats,
    TutorStatus,
    LearningInsight,
} from '../types/tutor';

const BASE_PATH = '/tutor';

/**
 * Tutor Service
 * Provides API methods for AI Tutor functionality
 */
export const tutorService = {
    // ============================================
    // Session Management
    // ============================================

    /**
     * Start a new tutor session for a question
     */
    async startSession(data: TutorSessionCreate): Promise<TutorSessionWithMessages> {
        const response = await api.post(`${BASE_PATH}/sessions`, data);
        return response.data;
    },

    /**
     * Get a tutor session with all messages
     */
    async getSession(sessionId: string): Promise<TutorSessionWithMessages> {
        const response = await api.get(`${BASE_PATH}/sessions/${sessionId}`);
        return response.data;
    },

    /**
     * End a tutor session
     */
    async endSession(sessionId: string, finalAnswer?: string): Promise<TutorSessionEndResponse> {
        const data: TutorSessionEndRequest = {
            session_id: sessionId,
            final_answer: finalAnswer,
        };
        const response = await api.post(`${BASE_PATH}/sessions/${sessionId}/end`, data);
        return response.data;
    },

    // ============================================
    // Hint Operations
    // ============================================

    /**
     * Request a hint for the current question
     */
    async requestHint(sessionId: string, level?: 1 | 2 | 3): Promise<HintResponse> {
        const data: HintRequest = {
            session_id: sessionId,
            level,
        };
        const response = await api.post(`${BASE_PATH}/sessions/${sessionId}/hint`, data);
        return response.data;
    },

    // ============================================
    // Question/Response Operations
    // ============================================

    /**
     * Ask the tutor a question
     */
    async askQuestion(sessionId: string, question: string): Promise<TutorResponse> {
        const data: UserQuestionRequest = {
            session_id: sessionId,
            question,
        };
        const response = await api.post(`${BASE_PATH}/sessions/${sessionId}/ask`, data);
        return response.data;
    },

    // ============================================
    // Explanation Operations
    // ============================================

    /**
     * Request a detailed explanation of a concept
     */
    async requestExplanation(
        sessionId: string,
        concept: string,
        difficulty?: 'basic' | 'intermediate' | 'advanced'
    ): Promise<ExplanationResponse> {
        const data: ExplanationRequest = {
            session_id: sessionId,
            concept,
            difficulty,
        };
        const response = await api.post(`${BASE_PATH}/sessions/${sessionId}/explain`, data);
        return response.data;
    },

    // ============================================
    // Answer Analysis Operations
    // ============================================

    /**
     * Analyze the user's answer
     */
    async analyzeAnswer(sessionId: string, answer: string): Promise<AnswerAnalysisResponse> {
        const data: AnswerAnalysisRequest = {
            session_id: sessionId,
            answer,
        };
        const response = await api.post(`${BASE_PATH}/sessions/${sessionId}/analyze`, data);
        return response.data;
    },

    // ============================================
    // History Operations
    // ============================================

    /**
     * Get tutor session history
     */
    async getHistory(limit = 20, offset = 0): Promise<TutorHistoryResponse> {
        const response = await api.get(`${BASE_PATH}/history`, {
            params: { limit, offset },
        });
        return response.data;
    },

    // ============================================
    // Learning Insights Operations
    // ============================================

    /**
     * Get learning insights for the current user
     */
    async getInsights(
        insightType?: string,
        resolved?: boolean,
        limit = 50
    ): Promise<LearningInsightsResponse> {
        const response = await api.get(`${BASE_PATH}/insights`, {
            params: {
                insight_type: insightType,
                resolved,
                limit,
            },
        });
        return response.data;
    },

    // ============================================
    // Dashboard Operations
    // ============================================

    /**
     * Get tutor dashboard statistics
     */
    async getDashboardStats(): Promise<TutorDashboardStats> {
        const response = await api.get(`${BASE_PATH}/dashboard`);
        return response.data;
    },

    // ============================================
    // Status Operations
    // ============================================

    /**
     * Get tutor service status
     */
    async getStatus(): Promise<TutorStatus> {
        const response = await api.get(`${BASE_PATH}/status`);
        return response.data;
    },
};

export default tutorService;
