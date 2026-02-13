"""
Spaced Repetition System (SRS) API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import date

from ...models.spaced_repetition import (
    ReviewQueue,
    ReviewSubmit,
    ReviewResult,
    SRSStats,
    SpacedRepetitionResponse
)
from ...services.spaced_repetition_repository import spaced_repetition_repository
from ...services.auth_service import get_current_user_optional

router = APIRouter(prefix="/review", tags=["review"])


@router.get("/due", response_model=ReviewQueue)
async def get_due_reviews(
    limit: int = Query(20, ge=1, le=100),
    user = Depends(get_current_user_optional)
):
    """
    Get questions due for review today.
    
    Returns questions that are scheduled for review, prioritizing overdue items.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        # Return empty queue for unauthenticated users
        return ReviewQueue(
            due_today=0,
            overdue=0,
            upcoming_week=0,
            questions=[]
        )
    
    return await spaced_repetition_repository.get_due_reviews(user_id, limit)


@router.get("/upcoming")
async def get_upcoming_reviews(
    days: int = Query(14, ge=1, le=90),
    user = Depends(get_current_user_optional)
):
    """
    Get upcoming review schedule.
    
    Returns a forecast of reviews for the next N days.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return []
    
    return await spaced_repetition_repository.get_upcoming_reviews(user_id, days)


@router.post("/submit", response_model=ReviewResult)
async def submit_review(
    review: ReviewSubmit,
    user = Depends(get_current_user_optional)
):
    """
    Submit a review result.
    
    Updates the spaced repetition schedule based on the quality of recall.
    Quality ratings:
    - 5: Perfect - correct answer, high confidence, quick response
    - 4: Good - correct answer, some hesitation
    - 3: Pass - correct answer, low confidence or took hints
    - 2: Fail (close) - incorrect answer, but close
    - 1: Fail - incorrect answer, no idea
    - 0: Complete failure - did not attempt
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return await spaced_repetition_repository.submit_review(
        user_id=user_id,
        question_id=review.question_id,
        quality=review.quality,
        time_spent_seconds=review.time_spent_seconds,
        is_correct=review.is_correct
    )


@router.get("/stats", response_model=SRSStats)
async def get_srs_stats(
    user = Depends(get_current_user_optional)
):
    """
    Get SRS statistics for the current user.
    
    Returns total cards, due counts, retention rate, and forecast.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        # Return empty stats for unauthenticated users
        return SRSStats(
            total_cards=0,
            cards_due_today=0,
            cards_overdue=0,
            cards_upcoming_week=0,
            average_ease=2.50,
            average_interval=0,
            retention_rate=0,
            total_reviews=0,
            reviews_today=0,
            forecast=[]
        )
    
    return await spaced_repetition_repository.get_srs_stats(user_id)


@router.post("/preview")
async def preview_next_interval(
    quality: int = Query(..., ge=0, le=5),
    ease_factor: float = Query(2.50, ge=1.3, le=5.0),
    current_interval: int = Query(0, ge=0),
    repetitions: int = Query(0, ge=0),
    user = Depends(get_current_user_optional)
):
    """
    Preview what the next interval would be for a given quality rating.
    
    Useful for showing users the impact of their performance before they answer.
    """
    from decimal import Decimal
    
    new_ease, new_interval, new_repetitions = spaced_repetition_repository.calculate_next_review(
        Decimal(str(ease_factor)),
        current_interval,
        repetitions,
        quality
    )
    
    from datetime import timedelta
    next_review = date.today() + timedelta(days=new_interval)
    
    return {
        "quality": quality,
        "previous_interval": current_interval,
        "new_interval": new_interval,
        "previous_ease": ease_factor,
        "new_ease": float(new_ease),
        "next_review_date": next_review.isoformat(),
        "repetitions": new_repetitions
    }


@router.get("/question/{question_id}", response_model=Optional[SpacedRepetitionResponse])
async def get_question_srs(
    question_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Get SRS data for a specific question.
    
    Returns the spaced repetition data if the user has practiced this question before.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return None
    
    return await spaced_repetition_repository.get_question_srs(user_id, question_id)


@router.post("/initialize/{question_id}", response_model=SpacedRepetitionResponse)
async def initialize_question_srs(
    question_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Initialize SRS data for a new question.
    
    Creates a new spaced repetition entry for the question.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return await spaced_repetition_repository.initialize_srs_for_question(user_id, question_id)
