import api from './api';

export interface CategoryProgress {
    category: string;
    total_questions: number;
    correct_answers: number;
    accuracy: number;
    last_practiced: string | null;
}

export interface DashboardStats {
    total_sessions: number;
    total_questions: number;
    total_correct: number;
    overall_accuracy: number;
    total_time_minutes: number;
    streak_days: number;
}

export interface Improvement {
    week_over_week: number;
    trend: string;
}

export interface RecentSession {
    id: string;
    date: string;
    questions: number;
    correct: number;
    category?: string;
}

export interface DashboardData {
    total_sessions: number;
    total_questions: number;
    total_correct: number;
    overall_accuracy: number;
    total_time_minutes: number;
    streak_days: number;
    recent_sessions: RecentSession[];
    improvement: Improvement;
}

export interface HistoryEntry {
    date: string;
    sessions: number;
    questions: number;
    correct: number;
    accuracy: number;
}

export const progressService = {
    /**
     * Get user dashboard data
     */
    async getDashboard(userId?: string): Promise<DashboardData> {
        const response = await api.get<DashboardData>('/progress/dashboard', {
            params: { user_id: userId },
        });
        return response.data;
    },

    /**
     * Get progress breakdown by category
     */
    async getCategoryProgress(userId?: string): Promise<CategoryProgress[]> {
        const response = await api.get<CategoryProgress[]>('/progress/categories', {
            params: { user_id: userId },
        });
        return response.data;
    },

    /**
     * Get historical performance data
     */
    async getHistory(userId?: string, days: number = 30): Promise<HistoryEntry[]> {
        const response = await api.get<HistoryEntry[]>('/progress/history', {
            params: { user_id: userId, days },
        });
        return response.data;
    },
};

export default progressService;
