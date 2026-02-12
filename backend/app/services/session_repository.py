"""
Session Repository - handles all session data access.
Supports mock data, Supabase, and direct PostgreSQL via SQLAlchemy.
"""
from typing import List, Optional, Dict
from datetime import datetime
from uuid import uuid4
import json
from sqlalchemy import text

from ..core.config import settings
from ..core.database import get_supabase_client, is_database_connected, get_engine
from ..models.session import (
    Session, SessionCreate, SessionUpdate, SessionAnswer,
    SessionQuestion, SessionStats
)
from ..models.question import Question
from .question_repository import question_repository


class SessionRepository:
    """Repository for session data access."""
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
        self._mock_sessions: Dict[str, Session] = {}
        self._engine = get_engine()
    
    async def create(self, session_create: SessionCreate) -> Session:
        """Create a new practice session."""
        # Get questions for the session
        questions = await self._get_session_questions(session_create)
        
        if self._use_mock:
            return self._create_mock_session(session_create, questions)
        
        if self._engine:
            return await self._create_sqlalchemy_session(session_create, questions)
        
        return await self._create_db_session(session_create, questions)
    
    async def get_by_id(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        if self._use_mock:
            return self._mock_sessions.get(session_id)
        
        if self._engine:
            return await self._get_sqlalchemy_session(session_id)
        
        return await self._get_db_session(session_id)
    
    async def submit_answer(self, session_id: str, answer: SessionAnswer) -> Optional[Session]:
        """Submit an answer for a question in a session."""
        if self._use_mock:
            return self._submit_mock_answer(session_id, answer)
        
        if self._engine:
            return await self._submit_sqlalchemy_answer(session_id, answer)
        
        return await self._submit_db_answer(session_id, answer)
    
    async def complete(self, session_id: str) -> Optional[Session]:
        """Mark a session as completed."""
        if self._use_mock:
            return self._complete_mock_session(session_id)
        
        if self._engine:
            return await self._complete_sqlalchemy_session(session_id)
        
        return await self._complete_db_session(session_id)
    
    async def get_user_sessions(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Session]:
        """Get all sessions for a user."""
        if self._use_mock:
            return [
                s for s in self._mock_sessions.values()
                if s.user_id == user_id
            ][offset:offset + limit]
        
        if self._engine:
            return await self._get_sqlalchemy_user_sessions(user_id, limit, offset)
        
        return await self._get_db_user_sessions(user_id, limit, offset)
    
    async def get_review(self, session_id: str) -> Optional[Dict]:
        """Get detailed review data for a completed session."""
        session = await self.get_by_id(session_id)
        if not session:
            return None
        
        # Build review data
        review = {
            "session": session,
            "questions": [],
            "stats": SessionStats(
                total_questions=len(session.questions),
                correct_answers=sum(1 for sq in session.questions if sq.is_correct),
                time_spent_seconds=session.time_spent_seconds or 0,
                accuracy=0.0
            )
        }
        
        if session.questions:
            review["stats"].accuracy = review["stats"].correct_answers / review["stats"].total_questions
        
        return review
    
    # ========================================
    # Helper Methods
    # ========================================
    
    async def _get_session_questions(self, session_create: SessionCreate) -> List[Question]:
        """Get questions for a new session."""
        questions = []
        exclude_ids = []
        
        for _ in range(session_create.question_count):
            question = await question_repository.get_random(
                category=session_create.category,
                difficulty=session_create.difficulty,
                exclude_ids=exclude_ids
            )
            if question:
                questions.append(question)
                exclude_ids.append(question.id)
        
        return questions
    
    # ========================================
    # Mock Data Methods
    # ========================================
    
    def _create_mock_session(
        self,
        session_create: SessionCreate,
        questions: List[Question]
    ) -> Session:
        """Create a mock session."""
        session_id = str(uuid4())
        
        session_questions = [
            SessionQuestion(
                question=q,
                order=i,
                user_answer=None,
                is_correct=None,
                time_spent_seconds=0
            )
            for i, q in enumerate(questions)
        ]
        
        session = Session(
            id=session_id,
            user_id=session_create.user_id,
            questions=session_questions,
            started_at=datetime.utcnow(),
            completed_at=None,
            status="active",
            settings=session_create.model_dump(),
            time_spent_seconds=0
        )
        
        self._mock_sessions[session_id] = session
        return session
    
    def _submit_mock_answer(
        self,
        session_id: str,
        answer: SessionAnswer
    ) -> Optional[Session]:
        """Submit an answer to a mock session."""
        session = self._mock_sessions.get(session_id)
        if not session:
            return None
        
        # Find the question
        for sq in session.questions:
            if sq.question.id == answer.question_id:
                sq.user_answer = answer.answer
                sq.is_correct = sq.question.correct_answer == answer.answer
                sq.time_spent_seconds = answer.time_spent_seconds or 0
                break
        
        return session
    
    def _complete_mock_session(self, session_id: str) -> Optional[Session]:
        """Complete a mock session."""
        session = self._mock_sessions.get(session_id)
        if not session:
            return None
        
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        
        # Calculate total time
        session.time_spent_seconds = sum(
            sq.time_spent_seconds for sq in session.questions
        )
        
        return session
    
    # ========================================
    # SQLAlchemy Methods (Direct PostgreSQL)
    # ========================================
    
    async def _create_sqlalchemy_session(
        self,
        session_create: SessionCreate,
        questions: List[Question]
    ) -> Session:
        """Create a session using SQLAlchemy."""
        # Create session record
        session_query = """
            INSERT INTO sessions (user_id, status, settings, total_questions)
            VALUES (:user_id, 'active', :settings, :total_questions)
            RETURNING id, started_at
        """
        session_params = {
            "user_id": session_create.user_id,
            "settings": json.dumps(session_create.model_dump()),
            "total_questions": len(questions)
        }
        
        with self._engine.connect() as conn:
            result = conn.execute(text(session_query), session_params)
            session_row = result.fetchone()
            session_id = str(session_row[0])
            started_at = session_row[1]
            conn.commit()
            
            # Create session_questions records
            for i, q in enumerate(questions):
                sq_query = """
                    INSERT INTO session_questions (session_id, question_id, question_order)
                    VALUES (:session_id, :question_id, :question_order)
                """
                conn.execute(text(sq_query), {
                    "session_id": session_id,
                    "question_id": q.id,
                    "question_order": i
                })
            conn.commit()
        
        # Build session object
        session_questions = [
            SessionQuestion(
                question=q,
                order=i,
                user_answer=None,
                is_correct=None,
                time_spent_seconds=0
            )
            for i, q in enumerate(questions)
        ]
        
        return Session(
            id=session_id,
            user_id=session_create.user_id,
            questions=session_questions,
            started_at=started_at.isoformat() if hasattr(started_at, 'isoformat') else str(started_at),
            completed_at=None,
            status="active",
            settings=session_create.model_dump(),
            time_spent_seconds=0
        )
    
    async def _get_sqlalchemy_session(self, session_id: str) -> Optional[Session]:
        """Get a session using SQLAlchemy."""
        # Get session
        session_query = "SELECT * FROM sessions WHERE id = :id"
        
        with self._engine.connect() as conn:
            result = conn.execute(text(session_query), {"id": session_id})
            session_row = result.fetchone()
            if not session_row:
                return None
            
            # Get session questions with question data
            sq_query = """
                SELECT sq.*, q.stem, q.options, q.correct_answer, q.difficulty, 
                       q.category, q.subcategory, q.source_reference, q.explanation, 
                       q.key_concepts, q.created_at as q_created_at, q.times_answered, q.times_correct
                FROM session_questions sq
                JOIN questions q ON sq.question_id = q.id
                WHERE sq.session_id = :session_id
                ORDER BY sq.question_order
            """
            sq_result = conn.execute(text(sq_query), {"session_id": session_id})
            sq_rows = sq_result.fetchall()
            
            session_questions = []
            for sq_row in sq_rows:
                # Build question from row
                question = Question(
                    id=str(sq_row.question_id),
                    stem=sq_row.stem,
                    options=sq_row.options,
                    correct_answer=sq_row.correct_answer,
                    difficulty=sq_row.difficulty,
                    category=sq_row.category,
                    subcategory=sq_row.subcategory,
                    source_reference=sq_row.source_reference,
                    explanation=sq_row.explanation,
                    key_concepts=sq_row.key_concepts or [],
                    created_at=sq_row.q_created_at.isoformat() if hasattr(sq_row.q_created_at, 'isoformat') else str(sq_row.q_created_at),
                    times_answered=sq_row.times_answered or 0,
                    times_correct=sq_row.times_correct or 0
                )
                
                session_questions.append(SessionQuestion(
                    question=question,
                    order=sq_row.question_order,
                    user_answer=sq_row.user_answer,
                    is_correct=sq_row.is_correct,
                    time_spent_seconds=sq_row.time_spent_seconds or 0
                ))
        
        started_at = session_row.started_at
        completed_at = session_row.completed_at
        
        return Session(
            id=str(session_row.id),
            user_id=str(session_row.user_id) if session_row.user_id else None,
            questions=session_questions,
            started_at=started_at.isoformat() if hasattr(started_at, 'isoformat') else str(started_at),
            completed_at=completed_at.isoformat() if completed_at and hasattr(completed_at, 'isoformat') else completed_at,
            status=session_row.status,
            settings=session_row.settings or {},
            time_spent_seconds=session_row.time_spent_seconds or 0
        )
    
    async def _submit_sqlalchemy_answer(
        self,
        session_id: str,
        answer: SessionAnswer
    ) -> Optional[Session]:
        """Submit an answer using SQLAlchemy."""
        # Get the question to check correctness
        question = await question_repository.get_by_id(answer.question_id)
        if not question:
            return None
        
        is_correct = question.correct_answer == answer.answer
        
        # Update session_questions record
        update_query = """
            UPDATE session_questions
            SET user_answer = :user_answer,
                is_correct = :is_correct,
                time_spent_seconds = :time_spent_seconds,
                answered_at = :answered_at
            WHERE session_id = :session_id AND question_id = :question_id
        """
        
        with self._engine.connect() as conn:
            conn.execute(text(update_query), {
                "user_answer": answer.answer,
                "is_correct": is_correct,
                "time_spent_seconds": answer.time_spent_seconds or 0,
                "answered_at": datetime.utcnow(),
                "session_id": session_id,
                "question_id": answer.question_id
            })
            conn.commit()
        
        return await self._get_sqlalchemy_session(session_id)
    
    async def _complete_sqlalchemy_session(self, session_id: str) -> Optional[Session]:
        """Complete a session using SQLAlchemy."""
        # Get current session to calculate stats
        session = await self._get_sqlalchemy_session(session_id)
        if not session:
            return None
        
        correct_count = sum(1 for sq in session.questions if sq.is_correct)
        total_time = sum(sq.time_spent_seconds for sq in session.questions)
        
        update_query = """
            UPDATE sessions
            SET status = 'completed',
                completed_at = :completed_at,
                correct_answers = :correct_answers,
                time_spent_seconds = :time_spent_seconds
            WHERE id = :id
        """
        
        with self._engine.connect() as conn:
            conn.execute(text(update_query), {
                "completed_at": datetime.utcnow(),
                "correct_answers": correct_count,
                "time_spent_seconds": total_time,
                "id": session_id
            })
            conn.commit()
        
        return await self._get_sqlalchemy_session(session_id)
    
    async def _get_sqlalchemy_user_sessions(
        self,
        user_id: str,
        limit: int,
        offset: int
    ) -> List[Session]:
        """Get user sessions using SQLAlchemy."""
        query = """
            SELECT * FROM sessions
            WHERE user_id = :user_id
            ORDER BY started_at DESC
            LIMIT :limit OFFSET :offset
        """
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), {
                "user_id": user_id,
                "limit": limit,
                "offset": offset
            })
            rows = result.fetchall()
            
            sessions = []
            for row in rows:
                started_at = row.started_at
                completed_at = row.completed_at
                
                sessions.append(Session(
                    id=str(row.id),
                    user_id=str(row.user_id) if row.user_id else None,
                    questions=[],  # Don't load questions for list view
                    started_at=started_at.isoformat() if hasattr(started_at, 'isoformat') else str(started_at),
                    completed_at=completed_at.isoformat() if completed_at and hasattr(completed_at, 'isoformat') else completed_at,
                    status=row.status,
                    settings=row.settings or {},
                    time_spent_seconds=row.time_spent_seconds or 0
                ))
            
            return sessions
    
    # ========================================
    # Supabase Methods (Legacy)
    # ========================================
    
    async def _create_db_session(
        self,
        session_create: SessionCreate,
        questions: List[Question]
    ) -> Session:
        """Create a session in the database."""
        client = get_supabase_client()
        if not client:
            raise RuntimeError("Database not connected")
        
        # Create session record
        session_data = {
            "user_id": session_create.user_id,
            "status": "active",
            "settings": session_create.model_dump(),
            "total_questions": len(questions)
        }
        
        response = client.table("sessions").insert(session_data).execute()
        session_row = response.data[0]
        session_id = session_row["id"]
        
        # Create session_questions records
        session_questions_data = [
            {
                "session_id": session_id,
                "question_id": q.id,
                "question_order": i
            }
            for i, q in enumerate(questions)
        ]
        
        client.table("session_questions").insert(session_questions_data).execute()
        
        # Build and return session object
        session_questions = [
            SessionQuestion(
                question=q,
                order=i,
                user_answer=None,
                is_correct=None,
                time_spent_seconds=0
            )
            for i, q in enumerate(questions)
        ]
        
        return Session(
            id=str(session_id),
            user_id=session_create.user_id,
            questions=session_questions,
            started_at=session_row["started_at"],
            completed_at=None,
            status="active",
            settings=session_create.model_dump(),
            time_spent_seconds=0
        )
    
    async def _get_db_session(self, session_id: str) -> Optional[Session]:
        """Get a session from the database."""
        client = get_supabase_client()
        if not client:
            return None
        
        try:
            # Get session
            session_response = client.table("sessions").select("*").eq("id", session_id).single().execute()
            session_row = session_response.data
            
            # Get session questions with question data
            sq_response = client.table("session_questions").select(
                "*, questions(*)"
            ).eq("session_id", session_id).order("question_order").execute()
            
            session_questions = []
            for sq_row in sq_response.data:
                question_data = sq_row["questions"]
                question = question_repository._db_to_question(question_data)
                
                session_questions.append(SessionQuestion(
                    question=question,
                    order=sq_row["question_order"],
                    user_answer=sq_row.get("user_answer"),
                    is_correct=sq_row.get("is_correct"),
                    time_spent_seconds=sq_row.get("time_spent_seconds", 0)
                ))
            
            return Session(
                id=str(session_row["id"]),
                user_id=session_row.get("user_id"),
                questions=session_questions,
                started_at=session_row["started_at"],
                completed_at=session_row.get("completed_at"),
                status=session_row["status"],
                settings=session_row.get("settings", {}),
                time_spent_seconds=session_row.get("time_spent_seconds", 0)
            )
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    async def _submit_db_answer(
        self,
        session_id: str,
        answer: SessionAnswer
    ) -> Optional[Session]:
        """Submit an answer to the database."""
        client = get_supabase_client()
        if not client:
            return None
        
        # Get the question to check correctness
        question = await question_repository.get_by_id(answer.question_id)
        if not question:
            return None
        
        is_correct = question.correct_answer == answer.answer
        
        # Update session_questions record
        update_data = {
            "user_answer": answer.answer,
            "is_correct": is_correct,
            "time_spent_seconds": answer.time_spent_seconds or 0,
            "answered_at": datetime.utcnow().isoformat()
        }
        
        client.table("session_questions").update(update_data).eq(
            "session_id", session_id
        ).eq("question_id", answer.question_id).execute()
        
        return await self._get_db_session(session_id)
    
    async def _complete_db_session(self, session_id: str) -> Optional[Session]:
        """Complete a session in the database."""
        client = get_supabase_client()
        if not client:
            return None
        
        # Get current session to calculate stats
        session = await self._get_db_session(session_id)
        if not session:
            return None
        
        correct_count = sum(1 for sq in session.questions if sq.is_correct)
        total_time = sum(sq.time_spent_seconds for sq in session.questions)
        
        update_data = {
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "correct_answers": correct_count,
            "time_spent_seconds": total_time
        }
        
        client.table("sessions").update(update_data).eq("id", session_id).execute()
        
        return await self._get_db_session(session_id)
    
    async def _get_db_user_sessions(
        self,
        user_id: str,
        limit: int,
        offset: int
    ) -> List[Session]:
        """Get user sessions from database."""
        client = get_supabase_client()
        if not client:
            return []
        
        response = client.table("sessions").select("*").eq(
            "user_id", user_id
        ).order("started_at", desc=True).range(offset, offset + limit - 1).execute()
        
        sessions = []
        for row in response.data:
            # Get minimal session info (without full question data)
            sessions.append(Session(
                id=str(row["id"]),
                user_id=row.get("user_id"),
                questions=[],  # Don't load questions for list view
                started_at=row["started_at"],
                completed_at=row.get("completed_at"),
                status=row["status"],
                settings=row.get("settings", {}),
                time_spent_seconds=row.get("time_spent_seconds", 0)
            ))
        
        return sessions


# Singleton instance
session_repository = SessionRepository()
