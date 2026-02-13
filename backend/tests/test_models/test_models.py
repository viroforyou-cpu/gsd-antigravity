"""
Tests for backend models.
"""
import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.question import Question, QuestionCreate, AnswerKey
from app.models.session import Session, SessionCreate, SessionAnswer, SessionUpdate
from app.models.reasoning import (
    ReasoningStep,
    AssociationReasoning,
    HypotheticoReasoning,
    ConstraintReasoning,
    ArgumentReasoning,
)


class TestQuestionModel:
    """Tests for Question model."""

    def test_question_creation(self):
        """Test creating a valid question."""
        question = Question(
            id='test-q1',
            stem='Test question stem',
            options={
                'A': 'Option A',
                'B': 'Option B',
                'C': 'Option C',
                'D': 'Option D',
                'E': 'Option E',
            },
            correct_answer='B',
            difficulty='medium',
            category='Test Category',
            created_at='2024-01-15T10:00:00Z',
        )
        
        assert question.id == 'test-q1'
        assert question.stem == 'Test question stem'
        assert question.correct_answer == 'B'
        assert question.difficulty == 'medium'
        assert question.category == 'Test Category'

    def test_question_with_partial_options(self):
        """Test that question accepts partial options dict (flexible model)."""
        # The model accepts Dict[str, str] so partial options are allowed
        question = Question(
            id='test-q1',
            stem='Test question stem',
            options={
                'A': 'Option A',
                'B': 'Option B',
            },
            correct_answer='B',
            difficulty='medium',
            category='Test Category',
            created_at='2024-01-15T10:00:00Z',
        )
        # Should succeed - model is flexible
        assert question.options['A'] == 'Option A'

    def test_question_accepts_any_difficulty(self):
        """Test that difficulty accepts any string value (flexible model)."""
        # The model uses Difficulty | str so any string is valid
        question = Question(
            id='test-q1',
            stem='Test question stem',
            options={
                'A': 'Option A',
                'B': 'Option B',
                'C': 'Option C',
                'D': 'Option D',
                'E': 'Option E',
            },
            correct_answer='B',
            difficulty='custom_difficulty',  # Custom difficulty
            category='Test Category',
            created_at='2024-01-15T10:00:00Z',
        )
        assert question.difficulty == 'custom_difficulty'

    def test_question_correct_answer_stored(self):
        """Test that correct_answer is stored as provided."""
        question = Question(
            id='test-q1',
            stem='Test question stem',
            options={
                'A': 'Option A',
                'B': 'Option B',
                'C': 'Option C',
                'D': 'Option D',
                'E': 'Option E',
            },
            correct_answer='E',
            difficulty='medium',
            category='Test Category',
            created_at='2024-01-15T10:00:00Z',
        )
        assert question.correct_answer == 'E'


class TestQuestionCreate:
    """Tests for QuestionCreate model."""

    def test_question_create(self):
        """Test creating a question create request."""
        question_create = QuestionCreate(
            stem='Test question stem',
            options={
                'A': 'Option A',
                'B': 'Option B',
                'C': 'Option C',
                'D': 'Option D',
                'E': 'Option E',
            },
            correct_answer='B',
            difficulty='medium',
            category='Test Category',
        )
        
        assert question_create.stem == 'Test question stem'
        assert question_create.correct_answer == 'B'


class TestSessionModel:
    """Tests for Session model."""

    def test_session_creation(self):
        """Test creating a valid session."""
        from app.models.session import SessionQuestion
        session = Session(
            id='session-1',
            questions=[
                SessionQuestion(
                    question=Question(
                        id='q1',
                        stem='Test question',
                        options={'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E'},
                        correct_answer='A',
                        difficulty='easy',
                        category='Test',
                        created_at='2024-01-15T10:00:00Z',
                    ),
                    order=0,
                )
            ],
            started_at='2024-01-15T10:00:00Z',
        )
        
        assert session.id == 'session-1'
        assert len(session.questions) == 1

    def test_session_with_answers(self):
        """Test session with answers."""
        from app.models.session import SessionQuestion
        session = Session(
            id='session-1',
            questions=[
                SessionQuestion(
                    question=Question(
                        id='q1',
                        stem='Test question',
                        options={'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E'},
                        correct_answer='A',
                        difficulty='easy',
                        category='Test',
                        created_at='2024-01-15T10:00:00Z',
                    ),
                    order=0,
                    user_answer='A',
                    is_correct=True,
                )
            ],
            started_at='2024-01-15T10:00:00Z',
        )
        
        assert session.questions[0].user_answer == 'A'


class TestSessionCreate:
    """Tests for SessionCreate model."""

    def test_session_create_defaults(self):
        """Test session create with default values."""
        session_create = SessionCreate()
        
        assert session_create.question_count == 5
        assert session_create.category is None
        assert session_create.difficulty is None

    def test_session_create_with_options(self):
        """Test session create with custom options."""
        session_create = SessionCreate(
            question_count=10,
            category='Lysosomal Storage Disorders',
            difficulty='hard',
        )
        
        assert session_create.question_count == 10
        assert session_create.category == 'Lysosomal Storage Disorders'
        assert session_create.difficulty == 'hard'


class TestSessionAnswer:
    """Tests for SessionAnswer model."""

    def test_session_answer(self):
        """Test creating a session answer."""
        answer = SessionAnswer(
            question_id='q1',
            answer='B',
        )
        
        assert answer.question_id == 'q1'
        assert answer.answer == 'B'

    def test_session_answer_with_time(self):
        """Test session answer with time spent."""
        answer = SessionAnswer(
            question_id='q1',
            answer='B',
            time_spent_seconds=45,
        )
        
        assert answer.time_spent_seconds == 45


class TestReasoningModels:
    """Tests for reasoning models."""

    def test_reasoning_step(self):
        """Test creating a reasoning step."""
        step = ReasoningStep(
            step_number=1,
            description='Test step',
            evidence=['evidence1', 'evidence2'],
            supports=['A'],
            opposes=['B'],
        )
        
        assert step.step_number == 1
        assert step.description == 'Test step'
        assert len(step.evidence) == 2

    def test_association_reasoning(self):
        """Test creating association reasoning."""
        reasoning = AssociationReasoning(
            strategy='association',
            question_id='q1',
            steps=[
                ReasoningStep(step_number=1, description='Step 1')
            ],
            conclusion='Test conclusion',
            confidence=0.95,
            correct_option='A',
            key_findings=['finding1', 'finding2'],
            linked_conditions=[
                {
                    'condition': 'Test condition',
                    'strength': 0.9,
                    'matching_findings': ['finding1'],
                }
            ],
        )
        
        assert reasoning.strategy == 'association'
        assert reasoning.confidence == 0.95
        assert len(reasoning.key_findings) == 2

    def test_hypothetico_reasoning(self):
        """Test creating hypothetico reasoning."""
        reasoning = HypotheticoReasoning(
            strategy='hypothetico',
            question_id='q1',
            steps=[
                ReasoningStep(step_number=1, description='Step 1')
            ],
            conclusion='Test conclusion',
            confidence=0.90,
            correct_option='A',
            hypotheses=[
                {
                    'option': 'A',
                    'hypothesis': 'Test hypothesis',
                    'predictions': ['pred1', 'pred2'],
                    'verified': True,
                    'falsified': False,
                }
            ],
        )
        
        assert reasoning.strategy == 'hypothetico'
        assert len(reasoning.hypotheses) == 1

    def test_constraint_reasoning(self):
        """Test creating constraint reasoning."""
        reasoning = ConstraintReasoning(
            strategy='constraints',
            question_id='q1',
            steps=[
                ReasoningStep(step_number=1, description='Step 1')
            ],
            conclusion='Test conclusion',
            confidence=0.99,
            correct_option='A',
            constraints=[
                {
                    'finding': 'Test finding',
                    'eliminates': ['B', 'C'],
                    'reason': 'Test reason',
                }
            ],
            remaining_options=['A'],
        )
        
        assert reasoning.strategy == 'constraints'
        assert len(reasoning.constraints) == 1

    def test_argument_reasoning(self):
        """Test creating argument reasoning."""
        reasoning = ArgumentReasoning(
            strategy='arguments',
            question_id='q1',
            steps=[
                ReasoningStep(step_number=1, description='Step 1')
            ],
            conclusion='Test conclusion',
            confidence=0.97,
            correct_option='A',
            arguments=[
                {
                    'option': 'A',
                    'pros': ['pro1', 'pro2'],
                    'cons': [],
                    'net_score': 5,
                }
            ],
        )
        
        assert reasoning.strategy == 'arguments'
        assert len(reasoning.arguments) == 1
