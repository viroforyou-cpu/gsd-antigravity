"""
Questions API Routes - Updated to use repository pattern.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from ...models.question import Question, QuestionCreate
from ...services.question_repository import question_repository

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/", response_model=list[Question])
async def get_questions(
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    limit: int = Query(20, ge=1, le=100, description="Number of questions to return"),
    offset: int = Query(0, ge=0, description="Number of questions to skip")
):
    """Get all questions with optional filtering."""
    return await question_repository.get_all(
        category=category,
        difficulty=difficulty,
        limit=limit,
        offset=offset
    )


@router.get("/categories", response_model=list[str])
async def get_categories():
    """Get all unique question categories."""
    return await question_repository.get_categories()


@router.get("/random", response_model=Question)
async def get_random_question(
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty")
):
    """Get a random question for practice."""
    question = await question_repository.get_random(
        category=category,
        difficulty=difficulty
    )
    if not question:
        raise HTTPException(status_code=404, detail="No questions found matching criteria")
    return question


@router.get("/{question_id}", response_model=Question)
async def get_question(question_id: str):
    """Get a single question by ID."""
    question = await question_repository.get_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("/", response_model=Question, status_code=201)
async def create_question(question: QuestionCreate):
    """Create a new question (admin only in production)."""
    try:
        return await question_repository.create(question)
    except NotImplementedError:
        raise HTTPException(status_code=501, detail="Question creation not available in mock mode")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
