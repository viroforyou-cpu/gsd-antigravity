from pydantic import BaseModel
from typing import Optional, Literal, List, Dict, Any
from enum import Enum
from datetime import datetime

# Answer key type
AnswerKey = Literal['A', 'B', 'C', 'D', 'E']

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuestionOptions(BaseModel):
    A: str
    B: str
    C: str
    D: str
    E: str

class Question(BaseModel):
    id: str
    stem: str
    options: QuestionOptions | Dict[str, str]
    correct_answer: str  # 'A', 'B', 'C', 'D', or 'E'
    difficulty: Difficulty | str
    category: str
    subcategory: Optional[str] = None
    source_reference: Optional[str] = None
    explanation: Optional[str] = None
    key_concepts: Optional[List[str]] = None
    created_at: Optional[str] = None
    times_answered: Optional[int] = 0
    times_correct: Optional[int] = 0

class QuestionCreate(BaseModel):
    """Model for creating a new question."""
    stem: str
    options: QuestionOptions | Dict[str, str]
    correct_answer: str
    difficulty: str
    category: str
    subcategory: Optional[str] = None
    source_reference: Optional[str] = None
    explanation: Optional[str] = None
    key_concepts: Optional[List[str]] = None

class QuestionStats(BaseModel):
    """Statistics for a question."""
    total_answered: int
    correct_rate: float
    average_time_seconds: Optional[float] = None
