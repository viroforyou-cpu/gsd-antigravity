"""
Sessions API Routes - Updated to use repository pattern.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from ...models.session import (
    Session,
    SessionCreate,
    SessionAnswerSubmit,
    SessionResult,
    SessionQuestion,
    SessionAnswer,
)
from ...services.session_repository import session_repository

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", response_model=Session, status_code=201)
async def create_session(session_data: SessionCreate):
    """Create a new practice session."""
    try:
        session = await session_repository.create(session_data)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}", response_model=Session)
async def get_session(session_id: str):
    """Get session details."""
    session = await session_repository.get_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/answer", response_model=Session)
async def submit_answer(session_id: str, answer_data: SessionAnswerSubmit):
    """Submit an answer for a question in the session."""
    answer = SessionAnswer(
        question_id=answer_data.question_id,
        answer=answer_data.answer,
        time_spent_seconds=answer_data.time_spent_seconds
    )
    
    session = await session_repository.submit_answer(session_id, answer)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


@router.post("/{session_id}/complete", response_model=SessionResult)
async def complete_session(session_id: str):
    """Complete a session and get results."""
    session = await session_repository.complete(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Build result
    correct_count = sum(1 for sq in session.questions if sq.is_correct)
    total_questions = len(session.questions)
    
    answer_details = [
        {
            "question_id": sq.question.id,
            "user_answer": sq.user_answer,
            "correct_answer": sq.question.correct_answer,
            "is_correct": sq.is_correct,
        }
        for sq in session.questions
    ]
    
    return SessionResult(
        id=session.id,
        total_questions=total_questions,
        correct_answers=correct_count,
        accuracy=correct_count / total_questions if total_questions > 0 else 0,
        answers=answer_details,
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


@router.get("/{session_id}/review", response_model=SessionResult)
async def get_session_review(session_id: str):
    """Get full session review with answers."""
    review = await session_repository.get_review(session_id)
    if not review:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = review["session"]
    stats = review["stats"]
    
    answer_details = [
        {
            "question_id": sq.question.id,
            "user_answer": sq.user_answer,
            "correct_answer": sq.question.correct_answer,
            "is_correct": sq.is_correct,
            "explanation": sq.question.explanation,
        }
        for sq in session.questions
    ]
    
    return SessionResult(
        id=session.id,
        total_questions=stats.total_questions,
        correct_answers=stats.correct_answers,
        accuracy=stats.accuracy,
        answers=answer_details,
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


@router.get("/user/{user_id}", response_model=list[Session])
async def get_user_sessions(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all sessions for a user."""
    return await session_repository.get_user_sessions(user_id, limit, offset)
