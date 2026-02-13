/**
 * MilestoneTracker - Visual milestone progress component.
 */
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import type { Milestone } from '../../types/studyPlan';

interface MilestoneTrackerProps {
    milestones: Milestone[];
    onComplete: (milestoneId: string) => void;
    editable?: boolean;
}

const taskTypeIcons: Record<string, string> = {
    practice_questions: '📝',
    review_bookmarks: '🔖',
    review_srs: '🔄',
    study_category: '📚',
};

export function MilestoneTracker({
    milestones,
    onComplete,
    editable = true,
}: MilestoneTrackerProps) {
    if (milestones.length === 0) {
        return (
            <Card>
                <CardBody className="text-center py-8">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Milestones
                    </h3>
                    <p className="text-gray-600">
                        Add milestones to track your progress toward your goal.
                    </p>
                </CardBody>
            </Card>
        );
    }

    const completedCount = milestones.filter((m) => m.completed_at).length;
    const progressPercentage = (completedCount / milestones.length) * 100;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card>
            <CardBody>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Milestones
                    </h3>
                    <span className="text-sm text-gray-500">
                        {completedCount}/{milestones.length} completed
                    </span>
                </div>

                {/* Overall Progress Bar */}
                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Milestone Timeline */}
                <div className="space-y-4">
                    {milestones.map((milestone, index) => {
                        const isCompleted = !!milestone.completed_at;
                        const isOverdue =
                            milestone.target_date &&
                            !isCompleted &&
                            new Date(milestone.target_date) < new Date();

                        return (
                            <div
                                key={milestone.id}
                                className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${isCompleted
                                    ? 'bg-green-50 border-green-200'
                                    : isOverdue
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {/* Connection Line */}
                                {index < milestones.length - 1 && (
                                    <div
                                        className={`absolute left-8 top-12 w-0.5 h-8 ${isCompleted ? 'bg-green-300' : 'bg-gray-300'
                                            }`}
                                    />
                                )}

                                {/* Status Icon */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCompleted
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-300 text-gray-600'
                                        }`}
                                >
                                    {isCompleted ? '✓' : index + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4
                                                className={`font-medium ${isCompleted
                                                    ? 'text-green-800 line-through'
                                                    : 'text-gray-900'
                                                    }`}
                                            >
                                                {milestone.title}
                                            </h4>
                                            {milestone.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {milestone.description}
                                                </p>
                                            )}
                                        </div>
                                        {milestone.target_date && (
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${isOverdue
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {formatDate(milestone.target_date)}
                                            </span>
                                        )}
                                    </div>

                                    {isCompleted && milestone.completed_at && (
                                        <p className="text-xs text-green-600 mt-2">
                                            Completed on {formatDate(milestone.completed_at)}
                                        </p>
                                    )}
                                </div>

                                {/* Action Button */}
                                {!isCompleted && editable && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onComplete(milestone.id)}
                                        className="flex-shrink-0"
                                    >
                                        Complete
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}

export default MilestoneTracker;
