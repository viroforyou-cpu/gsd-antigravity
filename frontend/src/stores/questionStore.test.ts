import { describe, it, expect, beforeEach } from 'vitest';
import { useQuestionStore } from './questionStore';
import type { Question, QuestionCategory, QuestionDifficulty } from '../types';

// Reset store before each test
beforeEach(() => {
    useQuestionStore.setState({
        questions: [],
        currentQuestion: null,
        isLoading: false,
        error: null,
        selectedCategories: [],
        selectedDifficulty: [],
    });
});

describe('questionStore', () => {
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

    describe('loadQuestions', () => {
        it('should load questions successfully', async () => {
            const store = useQuestionStore.getState();

            await store.loadQuestions();

            expect(useQuestionStore.getState().isLoading).toBe(false);
            expect(useQuestionStore.getState().error).toBeNull();
            // Mock questions are loaded from the mock file
            expect(useQuestionStore.getState().questions.length).toBeGreaterThan(0);
        });
    });

    describe('getQuestionById', () => {
        it('should return question when found', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getQuestionById('q2');

            expect(result).toBeDefined();
            expect(result?.id).toBe('q2');
            expect(result?.stem).toBe('Question 2 stem');
        });

        it('should return undefined when question not found', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getQuestionById('nonexistent');

            expect(result).toBeUndefined();
        });
    });

    describe('setCurrentQuestion', () => {
        it('should set current question', () => {
            const store = useQuestionStore.getState();

            store.setCurrentQuestion(mockQuestions[0]);

            expect(useQuestionStore.getState().currentQuestion).toEqual(mockQuestions[0]);
        });

        it('should clear current question when set to null', () => {
            useQuestionStore.setState({ currentQuestion: mockQuestions[0] });
            const store = useQuestionStore.getState();

            store.setCurrentQuestion(null);

            expect(useQuestionStore.getState().currentQuestion).toBeNull();
        });
    });

    describe('setSelectedCategories', () => {
        it('should set selected categories', () => {
            const store = useQuestionStore.getState();
            const categories: QuestionCategory[] = ['Lysosomal Storage Disorders', 'Chromosomal Disorders'];

            store.setSelectedCategories(categories);

            expect(useQuestionStore.getState().selectedCategories).toEqual(categories);
        });

        it('should clear categories when set to empty array', () => {
            useQuestionStore.setState({ selectedCategories: ['Lysosomal Storage Disorders'] });
            const store = useQuestionStore.getState();

            store.setSelectedCategories([]);

            expect(useQuestionStore.getState().selectedCategories).toEqual([]);
        });
    });

    describe('setSelectedDifficulty', () => {
        it('should set selected difficulty levels', () => {
            const store = useQuestionStore.getState();
            const difficulties: QuestionDifficulty[] = ['easy', 'medium'];

            store.setSelectedDifficulty(difficulties);

            expect(useQuestionStore.getState().selectedDifficulty).toEqual(difficulties);
        });
    });

    describe('getRandomQuestion', () => {
        it('should return a random question from the pool', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getRandomQuestion();

            expect(result).toBeDefined();
            expect(mockQuestions.map(q => q.id)).toContain(result?.id);
        });

        it('should exclude specified question IDs', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getRandomQuestion(['q1', 'q2']);

            expect(result?.id).toBe('q3');
        });

        it('should filter by selected categories', () => {
            useQuestionStore.setState({
                questions: mockQuestions,
                selectedCategories: ['Chromosomal Disorders'],
            });
            const store = useQuestionStore.getState();

            const result = store.getRandomQuestion();

            expect(result?.category).toBe('Chromosomal Disorders');
        });

        it('should filter by selected difficulty', () => {
            useQuestionStore.setState({
                questions: mockQuestions,
                selectedDifficulty: ['hard'],
            });
            const store = useQuestionStore.getState();

            const result = store.getRandomQuestion();

            expect(result?.difficulty).toBe('hard');
        });

        it('should return null when no questions match filters', () => {
            useQuestionStore.setState({
                questions: mockQuestions,
                selectedCategories: ['Muscular Disorders'] as QuestionCategory[],
            });
            const store = useQuestionStore.getState();

            const result = store.getRandomQuestion();

            expect(result).toBeNull();
        });

        it('should return null when all questions are excluded', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getRandomQuestion(['q1', 'q2', 'q3']);

            expect(result).toBeNull();
        });
    });

    describe('getQuestionsForSession', () => {
        it('should return shuffled questions up to requested count', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getQuestionsForSession(2);

            expect(result.length).toBe(2);
        });

        it('should return all questions if count exceeds available', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getQuestionsForSession(10);

            expect(result.length).toBe(3);
        });

        it('should filter by category', () => {
            useQuestionStore.setState({
                questions: mockQuestions,
                selectedCategories: ['Lysosomal Storage Disorders'],
            });
            const store = useQuestionStore.getState();

            const result = store.getQuestionsForSession(10);

            expect(result.length).toBe(2);
            result.forEach(q => {
                expect(q.category).toBe('Lysosomal Storage Disorders');
            });
        });

        it('should filter by difficulty', () => {
            useQuestionStore.setState({
                questions: mockQuestions,
                selectedDifficulty: ['easy', 'medium'],
            });
            const store = useQuestionStore.getState();

            const result = store.getQuestionsForSession(10);

            expect(result.length).toBe(2);
            result.forEach(q => {
                expect(['easy', 'medium']).toContain(q.difficulty);
            });
        });
    });

    describe('getAvailableCategories', () => {
        it('should return unique categories from questions', () => {
            useQuestionStore.setState({ questions: mockQuestions });
            const store = useQuestionStore.getState();

            const result = store.getAvailableCategories();

            expect(result).toContain('Lysosomal Storage Disorders');
            expect(result).toContain('Chromosomal Disorders');
            expect(result.length).toBe(2);
        });

        it('should return empty array when no questions', () => {
            const store = useQuestionStore.getState();

            const result = store.getAvailableCategories();

            expect(result).toEqual([]);
        });
    });
});
