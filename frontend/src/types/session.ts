import type { Question } from './question';

export interface Session {
    id: string;
    user_id?: string;
    questions: Question[];
    answers: Record<string, string>;
    started_at: string;
    completed_at?: string;
    current_index: number;
}

export interface SessionState {
    currentSession: Session | null;
    isLoading: boolean;
    error: string | null;
}
