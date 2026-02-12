"""
LLM API Routes - endpoints for question generation and reasoning.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from ...services.llm_service import llm_service


router = APIRouter(prefix="/llm", tags=["llm"])


# Request/Response Models
class GenerateQuestionRequest(BaseModel):
    """Request model for question generation."""
    category: str
    difficulty: str = "medium"
    topic_hints: Optional[List[str]] = None


class GenerateReasoningRequest(BaseModel):
    """Request model for reasoning generation."""
    question: dict
    strategy: str  # association, hypothetico, constraints, arguments


class GenerateExplanationRequest(BaseModel):
    """Request model for explanation generation."""
    question: dict
    correct_answer: str


# Endpoints
@router.post("/generate-question")
async def generate_question(request: GenerateQuestionRequest):
    """
    Generate a new MCQ question using LLM.
    
    - **category**: Medical genetics category (e.g., "Lysosomal Storage Disorders")
    - **difficulty**: Question difficulty (easy, medium, hard)
    - **topic_hints**: Optional list of specific topics to focus on
    """
    try:
        service = llm_service()
        question = await service.generate_question(
            category=request.category,
            difficulty=request.difficulty,
            topic_hints=request.topic_hints
        )
        
        if "error" in question:
            raise HTTPException(status_code=500, detail=question["error"])
        
        return question
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-reasoning")
async def generate_reasoning(request: GenerateReasoningRequest):
    """
    Generate reasoning for a question using specified strategy.
    
    - **question**: The question object with stem, options, and correct_answer
    - **strategy**: Reasoning strategy to use
      - "association": Graph-based association reasoning
      - "hypothetico": Hypothetico-deductive reasoning
      - "constraints": Constraint satisfaction reasoning
      - "arguments": Argument-based reasoning
    """
    valid_strategies = ["association", "hypothetico", "constraints", "arguments"]
    if request.strategy not in valid_strategies:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid strategy. Must be one of: {valid_strategies}"
        )
    
    try:
        service = llm_service()
        reasoning = await service.generate_reasoning(
            question=request.question,
            strategy=request.strategy
        )
        
        if "error" in reasoning:
            raise HTTPException(status_code=500, detail=reasoning["error"])
        
        return reasoning
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-explanation")
async def generate_explanation(request: GenerateExplanationRequest):
    """
    Generate explanation for a question's correct answer.
    
    - **question**: The question object
    - **correct_answer**: The letter of the correct answer (A-E)
    """
    if request.correct_answer not in ["A", "B", "C", "D", "E"]:
        raise HTTPException(
            status_code=400,
            detail="correct_answer must be one of: A, B, C, D, E"
        )
    
    try:
        service = llm_service()
        explanation = await service.generate_explanation(
            question=request.question,
            correct_answer=request.correct_answer
        )
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategies")
async def get_reasoning_strategies():
    """Get list of available reasoning strategies."""
    return {
        "strategies": [
            {
                "id": "association",
                "name": "Association/Graph-Based",
                "description": "Identifies key findings and maps them to associated conditions"
            },
            {
                "id": "hypothetico",
                "name": "Hypothetico-Deductive",
                "description": "Forms hypotheses and tests them against clinical evidence"
            },
            {
                "id": "constraints",
                "name": "Constraint Satisfaction",
                "description": "Applies clinical constraints to systematically eliminate options"
            },
            {
                "id": "arguments",
                "name": "Argument-Based",
                "description": "Builds and compares arguments for and against each option"
            }
        ]
    }


@router.get("/status")
async def get_llm_status():
    """Get LLM service status and configuration."""
    from ...core.config import settings
    
    return {
        "mock_mode": settings.use_mock_llm,
        "model": settings.llm_model if not settings.use_mock_llm else "mock",
        "api_configured": bool(settings.llm_api_url and settings.llm_api_key)
    }
