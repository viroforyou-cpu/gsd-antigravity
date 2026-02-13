"""
Tests for Tutor API Routes.

Phase 23: AI Tutor Mode Testing
"""
import pytest
from datetime import datetime
from uuid import UUID, uuid4
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.main import app
from app.api.routes.tutor import router as tutor_router
from app.services.auth_service import get_current_user
from app.models.tutor import (
    TutorSession,
    TutorSessionWithMessages,
    TutorMessage,
    Hint,
    HintResponse,
    Explanation,
    ExplanationResponse,
    AnswerAnalysis,
    AnswerAnalysisResponse,
    LearningInsight,
    TutorSessionSummary,
    TutorSessionEndResponse,
    TutorResponse,
    TutorHistoryResponse,
    TutorDashboardStats,
    TutorSessionHistory
)


# ============================================
# Fixtures
# ============================================

# Fixed test user ID for consistent testing
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


class MockUser:
    """Mock user object with id attribute."""
    def __init__(self):
        self.id = TEST_USER_ID
        self.email = "test@example.com"
        self.role = "user"


@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    return MockUser()


@pytest.fixture
def mock_user_id():
    """Get the user ID for testing."""
    return TEST_USER_ID


@pytest.fixture
def mock_question_id():
    """Sample question UUID."""
    return uuid4()


@pytest.fixture
def mock_session_id():
    """Sample session UUID."""
    return uuid4()


@pytest.fixture
def mock_tutor_session(mock_user_id, mock_question_id, mock_session_id):
    """Mock tutor session."""
    return TutorSession(
        id=mock_session_id,
        user_id=UUID(mock_user_id),
        question_id=mock_question_id,
        started_at=datetime.utcnow(),
        ended_at=None,
        status="active",
        hint_count=0,
        message_count=1,
        learning_insights=[],
        created_at=datetime.utcnow()
    )


@pytest.fixture
def mock_tutor_session_with_messages(mock_user_id, mock_tutor_session, mock_session_id):
    """Mock tutor session with messages."""
    # Ensure user_id is consistent
    session_dict = mock_tutor_session.model_dump()
    session_dict['user_id'] = UUID(mock_user_id)
    return TutorSessionWithMessages(
        **session_dict,
        messages=[
            TutorMessage(
                id=uuid4(),
                session_id=mock_session_id,
                content="Welcome! Let's work through this question together.",
                role="tutor",
                message_type="greeting",
                metadata={},
                created_at=datetime.utcnow()
            )
        ]
    )


@pytest.fixture
def mock_hint():
    """Mock hint response."""
    return Hint(
        id=uuid4(),
        level=1,
        content="What key findings in the stem might help you narrow down the diagnosis?",
        focuses_on=["clinical findings", "diagnostic reasoning"],
        related_options=None,
        created_at=datetime.utcnow()
    )


@pytest.fixture
def mock_explanation():
    """Mock explanation."""
    return Explanation(
        concept="Tay-Sachs disease",
        content="Tay-Sachs disease is a lysosomal storage disorder caused by deficiency of hexosaminidase A enzyme...",
        difficulty="intermediate",
        related_questions=[uuid4(), uuid4()],
        visual_aids=[],
        created_at=datetime.utcnow()
    )


@pytest.fixture
def mock_answer_analysis():
    """Mock answer analysis."""
    return AnswerAnalysis(
        is_correct=True,
        reasoning_gaps=[],
        misconceptions=[],
        suggested_review=["lysosomal storage disorders"],
        encouraging_feedback="Excellent work! You correctly identified the key findings.",
        correct_reasoning=None
    )


@pytest.fixture
def mock_learning_insight(mock_user_id):
    """Mock learning insight."""
    return LearningInsight(
        id=uuid4(),
        user_id=UUID(mock_user_id),
        insight_type="strength",
        topic="lysosomal storage disorders",
        description="Strong understanding of Tay-Sachs disease presentation",
        severity=None,
        first_identified=datetime.utcnow(),
        last_updated=datetime.utcnow(),
        occurrence_count=1,
        resolved=False,
        resolved_at=None
    )


# ============================================
# Test Cases
# ============================================

class TestTutorSessionEndpoints:
    """Tests for tutor session endpoints."""

    @pytest.mark.asyncio
    async def test_start_tutor_session_success(self, mock_user, mock_question_id, mock_tutor_session_with_messages):
        """Test successful session creation."""
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.start_session', new_callable=AsyncMock) as mock_start:
                mock_start.return_value = mock_tutor_session_with_messages
                
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.post(
                        "/api/v1/tutor/sessions",
                        json={"question_id": str(mock_question_id)}
                    )
                
                assert response.status_code == 200
                data = response.json()
                assert "id" in data
                assert data["status"] == "active"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_start_tutor_session_unauthorized(self, mock_question_id):
        """Test session creation without authentication."""
        async def override_get_current_user():
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/tutor/sessions",
                    json={"question_id": str(mock_question_id)}
                )
            
            assert response.status_code == 401
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_tutor_session_success(self, mock_user, mock_session_id, mock_tutor_session_with_messages):
        """Test getting a tutor session."""
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                mock_get.return_value = mock_tutor_session_with_messages
                
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(f"/api/v1/tutor/sessions/{mock_session_id}")
                
                assert response.status_code == 200
                data = response.json()
                assert data["id"] == str(mock_session_id)
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_tutor_session_not_found(self, mock_user, mock_session_id):
        """Test getting a non-existent session."""
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                mock_get.return_value = None
                
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(f"/api/v1/tutor/sessions/{mock_session_id}")
                
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_tutor_session_wrong_user(self, mock_user, mock_session_id, mock_tutor_session_with_messages):
        """Test accessing another user's session."""
        other_user_id = uuid4()
        mock_tutor_session_with_messages.user_id = other_user_id
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                mock_get.return_value = mock_tutor_session_with_messages
                
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get(f"/api/v1/tutor/sessions/{mock_session_id}")
                
                assert response.status_code == 403
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_end_tutor_session_success(self, mock_user, mock_session_id, mock_tutor_session_with_messages):
        """Test ending a tutor session."""
        mock_summary = TutorSessionSummary(
            id=mock_session_id,
            question_id=mock_tutor_session_with_messages.question_id,
            started_at=datetime.utcnow(),
            ended_at=datetime.utcnow(),
            duration_seconds=300,
            hint_count=2,
            message_count=5,
            insights_generated=3,
            key_learnings=["Understanding of lysosomal storage disorders"]
        )
        
        mock_end_response = TutorSessionEndResponse(
            summary=mock_summary,
            insights=[]
        )
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                with patch('app.api.routes.tutor.tutor_service.end_session', new_callable=AsyncMock) as mock_end:
                    mock_get.return_value = mock_tutor_session_with_messages
                    mock_end.return_value = mock_end_response
                    
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.post(
                            f"/api/v1/tutor/sessions/{mock_session_id}/end",
                            json={"session_id": str(mock_session_id)}
                        )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert "summary" in data
        finally:
            app.dependency_overrides.clear()


class TestHintEndpoints:
    """Tests for hint endpoints."""

    @pytest.mark.asyncio
    async def test_request_hint_success(self, mock_user, mock_session_id, mock_tutor_session_with_messages, mock_hint):
        """Test successful hint request."""
        mock_hint_response = HintResponse(
            hint=mock_hint,
            hint_count=1,
            max_hints=3
        )
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                with patch('app.api.routes.tutor.tutor_service.get_hint', new_callable=AsyncMock) as mock_hint_svc:
                    mock_get.return_value = mock_tutor_session_with_messages
                    mock_hint_svc.return_value = mock_hint_response
                    
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.post(
                            f"/api/v1/tutor/sessions/{mock_session_id}/hint",
                            json={"session_id": str(mock_session_id), "level": 1}
                        )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert "hint" in data
                    assert data["hint"]["level"] == 1
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_request_hint_max_reached(self, mock_user, mock_session_id, mock_tutor_session_with_messages):
        """Test hint request when max hints reached."""
        mock_tutor_session_with_messages.hint_count = 3
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                with patch('app.api.routes.tutor.tutor_service.get_hint', new_callable=AsyncMock) as mock_hint_svc:
                    mock_get.return_value = mock_tutor_session_with_messages
                    mock_hint_svc.side_effect = ValueError("Maximum hints reached for this question")
                    
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.post(
                            f"/api/v1/tutor/sessions/{mock_session_id}/hint",
                            json={"session_id": str(mock_session_id)}
                        )
                    
                    assert response.status_code == 400
        finally:
            app.dependency_overrides.clear()


class TestQuestionEndpoints:
    """Tests for question/ask endpoints."""

    @pytest.mark.asyncio
    async def test_ask_tutor_question_success(self, mock_user, mock_session_id, mock_tutor_session_with_messages):
        """Test asking tutor a question."""
        mock_message = TutorMessage(
            id=uuid4(),
            session_id=mock_session_id,
            content="That's a great question! Let me help you think through this...",
            role="tutor",
            message_type="guidance",
            metadata={},
            created_at=datetime.utcnow()
        )
        
        mock_response = TutorResponse(
            message=mock_message,
            socratic_question=None,
            suggested_actions=["Consider the inheritance pattern"]
        )
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                with patch('app.api.routes.tutor.tutor_service.ask_question', new_callable=AsyncMock) as mock_ask:
                    mock_get.return_value = mock_tutor_session_with_messages
                    mock_ask.return_value = mock_response
                    
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.post(
                            f"/api/v1/tutor/sessions/{mock_session_id}/ask",
                            json={"session_id": str(mock_session_id), "question": "What is the inheritance pattern?"}
                        )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert "message" in data
        finally:
            app.dependency_overrides.clear()


class TestExplanationEndpoints:
    """Tests for explanation endpoints."""

    @pytest.mark.asyncio
    async def test_request_explanation_success(self, mock_user, mock_session_id, mock_tutor_session_with_messages, mock_explanation):
        """Test requesting an explanation."""
        mock_explanation_response = ExplanationResponse(explanation=mock_explanation)
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                with patch('app.api.routes.tutor.tutor_service.explain_concept', new_callable=AsyncMock) as mock_explain:
                    mock_get.return_value = mock_tutor_session_with_messages
                    mock_explain.return_value = mock_explanation_response
                    
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.post(
                            f"/api/v1/tutor/sessions/{mock_session_id}/explain",
                            json={"session_id": str(mock_session_id), "concept": "Tay-Sachs disease"}
                        )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert "explanation" in data
                    assert data["explanation"]["concept"] == "Tay-Sachs disease"
        finally:
            app.dependency_overrides.clear()


class TestAnswerAnalysisEndpoints:
    """Tests for answer analysis endpoints."""

    @pytest.mark.asyncio
    async def test_analyze_answer_correct(self, mock_user, mock_session_id, mock_tutor_session_with_messages, mock_answer_analysis):
        """Test analyzing a correct answer."""
        mock_analysis_response = AnswerAnalysisResponse(
            analysis=mock_answer_analysis,
            session_ended=False
        )
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                with patch('app.api.routes.tutor.tutor_service.analyze_answer', new_callable=AsyncMock) as mock_analyze:
                    mock_get.return_value = mock_tutor_session_with_messages
                    mock_analyze.return_value = mock_analysis_response
                    
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.post(
                            f"/api/v1/tutor/sessions/{mock_session_id}/analyze",
                            json={"session_id": str(mock_session_id), "answer": "B"}
                        )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["analysis"]["is_correct"] == True
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_analyze_answer_incorrect(self, mock_user, mock_session_id, mock_tutor_session_with_messages):
        """Test analyzing an incorrect answer."""
        mock_analysis = AnswerAnalysis(
            is_correct=False,
            reasoning_gaps=["Failed to consider enzyme deficiency pattern"],
            misconceptions=["Confused Tay-Sachs with Niemann-Pick"],
            suggested_review=["lysosomal storage disorders", "enzyme deficiencies"],
            encouraging_feedback="Good effort! Let's review the key differences.",
            correct_reasoning="The cherry-red spot with absent hex A points to Tay-Sachs..."
        )
        
        mock_analysis_response = AnswerAnalysisResponse(
            analysis=mock_analysis,
            session_ended=False
        )
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_session', new_callable=AsyncMock) as mock_get:
                with patch('app.api.routes.tutor.tutor_service.analyze_answer', new_callable=AsyncMock) as mock_analyze:
                    mock_get.return_value = mock_tutor_session_with_messages
                    mock_analyze.return_value = mock_analysis_response
                    
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                        response = await client.post(
                            f"/api/v1/tutor/sessions/{mock_session_id}/analyze",
                            json={"session_id": str(mock_session_id), "answer": "A"}
                        )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["analysis"]["is_correct"] == False
                    assert len(data["analysis"]["misconceptions"]) > 0
        finally:
            app.dependency_overrides.clear()


class TestHistoryEndpoints:
    """Tests for history endpoints."""

    @pytest.mark.asyncio
    async def test_get_tutor_history_success(self, mock_user, mock_question_id):
        """Test getting tutor session history."""
        mock_sessions = [
            TutorSessionHistory(
                id=uuid4(),
                question_id=mock_question_id,
                question_preview="A 4-month-old infant presents with failure to thrive...",
                started_at=datetime.utcnow(),
                ended_at=datetime.utcnow(),
                status="completed",
                hint_count=2,
                message_count=5
            )
        ]
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_history', new_callable=AsyncMock) as mock_history_svc:
                mock_history_svc.return_value = (mock_sessions, 1)
                
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get("/api/v1/tutor/history")
                
                assert response.status_code == 200
                data = response.json()
                assert "sessions" in data
                assert data["total_count"] >= 0
        finally:
            app.dependency_overrides.clear()


class TestInsightsEndpoints:
    """Tests for insights endpoints."""

    @pytest.mark.asyncio
    async def test_get_insights_success(self, mock_user, mock_learning_insight):
        """Test getting learning insights."""
        mock_insights_response = [mock_learning_insight]
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_insights', new_callable=AsyncMock) as mock_insights:
                mock_insights.return_value = mock_insights_response
                
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get("/api/v1/tutor/insights")
                
                assert response.status_code == 200
                data = response.json()
                assert "insights" in data
        finally:
            app.dependency_overrides.clear()


class TestDashboardEndpoints:
    """Tests for dashboard endpoints."""

    @pytest.mark.asyncio
    async def test_get_dashboard_stats_success(self, mock_user):
        """Test getting dashboard statistics."""
        mock_dashboard = TutorDashboardStats(
            total_sessions=10,
            total_hints_used=25,
            total_messages=150,
            average_session_duration=180.5,
            top_insights=[],
            recent_sessions=[]
        )
        
        async def override_get_current_user():
            return mock_user
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        try:
            with patch('app.api.routes.tutor.tutor_service.get_dashboard_stats', new_callable=AsyncMock) as mock_stats:
                mock_stats.return_value = mock_dashboard
                
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    response = await client.get("/api/v1/tutor/dashboard")
                
                assert response.status_code == 200
                data = response.json()
                assert "total_sessions" in data
                assert data["total_sessions"] == 10
        finally:
            app.dependency_overrides.clear()


class TestStatusEndpoint:
    """Tests for status endpoint."""

    @pytest.mark.asyncio
    async def test_get_tutor_status(self):
        """Test getting tutor status."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/tutor/status")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "available"
        assert "features" in data
