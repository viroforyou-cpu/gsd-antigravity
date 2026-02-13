"""
Study Plan API routes.
Handles CRUD operations for study plans, milestones, and daily tasks.
"""
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query

from ...models.study_plan import (
    StudyPlan, StudyPlanCreate, StudyPlanUpdate, StudyPlanSummary,
    StudyPlanProgress, PlanStatus,
    Milestone, MilestoneCreate, MilestoneUpdate,
    DailyTask, DailyTaskCreate, DailyTaskUpdate,
    TaskType, TaskStatus,
    TodayTasksSummary, CalendarMonth,
    TaskGenerationRequest
)
from ...services.study_plan_repository import study_plan_repository
from ...services.auth_service import get_current_user_optional

router = APIRouter(prefix="/study-plans", tags=["study-plans"])


# ========================================
# Study Plan CRUD
# ========================================

@router.get("", response_model=List[StudyPlanSummary])
async def get_study_plans(
    status: Optional[PlanStatus] = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user = Depends(get_current_user_optional)
):
    """
    Get all study plans for the current user.
    
    Supports filtering by status (active, paused, completed).
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return []
    
    return await study_plan_repository.get_user_plans(
        user_id=user_id,
        status=status,
        limit=limit,
        offset=offset
    )


@router.post("", response_model=StudyPlan)
async def create_study_plan(
    plan_create: StudyPlanCreate,
    user = Depends(get_current_user_optional)
):
    """
    Create a new study plan.
    
    The plan will be created with the provided settings and milestones.
    Tasks are not automatically generated - call the generate-tasks endpoint.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return await study_plan_repository.create_plan(
        user_id=user_id,
        plan_create=plan_create
    )


@router.get("/today", response_model=TodayTasksSummary)
async def get_today_tasks(
    user = Depends(get_current_user_optional)
):
    """
    Get a summary of today's tasks across all active study plans.
    
    Returns total tasks, completed tasks, and breakdown by plan.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return TodayTasksSummary(
            total_tasks=0,
            completed_tasks=0,
            total_questions_target=0,
            total_questions_completed=0,
            plans=[]
        )
    
    return await study_plan_repository.get_today_summary(user_id)


@router.get("/{plan_id}", response_model=StudyPlan)
async def get_study_plan(
    plan_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Get a specific study plan by ID.
    
    Returns the plan with all milestones included.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    plan = await study_plan_repository.get_plan_by_id(plan_id, user_id)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    return plan


@router.put("/{plan_id}", response_model=StudyPlan)
async def update_study_plan(
    plan_id: str,
    plan_update: StudyPlanUpdate,
    user = Depends(get_current_user_optional)
):
    """
    Update a study plan.
    
    Only provided fields will be updated.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    plan = await study_plan_repository.update_plan(plan_id, user_id, plan_update)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    return plan


@router.delete("/{plan_id}")
async def delete_study_plan(
    plan_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Delete a study plan and all related data (milestones, tasks).
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    success = await study_plan_repository.delete_plan(plan_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    return {"message": "Study plan deleted successfully"}


@router.put("/{plan_id}/status", response_model=StudyPlan)
async def update_plan_status(
    plan_id: str,
    status: PlanStatus = Query(..., description="New status"),
    user = Depends(get_current_user_optional)
):
    """
    Update only the status of a study plan.
    
    Use this to pause, resume, or complete a plan.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    plan = await study_plan_repository.update_plan_status(plan_id, user_id, status)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    return plan


# ========================================
# Progress and Calendar
# ========================================

@router.get("/{plan_id}/progress", response_model=StudyPlanProgress)
async def get_plan_progress(
    plan_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Get progress summary for a study plan.
    
    Returns milestone progress, task progress, streak, and overall completion.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    progress = await study_plan_repository.get_plan_progress(plan_id, user_id)
    
    if not progress:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    return progress


@router.get("/{plan_id}/calendar", response_model=CalendarMonth)
async def get_plan_calendar(
    plan_id: str,
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
    user = Depends(get_current_user_optional)
):
    """
    Get calendar view for a specific month.
    
    Returns all tasks for the month with completion status.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return await study_plan_repository.get_calendar_month(plan_id, user_id, year, month)


# ========================================
# Milestones
# ========================================

@router.get("/{plan_id}/milestones", response_model=List[Milestone])
async def get_milestones(
    plan_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Get all milestones for a study plan.
    
    Milestones are returned in order by order_index.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    plan = await study_plan_repository.get_plan_by_id(plan_id, user_id)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    return plan.milestones


@router.post("/{plan_id}/milestones", response_model=Milestone)
async def add_milestone(
    plan_id: str,
    milestone_create: MilestoneCreate,
    user = Depends(get_current_user_optional)
):
    """
    Add a milestone to a study plan.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    milestone = await study_plan_repository.add_milestone(
        plan_id, user_id, milestone_create
    )
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    return milestone


@router.put("/{plan_id}/milestones/{milestone_id}", response_model=Milestone)
async def update_milestone(
    plan_id: str,
    milestone_id: str,
    milestone_update: MilestoneUpdate,
    user = Depends(get_current_user_optional)
):
    """
    Update a milestone.
    
    Only provided fields will be updated.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    milestone = await study_plan_repository.update_milestone(
        plan_id, milestone_id, user_id, milestone_update
    )
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    return milestone


@router.delete("/{plan_id}/milestones/{milestone_id}")
async def delete_milestone(
    plan_id: str,
    milestone_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Delete a milestone from a study plan.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    success = await study_plan_repository.delete_milestone(
        plan_id, milestone_id, user_id
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    return {"message": "Milestone deleted successfully"}


@router.put("/{plan_id}/milestones/{milestone_id}/complete", response_model=Milestone)
async def complete_milestone(
    plan_id: str,
    milestone_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Mark a milestone as completed.
    
    Sets the completed_at timestamp to now.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    milestone = await study_plan_repository.complete_milestone(
        plan_id, milestone_id, user_id
    )
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    return milestone


# ========================================
# Daily Tasks
# ========================================

@router.get("/{plan_id}/tasks", response_model=List[DailyTask])
async def get_plan_tasks(
    plan_id: str,
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    user = Depends(get_current_user_optional)
):
    """
    Get tasks for a study plan within a date range.
    
    If no dates provided, returns all tasks.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    tasks = await study_plan_repository.get_plan_tasks(
        plan_id, user_id, start_date, end_date
    )
    
    return tasks


@router.put("/{plan_id}/tasks/{task_id}", response_model=DailyTask)
async def update_task(
    plan_id: str,
    task_id: str,
    task_update: DailyTaskUpdate,
    user = Depends(get_current_user_optional)
):
    """
    Update a daily task.
    
    Use this to mark progress or change status.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    task = await study_plan_repository.update_task(
        plan_id, task_id, user_id, task_update
    )
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task


@router.post("/{plan_id}/tasks/generate", response_model=List[DailyTask])
async def generate_tasks(
    plan_id: str,
    request: TaskGenerationRequest,
    user = Depends(get_current_user_optional)
):
    """
    Generate tasks for a date range based on plan settings.
    
    Creates tasks for each study day according to the plan's settings.
    If overwrite_existing is true, existing tasks will be replaced.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Verify plan exists
    plan = await study_plan_repository.get_plan_by_id(plan_id, user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    tasks = await study_plan_repository.generate_tasks(
        plan_id, user_id,
        request.start_date, request.end_date,
        request.overwrite_existing
    )
    
    return tasks


@router.post("/{plan_id}/tasks/{task_id}/increment", response_model=DailyTask)
async def increment_task_progress(
    plan_id: str,
    task_id: str,
    increment: int = Query(1, ge=1, le=100, description="Amount to increment"),
    user = Depends(get_current_user_optional)
):
    """
    Increment the completed count for a task.
    
    Useful for tracking progress as questions are answered.
    Auto-completes task when target is reached.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    task = await study_plan_repository.increment_task_progress(
        plan_id, task_id, user_id, increment
    )
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task
