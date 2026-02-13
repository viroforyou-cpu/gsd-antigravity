"""
Admin Service - business logic for admin operations.
Handles user management, question reports, settings, and analytics.
"""
from typing import Optional, List
from datetime import date

from .admin_repository import admin_repository
from ..models.admin import (
    AdminLog, AdminLogList, AdminAction,
    UserAdminView, UserAdminUpdate, UserAdminList, UserActivityStats,
    QuestionReport, QuestionReportCreate, QuestionReportResolve, QuestionReportList,
    AdminSetting, AdminSettingUpdate, AdminSettingsList,
    AdminAnalyticsOverview, UserGrowthStats, CategoryStats,
    AdminDashboardStats, DateRangeRequest,
    ReportReason, ReportStatus,
)


class AdminService:
    """Service for admin operations."""
    
    def __init__(self):
        self.repository = admin_repository
    
    # ============================================
    # Audit Logging
    # ============================================
    
    async def log_action(
        self,
        admin_user_id: str,
        action: AdminAction,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminLog:
        """Log an admin action for audit trail."""
        return await self.repository.create_log(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def get_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        admin_user_id: Optional[str] = None,
        action: Optional[AdminAction] = None,
        target_type: Optional[str] = None,
    ) -> AdminLogList:
        """Get paginated admin logs."""
        return await self.repository.get_logs(
            page=page,
            page_size=page_size,
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
        )
    
    # ============================================
    # User Management
    # ============================================
    
    async def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> UserAdminList:
        """Get paginated list of users."""
        return await self.repository.get_users(
            page=page,
            page_size=page_size,
            role=role,
            is_active=is_active,
            search=search,
        )
    
    async def get_user(self, user_id: str) -> Optional[UserAdminView]:
        """Get a single user with stats."""
        return await self.repository.get_user(user_id)
    
    async def update_user(
        self,
        user_id: str,
        update: UserAdminUpdate,
        admin_user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[UserAdminView]:
        """Update a user and log the action."""
        # Get original user for comparison
        original = await self.repository.get_user(user_id)
        if not original:
            return None
        
        # Update user
        updated = await self.repository.update_user(user_id, update)
        if not updated:
            return None
        
        # Determine action type and log
        details = {"user_email": original.email}
        if update.role is not None and update.role != original.role:
            details["old_role"] = original.role
            details["new_role"] = update.role
            await self.log_action(
                admin_user_id=admin_user_id,
                action=AdminAction.USER_ROLE_CHANGE,
                target_type="user",
                target_id=user_id,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        
        if update.is_active is not None and update.is_active != original.is_active:
            action = AdminAction.USER_ACTIVATE if update.is_active else AdminAction.USER_DEACTIVATE
            await self.log_action(
                admin_user_id=admin_user_id,
                action=action,
                target_type="user",
                target_id=user_id,
                details={"user_email": original.email},
                ip_address=ip_address,
                user_agent=user_agent,
            )
        
        return updated
    
    async def deactivate_user(
        self,
        user_id: str,
        admin_user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[UserAdminView]:
        """Deactivate a user account."""
        update = UserAdminUpdate(is_active=False)
        return await self.update_user(
            user_id=user_id,
            update=update,
            admin_user_id=admin_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def activate_user(
        self,
        user_id: str,
        admin_user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[UserAdminView]:
        """Activate a user account."""
        update = UserAdminUpdate(is_active=True)
        return await self.update_user(
            user_id=user_id,
            update=update,
            admin_user_id=admin_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    async def get_user_activity(self, user_id: str) -> Optional[UserActivityStats]:
        """Get detailed activity stats for a user."""
        return await self.repository.get_user_activity(user_id)
    
    # ============================================
    # Question Reports
    # ============================================
    
    async def create_report(
        self,
        report: QuestionReportCreate,
        reported_by: str,
    ) -> QuestionReport:
        """Create a new question report."""
        return await self.repository.create_report(
            report=report,
            reported_by=reported_by,
        )
    
    async def get_reports(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ReportStatus] = None,
        reason: Optional[ReportReason] = None,
    ) -> QuestionReportList:
        """Get paginated list of question reports."""
        return await self.repository.get_reports(
            page=page,
            page_size=page_size,
            status=status,
            reason=reason,
        )
    
    async def resolve_report(
        self,
        report_id: str,
        resolve: QuestionReportResolve,
        admin_user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[QuestionReport]:
        """Resolve a question report and log the action."""
        report = await self.repository.resolve_report(
            report_id=report_id,
            resolve=resolve,
            reviewed_by=admin_user_id,
        )
        
        if report:
            await self.log_action(
                admin_user_id=admin_user_id,
                action=AdminAction.REPORT_RESOLVE if resolve.status == ReportStatus.RESOLVED else AdminAction.REPORT_DISMISS,
                target_type="report",
                target_id=report_id,
                details={
                    "question_id": report.question_id,
                    "status": resolve.status.value,
                    "resolution_note": resolve.resolution_note,
                },
                ip_address=ip_address,
                user_agent=user_agent,
            )
        
        return report
    
    # ============================================
    # Settings
    # ============================================
    
    async def get_settings(self) -> AdminSettingsList:
        """Get all admin settings."""
        return await self.repository.get_settings()
    
    async def get_setting(self, key: str) -> Optional[AdminSetting]:
        """Get a single setting."""
        return await self.repository.get_setting(key)
    
    async def update_setting(
        self,
        key: str,
        update: AdminSettingUpdate,
        admin_user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[AdminSetting]:
        """Update a setting and log the action."""
        original = await self.repository.get_setting(key)
        if not original:
            return None
        
        updated = await self.repository.update_setting(
            key=key,
            update=update,
            updated_by=admin_user_id,
        )
        
        if updated:
            await self.log_action(
                admin_user_id=admin_user_id,
                action=AdminAction.SETTINGS_UPDATE,
                target_type="setting",
                target_id=key,
                details={
                    "old_value": original.value,
                    "new_value": update.value,
                },
                ip_address=ip_address,
                user_agent=user_agent,
            )
        
        return updated
    
    async def is_maintenance_mode(self) -> bool:
        """Check if maintenance mode is enabled."""
        setting = await self.repository.get_setting("maintenance_mode")
        return setting.value.get("enabled", False) if setting else False
    
    async def is_registration_enabled(self) -> bool:
        """Check if registration is enabled."""
        setting = await self.repository.get_setting("registration_enabled")
        return setting.value.get("enabled", True) if setting else True
    
    # ============================================
    # Analytics
    # ============================================
    
    async def get_dashboard_stats(self) -> AdminDashboardStats:
        """Get dashboard statistics."""
        return await self.repository.get_dashboard_stats()
    
    async def get_analytics_overview(self) -> AdminAnalyticsOverview:
        """Get overview analytics."""
        return await self.repository._get_analytics_overview()
    
    async def get_user_growth(
        self,
        start_date: date,
        end_date: date,
    ) -> List[UserGrowthStats]:
        """Get user growth statistics."""
        return await self.repository.get_user_growth_stats(
            start_date=start_date,
            end_date=end_date,
        )
    
    async def get_category_stats(self) -> List[CategoryStats]:
        """Get statistics by category."""
        return await self.repository.get_category_stats()


# Singleton instance
admin_service = AdminService()
