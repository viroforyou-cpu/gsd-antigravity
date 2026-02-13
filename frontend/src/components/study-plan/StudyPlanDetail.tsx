/**
 * StudyPlanDetail - Detailed view of a study plan with progress tracking.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../layout';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';
import { MilestoneTracker } from './MilestoneTracker';
import { DailyTaskList } from './DailyTaskList';
import { PlanCalendar } from './PlanCalendar';
import { studyPlanService } from '../../services/studyPlanService';
import type {
    StudyPlan,
    StudyPlanProgress,
    DailyTask,
    CalendarMonth,
    PlanStatus,
} from '../../types/studyPlan';

type Tab = 'overview' | 'tasks' | 'calendar';

const statusColors: Record<PlanStatus, string> = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<PlanStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
};

export function StudyPlanDetail() {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();

    const [plan, setPlan] = useState<StudyPlan | null>(null);
    const [progress, setProgress] = useState<StudyPlanProgress | null>(null);
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [calendar, setCalendar] = useState<CalendarMonth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    useEffect(() => {
        if (planId) {
            loadPlanData();
        }
    }, [planId]);

    const loadPlanData = async () => {
        if (!planId) return;

        try {
            setLoading(true);
            setError(null);

            const [planData, progressData, tasksData, calendarData] = await Promise.all([
                studyPlanService.getPlan(planId),
                studyPlanService.getPlanProgress(planId),
                studyPlanService.getPlanTasks(planId),
                studyPlanService.getPlanCalendar(planId, currentYear, currentMonth),
            ]);

            setPlan(planData);
            setProgress(progressData);
            setTasks(tasksData);
            setCalendar(calendarData);
        } catch (err) {
            console.error('Failed to load plan:', err);
            setError('Failed to load study plan');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (status: PlanStatus) => {
        if (!planId) return;

        try {
            const updated = await studyPlanService.updatePlanStatus(planId, status);
            setPlan(updated);
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update plan status');
        }
    };

    const handleDelete = async () => {
        if (!planId || !window.confirm('Are you sure you want to delete this study plan?')) {
            return;
        }

        try {
            await studyPlanService.deletePlan(planId);
            navigate('/study-plans');
        } catch (err) {
            console.error('Failed to delete plan:', err);
            alert('Failed to delete plan');
        }
    };

    const handleMilestoneComplete = async (milestoneId: string) => {
        if (!planId) return;

        try {
            await studyPlanService.completeMilestone(planId, milestoneId);
            // Reload plan data to reflect changes
            loadPlanData();
        } catch (err) {
            console.error('Failed to complete milestone:', err);
            alert('Failed to mark milestone as complete');
        }
    };

    const handleTaskIncrement = async (taskId: string) => {
        if (!planId) return;

        try {
            const updated = await studyPlanService.incrementTaskProgress(planId, taskId);
            setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
        } catch (err) {
            console.error('Failed to increment task:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <Layout title="Study Plan">
                <Loading />
            </Layout>
        );
    }

    if (error || !plan) {
        return (
            <Layout title="Study Plan">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-red-50 border-red-200">
                        <CardBody>
                            <p className="text-red-700">{error || 'Study plan not found'}</p>
                            <Link to="/study-plans" className="text-primary-600 hover:underline mt-2 block">
                                ← Back to Study Plans
                            </Link>
                        </CardBody>
                    </Card>
                </div>
            </Layout>
        );
    }

    const daysRemaining = plan.target_date
        ? Math.ceil((new Date(plan.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <Layout title={plan.name}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to="/study-plans"
                        className="text-primary-600 hover:underline text-sm mb-2 inline-block"
                    >
                        ← Back to Study Plans
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
                                <span
                                    className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[plan.status]}`}
                                >
                                    {statusLabels[plan.status]}
                                </span>
                            </div>
                            {plan.description && (
                                <p className="text-gray-600 mt-1">{plan.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {plan.status === 'active' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusChange('paused')}
                                >
                                    ⏸️ Pause
                                </Button>
                            )}
                            {plan.status === 'paused' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusChange('active')}
                                >
                                    ▶️ Resume
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                🗑️ Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Summary */}
                {progress && (
                    <Card className="mb-6">
                        <CardBody>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary-600">
                                        {Math.round(progress.overall_progress)}%
                                    </div>
                                    <div className="text-sm text-gray-500">Overall Progress</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {progress.completed_milestones}/{progress.total_milestones}
                                    </div>
                                    <div className="text-sm text-gray-500">Milestones</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {progress.current_streak}
                                    </div>
                                    <div className="text-sm text-gray-500">Day Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {daysRemaining !== null ? daysRemaining : '—'}
                                    </div>
                                    <div className="text-sm text-gray-500">Days Remaining</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="h-3 rounded-full bg-primary-500 transition-all"
                                        style={{ width: `${progress.overall_progress}%` }}
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Target Date Info */}
                {plan.target_date && (
                    <Card className="mb-6">
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-gray-500">Target Date:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {formatDate(plan.target_date)}
                                    </span>
                                </div>
                                {daysRemaining !== null && plan.status === 'active' && (
                                    <span
                                        className={
                                            daysRemaining < 0
                                                ? 'text-red-600 font-medium'
                                                : daysRemaining < 7
                                                    ? 'text-orange-600 font-medium'
                                                    : 'text-gray-600'
                                        }
                                    >
                                        {daysRemaining < 0
                                            ? `${Math.abs(daysRemaining)} days overdue`
                                            : `${daysRemaining} days remaining`}
                                    </span>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {(['overview', 'tasks', 'calendar'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Settings Summary */}
                        <Card>
                            <CardBody>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Study Settings
                                </h3>
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Daily Question Goal</dt>
                                        <dd className="font-medium text-gray-900">
                                            {plan.settings.daily_question_goal} questions
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Study Days</dt>
                                        <dd className="font-medium text-gray-900">
                                            {plan.settings.study_days.length} days/week
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">SRS Reviews</dt>
                                        <dd className="font-medium text-gray-900">
                                            {plan.settings.include_srs_reviews ? 'Enabled' : 'Disabled'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Bookmark Reviews</dt>
                                        <dd className="font-medium text-gray-900">
                                            {plan.settings.include_bookmark_reviews ? 'Enabled' : 'Disabled'}
                                        </dd>
                                    </div>
                                </dl>
                                {plan.settings.categories.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <dt className="text-gray-500 text-sm">Focus Categories</dt>
                                        <dd className="mt-1 flex flex-wrap gap-2">
                                            {plan.settings.categories.map((cat) => (
                                                <span
                                                    key={cat}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </dd>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Milestones */}
                        <MilestoneTracker
                            milestones={plan.milestones}
                            onComplete={handleMilestoneComplete}
                            editable={plan.status === 'active'}
                        />
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <DailyTaskList
                        tasks={tasks}
                        onIncrement={handleTaskIncrement}
                        planStatus={plan.status}
                    />
                )}

                {activeTab === 'calendar' && calendar && (
                    <PlanCalendar
                        calendar={calendar}
                        onDayClick={(date) => {
                            // Filter tasks for the clicked day
                            setActiveTab('tasks');
                        }}
                    />
                )}
            </div>
        </Layout>
    );
}

export default StudyPlanDetail;
