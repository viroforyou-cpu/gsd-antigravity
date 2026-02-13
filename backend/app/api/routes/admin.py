"""
Admin API Routes - endpoints for admin dashboard.
All endpoints require admin role authentication.
"""
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from ...services.auth_service import require_admin, User
from ...services.admin_service import admin_service
from ...models.admin import (
    AdminLogList, AdminAction,
    UserAdminView, UserAdminUpdate, UserAdminList, UserActivityStats,
    QuestionReport, QuestionReportCreate, QuestionReportResolve, QuestionReportList,
    AdminSetting, AdminSettingUpdate, AdminSettingsList,
    AdminAnalyticsOverview, UserGrowthStats, CategoryStats,
    AdminDashboardStats, DateRangeRequest,
    ReportReason, ReportStatus,
)


router = APIRouter(prefix="/admin", tags=["admin"])


# ============================================
# Helper Functions
# ============================================

def get_client_info(request: Request) -> tuple:
    """Extract client IP and user agent from request."""
    ip_address = request.client.host if request.client else None
    # Check for forwarded header (behind proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    user_agent = request.headers.get("User-Agent")
    return ip_address, user_agent


# ============================================
# Dashboard
# ============================================

@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_dashboard(
    current_user: User = Depends(require_admin),
):
    """Get admin dashboard statistics."""
    return await admin_service.get_dashboard_stats()


# ============================================
# User Management
# ============================================

@router.get("/users", response_model=UserAdminList)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
):
    """Get paginated list of users with optional filters."""
    return await admin_service.get_users(
        page=page,
        page_size=page_size,
        role=role,
        is_active=is_active,
        search=search,
    )


@router.get("/users/{user_id}", response_model=UserAdminView)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    """Get a single user with activity stats."""
    user = await admin_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=UserAdminView)
async def update_user(
    user_id: str,
    update: UserAdminUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Update a user's role or status."""
    ip_address, user_agent = get_client_info(request)
    
    user = await admin_service.update_user(
        user_id=user_id,
        update=update,
        admin_user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/users/{user_id}/deactivate", response_model=UserAdminView)
async def deactivate_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Deactivate a user account."""
    ip_address, user_agent = get_client_info(request)
    
    user = await admin_service.deactivate_user(
        user_id=user_id,
        admin_user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/users/{user_id}/activate", response_model=UserAdminView)
async def activate_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Activate a user account."""
    ip_address, user_agent = get_client_info(request)
    
    user = await admin_service.activate_user(
        user_id=user_id,
        admin_user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.get("/users/{user_id}/activity", response_model=UserActivityStats)
async def get_user_activity(
    user_id: str,
    current_user: User = Depends(require_admin),
):
    """Get detailed activity statistics for a user."""
    activity = await admin_service.get_user_activity(user_id)
    if not activity:
        raise HTTPException(status_code=404, detail="User not found")
    return activity


# ============================================
# Question Reports
# ============================================

@router.get("/reports", response_model=QuestionReportList)
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[ReportStatus] = Query(None),
    reason: Optional[ReportReason] = Query(None),
    current_user: User = Depends(require_admin),
):
    """Get paginated list of question reports."""
    return await admin_service.get_reports(
        page=page,
        page_size=page_size,
        status=status,
        reason=reason,
    )


@router.get("/reports/{report_id}", response_model=QuestionReport)
async def get_report(
    report_id: str,
    current_user: User = Depends(require_admin),
):
    """Get a single question report."""
    reports = await admin_service.get_reports(page=1, page_size=1000)
    for report in reports.reports:
        if report.id == report_id:
            return report
    raise HTTPException(status_code=404, detail="Report not found")


@router.put("/reports/{report_id}/resolve", response_model=QuestionReport)
async def resolve_report(
    report_id: str,
    resolve: QuestionReportResolve,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Resolve a question report."""
    ip_address, user_agent = get_client_info(request)
    
    report = await admin_service.resolve_report(
        report_id=report_id,
        resolve=resolve,
        admin_user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


# ============================================
# Settings
# ============================================

@router.get("/settings", response_model=AdminSettingsList)
async def list_settings(
    current_user: User = Depends(require_admin),
):
    """Get all admin settings."""
    return await admin_service.get_settings()


@router.get("/settings/{key}", response_model=AdminSetting)
async def get_setting(
    key: str,
    current_user: User = Depends(require_admin),
):
    """Get a single admin setting."""
    setting = await admin_service.get_setting(key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


@router.put("/settings/{key}", response_model=AdminSetting)
async def update_setting(
    key: str,
    update: AdminSettingUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Update an admin setting."""
    ip_address, user_agent = get_client_info(request)
    
    setting = await admin_service.update_setting(
        key=key,
        update=update,
        admin_user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    return setting


# ============================================
# Analytics
# ============================================

@router.get("/analytics/overview", response_model=AdminAnalyticsOverview)
async def get_analytics_overview(
    current_user: User = Depends(require_admin),
):
    """Get overview analytics statistics."""
    return await admin_service.get_analytics_overview()


@router.get("/analytics/users/growth", response_model=list[UserGrowthStats])
async def get_user_growth(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(require_admin),
):
    """Get user growth statistics for a date range."""
    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="end_date must be after start_date"
        )
    
    # Limit to 90 days
    from datetime import timedelta
    if (end_date - start_date).days > 90:
        raise HTTPException(
            status_code=400,
            detail="Date range cannot exceed 90 days"
        )
    
    return await admin_service.get_user_growth(
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/analytics/categories", response_model=list[CategoryStats])
async def get_category_stats(
    current_user: User = Depends(require_admin),
):
    """Get statistics by category."""
    return await admin_service.get_category_stats()


# ============================================
# Admin Logs
# ============================================

@router.get("/logs", response_model=AdminLogList)
async def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin_user_id: Optional[str] = Query(None),
    action: Optional[AdminAction] = Query(None),
    target_type: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
):
    """Get paginated admin action logs."""
    return await admin_service.get_logs(
        page=page,
        page_size=page_size,
        admin_user_id=admin_user_id,
        action=action,
        target_type=target_type,
    )


# ============================================
# Health Check
# ============================================

@router.get("/health")
async def health_check(
    current_user: User = Depends(require_admin),
):
    """Check admin API health."""
    return {"status": "healthy", "admin": current_user.email}
