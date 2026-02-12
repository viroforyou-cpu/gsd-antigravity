"""
Question Repository - handles all question data access.
Supports mock data, Supabase, and direct PostgreSQL via SQLAlchemy.
Includes caching for frequently accessed data.
"""
from typing import List, Optional
from uuid import UUID
import random
from sqlalchemy import text

from ..core.config import settings
from ..core.database import get_supabase_client, is_database_connected, get_engine
from ..models.question import Question, QuestionCreate, QuestionStats
from ..mock.questions import mock_questions as MOCK_QUESTIONS
from .cache_service import cache_service


class QuestionRepository:
    """Repository for question data access with caching."""
    
    # Cache key prefixes
    CACHE_PREFIX = "questions"
    CACHE_TTL = 300  # 5 minutes for question data
    CATEGORIES_TTL = 3600  # 1 hour for categories list
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
        self._engine = get_engine()
    
    async def get_all(
        self,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Question]:
        """Get all questions with optional filtering."""
        if self._use_mock:
            return self._get_mock_questions(category, difficulty, limit, offset)
        
        if self._engine:
            return await self._get_sqlalchemy_questions(category, difficulty, limit, offset)
        
        return await self._get_db_questions(category, difficulty, limit, offset)
    
    async def get_by_id(self, question_id: str) -> Optional[Question]:
        """Get a single question by ID with caching."""
        # Try cache first
        cache_key = f"{self.CACHE_PREFIX}:id:{question_id}"
        cached = cache_service.get(cache_key)
        if cached:
            return Question(**cached)
        
        if self._use_mock:
            result = self._get_mock_by_id(question_id)
        elif self._engine:
            result = await self._get_sqlalchemy_by_id(question_id)
        else:
            result = await self._get_db_by_id(question_id)
        
        # Cache the result
        if result:
            cache_service.set(cache_key, result.model_dump(), self.CACHE_TTL)
        
        return result
    
    async def get_random(
        self,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        exclude_ids: List[str] = None
    ) -> Optional[Question]:
        """Get a random question for practice."""
        if self._use_mock:
            return self._get_mock_random(category, difficulty, exclude_ids or [])
        
        if self._engine:
            return await self._get_sqlalchemy_random(category, difficulty, exclude_ids or [])
        
        return await self._get_db_random(category, difficulty, exclude_ids or [])
    
    async def get_categories(self) -> List[str]:
        """Get all unique categories with caching."""
        # Try cache first
        cache_key = f"{self.CACHE_PREFIX}:categories"
        cached = cache_service.get(cache_key)
        if cached:
            return cached
        
        if self._use_mock:
            result = list(set(q.category for q in MOCK_QUESTIONS))
        elif self._engine:
            result = await self._get_sqlalchemy_categories()
        else:
            result = await self._get_db_categories()
        
        # Cache the result
        cache_service.set(cache_key, result, self.CATEGORIES_TTL)
        
        return result
    
    async def create(self, question: QuestionCreate) -> Question:
        """Create a new question."""
        if self._use_mock:
            raise NotImplementedError("Cannot create questions in mock mode")
        
        if self._engine:
            return await self._create_sqlalchemy_question(question)
        
        return await self._create_db_question(question)
    
    # ========================================
    # Mock Data Methods
    # ========================================
    
    def _get_mock_questions(
        self,
        category: Optional[str],
        difficulty: Optional[str],
        limit: int,
        offset: int
    ) -> List[Question]:
        """Get questions from mock data."""
        questions = MOCK_QUESTIONS.copy()
        
        if category:
            questions = [q for q in questions if q.category == category]
        if difficulty:
            questions = [q for q in questions if q.difficulty == difficulty]
        
        return questions[offset:offset + limit]
    
    def _get_mock_by_id(self, question_id: str) -> Optional[Question]:
        """Get a mock question by ID."""
        for q in MOCK_QUESTIONS:
            if q.id == question_id:
                return q
        return None
    
    def _get_mock_random(
        self,
        category: Optional[str],
        difficulty: Optional[str],
        exclude_ids: List[str]
    ) -> Optional[Question]:
        """Get a random mock question."""
        questions = MOCK_QUESTIONS.copy()
        
        if category:
            questions = [q for q in questions if q.category == category]
        if difficulty:
            questions = [q for q in questions if q.difficulty == difficulty]
        if exclude_ids:
            questions = [q for q in questions if q.id not in exclude_ids]
        
        if not questions:
            return None
        
        return random.choice(questions)
    
    # ========================================
    # SQLAlchemy Methods (Direct PostgreSQL)
    # ========================================
    
    async def _get_sqlalchemy_questions(
        self,
        category: Optional[str],
        difficulty: Optional[str],
        limit: int,
        offset: int
    ) -> List[Question]:
        """Get questions using SQLAlchemy."""
        query = "SELECT * FROM questions WHERE is_active = true"
        params = {}
        
        if category:
            query += " AND category = :category"
            params["category"] = category
        if difficulty:
            query += " AND difficulty = :difficulty"
            params["difficulty"] = difficulty
        
        query += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), params)
            rows = result.fetchall()
            return [self._row_to_question(row) for row in rows]
    
    async def _get_sqlalchemy_by_id(self, question_id: str) -> Optional[Question]:
        """Get a question by ID using SQLAlchemy."""
        query = "SELECT * FROM questions WHERE id = :id AND is_active = true"
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), {"id": question_id})
            row = result.fetchone()
            if row:
                return self._row_to_question(row)
        return None
    
    async def _get_sqlalchemy_random(
        self,
        category: Optional[str],
        difficulty: Optional[str],
        exclude_ids: List[str]
    ) -> Optional[Question]:
        """Get a random question using SQLAlchemy."""
        query = "SELECT * FROM questions WHERE is_active = true"
        params = {}
        
        if category:
            query += " AND category = :category"
            params["category"] = category
        if difficulty:
            query += " AND difficulty = :difficulty"
            params["difficulty"] = difficulty
        if exclude_ids:
            query += " AND id NOT IN :exclude_ids"
            params["exclude_ids"] = tuple(exclude_ids)
        
        query += " ORDER BY RANDOM() LIMIT 1"
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), params)
            row = result.fetchone()
            if row:
                return self._row_to_question(row)
        return None
    
    async def _get_sqlalchemy_categories(self) -> List[str]:
        """Get all categories using SQLAlchemy."""
        query = "SELECT DISTINCT category FROM questions WHERE is_active = true ORDER BY category"
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query))
            return [row[0] for row in result.fetchall()]
    
    async def _create_sqlalchemy_question(self, question: QuestionCreate) -> Question:
        """Create a question using SQLAlchemy."""
        query = """
            INSERT INTO questions (stem, options, correct_answer, difficulty, category, 
                                   subcategory, source_reference, explanation, key_concepts)
            VALUES (:stem, :options::jsonb, :correct_answer, :difficulty, :category,
                    :subcategory, :source_reference, :explanation, :key_concepts)
            RETURNING *
        """
        import json
        params = {
            "stem": question.stem,
            "options": json.dumps(question.options),
            "correct_answer": question.correct_answer,
            "difficulty": question.difficulty,
            "category": question.category,
            "subcategory": question.subcategory,
            "source_reference": question.source_reference,
            "explanation": question.explanation,
            "key_concepts": question.key_concepts
        }
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), params)
            conn.commit()
            row = result.fetchone()
            return self._row_to_question(row)
    
    def _row_to_question(self, row) -> Question:
        """Convert SQLAlchemy row to Question model."""
        # Row is a Row object, access by index or column name
        created_at_val = row.created_at if hasattr(row, 'created_at') else row[11]
        # Convert datetime to ISO string if needed
        if hasattr(created_at_val, 'isoformat'):
            created_at_str = created_at_val.isoformat()
        else:
            created_at_str = str(created_at_val)
        
        return Question(
            id=str(row.id) if hasattr(row, 'id') else str(row[0]),
            stem=row.stem if hasattr(row, 'stem') else row[1],
            options=row.options if hasattr(row, 'options') else row[2],
            correct_answer=row.correct_answer if hasattr(row, 'correct_answer') else row[3],
            difficulty=row.difficulty if hasattr(row, 'difficulty') else row[4],
            category=row.category if hasattr(row, 'category') else row[5],
            subcategory=row.subcategory if hasattr(row, 'subcategory') else row[6],
            source_reference=row.source_reference if hasattr(row, 'source_reference') else row[7],
            explanation=row.explanation if hasattr(row, 'explanation') else row[8],
            key_concepts=row.key_concepts if hasattr(row, 'key_concepts') else row[9],
            created_at=created_at_str,
            times_answered=row.times_answered if hasattr(row, 'times_answered') else row[14],
            times_correct=row.times_correct if hasattr(row, 'times_correct') else row[15]
        )
    
    # ========================================
    # Supabase Methods (Legacy)
    # ========================================
    
    async def _get_db_questions(
        self,
        category: Optional[str],
        difficulty: Optional[str],
        limit: int,
        offset: int
    ) -> List[Question]:
        """Get questions from database."""
        client = get_supabase_client()
        if not client:
            return []
        
        query = client.table("questions").select("*").eq("is_active", True)
        
        if category:
            query = query.eq("category", category)
        if difficulty:
            query = query.eq("difficulty", difficulty)
        
        response = query.range(offset, offset + limit - 1).execute()
        
        return [self._db_to_question(row) for row in response.data]
    
    async def _get_db_by_id(self, question_id: str) -> Optional[Question]:
        """Get a question from database by ID."""
        client = get_supabase_client()
        if not client:
            return None
        
        try:
            response = client.table("questions").select("*").eq("id", question_id).single().execute()
            return self._db_to_question(response.data)
        except Exception:
            return None
    
    async def _get_db_random(
        self,
        category: Optional[str],
        difficulty: Optional[str],
        exclude_ids: List[str]
    ) -> Optional[Question]:
        """Get a random question from database."""
        client = get_supabase_client()
        if not client:
            return None
        
        # Build query
        query = client.table("questions").select("*").eq("is_active", True)
        
        if category:
            query = query.eq("category", category)
        if difficulty:
            query = query.eq("difficulty", difficulty)
        if exclude_ids:
            query = query.not_.in_("id", exclude_ids)
        
        # Get all matching questions and pick random
        response = query.execute()
        
        if not response.data:
            return None
        
        return self._db_to_question(random.choice(response.data))
    
    async def _get_db_categories(self) -> List[str]:
        """Get all categories from database."""
        client = get_supabase_client()
        if not client:
            return []
        
        response = client.table("questions").select("category").eq("is_active", True).execute()
        
        return list(set(row["category"] for row in response.data))
    
    async def _create_db_question(self, question: QuestionCreate) -> Question:
        """Create a question in the database."""
        client = get_supabase_client()
        if not client:
            raise RuntimeError("Database not connected")
        
        db_data = {
            "stem": question.stem,
            "options": question.options,
            "correct_answer": question.correct_answer,
            "difficulty": question.difficulty,
            "category": question.category,
            "subcategory": question.subcategory,
            "source_reference": question.source_reference,
            "explanation": question.explanation,
            "key_concepts": question.key_concepts
        }
        
        response = client.table("questions").insert(db_data).execute()
        
        return self._db_to_question(response.data[0])
    
    def _db_to_question(self, row: dict) -> Question:
        """Convert database row to Question model."""
        return Question(
            id=str(row["id"]),
            stem=row["stem"],
            options=row["options"],
            correct_answer=row["correct_answer"],
            difficulty=row["difficulty"],
            category=row["category"],
            subcategory=row.get("subcategory"),
            source_reference=row.get("source_reference"),
            explanation=row.get("explanation"),
            key_concepts=row.get("key_concepts", []),
            created_at=row["created_at"],
            times_answered=row.get("times_answered", 0),
            times_correct=row.get("times_correct", 0)
        )


# Singleton instance
question_repository = QuestionRepository()
