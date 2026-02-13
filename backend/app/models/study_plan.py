"""
Pydantic models for Study Plans API.
Includes models for plans, milestones, and daily tasks.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


class PlanStatus(str, Enum):
    """Study plan status options."""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class TaskType(str, Enum):
    """Types of daily tasks."""
    PRACTICE_QUESTIONS = "practice_questions"
    REVIEW_BOOKMARKS = "review_bookmarks"
    REVIEW_SRS = "review_srs"
    STUDY_CATEGORY = "study_category"


class TaskStatus(str, Enum):
    """Daily task status options."""
    PENDING = "pending"
    COMPLETED = "completed"
    SKIPPED = "skipped"


# ============================================
# Study Plan Settings
# ============================================

class StudyPlanSettings(BaseModel):
    """Settings for a study plan."""
    daily_question_goal: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of questions to practice daily"
    )
    categories: List[str] = Field(
        default_factory=list,
        description="Categories to focus on in this plan"
    )
    difficulty_mix: Dict[str, float] = Field(
        default={"easy": 0.2, "medium": 0.5, "hard": 0.3},
        description="Distribution of question difficulties"
    )
    include_srs_reviews: bool = Field(
        default=True,
        description="Include spaced repetition reviews in daily tasks"
    )
    include_bookmark_reviews: bool = Field(
        default=True,
        description="Include bookmark reviews in daily tasks"
    )
    reminder_time: Optional[str] = Field(
        default=None,
        description="Daily reminder time in HH:MM format"
    )
    study_days: List[int] = Field(
        default=[1, 2, 3, 4, 5, 6, 7],
        description="Days of week to study (1=Monday, 7=Sunday)"
    )


# ============================================
# Milestone Models
# ============================================

class MilestoneCreate(BaseModel):
    """Model for creating a milestone."""
    title: str = Field(..., max_length=200, description="Milestone title")
    description: Optional[str] = Field(default=None, description="Milestone description")
    target_date: Optional[date] = Field(default=None, description="Target completion date")
    order_index: int = Field(..., ge=0, description="Order position in the plan")


class MilestoneUpdate(BaseModel):
    """Model for updating a milestone."""
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    target_date: Optional[date] = None


class Milestone(MilestoneCreate):
    """Complete milestone model."""
    id: str
    plan_id: str
    completed_at: Optional[datetime] = None
    created_at: datetime


# ============================================
# Daily Task Models
# ============================================

class DailyTaskCreate(BaseModel):
    """Model for creating a daily task."""
    date: date
    task_type: TaskType
    target_count: Optional[int] = Field(default=None, ge=1)


class DailyTaskUpdate(BaseModel):
    """Model for updating a daily task."""
    completed_count: Optional[int] = Field(default=None, ge=0)
    status: Optional[TaskStatus] = None


class DailyTask(DailyTaskCreate):
    """Complete daily task model."""
    id: str
    plan_id: str
    completed_count: int = 0
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime


# ============================================
# Study Plan Models
# ============================================

class StudyPlanCreate(BaseModel):
    """Model for creating a study plan."""
    name: str = Field(..., max_length=200, description="Plan name")
    description: Optional[str] = Field(default=None, description="Plan description")
    target_date: Optional[date] = Field(default=None, description="Goal completion date")
    settings: StudyPlanSettings = Field(default_factory=StudyPlanSettings)
    milestones: List[MilestoneCreate] = Field(default_factory=list)


class StudyPlanUpdate(BaseModel):
    """Model for updating a study plan."""
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = None
    target_date: Optional[date] = None
    settings: Optional[StudyPlanSettings] = None
    status: Optional[PlanStatus] = None


class StudyPlan(BaseModel):
    """Complete study plan model."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: PlanStatus = PlanStatus.ACTIVE
    settings: StudyPlanSettings
    milestones: List[Milestone] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class StudyPlanSummary(BaseModel):
    """Summary model for list views (without milestones)."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: PlanStatus = PlanStatus.ACTIVE
    created_at: datetime
    updated_at: datetime


# ============================================
# Progress Models
# ============================================

class StudyPlanProgress(BaseModel):
    """Progress summary for a study plan."""
    plan_id: str
    total_milestones: int
    completed_milestones: int
    total_tasks: int
    completed_tasks: int
    current_streak: int
    overall_progress: float = Field(..., ge=0, le=100, description="Progress percentage 0-100")
    days_remaining: Optional[int] = None
    estimated_completion: Optional[date] = None


class TodayTasksSummary(BaseModel):
    """Summary of today's tasks across all plans."""
    total_tasks: int
    completed_tasks: int
    total_questions_target: int
    total_questions_completed: int
    plans: List[Dict[str, Any]] = Field(default_factory=list)


# ============================================
# Calendar Models
# ============================================

class CalendarDay(BaseModel):
    """Single day in calendar view."""
    date: date
    tasks: List[DailyTask] = Field(default_factory=list)
    total_target: int = 0
    total_completed: int = 0
    status: str = "empty"  # empty, pending, partial, complete


class CalendarMonth(BaseModel):
    """Month view for calendar."""
    year: int
    month: int
    days: List[CalendarDay]


# ============================================
# Task Generation Request
# ============================================

class TaskGenerationRequest(BaseModel):
    """Request to generate tasks for a date range."""
    start_date: date
    end_date: date
    overwrite_existing: bool = Field(default=False)
