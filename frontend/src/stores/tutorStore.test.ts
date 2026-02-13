/**
 * Tests for Tutor Store.
 *
 * Phase 23: AI Tutor Mode Testing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useTutorStore } from './tutorStore';
import tutorService from '../services/tutorService';
import type { TutorSessionWithMessages, TutorMessage, Hint, LearningInsight } from '../types/tutor';

// Mock the tutor service
vi.mock('../services/tutorService', () => ({
    default: {
        startSession: vi.fn(),
        getSession: vi.fn(),
        endSession: vi.fn(),
        askQuestion: vi.fn(),
        requestHint: vi.fn(),
        requestExplanation: vi.fn(),
        analyzeAnswer: vi.fn(),
        getInsights: vi.fn(),
        getHistory: vi.fn(),
        getDashboardStats: vi.fn(),
    },
}));

// ============================================
// Test Fixtures
// ============================================

const createMockSession = (overrides: Partial<TutorSessionWithMessages> = {}): TutorSessionWithMessages => ({
    id: 'session-1',
    user_id: 'user-1',
    question_id: 'question-1',
    started_at: new Date().toISOString(),
    status: 'active',
    hint_count: 0,
    message_count: 1,
    learning_insights: [],
    created_at: new Date().toISOString(),
    messages: [],
    ...overrides,
});

const createMockMessage = (overrides: Partial<TutorMessage> = {}): TutorMessage => ({
    id: 'msg-1',
    session_id: 'session-1',
    content: 'Test message',
    role: 'tutor',
    message_type: 'guidance',
    metadata: {},
    created_at: new Date().toISOString(),
    ...overrides,
});

const createMockHint = (overrides: Partial<Hint> = {}): Hint => ({
    id: 'hint-1',
    level: 1,
    content: 'Test hint content',
    focuses_on: ['test'],
    created_at: new Date().toISOString(),
    ...overrides,
});

const createMockInsight = (overrides: Partial<LearningInsight> = {}): LearningInsight => ({
    id: 'insight-1',
    user_id: 'user-1',
    insight_type: 'strength',
    topic: 'Test topic',
    description: 'Test description',
    first_identified: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    occurrence_count: 1,
    resolved: false,
    ...overrides,
});

// ============================================
// TutorStore Tests
// ============================================

describe('TutorStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useTutorStore.setState({
            activeSession: null,
            messages: [],
            isLoading: false,
            error: null,
            currentHint: null,
            hintCount: 0,
            maxHints: 3,
            insights: [],
            insightsLoading: false,
            sessionHistory: [],
            historyLoading: false,
            dashboardStats: null,
            dashboardLoading: false,
            isPanelOpen: false,
            isTyping: false,
        });
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    // ============================================
    // Session Actions
    // ============================================

    describe('startSession', () => {
        it('starts a new session successfully', async () => {
            const mockSession = createMockSession();
            vi.mocked(tutorService.startSession).mockResolvedValue(mockSession);

            await act(async () => {
                await useTutorStore.getState().startSession('question-1');
            });

            const state = useTutorStore.getState();
            expect(state.activeSession).toEqual(mockSession);
            expect(state.isLoading).toBe(false);
            expect(state.isPanelOpen).toBe(true);
            expect(tutorService.startSession).toHaveBeenCalledWith({
                question_id: 'question-1',
                session_id: undefined,
            });
        });

        it('starts a session with practice session ID', async () => {
            const mockSession = createMockSession();
            vi.mocked(tutorService.startSession).mockResolvedValue(mockSession);

            await act(async () => {
                await useTutorStore.getState().startSession('question-1', 'practice-1');
            });

            expect(tutorService.startSession).toHaveBeenCalledWith({
                question_id: 'question-1',
                session_id: 'practice-1',
            });
        });

        it('handles start session error', async () => {
            vi.mocked(tutorService.startSession).mockRejectedValue(new Error('Failed to start'));

            await act(async () => {
                try {
                    await useTutorStore.getState().startSession('question-1');
                } catch (e) {
                    // Expected
                }
            });

            const state = useTutorStore.getState();
            expect(state.error).toBe('Failed to start');
            expect(state.isLoading).toBe(false);
        });
    });

    describe('getSession', () => {
        it('gets an existing session', async () => {
            const mockSession = createMockSession({ id: 'session-2' });
            vi.mocked(tutorService.getSession).mockResolvedValue(mockSession);

            await act(async () => {
                await useTutorStore.getState().getSession('session-2');
            });

            const state = useTutorStore.getState();
            expect(state.activeSession).toEqual(mockSession);
            expect(state.isLoading).toBe(false);
        });

        it('handles get session error', async () => {
            vi.mocked(tutorService.getSession).mockRejectedValue(new Error('Not found'));

            await act(async () => {
                try {
                    await useTutorStore.getState().getSession('invalid-id');
                } catch (e) {
                    // Expected
                }
            });

            const state = useTutorStore.getState();
            expect(state.error).toBe('Not found');
        });
    });

    describe('endSession', () => {
        it('ends the current session', async () => {
            const mockSession = createMockSession();
            useTutorStore.setState({ activeSession: mockSession });

            vi.mocked(tutorService.endSession).mockResolvedValue({
                summary: {
                    id: 'session-1',
                    question_id: 'question-1',
                    started_at: new Date().toISOString(),
                    ended_at: new Date().toISOString(),
                    duration_seconds: 300,
                    hint_count: 1,
                    message_count: 5,
                    insights_generated: 2,
                    key_learnings: ['Test learning'],
                },
                insights: [createMockInsight()],
            });

            await act(async () => {
                await useTutorStore.getState().endSession('B');
            });

            const state = useTutorStore.getState();
            expect(state.activeSession).toBeNull();
            expect(state.messages).toEqual([]);
            expect(state.hintCount).toBe(0);
            expect(state.insights).toHaveLength(1);
        });

        it('does nothing if no active session', async () => {
            await act(async () => {
                await useTutorStore.getState().endSession();
            });

            expect(tutorService.endSession).not.toHaveBeenCalled();
        });
    });

    describe('resetSession', () => {
        it('resets session state', () => {
            useTutorStore.setState({
                activeSession: createMockSession(),
                messages: [createMockMessage()],
                hintCount: 2,
                error: 'Some error',
                isPanelOpen: true,
            });

            act(() => {
                useTutorStore.getState().resetSession();
            });

            const state = useTutorStore.getState();
            expect(state.activeSession).toBeNull();
            expect(state.messages).toEqual([]);
            expect(state.hintCount).toBe(0);
            expect(state.error).toBeNull();
            expect(state.isPanelOpen).toBe(false);
        });
    });

    // ============================================
    // Message Actions
    // ============================================

    describe('addMessage', () => {
        it('adds a message to the list', () => {
            const message = createMockMessage();

            act(() => {
                useTutorStore.getState().addMessage(message);
            });

            const state = useTutorStore.getState();
            expect(state.messages).toHaveLength(1);
            expect(state.messages[0]).toEqual(message);
        });

        it('appends messages to existing list', () => {
            const existingMessage = createMockMessage({ id: 'msg-0' });
            useTutorStore.setState({ messages: [existingMessage] });

            const newMessage = createMockMessage({ id: 'msg-1' });

            act(() => {
                useTutorStore.getState().addMessage(newMessage);
            });

            const state = useTutorStore.getState();
            expect(state.messages).toHaveLength(2);
        });
    });

    describe('askQuestion', () => {
        it('asks a question and adds response', async () => {
            const mockSession = createMockSession();
            useTutorStore.setState({ activeSession: mockSession });

            const responseMessage = createMockMessage({
                id: 'response-1',
                role: 'tutor',
                content: 'Tutor response',
            });

            vi.mocked(tutorService.askQuestion).mockResolvedValue({
                message: responseMessage,
                suggested_actions: [],
            });

            await act(async () => {
                await useTutorStore.getState().askQuestion('Test question?');
            });

            const state = useTutorStore.getState();
            expect(state.messages).toHaveLength(2); // User message + tutor response
            expect(state.isTyping).toBe(false);
        });

        it('does nothing if no active session', async () => {
            await act(async () => {
                await useTutorStore.getState().askQuestion('Test?');
            });

            expect(tutorService.askQuestion).not.toHaveBeenCalled();
        });
    });

    // ============================================
    // Hint Actions
    // ============================================

    describe('requestHint', () => {
        it('requests a hint successfully', async () => {
            const mockSession = createMockSession();
            useTutorStore.setState({ activeSession: mockSession });

            const mockHint = createMockHint();
            vi.mocked(tutorService.requestHint).mockResolvedValue({
                hint: mockHint,
                hint_count: 1,
                max_hints: 3,
            });

            await act(async () => {
                await useTutorStore.getState().requestHint();
            });

            const state = useTutorStore.getState();
            expect(state.currentHint).toEqual(mockHint);
            expect(state.hintCount).toBe(1);
        });

        it('does not request hint when max reached', async () => {
            const mockSession = createMockSession();
            useTutorStore.setState({
                activeSession: mockSession,
                hintCount: 3,
                maxHints: 3,
            });

            await act(async () => {
                await useTutorStore.getState().requestHint();
            });

            expect(tutorService.requestHint).not.toHaveBeenCalled();
            const state = useTutorStore.getState();
            expect(state.error).toBe('Maximum hints reached for this question');
        });
    });

    describe('clearHint', () => {
        it('clears the current hint', () => {
            useTutorStore.setState({ currentHint: createMockHint() });

            act(() => {
                useTutorStore.getState().clearHint();
            });

            expect(useTutorStore.getState().currentHint).toBeNull();
        });
    });

    // ============================================
    // Panel Actions
    // ============================================

    describe('togglePanel', () => {
        it('toggles panel open state', () => {
            expect(useTutorStore.getState().isPanelOpen).toBe(false);

            act(() => {
                useTutorStore.getState().togglePanel();
            });

            expect(useTutorStore.getState().isPanelOpen).toBe(true);

            act(() => {
                useTutorStore.getState().togglePanel();
            });

            expect(useTutorStore.getState().isPanelOpen).toBe(false);
        });
    });

    describe('setPanelOpen', () => {
        it('sets panel open state', () => {
            act(() => {
                useTutorStore.getState().setPanelOpen(true);
            });

            expect(useTutorStore.getState().isPanelOpen).toBe(true);

            act(() => {
                useTutorStore.getState().setPanelOpen(false);
            });

            expect(useTutorStore.getState().isPanelOpen).toBe(false);
        });
    });

    describe('setTyping', () => {
        it('sets typing state', () => {
            act(() => {
                useTutorStore.getState().setTyping(true);
            });

            expect(useTutorStore.getState().isTyping).toBe(true);
        });
    });

    // ============================================
    // Error Handling
    // ============================================

    describe('setError', () => {
        it('sets an error', () => {
            act(() => {
                useTutorStore.getState().setError('Test error');
            });

            expect(useTutorStore.getState().error).toBe('Test error');
        });
    });

    describe('clearError', () => {
        it('clears the error', () => {
            useTutorStore.setState({ error: 'Test error' });

            act(() => {
                useTutorStore.getState().clearError();
            });

            expect(useTutorStore.getState().error).toBeNull();
        });
    });

    // ============================================
    // Insights Actions
    // ============================================

    describe('fetchInsights', () => {
        it('fetches insights successfully', async () => {
            const mockInsights = [createMockInsight()];
            vi.mocked(tutorService.getInsights).mockResolvedValue({
                insights: mockInsights,
                total_count: 1,
                by_type: { strength: 1 },
            });

            await act(async () => {
                await useTutorStore.getState().fetchInsights();
            });

            const state = useTutorStore.getState();
            expect(state.insights).toEqual(mockInsights);
            expect(state.insightsLoading).toBe(false);
        });

        it('filters insights by type', async () => {
            vi.mocked(tutorService.getInsights).mockResolvedValue({
                insights: [],
                total_count: 0,
                by_type: {},
            });

            await act(async () => {
                await useTutorStore.getState().fetchInsights('strength');
            });

            expect(tutorService.getInsights).toHaveBeenCalledWith('strength', undefined);
        });
    });

    // ============================================
    // History Actions
    // ============================================

    describe('fetchHistory', () => {
        it('fetches session history', async () => {
            vi.mocked(tutorService.getHistory).mockResolvedValue({
                sessions: [],
                total_count: 0,
                page: 1,
                page_size: 20,
            });

            await act(async () => {
                await useTutorStore.getState().fetchHistory();
            });

            const state = useTutorStore.getState();
            expect(state.historyLoading).toBe(false);
        });
    });

    // ============================================
    // Dashboard Actions
    // ============================================

    describe('fetchDashboardStats', () => {
        it('fetches dashboard stats', async () => {
            vi.mocked(tutorService.getDashboardStats).mockResolvedValue({
                total_sessions: 10,
                total_hints_used: 25,
                total_messages: 150,
                average_session_duration: 300,
                top_insights: [],
                recent_sessions: [],
            });

            await act(async () => {
                await useTutorStore.getState().fetchDashboardStats();
            });

            const state = useTutorStore.getState();
            expect(state.dashboardStats).not.toBeNull();
            expect(state.dashboardStats?.total_sessions).toBe(10);
            expect(state.dashboardLoading).toBe(false);
        });
    });

    // ============================================
    // Answer Analysis
    // ============================================

    describe('analyzeAnswer', () => {
        it('analyzes correct answer', async () => {
            const mockSession = createMockSession();
            useTutorStore.setState({ activeSession: mockSession });

            vi.mocked(tutorService.analyzeAnswer).mockResolvedValue({
                analysis: {
                    is_correct: true,
                    reasoning_gaps: [],
                    misconceptions: [],
                    suggested_review: [],
                    encouraging_feedback: 'Great job!',
                },
                session_ended: false,
            });

            let result: boolean = false;
            await act(async () => {
                result = await useTutorStore.getState().analyzeAnswer('B');
            });

            expect(result).toBe(true);
        });

        it('analyzes incorrect answer', async () => {
            const mockSession = createMockSession();
            useTutorStore.setState({ activeSession: mockSession });

            vi.mocked(tutorService.analyzeAnswer).mockResolvedValue({
                analysis: {
                    is_correct: false,
                    reasoning_gaps: ['Gap 1'],
                    misconceptions: ['Misconception 1'],
                    suggested_review: ['Topic 1'],
                    encouraging_feedback: 'Keep trying!',
                },
                session_ended: false,
            });

            let result: boolean = true;
            await act(async () => {
                result = await useTutorStore.getState().analyzeAnswer('A');
            });

            expect(result).toBe(false);
        });
    });
});
