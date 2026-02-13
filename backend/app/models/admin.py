"""Admin models for user management, analytics, and system settings."""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


# ============================================
# Enums
# ============================================

class AdminAction(str, Enum):
    """Admin action types for audit logging."""
    # User management
    USER_VIEW = "user_view"
    USER_UPDATE = "user_update"
    USER_DEACTIVATE = "user_deactivate"
    USER_ACTIVATE = "user_activate"
    USER_ROLE_CHANGE = "user_role_change"
    USER_PASSWORD_RESET = "user_password_reset"
    
    # Question management
    QUESTION_CREATE = "question_create"
    QUESTION_UPDATE = "question_update"
    QUESTION_DELETE = "question_delete"
    QUESTION_APPROVE = "question_approve"
    
    # Report management
    REPORT_VIEW = "report_view"
    REPORT_RESOLVE = "report_resolve"
    REPORT_DISMISS = "report_dismiss"
    
    # Settings management
    SETTINGS_UPDATE = "settings_update"
    
    # System
    MAINTENANCE_MODE = "maintenance_mode"
    SYSTEM_EXPORT = "system_export"


class ReportReason(str, Enum):
    """Reasons for reporting a question."""
    INCORRECT = "incorrect"
    UNCLEAR = "unclear"
    OFFENSIVE = "offensive"
    DUPLICATE = "duplicate"
    OTHER = "other"


class ReportStatus(str, Enum):
    """Status of a question report."""
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


# ============================================
# Admin Log Models
# ============================================

class AdminLogBase(BaseModel):
    """Base admin log model."""
    action: AdminAction
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class AdminLog(AdminLogBase):
    """Full admin log model."""
    id: str
    admin_user_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdminLogList(BaseModel):
    """Paginated list of admin logs."""
    logs: List[AdminLog]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# User Admin Models
# ============================================

class UserAdminView(BaseModel):
    """User view for admin panel."""
    id: str
    email: str
    display_name: Optional[str] = None
    role: str = "user"
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Statistics
    total_sessions: int = 0
    total_questions_answered: int = 0
    total_correct: int = 0
    last_activity: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserAdminUpdate(BaseModel):
    """Update request for user by admin."""
    role: Optional[str] = None
    is_active: Optional[bool] = None
    display_name: Optional[str] = None


class UserAdminList(BaseModel):
    """Paginated list of users for admin."""
    users: List[UserAdminView]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserActivityStats(BaseModel):
    """User activity statistics."""
    user_id: str
    sessions_count: int
    questions_answered: int
    correct_answers: int
    accuracy: float
    total_time_spent: int  # seconds
    categories_practiced: List[str]
    recent_sessions: List[Dict[str, Any]]


# ============================================
# Question Report Models
# ============================================

class QuestionReportCreate(BaseModel):
    """Create a question report."""
    question_id: str
    reason: ReportReason
    description: Optional[str] = None


class QuestionReportResolve(BaseModel):
    """Resolve a question report."""
    status: ReportStatus
    resolution_note: Optional[str] = None


class QuestionReport(BaseModel):
    """Full question report model."""
    id: str
    question_id: str
    reported_by: Optional[str] = None
    reason: ReportReason
    description: Optional[str] = None
    status: ReportStatus
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    
    # Question preview
    question_stem: Optional[str] = None
    question_category: Optional[str] = None
    
    class Config:
        from_attributes = True


class QuestionReportList(BaseModel):
    """Paginated list of question reports."""
    reports: List[QuestionReport]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# Admin Settings Models
# ============================================

class AdminSetting(BaseModel):
    """Admin setting model."""
    key: str
    value: Dict[str, Any]
    description: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AdminSettingUpdate(BaseModel):
    """Update admin setting."""
    value: Dict[str, Any]


class AdminSettingsList(BaseModel):
    """List of all admin settings."""
    settings: List[AdminSetting]


# ============================================
# Analytics Models
# ============================================

class AdminAnalyticsOverview(BaseModel):
    """Overview statistics for admin dashboard."""
    # User stats
    total_users: int
    active_users_today: int
    active_users_week: int
    active_users_month: int
    new_users_today: int
    new_users_week: int
    
    # Session stats
    total_sessions: int
    sessions_today: int
    sessions_week: int
    avg_session_duration: float  # minutes
    
    # Question stats
    total_questions: int
    questions_answered_today: int
    avg_accuracy: float
    
    # Report stats
    pending_reports: int
    resolved_reports_week: int
    
    # System health
    database_size_mb: float
    cache_hit_rate: float


class UserGrowthStats(BaseModel):
    """User growth statistics."""
    date: date
    new_users: int
    total_users: int
    active_users: int


class QuestionPerformanceStats(BaseModel):
    """Question performance statistics."""
    question_id: str
    category: str
    difficulty: str
    times_answered: int
    times_correct: int
    accuracy: float
    avg_time_seconds: float
    report_count: int


class SessionStats(BaseModel):
    """Session statistics."""
    date: date
    total_sessions: int
    completed_sessions: int
    abandoned_sessions: int
    avg_questions_per_session: float
    avg_accuracy: float
    avg_duration_minutes: float


class CategoryStats(BaseModel):
    """Statistics by category."""
    category: str
    total_questions: int
    times_practiced: int
    avg_accuracy: float
    unique_users: int


class AdminAnalyticsUsers(BaseModel):
    """User analytics for admin."""
    growth: List[UserGrowthStats]
    by_role: Dict[str, int]
    by_activity: Dict[str, int]  # active, inactive, dormant
    top_users: List[UserAdminView]


class AdminAnalyticsQuestions(BaseModel):
    """Question analytics for admin."""
    by_category: List[CategoryStats]
    by_difficulty: Dict[str, int]
    most_missed: List[QuestionPerformanceStats]
    most_reported: List[QuestionPerformanceStats]


class AdminAnalyticsSessions(BaseModel):
    """Session analytics for admin."""
    daily: List[SessionStats]
    completion_rate: float
    avg_duration_minutes: float
    peak_hours: List[int]  # Hours of day with most activity


class AdminAnalyticsPerformance(BaseModel):
    """System performance analytics."""
    avg_response_time_ms: float
    cache_hit_rate: float
    database_connections: int
    error_rate: float
    requests_per_minute: float


# ============================================
# Dashboard Models
# ============================================

class AdminDashboardStats(BaseModel):
    """Dashboard statistics for admin panel."""
    overview: AdminAnalyticsOverview
    recent_logs: List[AdminLog]
    pending_reports: List[QuestionReport]
    recent_users: List[UserAdminView]


class DateRangeRequest(BaseModel):
    """Request with date range."""
    start_date: date
    end_date: date
