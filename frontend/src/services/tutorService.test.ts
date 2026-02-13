/**
 * Tests for Tutor Service.
 *
 * Phase 23: AI Tutor Mode Testing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorService } from './tutorService';
import api from './api';

// Mock the api module
vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

// ============================================
// Test Fixtures
// ============================================

const mockSessionResponse = {
    id: 'session-1',
    user_id: 'user-1',
    question_id: 'question-1',
    started_at: '2024-01-01T00:00:00Z',
    status: 'active',
    hint_count: 0,
    message_count: 1,
    learning_insights: [],
    created_at: '2024-01-01T00:00:00Z',
    messages: [
        {
            id: 'msg-1',
            session_id: 'session-1',
            content: 'Welcome!',
            role: 'tutor',
            message_type: 'greeting',
            metadata: {},
            created_at: '2024-01-01T00:00:00Z',
        },
    ],
};

const mockHintResponse = {
    hint: {
        id: 'hint-1',
        level: 1,
        content: 'Test hint',
        focuses_on: ['test'],
        created_at: '2024-01-01T00:00:00Z',
    },
    hint_count: 1,
    max_hints: 3,
};

const mockExplanationResponse = {
    explanation: {
        concept: 'Tay-Sachs disease',
        content: 'Explanation content',
        difficulty: 'intermediate',
        related_questions: [],
        visual_aids: [],
        created_at: '2024-01-01T00:00:00Z',
    },
};

const mockAnswerAnalysisResponse = {
    analysis: {
        is_correct: true,
        reasoning_gaps: [],
        misconceptions: [],
        suggested_review: [],
        encouraging_feedback: 'Great job!',
    },
    session_ended: false,
};

const mockTutorResponse = {
    message: {
        id: 'msg-2',
        session_id: 'session-1',
        content: 'Tutor response',
        role: 'tutor',
        message_type: 'guidance',
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
    },
    suggested_actions: [],
};

const mockHistoryResponse = {
    sessions: [
        {
            id: 'session-1',
            question_id: 'question-1',
            question_preview: 'Test question...',
            started_at: '2024-01-01T00:00:00Z',
            ended_at: '2024-01-01T00:05:00Z',
            status: 'completed',
            hint_count: 2,
            message_count: 5,
        },
    ],
    total_count: 1,
    page: 1,
    page_size: 20,
};

const mockInsightsResponse = {
    insights: [
        {
            id: 'insight-1',
            user_id: 'user-1',
            insight_type: 'strength',
            topic: 'Test topic',
            description: 'Test description',
            first_identified: '2024-01-01T00:00:00Z',
            last_updated: '2024-01-01T00:00:00Z',
            occurrence_count: 1,
            resolved: false,
        },
    ],
    total_count: 1,
    by_type: { strength: 1 },
};

const mockDashboardStats = {
    total_sessions: 10,
    total_hints_used: 25,
    total_messages: 150,
    average_session_duration: 300,
    top_insights: [],
    recent_sessions: [],
};

// ============================================
// TutorService Tests
// ============================================

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ============================================
    // Session Management
    // ============================================

    describe('startSession', () => {
        it('starts a new session successfully', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockSessionResponse });

            const result = await tutorService.startSession({
                question_id: 'question-1',
            });

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions', {
                question_id: 'question-1',
            });
            expect(result).toEqual(mockSessionResponse);
        });

        it('starts a session with practice session ID', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockSessionResponse });

            await tutorService.startSession({
                question_id: 'question-1',
                session_id: 'practice-1',
            });

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions', {
                question_id: 'question-1',
                session_id: 'practice-1',
            });
        });

        it('handles start session error', async () => {
            vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

            await expect(tutorService.startSession({ question_id: 'question-1' }))
                .rejects.toThrow('Network error');
        });
    });

    describe('getSession', () => {
        it('gets a session by ID', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockSessionResponse });

            const result = await tutorService.getSession('session-1');

            expect(api.get).toHaveBeenCalledWith('/tutor/sessions/session-1');
            expect(result).toEqual(mockSessionResponse);
        });

        it('handles get session error', async () => {
            vi.mocked(api.get).mockRejectedValue(new Error('Not found'));

            await expect(tutorService.getSession('invalid-id'))
                .rejects.toThrow('Not found');
        });
    });

    describe('endSession', () => {
        it('ends a session without final answer', async () => {
            const endResponse = {
                summary: {
                    id: 'session-1',
                    question_id: 'question-1',
                    started_at: '2024-01-01T00:00:00Z',
                    ended_at: '2024-01-01T00:05:00Z',
                    duration_seconds: 300,
                    hint_count: 2,
                    message_count: 5,
                    insights_generated: 1,
                    key_learnings: ['Learning 1'],
                },
                insights: [],
            };
            vi.mocked(api.post).mockResolvedValue({ data: endResponse });

            const result = await tutorService.endSession('session-1');

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/end', {
                session_id: 'session-1',
                final_answer: undefined,
            });
            expect(result).toEqual(endResponse);
        });

        it('ends a session with final answer', async () => {
            const endResponse = {
                summary: {
                    id: 'session-1',
                    question_id: 'question-1',
                    started_at: '2024-01-01T00:00:00Z',
                    ended_at: '2024-01-01T00:05:00Z',
                    duration_seconds: 300,
                    hint_count: 2,
                    message_count: 5,
                    insights_generated: 1,
                    key_learnings: ['Learning 1'],
                },
                insights: [],
            };
            vi.mocked(api.post).mockResolvedValue({ data: endResponse });

            await tutorService.endSession('session-1', 'B');

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/end', {
                session_id: 'session-1',
                final_answer: 'B',
            });
        });
    });

    // ============================================
    // Hint Operations
    // ============================================

    describe('requestHint', () => {
        it('requests a hint without level', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockHintResponse });

            const result = await tutorService.requestHint('session-1');

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/hint', {
                session_id: 'session-1',
                level: undefined,
            });
            expect(result).toEqual(mockHintResponse);
        });

        it('requests a hint with specific level', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockHintResponse });

            await tutorService.requestHint('session-1', 2);

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/hint', {
                session_id: 'session-1',
                level: 2,
            });
        });
    });

    // ============================================
    // Question/Response Operations
    // ============================================

    describe('askQuestion', () => {
        it('asks a question to the tutor', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockTutorResponse });

            const result = await tutorService.askQuestion('session-1', 'What is Tay-Sachs?');

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/ask', {
                session_id: 'session-1',
                question: 'What is Tay-Sachs?',
            });
            expect(result).toEqual(mockTutorResponse);
        });
    });

    // ============================================
    // Explanation Operations
    // ============================================

    describe('requestExplanation', () => {
        it('requests an explanation without difficulty', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockExplanationResponse });

            const result = await tutorService.requestExplanation('session-1', 'Tay-Sachs disease');

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/explain', {
                session_id: 'session-1',
                concept: 'Tay-Sachs disease',
                difficulty: undefined,
            });
            expect(result).toEqual(mockExplanationResponse);
        });

        it('requests an explanation with difficulty', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockExplanationResponse });

            await tutorService.requestExplanation('session-1', 'Tay-Sachs disease', 'advanced');

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/explain', {
                session_id: 'session-1',
                concept: 'Tay-Sachs disease',
                difficulty: 'advanced',
            });
        });
    });

    // ============================================
    // Answer Analysis
    // ============================================

    describe('analyzeAnswer', () => {
        it('analyzes an answer', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: mockAnswerAnalysisResponse });

            const result = await tutorService.analyzeAnswer('session-1', 'B');

            expect(api.post).toHaveBeenCalledWith('/tutor/sessions/session-1/analyze', {
                session_id: 'session-1',
                answer: 'B',
            });
            expect(result).toEqual(mockAnswerAnalysisResponse);
        });
    });

    // ============================================
    // History Operations
    // ============================================

    describe('getHistory', () => {
        it('gets session history with default params', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockHistoryResponse });

            const result = await tutorService.getHistory();

            expect(api.get).toHaveBeenCalledWith('/tutor/history', {
                params: { limit: 20, offset: 0 },
            });
            expect(result).toEqual(mockHistoryResponse);
        });

        it('gets session history with custom params', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockHistoryResponse });

            await tutorService.getHistory(10, 5);

            expect(api.get).toHaveBeenCalledWith('/tutor/history', {
                params: { limit: 10, offset: 5 },
            });
        });
    });

    // ============================================
    // Insights Operations
    // ============================================

    describe('getInsights', () => {
        it('gets insights without filters', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockInsightsResponse });

            const result = await tutorService.getInsights();

            expect(api.get).toHaveBeenCalledWith('/tutor/insights', {
                params: { limit: 50, resolved: undefined },
            });
            expect(result).toEqual(mockInsightsResponse);
        });

        it('gets insights with type filter', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockInsightsResponse });

            await tutorService.getInsights('strength');

            expect(api.get).toHaveBeenCalledWith('/tutor/insights', {
                params: { insight_type: 'strength', limit: 50, resolved: undefined },
            });
        });

        it('gets insights with resolved filter', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockInsightsResponse });

            await tutorService.getInsights(undefined, true);

            expect(api.get).toHaveBeenCalledWith('/tutor/insights', {
                params: { resolved: true, limit: 50 },
            });
        });

        it('gets insights with both filters', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockInsightsResponse });

            await tutorService.getInsights('weakness', false);

            expect(api.get).toHaveBeenCalledWith('/tutor/insights', {
                params: { insight_type: 'weakness', resolved: false, limit: 50 },
            });
        });
    });

    // ============================================
    // Dashboard Operations
    // ============================================

    describe('getDashboardStats', () => {
        it('gets dashboard statistics', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockDashboardStats });

            const result = await tutorService.getDashboardStats();

            expect(api.get).toHaveBeenCalledWith('/tutor/dashboard');
            expect(result).toEqual(mockDashboardStats);
        });
    });

    // ============================================
    // Status Operations
    // ============================================

    describe('getStatus', () => {
        it('gets tutor status', async () => {
            const mockStatus = {
                available: true,
                model: 'gpt-4',
                features: ['hints', 'explanations', 'socratic'],
            };
            vi.mocked(api.get).mockResolvedValue({ data: mockStatus });

            const result = await tutorService.getStatus();

            expect(api.get).toHaveBeenCalledWith('/tutor/status');
            expect(result).toEqual(mockStatus);
        });
    });
});
