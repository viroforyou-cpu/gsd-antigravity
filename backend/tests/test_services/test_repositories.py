"""
Tests for backend repositories.
"""
import pytest
from datetime import datetime

from app.services.question_repository import QuestionRepository
from app.services.session_repository import SessionRepository
from app.models.question import QuestionCreate
from app.models.session import SessionCreate, SessionAnswer


class TestQuestionRepository:
    """Tests for QuestionRepository."""

    @pytest.fixture
    def repository(self):
        """Create a repository instance."""
        return QuestionRepository()

    @pytest.mark.asyncio
    async def test_get_all_returns_questions(self, repository):
        """Test that get_all returns a list of questions."""
        questions = await repository.get_all()
        assert isinstance(questions, list)
        assert len(questions) > 0

    @pytest.mark.asyncio
    async def test_get_all_filters_by_category(self, repository):
        """Test that get_all filters by category."""
        # Get all categories first
        categories = await repository.get_categories()
        if categories:
            questions = await repository.get_all(category=categories[0])
            for q in questions:
                assert q.category == categories[0]

    @pytest.mark.asyncio
    async def test_get_all_filters_by_difficulty(self, repository):
        """Test that get_all filters by difficulty."""
        questions = await repository.get_all(difficulty='easy')
        for q in questions:
            assert q.difficulty == 'easy'

    @pytest.mark.asyncio
    async def test_get_all_respects_limit(self, repository):
        """Test that get_all respects the limit parameter."""
        questions = await repository.get_all(limit=3)
        assert len(questions) <= 3

    @pytest.mark.asyncio
    async def test_get_by_id_returns_question(self, repository):
        """Test that get_by_id returns a question."""
        # First get all to find an ID
        questions = await repository.get_all(limit=1)
        if questions:
            question = await repository.get_by_id(questions[0].id)
            assert question is not None
            assert question.id == questions[0].id

    @pytest.mark.asyncio
    async def test_get_by_id_returns_none_for_invalid_id(self, repository):
        """Test that get_by_id returns None for invalid ID."""
        question = await repository.get_by_id('invalid-id-12345')
        assert question is None

    @pytest.mark.asyncio
    async def test_get_random_returns_question(self, repository):
        """Test that get_random returns a question."""
        question = await repository.get_random()
        assert question is not None
        assert hasattr(question, 'id')
        assert hasattr(question, 'stem')

    @pytest.mark.asyncio
    async def test_get_random_excludes_ids(self, repository):
        """Test that get_random excludes specified IDs."""
        # Get all questions first
        all_questions = await repository.get_all(limit=5)
        if len(all_questions) > 1:
            exclude_ids = [all_questions[0].id]
            question = await repository.get_random(exclude_ids=exclude_ids)
            if question:
                assert question.id not in exclude_ids

    @pytest.mark.asyncio
    async def test_get_categories_returns_list(self, repository):
        """Test that get_categories returns a list of categories."""
        categories = await repository.get_categories()
        assert isinstance(categories, list)
        assert len(categories) > 0


class TestSessionRepository:
    """Tests for SessionRepository."""

    @pytest.fixture
    def repository(self):
        """Create a repository instance."""
        return SessionRepository()

    @pytest.mark.asyncio
    async def test_create_session(self, repository):
        """Test creating a new session."""
        session_create = SessionCreate(
            question_count=5,
            category=None,
            difficulty=None,
        )
        session = await repository.create(session_create)
        
        assert session is not None
        assert session.id is not None
        assert len(session.questions) > 0
        assert session.started_at is not None

    @pytest.mark.asyncio
    async def test_get_by_id_returns_session(self, repository):
        """Test that get_by_id returns a session."""
        # Create a session first
        session_create = SessionCreate(question_count=3)
        created = await repository.create(session_create)
        
        # Retrieve it
        session = await repository.get_by_id(created.id)
        assert session is not None
        assert session.id == created.id

    @pytest.mark.asyncio
    async def test_get_by_id_returns_none_for_invalid_id(self, repository):
        """Test that get_by_id returns None for invalid ID."""
        session = await repository.get_by_id('invalid-session-id')
        assert session is None

    @pytest.mark.asyncio
    async def test_submit_answer(self, repository):
        """Test submitting an answer."""
        # Create a session
        session_create = SessionCreate(question_count=3)
        session = await repository.create(session_create)
        
        # Submit an answer
        question_id = session.questions[0].id
        answer = SessionAnswer(
            question_id=question_id,
            answer='A',
        )
        
        updated_session = await repository.submit_answer(session.id, answer)
        assert updated_session is not None
        assert question_id in updated_session.answers
        assert updated_session.answers[question_id] == 'A'

    @pytest.mark.asyncio
    async def test_complete_session(self, repository):
        """Test completing a session."""
        # Create and answer a session
        session_create = SessionCreate(question_count=3)
        session = await repository.create(session_create)
        
        # Answer all questions
        for question in session.questions:
            answer = SessionAnswer(
                question_id=question.id,
                answer='A',
            )
            await repository.submit_answer(session.id, answer)
        
        # Complete the session
        completed = await repository.complete(session.id)
        assert completed is not None
        assert completed.completed_at is not None

    @pytest.mark.asyncio
    async def test_get_review(self, repository):
        """Test getting session review."""
        # Create and complete a session
        session_create = SessionCreate(question_count=3)
        session = await repository.create(session_create)
        
        # Answer questions
        for question in session.questions:
            answer = SessionAnswer(
                question_id=question.id,
                answer='A',
            )
            await repository.submit_answer(session.id, answer)
        
        await repository.complete(session.id)
        
        # Get review
        review = await repository.get_review(session.id)
        assert review is not None
        assert 'session' in review
        assert 'questions' in review
        assert 'summary' in review
