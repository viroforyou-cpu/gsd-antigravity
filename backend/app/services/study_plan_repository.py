"""
Study Plan Repository - handles all study plan data access.
Supports mock data, Supabase, and direct PostgreSQL via SQLAlchemy.
"""
from typing import List, Optional, Dict
from datetime import datetime, date, timedelta
from uuid import uuid4
import json
from sqlalchemy import text

from ..core.config import settings
from ..core.database import get_supabase_client, is_database_connected, get_engine
from ..models.study_plan import (
    StudyPlan, StudyPlanCreate, StudyPlanUpdate, StudyPlanSummary,
    StudyPlanSettings, StudyPlanProgress,
    Milestone, MilestoneCreate, MilestoneUpdate,
    DailyTask, DailyTaskCreate, DailyTaskUpdate,
    TaskType, TaskStatus, PlanStatus,
    TodayTasksSummary, CalendarDay, CalendarMonth
)


class StudyPlanRepository:
    """Repository for study plan data access."""
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
        self._mock_plans: Dict[str, StudyPlan] = {}
        self._mock_milestones: Dict[str, Milestone] = {}
        self._mock_tasks: Dict[str, DailyTask] = {}
        self._engine = get_engine()
    
    # ========================================
    # Study Plan CRUD
    # ========================================
    
    async def create_plan(
        self,
        user_id: str,
        plan_create: StudyPlanCreate
    ) -> StudyPlan:
        """Create a new study plan."""
        if self._use_mock:
            return self._create_mock_plan(user_id, plan_create)
        
        if self._engine:
            return await self._create_sqlalchemy_plan(user_id, plan_create)
        
        return await self._create_db_plan(user_id, plan_create)
    
    async def get_plan_by_id(self, plan_id: str, user_id: str) -> Optional[StudyPlan]:
        """Get a study plan by ID."""
        if self._use_mock:
            return self._get_mock_plan(plan_id, user_id)
        
        if self._engine:
            return await self._get_sqlalchemy_plan(plan_id, user_id)
        
        return await self._get_db_plan(plan_id, user_id)
    
    async def get_user_plans(
        self,
        user_id: str,
        status: Optional[PlanStatus] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[StudyPlanSummary]:
        """Get all study plans for a user."""
        if self._use_mock:
            return self._get_mock_user_plans(user_id, status, limit, offset)
        
        if self._engine:
            return await self._get_sqlalchemy_user_plans(user_id, status, limit, offset)
        
        return await self._get_db_user_plans(user_id, status, limit, offset)
    
    async def update_plan(
        self,
        plan_id: str,
        user_id: str,
        plan_update: StudyPlanUpdate
    ) -> Optional[StudyPlan]:
        """Update a study plan."""
        if self._use_mock:
            return self._update_mock_plan(plan_id, user_id, plan_update)
        
        if self._engine:
            return await self._update_sqlalchemy_plan(plan_id, user_id, plan_update)
        
        return await self._update_db_plan(plan_id, user_id, plan_update)
    
    async def delete_plan(self, plan_id: str, user_id: str) -> bool:
        """Delete a study plan and all related data."""
        if self._use_mock:
            return self._delete_mock_plan(plan_id, user_id)
        
        if self._engine:
            return await self._delete_sqlalchemy_plan(plan_id, user_id)
        
        return await self._delete_db_plan(plan_id, user_id)
    
    async def update_plan_status(
        self,
        plan_id: str,
        user_id: str,
        status: PlanStatus
    ) -> Optional[StudyPlan]:
        """Update only the status of a plan."""
        return await self.update_plan(plan_id, user_id, StudyPlanUpdate(status=status))
    
    # ========================================
    # Milestone Operations
    # ========================================
    
    async def add_milestone(
        self,
        plan_id: str,
        user_id: str,
        milestone_create: MilestoneCreate
    ) -> Optional[Milestone]:
        """Add a milestone to a plan."""
        # Verify plan exists and belongs to user
        plan = await self.get_plan_by_id(plan_id, user_id)
        if not plan:
            return None
        
        if self._use_mock:
            return self._add_mock_milestone(plan_id, milestone_create)
        
        if self._engine:
            return await self._add_sqlalchemy_milestone(plan_id, milestone_create)
        
        return await self._add_db_milestone(plan_id, milestone_create)
    
    async def update_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str,
        milestone_update: MilestoneUpdate
    ) -> Optional[Milestone]:
        """Update a milestone."""
        if self._use_mock:
            return self._update_mock_milestone(plan_id, milestone_id, user_id, milestone_update)
        
        if self._engine:
            return await self._update_sqlalchemy_milestone(plan_id, milestone_id, user_id, milestone_update)
        
        return await self._update_db_milestone(plan_id, milestone_id, user_id, milestone_update)
    
    async def delete_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str
    ) -> bool:
        """Delete a milestone."""
        if self._use_mock:
            return self._delete_mock_milestone(plan_id, milestone_id, user_id)
        
        if self._engine:
            return await self._delete_sqlalchemy_milestone(plan_id, milestone_id, user_id)
        
        return await self._delete_db_milestone(plan_id, milestone_id, user_id)
    
    async def complete_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str
    ) -> Optional[Milestone]:
        """Mark a milestone as completed."""
        return await self.update_milestone(
            plan_id, milestone_id, user_id,
            MilestoneUpdate(completed_at=datetime.utcnow())
        )
    
    # ========================================
    # Daily Task Operations
    # ========================================
    
    async def get_plan_tasks(
        self,
        plan_id: str,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[DailyTask]:
        """Get tasks for a plan within a date range."""
        if self._use_mock:
            return self._get_mock_plan_tasks(plan_id, user_id, start_date, end_date)
        
        if self._engine:
            return await self._get_sqlalchemy_plan_tasks(plan_id, user_id, start_date, end_date)
        
        return await self._get_db_plan_tasks(plan_id, user_id, start_date, end_date)
    
    async def get_today_tasks(self, user_id: str) -> List[DailyTask]:
        """Get all tasks due today for a user across all plans."""
        today = date.today()
        
        if self._use_mock:
            return self._get_mock_today_tasks(user_id, today)
        
        if self._engine:
            return await self._get_sqlalchemy_today_tasks(user_id, today)
        
        return await self._get_db_today_tasks(user_id, today)
    
    async def update_task(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        task_update: DailyTaskUpdate
    ) -> Optional[DailyTask]:
        """Update a daily task."""
        if self._use_mock:
            return self._update_mock_task(plan_id, task_id, user_id, task_update)
        
        if self._engine:
            return await self._update_sqlalchemy_task(plan_id, task_id, user_id, task_update)
        
        return await self._update_db_task(plan_id, task_id, user_id, task_update)
    
    async def increment_task_progress(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        increment: int = 1
    ) -> Optional[DailyTask]:
        """Increment the completed count for a task."""
        if self._use_mock:
            return self._increment_mock_task_progress(plan_id, task_id, user_id, increment)
        
        if self._engine:
            return await self._increment_sqlalchemy_task_progress(plan_id, task_id, user_id, increment)
        
        return await self._increment_db_task_progress(plan_id, task_id, user_id, increment)
    
    async def generate_tasks(
        self,
        plan_id: str,
        user_id: str,
        start_date: date,
        end_date: date,
        overwrite: bool = False
    ) -> List[DailyTask]:
        """Generate tasks for a date range based on plan settings."""
        plan = await self.get_plan_by_id(plan_id, user_id)
        if not plan:
            return []
        
        tasks_to_create = []
        settings_obj = plan.settings
        current_date = start_date
        
        while current_date <= end_date:
            # Check if this is a study day
            weekday = current_date.isoweekday()
            if weekday in settings_obj.study_days:
                # Generate practice questions task
                if settings_obj.daily_question_goal > 0:
                    tasks_to_create.append(DailyTaskCreate(
                        date=current_date,
                        task_type=TaskType.PRACTICE_QUESTIONS,
                        target_count=settings_obj.daily_question_goal
                    ))
                
                # Generate SRS review task
                if settings_obj.include_srs_reviews:
                    tasks_to_create.append(DailyTaskCreate(
                        date=current_date,
                        task_type=TaskType.REVIEW_SRS,
                        target_count=None
                    ))
                
                # Generate bookmark review task
                if settings_obj.include_bookmark_reviews:
                    tasks_to_create.append(DailyTaskCreate(
                        date=current_date,
                        task_type=TaskType.REVIEW_BOOKMARKS,
                        target_count=None
                    ))
            
            current_date += timedelta(days=1)
        
        # Create tasks in database
        created_tasks = []
        for task_create in tasks_to_create:
            if self._use_mock:
                task = self._create_mock_task(plan_id, task_create)
            elif self._engine:
                task = await self._create_sqlalchemy_task(plan_id, task_create)
            else:
                task = await self._create_db_task(plan_id, task_create)
            created_tasks.append(task)
        
        return created_tasks
    
    # ========================================
    # Progress and Analytics
    # ========================================
    
    async def get_plan_progress(
        self,
        plan_id: str,
        user_id: str
    ) -> Optional[StudyPlanProgress]:
        """Calculate progress for a study plan."""
        plan = await self.get_plan_by_id(plan_id, user_id)
        if not plan:
            return None
        
        # Get all tasks
        tasks = await self.get_plan_tasks(plan_id, user_id)
        
        # Calculate milestone progress
        total_milestones = len(plan.milestones)
        completed_milestones = sum(1 for m in plan.milestones if m.completed_at)
        
        # Calculate task progress
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        
        # Calculate streak
        streak = self._calculate_streak(tasks)
        
        # Calculate overall progress
        milestone_weight = 0.4
        task_weight = 0.6
        
        milestone_progress = completed_milestones / total_milestones if total_milestones > 0 else 0
        task_progress = completed_tasks / total_tasks if total_tasks > 0 else 0
        
        overall_progress = (milestone_progress * milestone_weight + task_progress * task_weight) * 100
        
        # Days remaining
        days_remaining = None
        if plan.target_date:
            days_remaining = (plan.target_date - date.today()).days
        
        return StudyPlanProgress(
            plan_id=plan_id,
            total_milestones=total_milestones,
            completed_milestones=completed_milestones,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            current_streak=streak,
            overall_progress=round(overall_progress, 1),
            days_remaining=days_remaining
        )
    
    async def get_today_summary(self, user_id: str) -> TodayTasksSummary:
        """Get summary of today's tasks across all plans."""
        tasks = await self.get_today_tasks(user_id)
        plans = await self.get_user_plans(user_id, status=PlanStatus.ACTIVE)
        
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        
        # Calculate question targets
        question_tasks = [t for t in tasks if t.task_type == TaskType.PRACTICE_QUESTIONS]
        total_questions_target = sum(t.target_count or 0 for t in question_tasks)
        total_questions_completed = sum(t.completed_count for t in question_tasks)
        
        # Group by plan
        plan_summaries = []
        for plan_summary in plans:
            plan_tasks = [t for t in tasks if t.plan_id == plan_summary.id]
            if plan_tasks:
                plan_summaries.append({
                    "plan_id": plan_summary.id,
                    "plan_name": plan_summary.name,
                    "tasks": [
                        {
                            "id": t.id,
                            "type": t.task_type,
                            "target": t.target_count,
                            "completed": t.completed_count,
                            "status": t.status
                        }
                        for t in plan_tasks
                    ]
                })
        
        return TodayTasksSummary(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            total_questions_target=total_questions_target,
            total_questions_completed=total_questions_completed,
            plans=plan_summaries
        )
    
    async def get_calendar_month(
        self,
        plan_id: str,
        user_id: str,
        year: int,
        month: int
    ) -> CalendarMonth:
        """Get calendar view for a specific month."""
        # Calculate date range
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get tasks
        tasks = await self.get_plan_tasks(plan_id, user_id, start_date, end_date)
        
        # Group tasks by date
        tasks_by_date: Dict[date, List[DailyTask]] = {}
        for task in tasks:
            if task.date not in tasks_by_date:
                tasks_by_date[task.date] = []
            tasks_by_date[task.date].append(task)
        
        # Build calendar days
        days = []
        current = start_date
        while current <= end_date:
            day_tasks = tasks_by_date.get(current, [])
            total_target = sum(t.target_count or 0 for t in day_tasks)
            total_completed = sum(t.completed_count for t in day_tasks)
            
            if not day_tasks:
                status = "empty"
            elif total_completed >= total_target and total_target > 0:
                status = "complete"
            elif total_completed > 0:
                status = "partial"
            else:
                status = "pending"
            
            days.append(CalendarDay(
                date=current,
                tasks=day_tasks,
                total_target=total_target,
                total_completed=total_completed,
                status=status
            ))
            current += timedelta(days=1)
        
        return CalendarMonth(year=year, month=month, days=days)
    
    # ========================================
    # Helper Methods
    # ========================================
    
    def _calculate_streak(self, tasks: List[DailyTask]) -> int:
        """Calculate current streak of completed days."""
        if not tasks:
            return 0
        
        # Sort tasks by date descending
        sorted_tasks = sorted(tasks, key=lambda t: t.date, reverse=True)
        
        streak = 0
        current_date = date.today()
        
        for task in sorted_tasks:
            if task.date > current_date:
                continue
            
            # Check if all tasks for this date are completed
            day_tasks = [t for t in sorted_tasks if t.date == task.date]
            all_complete = all(t.status == TaskStatus.COMPLETED for t in day_tasks)
            
            if all_complete:
                if task.date == current_date or task.date == current_date - timedelta(days=1):
                    streak += 1
                    current_date = task.date - timedelta(days=1)
            else:
                break
        
        return streak
    
    # ========================================
    # Mock Data Methods
    # ========================================
    
    def _create_mock_plan(self, user_id: str, plan_create: StudyPlanCreate) -> StudyPlan:
        """Create a mock study plan."""
        plan_id = str(uuid4())
        now = datetime.utcnow()
        
        # Create milestones
        milestones = []
        for i, m_create in enumerate(plan_create.milestones):
            milestone = Milestone(
                id=str(uuid4()),
                plan_id=plan_id,
                title=m_create.title,
                description=m_create.description,
                target_date=m_create.target_date,
                order_index=m_create.order_index,
                completed_at=None,
                created_at=now
            )
            milestones.append(milestone)
            self._mock_milestones[milestone.id] = milestone
        
        plan = StudyPlan(
            id=plan_id,
            user_id=user_id,
            name=plan_create.name,
            description=plan_create.description,
            target_date=plan_create.target_date,
            status=PlanStatus.ACTIVE,
            settings=plan_create.settings,
            milestones=milestones,
            created_at=now,
            updated_at=now
        )
        
        self._mock_plans[plan_id] = plan
        return plan
    
    def _get_mock_plan(self, plan_id: str, user_id: str) -> Optional[StudyPlan]:
        """Get a mock plan by ID."""
        plan = self._mock_plans.get(plan_id)
        if plan and plan.user_id == user_id:
            return plan
        return None
    
    def _get_mock_user_plans(
        self,
        user_id: str,
        status: Optional[PlanStatus],
        limit: int,
        offset: int
    ) -> List[StudyPlanSummary]:
        """Get mock user plans."""
        plans = [
            StudyPlanSummary(
                id=p.id,
                user_id=p.user_id,
                name=p.name,
                description=p.description,
                target_date=p.target_date,
                status=p.status,
                created_at=p.created_at,
                updated_at=p.updated_at
            )
            for p in self._mock_plans.values()
            if p.user_id == user_id and (status is None or p.status == status)
        ]
        return plans[offset:offset + limit]
    
    def _update_mock_plan(
        self,
        plan_id: str,
        user_id: str,
        plan_update: StudyPlanUpdate
    ) -> Optional[StudyPlan]:
        """Update a mock plan."""
        plan = self._get_mock_plan(plan_id, user_id)
        if not plan:
            return None
        
        update_data = plan_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(plan, key, value)
        plan.updated_at = datetime.utcnow()
        
        return plan
    
    def _delete_mock_plan(self, plan_id: str, user_id: str) -> bool:
        """Delete a mock plan."""
        plan = self._get_mock_plan(plan_id, user_id)
        if not plan:
            return False
        
        # Delete related milestones and tasks
        self._mock_milestones = {
            k: v for k, v in self._mock_milestones.items()
            if v.plan_id != plan_id
        }
        self._mock_tasks = {
            k: v for k, v in self._mock_tasks.items()
            if v.plan_id != plan_id
        }
        
        del self._mock_plans[plan_id]
        return True
    
    def _add_mock_milestone(self, plan_id: str, milestone_create: MilestoneCreate) -> Milestone:
        """Add a mock milestone."""
        milestone = Milestone(
            id=str(uuid4()),
            plan_id=plan_id,
            title=milestone_create.title,
            description=milestone_create.description,
            target_date=milestone_create.target_date,
            order_index=milestone_create.order_index,
            completed_at=None,
            created_at=datetime.utcnow()
        )
        self._mock_milestones[milestone.id] = milestone
        
        # Add to plan
        plan = self._mock_plans.get(plan_id)
        if plan:
            plan.milestones.append(milestone)
        
        return milestone
    
    def _update_mock_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str,
        milestone_update: MilestoneUpdate
    ) -> Optional[Milestone]:
        """Update a mock milestone."""
        plan = self._get_mock_plan(plan_id, user_id)
        if not plan:
            return None
        
        milestone = self._mock_milestones.get(milestone_id)
        if not milestone or milestone.plan_id != plan_id:
            return None
        
        update_data = milestone_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(milestone, key, value)
        
        return milestone
    
    def _delete_mock_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str
    ) -> bool:
        """Delete a mock milestone."""
        plan = self._get_mock_plan(plan_id, user_id)
        if not plan:
            return False
        
        milestone = self._mock_milestones.get(milestone_id)
        if not milestone or milestone.plan_id != plan_id:
            return False
        
        del self._mock_milestones[milestone_id]
        plan.milestones = [m for m in plan.milestones if m.id != milestone_id]
        return True
    
    def _create_mock_task(self, plan_id: str, task_create: DailyTaskCreate) -> DailyTask:
        """Create a mock task."""
        task = DailyTask(
            id=str(uuid4()),
            plan_id=plan_id,
            date=task_create.date,
            task_type=task_create.task_type,
            target_count=task_create.target_count,
            completed_count=0,
            status=TaskStatus.PENDING,
            created_at=datetime.utcnow()
        )
        self._mock_tasks[task.id] = task
        return task
    
    def _get_mock_plan_tasks(
        self,
        plan_id: str,
        user_id: str,
        start_date: Optional[date],
        end_date: Optional[date]
    ) -> List[DailyTask]:
        """Get mock tasks for a plan."""
        plan = self._get_mock_plan(plan_id, user_id)
        if not plan:
            return []
        
        tasks = [
            t for t in self._mock_tasks.values()
            if t.plan_id == plan_id
        ]
        
        if start_date:
            tasks = [t for t in tasks if t.date >= start_date]
        if end_date:
            tasks = [t for t in tasks if t.date <= end_date]
        
        return sorted(tasks, key=lambda t: t.date)
    
    def _get_mock_today_tasks(self, user_id: str, today: date) -> List[DailyTask]:
        """Get mock tasks for today."""
        user_plan_ids = [
            p.id for p in self._mock_plans.values()
            if p.user_id == user_id and p.status == PlanStatus.ACTIVE
        ]
        
        return [
            t for t in self._mock_tasks.values()
            if t.plan_id in user_plan_ids and t.date == today
        ]
    
    def _update_mock_task(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        task_update: DailyTaskUpdate
    ) -> Optional[DailyTask]:
        """Update a mock task."""
        plan = self._get_mock_plan(plan_id, user_id)
        if not plan:
            return None
        
        task = self._mock_tasks.get(task_id)
        if not task or task.plan_id != plan_id:
            return None
        
        update_data = task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        
        # Auto-complete if target reached
        if task.target_count and task.completed_count >= task.target_count:
            task.status = TaskStatus.COMPLETED
        
        return task
    
    def _increment_mock_task_progress(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        increment: int
    ) -> Optional[DailyTask]:
        """Increment mock task progress."""
        task = self._mock_tasks.get(task_id)
        if not task:
            return None
        
        return self._update_mock_task(
            plan_id, task_id, user_id,
            DailyTaskUpdate(completed_count=task.completed_count + increment)
        )
    
    # ========================================
    # SQLAlchemy Methods (Direct PostgreSQL)
    # ========================================
    
    async def _create_sqlalchemy_plan(
        self,
        user_id: str,
        plan_create: StudyPlanCreate
    ) -> StudyPlan:
        """Create a plan using SQLAlchemy."""
        plan_id = str(uuid4())
        now = datetime.utcnow()
        
        query = """
            INSERT INTO study_plans (id, user_id, name, description, target_date, status, settings)
            VALUES (:id, :user_id, :name, :description, :target_date, 'active', :settings)
            RETURNING created_at
        """
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), {
                "id": plan_id,
                "user_id": user_id,
                "name": plan_create.name,
                "description": plan_create.description,
                "target_date": plan_create.target_date,
                "settings": json.dumps(plan_create.settings.model_dump())
            })
            conn.commit()
        
        # Create milestones
        milestones = []
        for m_create in plan_create.milestones:
            milestone = await self._add_sqlalchemy_milestone(plan_id, m_create)
            milestones.append(milestone)
        
        return StudyPlan(
            id=plan_id,
            user_id=user_id,
            name=plan_create.name,
            description=plan_create.description,
            target_date=plan_create.target_date,
            status=PlanStatus.ACTIVE,
            settings=plan_create.settings,
            milestones=milestones,
            created_at=now,
            updated_at=now
        )
    
    async def _get_sqlalchemy_plan(self, plan_id: str, user_id: str) -> Optional[StudyPlan]:
        """Get a plan using SQLAlchemy."""
        query = "SELECT * FROM study_plans WHERE id = :id AND user_id = :user_id"
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), {"id": plan_id, "user_id": user_id})
            row = result.fetchone()
            
            if not row:
                return None
            
            # Get milestones
            m_query = "SELECT * FROM plan_milestones WHERE plan_id = :plan_id ORDER BY order_index"
            m_result = conn.execute(text(m_query), {"plan_id": plan_id})
            m_rows = m_result.fetchall()
            
            milestones = [
                Milestone(
                    id=str(m.id),
                    plan_id=str(m.plan_id),
                    title=m.title,
                    description=m.description,
                    target_date=m.target_date,
                    order_index=m.order_index,
                    completed_at=m.completed_at,
                    created_at=m.created_at
                )
                for m in m_rows
            ]
            
            settings_data = row.settings or {}
            if isinstance(settings_data, str):
                settings_data = json.loads(settings_data)
            
            return StudyPlan(
                id=str(row.id),
                user_id=str(row.user_id),
                name=row.name,
                description=row.description,
                target_date=row.target_date,
                status=PlanStatus(row.status),
                settings=StudyPlanSettings(**settings_data),
                milestones=milestones,
                created_at=row.created_at,
                updated_at=row.updated_at
            )
    
    async def _get_sqlalchemy_user_plans(
        self,
        user_id: str,
        status: Optional[PlanStatus],
        limit: int,
        offset: int
    ) -> List[StudyPlanSummary]:
        """Get user plans using SQLAlchemy."""
        if status:
            query = """
                SELECT * FROM study_plans
                WHERE user_id = :user_id AND status = :status
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """
            params = {"user_id": user_id, "status": status.value, "limit": limit, "offset": offset}
        else:
            query = """
                SELECT * FROM study_plans
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """
            params = {"user_id": user_id, "limit": limit, "offset": offset}
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), params)
            rows = result.fetchall()
            
            return [
                StudyPlanSummary(
                    id=str(row.id),
                    user_id=str(row.user_id),
                    name=row.name,
                    description=row.description,
                    target_date=row.target_date,
                    status=PlanStatus(row.status),
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                for row in rows
            ]
    
    async def _update_sqlalchemy_plan(
        self,
        plan_id: str,
        user_id: str,
        plan_update: StudyPlanUpdate
    ) -> Optional[StudyPlan]:
        """Update a plan using SQLAlchemy."""
        update_parts = []
        params = {"id": plan_id, "user_id": user_id}
        
        if plan_update.name is not None:
            update_parts.append("name = :name")
            params["name"] = plan_update.name
        if plan_update.description is not None:
            update_parts.append("description = :description")
            params["description"] = plan_update.description
        if plan_update.target_date is not None:
            update_parts.append("target_date = :target_date")
            params["target_date"] = plan_update.target_date
        if plan_update.status is not None:
            update_parts.append("status = :status")
            params["status"] = plan_update.status.value
        if plan_update.settings is not None:
            update_parts.append("settings = :settings")
            params["settings"] = json.dumps(plan_update.settings.model_dump())
        
        if not update_parts:
            return await self._get_sqlalchemy_plan(plan_id, user_id)
        
        update_parts.append("updated_at = :updated_at")
        params["updated_at"] = datetime.utcnow()
        
        query = f"UPDATE study_plans SET {', '.join(update_parts)} WHERE id = :id AND user_id = :user_id"
        
        with self._engine.connect() as conn:
            conn.execute(text(query), params)
            conn.commit()
        
        return await self._get_sqlalchemy_plan(plan_id, user_id)
    
    async def _delete_sqlalchemy_plan(self, plan_id: str, user_id: str) -> bool:
        """Delete a plan using SQLAlchemy."""
        # Verify ownership first
        plan = await self._get_sqlalchemy_plan(plan_id, user_id)
        if not plan:
            return False
        
        query = "DELETE FROM study_plans WHERE id = :id"
        
        with self._engine.connect() as conn:
            conn.execute(text(query), {"id": plan_id})
            conn.commit()
        
        return True
    
    async def _add_sqlalchemy_milestone(
        self,
        plan_id: str,
        milestone_create: MilestoneCreate
    ) -> Milestone:
        """Add a milestone using SQLAlchemy."""
        milestone_id = str(uuid4())
        
        query = """
            INSERT INTO plan_milestones (id, plan_id, title, description, target_date, order_index)
            VALUES (:id, :plan_id, :title, :description, :target_date, :order_index)
            RETURNING created_at
        """
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), {
                "id": milestone_id,
                "plan_id": plan_id,
                "title": milestone_create.title,
                "description": milestone_create.description,
                "target_date": milestone_create.target_date,
                "order_index": milestone_create.order_index
            })
            conn.commit()
            row = result.fetchone()
        
        return Milestone(
            id=milestone_id,
            plan_id=plan_id,
            title=milestone_create.title,
            description=milestone_create.description,
            target_date=milestone_create.target_date,
            order_index=milestone_create.order_index,
            completed_at=None,
            created_at=row.created_at if row else datetime.utcnow()
        )
    
    async def _update_sqlalchemy_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str,
        milestone_update: MilestoneUpdate
    ) -> Optional[Milestone]:
        """Update a milestone using SQLAlchemy."""
        # Verify plan ownership
        plan = await self._get_sqlalchemy_plan(plan_id, user_id)
        if not plan:
            return None
        
        update_parts = []
        params = {"id": milestone_id, "plan_id": plan_id}
        
        if milestone_update.title is not None:
            update_parts.append("title = :title")
            params["title"] = milestone_update.title
        if milestone_update.description is not None:
            update_parts.append("description = :description")
            params["description"] = milestone_update.description
        if milestone_update.target_date is not None:
            update_parts.append("target_date = :target_date")
            params["target_date"] = milestone_update.target_date
        
        if not update_parts:
            # Just return existing milestone
            for m in plan.milestones:
                if m.id == milestone_id:
                    return m
            return None
        
        query = f"UPDATE plan_milestones SET {', '.join(update_parts)} WHERE id = :id AND plan_id = :plan_id"
        
        with self._engine.connect() as conn:
            conn.execute(text(query), params)
            conn.commit()
        
        # Return updated milestone
        for m in plan.milestones:
            if m.id == milestone_id:
                return m
        return None
    
    async def _delete_sqlalchemy_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str
    ) -> bool:
        """Delete a milestone using SQLAlchemy."""
        plan = await self._get_sqlalchemy_plan(plan_id, user_id)
        if not plan:
            return False
        
        query = "DELETE FROM plan_milestones WHERE id = :id AND plan_id = :plan_id"
        
        with self._engine.connect() as conn:
            conn.execute(text(query), {"id": milestone_id, "plan_id": plan_id})
            conn.commit()
        
        return True
    
    async def _create_sqlalchemy_task(
        self,
        plan_id: str,
        task_create: DailyTaskCreate
    ) -> DailyTask:
        """Create a task using SQLAlchemy."""
        task_id = str(uuid4())
        
        query = """
            INSERT INTO plan_daily_tasks (id, plan_id, date, task_type, target_count)
            VALUES (:id, :plan_id, :date, :task_type, :target_count)
            RETURNING created_at
        """
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), {
                "id": task_id,
                "plan_id": plan_id,
                "date": task_create.date,
                "task_type": task_create.task_type.value,
                "target_count": task_create.target_count
            })
            conn.commit()
            row = result.fetchone()
        
        return DailyTask(
            id=task_id,
            plan_id=plan_id,
            date=task_create.date,
            task_type=task_create.task_type,
            target_count=task_create.target_count,
            completed_count=0,
            status=TaskStatus.PENDING,
            created_at=row.created_at if row else datetime.utcnow()
        )
    
    async def _get_sqlalchemy_plan_tasks(
        self,
        plan_id: str,
        user_id: str,
        start_date: Optional[date],
        end_date: Optional[date]
    ) -> List[DailyTask]:
        """Get plan tasks using SQLAlchemy."""
        # Verify plan ownership
        plan = await self._get_sqlalchemy_plan(plan_id, user_id)
        if not plan:
            return []
        
        query = "SELECT * FROM plan_daily_tasks WHERE plan_id = :plan_id"
        params = {"plan_id": plan_id}
        
        if start_date:
            query += " AND date >= :start_date"
            params["start_date"] = start_date
        if end_date:
            query += " AND date <= :end_date"
            params["end_date"] = end_date
        
        query += " ORDER BY date"
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), params)
            rows = result.fetchall()
            
            return [
                DailyTask(
                    id=str(row.id),
                    plan_id=str(row.plan_id),
                    date=row.date,
                    task_type=TaskType(row.task_type),
                    target_count=row.target_count,
                    completed_count=row.completed_count or 0,
                    status=TaskStatus(row.status),
                    created_at=row.created_at
                )
                for row in rows
            ]
    
    async def _get_sqlalchemy_today_tasks(self, user_id: str, today: date) -> List[DailyTask]:
        """Get today's tasks using SQLAlchemy."""
        query = """
            SELECT t.* FROM plan_daily_tasks t
            JOIN study_plans p ON t.plan_id = p.id
            WHERE p.user_id = :user_id AND p.status = 'active' AND t.date = :today
        """
        
        with self._engine.connect() as conn:
            result = conn.execute(text(query), {"user_id": user_id, "today": today})
            rows = result.fetchall()
            
            return [
                DailyTask(
                    id=str(row.id),
                    plan_id=str(row.plan_id),
                    date=row.date,
                    task_type=TaskType(row.task_type),
                    target_count=row.target_count,
                    completed_count=row.completed_count or 0,
                    status=TaskStatus(row.status),
                    created_at=row.created_at
                )
                for row in rows
            ]
    
    async def _update_sqlalchemy_task(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        task_update: DailyTaskUpdate
    ) -> Optional[DailyTask]:
        """Update a task using SQLAlchemy."""
        plan = await self._get_sqlalchemy_plan(plan_id, user_id)
        if not plan:
            return None
        
        update_parts = []
        params = {"id": task_id, "plan_id": plan_id}
        
        if task_update.completed_count is not None:
            update_parts.append("completed_count = :completed_count")
            params["completed_count"] = task_update.completed_count
        if task_update.status is not None:
            update_parts.append("status = :status")
            params["status"] = task_update.status.value
        
        if not update_parts:
            # Return existing task
            tasks = await self._get_sqlalchemy_plan_tasks(plan_id, user_id, None, None)
            for t in tasks:
                if t.id == task_id:
                    return t
            return None
        
        query = f"UPDATE plan_daily_tasks SET {', '.join(update_parts)} WHERE id = :id AND plan_id = :plan_id"
        
        with self._engine.connect() as conn:
            conn.execute(text(query), params)
            conn.commit()
        
        # Get updated task
        tasks = await self._get_sqlalchemy_plan_tasks(plan_id, user_id, None, None)
        for t in tasks:
            if t.id == task_id:
                return t
        return None
    
    async def _increment_sqlalchemy_task_progress(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        increment: int
    ) -> Optional[DailyTask]:
        """Increment task progress using SQLAlchemy."""
        # Get current task
        tasks = await self._get_sqlalchemy_plan_tasks(plan_id, user_id, None, None)
        task = None
        for t in tasks:
            if t.id == task_id:
                task = t
                break
        
        if not task:
            return None
        
        return await self._update_sqlalchemy_task(
            plan_id, task_id, user_id,
            DailyTaskUpdate(completed_count=task.completed_count + increment)
        )
    
    # ========================================
    # Supabase Methods (Legacy)
    # ========================================
    
    async def _create_db_plan(self, user_id: str, plan_create: StudyPlanCreate) -> StudyPlan:
        """Create a plan in Supabase."""
        client = get_supabase_client()
        if not client:
            raise RuntimeError("Database not connected")
        
        plan_data = {
            "user_id": user_id,
            "name": plan_create.name,
            "description": plan_create.description,
            "target_date": plan_create.target_date.isoformat() if plan_create.target_date else None,
            "settings": plan_create.settings.model_dump()
        }
        
        response = client.table("study_plans").insert(plan_data).execute()
        plan_row = response.data[0]
        
        # Create milestones
        milestones = []
        for m_create in plan_create.milestones:
            m_data = {
                "plan_id": plan_row["id"],
                "title": m_create.title,
                "description": m_create.description,
                "target_date": m_create.target_date.isoformat() if m_create.target_date else None,
                "order_index": m_create.order_index
            }
            m_response = client.table("plan_milestones").insert(m_data).execute()
            m_row = m_response.data[0]
            milestones.append(Milestone(
                id=m_row["id"],
                plan_id=m_row["plan_id"],
                title=m_row["title"],
                description=m_row["description"],
                target_date=m_row["target_date"],
                order_index=m_row["order_index"],
                completed_at=m_row["completed_at"],
                created_at=m_row["created_at"]
            ))
        
        return StudyPlan(
            id=plan_row["id"],
            user_id=plan_row["user_id"],
            name=plan_row["name"],
            description=plan_row["description"],
            target_date=plan_row["target_date"],
            status=PlanStatus(plan_row["status"]),
            settings=StudyPlanSettings(**plan_row["settings"]),
            milestones=milestones,
            created_at=plan_row["created_at"],
            updated_at=plan_row["updated_at"]
        )
    
    async def _get_db_plan(self, plan_id: str, user_id: str) -> Optional[StudyPlan]:
        """Get a plan from Supabase."""
        client = get_supabase_client()
        if not client:
            return None
        
        response = client.table("study_plans").select("*").eq("id", plan_id).eq("user_id", user_id).execute()
        if not response.data:
            return None
        
        plan_row = response.data[0]
        
        # Get milestones
        m_response = client.table("plan_milestones").select("*").eq("plan_id", plan_id).order("order_index").execute()
        milestones = [
            Milestone(
                id=m["id"],
                plan_id=m["plan_id"],
                title=m["title"],
                description=m["description"],
                target_date=m["target_date"],
                order_index=m["order_index"],
                completed_at=m["completed_at"],
                created_at=m["created_at"]
            )
            for m in m_response.data
        ]
        
        return StudyPlan(
            id=plan_row["id"],
            user_id=plan_row["user_id"],
            name=plan_row["name"],
            description=plan_row["description"],
            target_date=plan_row["target_date"],
            status=PlanStatus(plan_row["status"]),
            settings=StudyPlanSettings(**plan_row["settings"]),
            milestones=milestones,
            created_at=plan_row["created_at"],
            updated_at=plan_row["updated_at"]
        )
    
    async def _get_db_user_plans(
        self,
        user_id: str,
        status: Optional[PlanStatus],
        limit: int,
        offset: int
    ) -> List[StudyPlanSummary]:
        """Get user plans from Supabase."""
        client = get_supabase_client()
        if not client:
            return []
        
        query = client.table("study_plans").select("*").eq("user_id", user_id)
        if status:
            query = query.eq("status", status.value)
        
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return [
            StudyPlanSummary(
                id=row["id"],
                user_id=row["user_id"],
                name=row["name"],
                description=row["description"],
                target_date=row["target_date"],
                status=PlanStatus(row["status"]),
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            for row in response.data
        ]
    
    async def _update_db_plan(
        self,
        plan_id: str,
        user_id: str,
        plan_update: StudyPlanUpdate
    ) -> Optional[StudyPlan]:
        """Update a plan in Supabase."""
        client = get_supabase_client()
        if not client:
            return None
        
        update_data = plan_update.model_dump(exclude_unset=True)
        if not update_data:
            return await self._get_db_plan(plan_id, user_id)
        
        # Convert settings to dict if present
        if "settings" in update_data:
            update_data["settings"] = update_data["settings"].model_dump()
        if "status" in update_data:
            update_data["status"] = update_data["status"].value
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        response = client.table("study_plans").update(update_data).eq("id", plan_id).eq("user_id", user_id).execute()
        
        if not response.data:
            return None
        
        return await self._get_db_plan(plan_id, user_id)
    
    async def _delete_db_plan(self, plan_id: str, user_id: str) -> bool:
        """Delete a plan from Supabase."""
        client = get_supabase_client()
        if not client:
            return False
        
        response = client.table("study_plans").delete().eq("id", plan_id).eq("user_id", user_id).execute()
        return len(response.data) > 0
    
    async def _add_db_milestone(self, plan_id: str, milestone_create: MilestoneCreate) -> Milestone:
        """Add a milestone in Supabase."""
        client = get_supabase_client()
        if not client:
            raise RuntimeError("Database not connected")
        
        m_data = {
            "plan_id": plan_id,
            "title": milestone_create.title,
            "description": milestone_create.description,
            "target_date": milestone_create.target_date.isoformat() if milestone_create.target_date else None,
            "order_index": milestone_create.order_index
        }
        
        response = client.table("plan_milestones").insert(m_data).execute()
        m_row = response.data[0]
        
        return Milestone(
            id=m_row["id"],
            plan_id=m_row["plan_id"],
            title=m_row["title"],
            description=m_row["description"],
            target_date=m_row["target_date"],
            order_index=m_row["order_index"],
            completed_at=m_row["completed_at"],
            created_at=m_row["created_at"]
        )
    
    async def _update_db_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str,
        milestone_update: MilestoneUpdate
    ) -> Optional[Milestone]:
        """Update a milestone in Supabase."""
        client = get_supabase_client()
        if not client:
            return None
        
        # Verify plan ownership
        plan = await self._get_db_plan(plan_id, user_id)
        if not plan:
            return None
        
        update_data = milestone_update.model_dump(exclude_unset=True)
        if not update_data:
            for m in plan.milestones:
                if m.id == milestone_id:
                    return m
            return None
        
        response = client.table("plan_milestones").update(update_data).eq("id", milestone_id).eq("plan_id", plan_id).execute()
        
        if not response.data:
            return None
        
        m_row = response.data[0]
        return Milestone(
            id=m_row["id"],
            plan_id=m_row["plan_id"],
            title=m_row["title"],
            description=m_row["description"],
            target_date=m_row["target_date"],
            order_index=m_row["order_index"],
            completed_at=m_row["completed_at"],
            created_at=m_row["created_at"]
        )
    
    async def _delete_db_milestone(
        self,
        plan_id: str,
        milestone_id: str,
        user_id: str
    ) -> bool:
        """Delete a milestone from Supabase."""
        client = get_supabase_client()
        if not client:
            return False
        
        plan = await self._get_db_plan(plan_id, user_id)
        if not plan:
            return False
        
        response = client.table("plan_milestones").delete().eq("id", milestone_id).eq("plan_id", plan_id).execute()
        return len(response.data) > 0
    
    async def _create_db_task(self, plan_id: str, task_create: DailyTaskCreate) -> DailyTask:
        """Create a task in Supabase."""
        client = get_supabase_client()
        if not client:
            raise RuntimeError("Database not connected")
        
        t_data = {
            "plan_id": plan_id,
            "date": task_create.date.isoformat(),
            "task_type": task_create.task_type.value,
            "target_count": task_create.target_count
        }
        
        response = client.table("plan_daily_tasks").insert(t_data).execute()
        t_row = response.data[0]
        
        return DailyTask(
            id=t_row["id"],
            plan_id=t_row["plan_id"],
            date=t_row["date"],
            task_type=TaskType(t_row["task_type"]),
            target_count=t_row["target_count"],
            completed_count=t_row["completed_count"] or 0,
            status=TaskStatus(t_row["status"]),
            created_at=t_row["created_at"]
        )
    
    async def _get_db_plan_tasks(
        self,
        plan_id: str,
        user_id: str,
        start_date: Optional[date],
        end_date: Optional[date]
    ) -> List[DailyTask]:
        """Get plan tasks from Supabase."""
        client = get_supabase_client()
        if not client:
            return []
        
        plan = await self._get_db_plan(plan_id, user_id)
        if not plan:
            return []
        
        query = client.table("plan_daily_tasks").select("*").eq("plan_id", plan_id)
        if start_date:
            query = query.gte("date", start_date.isoformat())
        if end_date:
            query = query.lte("date", end_date.isoformat())
        
        response = query.order("date").execute()
        
        return [
            DailyTask(
                id=row["id"],
                plan_id=row["plan_id"],
                date=row["date"],
                task_type=TaskType(row["task_type"]),
                target_count=row["target_count"],
                completed_count=row["completed_count"] or 0,
                status=TaskStatus(row["status"]),
                created_at=row["created_at"]
            )
            for row in response.data
        ]
    
    async def _get_db_today_tasks(self, user_id: str, today: date) -> List[DailyTask]:
        """Get today's tasks from Supabase."""
        client = get_supabase_client()
        if not client:
            return []
        
        # Get active plan IDs
        plans_response = client.table("study_plans").select("id").eq("user_id", user_id).eq("status", "active").execute()
        plan_ids = [p["id"] for p in plans_response.data]
        
        if not plan_ids:
            return []
        
        # Get tasks for today
        response = client.table("plan_daily_tasks").select("*").in_("plan_id", plan_ids).eq("date", today.isoformat()).execute()
        
        return [
            DailyTask(
                id=row["id"],
                plan_id=row["plan_id"],
                date=row["date"],
                task_type=TaskType(row["task_type"]),
                target_count=row["target_count"],
                completed_count=row["completed_count"] or 0,
                status=TaskStatus(row["status"]),
                created_at=row["created_at"]
            )
            for row in response.data
        ]
    
    async def _update_db_task(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        task_update: DailyTaskUpdate
    ) -> Optional[DailyTask]:
        """Update a task in Supabase."""
        client = get_supabase_client()
        if not client:
            return None
        
        plan = await self._get_db_plan(plan_id, user_id)
        if not plan:
            return None
        
        update_data = task_update.model_dump(exclude_unset=True)
        if not update_data:
            tasks = await self._get_db_plan_tasks(plan_id, user_id, None, None)
            for t in tasks:
                if t.id == task_id:
                    return t
            return None
        
        if "status" in update_data:
            update_data["status"] = update_data["status"].value
        
        response = client.table("plan_daily_tasks").update(update_data).eq("id", task_id).eq("plan_id", plan_id).execute()
        
        if not response.data:
            return None
        
        t_row = response.data[0]
        return DailyTask(
            id=t_row["id"],
            plan_id=t_row["plan_id"],
            date=t_row["date"],
            task_type=TaskType(t_row["task_type"]),
            target_count=t_row["target_count"],
            completed_count=t_row["completed_count"] or 0,
            status=TaskStatus(t_row["status"]),
            created_at=t_row["created_at"]
        )
    
    async def _increment_db_task_progress(
        self,
        plan_id: str,
        task_id: str,
        user_id: str,
        increment: int
    ) -> Optional[DailyTask]:
        """Increment task progress in Supabase."""
        tasks = await self._get_db_plan_tasks(plan_id, user_id, None, None)
        task = None
        for t in tasks:
            if t.id == task_id:
                task = t
                break
        
        if not task:
            return None
        
        return await self._update_db_task(
            plan_id, task_id, user_id,
            DailyTaskUpdate(completed_count=task.completed_count + increment)
        )


# Singleton instance
study_plan_repository = StudyPlanRepository()
