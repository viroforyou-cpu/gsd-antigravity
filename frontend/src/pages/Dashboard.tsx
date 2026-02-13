import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, CardHeader, CardBody, Button, LoadingSpinner } from '../components/common';
import { TutorInsightsWidget } from '../components/tutor';
import { studyPlanService } from '../services/studyPlanService';
import type { TodayTasksSummary, StudyPlanSummary } from '../types/studyPlan';

export function Dashboard() {
    const [todayTasks, setTodayTasks] = useState<TodayTasksSummary | null>(null);
    const [activePlans, setActivePlans] = useState<StudyPlanSummary[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock data for dashboard
    const stats = {
        totalSessions: 12,
        questionsAnswered: 48,
        accuracy: 72,
        streak: 5,
    };

    // SRS stats (would be fetched from API in production)
    const srsStats = {
        dueToday: 3,
        overdue: 1,
        upcomingWeek: 12,
        retentionRate: 85,
    };

    const recentCategories = [
        { name: 'Lysosomal Storage Disorders', accuracy: 80, count: 10 },
        { name: 'Chromosomal Abnormalities', accuracy: 65, count: 8 },
        { name: 'Inherited Metabolic Disorders', accuracy: 75, count: 12 },
    ];

    useEffect(() => {
        loadStudyPlanData();
    }, []);

    const loadStudyPlanData = async () => {
        try {
            setLoading(true);
            const [tasksData, plansData] = await Promise.all([
                studyPlanService.getTodayTasks(),
                studyPlanService.getPlans('active'),
            ]);
            setTodayTasks(tasksData);
            setActivePlans(plansData.slice(0, 3)); // Show max 3 active plans
        } catch (error) {
            console.error('Failed to load study plan data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Dashboard">
            <div className="max-w-6xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
                    <p className="text-gray-600">Ready to practice some medical genetics questions?</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card variant="elevated" className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                        <CardBody className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Start Practice Session</h3>
                                <p className="text-primary-100 text-sm">Begin a new set of questions</p>
                            </div>
                            <Link to="/practice">
                                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                                    Start Now
                                </Button>
                            </Link>
                        </CardBody>
                    </Card>

                    <Card variant="elevated" className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardBody className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Review Queue</h3>
                                <p className="text-green-100 text-sm">
                                    {srsStats.dueToday} due today{srsStats.overdue > 0 && `, ${srsStats.overdue} overdue`}
                                </p>
                            </div>
                            <Link to="/review-queue">
                                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                                    Review
                                </Button>
                            </Link>
                        </CardBody>
                    </Card>

                    <Card variant="elevated" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardBody className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Review Past Sessions</h3>
                                <p className="text-blue-100 text-sm">Analyze your performance</p>
                            </div>
                            <Link to="/history">
                                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                                    View History
                                </Button>
                            </Link>
                        </CardBody>
                    </Card>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-primary-600">{stats.totalSessions}</p>
                            <p className="text-sm text-gray-500 mt-1">Sessions</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{stats.questionsAnswered}</p>
                            <p className="text-sm text-gray-500 mt-1">Questions</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-green-600">{stats.accuracy}%</p>
                            <p className="text-sm text-gray-500 mt-1">Accuracy</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <p className="text-3xl font-bold text-orange-500">{stats.streak}</p>
                            <p className="text-sm text-gray-500 mt-1">Day Streak</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Today's Tasks and Active Plans Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Today's Tasks Widget */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
                                <Link to="/study-plans" className="text-sm text-primary-600 hover:text-primary-700">
                                    View all →
                                </Link>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {loading ? (
                                <LoadingSpinner />
                            ) : todayTasks && todayTasks.total_tasks > 0 ? (
                                <div>
                                    {/* Progress Summary */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-600">Daily Progress</span>
                                            <span className="font-medium text-gray-900">
                                                {todayTasks.total_questions_completed}/{todayTasks.total_questions_target}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="h-3 rounded-full bg-primary-500 transition-all"
                                                style={{
                                                    width: `${todayTasks.total_questions_target > 0
                                                        ? (todayTasks.total_questions_completed / todayTasks.total_questions_target) * 100
                                                        : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Tasks by Plan */}
                                    <div className="space-y-3">
                                        {todayTasks.plans.map((plan) => (
                                            <div key={plan.plan_id} className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-medium text-gray-900 text-sm mb-2">
                                                    {plan.plan_name}
                                                </p>
                                                <div className="space-y-1">
                                                    {plan.tasks.slice(0, 3).map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className="flex items-center justify-between text-xs"
                                                        >
                                                            <span className="text-gray-600">
                                                                {task.type === 'practice_questions' && '📝 Practice'}
                                                                {task.type === 'review_bookmarks' && '🔖 Bookmarks'}
                                                                {task.type === 'review_srs' && '🔄 SRS Review'}
                                                                {task.type === 'study_category' && '📚 Study'}
                                                            </span>
                                                            <span className={
                                                                task.status === 'completed'
                                                                    ? 'text-green-600'
                                                                    : 'text-gray-500'
                                                            }>
                                                                {task.completed}/{task.target || '∞'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-3">📋</div>
                                    <p className="text-gray-600 mb-3">No tasks scheduled for today</p>
                                    <Link to="/study-plans/create">
                                        <Button variant="outline" size="sm">
                                            Create a Study Plan
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Active Plans Widget */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Active Plans</h3>
                                <Link to="/study-plans" className="text-sm text-primary-600 hover:text-primary-700">
                                    View all →
                                </Link>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {loading ? (
                                <LoadingSpinner />
                            ) : activePlans.length > 0 ? (
                                <div className="space-y-3">
                                    {activePlans.map((plan) => {
                                        const daysRemaining = plan.target_date
                                            ? Math.ceil((new Date(plan.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                            : null;

                                        return (
                                            <Link
                                                key={plan.id}
                                                to={`/study-plans/${plan.id}`}
                                                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {plan.name}
                                                        </p>
                                                        {plan.description && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                                {plan.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {daysRemaining !== null && (
                                                        <span className={`text-xs px-2 py-1 rounded-full ${daysRemaining < 0
                                                            ? 'bg-red-100 text-red-700'
                                                            : daysRemaining < 7
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {daysRemaining < 0
                                                                ? `${Math.abs(daysRemaining)}d overdue`
                                                                : `${daysRemaining}d left`}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}

                                    {activePlans.length === 0 && (
                                        <div className="text-center py-6">
                                            <div className="text-4xl mb-3">📚</div>
                                            <p className="text-gray-600 mb-3">No active study plans</p>
                                            <Link to="/study-plans/create">
                                                <Button variant="outline" size="sm">
                                                    Create Your First Plan
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-3">📚</div>
                                    <p className="text-gray-600 mb-3">No active study plans</p>
                                    <Link to="/study-plans/create">
                                        <Button variant="outline" size="sm">
                                            Create Your First Plan
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* AI Tutor Insights Widget */}
                    <TutorInsightsWidget />
                </div>

                {/* SRS Stats Section */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Spaced Repetition</h3>
                            <Link to="/review-queue" className="text-sm text-primary-600 hover:text-primary-700">
                                View all →
                            </Link>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-primary-50 rounded-lg">
                                <p className="text-2xl font-bold text-primary-600">{srsStats.dueToday}</p>
                                <p className="text-sm text-gray-600">Due Today</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">{srsStats.overdue}</p>
                                <p className="text-sm text-gray-600">Overdue</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{srsStats.upcomingWeek}</p>
                                <p className="text-sm text-gray-600">This Week</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{srsStats.retentionRate}%</p>
                                <p className="text-sm text-gray-600">Retention</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Category Performance */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Recent Category Performance</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {recentCategories.map((category) => (
                                <div key={category.name} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">{category.name}</p>
                                        <p className="text-xs text-gray-500">{category.count} questions</p>
                                    </div>
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${category.accuracy >= 70 ? 'bg-green-500' : category.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${category.accuracy}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                        {category.accuracy}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </Layout>
    );
}
