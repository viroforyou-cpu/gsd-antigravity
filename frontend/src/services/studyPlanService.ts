/**
 * Study Plan Service - API calls for study plans feature.
 */
import api from './api';
import type {
    StudyPlan,
    StudyPlanCreate,
    StudyPlanUpdate,
    StudyPlanSummary,
    StudyPlanProgress,
    Milestone,
    MilestoneCreate,
    MilestoneUpdate,
    DailyTask,
    DailyTaskUpdate,
    TaskGenerationRequest,
    TodayTasksSummary,
    CalendarMonth,
    PlanStatus,
    DeleteResponse,
} from '../types/studyPlan';

export const studyPlanService = {
    // ========================================
    // Study Plan CRUD
    // ========================================

    /**
     * Get all study plans for the current user
     */
    async getPlans(
        status?: PlanStatus,
        limit: number = 20,
        offset: number = 0
    ): Promise<StudyPlanSummary[]> {
        const response = await api.get<StudyPlanSummary[]>('/study-plans', {
            params: { status, limit, offset },
        });
        return response.data;
    },

    /**
     * Create a new study plan
     */
    async createPlan(plan: StudyPlanCreate): Promise<StudyPlan> {
        const response = await api.post<StudyPlan>('/study-plans', plan);
        return response.data;
    },

    /**
     * Get a specific study plan by ID
     */
    async getPlan(planId: string): Promise<StudyPlan> {
        const response = await api.get<StudyPlan>(`/study-plans/${planId}`);
        return response.data;
    },

    /**
     * Update a study plan
     */
    async updatePlan(planId: string, update: StudyPlanUpdate): Promise<StudyPlan> {
        const response = await api.put<StudyPlan>(`/study-plans/${planId}`, update);
        return response.data;
    },

    /**
     * Delete a study plan
     */
    async deletePlan(planId: string): Promise<DeleteResponse> {
        const response = await api.delete<DeleteResponse>(`/study-plans/${planId}`);
        return response.data;
    },

    /**
     * Update plan status (pause/resume/complete)
     */
    async updatePlanStatus(planId: string, status: PlanStatus): Promise<StudyPlan> {
        const response = await api.put<StudyPlan>(`/study-plans/${planId}/status`, null, {
            params: { status },
        });
        return response.data;
    },

    // ========================================
    // Progress and Calendar
    // ========================================

    /**
     * Get progress summary for a study plan
     */
    async getPlanProgress(planId: string): Promise<StudyPlanProgress> {
        const response = await api.get<StudyPlanProgress>(`/study-plans/${planId}/progress`);
        return response.data;
    },

    /**
     * Get calendar view for a specific month
     */
    async getPlanCalendar(planId: string, year: number, month: number): Promise<CalendarMonth> {
        const response = await api.get<CalendarMonth>(`/study-plans/${planId}/calendar`, {
            params: { year, month },
        });
        return response.data;
    },

    /**
     * Get today's tasks summary across all plans
     */
    async getTodayTasks(): Promise<TodayTasksSummary> {
        const response = await api.get<TodayTasksSummary>('/study-plans/today');
        return response.data;
    },

    // ========================================
    // Milestones
    // ========================================

    /**
     * Get all milestones for a plan
     */
    async getMilestones(planId: string): Promise<Milestone[]> {
        const response = await api.get<Milestone[]>(`/study-plans/${planId}/milestones`);
        return response.data;
    },

    /**
     * Add a milestone to a plan
     */
    async addMilestone(planId: string, milestone: MilestoneCreate): Promise<Milestone> {
        const response = await api.post<Milestone>(`/study-plans/${planId}/milestones`, milestone);
        return response.data;
    },

    /**
     * Update a milestone
     */
    async updateMilestone(
        planId: string,
        milestoneId: string,
        update: MilestoneUpdate
    ): Promise<Milestone> {
        const response = await api.put<Milestone>(
            `/study-plans/${planId}/milestones/${milestoneId}`,
            update
        );
        return response.data;
    },

    /**
     * Delete a milestone
     */
    async deleteMilestone(planId: string, milestoneId: string): Promise<DeleteResponse> {
        const response = await api.delete<DeleteResponse>(
            `/study-plans/${planId}/milestones/${milestoneId}`
        );
        return response.data;
    },

    /**
     * Mark a milestone as completed
     */
    async completeMilestone(planId: string, milestoneId: string): Promise<Milestone> {
        const response = await api.put<Milestone>(
            `/study-plans/${planId}/milestones/${milestoneId}/complete`
        );
        return response.data;
    },

    // ========================================
    // Daily Tasks
    // ========================================

    /**
     * Get tasks for a plan within a date range
     */
    async getPlanTasks(
        planId: string,
        startDate?: string,
        endDate?: string
    ): Promise<DailyTask[]> {
        const response = await api.get<DailyTask[]>(`/study-plans/${planId}/tasks`, {
            params: { start_date: startDate, end_date: endDate },
        });
        return response.data;
    },

    /**
     * Update a daily task
     */
    async updateTask(
        planId: string,
        taskId: string,
        update: DailyTaskUpdate
    ): Promise<DailyTask> {
        const response = await api.put<DailyTask>(
            `/study-plans/${planId}/tasks/${taskId}`,
            update
        );
        return response.data;
    },

    /**
     * Generate tasks for a date range
     */
    async generateTasks(
        planId: string,
        request: TaskGenerationRequest
    ): Promise<DailyTask[]> {
        const response = await api.post<DailyTask[]>(
            `/study-plans/${planId}/tasks/generate`,
            request
        );
        return response.data;
    },

    /**
     * Increment task progress
     */
    async incrementTaskProgress(
        planId: string,
        taskId: string,
        increment: number = 1
    ): Promise<DailyTask> {
        const response = await api.post<DailyTask>(
            `/study-plans/${planId}/tasks/${taskId}/increment`,
            null,
            { params: { increment } }
        );
        return response.data;
    },
};

export default studyPlanService;
