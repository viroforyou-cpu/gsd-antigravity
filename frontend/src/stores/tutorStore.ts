/**
 * Tutor Store - Zustand store for AI Tutor feature.
 *
 * Phase 22: AI Tutor Mode
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import tutorService from '../services/tutorService';
import type {
    TutorSessionWithMessages,
    TutorMessage,
    Hint,
    LearningInsight,
    TutorSessionHistory,
    TutorDashboardStats,
    HintLevel,
    ExplanationDifficulty,
} from '../types/tutor';

interface TutorStore {
    // Session state
    activeSession: TutorSessionWithMessages | null;
    messages: TutorMessage[];
    isLoading: boolean;
    error: string | null;

    // Hint state
    currentHint: Hint | null;
    hintCount: number;
    maxHints: number;

    // Insights state
    insights: LearningInsight[];
    insightsLoading: boolean;

    // History state
    sessionHistory: TutorSessionHistory[];
    historyLoading: boolean;

    // Dashboard state
    dashboardStats: TutorDashboardStats | null;
    dashboardLoading: boolean;

    // Panel state
    isPanelOpen: boolean;
    isTyping: boolean;

    // Session actions
    startSession: (questionId: string, practiceSessionId?: string) => Promise<void>;
    getSession: (sessionId: string) => Promise<void>;
    endSession: (finalAnswer?: string) => Promise<void>;
    resetSession: () => void;

    // Message actions
    addMessage: (message: TutorMessage) => void;
    askQuestion: (question: string) => Promise<void>;

    // Hint actions
    requestHint: (level?: HintLevel) => Promise<void>;
    clearHint: () => void;

    // Explanation actions
    requestExplanation: (concept: string, difficulty?: ExplanationDifficulty) => Promise<void>;

    // Answer analysis actions
    analyzeAnswer: (answer: string) => Promise<boolean>;

    // Insights actions
    fetchInsights: (insightType?: string, resolved?: boolean) => Promise<void>;

    // History actions
    fetchHistory: (limit?: number, offset?: number) => Promise<void>;

    // Dashboard actions
    fetchDashboardStats: () => Promise<void>;

    // Panel actions
    togglePanel: () => void;
    setPanelOpen: (open: boolean) => void;
    setTyping: (typing: boolean) => void;

    // Error handling
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useTutorStore = create<TutorStore>()(
    persist(
        (set, get) => ({
            // Initial state
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

            // Start a new tutor session
            startSession: async (questionId, practiceSessionId) => {
                set({ isLoading: true, error: null });
                try {
                    const session = await tutorService.startSession({
                        question_id: questionId,
                        session_id: practiceSessionId,
                    });
                    set({
                        activeSession: session,
                        messages: session.messages || [],
                        hintCount: session.hint_count,
                        isLoading: false,
                        isPanelOpen: true,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to start tutor session';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            // Get an existing session
            getSession: async (sessionId) => {
                set({ isLoading: true, error: null });
                try {
                    const session = await tutorService.getSession(sessionId);
                    set({
                        activeSession: session,
                        messages: session.messages || [],
                        hintCount: session.hint_count,
                        isLoading: false,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to get session';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            // End the current session
            endSession: async (finalAnswer) => {
                const { activeSession } = get();
                if (!activeSession) return;

                set({ isLoading: true, error: null });
                try {
                    const result = await tutorService.endSession(activeSession.id, finalAnswer);
                    set({
                        activeSession: null,
                        messages: [],
                        currentHint: null,
                        hintCount: 0,
                        insights: result.insights,
                        isLoading: false,
                        isPanelOpen: false,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to end session';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            // Reset session state
            resetSession: () => {
                set({
                    activeSession: null,
                    messages: [],
                    currentHint: null,
                    hintCount: 0,
                    error: null,
                    isPanelOpen: false,
                    isTyping: false,
                });
            },

            // Add a message to the local state
            addMessage: (message) => {
                set((state) => ({
                    messages: [...state.messages, message],
                }));
            },

            // Ask the tutor a question
            askQuestion: async (question) => {
                const { activeSession, addMessage } = get();
                if (!activeSession) return;

                set({ isLoading: true, isTyping: true, error: null });

                // Add user message immediately
                const userMessage: TutorMessage = {
                    id: `temp-${Date.now()}`,
                    session_id: activeSession.id,
                    role: 'user',
                    content: question,
                    message_type: 'question',
                    metadata: {},
                    created_at: new Date().toISOString(),
                };
                addMessage(userMessage);

                try {
                    const response = await tutorService.askQuestion(activeSession.id, question);
                    addMessage(response.message);
                    set({
                        isLoading: false,
                        isTyping: false,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to get response';
                    set({ error: message, isLoading: false, isTyping: false });
                    throw error;
                }
            },

            // Request a hint
            requestHint: async (level) => {
                const { activeSession, hintCount, maxHints } = get();
                if (!activeSession) return;

                if (hintCount >= maxHints) {
                    set({ error: 'Maximum hints reached for this question' });
                    return;
                }

                set({ isLoading: true, error: null });
                try {
                    const response = await tutorService.requestHint(activeSession.id, level);
                    set({
                        currentHint: response.hint,
                        hintCount: response.hint_count,
                        maxHints: response.max_hints,
                        isLoading: false,
                    });

                    // Add hint as a message
                    const hintMessage: TutorMessage = {
                        id: `hint-${Date.now()}`,
                        session_id: activeSession.id,
                        role: 'tutor',
                        content: response.hint.content,
                        message_type: 'hint',
                        metadata: { level: response.hint.level },
                        created_at: new Date().toISOString(),
                    };
                    get().addMessage(hintMessage);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to get hint';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            // Clear current hint
            clearHint: () => {
                set({ currentHint: null });
            },

            // Request an explanation
            requestExplanation: async (concept, difficulty) => {
                const { activeSession, addMessage } = get();
                if (!activeSession) return;

                set({ isLoading: true, isTyping: true, error: null });
                try {
                    const response = await tutorService.requestExplanation(
                        activeSession.id,
                        concept,
                        difficulty
                    );

                    // Add explanation as a message
                    const explanationMessage: TutorMessage = {
                        id: `explanation-${Date.now()}`,
                        session_id: activeSession.id,
                        role: 'tutor',
                        content: response.explanation.content,
                        message_type: 'explanation',
                        metadata: {
                            concept: response.explanation.concept,
                            difficulty: response.explanation.difficulty,
                        },
                        created_at: new Date().toISOString(),
                    };
                    addMessage(explanationMessage);

                    set({ isLoading: false, isTyping: false });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to get explanation';
                    set({ error: message, isLoading: false, isTyping: false });
                    throw error;
                }
            },

            // Analyze an answer
            analyzeAnswer: async (answer) => {
                const { activeSession, addMessage } = get();
                if (!activeSession) return false;

                set({ isLoading: true, error: null });
                try {
                    const response = await tutorService.analyzeAnswer(activeSession.id, answer);

                    // Add feedback as a message
                    const feedbackMessage: TutorMessage = {
                        id: `feedback-${Date.now()}`,
                        session_id: activeSession.id,
                        role: 'tutor',
                        content: response.analysis.encouraging_feedback,
                        message_type: 'feedback',
                        metadata: {
                            is_correct: response.analysis.is_correct,
                            reasoning_gaps: response.analysis.reasoning_gaps,
                            misconceptions: response.analysis.misconceptions,
                        },
                        created_at: new Date().toISOString(),
                    };
                    addMessage(feedbackMessage);

                    set({ isLoading: false });
                    return response.analysis.is_correct;
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to analyze answer';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            // Fetch learning insights
            fetchInsights: async (insightType, resolved) => {
                set({ insightsLoading: true, error: null });
                try {
                    const response = await tutorService.getInsights(insightType, resolved);
                    set({
                        insights: response.insights,
                        insightsLoading: false,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to fetch insights';
                    set({ error: message, insightsLoading: false });
                    throw error;
                }
            },

            // Fetch session history
            fetchHistory: async (limit = 20, offset = 0) => {
                set({ historyLoading: true, error: null });
                try {
                    const response = await tutorService.getHistory(limit, offset);
                    set({
                        sessionHistory: response.sessions,
                        historyLoading: false,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to fetch history';
                    set({ error: message, historyLoading: false });
                    throw error;
                }
            },

            // Fetch dashboard stats
            fetchDashboardStats: async () => {
                set({ dashboardLoading: true, error: null });
                try {
                    const stats = await tutorService.getDashboardStats();
                    set({
                        dashboardStats: stats,
                        dashboardLoading: false,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard';
                    set({ error: message, dashboardLoading: false });
                    throw error;
                }
            },

            // Toggle panel
            togglePanel: () => {
                set((state) => ({ isPanelOpen: !state.isPanelOpen }));
            },

            // Set panel open state
            setPanelOpen: (open) => {
                set({ isPanelOpen: open });
            },

            // Set typing state
            setTyping: (typing) => {
                set({ isTyping: typing });
            },

            // Set error
            setError: (error) => {
                set({ error });
            },

            // Clear error
            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'tutor-storage',
            partialize: (state) => ({
                // Only persist these fields
                isPanelOpen: state.isPanelOpen,
                sessionHistory: state.sessionHistory.slice(0, 10), // Keep last 10 sessions
            }),
        }
    )
);

export default useTutorStore;
