/**
 * StudyPlanCard - Card component for displaying a study plan summary.
 */
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import type { StudyPlanSummary, PlanStatus } from '../../types/studyPlan';

interface StudyPlanCardProps {
    plan: StudyPlanSummary;
    progress?: {
        overall_progress: number;
        completed_milestones: number;
        total_milestones: number;
    };
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, status: PlanStatus) => void;
}

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

export function StudyPlanCard({
    plan,
    progress,
    onDelete,
    onStatusChange,
}: StudyPlanCardProps) {
    const daysRemaining = plan.target_date
        ? Math.ceil((new Date(plan.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <Card variant="elevated" className="hover:shadow-lg transition-shadow">
            <CardBody>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                            <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[plan.status]
                                    }`}
                            >
                                {statusLabels[plan.status]}
                            </span>
                        </div>
                        {plan.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                        )}
                    </div>
                </div>

                {/* Target date and days remaining */}
                {plan.target_date && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span>Target: {formatDate(plan.target_date)}</span>
                        {daysRemaining !== null && plan.status === 'active' && (
                            <span
                                className={
                                    daysRemaining < 0
                                        ? 'text-red-600 font-medium'
                                        : daysRemaining < 7
                                            ? 'text-orange-600 font-medium'
                                            : ''
                                }
                            >
                                {daysRemaining < 0
                                    ? `${Math.abs(daysRemaining)} days overdue`
                                    : `${daysRemaining} days remaining`}
                            </span>
                        )}
                    </div>
                )}

                {/* Progress bar */}
                {progress && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-900">
                                {Math.round(progress.overall_progress)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-primary-500 transition-all"
                                style={{ width: `${progress.overall_progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                            <span>
                                {progress.completed_milestones}/{progress.total_milestones} milestones
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Link to={`/study-plans/${plan.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                            View Details
                        </Button>
                    </Link>
                    {plan.status === 'active' && onStatusChange && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusChange(plan.id, 'paused')}
                            title="Pause plan"
                        >
                            ⏸️
                        </Button>
                    )}
                    {plan.status === 'paused' && onStatusChange && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusChange(plan.id, 'active')}
                            title="Resume plan"
                        >
                            ▶️
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(plan.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete plan"
                        >
                            🗑️
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}

export default StudyPlanCard;
