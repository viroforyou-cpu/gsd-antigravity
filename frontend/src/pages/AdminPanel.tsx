/**
 * AdminPanel - Main admin dashboard page.
 *
 * Phase 24: Admin Dashboard
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '../stores/adminStore';
import { Card } from '../components/common/Card';
import { Loading } from '../components/common/Loading';
import type { AdminAnalyticsOverview, AdminLog, QuestionReport, UserAdminView } from '../types/admin';

// Stat Card Component
function StatCard({
    title,
    value,
    subtitle,
    icon,
    color = 'blue',
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    return (
        <Card className={`p-4 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
                </div>
                {icon && <div className="text-3xl opacity-50">{icon}</div>}
            </div>
        </Card>
    );
}

// Overview Stats Component
function OverviewStats({ overview }: { overview: AdminAnalyticsOverview }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Users"
                value={overview.total_users}
                subtitle={`+${overview.new_users_today} today`}
                color="blue"
                icon="👥"
            />
            <StatCard
                title="Active Users"
                value={overview.active_users_today}
                subtitle={`${overview.active_users_week} this week`}
                color="green"
                icon="🟢"
            />
            <StatCard
                title="Sessions Today"
                value={overview.sessions_today}
                subtitle={`${overview.sessions_week} this week`}
                color="purple"
                icon="📊"
            />
            <StatCard
                title="Avg Accuracy"
                value={`${(overview.avg_accuracy * 100).toFixed(1)}%`}
                subtitle={`${overview.questions_answered_today} questions today`}
                color="yellow"
                icon="🎯"
            />
        </div>
    );
}

// Recent Activity Component
function RecentActivity({ logs }: { logs: AdminLog[] }) {
    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
                {logs.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                ) : (
                    logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 text-sm">
                            <span className="text-gray-400 w-16 flex-shrink-0">
                                {formatTime(log.created_at)}
                            </span>
                            <div>
                                <span className="font-medium">{formatAction(log.action)}</span>
                                {log.target_type && (
                                    <span className="text-gray-500 ml-1">
                                        on {log.target_type}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

// Pending Reports Component
function PendingReports({ reports }: { reports: QuestionReport[] }) {
    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pending Reports</h3>
                <Link
                    to="/admin/reports"
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    View all →
                </Link>
            </div>
            <div className="space-y-3">
                {reports.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending reports</p>
                ) : (
                    reports.slice(0, 5).map((report) => (
                        <div key={report.id} className="border rounded p-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium capitalize">
                                    {report.reason}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {report.question_stem && (
                                <p className="text-gray-600 mt-1 line-clamp-2">
                                    {report.question_stem}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

// Recent Users Component
function RecentUsers({ users }: { users: UserAdminView[] }) {
    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Users</h3>
                <Link
                    to="/admin/users"
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    View all →
                </Link>
            </div>
            <div className="space-y-3">
                {users.length === 0 ? (
                    <p className="text-gray-500 text-sm">No users found</p>
                ) : (
                    users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between text-sm">
                            <div>
                                <p className="font-medium">{user.display_name || user.email}</p>
                                <p className="text-gray-500 text-xs">{user.email}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}

// Quick Actions Component
function QuickActions() {
    const actions = [
        { label: 'Manage Users', path: '/admin/users', icon: '👥' },
        { label: 'View Reports', path: '/admin/reports', icon: '📋' },
        { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
        { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
    ];

    return (
        <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                    <Link
                        key={action.path}
                        to={action.path}
                        className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-xl">{action.icon}</span>
                        <span className="text-sm font-medium">{action.label}</span>
                    </Link>
                ))}
            </div>
        </Card>
    );
}

// Main AdminPanel Component
export default function AdminPanel() {
    const {
        dashboardStats,
        dashboardLoading,
        dashboardError,
        fetchDashboard,
    } = useAdminStore();

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (dashboardLoading && !dashboardStats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading size="lg" />
            </div>
        );
    }

    if (dashboardError) {
        return (
            <div className="p-4">
                <Card className="p-6 text-center text-red-600">
                    <p className="text-lg font-semibold">Error Loading Dashboard</p>
                    <p className="text-sm mt-2">{dashboardError}</p>
                    <button
                        onClick={() => fetchDashboard()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </Card>
            </div>
        );
    }

    if (!dashboardStats) {
        return (
            <div className="p-4">
                <Card className="p-6 text-center text-gray-500">
                    No dashboard data available
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        Overview of system activity and management
                    </p>
                </div>
                <button
                    onClick={() => fetchDashboard()}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Overview Stats */}
            <OverviewStats overview={dashboardStats.overview} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Activity & Reports */}
                <div className="lg:col-span-2 space-y-6">
                    <RecentActivity logs={dashboardStats.recent_logs} />
                    <PendingReports reports={dashboardStats.pending_reports} />
                </div>

                {/* Right Column - Quick Actions & Recent Users */}
                <div className="space-y-6">
                    <QuickActions />
                    <RecentUsers users={dashboardStats.recent_users} />
                </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Sessions"
                    value={dashboardStats.overview.total_sessions}
                    subtitle={`${dashboardStats.overview.avg_session_duration.toFixed(1)} min avg`}
                    color="blue"
                />
                <StatCard
                    title="Total Questions"
                    value={dashboardStats.overview.total_questions}
                    color="purple"
                />
                <StatCard
                    title="Pending Reports"
                    value={dashboardStats.overview.pending_reports}
                    subtitle={`${dashboardStats.overview.resolved_reports_week} resolved this week`}
                    color={dashboardStats.overview.pending_reports > 0 ? 'red' : 'green'}
                />
            </div>
        </div>
    );
}
