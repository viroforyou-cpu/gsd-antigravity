"""
Tutor Repository - handles all tutor session data access.
Supports mock data and direct PostgreSQL via SQLAlchemy.

Phase 22: AI Tutor Mode
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import uuid4
import json
from sqlalchemy import text

from ..core.config import settings
from ..core.database import is_database_connected, get_engine
from ..models.tutor import (
    TutorSession, TutorSessionCreate, TutorSessionWithMessages,
    TutorSessionSummary, TutorMessage, TutorMessageCreate,
    LearningInsight, LearningInsightCreate, LearningInsightUpdate,
    HintUsage, HintUsageCreate, HintUsageStats,
    TutorSessionHistory, TutorDashboardStats
)


class TutorRepository:
    """Repository for tutor session data access."""
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
        self._mock_sessions: Dict[str, TutorSession] = {}
        self._mock_messages: Dict[str, List[TutorMessage]] = {}
        self._mock_insights: Dict[str, List[LearningInsight]] = {}
        self._mock_hint_usage: Dict[str, List[HintUsage]] = {}
        self._engine = get_engine()
    
    # ============================================
    # Session Operations
    # ============================================
    
    async def create_session(
        self,
        user_id: str,
        session_create: TutorSessionCreate
    ) -> TutorSession:
        """Create a new tutor session."""
        if self._use_mock:
            return self._create_mock_session(user_id, session_create)
        
        if self._engine:
            return await self._create_sqlalchemy_session(user_id, session_create)
        
        raise RuntimeError("No database connection available")
    
    async def get_session(self, session_id: str) -> Optional[TutorSession]:
        """Get a tutor session by ID."""
        if self._use_mock:
            return self._mock_sessions.get(session_id)
        
        if self._engine:
            return await self._get_sqlalchemy_session(session_id)
        
        return None
    
    async def get_session_with_messages(self, session_id: str) -> Optional[TutorSessionWithMessages]:
        """Get a tutor session with all messages."""
        session = await self.get_session(session_id)
        if not session:
            return None
        
        messages = await self.get_messages(session_id)
        
        return TutorSessionWithMessages(
            **session.model_dump(),
            messages=messages
        )
    
    async def update_session(
        self,
        session_id: str,
        status: Optional[str] = None,
        learning_insights: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[TutorSession]:
        """Update a tutor session."""
        if self._use_mock:
            return self._update_mock_session(session_id, status, learning_insights)
        
        if self._engine:
            return await self._update_sqlalchemy_session(session_id, status, learning_insights)
        
        return None
    
    async def end_session(
        self,
        session_id: str,
        final_answer: Optional[str] = None
    ) -> Optional[TutorSession]:
        """End a tutor session."""
        if self._use_mock:
            return self._end_mock_session(session_id)
        
        if self._engine:
            return await self._end_sqlalchemy_session(session_id)
        
        return None
    
    async def get_user_sessions(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[TutorSessionHistory]:
        """Get tutor session history for a user."""
        if self._use_mock:
            return self._get_mock_user_sessions(user_id, limit, offset)
        
        if self._engine:
            return await self._get_sqlalchemy_user_sessions(user_id, limit, offset)
        
        return []
    
    # ============================================
    # Message Operations
    # ============================================
    
    async def add_message(
        self,
        session_id: str,
        message: TutorMessageCreate
    ) -> TutorMessage:
        """Add a message to a tutor session."""
        if self._use_mock:
            return self._add_mock_message(session_id, message)
        
        if self._engine:
            return await self._add_sqlalchemy_message(session_id, message)
        
        raise RuntimeError("No database connection available")
    
    async def get_messages(
        self,
        session_id: str,
        limit: int = 100
    ) -> List[TutorMessage]:
        """Get all messages for a tutor session."""
        if self._use_mock:
            return self._mock_messages.get(session_id, [])[:limit]
        
        if self._engine:
            return await self._get_sqlalchemy_messages(session_id, limit)
        
        return []
    
    # ============================================
    # Learning Insights Operations
    # ============================================
    
    async def create_insight(
        self,
        user_id: str,
        insight: LearningInsightCreate
    ) -> LearningInsight:
        """Create a new learning insight."""
        if self._use_mock:
            return self._create_mock_insight(user_id, insight)
        
        if self._engine:
            return await self._create_sqlalchemy_insight(user_id, insight)
        
        raise RuntimeError("No database connection available")
    
    async def get_user_insights(
        self,
        user_id: str,
        insight_type: Optional[str] = None,
        resolved: Optional[bool] = None,
        limit: int = 50
    ) -> List[LearningInsight]:
        """Get learning insights for a user."""
        if self._use_mock:
            return self._get_mock_user_insights(user_id, insight_type, resolved, limit)
        
        if self._engine:
            return await self._get_sqlalchemy_user_insights(user_id, insight_type, resolved, limit)
        
        return []
    
    async def update_insight(
        self,
        insight_id: str,
        update: LearningInsightUpdate
    ) -> Optional[LearningInsight]:
        """Update a learning insight."""
        if self._use_mock:
            return self._update_mock_insight(insight_id, update)
        
        if self._engine:
            return await self._update_sqlalchemy_insight(insight_id, update)
        
        return None
    
    async def increment_insight_occurrence(
        self,
        user_id: str,
        insight_type: str,
        topic: str
    ) -> Optional[LearningInsight]:
        """Increment occurrence count for an existing insight."""
        if self._use_mock:
            return self._increment_mock_insight_occurrence(user_id, insight_type, topic)
        
        if self._engine:
            return await self._increment_sqlalchemy_insight_occurrence(user_id, insight_type, topic)
        
        return None
    
    # ============================================
    # Hint Usage Operations
    # ============================================
    
    async def track_hint_usage(
        self,
        hint_usage: HintUsageCreate
    ) -> HintUsage:
        """Track hint usage."""
        if self._use_mock:
            return self._track_mock_hint_usage(hint_usage)
        
        if self._engine:
            return await self._track_sqlalchemy_hint_usage(hint_usage)
        
        raise RuntimeError("No database connection available")
    
    async def get_hint_usage_stats(
        self,
        user_id: str,
        question_id: Optional[str] = None
    ) -> HintUsageStats:
        """Get hint usage statistics for a user."""
        if self._use_mock:
            return self._get_mock_hint_usage_stats(user_id, question_id)
        
        if self._engine:
            return await self._get_sqlalchemy_hint_usage_stats(user_id, question_id)
        
        return HintUsageStats(
            total_hints=0,
            by_level={1: 0, 2: 0, 3: 0},
            helpful_rate=0.0,
            average_time_to_answer=None,
            correct_rate_after_hint=0.0
        )
    
    # ============================================
    # Dashboard Operations
    # ============================================
    
    async def get_dashboard_stats(self, user_id: str) -> TutorDashboardStats:
        """Get tutor dashboard statistics for a user."""
        if self._use_mock:
            return self._get_mock_dashboard_stats(user_id)
        
        if self._engine:
            return await self._get_sqlalchemy_dashboard_stats(user_id)
        
        return TutorDashboardStats(
            total_sessions=0,
            total_hints_used=0,
            total_messages=0,
            average_session_duration=0.0,
            top_insights=[],
            recent_sessions=[]
        )
    
    # ============================================
    # Mock Implementations
    # ============================================
    
    def _create_mock_session(
        self,
        user_id: str,
        session_create: TutorSessionCreate
    ) -> TutorSession:
        """Create a mock tutor session."""
        session_id = str(uuid4())
        session = TutorSession(
            id=session_id,
            user_id=user_id,
            question_id=session_create.question_id,
            session_id=session_create.session_id,
            started_at=datetime.utcnow(),
            ended_at=None,
            status='active',
            hint_count=0,
            message_count=0,
            learning_insights=[],
            created_at=datetime.utcnow()
        )
        self._mock_sessions[session_id] = session
        self._mock_messages[session_id] = []
        return session
    
    def _update_mock_session(
        self,
        session_id: str,
        status: Optional[str] = None,
        learning_insights: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[TutorSession]:
        """Update a mock tutor session."""
        session = self._mock_sessions.get(session_id)
        if not session:
            return None
        
        if status:
            session.status = status  # type: ignore
        if learning_insights is not None:
            session.learning_insights = learning_insights
        
        return session
    
    def _end_mock_session(self, session_id: str) -> Optional[TutorSession]:
        """End a mock tutor session."""
        session = self._mock_sessions.get(session_id)
        if not session:
            return None
        
        session.status = 'completed'  # type: ignore
        session.ended_at = datetime.utcnow()  # type: ignore
        return session
    
    def _get_mock_user_sessions(
        self,
        user_id: str,
        limit: int,
        offset: int
    ) -> List[TutorSessionHistory]:
        """Get mock user sessions."""
        sessions = [
            s for s in self._mock_sessions.values()
            if s.user_id == user_id
        ]
        sessions.sort(key=lambda s: s.started_at, reverse=True)
        
        result = []
        for s in sessions[offset:offset + limit]:
            result.append(TutorSessionHistory(
                id=s.id,
                question_id=s.question_id,
                question_preview="Question preview...",
                started_at=s.started_at,
                ended_at=s.ended_at,
                status=s.status,
                hint_count=s.hint_count,
                message_count=s.message_count
            ))
        return result
    
    def _add_mock_message(
        self,
        session_id: str,
        message: TutorMessageCreate
    ) -> TutorMessage:
        """Add a mock message."""
        message_id = str(uuid4())
        tutor_message = TutorMessage(
            id=message_id,
            session_id=session_id,
            role=message.role,
            content=message.content,
            message_type=message.message_type,
            metadata={},
            created_at=datetime.utcnow()
        )
        
        if session_id not in self._mock_messages:
            self._mock_messages[session_id] = []
        self._mock_messages[session_id].append(tutor_message)
        
        # Update message count in session
        session = self._mock_sessions.get(session_id)
        if session:
            session.message_count = len(self._mock_messages[session_id])
        
        return tutor_message
    
    def _create_mock_insight(
        self,
        user_id: str,
        insight: LearningInsightCreate
    ) -> LearningInsight:
        """Create a mock learning insight."""
        insight_id = str(uuid4())
        learning_insight = LearningInsight(
            id=insight_id,
            user_id=user_id,
            insight_type=insight.insight_type,
            topic=insight.topic,
            description=insight.description,
            severity=insight.severity,
            first_identified=datetime.utcnow(),
            last_updated=datetime.utcnow(),
            occurrence_count=1,
            resolved=False,
            resolved_at=None
        )
        
        if user_id not in self._mock_insights:
            self._mock_insights[user_id] = []
        self._mock_insights[user_id].append(learning_insight)
        
        return learning_insight
    
    def _get_mock_user_insights(
        self,
        user_id: str,
        insight_type: Optional[str],
        resolved: Optional[bool],
        limit: int
    ) -> List[LearningInsight]:
        """Get mock user insights."""
        insights = self._mock_insights.get(user_id, [])
        
        if insight_type:
            insights = [i for i in insights if i.insight_type == insight_type]
        if resolved is not None:
            insights = [i for i in insights if i.resolved == resolved]
        
        insights.sort(key=lambda i: i.last_updated, reverse=True)
        return insights[:limit]
    
    def _update_mock_insight(
        self,
        insight_id: str,
        update: LearningInsightUpdate
    ) -> Optional[LearningInsight]:
        """Update a mock insight."""
        for user_insights in self._mock_insights.values():
            for insight in user_insights:
                if str(insight.id) == insight_id:
                    if update.resolved is not None:
                        insight.resolved = update.resolved
                        if update.resolved:
                            insight.resolved_at = datetime.utcnow()
                    if update.severity is not None:
                        insight.severity = update.severity
                    insight.last_updated = datetime.utcnow()
                    return insight
        return None
    
    def _increment_mock_insight_occurrence(
        self,
        user_id: str,
        insight_type: str,
        topic: str
    ) -> Optional[LearningInsight]:
        """Increment mock insight occurrence."""
        insights = self._mock_insights.get(user_id, [])
        for insight in insights:
            if insight.insight_type == insight_type and insight.topic == topic:
                insight.occurrence_count += 1
                insight.last_updated = datetime.utcnow()
                return insight
        return None
    
    def _track_mock_hint_usage(self, hint_usage: HintUsageCreate) -> HintUsage:
        """Track mock hint usage."""
        usage_id = str(uuid4())
        usage = HintUsage(
            id=usage_id,
            **hint_usage.model_dump(),
            requested_at=datetime.utcnow()
        )
        
        user_id = str(hint_usage.user_id)
        if user_id not in self._mock_hint_usage:
            self._mock_hint_usage[user_id] = []
        self._mock_hint_usage[user_id].append(usage)
        
        return usage
    
    def _get_mock_hint_usage_stats(
        self,
        user_id: str,
        question_id: Optional[str]
    ) -> HintUsageStats:
        """Get mock hint usage stats."""
        usages = self._mock_hint_usage.get(user_id, [])
        
        if question_id:
            usages = [u for u in usages if str(u.question_id) == question_id]
        
        if not usages:
            return HintUsageStats(
                total_hints=0,
                by_level={1: 0, 2: 0, 3: 0},
                helpful_rate=0.0,
                average_time_to_answer=None,
                correct_rate_after_hint=0.0
            )
        
        by_level = {1: 0, 2: 0, 3: 0}
        helpful_count = 0
        time_sum = 0
        time_count = 0
        correct_count = 0
        
        for u in usages:
            by_level[u.hint_level] = by_level.get(u.hint_level, 0) + 1
            if u.was_helpful:
                helpful_count += 1
            if u.time_to_answer:
                time_sum += u.time_to_answer
                time_count += 1
            if u.led_to_correct:
                correct_count += 1
        
        return HintUsageStats(
            total_hints=len(usages),
            by_level=by_level,
            helpful_rate=helpful_count / len(usages) if usages else 0.0,
            average_time_to_answer=time_sum / time_count if time_count > 0 else None,
            correct_rate_after_hint=correct_count / len(usages) if usages else 0.0
        )
    
    def _get_mock_dashboard_stats(self, user_id: str) -> TutorDashboardStats:
        """Get mock dashboard stats."""
        sessions = [
            s for s in self._mock_sessions.values()
            if s.user_id == user_id
        ]
        
        total_duration = 0
        for s in sessions:
            if s.ended_at and s.started_at:
                total_duration += (s.ended_at - s.started_at).total_seconds()
        
        insights = self._get_mock_user_insights(user_id, None, False, 5)
        recent = self._get_mock_user_sessions(user_id, 5, 0)
        
        return TutorDashboardStats(
            total_sessions=len(sessions),
            total_hints_used=sum(s.hint_count for s in sessions),
            total_messages=sum(s.message_count for s in sessions),
            average_session_duration=total_duration / len(sessions) if sessions else 0.0,
            top_insights=insights,
            recent_sessions=recent
        )
    
    # ============================================
    # SQLAlchemy Implementations
    # ============================================
    
    async def _create_sqlalchemy_session(
        self,
        user_id: str,
        session_create: TutorSessionCreate
    ) -> TutorSession:
        """Create a tutor session using SQLAlchemy."""
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO tutor_sessions (user_id, question_id, session_id, status)
                    VALUES (:user_id, :question_id, :session_id, 'active')
                    RETURNING id, started_at, created_at
                """),
                {
                    "user_id": user_id,
                    "question_id": str(session_create.question_id),
                    "session_id": str(session_create.session_id) if session_create.session_id else None
                }
            )
            row = result.fetchone()
            
            return TutorSession(
                id=row.id,
                user_id=user_id,
                question_id=session_create.question_id,
                session_id=session_create.session_id,
                started_at=row.started_at,
                ended_at=None,
                status='active',
                hint_count=0,
                message_count=0,
                learning_insights=[],
                created_at=row.created_at
            )
    
    async def _get_sqlalchemy_session(self, session_id: str) -> Optional[TutorSession]:
        """Get a tutor session using SQLAlchemy."""
        async with self._engine.connect() as conn:
            result = await conn.execute(
                text("""
                    SELECT id, user_id, question_id, session_id, started_at, ended_at,
                           status, hint_count, message_count, learning_insights, created_at
                    FROM tutor_sessions
                    WHERE id = :session_id
                """),
                {"session_id": session_id}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            return TutorSession(
                id=row.id,
                user_id=row.user_id,
                question_id=row.question_id,
                session_id=row.session_id,
                started_at=row.started_at,
                ended_at=row.ended_at,
                status=row.status,
                hint_count=row.hint_count,
                message_count=row.message_count,
                learning_insights=row.learning_insights or [],
                created_at=row.created_at
            )
    
    async def _update_sqlalchemy_session(
        self,
        session_id: str,
        status: Optional[str] = None,
        learning_insights: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[TutorSession]:
        """Update a tutor session using SQLAlchemy."""
        updates = []
        params: Dict[str, Any] = {"session_id": session_id}
        
        if status:
            updates.append("status = :status")
            params["status"] = status
        if learning_insights is not None:
            updates.append("learning_insights = :learning_insights::jsonb")
            params["learning_insights"] = json.dumps(learning_insights)
        
        if not updates:
            return await self.get_session(session_id)
        
        async with self._engine.begin() as conn:
            await conn.execute(
                text(f"UPDATE tutor_sessions SET {', '.join(updates)} WHERE id = :session_id"),
                params
            )
        
        return await self.get_session(session_id)
    
    async def _end_sqlalchemy_session(self, session_id: str) -> Optional[TutorSession]:
        """End a tutor session using SQLAlchemy."""
        async with self._engine.begin() as conn:
            await conn.execute(
                text("""
                    UPDATE tutor_sessions
                    SET status = 'completed', ended_at = NOW()
                    WHERE id = :session_id
                """),
                {"session_id": session_id}
            )
        
        return await self.get_session(session_id)
    
    async def _get_sqlalchemy_user_sessions(
        self,
        user_id: str,
        limit: int,
        offset: int
    ) -> List[TutorSessionHistory]:
        """Get user sessions using SQLAlchemy."""
        async with self._engine.connect() as conn:
            result = await conn.execute(
                text("""
                    SELECT ts.id, ts.question_id, q.stem as question_stem,
                           ts.started_at, ts.ended_at, ts.status,
                           ts.hint_count, ts.message_count
                    FROM tutor_sessions ts
                    LEFT JOIN questions q ON q.id = ts.question_id
                    WHERE ts.user_id = :user_id
                    ORDER BY ts.started_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"user_id": user_id, "limit": limit, "offset": offset}
            )
            rows = result.fetchall()
            
            return [
                TutorSessionHistory(
                    id=row.id,
                    question_id=row.question_id,
                    question_preview=row.question_stem[:100] if row.question_stem else "Unknown",
                    started_at=row.started_at,
                    ended_at=row.ended_at,
                    status=row.status,
                    hint_count=row.hint_count,
                    message_count=row.message_count
                )
                for row in rows
            ]
    
    async def _add_sqlalchemy_message(
        self,
        session_id: str,
        message: TutorMessageCreate
    ) -> TutorMessage:
        """Add a message using SQLAlchemy."""
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO tutor_messages (session_id, role, content, message_type, metadata)
                    VALUES (:session_id, :role, :content, :message_type, '{}'::jsonb)
                    RETURNING id, created_at
                """),
                {
                    "session_id": session_id,
                    "role": message.role,
                    "content": message.content,
                    "message_type": message.message_type
                }
            )
            row = result.fetchone()
            
            return TutorMessage(
                id=row.id,
                session_id=session_id,
                role=message.role,
                content=message.content,
                message_type=message.message_type,
                metadata={},
                created_at=row.created_at
            )
    
    async def _get_sqlalchemy_messages(
        self,
        session_id: str,
        limit: int
    ) -> List[TutorMessage]:
        """Get messages using SQLAlchemy."""
        async with self._engine.connect() as conn:
            result = await conn.execute(
                text("""
                    SELECT id, session_id, role, content, message_type, metadata, created_at
                    FROM tutor_messages
                    WHERE session_id = :session_id
                    ORDER BY created_at ASC
                    LIMIT :limit
                """),
                {"session_id": session_id, "limit": limit}
            )
            rows = result.fetchall()
            
            return [
                TutorMessage(
                    id=row.id,
                    session_id=row.session_id,
                    role=row.role,
                    content=row.content,
                    message_type=row.message_type,
                    metadata=row.metadata or {},
                    created_at=row.created_at
                )
                for row in rows
            ]
    
    async def _create_sqlalchemy_insight(
        self,
        user_id: str,
        insight: LearningInsightCreate
    ) -> LearningInsight:
        """Create a learning insight using SQLAlchemy."""
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO learning_insights (user_id, insight_type, topic, description, severity)
                    VALUES (:user_id, :insight_type, :topic, :description, :severity)
                    RETURNING id, first_identified, last_updated
                """),
                {
                    "user_id": user_id,
                    "insight_type": insight.insight_type,
                    "topic": insight.topic,
                    "description": insight.description,
                    "severity": insight.severity
                }
            )
            row = result.fetchone()
            
            return LearningInsight(
                id=row.id,
                user_id=user_id,
                insight_type=insight.insight_type,
                topic=insight.topic,
                description=insight.description,
                severity=insight.severity,
                first_identified=row.first_identified,
                last_updated=row.last_updated,
                occurrence_count=1,
                resolved=False,
                resolved_at=None
            )
    
    async def _get_sqlalchemy_user_insights(
        self,
        user_id: str,
        insight_type: Optional[str],
        resolved: Optional[bool],
        limit: int
    ) -> List[LearningInsight]:
        """Get user insights using SQLAlchemy."""
        conditions = ["user_id = :user_id"]
        params: Dict[str, Any] = {"user_id": user_id, "limit": limit}
        
        if insight_type:
            conditions.append("insight_type = :insight_type")
            params["insight_type"] = insight_type
        if resolved is not None:
            conditions.append("resolved = :resolved")
            params["resolved"] = resolved
        
        async with self._engine.connect() as conn:
            result = await conn.execute(
                text(f"""
                    SELECT id, user_id, insight_type, topic, description, severity,
                           first_identified, last_updated, occurrence_count, resolved, resolved_at
                    FROM learning_insights
                    WHERE {' AND '.join(conditions)}
                    ORDER BY last_updated DESC
                    LIMIT :limit
                """),
                params
            )
            rows = result.fetchall()
            
            return [
                LearningInsight(
                    id=row.id,
                    user_id=row.user_id,
                    insight_type=row.insight_type,
                    topic=row.topic,
                    description=row.description,
                    severity=row.severity,
                    first_identified=row.first_identified,
                    last_updated=row.last_updated,
                    occurrence_count=row.occurrence_count,
                    resolved=row.resolved,
                    resolved_at=row.resolved_at
                )
                for row in rows
            ]
    
    async def _update_sqlalchemy_insight(
        self,
        insight_id: str,
        update: LearningInsightUpdate
    ) -> Optional[LearningInsight]:
        """Update a learning insight using SQLAlchemy."""
        updates = []
        params: Dict[str, Any] = {"insight_id": insight_id}
        
        if update.resolved is not None:
            updates.append("resolved = :resolved")
            params["resolved"] = update.resolved
            if update.resolved:
                updates.append("resolved_at = NOW()")
        if update.severity is not None:
            updates.append("severity = :severity")
            params["severity"] = update.severity
        
        if updates:
            updates.append("last_updated = NOW()")
            async with self._engine.begin() as conn:
                await conn.execute(
                    text(f"UPDATE learning_insights SET {', '.join(updates)} WHERE id = :insight_id"),
                    params
                )
        
        # Fetch the updated insight
        async with self._engine.connect() as conn:
            result = await conn.execute(
                text("""
                    SELECT id, user_id, insight_type, topic, description, severity,
                           first_identified, last_updated, occurrence_count, resolved, resolved_at
                    FROM learning_insights
                    WHERE id = :insight_id
                """),
                {"insight_id": insight_id}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            return LearningInsight(
                id=row.id,
                user_id=row.user_id,
                insight_type=row.insight_type,
                topic=row.topic,
                description=row.description,
                severity=row.severity,
                first_identified=row.first_identified,
                last_updated=row.last_updated,
                occurrence_count=row.occurrence_count,
                resolved=row.resolved,
                resolved_at=row.resolved_at
            )
    
    async def _increment_sqlalchemy_insight_occurrence(
        self,
        user_id: str,
        insight_type: str,
        topic: str
    ) -> Optional[LearningInsight]:
        """Increment insight occurrence using SQLAlchemy."""
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    UPDATE learning_insights
                    SET occurrence_count = occurrence_count + 1, last_updated = NOW()
                    WHERE user_id = :user_id AND insight_type = :insight_type AND topic = :topic
                    RETURNING id
                """),
                {"user_id": user_id, "insight_type": insight_type, "topic": topic}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            # Fetch the updated insight
            return await self._get_sqlalchemy_insight_by_id(str(row.id))
    
    async def _get_sqlalchemy_insight_by_id(self, insight_id: str) -> Optional[LearningInsight]:
        """Get an insight by ID."""
        async with self._engine.connect() as conn:
            result = await conn.execute(
                text("""
                    SELECT id, user_id, insight_type, topic, description, severity,
                           first_identified, last_updated, occurrence_count, resolved, resolved_at
                    FROM learning_insights
                    WHERE id = :insight_id
                """),
                {"insight_id": insight_id}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            return LearningInsight(
                id=row.id,
                user_id=row.user_id,
                insight_type=row.insight_type,
                topic=row.topic,
                description=row.description,
                severity=row.severity,
                first_identified=row.first_identified,
                last_updated=row.last_updated,
                occurrence_count=row.occurrence_count,
                resolved=row.resolved,
                resolved_at=row.resolved_at
            )
    
    async def _track_sqlalchemy_hint_usage(self, hint_usage: HintUsageCreate) -> HintUsage:
        """Track hint usage using SQLAlchemy."""
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO hint_usage (user_id, question_id, session_id, hint_level,
                                           was_helpful, time_to_answer, led_to_correct)
                    VALUES (:user_id, :question_id, :session_id, :hint_level,
                            :was_helpful, :time_to_answer, :led_to_correct)
                    RETURNING id, requested_at
                """),
                {
                    "user_id": str(hint_usage.user_id),
                    "question_id": str(hint_usage.question_id),
                    "session_id": str(hint_usage.session_id) if hint_usage.session_id else None,
                    "hint_level": hint_usage.hint_level,
                    "was_helpful": hint_usage.was_helpful,
                    "time_to_answer": hint_usage.time_to_answer,
                    "led_to_correct": hint_usage.led_to_correct
                }
            )
            row = result.fetchone()
            
            return HintUsage(
                id=row.id,
                user_id=hint_usage.user_id,
                question_id=hint_usage.question_id,
                session_id=hint_usage.session_id,
                hint_level=hint_usage.hint_level,
                was_helpful=hint_usage.was_helpful,
                time_to_answer=hint_usage.time_to_answer,
                led_to_correct=hint_usage.led_to_correct,
                requested_at=row.requested_at
            )
    
    async def _get_sqlalchemy_hint_usage_stats(
        self,
        user_id: str,
        question_id: Optional[str]
    ) -> HintUsageStats:
        """Get hint usage stats using SQLAlchemy."""
        conditions = ["user_id = :user_id"]
        params: Dict[str, Any] = {"user_id": user_id}
        
        if question_id:
            conditions.append("question_id = :question_id")
            params["question_id"] = question_id
        
        async with self._engine.connect() as conn:
            result = await conn.execute(
                text(f"""
                    SELECT
                        COUNT(*) as total_hints,
                        COUNT(*) FILTER (WHERE hint_level = 1) as level_1,
                        COUNT(*) FILTER (WHERE hint_level = 2) as level_2,
                        COUNT(*) FILTER (WHERE hint_level = 3) as level_3,
                        COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count,
                        AVG(time_to_answer) as avg_time,
                        COUNT(*) FILTER (WHERE led_to_correct = true) as correct_count
                    FROM hint_usage
                    WHERE {' AND '.join(conditions)}
                """),
                params
            )
            row = result.fetchone()
            
            if not row or row.total_hints == 0:
                return HintUsageStats(
                    total_hints=0,
                    by_level={1: 0, 2: 0, 3: 0},
                    helpful_rate=0.0,
                    average_time_to_answer=None,
                    correct_rate_after_hint=0.0
                )
            
            return HintUsageStats(
                total_hints=row.total_hints,
                by_level={1: row.level_1, 2: row.level_2, 3: row.level_3},
                helpful_rate=row.helpful_count / row.total_hints,
                average_time_to_answer=float(row.avg_time) if row.avg_time else None,
                correct_rate_after_hint=row.correct_count / row.total_hints
            )
    
    async def _get_sqlalchemy_dashboard_stats(self, user_id: str) -> TutorDashboardStats:
        """Get dashboard stats using SQLAlchemy."""
        async with self._engine.connect() as conn:
            # Get session stats
            session_result = await conn.execute(
                text("""
                    SELECT
                        COUNT(*) as total_sessions,
                        SUM(hint_count) as total_hints,
                        SUM(message_count) as total_messages,
                        AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration
                    FROM tutor_sessions
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id}
            )
            session_row = session_result.fetchone()
            
            # Get top insights
            insights_result = await conn.execute(
                text("""
                    SELECT id, user_id, insight_type, topic, description, severity,
                           first_identified, last_updated, occurrence_count, resolved, resolved_at
                    FROM learning_insights
                    WHERE user_id = :user_id AND resolved = false
                    ORDER BY occurrence_count DESC, last_updated DESC
                    LIMIT 5
                """),
                {"user_id": user_id}
            )
            insight_rows = insights_result.fetchall()
            
            # Get recent sessions
            recent_result = await conn.execute(
                text("""
                    SELECT ts.id, ts.question_id, q.stem as question_stem,
                           ts.started_at, ts.ended_at, ts.status,
                           ts.hint_count, ts.message_count
                    FROM tutor_sessions ts
                    LEFT JOIN questions q ON q.id = ts.question_id
                    WHERE ts.user_id = :user_id
                    ORDER BY ts.started_at DESC
                    LIMIT 5
                """),
                {"user_id": user_id}
            )
            recent_rows = recent_result.fetchall()
            
            return TutorDashboardStats(
                total_sessions=session_row.total_sessions or 0,
                total_hints_used=int(session_row.total_hints or 0),
                total_messages=int(session_row.total_messages or 0),
                average_session_duration=float(session_row.avg_duration or 0),
                top_insights=[
                    LearningInsight(
                        id=row.id,
                        user_id=row.user_id,
                        insight_type=row.insight_type,
                        topic=row.topic,
                        description=row.description,
                        severity=row.severity,
                        first_identified=row.first_identified,
                        last_updated=row.last_updated,
                        occurrence_count=row.occurrence_count,
                        resolved=row.resolved,
                        resolved_at=row.resolved_at
                    )
                    for row in insight_rows
                ],
                recent_sessions=[
                    TutorSessionHistory(
                        id=row.id,
                        question_id=row.question_id,
                        question_preview=row.question_stem[:100] if row.question_stem else "Unknown",
                        started_at=row.started_at,
                        ended_at=row.ended_at,
                        status=row.status,
                        hint_count=row.hint_count,
                        message_count=row.message_count
                    )
                    for row in recent_rows
                ]
            )


# Singleton instance
tutor_repository = TutorRepository()
