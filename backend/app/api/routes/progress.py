"""
Progress API Routes - Updated to use repository pattern.
"""
from fastapi import APIRouter, Query
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from ...services.progress_repository import progress_repository

router = APIRouter(prefix="/progress", tags=["progress"])


class CategoryProgress(BaseModel):
    category: str
    total_questions: int
    correct_answers: int
    accuracy: float
    last_practiced: Optional[datetime] = None


class DashboardStats(BaseModel):
    total_sessions: int
    total_questions: int
    total_correct: int
    overall_accuracy: float
    total_time_minutes: int
    streak_days: int


class Improvement(BaseModel):
    week_over_week: float
    trend: str


class RecentSession(BaseModel):
    id: str
    date: str
    questions: int
    correct: int
    category: Optional[str] = None


class DashboardData(BaseModel):
    total_sessions: int
    total_questions: int
    total_correct: int
    overall_accuracy: float
    total_time_minutes: int
    streak_days: int
    recent_sessions: list[RecentSession]
    improvement: Improvement


class HistoryEntry(BaseModel):
    date: str
    sessions: int
    questions: int
    correct: int
    accuracy: float


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(user_id: Optional[str] = Query(None)):
    """Get user dashboard data including stats and recent activity."""
    data = await progress_repository.get_dashboard(user_id)
    
    return DashboardData(
        total_sessions=data.get("total_sessions", 0),
        total_questions=data.get("total_questions", 0),
        total_correct=data.get("total_correct", 0),
        overall_accuracy=data.get("overall_accuracy", 0.0),
        total_time_minutes=data.get("total_time_minutes", 0),
        streak_days=data.get("streak_days", 0),
        recent_sessions=[
            RecentSession(**s) for s in data.get("recent_sessions", [])
        ],
        improvement=Improvement(**data.get("improvement", {"week_over_week": 0, "trend": "no_data"}))
    )


@router.get("/categories", response_model=list[CategoryProgress])
async def get_category_progress(user_id: Optional[str] = Query(None)):
    """Get progress breakdown by category."""
    data = await progress_repository.get_categories_progress(user_id)
    
    return [
        CategoryProgress(
            category=item["category"],
            total_questions=item.get("total_questions", 0),
            correct_answers=item.get("correct_answers", 0),
            accuracy=item.get("accuracy", 0.0),
            last_practiced=item.get("last_practiced")
        )
        for item in data
    ]


@router.get("/history", response_model=list[HistoryEntry])
async def get_history(
    user_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365)
):
    """Get historical performance data."""
    data = await progress_repository.get_history(user_id, days)
    
    return [
        HistoryEntry(
            date=item["date"],
            sessions=item.get("sessions", 0),
            questions=item.get("questions", 0),
            correct=item.get("correct", 0),
            accuracy=item.get("accuracy", 0.0)
        )
        for item in data
    ]
