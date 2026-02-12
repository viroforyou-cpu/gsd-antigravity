import { create } from 'zustand';
import type { Question, QuestionCategory, QuestionDifficulty } from '../types';
import { mockQuestions } from '../mock/questions';

interface QuestionStore {
    // State
    questions: Question[];
    currentQuestion: Question | null;
    isLoading: boolean;
    error: string | null;
    selectedCategories: QuestionCategory[];
    selectedDifficulty: QuestionDifficulty[];

    // Actions
    loadQuestions: () => Promise<void>;
    getRandomQuestion: (excludeIds?: string[]) => Question | null;
    getQuestionById: (id: string) => Question | undefined;
    setCurrentQuestion: (question: Question | null) => void;
    setSelectedCategories: (categories: QuestionCategory[]) => void;
    setSelectedDifficulty: (difficulty: QuestionDifficulty[]) => void;
    getQuestionsForSession: (count: number) => Question[];
    getAvailableCategories: () => QuestionCategory[];
}

export const useQuestionStore = create<QuestionStore>((set, get) => ({
    // Initial state
    questions: [],
    currentQuestion: null,
    isLoading: false,
    error: null,
    selectedCategories: [],
    selectedDifficulty: [],

    // Load questions (simulated async operation)
    loadQuestions: async () => {
        set({ isLoading: true, error: null });
        try {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 300));
            set({ questions: mockQuestions, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load questions', isLoading: false });
        }
    },

    // Get a random question, optionally excluding certain IDs
    getRandomQuestion: (excludeIds = []) => {
        const { questions, selectedCategories, selectedDifficulty } = get();

        let filtered = questions.filter((q) => !excludeIds.includes(q.id));

        // Apply category filter
        if (selectedCategories.length > 0) {
            filtered = filtered.filter((q) =>
                selectedCategories.includes(q.category as QuestionCategory)
            );
        }

        // Apply difficulty filter
        if (selectedDifficulty.length > 0) {
            filtered = filtered.filter((q) =>
                selectedDifficulty.includes(q.difficulty)
            );
        }

        if (filtered.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * filtered.length);
        return filtered[randomIndex];
    },

    // Get question by ID
    getQuestionById: (id) => {
        const { questions } = get();
        return questions.find((q) => q.id === id);
    },

    // Set current question
    setCurrentQuestion: (question) => {
        set({ currentQuestion: question });
    },

    // Set category filter
    setSelectedCategories: (categories) => {
        set({ selectedCategories: categories });
    },

    // Set difficulty filter
    setSelectedDifficulty: (difficulty) => {
        set({ selectedDifficulty: difficulty });
    },

    // Get multiple questions for a practice session
    getQuestionsForSession: (count) => {
        const { questions, selectedCategories, selectedDifficulty } = get();

        let filtered = [...questions];

        // Apply category filter
        if (selectedCategories.length > 0) {
            filtered = filtered.filter((q) =>
                selectedCategories.includes(q.category as QuestionCategory)
            );
        }

        // Apply difficulty filter
        if (selectedDifficulty.length > 0) {
            filtered = filtered.filter((q) =>
                selectedDifficulty.includes(q.difficulty)
            );
        }

        // Shuffle and take requested count
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    // Get list of available categories
    getAvailableCategories: () => {
        const { questions } = get();
        const categories = new Set<QuestionCategory>();
        questions.forEach((q) => categories.add(q.category as QuestionCategory));
        return Array.from(categories);
    },
}));
