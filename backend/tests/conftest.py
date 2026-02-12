"""
Shared fixtures for backend tests.
"""
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app


@pytest.fixture
def client():
    """Synchronous test client for FastAPI."""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Async test client for FastAPI."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_question():
    """Sample question for testing."""
    return {
        "id": "test-q1",
        "stem": "A 4-month-old infant presents with failure to thrive.",
        "options": {
            "A": "Niemann-Pick disease type A",
            "B": "Tay-Sachs disease",
            "C": "Gaucher disease type 1",
            "D": "Fabry disease",
            "E": "Krabbe disease"
        },
        "correct_answer": "B",
        "difficulty": "medium",
        "category": "Lysosomal Storage Disorders",
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_session():
    """Sample session for testing."""
    return {
        "id": "test-session-1",
        "questions": [],
        "answers": {},
        "started_at": "2024-01-01T00:00:00Z",
        "current_index": 0
    }


@pytest.fixture
def mock_reasoning_result():
    """Sample reasoning result for testing."""
    return {
        "strategy": "association",
        "question_id": "test-q1",
        "steps": [
            {
                "step_number": 1,
                "description": "Identify key findings",
                "evidence": ["cherry-red spot", "absent hex A"]
            }
        ],
        "conclusion": "Tay-Sachs disease",
        "confidence": 0.95
    }
