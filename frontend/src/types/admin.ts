/**
 * Admin types for the admin dashboard.
 * Phase 24: Admin Dashboard
 */

// ============================================
// Constants (using const objects instead of enums for erasableSyntaxOnly)
// ============================================

export const AdminAction = {
    // User management
    USER_VIEW: 'user_view',
    USER_UPDATE: 'user_update',
    USER_DEACTIVATE: 'user_deactivate',
    USER_ACTIVATE: 'user_activate',
    USER_ROLE_CHANGE: 'user_role_change',
    USER_PASSWORD_RESET: 'user_password_reset',

    // Question management
    QUESTION_CREATE: 'question_create',
    QUESTION_UPDATE: 'question_update',
    QUESTION_DELETE: 'question_delete',
    QUESTION_APPROVE: 'question_approve',

    // Report management
    REPORT_VIEW: 'report_view',
    REPORT_RESOLVE: 'report_resolve',
    REPORT_DISMISS: 'report_dismiss',

    // Settings management
    SETTINGS_UPDATE: 'settings_update',

    // System
    MAINTENANCE_MODE: 'maintenance_mode',
    SYSTEM_EXPORT: 'system_export',
} as const;

export type AdminAction = typeof AdminAction[keyof typeof AdminAction];

export const ReportReason = {
    INCORRECT: 'incorrect',
    UNCLEAR: 'unclear',
    OFFENSIVE: 'offensive',
    DUPLICATE: 'duplicate',
    OTHER: 'other',
} as const;

export type ReportReason = typeof ReportReason[keyof typeof ReportReason];

export const ReportStatus = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed',
} as const;

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

// ============================================
// Admin Log Types
// ============================================

export interface AdminLog {
    id: string;
    admin_user_id: string;
    action: AdminAction;
    target_type: string | null;
    target_id: string | null;
    details: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface AdminLogList {
    logs: AdminLog[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// ============================================
// User Admin Types
// ============================================

export interface UserAdminView {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;

    // Statistics
    total_sessions: number;
    total_questions_answered: number;
    total_correct: number;
    last_activity: string | null;
}

export interface UserAdminUpdate {
    role?: string;
    is_active?: boolean;
    display_name?: string;
}

export interface UserAdminList {
    users: UserAdminView[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface UserActivityStats {
    user_id: string;
    sessions_count: number;
    questions_answered: number;
    correct_answers: number;
    accuracy: number;
    total_time_spent: number;
    categories_practiced: string[];
    recent_sessions: Array<Record<string, unknown>>;
}

// ============================================
// Question Report Types
// ============================================

export interface QuestionReportCreate {
    question_id: string;
    reason: ReportReason;
    description?: string;
}

export interface QuestionReportResolve {
    status: ReportStatus;
    resolution_note?: string;
}

export interface QuestionReport {
    id: string;
    question_id: string;
    reported_by: string | null;
    reason: ReportReason;
    description: string | null;
    status: ReportStatus;
    reviewed_by: string | null;
    reviewed_at: string | null;
    resolution_note: string | null;
    created_at: string;

    // Question preview
    question_stem: string | null;
    question_category: string | null;
}

export interface QuestionReportList {
    reports: QuestionReport[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// ============================================
// Admin Settings Types
// ============================================

export interface AdminSetting {
    key: string;
    value: Record<string, unknown>;
    description: string | null;
    updated_by: string | null;
    updated_at: string;
}

export interface AdminSettingUpdate {
    value: Record<string, unknown>;
}

export interface AdminSettingsList {
    settings: AdminSetting[];
}

// ============================================
// Analytics Types
// ============================================

export interface AdminAnalyticsOverview {
    // User stats
    total_users: number;
    active_users_today: number;
    active_users_week: number;
    active_users_month: number;
    new_users_today: number;
    new_users_week: number;

    // Session stats
    total_sessions: number;
    sessions_today: number;
    sessions_week: number;
    avg_session_duration: number;

    // Question stats
    total_questions: number;
    questions_answered_today: number;
    avg_accuracy: number;

    // Report stats
    pending_reports: number;
    resolved_reports_week: number;

    // System health
    database_size_mb: number;
    cache_hit_rate: number;
}

export interface UserGrowthStats {
    date: string;
    new_users: number;
    total_users: number;
    active_users: number;
}

export interface QuestionPerformanceStats {
    question_id: string;
    category: string;
    difficulty: string;
    times_answered: number;
    times_correct: number;
    accuracy: number;
    avg_time_seconds: number;
    report_count: number;
}

export interface SessionStats {
    date: string;
    total_sessions: number;
    completed_sessions: number;
    abandoned_sessions: number;
    avg_questions_per_session: number;
    avg_accuracy: number;
    avg_duration_minutes: number;
}

export interface CategoryStats {
    category: string;
    total_questions: number;
    times_practiced: number;
    avg_accuracy: number;
    unique_users: number;
}

export interface AdminAnalyticsUsers {
    growth: UserGrowthStats[];
    by_role: Record<string, number>;
    by_activity: Record<string, number>;
    top_users: UserAdminView[];
}

export interface AdminAnalyticsQuestions {
    by_category: CategoryStats[];
    by_difficulty: Record<string, number>;
    most_missed: QuestionPerformanceStats[];
    most_reported: QuestionPerformanceStats[];
}

export interface AdminAnalyticsSessions {
    daily: SessionStats[];
    completion_rate: number;
    avg_duration_minutes: number;
    peak_hours: number[];
}

export interface AdminAnalyticsPerformance {
    avg_response_time_ms: number;
    cache_hit_rate: number;
    database_connections: number;
    error_rate: number;
    requests_per_minute: number;
}

// ============================================
// Dashboard Types
// ============================================

export interface AdminDashboardStats {
    overview: AdminAnalyticsOverview;
    recent_logs: AdminLog[];
    pending_reports: QuestionReport[];
    recent_users: UserAdminView[];
}

export interface DateRangeRequest {
    start_date: string;
    end_date: string;
}

// ============================================
// API Query Parameters
// ============================================

export interface AdminUsersParams {
    page?: number;
    page_size?: number;
    role?: string;
    is_active?: boolean;
    search?: string;
}

export interface AdminReportsParams {
    page?: number;
    page_size?: number;
    status?: ReportStatus;
    reason?: ReportReason;
}

export interface AdminLogsParams {
    page?: number;
    page_size?: number;
    admin_user_id?: string;
    action?: AdminAction;
    target_type?: string;
}

export interface AdminUserGrowthParams {
    start_date: string;
    end_date: string;
}
