/**
 * StudyPlanList - Component for displaying a list of study plans.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../layout';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';
import { StudyPlanCard } from './StudyPlanCard';
import { studyPlanService } from '../../services/studyPlanService';
import type { StudyPlanSummary, PlanStatus, StudyPlanProgress } from '../../types/studyPlan';

type FilterStatus = PlanStatus | 'all';

export function StudyPlanList() {
    const [plans, setPlans] = useState<StudyPlanSummary[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, StudyPlanProgress>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('all');

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await studyPlanService.getPlans();
            setPlans(data);

            // Load progress for each active plan
            const progressPromises = data
                .filter((p) => p.status === 'active')
                .map(async (p) => {
                    try {
                        const progress = await studyPlanService.getPlanProgress(p.id);
                        return { id: p.id, progress };
                    } catch {
                        return { id: p.id, progress: null };
                    }
                });

            const progressResults = await Promise.all(progressPromises);
            const newProgressMap: Record<string, StudyPlanProgress> = {};
            progressResults.forEach((result) => {
                if (result.progress) {
                    newProgressMap[result.id] = result.progress;
                }
            });
            setProgressMap(newProgressMap);
        } catch (err) {
            setError('Failed to load study plans');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (planId: string) => {
        if (!window.confirm('Are you sure you want to delete this study plan?')) {
            return;
        }

        try {
            await studyPlanService.deletePlan(planId);
            setPlans(plans.filter((p) => p.id !== planId));
        } catch (err) {
            console.error('Failed to delete plan:', err);
            alert('Failed to delete plan');
        }
    };

    const handleStatusChange = async (planId: string, status: PlanStatus) => {
        try {
            await studyPlanService.updatePlanStatus(planId, status);
            setPlans(
                plans.map((p) => (p.id === planId ? { ...p, status } : p))
            );
        } catch (err) {
            console.error('Failed to update plan status:', err);
            alert('Failed to update plan status');
        }
    };

    const filteredPlans = plans.filter((p) => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    const planCounts = {
        all: plans.length,
        active: plans.filter((p) => p.status === 'active').length,
        paused: plans.filter((p) => p.status === 'paused').length,
        completed: plans.filter((p) => p.status === 'completed').length,
    };

    if (loading) {
        return (
            <Layout title="Study Plans">
                <Loading />
            </Layout>
        );
    }

    return (
        <Layout title="Study Plans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Study Plans</h2>
                        <p className="text-gray-600">Create and manage your personalized learning paths</p>
                    </div>
                    <Link to="/study-plans/create">
                        <Button variant="primary">+ Create Plan</Button>
                    </Link>
                </div>

                {/* Error message */}
                {error && (
                    <Card className="mb-6 bg-red-50 border-red-200">
                        <CardBody>
                            <p className="text-red-700">{error}</p>
                        </CardBody>
                    </Card>
                )}

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'active', 'paused', 'completed'] as FilterStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)} ({planCounts[status]})
                        </button>
                    ))}
                </div>

                {/* Plans grid */}
                {filteredPlans.length === 0 ? (
                    <Card>
                        <CardBody className="text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {filter === 'all'
                                    ? 'No study plans yet'
                                    : `No ${filter} plans`}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {filter === 'all'
                                    ? 'Create your first study plan to start tracking your learning goals.'
                                    : `You don't have any ${filter} study plans.`}
                            </p>
                            {filter === 'all' && (
                                <Link to="/study-plans/create">
                                    <Button variant="primary">Create Your First Plan</Button>
                                </Link>
                            )}
                        </CardBody>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPlans.map((plan) => (
                            <StudyPlanCard
                                key={plan.id}
                                plan={plan}
                                progress={progressMap[plan.id]}
                                onDelete={handleDelete}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default StudyPlanList;
