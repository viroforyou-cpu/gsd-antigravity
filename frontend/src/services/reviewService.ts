import api from './api';

export interface SpacedRepetitionData {
    id: string;
    user_id: string;
    question_id: string;
    ease_factor: number;
    interval_days: number;
    repetitions: number;
    next_review_date: string;
    last_review_date: string | null;
    total_reviews: number;
    total_correct: number;
    created_at: string;
    updated_at: string;
}

export interface ReviewQuestion {
    question_id: string;
    stem: string;
    options: Record<string, string>;
    category: string;
    difficulty: string;
    srs_data: SpacedRepetitionData | null;
    is_overdue: boolean;
    days_overdue: number;
}

export interface ReviewQueue {
    due_today: number;
    overdue: number;
    upcoming_week: number;
    questions: ReviewQuestion[];
}

export interface ReviewSubmit {
    question_id: string;
    quality: number; // 0-5
    time_spent_seconds?: number;
    user_answer?: string;
    is_correct?: boolean;
}

export interface ReviewResult {
    question_id: string;
    previous_interval: number;
    new_interval: number;
    previous_ease: number;
    new_ease: number;
    next_review_date: string;
    is_correct: boolean;
    message: string;
}

export interface SRSStats {
    total_cards: number;
    cards_due_today: number;
    cards_overdue: number;
    cards_upcoming_week: number;
    average_ease: number;
    average_interval: number;
    retention_rate: number;
    total_reviews: number;
    reviews_today: number;
    forecast: Array<{ date: string; count: number }>;
}

export interface PreviewResult {
    quality: number;
    previous_interval: number;
    new_interval: number;
    previous_ease: number;
    new_ease: number;
    next_review_date: string;
    repetitions: number;
}

/**
 * Quality constants for review ratings
 */
export const ReviewQuality = {
    COMPLETE_FAILURE: 0,      // Complete failure / did not attempt
    INCORRECT_NO_IDEA: 1,     // Incorrect answer, no idea
    INCORRECT_CLOSE: 2,       // Incorrect answer, but close
    CORRECT_LOW_CONFIDENCE: 3, // Correct answer, low confidence or took hints
    CORRECT_HESITANT: 4,      // Correct answer, some hesitation
    CORRECT_PERFECT: 5,       // Correct answer, high confidence, quick response
} as const;

export const reviewService = {
    /**
     * Get questions due for review today
     */
    async getDueReviews(limit: number = 20): Promise<ReviewQueue> {
        const response = await api.get<ReviewQueue>('/review/due', {
            params: { limit },
        });
        return response.data;
    },

    /**
     * Get upcoming review schedule
     */
    async getUpcomingReviews(days: number = 14): Promise<Array<{ date: string; count: number }>> {
        const response = await api.get<Array<{ date: string; count: number }>>('/review/upcoming', {
            params: { days },
        });
        return response.data;
    },

    /**
     * Submit a review result
     */
    async submitReview(review: ReviewSubmit): Promise<ReviewResult> {
        const response = await api.post<ReviewResult>('/review/submit', review);
        return response.data;
    },

    /**
     * Get SRS statistics
     */
    async getStats(): Promise<SRSStats> {
        const response = await api.get<SRSStats>('/review/stats');
        return response.data;
    },

    /**
     * Preview what the next interval would be for a given quality rating
     */
    async previewNextInterval(
        quality: number,
        easeFactor: number = 2.50,
        currentInterval: number = 0,
        repetitions: number = 0
    ): Promise<PreviewResult> {
        const response = await api.post<PreviewResult>('/review/preview', null, {
            params: {
                quality,
                ease_factor: easeFactor,
                current_interval: currentInterval,
                repetitions,
            },
        });
        return response.data;
    },

    /**
     * Get SRS data for a specific question
     */
    async getQuestionSRS(questionId: string): Promise<SpacedRepetitionData | null> {
        const response = await api.get<SpacedRepetitionData | null>(`/review/question/${questionId}`);
        return response.data;
    },

    /**
     * Initialize SRS data for a new question
     */
    async initializeQuestionSRS(questionId: string): Promise<SpacedRepetitionData> {
        const response = await api.post<SpacedRepetitionData>(`/review/initialize/${questionId}`);
        return response.data;
    },
};

export default reviewService;
