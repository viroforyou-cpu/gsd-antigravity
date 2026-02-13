/**
 * Tests for Study Plan Components
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StudyPlanCard } from './StudyPlanCard';
import { MilestoneTracker } from './MilestoneTracker';
import { DailyTaskList } from './DailyTaskList';
import { PlanCalendar } from './PlanCalendar';
import type { StudyPlanSummary, Milestone, DailyTask, CalendarMonth } from '../../types/studyPlan';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Test wrapper
const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>{children}</BrowserRouter>
    );
};

describe('StudyPlanCard', () => {
    const mockPlan: StudyPlanSummary = {
        id: 'plan-1',
        user_id: 'user-1',
        name: 'Board Exam Prep',
        description: 'Prepare for genetics board exam',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const mockProgress = {
        overall_progress: 45,
        completed_milestones: 2,
        total_milestones: 5,
    };

    it('renders plan name and status', () => {
        render(<StudyPlanCard plan={mockPlan} />, { wrapper: createWrapper() });

        expect(screen.getByText('Board Exam Prep')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(<StudyPlanCard plan={mockPlan} />, { wrapper: createWrapper() });

        expect(screen.getByText('Prepare for genetics board exam')).toBeInTheDocument();
    });

    it('renders progress bar when progress provided', () => {
        render(<StudyPlanCard plan={mockPlan} progress={mockProgress} />, {
            wrapper: createWrapper(),
        });

        expect(screen.getByText('45%')).toBeInTheDocument();
        expect(screen.getByText('2/5 milestones')).toBeInTheDocument();
    });

    it('calls onDelete when delete button clicked', () => {
        const mockDelete = vi.fn();
        render(<StudyPlanCard plan={mockPlan} onDelete={mockDelete} />, {
            wrapper: createWrapper(),
        });

        fireEvent.click(screen.getByTitle('Delete plan'));
        expect(mockDelete).toHaveBeenCalledWith('plan-1');
    });

    it('calls onStatusChange when pause button clicked', () => {
        const mockStatusChange = vi.fn();
        render(<StudyPlanCard plan={mockPlan} onStatusChange={mockStatusChange} />, {
            wrapper: createWrapper(),
        });

        fireEvent.click(screen.getByTitle('Pause plan'));
        expect(mockStatusChange).toHaveBeenCalledWith('plan-1', 'paused');
    });

    it('shows resume button for paused plans', () => {
        const pausedPlan = { ...mockPlan, status: 'paused' as const };
        const mockStatusChange = vi.fn();

        render(<StudyPlanCard plan={pausedPlan} onStatusChange={mockStatusChange} />, {
            wrapper: createWrapper(),
        });

        fireEvent.click(screen.getByTitle('Resume plan'));
        expect(mockStatusChange).toHaveBeenCalledWith('plan-1', 'active');
    });

    it('shows overdue warning for past target dates', () => {
        const overduePlan = {
            ...mockPlan,
            target_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        };

        render(<StudyPlanCard plan={overduePlan} />, { wrapper: createWrapper() });

        expect(screen.getByText(/days overdue/)).toBeInTheDocument();
    });
});

describe('MilestoneTracker', () => {
    const mockMilestones: Milestone[] = [
        {
            id: 'm1',
            plan_id: 'plan-1',
            title: 'Complete Chapter 1',
            description: 'Read and understand basics',
            target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            order_index: 0,
            created_at: new Date().toISOString(),
        },
        {
            id: 'm2',
            plan_id: 'plan-1',
            title: 'Practice Questions',
            description: 'Complete 50 questions',
            target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            order_index: 1,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        },
    ];

    it('renders milestones list', () => {
        render(<MilestoneTracker milestones={mockMilestones} onComplete={vi.fn()} />, {
            wrapper: createWrapper(),
        });

        expect(screen.getByText('Complete Chapter 1')).toBeInTheDocument();
        expect(screen.getByText('Practice Questions')).toBeInTheDocument();
    });

    it('shows completion status', () => {
        render(<MilestoneTracker milestones={mockMilestones} onComplete={vi.fn()} />, {
            wrapper: createWrapper(),
        });

        expect(screen.getByText('1/2 completed')).toBeInTheDocument();
    });

    it('calls onComplete when complete button clicked', () => {
        const mockComplete = vi.fn();
        render(<MilestoneTracker milestones={mockMilestones} onComplete={mockComplete} />, {
            wrapper: createWrapper(),
        });

        fireEvent.click(screen.getByText('Complete'));
        expect(mockComplete).toHaveBeenCalledWith('m1');
    });

    it('shows empty state when no milestones', () => {
        render(<MilestoneTracker milestones={[]} onComplete={vi.fn()} />, {
            wrapper: createWrapper(),
        });

        expect(screen.getByText('No Milestones')).toBeInTheDocument();
    });

    it('shows overdue status for past target dates', () => {
        const overdueMilestones: Milestone[] = [
            {
                ...mockMilestones[0],
                target_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ];

        render(<MilestoneTracker milestones={overdueMilestones} onComplete={vi.fn()} />, {
            wrapper: createWrapper(),
        });

        // The milestone should have red styling - check for the red background class
        // The h4 title is inside nested divs, need to traverse up to the milestone container
        const milestoneTitle = screen.getByText('Complete Chapter 1');
        // Go up: h4 -> div -> div -> div (flex-1) -> div (container with bg-red-50)
        const milestoneContainer = milestoneTitle.parentElement?.parentElement?.parentElement?.parentElement;
        expect(milestoneContainer?.className).toMatch(/bg-red-50/);
    });
});

describe('DailyTaskList', () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const mockTasks: DailyTask[] = [
        {
            id: 't1',
            plan_id: 'plan-1',
            date: today,
            task_type: 'practice_questions',
            target_count: 10,
            completed_count: 5,
            status: 'pending',
            created_at: new Date().toISOString(),
        },
        {
            id: 't2',
            plan_id: 'plan-1',
            date: tomorrow,
            task_type: 'review_srs',
            target_count: 5,
            completed_count: 5,
            status: 'completed',
            created_at: new Date().toISOString(),
        },
    ];

    it('renders tasks grouped by date', () => {
        render(<DailyTaskList tasks={mockTasks} onIncrement={vi.fn()} planStatus="active" />, {
            wrapper: createWrapper(),
        });

        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('Practice Questions')).toBeInTheDocument();
    });

    it('shows task progress', () => {
        render(<DailyTaskList tasks={mockTasks} onIncrement={vi.fn()} planStatus="active" />, {
            wrapper: createWrapper(),
        });

        expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('calls onIncrement when +1 button clicked', () => {
        const mockIncrement = vi.fn();
        render(<DailyTaskList tasks={mockTasks} onIncrement={mockIncrement} planStatus="active" />, {
            wrapper: createWrapper(),
        });

        fireEvent.click(screen.getByText('+1'));
        expect(mockIncrement).toHaveBeenCalledWith('t1');
    });

    it('filters tasks by status', () => {
        render(<DailyTaskList tasks={mockTasks} onIncrement={vi.fn()} planStatus="active" />, {
            wrapper: createWrapper(),
        });

        // Click completed filter button (use getAllByText and select the button)
        const completedButtons = screen.getAllByText(/Completed/);
        const filterButton = completedButtons.find(el => el.tagName === 'BUTTON');
        fireEvent.click(filterButton!);

        expect(screen.getByText('Spaced Repetition')).toBeInTheDocument();
        expect(screen.queryByText('Practice Questions')).not.toBeInTheDocument();
    });

    it('shows empty state when no tasks', () => {
        render(<DailyTaskList tasks={[]} onIncrement={vi.fn()} planStatus="active" />, {
            wrapper: createWrapper(),
        });

        expect(screen.getByText('No Tasks Found')).toBeInTheDocument();
    });

    it('disables increment for completed tasks', () => {
        render(<DailyTaskList tasks={mockTasks} onIncrement={vi.fn()} planStatus="active" />, {
            wrapper: createWrapper(),
        });

        // The completed task should not have a +1 button
        const buttons = screen.queryAllByText('+1');
        expect(buttons).toHaveLength(1); // Only the pending task has the button
    });
});

describe('PlanCalendar', () => {
    const today = new Date();
    // Use local date format to match component behavior
    const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = formatLocalDate(today);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowStr = formatLocalDate(tomorrow);

    const mockCalendar: CalendarMonth = {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        days: [
            {
                date: todayStr,
                tasks: [],
                total_target: 10,
                total_completed: 10,
                status: 'complete',
            },
            {
                date: tomorrowStr,
                tasks: [],
                total_target: 10,
                total_completed: 5,
                status: 'partial',
            },
        ],
    };

    it('renders calendar with correct month/year', () => {
        render(<PlanCalendar calendar={mockCalendar} />, { wrapper: createWrapper() });

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        expect(screen.getByText(new RegExp(monthNames[today.getMonth()]))).toBeInTheDocument();
    });

    it('shows summary stats', () => {
        render(<PlanCalendar calendar={mockCalendar} />, { wrapper: createWrapper() });

        expect(screen.getByText('Tasks Completed')).toBeInTheDocument();
        expect(screen.getByText('Complete Days')).toBeInTheDocument();
    });

    it('calls onDayClick when day is clicked', () => {
        const mockDayClick = vi.fn();
        render(<PlanCalendar calendar={mockCalendar} onDayClick={mockDayClick} />, {
            wrapper: createWrapper(),
        });

        // Find a day with tasks and click it
        const todayElement = screen.getByTitle('10/10 tasks');
        fireEvent.click(todayElement);

        expect(mockDayClick).toHaveBeenCalled();
    });

    it('navigates between months', () => {
        render(<PlanCalendar calendar={mockCalendar} />, { wrapper: createWrapper() });

        fireEvent.click(screen.getByText('← Prev'));
        // Should show previous month

        fireEvent.click(screen.getByText('Next →'));
        // Should show next month
    });

    it('highlights today', () => {
        render(<PlanCalendar calendar={mockCalendar} />, { wrapper: createWrapper() });

        // Today should have a ring class - find the button with today's date that has tasks
        const todayButton = screen.getByTitle('10/10 tasks');
        expect(todayButton.className).toContain('ring');
    });
});
