/**
 * DailyTaskList - Component for displaying and managing daily tasks.
 */
import { useState } from 'react';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import type { DailyTask, TaskType, TaskStatus, PlanStatus } from '../../types/studyPlan';

interface DailyTaskListProps {
    tasks: DailyTask[];
    onIncrement: (taskId: string) => void;
    planStatus: PlanStatus;
}

const taskTypeLabels: Record<TaskType, string> = {
    practice_questions: 'Practice Questions',
    review_bookmarks: 'Review Bookmarks',
    review_srs: 'Spaced Repetition',
    study_category: 'Study Category',
};

const taskTypeIcons: Record<TaskType, string> = {
    practice_questions: '📝',
    review_bookmarks: '🔖',
    review_srs: '🔄',
    study_category: '📚',
};

const statusColors: Record<TaskStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    skipped: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<TaskStatus, string> = {
    pending: 'Pending',
    completed: 'Completed',
    skipped: 'Skipped',
};

type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

export function DailyTaskList({
    tasks,
    onIncrement,
    planStatus,
}: DailyTaskListProps) {
    const [filter, setFilter] = useState<FilterType>('all');

    const today = new Date().toISOString().split('T')[0];

    const filteredTasks = tasks.filter((task) => {
        switch (filter) {
            case 'today':
                return task.date === today;
            case 'upcoming':
                return task.date > today && task.status === 'pending';
            case 'completed':
                return task.status === 'completed';
            default:
                return true;
        }
    });

    // Sort by date (most recent first)
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.task_type.localeCompare(b.task_type);
    });

    // Group tasks by date
    const groupedTasks = sortedTasks.reduce((groups, task) => {
        const date = task.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(task);
        return groups;
    }, {} as Record<string, DailyTask[]>);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const todayDate = new Date(today);

        if (dateStr === today) {
            return 'Today';
        }

        const tomorrow = new Date(todayDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (dateStr === tomorrow.toISOString().split('T')[0]) {
            return 'Tomorrow';
        }

        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateStr === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const taskCounts = {
        all: tasks.length,
        today: tasks.filter((t) => t.date === today).length,
        upcoming: tasks.filter((t) => t.date > today && t.status === 'pending').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
    };

    const isTaskEditable = planStatus === 'active';

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'today', 'upcoming', 'completed'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)} ({taskCounts[f]})
                    </button>
                ))}
            </div>

            {/* Task List */}
            {Object.keys(groupedTasks).length === 0 ? (
                <Card>
                    <CardBody className="text-center py-8">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Tasks Found
                        </h3>
                        <p className="text-gray-600">
                            {filter === 'all'
                                ? 'No tasks have been generated yet.'
                                : `No ${filter} tasks.`}
                        </p>
                    </CardBody>
                </Card>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedTasks).map(([date, dateTasks]) => (
                        <div key={date}>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">
                                {formatDate(date)}
                            </h3>
                            <div className="space-y-2">
                                {dateTasks.map((task) => {
                                    const progress = task.target_count
                                        ? (task.completed_count / task.target_count) * 100
                                        : task.completed_count > 0
                                            ? 100
                                            : 0;

                                    const isComplete = task.status === 'completed';
                                    const isToday = task.date === today;

                                    return (
                                        <Card
                                            key={task.id}
                                            className={`${isComplete ? 'bg-green-50 border-green-200' : ''
                                                }`}
                                        >
                                            <CardBody className="py-3">
                                                <div className="flex items-center gap-4">
                                                    {/* Task Icon */}
                                                    <div
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${isComplete
                                                            ? 'bg-green-200'
                                                            : 'bg-gray-100'
                                                            }`}
                                                    >
                                                        {taskTypeIcons[task.task_type]}
                                                    </div>

                                                    {/* Task Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">
                                                                {taskTypeLabels[task.task_type]}
                                                            </span>
                                                            <span
                                                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[task.status]}`}
                                                            >
                                                                {statusLabels[task.status]}
                                                            </span>
                                                        </div>

                                                        {/* Progress */}
                                                        {task.target_count && (
                                                            <div className="mt-1">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <span>
                                                                        {task.completed_count}/{task.target_count}
                                                                    </span>
                                                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-32">
                                                                        <div
                                                                            className={`h-1.5 rounded-full transition-all ${isComplete
                                                                                ? 'bg-green-500'
                                                                                : 'bg-primary-500'
                                                                                }`}
                                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Button */}
                                                    {isTaskEditable &&
                                                        !isComplete &&
                                                        task.target_count &&
                                                        task.completed_count < task.target_count && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => onIncrement(task.id)}
                                                            >
                                                                +1
                                                            </Button>
                                                        )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DailyTaskList;
