/**
 * TutorInsightsWidget - Dashboard widget for learning insights.
 *
 * Phase 22: AI Tutor Mode
 */

import { useEffect } from 'react';
import { useTutorStore } from '../../stores/tutorStore';
import type { LearningInsight, InsightType } from '../../types/tutor';

interface TutorInsightsWidgetProps {
    className?: string;
}

const INSIGHT_TYPE_CONFIG: Record<InsightType, { icon: string; color: string; label: string }> = {
    misconception: { icon: '⚠️', color: 'text-amber-600 bg-amber-50', label: 'Misconception' },
    knowledge_gap: { icon: '📚', color: 'text-blue-600 bg-blue-50', label: 'Knowledge Gap' },
    strength: { icon: '💪', color: 'text-green-600 bg-green-50', label: 'Strength' },
    weakness: { icon: '🎯', color: 'text-red-600 bg-red-50', label: 'Weakness' },
    recommendation: { icon: '💡', color: 'text-purple-600 bg-purple-50', label: 'Recommendation' },
};

export function TutorInsightsWidget({ className = '' }: TutorInsightsWidgetProps) {
    const { insights, insightsLoading, fetchInsights, dashboardStats, fetchDashboardStats } = useTutorStore();

    useEffect(() => {
        fetchInsights(undefined, false); // Get unresolved insights
        fetchDashboardStats();
    }, [fetchInsights, fetchDashboardStats]);

    if (insightsLoading) {
        return (
            <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    const unresolvedInsights = insights.filter((i) => !i.resolved).slice(0, 5);

    return (
        <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Learning Insights</h3>
                <span className="text-xs text-gray-500">
                    {dashboardStats?.total_sessions || 0} sessions
                </span>
            </div>

            {/* Stats Summary */}
            {dashboardStats && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded bg-gray-50">
                        <div className="text-lg font-bold text-indigo-600">{dashboardStats.total_sessions}</div>
                        <div className="text-xs text-gray-500">Sessions</div>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-50">
                        <div className="text-lg font-bold text-indigo-600">{dashboardStats.total_hints_used}</div>
                        <div className="text-xs text-gray-500">Hints</div>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-50">
                        <div className="text-lg font-bold text-indigo-600">{dashboardStats.total_messages}</div>
                        <div className="text-xs text-gray-500">Messages</div>
                    </div>
                </div>
            )}

            {/* Insights List */}
            {unresolvedInsights.length > 0 ? (
                <div className="space-y-2">
                    {unresolvedInsights.map((insight) => (
                        <InsightItem key={insight.id} insight={insight} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No learning insights yet.</p>
                    <p className="text-xs mt-1">Start a practice session with the AI Tutor to get insights!</p>
                </div>
            )}

            {/* View All Link */}
            {insights.length > 5 && (
                <div className="mt-4 text-center">
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        View all {insights.length} insights →
                    </button>
                </div>
            )}
        </div>
    );
}

interface InsightItemProps {
    insight: LearningInsight;
}

function InsightItem({ insight }: InsightItemProps) {
    const config = INSIGHT_TYPE_CONFIG[insight.insight_type];

    return (
        <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50">
            <span className="text-lg" title={config.label}>
                {config.icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{insight.description}</p>
                {insight.topic && (
                    <p className="text-xs text-gray-500 mt-0.5">{insight.topic}</p>
                )}
            </div>
            {insight.occurrence_count > 1 && (
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {insight.occurrence_count}x
                </span>
            )}
        </div>
    );
}

export default TutorInsightsWidget;
