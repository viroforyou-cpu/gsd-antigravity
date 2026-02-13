"""
Admin Repository - handles all admin data access.
Supports mock data and direct PostgreSQL via SQLAlchemy.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from uuid import uuid4
from sqlalchemy import text
import json

from ..core.config import settings
from ..core.database import is_database_connected, get_engine
from ..models.admin import (
    AdminLog, AdminLogBase, AdminLogList,
    UserAdminView, UserAdminUpdate, UserAdminList, UserActivityStats,
    QuestionReport, QuestionReportCreate, QuestionReportResolve, QuestionReportList,
    AdminSetting, AdminSettingUpdate, AdminSettingsList,
    AdminAnalyticsOverview, UserGrowthStats, QuestionPerformanceStats,
    SessionStats, CategoryStats, AdminDashboardStats,
    AdminAction, ReportReason, ReportStatus,
)


class AdminRepository:
    """Repository for admin data access."""
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
        self._engine = get_engine()
        
        # Mock data storage
        self._mock_logs: List[AdminLog] = []
        self._mock_reports: List[Dict] = []
        self._mock_settings: Dict[str, Dict] = {
            "maintenance_mode": {"key": "maintenance_mode", "value": {"enabled": False}, "description": "Enable maintenance mode"},
            "registration_enabled": {"key": "registration_enabled", "value": {"enabled": True}, "description": "Allow new user registration"},
            "max_questions_per_session": {"key": "max_questions_per_session", "value": {"value": 20}, "description": "Maximum questions per practice session"},
            "rate_limit_requests": {"key": "rate_limit_requests", "value": {"value": 60}, "description": "Rate limit requests per minute"},
        }
    
    # ============================================
    # Admin Log Operations
    # ============================================
    
    async def create_log(
        self,
        admin_user_id: str,
        action: AdminAction,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Dict[str, Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminLog:
        """Create an admin action log entry."""
        if details is None:
            details = {}
        
        if self._use_mock:
            log = AdminLog(
                id=str(uuid4()),
                admin_user_id=admin_user_id,
                action=action,
                target_type=target_type,
                target_id=target_id,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
                created_at=datetime.utcnow(),
            )
            self._mock_logs.append(log)
            return log
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO admin_logs 
                    (admin_user_id, action, target_type, target_id, details, ip_address, user_agent)
                    VALUES (:admin_user_id, :action, :target_type, :target_id, :details::jsonb, :ip_address, :user_agent)
                    RETURNING id, created_at
                """),
                {
                    "admin_user_id": admin_user_id,
                    "action": action.value,
                    "target_type": target_type,
                    "target_id": target_id,
                    "details": json.dumps(details),
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                }
            )
            row = result.fetchone()
            return AdminLog(
                id=str(row.id),
                admin_user_id=admin_user_id,
                action=action,
                target_type=target_type,
                target_id=target_id,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
                created_at=row.created_at,
            )
    
    async def get_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        admin_user_id: Optional[str] = None,
        action: Optional[AdminAction] = None,
        target_type: Optional[str] = None,
    ) -> AdminLogList:
        """Get paginated admin logs with optional filters."""
        if self._use_mock:
            logs = self._mock_logs
            if admin_user_id:
                logs = [l for l in logs if l.admin_user_id == admin_user_id]
            if action:
                logs = [l for l in logs if l.action == action]
            if target_type:
                logs = [l for l in logs if l.target_type == target_type]
            
            total = len(logs)
            logs = logs[(page - 1) * page_size:page * page_size]
            return AdminLogList(
                logs=logs,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=(total + page_size - 1) // page_size,
            )
        
        async with self._engine.begin() as conn:
            # Build filter conditions
            conditions = []
            params = {"limit": page_size, "offset": (page - 1) * page_size}
            
            if admin_user_id:
                conditions.append("admin_user_id = :admin_user_id")
                params["admin_user_id"] = admin_user_id
            if action:
                conditions.append("action = :action")
                params["action"] = action.value
            if target_type:
                conditions.append("target_type = :target_type")
                params["target_type"] = target_type
            
            where_clause = " AND ".join(conditions) if conditions else "TRUE"
            
            # Get total count
            count_result = await conn.execute(
                text(f"SELECT COUNT(*) FROM admin_logs WHERE {where_clause}"),
                params
            )
            total = count_result.scalar()
            
            # Get logs
            result = await conn.execute(
                text(f"""
                    SELECT id, admin_user_id, action, target_type, target_id, 
                           details, ip_address, user_agent, created_at
                    FROM admin_logs
                    WHERE {where_clause}
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                params
            )
            
            logs = [
                AdminLog(
                    id=str(row.id),
                    admin_user_id=str(row.admin_user_id),
                    action=AdminAction(row.action),
                    target_type=row.target_type,
                    target_id=str(row.target_id) if row.target_id else None,
                    details=row.details or {},
                    ip_address=str(row.ip_address) if row.ip_address else None,
                    user_agent=row.user_agent,
                    created_at=row.created_at,
                )
                for row in result.fetchall()
            ]
            
            return AdminLogList(
                logs=logs,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=(total + page_size - 1) // page_size,
            )
    
    # ============================================
    # User Management Operations
    # ============================================
    
    async def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> UserAdminList:
        """Get paginated list of users with optional filters."""
        if self._use_mock:
            # Return mock users
            mock_users = [
                UserAdminView(
                    id="user-1",
                    email="admin@example.com",
                    display_name="Admin User",
                    role="admin",
                    is_active=True,
                    created_at=datetime.utcnow() - timedelta(days=30),
                    total_sessions=10,
                    total_questions_answered=50,
                    total_correct=40,
                    last_activity=datetime.utcnow() - timedelta(hours=1),
                ),
                UserAdminView(
                    id="user-2",
                    email="user@example.com",
                    display_name="Test User",
                    role="user",
                    is_active=True,
                    created_at=datetime.utcnow() - timedelta(days=15),
                    total_sessions=5,
                    total_questions_answered=25,
                    total_correct=18,
                    last_activity=datetime.utcnow() - timedelta(days=2),
                ),
            ]
            
            if role:
                mock_users = [u for u in mock_users if u.role == role]
            if is_active is not None:
                mock_users = [u for u in mock_users if u.is_active == is_active]
            if search:
                mock_users = [u for u in mock_users if search.lower() in u.email.lower()]
            
            total = len(mock_users)
            users = mock_users[(page - 1) * page_size:page * page_size]
            
            return UserAdminList(
                users=users,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=(total + page_size - 1) // page_size,
            )
        
        async with self._engine.begin() as conn:
            # Build filter conditions
            conditions = []
            params = {"limit": page_size, "offset": (page - 1) * page_size}
            
            if role:
                conditions.append("u.role = :role")
                params["role"] = role
            if is_active is not None:
                conditions.append("u.is_active = :is_active")
                params["is_active"] = is_active
            if search:
                conditions.append("(u.email ILIKE :search OR u.display_name ILIKE :search)")
                params["search"] = f"%{search}%"
            
            where_clause = " AND ".join(conditions) if conditions else "TRUE"
            
            # Get total count
            count_result = await conn.execute(
                text(f"SELECT COUNT(*) FROM users u WHERE {where_clause}"),
                params
            )
            total = count_result.scalar()
            
            # Get users with stats
            result = await conn.execute(
                text(f"""
                    SELECT 
                        u.id, u.email, u.display_name, u.role, u.is_active,
                        u.created_at, u.updated_at,
                        COUNT(DISTINCT s.id) as total_sessions,
                        COALESCE(SUM(s.total_questions), 0) as total_questions_answered,
                        COALESCE(SUM(s.correct_answers), 0) as total_correct,
                        MAX(s.started_at) as last_activity
                    FROM users u
                    LEFT JOIN sessions s ON u.id = s.user_id
                    WHERE {where_clause}
                    GROUP BY u.id
                    ORDER BY u.created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                params
            )
            
            users = [
                UserAdminView(
                    id=str(row.id),
                    email=row.email,
                    display_name=row.display_name,
                    role=row.role,
                    is_active=row.is_active,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                    total_sessions=row.total_sessions or 0,
                    total_questions_answered=row.total_questions_answered or 0,
                    total_correct=row.total_correct or 0,
                    last_activity=row.last_activity,
                )
                for row in result.fetchall()
            ]
            
            return UserAdminList(
                users=users,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=(total + page_size - 1) // page_size,
            )
    
    async def get_user(self, user_id: str) -> Optional[UserAdminView]:
        """Get a single user with activity stats."""
        if self._use_mock:
            return UserAdminView(
                id=user_id,
                email="user@example.com",
                display_name="Test User",
                role="user",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=15),
                total_sessions=5,
                total_questions_answered=25,
                total_correct=18,
                last_activity=datetime.utcnow() - timedelta(days=2),
            )
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    SELECT 
                        u.id, u.email, u.display_name, u.role, u.is_active,
                        u.created_at, u.updated_at,
                        COUNT(DISTINCT s.id) as total_sessions,
                        COALESCE(SUM(s.total_questions), 0) as total_questions_answered,
                        COALESCE(SUM(s.correct_answers), 0) as total_correct,
                        MAX(s.started_at) as last_activity
                    FROM users u
                    LEFT JOIN sessions s ON u.id = s.user_id
                    WHERE u.id = :user_id
                    GROUP BY u.id
                """),
                {"user_id": user_id}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            return UserAdminView(
                id=str(row.id),
                email=row.email,
                display_name=row.display_name,
                role=row.role,
                is_active=row.is_active,
                created_at=row.created_at,
                updated_at=row.updated_at,
                total_sessions=row.total_sessions or 0,
                total_questions_answered=row.total_questions_answered or 0,
                total_correct=row.total_correct or 0,
                last_activity=row.last_activity,
            )
    
    async def update_user(
        self,
        user_id: str,
        update: UserAdminUpdate,
    ) -> Optional[UserAdminView]:
        """Update a user's admin-editable fields."""
        if self._use_mock:
            return UserAdminView(
                id=user_id,
                email="user@example.com",
                display_name=update.display_name or "Test User",
                role=update.role or "user",
                is_active=update.is_active if update.is_active is not None else True,
                created_at=datetime.utcnow() - timedelta(days=15),
                total_sessions=5,
                total_questions_answered=25,
                total_correct=18,
            )
        
        async with self._engine.begin() as conn:
            # Build update query
            updates = []
            params = {"user_id": user_id}
            
            if update.role is not None:
                updates.append("role = :role")
                params["role"] = update.role
            if update.is_active is not None:
                updates.append("is_active = :is_active")
                params["is_active"] = update.is_active
            if update.display_name is not None:
                updates.append("display_name = :display_name")
                params["display_name"] = update.display_name
            
            if not updates:
                return await self.get_user(user_id)
            
            updates.append("updated_at = NOW()")
            
            await conn.execute(
                text(f"UPDATE users SET {', '.join(updates)} WHERE id = :user_id"),
                params
            )
            
            return await self.get_user(user_id)
    
    async def get_user_activity(self, user_id: str) -> Optional[UserActivityStats]:
        """Get detailed activity statistics for a user."""
        if self._use_mock:
            return UserActivityStats(
                user_id=user_id,
                sessions_count=5,
                questions_answered=25,
                correct_answers=18,
                accuracy=0.72,
                total_time_spent=3600,
                categories_practiced=["Lysosomal Storage Disorders", "Metabolic Disorders"],
                recent_sessions=[],
            )
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    SELECT 
                        COUNT(DISTINCT s.id) as sessions_count,
                        COALESCE(SUM(s.total_questions), 0) as questions_answered,
                        COALESCE(SUM(s.correct_answers), 0) as correct_answers,
                        COALESCE(SUM(s.time_spent_seconds), 0) as total_time_spent,
                        ARRAY_AGG(DISTINCT up.category) FILTER (WHERE up.category IS NOT NULL) as categories
                    FROM users u
                    LEFT JOIN sessions s ON u.id = s.user_id
                    LEFT JOIN user_progress up ON u.id = up.user_id
                    WHERE u.id = :user_id
                """),
                {"user_id": user_id}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            questions = row.questions_answered or 0
            correct = row.correct_answers or 0
            
            return UserActivityStats(
                user_id=user_id,
                sessions_count=row.sessions_count or 0,
                questions_answered=questions,
                correct_answers=correct,
                accuracy=correct / questions if questions > 0 else 0,
                total_time_spent=row.total_time_spent or 0,
                categories_practiced=row.categories or [],
                recent_sessions=[],  # Can be populated with more detailed query
            )
    
    # ============================================
    # Question Report Operations
    # ============================================
    
    async def create_report(
        self,
        report: QuestionReportCreate,
        reported_by: str,
    ) -> QuestionReport:
        """Create a new question report."""
        if self._use_mock:
            mock_report = {
                "id": str(uuid4()),
                "question_id": report.question_id,
                "reported_by": reported_by,
                "reason": report.reason,
                "description": report.description,
                "status": ReportStatus.PENDING,
                "created_at": datetime.utcnow(),
            }
            self._mock_reports.append(mock_report)
            return QuestionReport(**mock_report)
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    INSERT INTO question_reports 
                    (question_id, reported_by, reason, description)
                    VALUES (:question_id, :reported_by, :reason, :description)
                    RETURNING id, status, created_at
                """),
                {
                    "question_id": report.question_id,
                    "reported_by": reported_by,
                    "reason": report.reason.value,
                    "description": report.description,
                }
            )
            row = result.fetchone()
            return QuestionReport(
                id=str(row.id),
                question_id=report.question_id,
                reported_by=reported_by,
                reason=report.reason,
                description=report.description,
                status=ReportStatus(row.status),
                created_at=row.created_at,
            )
    
    async def get_reports(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ReportStatus] = None,
        reason: Optional[ReportReason] = None,
    ) -> QuestionReportList:
        """Get paginated list of question reports."""
        if self._use_mock:
            reports = self._mock_reports
            if status:
                reports = [r for r in reports if r["status"] == status]
            if reason:
                reports = [r for r in reports if r["reason"] == reason]
            
            total = len(reports)
            report_models = [
                QuestionReport(
                    id=r["id"],
                    question_id=r["question_id"],
                    reported_by=r["reported_by"],
                    reason=r["reason"],
                    description=r["description"],
                    status=r["status"],
                    created_at=r["created_at"],
                )
                for r in reports[(page - 1) * page_size:page * page_size]
            ]
            
            return QuestionReportList(
                reports=report_models,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=(total + page_size - 1) // page_size,
            )
        
        async with self._engine.begin() as conn:
            conditions = []
            params = {"limit": page_size, "offset": (page - 1) * page_size}
            
            if status:
                conditions.append("qr.status = :status")
                params["status"] = status.value
            if reason:
                conditions.append("qr.reason = :reason")
                params["reason"] = reason.value
            
            where_clause = " AND ".join(conditions) if conditions else "TRUE"
            
            # Get total count
            count_result = await conn.execute(
                text(f"SELECT COUNT(*) FROM question_reports qr WHERE {where_clause}"),
                params
            )
            total = count_result.scalar()
            
            # Get reports with question info
            result = await conn.execute(
                text(f"""
                    SELECT 
                        qr.id, qr.question_id, qr.reported_by, qr.reason, qr.description,
                        qr.status, qr.reviewed_by, qr.reviewed_at, qr.resolution_note,
                        qr.created_at,
                        q.stem as question_stem, q.category as question_category
                    FROM question_reports qr
                    LEFT JOIN questions q ON qr.question_id = q.id
                    WHERE {where_clause}
                    ORDER BY qr.created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                params
            )
            
            reports = [
                QuestionReport(
                    id=str(row.id),
                    question_id=str(row.question_id),
                    reported_by=str(row.reported_by) if row.reported_by else None,
                    reason=ReportReason(row.reason),
                    description=row.description,
                    status=ReportStatus(row.status),
                    reviewed_by=str(row.reviewed_by) if row.reviewed_by else None,
                    reviewed_at=row.reviewed_at,
                    resolution_note=row.resolution_note,
                    created_at=row.created_at,
                    question_stem=row.question_stem[:100] + "..." if row.question_stem and len(row.question_stem) > 100 else row.question_stem,
                    question_category=row.question_category,
                )
                for row in result.fetchall()
            ]
            
            return QuestionReportList(
                reports=reports,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=(total + page_size - 1) // page_size,
            )
    
    async def resolve_report(
        self,
        report_id: str,
        resolve: QuestionReportResolve,
        reviewed_by: str,
    ) -> Optional[QuestionReport]:
        """Resolve a question report."""
        if self._use_mock:
            for report in self._mock_reports:
                if report["id"] == report_id:
                    report["status"] = resolve.status
                    report["reviewed_by"] = reviewed_by
                    report["reviewed_at"] = datetime.utcnow()
                    report["resolution_note"] = resolve.resolution_note
                    return QuestionReport(**report)
            return None
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    UPDATE question_reports
                    SET status = :status, reviewed_by = :reviewed_by,
                        reviewed_at = NOW(), resolution_note = :resolution_note
                    WHERE id = :report_id
                    RETURNING id, question_id, reported_by, reason, description,
                              status, reviewed_by, reviewed_at, resolution_note, created_at
                """),
                {
                    "report_id": report_id,
                    "status": resolve.status.value,
                    "reviewed_by": reviewed_by,
                    "resolution_note": resolve.resolution_note,
                }
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            return QuestionReport(
                id=str(row.id),
                question_id=str(row.question_id),
                reported_by=str(row.reported_by) if row.reported_by else None,
                reason=ReportReason(row.reason),
                description=row.description,
                status=ReportStatus(row.status),
                reviewed_by=str(row.reviewed_by) if row.reviewed_by else None,
                reviewed_at=row.reviewed_at,
                resolution_note=row.resolution_note,
                created_at=row.created_at,
            )
    
    # ============================================
    # Settings Operations
    # ============================================
    
    async def get_settings(self) -> AdminSettingsList:
        """Get all admin settings."""
        if self._use_mock:
            settings_list = [
                AdminSetting(
                    key=k,
                    value=v["value"],
                    description=v.get("description"),
                    updated_at=datetime.utcnow(),
                )
                for k, v in self._mock_settings.items()
            ]
            return AdminSettingsList(settings=settings_list)
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("SELECT key, value, description, updated_by, updated_at FROM admin_settings")
            )
            
            settings_list = [
                AdminSetting(
                    key=row.key,
                    value=row.value,
                    description=row.description,
                    updated_by=str(row.updated_by) if row.updated_by else None,
                    updated_at=row.updated_at,
                )
                for row in result.fetchall()
            ]
            
            return AdminSettingsList(settings=settings_list)
    
    async def get_setting(self, key: str) -> Optional[AdminSetting]:
        """Get a single admin setting."""
        if self._use_mock:
            if key not in self._mock_settings:
                return None
            s = self._mock_settings[key]
            return AdminSetting(
                key=key,
                value=s["value"],
                description=s.get("description"),
                updated_at=datetime.utcnow(),
            )
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("SELECT key, value, description, updated_by, updated_at FROM admin_settings WHERE key = :key"),
                {"key": key}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            return AdminSetting(
                key=row.key,
                value=row.value,
                description=row.description,
                updated_by=str(row.updated_by) if row.updated_by else None,
                updated_at=row.updated_at,
            )
    
    async def update_setting(
        self,
        key: str,
        update: AdminSettingUpdate,
        updated_by: str,
    ) -> Optional[AdminSetting]:
        """Update an admin setting."""
        if self._use_mock:
            if key not in self._mock_settings:
                return None
            self._mock_settings[key]["value"] = update.value
            return AdminSetting(
                key=key,
                value=update.value,
                description=self._mock_settings[key].get("description"),
                updated_at=datetime.utcnow(),
            )
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    UPDATE admin_settings
                    SET value = :value::jsonb, updated_by = :updated_by, updated_at = NOW()
                    WHERE key = :key
                    RETURNING key, value, description, updated_by, updated_at
                """),
                {"key": key, "value": json.dumps(update.value), "updated_by": updated_by}
            )
            row = result.fetchone()
            
            if not row:
                return None
            
            return AdminSetting(
                key=row.key,
                value=row.value,
                description=row.description,
                updated_by=str(row.updated_by),
                updated_at=row.updated_at,
            )
    
    # ============================================
    # Analytics Operations
    # ============================================
    
    async def get_dashboard_stats(self) -> AdminDashboardStats:
        """Get dashboard statistics for admin panel."""
        overview = await self._get_analytics_overview()
        recent_logs = (await self.get_logs(page=1, page_size=10)).logs
        pending_reports = (await self.get_reports(page=1, page_size=5, status=ReportStatus.PENDING)).reports
        recent_users = (await self.get_users(page=1, page_size=5)).users
        
        return AdminDashboardStats(
            overview=overview,
            recent_logs=recent_logs,
            pending_reports=pending_reports,
            recent_users=recent_users,
        )
    
    async def _get_analytics_overview(self) -> AdminAnalyticsOverview:
        """Get overview analytics statistics."""
        if self._use_mock:
            return AdminAnalyticsOverview(
                total_users=100,
                active_users_today=15,
                active_users_week=45,
                active_users_month=80,
                new_users_today=3,
                new_users_week=12,
                total_sessions=500,
                sessions_today=25,
                sessions_week=150,
                avg_session_duration=12.5,
                total_questions=50,
                questions_answered_today=120,
                avg_accuracy=0.75,
                pending_reports=2,
                resolved_reports_week=5,
                database_size_mb=150.5,
                cache_hit_rate=0.85,
            )
        
        async with self._engine.begin() as conn:
            today = date.today()
            week_ago = today - timedelta(days=7)
            month_ago = today - timedelta(days=30)
            
            # User stats
            user_stats = await conn.execute(
                text("""
                    SELECT 
                        COUNT(*) as total_users,
                        COUNT(*) FILTER (WHERE created_at::date = :today) as new_users_today,
                        COUNT(*) FILTER (WHERE created_at >= :week_ago) as new_users_week
                    FROM users
                """),
                {"today": today, "week_ago": week_ago}
            )
            user_row = user_stats.fetchone()
            
            # Active users
            active_stats = await conn.execute(
                text("""
                    SELECT 
                        COUNT(DISTINCT user_id) FILTER (WHERE started_at::date = :today) as active_today,
                        COUNT(DISTINCT user_id) FILTER (WHERE started_at >= :week_ago) as active_week,
                        COUNT(DISTINCT user_id) FILTER (WHERE started_at >= :month_ago) as active_month
                    FROM sessions
                """),
                {"today": today, "week_ago": week_ago, "month_ago": month_ago}
            )
            active_row = active_stats.fetchone()
            
            # Session stats
            session_stats = await conn.execute(
                text("""
                    SELECT 
                        COUNT(*) as total_sessions,
                        COUNT(*) FILTER (WHERE started_at::date = :today) as sessions_today,
                        COUNT(*) FILTER (WHERE started_at >= :week_ago) as sessions_week,
                        AVG(time_spent_seconds)::float / 60 as avg_duration
                    FROM sessions
                """),
                {"today": today, "week_ago": week_ago}
            )
            session_row = session_stats.fetchone()
            
            # Question stats
            question_stats = await conn.execute(
                text("""
                    SELECT 
                        COUNT(*) as total_questions,
                        SUM(times_answered) as total_answered,
                        CASE WHEN SUM(times_answered) > 0 
                             THEN SUM(times_correct)::float / SUM(times_answered)
                             ELSE 0 END as avg_accuracy
                    FROM questions
                    WHERE is_active = TRUE
                """)
            )
            question_row = question_stats.fetchone()
            
            # Report stats
            report_stats = await conn.execute(
                text("""
                    SELECT 
                        COUNT(*) FILTER (WHERE status = 'pending') as pending,
                        COUNT(*) FILTER (WHERE status = 'resolved' AND reviewed_at >= :week_ago) as resolved_week
                    FROM question_reports
                """),
                {"week_ago": week_ago}
            )
            report_row = report_stats.fetchone()
            
            return AdminAnalyticsOverview(
                total_users=user_row.total_users or 0,
                active_users_today=active_row.active_today or 0,
                active_users_week=active_row.active_week or 0,
                active_users_month=active_row.active_month or 0,
                new_users_today=user_row.new_users_today or 0,
                new_users_week=user_row.new_users_week or 0,
                total_sessions=session_row.total_sessions or 0,
                sessions_today=session_row.sessions_today or 0,
                sessions_week=session_row.sessions_week or 0,
                avg_session_duration=session_row.avg_duration or 0,
                total_questions=question_row.total_questions or 0,
                questions_answered_today=question_row.total_answered or 0,
                avg_accuracy=question_row.avg_accuracy or 0,
                pending_reports=report_row.pending or 0,
                resolved_reports_week=report_row.resolved_week or 0,
                database_size_mb=0,  # Would need admin query
                cache_hit_rate=0,  # Would need Redis stats
            )
    
    async def get_user_growth_stats(
        self,
        start_date: date,
        end_date: date,
    ) -> List[UserGrowthStats]:
        """Get user growth statistics for a date range."""
        if self._use_mock:
            stats = []
            current = start_date
            total = 50
            while current <= end_date:
                new_users = 2 + (current.day % 5)
                total += new_users
                stats.append(UserGrowthStats(
                    date=current,
                    new_users=new_users,
                    total_users=total,
                    active_users=10 + (current.day % 20),
                ))
                current += timedelta(days=1)
            return stats
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    SELECT 
                        d::date as date,
                        COALESCE(new_users, 0) as new_users,
                        COALESCE(running_total, 0) as total_users,
                        COALESCE(active_users, 0) as active_users
                    FROM generate_series(:start_date, :end_date, '1 day'::interval) d
                    LEFT JOIN (
                        SELECT 
                            created_at::date as created_date,
                            COUNT(*) as new_users
                        FROM users
                        WHERE created_at::date BETWEEN :start_date AND :end_date
                        GROUP BY created_at::date
                    ) u ON d::date = u.created_date
                    LEFT JOIN (
                        SELECT 
                            started_at::date as activity_date,
                            COUNT(DISTINCT user_id) as active_users
                        FROM sessions
                        WHERE started_at::date BETWEEN :start_date AND :end_date
                        GROUP BY started_at::date
                    ) a ON d::date = a.activity_date
                    LEFT JOIN (
                        SELECT 
                            created_at::date as total_date,
                            SUM(COUNT(*)) OVER (ORDER BY created_at::date) as running_total
                        FROM users
                        WHERE created_at::date <= :end_date
                        GROUP BY created_at::date
                    ) t ON d::date = t.total_date
                    ORDER BY d::date
                """),
                {"start_date": start_date, "end_date": end_date}
            )
            
            return [
                UserGrowthStats(
                    date=row.date,
                    new_users=row.new_users,
                    total_users=row.total_users,
                    active_users=row.active_users,
                )
                for row in result.fetchall()
            ]
    
    async def get_category_stats(self) -> List[CategoryStats]:
        """Get statistics by category."""
        if self._use_mock:
            return [
                CategoryStats(
                    category="Lysosomal Storage Disorders",
                    total_questions=15,
                    times_practiced=100,
                    avg_accuracy=0.75,
                    unique_users=25,
                ),
                CategoryStats(
                    category="Metabolic Disorders",
                    total_questions=10,
                    times_practiced=80,
                    avg_accuracy=0.68,
                    unique_users=20,
                ),
            ]
        
        async with self._engine.begin() as conn:
            result = await conn.execute(
                text("""
                    SELECT 
                        q.category,
                        COUNT(DISTINCT q.id) as total_questions,
                        SUM(q.times_answered) as times_practiced,
                        CASE WHEN SUM(q.times_answered) > 0
                             THEN SUM(q.times_correct)::float / SUM(q.times_answered)
                             ELSE 0 END as avg_accuracy,
                        COUNT(DISTINCT s.user_id) as unique_users
                    FROM questions q
                    LEFT JOIN session_questions sq ON q.id = sq.question_id
                    LEFT JOIN sessions s ON sq.session_id = s.id
                    WHERE q.is_active = TRUE
                    GROUP BY q.category
                    ORDER BY times_practiced DESC
                """)
            )
            
            return [
                CategoryStats(
                    category=row.category,
                    total_questions=row.total_questions,
                    times_practiced=row.times_practiced or 0,
                    avg_accuracy=row.avg_accuracy,
                    unique_users=row.unique_users or 0,
                )
                for row in result.fetchall()
            ]


# Singleton instance
admin_repository = AdminRepository()
