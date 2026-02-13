"""
Pydantic models for AI Tutor feature.

Phase 22: AI Tutor Mode
"""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ============================================
# Base Models
# ============================================

class TutorSessionBase(BaseModel):
    """Base model for tutor sessions."""
    question_id: UUID
    session_id: Optional[UUID] = None


class TutorMessageBase(BaseModel):
    """Base model for tutor messages."""
    content: str
    message_type: Literal['question', 'hint', 'explanation', 'guidance', 'feedback', 'greeting', 'summary']


# ============================================
# Hint Models
# ============================================

class HintRequest(BaseModel):
    """Request model for generating a hint."""
    session_id: UUID
    level: Optional[int] = Field(default=None, ge=1, le=3, description="Hint level 1-3, None for auto")


class Hint(BaseModel):
    """Model for a generated hint."""
    id: UUID = Field(default_factory=lambda: UUID('00000000-0000-0000-0000-000000000000'))
    level: int = Field(ge=1, le=3, description="Hint level: 1=Socratic, 2=Directional, 3=Explicit")
    content: str = Field(description="The hint text")
    focuses_on: list[str] = Field(default_factory=list, description="Key concepts highlighted")
    related_options: Optional[list[str]] = Field(default=None, description="Related answer options")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HintResponse(BaseModel):
    """Response model for hint generation."""
    hint: Hint
    hint_count: int = Field(description="Total hints used in session")
    max_hints: int = Field(default=3, description="Maximum hints allowed per question")


# ============================================
# Explanation Models
# ============================================

class ExplanationRequest(BaseModel):
    """Request model for generating an explanation."""
    session_id: UUID
    concept: str = Field(description="Concept to explain")
    difficulty: Optional[Literal['basic', 'intermediate', 'advanced']] = None


class VisualAid(BaseModel):
    """Model for visual aid reference."""
    type: Literal['diagram', 'table', 'flowchart', 'image']
    title: str
    description: Optional[str] = None
    reference: Optional[str] = None  # URL or identifier


class Explanation(BaseModel):
    """Model for a personalized explanation."""
    concept: str
    content: str
    difficulty: Literal['basic', 'intermediate', 'advanced']
    related_questions: list[UUID] = Field(default_factory=list)
    visual_aids: list[VisualAid] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExplanationResponse(BaseModel):
    """Response model for explanation generation."""
    explanation: Explanation


# ============================================
# Answer Analysis Models
# ============================================

class AnswerAnalysisRequest(BaseModel):
    """Request model for analyzing an answer."""
    session_id: UUID
    answer: str = Field(description="User's selected answer (A-E)")


class AnswerAnalysis(BaseModel):
    """Model for answer analysis result."""
    is_correct: bool
    reasoning_gaps: list[str] = Field(default_factory=list, description="Gaps in user's reasoning")
    misconceptions: list[str] = Field(default_factory=list, description="Identified misconceptions")
    suggested_review: list[str] = Field(default_factory=list, description="Topics to review")
    encouraging_feedback: str = Field(description="Supportive feedback message")
    correct_reasoning: Optional[str] = Field(default=None, description="Explanation of correct reasoning")


class AnswerAnalysisResponse(BaseModel):
    """Response model for answer analysis."""
    analysis: AnswerAnalysis
    session_ended: bool = Field(default=False, description="Whether session ended after analysis")


# ============================================
# Socratic Question Models
# ============================================

class SocraticQuestionType(str):
    """Types of Socratic questions."""
    CLARIFYING = 'clarifying'
    PROBING = 'probing'
    CHALLENGING = 'challenging'
    CONNECTING = 'connecting'


class SocraticQuestion(BaseModel):
    """Model for a Socratic question."""
    question_type: Literal['clarifying', 'probing', 'challenging', 'connecting']
    content: str
    rationale: Optional[str] = Field(default=None, description="Why this question type was chosen")


# ============================================
# Tutor Message Models
# ============================================

class TutorMessage(TutorMessageBase):
    """Full model for a tutor message."""
    id: UUID
    session_id: UUID
    role: Literal['tutor', 'user']
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    class Config:
        from_attributes = True


class TutorMessageCreate(TutorMessageBase):
    """Model for creating a new tutor message."""
    role: Literal['tutor', 'user'] = 'user'


class TutorMessageResponse(BaseModel):
    """Response model for a single message."""
    message: TutorMessage


# ============================================
# Tutor Session Models
# ============================================

class TutorSessionCreate(TutorSessionBase):
    """Model for creating a new tutor session."""
    pass


class TutorSession(TutorSessionBase):
    """Full model for a tutor session."""
    id: UUID
    user_id: UUID
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: Literal['active', 'completed', 'abandoned']
    hint_count: int
    message_count: int
    learning_insights: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True


class TutorSessionWithMessages(TutorSession):
    """Tutor session with message history."""
    messages: list[TutorMessage] = Field(default_factory=list)


class TutorSessionSummary(BaseModel):
    """Summary of a completed tutor session."""
    id: UUID
    question_id: UUID
    started_at: datetime
    ended_at: datetime
    duration_seconds: int
    hint_count: int
    message_count: int
    insights_generated: int
    key_learnings: list[str] = Field(default_factory=list)


class TutorSessionEndRequest(BaseModel):
    """Request model for ending a tutor session."""
    session_id: UUID
    final_answer: Optional[str] = Field(default=None, description="User's final answer if any")


class TutorSessionEndResponse(BaseModel):
    """Response model for ending a tutor session."""
    summary: TutorSessionSummary
    insights: list['LearningInsight'] = Field(default_factory=list)


# ============================================
# Learning Insight Models
# ============================================

class LearningInsightBase(BaseModel):
    """Base model for learning insights."""
    insight_type: Literal['misconception', 'knowledge_gap', 'strength', 'weakness', 'recommendation']
    topic: Optional[str] = None
    description: str
    severity: Optional[Literal['low', 'medium', 'high']] = None


class LearningInsight(LearningInsightBase):
    """Full model for a learning insight."""
    id: UUID
    user_id: UUID
    first_identified: datetime
    last_updated: datetime
    occurrence_count: int
    resolved: bool
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LearningInsightCreate(LearningInsightBase):
    """Model for creating a learning insight."""
    pass


class LearningInsightUpdate(BaseModel):
    """Model for updating a learning insight."""
    resolved: Optional[bool] = None
    severity: Optional[Literal['low', 'medium', 'high']] = None


class LearningInsightsResponse(BaseModel):
    """Response model for user's learning insights."""
    insights: list[LearningInsight]
    total_count: int
    by_type: dict[str, int] = Field(default_factory=dict)


# ============================================
# Hint Usage Models
# ============================================

class HintUsageCreate(BaseModel):
    """Model for tracking hint usage."""
    user_id: UUID
    question_id: UUID
    session_id: Optional[UUID] = None
    hint_level: int = Field(ge=1, le=3)
    was_helpful: Optional[bool] = None
    time_to_answer: Optional[int] = None
    led_to_correct: Optional[bool] = None


class HintUsage(HintUsageCreate):
    """Full model for hint usage tracking."""
    id: UUID
    requested_at: datetime

    class Config:
        from_attributes = True


class HintUsageStats(BaseModel):
    """Statistics for hint usage."""
    total_hints: int
    by_level: dict[int, int]
    helpful_rate: float
    average_time_to_answer: Optional[float] = None
    correct_rate_after_hint: float


# ============================================
# User Question Models
# ============================================

class UserQuestionRequest(BaseModel):
    """Request model for user asking the tutor a question."""
    session_id: UUID
    question: str = Field(min_length=1, max_length=1000)


class TutorResponse(BaseModel):
    """Response from the tutor to a user question."""
    message: TutorMessage
    socratic_question: Optional[SocraticQuestion] = None
    suggested_actions: list[str] = Field(default_factory=list)


# ============================================
# History Models
# ============================================

class TutorSessionHistory(BaseModel):
    """Brief info for session history list."""
    id: UUID
    question_id: UUID
    question_preview: str = Field(description="First 100 chars of question stem")
    started_at: datetime
    ended_at: Optional[datetime]
    status: str
    hint_count: int
    message_count: int


class TutorHistoryResponse(BaseModel):
    """Response model for tutor session history."""
    sessions: list[TutorSessionHistory]
    total_count: int
    page: int
    page_size: int


# ============================================
# Dashboard Models
# ============================================

class TutorDashboardStats(BaseModel):
    """Statistics for tutor dashboard widget."""
    total_sessions: int
    total_hints_used: int
    total_messages: int
    average_session_duration: float
    top_insights: list[LearningInsight] = Field(default_factory=list, max_length=5)
    recent_sessions: list[TutorSessionHistory] = Field(default_factory=list, max_length=5)
