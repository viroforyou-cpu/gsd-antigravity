/**
 * TypeScript types for Study Plans feature.
 * Matches backend Pydantic models in backend/app/models/study_plan.py
 */

// ============================================
// Enums
// ============================================

export type PlanStatus = 'active' | 'paused' | 'completed';

export type TaskType = 'practice_questions' | 'review_bookmarks' | 'review_srs' | 'study_category';

export type TaskStatus = 'pending' | 'completed' | 'skipped';

// ============================================
// Study Plan Settings
// ============================================

export interface StudyPlanSettings {
    daily_question_goal: number;
    categories: string[];
    difficulty_mix: Record<string, number>;
    include_srs_reviews: boolean;
    include_bookmark_reviews: boolean;
    reminder_time?: string;
    study_days: number[]; // 1=Monday, 7=Sunday
}

export const DEFAULT_SETTINGS: StudyPlanSettings = {
    daily_question_goal: 10,
    categories: [],
    difficulty_mix: { easy: 0.2, medium: 0.5, hard: 0.3 },
    include_srs_reviews: true,
    include_bookmark_reviews: true,
    reminder_time: undefined,
    study_days: [1, 2, 3, 4, 5, 6, 7],
};

// ============================================
// Milestone Types
// ============================================

export interface MilestoneCreate {
    title: string;
    description?: string;
    target_date?: string;
    order_index: number;
}

export interface MilestoneUpdate {
    title?: string;
    description?: string;
    target_date?: string;
}

export interface Milestone extends MilestoneCreate {
    id: string;
    plan_id: string;
    completed_at?: string;
    created_at: string;
}

// ============================================
// Daily Task Types
// ============================================

export interface DailyTaskCreate {
    date: string;
    task_type: TaskType;
    target_count?: number;
}

export interface DailyTaskUpdate {
    completed_count?: number;
    status?: TaskStatus;
}

export interface DailyTask extends DailyTaskCreate {
    id: string;
    plan_id: string;
    completed_count: number;
    status: TaskStatus;
    created_at: string;
}

// ============================================
// Study Plan Types
// ============================================

export interface StudyPlanCreate {
    name: string;
    description?: string;
    target_date?: string;
    settings?: Partial<StudyPlanSettings>;
    milestones?: MilestoneCreate[];
}

export interface StudyPlanUpdate {
    name?: string;
    description?: string;
    target_date?: string;
    settings?: Partial<StudyPlanSettings>;
    status?: PlanStatus;
}

export interface StudyPlan {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    target_date?: string;
    status: PlanStatus;
    settings: StudyPlanSettings;
    milestones: Milestone[];
    created_at: string;
    updated_at: string;
}

export interface StudyPlanSummary {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    target_date?: string;
    status: PlanStatus;
    created_at: string;
    updated_at: string;
}

// ============================================
// Progress Types
// ============================================

export interface StudyPlanProgress {
    plan_id: string;
    total_milestones: number;
    completed_milestones: number;
    total_tasks: number;
    completed_tasks: number;
    current_streak: number;
    overall_progress: number; // 0-100 percentage
    days_remaining?: number;
    estimated_completion?: string;
}

export interface TodayTasksSummary {
    total_tasks: number;
    completed_tasks: number;
    total_questions_target: number;
    total_questions_completed: number;
    plans: Array<{
        plan_id: string;
        plan_name: string;
        tasks: Array<{
            id: string;
            type: TaskType;
            target?: number;
            completed: number;
            status: TaskStatus;
        }>;
    }>;
}

// ============================================
// Calendar Types
// ============================================

export interface CalendarDay {
    date: string;
    tasks: DailyTask[];
    total_target: number;
    total_completed: number;
    status: 'empty' | 'pending' | 'partial' | 'complete';
}

export interface CalendarMonth {
    year: number;
    month: number;
    days: CalendarDay[];
}

// ============================================
// Task Generation Request
// ============================================

export interface TaskGenerationRequest {
    start_date: string;
    end_date: string;
    overwrite_existing?: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface StudyPlanListResponse {
    plans: StudyPlanSummary[];
    total: number;
}

export interface DeleteResponse {
    message: string;
}
