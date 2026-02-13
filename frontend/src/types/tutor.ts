/**
 * TypeScript types for AI Tutor feature.
 *
 * Phase 22: AI Tutor Mode
 */

// ============================================
// Hint Types
// ============================================

export type HintLevel = 1 | 2 | 3;

export interface Hint {
    id: string;
    level: HintLevel;
    content: string;
    focuses_on: string[];
    related_options?: string[];
    created_at: string;
}

export interface HintRequest {
    session_id: string;
    level?: HintLevel;
}

export interface HintResponse {
    hint: Hint;
    hint_count: number;
    max_hints: number;
}

// ============================================
// Explanation Types
// ============================================

export type ExplanationDifficulty = 'basic' | 'intermediate' | 'advanced';

export interface VisualAid {
    type: 'diagram' | 'table' | 'flowchart' | 'image';
    title: string;
    description?: string;
    reference?: string;
}

export interface Explanation {
    concept: string;
    content: string;
    difficulty: ExplanationDifficulty;
    related_questions: string[];
    visual_aids: VisualAid[];
    created_at: string;
}

export interface ExplanationRequest {
    session_id: string;
    concept: string;
    difficulty?: ExplanationDifficulty;
}

export interface ExplanationResponse {
    explanation: Explanation;
}

// ============================================
// Answer Analysis Types
// ============================================

export interface AnswerAnalysis {
    is_correct: boolean;
    reasoning_gaps: string[];
    misconceptions: string[];
    suggested_review: string[];
    encouraging_feedback: string;
    correct_reasoning?: string;
}

export interface AnswerAnalysisRequest {
    session_id: string;
    answer: string;
}

export interface AnswerAnalysisResponse {
    analysis: AnswerAnalysis;
    session_ended: boolean;
}

// ============================================
// Socratic Question Types
// ============================================

export type SocraticQuestionType = 'clarifying' | 'probing' | 'challenging' | 'connecting';

export interface SocraticQuestion {
    question_type: SocraticQuestionType;
    content: string;
    rationale?: string;
}

// ============================================
// Tutor Message Types
// ============================================

export type MessageRole = 'tutor' | 'user';
export type MessageType = 'question' | 'hint' | 'explanation' | 'guidance' | 'feedback' | 'greeting' | 'summary';

export interface TutorMessage {
    id: string;
    session_id: string;
    role: MessageRole;
    content: string;
    message_type: MessageType;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface TutorMessageCreate {
    content: string;
    message_type: MessageType;
    role?: MessageRole;
}

// ============================================
// Tutor Session Types
// ============================================

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface TutorSessionCreate {
    question_id: string;
    session_id?: string;
}

export interface TutorSession {
    id: string;
    user_id: string;
    question_id: string;
    session_id?: string;
    started_at: string;
    ended_at?: string;
    status: SessionStatus;
    hint_count: number;
    message_count: number;
    learning_insights: Record<string, unknown>[];
    created_at: string;
}

export interface TutorSessionWithMessages extends TutorSession {
    messages: TutorMessage[];
}

export interface TutorSessionSummary {
    id: string;
    question_id: string;
    started_at: string;
    ended_at: string;
    duration_seconds: number;
    hint_count: number;
    message_count: number;
    insights_generated: number;
    key_learnings: string[];
}

export interface TutorSessionEndRequest {
    session_id: string;
    final_answer?: string;
}

export interface TutorSessionEndResponse {
    summary: TutorSessionSummary;
    insights: LearningInsight[];
}

// ============================================
// Learning Insight Types
// ============================================

export type InsightType = 'misconception' | 'knowledge_gap' | 'strength' | 'weakness' | 'recommendation';
export type InsightSeverity = 'low' | 'medium' | 'high';

export interface LearningInsightBase {
    insight_type: InsightType;
    topic?: string;
    description: string;
    severity?: InsightSeverity;
}

export interface LearningInsight extends LearningInsightBase {
    id: string;
    user_id: string;
    first_identified: string;
    last_updated: string;
    occurrence_count: number;
    resolved: boolean;
    resolved_at?: string;
}

export interface LearningInsightCreate extends LearningInsightBase { }

export interface LearningInsightUpdate {
    resolved?: boolean;
    severity?: InsightSeverity;
}

export interface LearningInsightsResponse {
    insights: LearningInsight[];
    total_count: number;
    by_type: Record<string, number>;
}

// ============================================
// Hint Usage Types
// ============================================

export interface HintUsageCreate {
    user_id: string;
    question_id: string;
    session_id?: string;
    hint_level: HintLevel;
    was_helpful?: boolean;
    time_to_answer?: number;
    led_to_correct?: boolean;
}

export interface HintUsage extends HintUsageCreate {
    id: string;
    requested_at: string;
}

export interface HintUsageStats {
    total_hints: number;
    by_level: Record<number, number>;
    helpful_rate: number;
    average_time_to_answer?: number;
    correct_rate_after_hint: number;
}

// ============================================
// User Question Types
// ============================================

export interface UserQuestionRequest {
    session_id: string;
    question: string;
}

export interface TutorResponse {
    message: TutorMessage;
    socratic_question?: SocraticQuestion;
    suggested_actions: string[];
}

// ============================================
// History Types
// ============================================

export interface TutorSessionHistory {
    id: string;
    question_id: string;
    question_preview: string;
    started_at: string;
    ended_at?: string;
    status: string;
    hint_count: number;
    message_count: number;
}

export interface TutorHistoryResponse {
    sessions: TutorSessionHistory[];
    total_count: number;
    page: number;
    page_size: number;
}

// ============================================
// Dashboard Types
// ============================================

export interface TutorDashboardStats {
    total_sessions: number;
    total_hints_used: number;
    total_messages: number;
    average_session_duration: number;
    top_insights: LearningInsight[];
    recent_sessions: TutorSessionHistory[];
}

// ============================================
// Tutor Status Types
// ============================================

export interface TutorStatus {
    status: 'available' | 'unavailable';
    mode: 'mock' | 'production';
    features: {
        hints: boolean;
        socratic_questions: boolean;
        explanations: boolean;
        answer_analysis: boolean;
        learning_insights: boolean;
    };
    limits: {
        max_hints_per_session: number;
    };
}
