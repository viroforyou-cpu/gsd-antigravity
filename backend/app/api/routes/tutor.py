"""
Tutor API Routes - Endpoints for AI Tutor functionality.

Phase 22: AI Tutor Mode
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.config import settings
from ...models.tutor import (
    TutorSession,
    TutorSessionCreate,
    TutorSessionWithMessages,
    TutorSessionEndRequest,
    TutorSessionEndResponse,
    TutorMessage,
    TutorMessageCreate,
    HintRequest,
    HintResponse,
    ExplanationRequest,
    ExplanationResponse,
    AnswerAnalysisRequest,
    AnswerAnalysisResponse,
    LearningInsight,
    LearningInsightsResponse,
    UserQuestionRequest,
    TutorResponse,
    TutorHistoryResponse,
    TutorDashboardStats,
    TutorSessionHistory
)
from ...services.tutor_service import tutor_service
from ...services.auth_service import get_current_user

router = APIRouter(prefix="/tutor", tags=["tutor"])


# ============================================
# Session Endpoints
# ============================================

@router.post("/sessions", response_model=TutorSessionWithMessages)
async def start_tutor_session(
    session_create: TutorSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Start a new tutor session for a question.
    
    The tutor will provide interactive guidance through Socratic questioning
    and adaptive hints.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    try:
        session = await tutor_service.start_session(
            user_id=str(user_id),
            question_id=str(session_create.question_id),
            practice_session_id=str(session_create.session_id) if session_create.session_id else None
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start tutor session: {str(e)}")


@router.get("/sessions/{session_id}", response_model=TutorSessionWithMessages)
async def get_tutor_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a tutor session with all messages.
    
    Returns the session state and complete message history.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    session = await tutor_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    
    # Verify ownership
    if str(session.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return session


@router.post("/sessions/{session_id}/end", response_model=TutorSessionEndResponse)
async def end_tutor_session(
    session_id: str,
    request: TutorSessionEndRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    End a tutor session.
    
    Generates a summary and learning insights from the session.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Verify session ownership
    session = await tutor_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    
    if str(session.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result = await tutor_service.end_session(
            session_id=session_id,
            final_answer=request.final_answer
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")


# ============================================
# Hint Endpoints
# ============================================

@router.post("/sessions/{session_id}/hint", response_model=HintResponse)
async def request_hint(
    session_id: str,
    request: HintRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Request a hint for the current question.
    
    Hints are provided at three levels:
    - Level 1: Socratic - asks a guiding question
    - Level 2: Directional - points to relevant concepts
    - Level 3: Explicit - provides direct guidance
    
    Maximum 3 hints per question.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Verify session ownership
    session = await tutor_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    
    if str(session.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        hint_response = await tutor_service.get_hint(
            session_id=session_id,
            level=request.level
        )
        return hint_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate hint: {str(e)}")


# ============================================
# Question/Response Endpoints
# ============================================

@router.post("/sessions/{session_id}/ask", response_model=TutorResponse)
async def ask_tutor_question(
    session_id: str,
    request: UserQuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Ask the tutor a question.
    
    The tutor will respond with guidance, potentially including
    a Socratic follow-up question to deepen understanding.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Verify session ownership
    session = await tutor_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    
    if str(session.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        response = await tutor_service.ask_question(
            session_id=session_id,
            user_question=request.question
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")


# ============================================
# Explanation Endpoints
# ============================================

@router.post("/sessions/{session_id}/explain", response_model=ExplanationResponse)
async def request_explanation(
    session_id: str,
    request: ExplanationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Request a detailed explanation of a concept.
    
    Explanations are personalized based on:
    - User's learning profile
    - Previous performance
    - Current context
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Verify session ownership
    session = await tutor_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    
    if str(session.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        response = await tutor_service.explain_concept(
            session_id=session_id,
            concept=request.concept,
            difficulty=request.difficulty
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")


# ============================================
# Answer Analysis Endpoints
# ============================================

@router.post("/sessions/{session_id}/analyze", response_model=AnswerAnalysisResponse)
async def analyze_answer(
    session_id: str,
    request: AnswerAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze the user's answer.
    
    Provides:
    - Correctness assessment
    - Reasoning gaps identified
    - Misconceptions detected
    - Topics for review
    - Encouraging feedback
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Verify session ownership
    session = await tutor_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    
    if str(session.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        response = await tutor_service.analyze_answer(
            session_id=session_id,
            answer=request.answer
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze answer: {str(e)}")


# ============================================
# History Endpoints
# ============================================

@router.get("/history", response_model=TutorHistoryResponse)
async def get_tutor_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get tutor session history for the current user.
    
    Returns a paginated list of past tutor sessions.
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    sessions, total_count = await tutor_service.get_history(
        user_id=str(user_id),
        limit=limit,
        offset=offset
    )
    
    return TutorHistoryResponse(
        sessions=sessions,
        total_count=total_count,
        page=offset // limit + 1,
        page_size=limit
    )


# ============================================
# Learning Insights Endpoints
# ============================================

@router.get("/insights", response_model=LearningInsightsResponse)
async def get_learning_insights(
    insight_type: Optional[str] = Query(default=None),
    resolved: Optional[bool] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get learning insights for the current user.
    
    Insights include:
    - Misconceptions identified
    - Knowledge gaps discovered
    - Strengths recognized
    - Weaknesses to work on
    - Study recommendations
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    insights = await tutor_service.get_insights(
        user_id=str(user_id),
        insight_type=insight_type,
        resolved=resolved
    )
    
    # Calculate counts by type
    by_type = {}
    for insight in insights:
        by_type[insight.insight_type] = by_type.get(insight.insight_type, 0) + 1
    
    return LearningInsightsResponse(
        insights=insights[:limit],
        total_count=len(insights),
        by_type=by_type
    )


# ============================================
# Dashboard Endpoints
# ============================================

@router.get("/dashboard", response_model=TutorDashboardStats)
async def get_tutor_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """
    Get tutor dashboard statistics for the current user.
    
    Returns:
    - Total sessions
    - Total hints used
    - Total messages
    - Average session duration
    - Top insights
    - Recent sessions
    """
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    stats = await tutor_service.get_dashboard_stats(str(user_id))
    return stats


# ============================================
# Health Check
# ============================================

@router.get("/status")
async def get_tutor_status():
    """
    Get the status of the tutor service.
    
    Returns whether the tutor is available and which mode it's running in.
    """
    return {
        "status": "available",
        "mode": "mock" if settings.use_mock_data else "production",
        "features": {
            "hints": True,
            "socratic_questions": True,
            "explanations": True,
            "answer_analysis": True,
            "learning_insights": True
        },
        "limits": {
            "max_hints_per_session": tutor_service.MAX_HINTS_PER_SESSION
        }
    }
