import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionDisplay, QuestionNavigation } from './QuestionDisplay';
import type { Question } from '../../types/question';

const mockQuestion: Question = {
    id: 'test-q1',
    stem: 'A 4-month-old infant presents with failure to thrive and developmental regression.',
    options: {
        A: 'Niemann-Pick disease type A',
        B: 'Tay-Sachs disease',
        C: 'Gaucher disease type 1',
        D: 'Fabry disease',
        E: 'Krabbe disease',
    },
    correct_answer: 'B',
    difficulty: 'medium',
    category: 'Lysosomal Storage Disorders',
    created_at: '2024-01-15T10:00:00Z',
};

const mockQuestionWithSource: Question = {
    ...mockQuestion,
    source_reference: 'Nelson Textbook of Pediatrics, 21st Edition',
};

describe('QuestionDisplay', () => {
    describe('rendering', () => {
        it('renders the question stem', () => {
            render(<QuestionDisplay question={mockQuestion} />);
            expect(screen.getByText(mockQuestion.stem)).toBeInTheDocument();
        });

        it('renders difficulty badge with correct color for easy', () => {
            const easyQuestion = { ...mockQuestion, difficulty: 'easy' as const };
            render(<QuestionDisplay question={easyQuestion} />);

            const badge = screen.getByText('Easy');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('bg-green-100');
        });

        it('renders difficulty badge with correct color for medium', () => {
            render(<QuestionDisplay question={mockQuestion} />);

            const badge = screen.getByText('Medium');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('bg-yellow-100');
        });

        it('renders difficulty badge with correct color for hard', () => {
            const hardQuestion = { ...mockQuestion, difficulty: 'hard' as const };
            render(<QuestionDisplay question={hardQuestion} />);

            const badge = screen.getByText('Hard');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveClass('bg-red-100');
        });

        it('renders category badge', () => {
            render(<QuestionDisplay question={mockQuestion} />);
            expect(screen.getByText(mockQuestion.category)).toBeInTheDocument();
        });
    });

    describe('question numbering', () => {
        it('shows question number when provided', () => {
            render(<QuestionDisplay question={mockQuestion} questionNumber={1} />);
            expect(screen.getByText(/Question 1/)).toBeInTheDocument();
        });

        it('shows total questions when provided', () => {
            render(
                <QuestionDisplay
                    question={mockQuestion}
                    questionNumber={2}
                    totalQuestions={5}
                />
            );
            expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
        });

        it('does not show question number when not provided', () => {
            render(<QuestionDisplay question={mockQuestion} />);
            expect(screen.queryByText(/Question/)).not.toBeInTheDocument();
        });
    });

    describe('metadata visibility', () => {
        it('shows metadata by default', () => {
            render(<QuestionDisplay question={mockQuestion} />);
            expect(screen.getByText('Medium')).toBeInTheDocument();
            expect(screen.getByText(mockQuestion.category)).toBeInTheDocument();
        });

        it('hides metadata when showMetadata is false', () => {
            render(<QuestionDisplay question={mockQuestion} showMetadata={false} />);
            expect(screen.queryByText('Medium')).not.toBeInTheDocument();
            expect(screen.queryByText(mockQuestion.category)).not.toBeInTheDocument();
        });

        it('shows source reference when available', () => {
            render(<QuestionDisplay question={mockQuestionWithSource} />);
            expect(screen.getByText(/Nelson Textbook/)).toBeInTheDocument();
        });

        it('hides source reference when showMetadata is false', () => {
            render(
                <QuestionDisplay
                    question={mockQuestionWithSource}
                    showMetadata={false}
                />
            );
            expect(screen.queryByText(/Nelson Textbook/)).not.toBeInTheDocument();
        });
    });
});

describe('QuestionNavigation', () => {
    const defaultProps = {
        currentIndex: 0,
        totalQuestions: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onSubmit: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('previous button', () => {
        it('is disabled on first question', () => {
            render(<QuestionNavigation {...defaultProps} currentIndex={0} />);

            const prevButton = screen.getByText('Previous').closest('button');
            expect(prevButton).toBeDisabled();
        });

        it('is enabled when not on first question', () => {
            render(<QuestionNavigation {...defaultProps} currentIndex={1} />);

            const prevButton = screen.getByText('Previous').closest('button');
            expect(prevButton).not.toBeDisabled();
        });

        it('calls onPrevious when clicked', () => {
            const onPrevious = vi.fn();
            render(
                <QuestionNavigation
                    {...defaultProps}
                    currentIndex={2}
                    onPrevious={onPrevious}
                />
            );

            fireEvent.click(screen.getByText('Previous'));
            expect(onPrevious).toHaveBeenCalled();
        });

        it('is disabled when canGoBack is false', () => {
            render(
                <QuestionNavigation
                    {...defaultProps}
                    currentIndex={2}
                    canGoBack={false}
                />
            );

            const prevButton = screen.getByText('Previous').closest('button');
            expect(prevButton).toBeDisabled();
        });
    });

    describe('next button', () => {
        it('is disabled when no answer is provided', () => {
            render(<QuestionNavigation {...defaultProps} hasAnswer={false} />);

            const nextButton = screen.getByText('Next').closest('button');
            expect(nextButton).toBeDisabled();
        });

        it('is enabled when answer is provided', () => {
            render(<QuestionNavigation {...defaultProps} hasAnswer={true} />);

            const nextButton = screen.getByText('Next').closest('button');
            expect(nextButton).not.toBeDisabled();
        });

        it('calls onNext when clicked', () => {
            const onNext = vi.fn();
            render(
                <QuestionNavigation
                    {...defaultProps}
                    hasAnswer={true}
                    onNext={onNext}
                />
            );

            fireEvent.click(screen.getByText('Next'));
            expect(onNext).toHaveBeenCalled();
        });
    });

    describe('submit button', () => {
        it('shows submit button on last question', () => {
            render(
                <QuestionNavigation
                    {...defaultProps}
                    currentIndex={4}
                    isLastQuestion={true}
                />
            );

            expect(screen.getByText('Submit Session')).toBeInTheDocument();
            expect(screen.queryByText('Next')).not.toBeInTheDocument();
        });

        it('shows next button when not on last question', () => {
            render(
                <QuestionNavigation
                    {...defaultProps}
                    currentIndex={3}
                    isLastQuestion={false}
                />
            );

            expect(screen.getByText('Next')).toBeInTheDocument();
            expect(screen.queryByText('Submit Session')).not.toBeInTheDocument();
        });

        it('submit button is disabled when no answer', () => {
            render(
                <QuestionNavigation
                    {...defaultProps}
                    isLastQuestion={true}
                    hasAnswer={false}
                />
            );

            const submitButton = screen.getByText('Submit Session').closest('button');
            expect(submitButton).toBeDisabled();
        });

        it('submit button calls onSubmit when clicked', () => {
            const onSubmit = vi.fn();
            render(
                <QuestionNavigation
                    {...defaultProps}
                    isLastQuestion={true}
                    hasAnswer={true}
                    onSubmit={onSubmit}
                />
            );

            fireEvent.click(screen.getByText('Submit Session'));
            expect(onSubmit).toHaveBeenCalled();
        });
    });

    describe('progress indicator', () => {
        it('shows correct number of dots', () => {
            render(<QuestionNavigation {...defaultProps} totalQuestions={5} />);

            // Check for progress dots - they're divs with specific classes
            const container = screen.getByText('Previous').parentElement;
            const dots = container?.querySelectorAll('.rounded-full');
            expect(dots?.length).toBe(5);
        });

        it('highlights current question dot', () => {
            render(<QuestionNavigation {...defaultProps} currentIndex={2} totalQuestions={5} />);

            const container = screen.getByText('Previous').parentElement;
            const dots = container?.querySelectorAll('.rounded-full');

            // Third dot should be highlighted (index 2)
            expect(dots?.[2]).toHaveClass('bg-primary-500');
            // First dot should not be highlighted
            expect(dots?.[0]).toHaveClass('bg-gray-300');
        });
    });
});
