import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './sessionStore';
import type { Question } from '../types';

// Reset store before each test
beforeEach(() => {
    useSessionStore.setState({
        currentSession: null,
        isLoading: false,
        timeRemaining: null,
        isTimerRunning: false,
        sessionHistory: [],
    });
});

describe('sessionStore', () => {
    const mockQuestions: Question[] = [
        {
            id: 'q1',
            stem: 'Question 1 stem',
            options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D', E: 'Option E' },
            correct_answer: 'A',
            difficulty: 'easy',
            category: 'Lysosomal Storage Disorders',
            created_at: '2024-01-01T00:00:00Z',
        },
        {
            id: 'q2',
            stem: 'Question 2 stem',
            options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D', E: 'Option E' },
            correct_answer: 'B',
            difficulty: 'medium',
            category: 'Chromosomal Disorders',
            created_at: '2024-01-01T00:00:00Z',
        },
        {
            id: 'q3',
            stem: 'Question 3 stem',
            options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D', E: 'Option E' },
            correct_answer: 'C',
            difficulty: 'hard',
            category: 'Lysosomal Storage Disorders',
            created_at: '2024-01-01T00:00:00Z',
        },
    ];

    describe('startSession', () => {
        it('should create a new session with questions', () => {
            const store = useSessionStore.getState();

            store.startSession(mockQuestions);

            const session = useSessionStore.getState().currentSession;
            expect(session).toBeDefined();
            expect(session?.questions).toEqual(mockQuestions);
            expect(session?.answers).toEqual({});
            expect(session?.current_index).toBe(0);
            expect(session?.started_at).toBeDefined();
        });

        it('should create a timed session when duration is provided', () => {
            const store = useSessionStore.getState();

            store.startSession(mockQuestions, 30); // 30 minutes

            expect(useSessionStore.getState().timeRemaining).toBe(30 * 60); // 1800 seconds
            expect(useSessionStore.getState().isTimerRunning).toBe(true);
        });

        it('should create untimed session when no duration provided', () => {
            const store = useSessionStore.getState();

            store.startSession(mockQuestions);

            expect(useSessionStore.getState().timeRemaining).toBeNull();
            expect(useSessionStore.getState().isTimerRunning).toBe(false);
        });
    });

    describe('submitAnswer', () => {
        it('should record answer for a question', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            store.submitAnswer('q1', 'A');

            expect(useSessionStore.getState().currentSession?.answers['q1']).toBe('A');
        });

        it('should update existing answer', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: { q1: 'A' },
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            store.submitAnswer('q1', 'B');

            expect(useSessionStore.getState().currentSession?.answers['q1']).toBe('B');
        });

        it('should not crash when no session exists', () => {
            const store = useSessionStore.getState();

            expect(() => store.submitAnswer('q1', 'A')).not.toThrow();
            expect(useSessionStore.getState().currentSession).toBeNull();
        });
    });

    describe('nextQuestion', () => {
        it('should move to next question', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            store.nextQuestion();

            expect(useSessionStore.getState().currentSession?.current_index).toBe(1);
        });

        it('should not go beyond last question', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 2, // Last question
                },
            });
            const store = useSessionStore.getState();

            store.nextQuestion();

            expect(useSessionStore.getState().currentSession?.current_index).toBe(2);
        });

        it('should not crash when no session exists', () => {
            const store = useSessionStore.getState();

            expect(() => store.nextQuestion()).not.toThrow();
        });
    });

    describe('previousQuestion', () => {
        it('should move to previous question', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 1,
                },
            });
            const store = useSessionStore.getState();

            store.previousQuestion();

            expect(useSessionStore.getState().currentSession?.current_index).toBe(0);
        });

        it('should not go before first question', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            store.previousQuestion();

            expect(useSessionStore.getState().currentSession?.current_index).toBe(0);
        });
    });

    describe('goToQuestion', () => {
        it('should go to specific question index', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            store.goToQuestion(2);

            expect(useSessionStore.getState().currentSession?.current_index).toBe(2);
        });

        it('should not go to invalid negative index', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 1,
                },
            });
            const store = useSessionStore.getState();

            store.goToQuestion(-1);

            expect(useSessionStore.getState().currentSession?.current_index).toBe(1);
        });

        it('should not go to index beyond questions length', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            store.goToQuestion(10);

            expect(useSessionStore.getState().currentSession?.current_index).toBe(0);
        });
    });

    describe('completeSession', () => {
        it('should calculate correct results for all correct answers', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: { q1: 'A', q2: 'B', q3: 'C' }, // All correct
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            const result = store.completeSession();

            expect(result).toBeDefined();
            expect(result?.totalQuestions).toBe(3);
            expect(result?.correctAnswers).toBe(3);
            expect(result?.incorrectAnswers).toBe(0);
            expect(result?.skippedQuestions).toBe(0);
            expect(result?.accuracy).toBe(100);
        });

        it('should calculate correct results for mixed answers', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: { q1: 'A', q2: 'A' }, // q1 correct, q2 incorrect, q3 skipped
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            const result = store.completeSession();

            expect(result?.correctAnswers).toBe(1);
            expect(result?.incorrectAnswers).toBe(1);
            expect(result?.skippedQuestions).toBe(1);
            expect(result?.accuracy).toBeCloseTo(33.33, 1);
        });

        it('should calculate category statistics', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: { q1: 'A', q2: 'B', q3: 'C' },
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
            });
            const store = useSessionStore.getState();

            const result = store.completeSession();

            expect(result?.categories['Lysosomal Storage Disorders']).toEqual({ correct: 2, total: 2 });
            expect(result?.categories['Chromosomal Disorders']).toEqual({ correct: 1, total: 1 });
        });

        it('should return null when no session exists', () => {
            const store = useSessionStore.getState();

            const result = store.completeSession();

            expect(result).toBeNull();
        });

        it('should add result to session history', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: { q1: 'A' },
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
                sessionHistory: [],
            });
            const store = useSessionStore.getState();

            store.completeSession();

            expect(useSessionStore.getState().sessionHistory.length).toBe(1);
            expect(useSessionStore.getState().sessionHistory[0].sessionId).toBe('test-session');
        });

        it('should stop timer on completion', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: { q1: 'A' },
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
                isTimerRunning: true,
                timeRemaining: 100,
            });
            const store = useSessionStore.getState();

            store.completeSession();

            expect(useSessionStore.getState().isTimerRunning).toBe(false);
        });
    });

    describe('resetSession', () => {
        it('should clear current session', () => {
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
                timeRemaining: 100,
                isTimerRunning: true,
            });
            const store = useSessionStore.getState();

            store.resetSession();

            expect(useSessionStore.getState().currentSession).toBeNull();
            expect(useSessionStore.getState().timeRemaining).toBeNull();
            expect(useSessionStore.getState().isTimerRunning).toBe(false);
        });

        it('should preserve session history on reset', () => {
            const existingHistory = [
                {
                    sessionId: 'old-session',
                    totalQuestions: 5,
                    correctAnswers: 4,
                    incorrectAnswers: 1,
                    skippedQuestions: 0,
                    accuracy: 80,
                    duration: 300,
                    completedAt: '2024-01-01T00:00:00Z',
                    categories: {},
                },
            ];
            useSessionStore.setState({
                currentSession: {
                    id: 'test-session',
                    questions: mockQuestions,
                    answers: {},
                    started_at: new Date().toISOString(),
                    current_index: 0,
                },
                sessionHistory: existingHistory,
            });
            const store = useSessionStore.getState();

            store.resetSession();

            expect(useSessionStore.getState().sessionHistory).toEqual(existingHistory);
        });
    });

    describe('timer actions', () => {
        it('should decrement timer', () => {
            useSessionStore.setState({ timeRemaining: 100, isTimerRunning: true });
            const store = useSessionStore.getState();

            store.decrementTimer();

            expect(useSessionStore.getState().timeRemaining).toBe(99);
        });

        it('should stop timer when reaching zero', () => {
            useSessionStore.setState({ timeRemaining: 1, isTimerRunning: true });
            const store = useSessionStore.getState();

            store.decrementTimer();

            // First decrement from 1 to 0
            expect(useSessionStore.getState().timeRemaining).toBe(0);
            // Timer stops on next decrement call when already at 0
            store.decrementTimer();
            expect(useSessionStore.getState().isTimerRunning).toBe(false);
        });

        it('should not decrement below zero', () => {
            useSessionStore.setState({ timeRemaining: 0, isTimerRunning: false });
            const store = useSessionStore.getState();

            store.decrementTimer();

            expect(useSessionStore.getState().timeRemaining).toBe(0);
        });

        it('should pause timer', () => {
            useSessionStore.setState({ isTimerRunning: true });
            const store = useSessionStore.getState();

            store.pauseTimer();

            expect(useSessionStore.getState().isTimerRunning).toBe(false);
        });

        it('should resume timer when time remaining', () => {
            useSessionStore.setState({ timeRemaining: 100, isTimerRunning: false });
            const store = useSessionStore.getState();

            store.resumeTimer();

            expect(useSessionStore.getState().isTimerRunning).toBe(true);
        });

        it('should not resume timer when no time remaining', () => {
            useSessionStore.setState({ timeRemaining: 0, isTimerRunning: false });
            const store = useSessionStore.getState();

            store.resumeTimer();

            expect(useSessionStore.getState().isTimerRunning).toBe(false);
        });
    });

    describe('computed getters', () => {
        describe('getCurrentQuestion', () => {
            it('should return current question', () => {
                useSessionStore.setState({
                    currentSession: {
                        id: 'test-session',
                        questions: mockQuestions,
                        answers: {},
                        started_at: new Date().toISOString(),
                        current_index: 1,
                    },
                });
                const store = useSessionStore.getState();

                const result = store.getCurrentQuestion();

                expect(result).toEqual(mockQuestions[1]);
            });

            it('should return null when no session', () => {
                const store = useSessionStore.getState();

                const result = store.getCurrentQuestion();

                expect(result).toBeNull();
            });
        });

        describe('getProgress', () => {
            it('should calculate progress correctly', () => {
                useSessionStore.setState({
                    currentSession: {
                        id: 'test-session',
                        questions: mockQuestions,
                        answers: { q1: 'A', q2: 'B' },
                        started_at: new Date().toISOString(),
                        current_index: 0,
                    },
                });
                const store = useSessionStore.getState();

                const result = store.getProgress();

                expect(result.answered).toBe(2);
                expect(result.total).toBe(3);
                expect(result.percentage).toBeCloseTo(66.67, 1);
            });

            it('should return zeros when no session', () => {
                const store = useSessionStore.getState();

                const result = store.getProgress();

                expect(result).toEqual({ answered: 0, total: 0, percentage: 0 });
            });
        });

        describe('isSessionComplete', () => {
            it('should return true when session has completed_at', () => {
                useSessionStore.setState({
                    currentSession: {
                        id: 'test-session',
                        questions: mockQuestions,
                        answers: {},
                        started_at: new Date().toISOString(),
                        current_index: 0,
                        completed_at: new Date().toISOString(),
                    },
                });
                const store = useSessionStore.getState();

                expect(store.isSessionComplete()).toBe(true);
            });

            it('should return false when session not completed', () => {
                useSessionStore.setState({
                    currentSession: {
                        id: 'test-session',
                        questions: mockQuestions,
                        answers: {},
                        started_at: new Date().toISOString(),
                        current_index: 0,
                    },
                });
                const store = useSessionStore.getState();

                expect(store.isSessionComplete()).toBe(false);
            });

            it('should return false when no session', () => {
                const store = useSessionStore.getState();

                expect(store.isSessionComplete()).toBe(false);
            });
        });
    });
});
