import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, Question, AnswerKey } from '../types';

interface SessionResult {
    sessionId: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    accuracy: number;
    duration: number; // in seconds
    completedAt: string;
    categories: Record<string, { correct: number; total: number }>;
}

interface SessionStore {
    // Current session state
    currentSession: Session | null;
    isLoading: boolean;
    timeRemaining: number | null; // seconds remaining for timed sessions
    isTimerRunning: boolean;

    // Session history
    sessionHistory: SessionResult[];

    // Current session actions
    startSession: (questions: Question[], timedDuration?: number) => void;
    submitAnswer: (questionId: string, answer: AnswerKey) => void;
    nextQuestion: () => void;
    previousQuestion: () => void;
    goToQuestion: (index: number) => void;
    completeSession: () => SessionResult | null;
    resetSession: () => void;

    // Timer actions
    decrementTimer: () => void;
    pauseTimer: () => void;
    resumeTimer: () => void;

    // Computed getters
    getCurrentQuestion: () => Question | null;
    getProgress: () => { answered: number; total: number; percentage: number };
    getSessionResult: () => SessionResult | null;
    isSessionComplete: () => boolean;
}

export const useSessionStore = create<SessionStore>()(
    persist(
        (set, get) => ({
            // Initial state
            currentSession: null,
            isLoading: false,
            timeRemaining: null,
            isTimerRunning: false,
            sessionHistory: [],

            // Start a new session
            startSession: (questions, timedDuration) => set({
                currentSession: {
                    id: crypto.randomUUID(),
                    questions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
                timeRemaining: timedDuration ? timedDuration * 60 : null, // convert minutes to seconds
                isTimerRunning: !!timedDuration,
            }),

            // Submit an answer for the current question
            submitAnswer: (questionId, answer) => set((state) => ({
                currentSession: state.currentSession
                    ? {
                        ...state.currentSession,
                        answers: { ...state.currentSession.answers, [questionId]: answer },
                    }
                    : null,
            })),

            // Move to next question
            nextQuestion: () => set((state) => {
                if (!state.currentSession) return state;
                const nextIndex = state.currentSession.current_index + 1;
                if (nextIndex >= state.currentSession.questions.length) return state;
                return {
                    currentSession: {
                        ...state.currentSession,
                        current_index: nextIndex,
                    },
                };
            }),

            // Move to previous question
            previousQuestion: () => set((state) => {
                if (!state.currentSession) return state;
                const prevIndex = state.currentSession.current_index - 1;
                if (prevIndex < 0) return state;
                return {
                    currentSession: {
                        ...state.currentSession,
                        current_index: prevIndex,
                    },
                };
            }),

            // Go to specific question by index
            goToQuestion: (index) => set((state) => {
                if (!state.currentSession) return state;
                if (index < 0 || index >= state.currentSession.questions.length) return state;
                return {
                    currentSession: {
                        ...state.currentSession,
                        current_index: index,
                    },
                };
            }),

            // Complete the session and calculate results
            completeSession: () => {
                const state = get();
                if (!state.currentSession) return null;

                const session = state.currentSession;
                const completedAt = new Date().toISOString();

                // Calculate results
                let correct = 0;
                let incorrect = 0;
                let skipped = 0;
                const categoryStats: Record<string, { correct: number; total: number }> = {};

                session.questions.forEach((question) => {
                    const userAnswer = session.answers[question.id];
                    const category = question.category;

                    // Initialize category stats
                    if (!categoryStats[category]) {
                        categoryStats[category] = { correct: 0, total: 0 };
                    }
                    categoryStats[category].total++;

                    if (!userAnswer) {
                        skipped++;
                    } else if (userAnswer === question.correct_answer) {
                        correct++;
                        categoryStats[category].correct++;
                    } else {
                        incorrect++;
                    }
                });

                // Calculate duration
                const startedAt = new Date(session.started_at).getTime();
                const endedAt = new Date(completedAt).getTime();
                const duration = Math.floor((endedAt - startedAt) / 1000);

                const result: SessionResult = {
                    sessionId: session.id,
                    totalQuestions: session.questions.length,
                    correctAnswers: correct,
                    incorrectAnswers: incorrect,
                    skippedQuestions: skipped,
                    accuracy: session.questions.length > 0
                        ? (correct / session.questions.length) * 100
                        : 0,
                    duration,
                    completedAt,
                    categories: categoryStats,
                };

                // Update state
                set((state) => ({
                    currentSession: state.currentSession
                        ? { ...state.currentSession, completed_at: completedAt }
                        : null,
                    isTimerRunning: false,
                    sessionHistory: [...state.sessionHistory, result],
                }));

                return result;
            },

            // Reset/clear current session
            resetSession: () => set({
                currentSession: null,
                timeRemaining: null,
                isTimerRunning: false,
            }),

            // Timer actions
            decrementTimer: () => set((state) => {
                if (!state.timeRemaining || state.timeRemaining <= 0) {
                    return { timeRemaining: 0, isTimerRunning: false };
                }
                return { timeRemaining: state.timeRemaining - 1 };
            }),

            pauseTimer: () => set({ isTimerRunning: false }),

            resumeTimer: () => set((state) => ({
                isTimerRunning: state.timeRemaining !== null && state.timeRemaining > 0,
            })),

            // Computed getters
            getCurrentQuestion: () => {
                const state = get();
                if (!state.currentSession) return null;
                return state.currentSession.questions[state.currentSession.current_index] || null;
            },

            getProgress: () => {
                const state = get();
                if (!state.currentSession) {
                    return { answered: 0, total: 0, percentage: 0 };
                }
                const answered = Object.keys(state.currentSession.answers).length;
                const total = state.currentSession.questions.length;
                return {
                    answered,
                    total,
                    percentage: total > 0 ? (answered / total) * 100 : 0,
                };
            },

            getSessionResult: () => {
                const state = get();
                if (!state.currentSession || !state.currentSession.completed_at) return null;
                return state.sessionHistory.find(
                    (r) => r.sessionId === state.currentSession?.id
                ) || null;
            },

            isSessionComplete: () => {
                const state = get();
                return state.currentSession?.completed_at !== undefined;
            },
        }),
        {
            name: 'session-storage',
            partialize: (state) => ({
                sessionHistory: state.sessionHistory,
            }),
        }
    )
);
