/**
 * Admin Service - API client for Admin Dashboard.
 *
 * Phase 24: Admin Dashboard
 */

import api from './api';
import type {
    AdminDashboardStats,
    AdminLogList,
    AdminAction,
    UserAdminView,
    UserAdminUpdate,
    UserAdminList,
    UserActivityStats,
    QuestionReport,
    QuestionReportCreate,
    QuestionReportResolve,
    QuestionReportList,
    AdminSetting,
    AdminSettingUpdate,
    AdminSettingsList,
    AdminAnalyticsOverview,
    UserGrowthStats,
    CategoryStats,
    AdminUsersParams,
    AdminReportsParams,
    AdminLogsParams,
    AdminUserGrowthParams,
    ReportStatus,
    ReportReason,
} from '../types/admin';

const BASE_PATH = '/admin';

/**
 * Admin Service
 * Provides API methods for Admin Dashboard functionality
 */
export const adminService = {
    // ============================================
    // Dashboard
    // ============================================

    /**
     * Get admin dashboard statistics
     */
    async getDashboard(): Promise<AdminDashboardStats> {
        const response = await api.get(`${BASE_PATH}/dashboard`);
        return response.data;
    },

    // ============================================
    // User Management
    // ============================================

    /**
     * Get paginated list of users
     */
    async getUsers(params: AdminUsersParams = {}): Promise<UserAdminList> {
        const response = await api.get(`${BASE_PATH}/users`, { params });
        return response.data;
    },

    /**
     * Get a single user by ID
     */
    async getUser(userId: string): Promise<UserAdminView> {
        const response = await api.get(`${BASE_PATH}/users/${userId}`);
        return response.data;
    },

    /**
     * Update a user's role or status
     */
    async updateUser(userId: string, data: UserAdminUpdate): Promise<UserAdminView> {
        const response = await api.put(`${BASE_PATH}/users/${userId}`, data);
        return response.data;
    },

    /**
     * Deactivate a user account
     */
    async deactivateUser(userId: string): Promise<UserAdminView> {
        const response = await api.post(`${BASE_PATH}/users/${userId}/deactivate`);
        return response.data;
    },

    /**
     * Activate a user account
     */
    async activateUser(userId: string): Promise<UserAdminView> {
        const response = await api.post(`${BASE_PATH}/users/${userId}/activate`);
        return response.data;
    },

    /**
     * Get detailed activity statistics for a user
     */
    async getUserActivity(userId: string): Promise<UserActivityStats> {
        const response = await api.get(`${BASE_PATH}/users/${userId}/activity`);
        return response.data;
    },

    // ============================================
    // Question Reports
    // ============================================

    /**
     * Get paginated list of question reports
     */
    async getReports(params: AdminReportsParams = {}): Promise<QuestionReportList> {
        const response = await api.get(`${BASE_PATH}/reports`, { params });
        return response.data;
    },

    /**
     * Get a single report by ID
     */
    async getReport(reportId: string): Promise<QuestionReport> {
        const response = await api.get(`${BASE_PATH}/reports/${reportId}`);
        return response.data;
    },

    /**
     * Resolve a question report
     */
    async resolveReport(reportId: string, data: QuestionReportResolve): Promise<QuestionReport> {
        const response = await api.put(`${BASE_PATH}/reports/${reportId}/resolve`, data);
        return response.data;
    },

    // ============================================
    // Settings
    // ============================================

    /**
     * Get all admin settings
     */
    async getSettings(): Promise<AdminSettingsList> {
        const response = await api.get(`${BASE_PATH}/settings`);
        return response.data;
    },

    /**
     * Get a single setting by key
     */
    async getSetting(key: string): Promise<AdminSetting> {
        const response = await api.get(`${BASE_PATH}/settings/${key}`);
        return response.data;
    },

    /**
     * Update an admin setting
     */
    async updateSetting(key: string, data: AdminSettingUpdate): Promise<AdminSetting> {
        const response = await api.put(`${BASE_PATH}/settings/${key}`, data);
        return response.data;
    },

    // ============================================
    // Analytics
    // ============================================

    /**
     * Get overview analytics statistics
     */
    async getAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
        const response = await api.get(`${BASE_PATH}/analytics/overview`);
        return response.data;
    },

    /**
     * Get user growth statistics for a date range
     */
    async getUserGrowth(params: AdminUserGrowthParams): Promise<UserGrowthStats[]> {
        const response = await api.get(`${BASE_PATH}/analytics/users/growth`, { params });
        return response.data;
    },

    /**
     * Get statistics by category
     */
    async getCategoryStats(): Promise<CategoryStats[]> {
        const response = await api.get(`${BASE_PATH}/analytics/categories`);
        return response.data;
    },

    // ============================================
    // Admin Logs
    // ============================================

    /**
     * Get paginated admin action logs
     */
    async getLogs(params: AdminLogsParams = {}): Promise<AdminLogList> {
        const response = await api.get(`${BASE_PATH}/logs`, { params });
        return response.data;
    },

    // ============================================
    // Health Check
    // ============================================

    /**
     * Check admin API health
     */
    async healthCheck(): Promise<{ status: string; admin: string }> {
        const response = await api.get(`${BASE_PATH}/health`);
        return response.data;
    },
};

export default adminService;
