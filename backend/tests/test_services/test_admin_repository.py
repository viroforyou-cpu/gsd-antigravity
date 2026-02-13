"""
Tests for Admin Repository - tests all admin data access operations.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
import uuid

from app.services.admin_repository import AdminRepository
from app.models.admin import (
    AdminLog, AdminAction,
    UserAdminView, UserAdminUpdate, UserAdminList, UserActivityStats,
    QuestionReport, QuestionReportCreate, QuestionReportResolve, QuestionReportList,
    AdminSetting, AdminSettingUpdate,
    AdminAnalyticsOverview, UserGrowthStats,
    ReportReason, ReportStatus,
)


@pytest.fixture
def admin_repo():
    """Create an admin repository instance with mock data."""
    with patch('app.services.admin_repository.settings') as mock_settings:
        mock_settings.use_mock_data = True
        repo = AdminRepository()
        repo._use_mock = True
        return repo


@pytest.fixture
def sample_user_id():
    """Sample user ID for testing."""
    return str(uuid.uuid4())


@pytest.fixture
def sample_admin_id():
    """Sample admin user ID for testing."""
    return str(uuid.uuid4())


class TestAdminLogOperations:
    """Tests for admin log operations."""
    
    @pytest.mark.asyncio
    async def test_create_log_mock(self, admin_repo, sample_admin_id):
        """Test creating an admin log entry in mock mode."""
        log = await admin_repo.create_log(
            admin_user_id=sample_admin_id,
            action=AdminAction.USER_ACTIVATE,
            target_type="user",
            target_id="user-123",
            details={"reason": "Account activated"},
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
        )
        
        assert log.id is not None
        assert log.admin_user_id == sample_admin_id
        assert log.action == AdminAction.USER_ACTIVATE
        assert log.target_type == "user"
        assert log.target_id == "user-123"
        assert log.details == {"reason": "Account activated"}
        assert log.ip_address == "192.168.1.1"
        assert log.user_agent == "Mozilla/5.0"
        assert log.created_at is not None
    
    @pytest.mark.asyncio
    async def test_create_log_minimal(self, admin_repo, sample_admin_id):
        """Test creating a log with minimal data."""
        log = await admin_repo.create_log(
            admin_user_id=sample_admin_id,
            action=AdminAction.SETTINGS_UPDATE,
        )
        
        assert log.id is not None
        assert log.admin_user_id == sample_admin_id
        assert log.action == AdminAction.SETTINGS_UPDATE
        assert log.target_type is None
        assert log.target_id is None
        assert log.details == {}
    
    @pytest.mark.asyncio
    async def test_get_logs_empty(self, admin_repo):
        """Test getting logs when none exist."""
        logs = await admin_repo.get_logs()
        assert logs.logs == []
        assert logs.total == 0
    
    @pytest.mark.asyncio
    async def test_get_logs_with_data(self, admin_repo, sample_admin_id):
        """Test getting logs with data."""
        # Create some logs
        await admin_repo.create_log(
            admin_user_id=sample_admin_id,
            action=AdminAction.USER_ACTIVATE,
            target_type="user",
            target_id="user-1",
        )
        await admin_repo.create_log(
            admin_user_id=sample_admin_id,
            action=AdminAction.USER_DEACTIVATE,
            target_type="user",
            target_id="user-2",
        )
        
        logs = await admin_repo.get_logs()
        assert len(logs.logs) == 2
        assert logs.total == 2
    
    @pytest.mark.asyncio
    async def test_get_logs_pagination(self, admin_repo, sample_admin_id):
        """Test log pagination."""
        # Create 5 logs
        for i in range(5):
            await admin_repo.create_log(
                admin_user_id=sample_admin_id,
                action=AdminAction.USER_ACTIVATE,
                target_type="user",
                target_id=f"user-{i}",
            )
        
        # Get first page
        logs_page1 = await admin_repo.get_logs(page=1, page_size=2)
        assert len(logs_page1.logs) == 2
        assert logs_page1.total == 5
        
        # Get second page
        logs_page2 = await admin_repo.get_logs(page=2, page_size=2)
        assert len(logs_page2.logs) == 2
        assert logs_page2.total == 5
        
        # Get last page
        logs_page3 = await admin_repo.get_logs(page=3, page_size=2)
        assert len(logs_page3.logs) == 1
        assert logs_page3.total == 5
    
    @pytest.mark.asyncio
    async def test_get_logs_filter_by_action(self, admin_repo, sample_admin_id):
        """Test filtering logs by action."""
        await admin_repo.create_log(
            admin_user_id=sample_admin_id,
            action=AdminAction.USER_ACTIVATE,
        )
        await admin_repo.create_log(
            admin_user_id=sample_admin_id,
            action=AdminAction.USER_DEACTIVATE,
        )
        
        logs = await admin_repo.get_logs(action=AdminAction.USER_ACTIVATE)
        assert len(logs.logs) == 1
        assert logs.logs[0].action == AdminAction.USER_ACTIVATE


class TestUserManagement:
    """Tests for user management operations."""
    
    @pytest.mark.asyncio
    async def test_get_users_mock_data(self, admin_repo):
        """Test getting users returns mock data."""
        users = await admin_repo.get_users()
        # Mock mode returns 2 default users
        assert users.total >= 0
        assert users.page == 1
    
    @pytest.mark.asyncio
    async def test_get_users_filter_by_role(self, admin_repo):
        """Test filtering users by role."""
        users = await admin_repo.get_users(role="admin")
        for user in users.users:
            assert user.role == "admin"
    
    @pytest.mark.asyncio
    async def test_get_users_filter_by_status(self, admin_repo):
        """Test filtering users by active status."""
        active_users = await admin_repo.get_users(is_active=True)
        for user in active_users.users:
            assert user.is_active is True
    
    @pytest.mark.asyncio
    async def test_get_user(self, admin_repo):
        """Test getting a user by ID."""
        user = await admin_repo.get_user("user-1")
        # In mock mode, returns a mock user
        assert user is not None
        assert user.id == "user-1"
    
    @pytest.mark.asyncio
    async def test_update_user_role(self, admin_repo, sample_user_id):
        """Test updating a user's role."""
        updated_user = await admin_repo.update_user(
            sample_user_id,
            UserAdminUpdate(role="admin"),
        )
        
        assert updated_user is not None
        assert updated_user.role == "admin"
    
    @pytest.mark.asyncio
    async def test_update_user_status(self, admin_repo, sample_user_id):
        """Test updating a user's active status."""
        updated_user = await admin_repo.update_user(
            sample_user_id,
            UserAdminUpdate(is_active=False),
        )
        
        assert updated_user is not None
        assert updated_user.is_active is False


class TestQuestionReports:
    """Tests for question report operations."""
    
    @pytest.mark.asyncio
    async def test_create_report(self, admin_repo, sample_user_id):
        """Test creating a question report."""
        report = await admin_repo.create_report(
            QuestionReportCreate(
                question_id="question-1",
                reason=ReportReason.INCORRECT,
                description="The correct answer should be B",
            ),
            reported_by=sample_user_id,
        )
        
        assert report.id is not None
        assert report.question_id == "question-1"
        assert report.reason == ReportReason.INCORRECT
        assert report.description == "The correct answer should be B"
        assert report.status == ReportStatus.PENDING
        assert report.reported_by == sample_user_id
    
    @pytest.mark.asyncio
    async def test_get_reports_with_data(self, admin_repo, sample_user_id):
        """Test getting reports with data."""
        await admin_repo.create_report(
            QuestionReportCreate(
                question_id="q1",
                reason=ReportReason.INCORRECT,
            ),
            reported_by=sample_user_id,
        )
        await admin_repo.create_report(
            QuestionReportCreate(
                question_id="q2",
                reason=ReportReason.UNCLEAR,
            ),
            reported_by=sample_user_id,
        )
        
        reports = await admin_repo.get_reports()
        assert len(reports.reports) == 2
        assert reports.total == 2
    
    @pytest.mark.asyncio
    async def test_get_reports_filter_by_status(self, admin_repo, sample_user_id):
        """Test filtering reports by status."""
        await admin_repo.create_report(
            QuestionReportCreate(
                question_id="q1",
                reason=ReportReason.INCORRECT,
            ),
            reported_by=sample_user_id,
        )
        
        # Create and resolve a report
        report = await admin_repo.create_report(
            QuestionReportCreate(
                question_id="q2",
                reason=ReportReason.UNCLEAR,
            ),
            reported_by=sample_user_id,
        )
        await admin_repo.resolve_report(
            report.id,
            QuestionReportResolve(
                status=ReportStatus.RESOLVED,
                resolution_note="Fixed the question",
            ),
            reviewed_by=sample_user_id,
        )
        
        pending_reports = await admin_repo.get_reports(status=ReportStatus.PENDING)
        assert len(pending_reports.reports) == 1
        
        resolved_reports = await admin_repo.get_reports(status=ReportStatus.RESOLVED)
        assert len(resolved_reports.reports) == 1
    
    @pytest.mark.asyncio
    async def test_resolve_report(self, admin_repo, sample_user_id, sample_admin_id):
        """Test resolving a report."""
        report = await admin_repo.create_report(
            QuestionReportCreate(
                question_id="q1",
                reason=ReportReason.INCORRECT,
                description="Wrong answer",
            ),
            reported_by=sample_user_id,
        )
        
        resolved = await admin_repo.resolve_report(
            report.id,
            QuestionReportResolve(
                status=ReportStatus.RESOLVED,
                resolution_note="Corrected the answer",
            ),
            reviewed_by=sample_admin_id,
        )
        
        assert resolved is not None
        assert resolved.status == ReportStatus.RESOLVED
        assert resolved.resolution_note == "Corrected the answer"
        assert resolved.reviewed_by == sample_admin_id
        assert resolved.reviewed_at is not None
    
    @pytest.mark.asyncio
    async def test_resolve_report_not_found(self, admin_repo, sample_admin_id):
        """Test resolving a non-existent report."""
        resolved = await admin_repo.resolve_report(
            "non-existent-id",
            QuestionReportResolve(
                status=ReportStatus.RESOLVED,
                resolution_note="Note",
            ),
            reviewed_by=sample_admin_id,
        )
        assert resolved is None


class TestAdminSettings:
    """Tests for admin settings operations."""
    
    @pytest.mark.asyncio
    async def test_get_settings(self, admin_repo):
        """Test getting all settings."""
        settings = await admin_repo.get_settings()
        
        assert len(settings) >= 4  # Default settings
        keys = [s.key for s in settings]
        assert "maintenance_mode" in keys
        assert "registration_enabled" in keys
        assert "max_questions_per_session" in keys
        assert "rate_limit_requests" in keys
    
    @pytest.mark.asyncio
    async def test_get_setting(self, admin_repo):
        """Test getting a specific setting."""
        setting = await admin_repo.get_setting("maintenance_mode")
        
        assert setting is not None
        assert setting.key == "maintenance_mode"
        assert setting.value == {"enabled": False}
    
    @pytest.mark.asyncio
    async def test_get_setting_not_found(self, admin_repo):
        """Test getting a non-existent setting."""
        setting = await admin_repo.get_setting("non_existent_setting")
        assert setting is None
    
    @pytest.mark.asyncio
    async def test_update_setting(self, admin_repo, sample_admin_id):
        """Test updating a setting."""
        updated = await admin_repo.update_setting(
            "maintenance_mode",
            AdminSettingUpdate(value={"enabled": True}),
            updated_by=sample_admin_id,
        )
        
        assert updated is not None
        assert updated.value == {"enabled": True}
    
    @pytest.mark.asyncio
    async def test_update_setting_not_found(self, admin_repo, sample_admin_id):
        """Test updating a non-existent setting."""
        updated = await admin_repo.update_setting(
            "non_existent_setting",
            AdminSettingUpdate(value={"test": "value"}),
            updated_by=sample_admin_id,
        )
        assert updated is None


class TestAnalytics:
    """Tests for analytics operations."""
    
    @pytest.mark.asyncio
    async def test_get_analytics_overview(self, admin_repo):
        """Test getting analytics overview via dashboard stats."""
        stats = await admin_repo.get_dashboard_stats()
        
        assert stats is not None
        assert stats.overview is not None
        assert stats.overview.total_users >= 0
        assert stats.overview.active_users_today >= 0
        assert stats.overview.total_sessions >= 0
        assert stats.overview.total_questions >= 0
    
    @pytest.mark.asyncio
    async def test_get_user_growth_stats(self, admin_repo):
        """Test getting user growth statistics."""
        stats = await admin_repo.get_user_growth_stats()
        
        assert stats is not None
        assert len(stats) > 0  # Should have some days of data
        for stat in stats:
            assert hasattr(stat, 'date')
            assert hasattr(stat, 'new_users')
            assert hasattr(stat, 'active_users')
    
    @pytest.mark.asyncio
    async def test_get_category_stats(self, admin_repo):
        """Test getting category statistics."""
        stats = await admin_repo.get_category_stats()
        
        assert stats is not None
        # Should return list of category stats
        for stat in stats:
            assert hasattr(stat, 'category')
            assert hasattr(stat, 'total_questions')
    
    @pytest.mark.asyncio
    async def test_get_dashboard_stats(self, admin_repo):
        """Test getting dashboard statistics."""
        stats = await admin_repo.get_dashboard_stats()
        
        assert stats is not None
        assert stats.overview is not None
        assert stats.recent_logs is not None
        assert stats.pending_reports is not None
        assert stats.recent_users is not None


class TestAdminRepositoryMockMode:
    """Tests for mock mode behavior."""
    
    @pytest.mark.asyncio
    async def test_mock_mode_uses_in_memory_storage(self, admin_repo, sample_admin_id):
        """Test that mock mode uses in-memory storage."""
        # Create a log
        log = await admin_repo.create_log(
            admin_user_id=sample_admin_id,
            action=AdminAction.USER_ACTIVATE,
        )
        
        # Verify it's stored in mock storage
        assert len(admin_repo._mock_logs) == 1
        assert admin_repo._mock_logs[0].id == log.id
    
    @pytest.mark.asyncio
    async def test_mock_settings_persist(self, admin_repo, sample_admin_id):
        """Test that mock settings persist across operations."""
        # Update a setting
        await admin_repo.update_setting(
            "maintenance_mode",
            AdminSettingUpdate(value={"enabled": True}),
            updated_by=sample_admin_id,
        )
        
        # Get the setting again
        setting = await admin_repo.get_setting("maintenance_mode")
        assert setting.value == {"enabled": True}
