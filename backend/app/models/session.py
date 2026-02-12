from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .question import Question, AnswerKey


class SessionCreate(BaseModel):
    """Model for creating a new session."""
    user_id: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    question_count: int = Field(default=5, ge=1, le=50)


class SessionAnswer(BaseModel):
    """Model for submitting an answer."""
    question_id: str
    answer: str  # 'A', 'B', 'C', 'D', or 'E'
    time_spent_seconds: Optional[int] = 0


class SessionAnswerSubmit(BaseModel):
    """Model for answer submission in API."""
    question_id: str
    answer: str  # 'A', 'B', 'C', 'D', or 'E'
    time_spent_seconds: Optional[int] = 0


class SessionQuestion(BaseModel):
    """A question within a session with user's answer."""
    question: Question
    order: int
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None
    time_spent_seconds: int = 0


class SessionStats(BaseModel):
    """Statistics for a session."""
    total_questions: int
    correct_answers: int
    time_spent_seconds: int
    accuracy: float


class SessionUpdate(BaseModel):
    """Model for updating a session."""
    status: Optional[str] = None
    completed_at: Optional[datetime] = None


class Session(BaseModel):
    """A practice session."""
    id: str
    user_id: Optional[str] = None
    questions: List[SessionQuestion] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "active"
    settings: Dict[str, Any] = Field(default_factory=dict)
    time_spent_seconds: int = 0


class SessionResult(BaseModel):
    """Result of a completed session."""
    id: str
    total_questions: int
    correct_answers: int
    accuracy: float
    answers: List[Dict[str, Any]]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
