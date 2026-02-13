/**
 * PlanCalendar - Calendar view of study plan tasks.
 */
import { useState } from 'react';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import type { CalendarMonth, CalendarDay } from '../../types/studyPlan';

interface PlanCalendarProps {
    calendar: CalendarMonth;
    onDayClick?: (date: string) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_LABELS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const statusColors: Record<string, string> = {
    empty: 'bg-gray-50 text-gray-400',
    pending: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-orange-100 text-orange-800',
    complete: 'bg-green-100 text-green-800',
};

export function PlanCalendar({ calendar, onDayClick }: PlanCalendarProps) {
    const [currentYear, setCurrentYear] = useState(calendar.year);
    const [currentMonth, setCurrentMonth] = useState(calendar.month);

    const today = new Date();
    // Use local date formatting to match the dateStr format used in the calendar grid
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Create a map of date -> CalendarDay for quick lookup
    const dayMap = new Map<string, CalendarDay>();
    calendar.days.forEach((day) => {
        dayMap.set(day.date, day);
    });

    // Get the first day of the month and total days
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Generate calendar grid
    const weeks: (CalendarDay | null)[][] = [];
    let currentWeek: (CalendarDay | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        currentWeek.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = dayMap.get(dateStr);

        if (dayData) {
            currentWeek.push(dayData);
        } else {
            // Create a placeholder for days without tasks
            currentWeek.push({
                date: dateStr,
                tasks: [],
                total_target: 0,
                total_completed: 0,
                status: 'empty',
            });
        }

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    // Add empty cells for remaining days
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    const goToPreviousMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(currentYear - 1);
            setCurrentMonth(12);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(currentYear + 1);
            setCurrentMonth(1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth() + 1);
    };

    const handleDayClick = (day: CalendarDay | null) => {
        if (day && onDayClick) {
            onDayClick(day.date);
        }
    };

    // Calculate summary stats
    const totalTasks = calendar.days.reduce((sum, d) => sum + d.total_target, 0);
    const completedTasks = calendar.days.reduce((sum, d) => sum + d.total_completed, 0);
    const completeDays = calendar.days.filter((d) => d.status === 'complete').length;
    const totalDaysWithTasks = calendar.days.filter((d) => d.status !== 'empty').length;

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <Card>
                <CardBody>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-primary-600">
                                {completedTasks}/{totalTasks}
                            </div>
                            <div className="text-sm text-gray-500">Tasks Completed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {completeDays}
                            </div>
                            <div className="text-sm text-gray-500">Complete Days</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                {totalDaysWithTasks}
                            </div>
                            <div className="text-sm text-gray-500">Active Days</div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Calendar */}
            <Card>
                <CardBody>
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                            ← Prev
                        </Button>
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {MONTH_LABELS[currentMonth - 1]} {currentYear}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={goToToday}>
                                Today
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={goToNextMonth}>
                            Next →
                        </Button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {WEEKDAY_LABELS.map((day) => (
                            <div
                                key={day}
                                className="text-center text-xs font-medium text-gray-500 py-2"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {weeks.flat().map((day, index) => {
                            if (!day) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="aspect-square p-1"
                                    />
                                );
                            }

                            const isToday = day.date === todayStr;
                            const hasTasks = day.status !== 'empty';

                            return (
                                <button
                                    key={day.date}
                                    onClick={() => handleDayClick(day)}
                                    disabled={!hasTasks}
                                    className={`aspect-square p-1 rounded-lg text-sm transition-colors ${isToday
                                        ? 'ring-2 ring-primary-500 ring-offset-1'
                                        : ''
                                        } ${hasTasks
                                            ? statusColors[day.status] + ' hover:opacity-80 cursor-pointer'
                                            : 'text-gray-400 cursor-default'
                                        }`}
                                    title={
                                        hasTasks
                                            ? `${day.total_completed}/${day.total_target} tasks`
                                            : 'No tasks'
                                    }
                                >
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <span className="font-medium">
                                            {new Date(day.date).getDate()}
                                        </span>
                                        {hasTasks && (
                                            <span className="text-xs opacity-75">
                                                {day.total_completed}/{day.total_target}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-yellow-100" />
                            <span className="text-xs text-gray-500">Pending</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-orange-100" />
                            <span className="text-xs text-gray-500">Partial</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-green-100" />
                            <span className="text-xs text-gray-500">Complete</span>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

export default PlanCalendar;
