/**
 * Admin Store - Zustand store for Admin Dashboard.
 *
 * Phase 24: Admin Dashboard
 */

import { create } from 'zustand';
import adminService from '../services/adminService';
import type {
    AdminDashboardStats,
    AdminLogList,
    AdminLog,
    UserAdminView,
    UserAdminList,
    UserAdminUpdate,
    QuestionReport,
    QuestionReportList,
    QuestionReportResolve,
    AdminSetting,
    AdminSettingsList,
    AdminSettingUpdate,
    AdminAnalyticsOverview,
    UserGrowthStats,
    CategoryStats,
    AdminUsersParams,
    AdminReportsParams,
    AdminLogsParams,
    AdminUserGrowthParams,
    ReportStatus,
} from '../types/admin';

interface AdminStore {
    // Dashboard state
    dashboardStats: AdminDashboardStats | null;
    dashboardLoading: boolean;
    dashboardError: string | null;

    // Users state
    users: UserAdminList | null;
    usersLoading: boolean;
    usersError: string | null;
    selectedUser: UserAdminView | null;
    selectedUserLoading: boolean;

    // Reports state
    reports: QuestionReportList | null;
    reportsLoading: boolean;
    reportsError: string | null;

    // Settings state
    settings: AdminSettingsList | null;
    settingsLoading: boolean;
    settingsError: string | null;

    // Analytics state
    analyticsOverview: AdminAnalyticsOverview | null;
    analyticsLoading: boolean;
    analyticsError: string | null;
    userGrowth: UserGrowthStats[];
    categoryStats: CategoryStats[];

    // Logs state
    logs: AdminLogList | null;
    logsLoading: boolean;
    logsError: string | null;

    // Dashboard actions
    fetchDashboard: () => Promise<void>;

    // Users actions
    fetchUsers: (params?: AdminUsersParams) => Promise<void>;
    fetchUser: (userId: string) => Promise<void>;
    updateUser: (userId: string, data: UserAdminUpdate) => Promise<void>;
    deactivateUser: (userId: string) => Promise<void>;
    activateUser: (userId: string) => Promise<void>;
    clearSelectedUser: () => void;

    // Reports actions
    fetchReports: (params?: AdminReportsParams) => Promise<void>;
    resolveReport: (reportId: string, data: QuestionReportResolve) => Promise<void>;

    // Settings actions
    fetchSettings: () => Promise<void>;
    updateSetting: (key: string, data: AdminSettingUpdate) => Promise<void>;

    // Analytics actions
    fetchAnalyticsOverview: () => Promise<void>;
    fetchUserGrowth: (params: AdminUserGrowthParams) => Promise<void>;
    fetchCategoryStats: () => Promise<void>;

    // Logs actions
    fetchLogs: (params?: AdminLogsParams) => Promise<void>;

    // Utility actions
    clearErrors: () => void;
    reset: () => void;
}

const initialState = {
    dashboardStats: null,
    dashboardLoading: false,
    dashboardError: null,

    users: null,
    usersLoading: false,
    usersError: null,
    selectedUser: null,
    selectedUserLoading: false,

    reports: null,
    reportsLoading: false,
    reportsError: null,

    settings: null,
    settingsLoading: false,
    settingsError: null,

    analyticsOverview: null,
    analyticsLoading: false,
    analyticsError: null,
    userGrowth: [],
    categoryStats: [],

    logs: null,
    logsLoading: false,
    logsError: null,
};

export const useAdminStore = create<AdminStore>((set, get) => ({
    ...initialState,

    // ============================================
    // Dashboard Actions
    // ============================================

    fetchDashboard: async () => {
        set({ dashboardLoading: true, dashboardError: null });
        try {
            const stats = await adminService.getDashboard();
            set({ dashboardStats: stats, dashboardLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch dashboard';
            set({ dashboardError: message, dashboardLoading: false });
        }
    },

    // ============================================
    // Users Actions
    // ============================================

    fetchUsers: async (params?: AdminUsersParams) => {
        set({ usersLoading: true, usersError: null });
        try {
            const users = await adminService.getUsers(params);
            set({ users, usersLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch users';
            set({ usersError: message, usersLoading: false });
        }
    },

    fetchUser: async (userId: string) => {
        set({ selectedUserLoading: true, usersError: null });
        try {
            const user = await adminService.getUser(userId);
            set({ selectedUser: user, selectedUserLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch user';
            set({ usersError: message, selectedUserLoading: false });
        }
    },

    updateUser: async (userId: string, data: UserAdminUpdate) => {
        set({ usersError: null });
        try {
            const updatedUser = await adminService.updateUser(userId, data);

            // Update in list if present
            const currentUsers = get().users;
            if (currentUsers) {
                const updatedUsers = currentUsers.users.map(u =>
                    u.id === userId ? updatedUser : u
                );
                set({ users: { ...currentUsers, users: updatedUsers } });
            }

            // Update selected user if it's the same
            if (get().selectedUser?.id === userId) {
                set({ selectedUser: updatedUser });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update user';
            set({ usersError: message });
            throw error;
        }
    },

    deactivateUser: async (userId: string) => {
        try {
            const updatedUser = await adminService.deactivateUser(userId);

            // Update in list if present
            const currentUsers = get().users;
            if (currentUsers) {
                const updatedUsers = currentUsers.users.map(u =>
                    u.id === userId ? updatedUser : u
                );
                set({ users: { ...currentUsers, users: updatedUsers } });
            }

            if (get().selectedUser?.id === userId) {
                set({ selectedUser: updatedUser });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to deactivate user';
            set({ usersError: message });
            throw error;
        }
    },

    activateUser: async (userId: string) => {
        try {
            const updatedUser = await adminService.activateUser(userId);

            // Update in list if present
            const currentUsers = get().users;
            if (currentUsers) {
                const updatedUsers = currentUsers.users.map(u =>
                    u.id === userId ? updatedUser : u
                );
                set({ users: { ...currentUsers, users: updatedUsers } });
            }

            if (get().selectedUser?.id === userId) {
                set({ selectedUser: updatedUser });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to activate user';
            set({ usersError: message });
            throw error;
        }
    },

    clearSelectedUser: () => {
        set({ selectedUser: null });
    },

    // ============================================
    // Reports Actions
    // ============================================

    fetchReports: async (params?: AdminReportsParams) => {
        set({ reportsLoading: true, reportsError: null });
        try {
            const reports = await adminService.getReports(params);
            set({ reports, reportsLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch reports';
            set({ reportsError: message, reportsLoading: false });
        }
    },

    resolveReport: async (reportId: string, data: QuestionReportResolve) => {
        set({ reportsError: null });
        try {
            const resolvedReport = await adminService.resolveReport(reportId, data);

            // Update in list if present
            const currentReports = get().reports;
            if (currentReports) {
                const updatedReports = currentReports.reports.map(r =>
                    r.id === reportId ? resolvedReport : r
                );
                set({ reports: { ...currentReports, reports: updatedReports } });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resolve report';
            set({ reportsError: message });
            throw error;
        }
    },

    // ============================================
    // Settings Actions
    // ============================================

    fetchSettings: async () => {
        set({ settingsLoading: true, settingsError: null });
        try {
            const settings = await adminService.getSettings();
            set({ settings, settingsLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch settings';
            set({ settingsError: message, settingsLoading: false });
        }
    },

    updateSetting: async (key: string, data: AdminSettingUpdate) => {
        set({ settingsError: null });
        try {
            const updatedSetting = await adminService.updateSetting(key, data);

            // Update in list if present
            const currentSettings = get().settings;
            if (currentSettings) {
                const updatedSettings = currentSettings.settings.map(s =>
                    s.key === key ? updatedSetting : s
                );
                set({ settings: { ...currentSettings, settings: updatedSettings } });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update setting';
            set({ settingsError: message });
            throw error;
        }
    },

    // ============================================
    // Analytics Actions
    // ============================================

    fetchAnalyticsOverview: async () => {
        set({ analyticsLoading: true, analyticsError: null });
        try {
            const overview = await adminService.getAnalyticsOverview();
            set({ analyticsOverview: overview, analyticsLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
            set({ analyticsError: message, analyticsLoading: false });
        }
    },

    fetchUserGrowth: async (params: AdminUserGrowthParams) => {
        set({ analyticsLoading: true, analyticsError: null });
        try {
            const growth = await adminService.getUserGrowth(params);
            set({ userGrowth: growth, analyticsLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch user growth';
            set({ analyticsError: message, analyticsLoading: false });
        }
    },

    fetchCategoryStats: async () => {
        set({ analyticsLoading: true, analyticsError: null });
        try {
            const stats = await adminService.getCategoryStats();
            set({ categoryStats: stats, analyticsLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch category stats';
            set({ analyticsError: message, analyticsLoading: false });
        }
    },

    // ============================================
    // Logs Actions
    // ============================================

    fetchLogs: async (params?: AdminLogsParams) => {
        set({ logsLoading: true, logsError: null });
        try {
            const logs = await adminService.getLogs(params);
            set({ logs, logsLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch logs';
            set({ logsError: message, logsLoading: false });
        }
    },

    // ============================================
    // Utility Actions
    // ============================================

    clearErrors: () => {
        set({
            dashboardError: null,
            usersError: null,
            reportsError: null,
            settingsError: null,
            analyticsError: null,
            logsError: null,
        });
    },

    reset: () => {
        set(initialState);
    },
}));

export default useAdminStore;
