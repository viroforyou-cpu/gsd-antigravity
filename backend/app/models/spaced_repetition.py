"""
Spaced Repetition System (SRS) models using SM-2 algorithm.
"""
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field
from decimal import Decimal


class SpacedRepetitionBase(BaseModel):
    """Base model for spaced repetition data."""
    ease_factor: Decimal = Field(default=Decimal("2.50"), ge=1.3, le=5.0)
    interval_days: int = Field(default=0, ge=0)
    repetitions: int = Field(default=0, ge=0)
    next_review_date: date
    last_review_date: Optional[date] = None
    total_reviews: int = Field(default=0, ge=0)
    total_correct: int = Field(default=0, ge=0)


class SpacedRepetitionCreate(BaseModel):
    """Model for creating a new spaced repetition entry."""
    question_id: str
    user_id: Optional[str] = None


class SpacedRepetitionUpdate(BaseModel):
    """Model for updating spaced repetition after a review."""
    quality: int = Field(..., ge=0, le=5, description="Quality of recall: 0-5")
    time_spent_seconds: Optional[int] = None


class SpacedRepetitionResponse(SpacedRepetitionBase):
    """Response model for spaced repetition data."""
    id: str
    user_id: str
    question_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReviewQuality:
    """Constants for review quality ratings."""
    COMPLETE_FAILURE = 0      # Complete failure / did not attempt
    INCORRECT_NO_IDEA = 1     # Incorrect answer, no idea
    INCORRECT_CLOSE = 2       # Incorrect answer, but close
    CORRECT_LOW_CONFIDENCE = 3  # Correct answer, low confidence or took hints
    CORRECT_HESITANT = 4      # Correct answer, some hesitation
    CORRECT_PERFECT = 5       # Correct answer, high confidence, quick response


class ReviewQuestion(BaseModel):
    """Model for a question in the review queue."""
    question_id: str
    stem: str
    options: dict
    category: str
    difficulty: str
    srs_data: Optional[SpacedRepetitionResponse] = None
    is_overdue: bool = False
    days_overdue: int = 0


class ReviewQueue(BaseModel):
    """Model for the review queue."""
    due_today: int
    overdue: int
    upcoming_week: int
    questions: List[ReviewQuestion]


class ReviewSubmit(BaseModel):
    """Model for submitting a review result."""
    question_id: str
    quality: int = Field(..., ge=0, le=5)
    time_spent_seconds: Optional[int] = None
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None


class ReviewResult(BaseModel):
    """Model for the result of a review submission."""
    question_id: str
    previous_interval: int
    new_interval: int
    previous_ease: Decimal
    new_ease: Decimal
    next_review_date: date
    is_correct: bool
    message: str


class SRSStats(BaseModel):
    """Model for SRS statistics."""
    total_cards: int
    cards_due_today: int
    cards_overdue: int
    cards_upcoming_week: int
    average_ease: Decimal
    average_interval: Decimal
    retention_rate: Decimal
    total_reviews: int
    reviews_today: int
    forecast: List[dict]  # List of {date, count} for next 14 days
