import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OptionSelector, AnswerFeedback } from './OptionSelector';
import type { Question } from '../../types/question';

const mockQuestion: Question = {
    id: 'test-q1',
    stem: 'A 4-month-old infant presents with failure to thrive.',
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

describe('OptionSelector', () => {
    describe('rendering', () => {
        it('renders all options', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    onAnswerSelect={vi.fn()}
                />
            );

            // OptionButton renders key and text separately
            expect(screen.getByText('Niemann-Pick disease type A')).toBeInTheDocument();
            expect(screen.getByText('Tay-Sachs disease')).toBeInTheDocument();
            expect(screen.getByText('Gaucher disease type 1')).toBeInTheDocument();
            expect(screen.getByText('Fabry disease')).toBeInTheDocument();
            expect(screen.getByText('Krabbe disease')).toBeInTheDocument();
        });

        it('renders all option keys', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    onAnswerSelect={vi.fn()}
                />
            );

            ['A', 'B', 'C', 'D', 'E'].forEach((key) => {
                expect(screen.getByText(key)).toBeInTheDocument();
            });
        });
    });

    describe('selection', () => {
        it('highlights selected answer', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    selectedAnswer="B"
                    onAnswerSelect={vi.fn()}
                />
            );

            // The selected option should have different styling
            const optionB = screen.getByText('B').closest('button');
            expect(optionB).toHaveClass('border-primary-500');
        });

        it('does not highlight unselected options', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    selectedAnswer="B"
                    onAnswerSelect={vi.fn()}
                />
            );

            const optionA = screen.getByText('A').closest('button');
            expect(optionA).not.toHaveClass('border-primary-500');
        });
    });

    describe('interaction', () => {
        it('calls onAnswerSelect when option is clicked', () => {
            const onAnswerSelect = vi.fn();
            render(
                <OptionSelector
                    question={mockQuestion}
                    onAnswerSelect={onAnswerSelect}
                />
            );

            // Click on the option text
            fireEvent.click(screen.getByText('Tay-Sachs disease'));
            expect(onAnswerSelect).toHaveBeenCalledWith('B');
        });

        it('does not call onAnswerSelect when disabled', () => {
            const onAnswerSelect = vi.fn();
            render(
                <OptionSelector
                    question={mockQuestion}
                    onAnswerSelect={onAnswerSelect}
                    disabled={true}
                />
            );

            // When disabled, clicking should not trigger the callback
            const optionText = screen.getByText('Tay-Sachs disease');
            fireEvent.click(optionText);
            expect(onAnswerSelect).not.toHaveBeenCalled();
        });
    });

    describe('showing correct answer', () => {
        it('shows correct answer when showCorrectAnswer is true', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    selectedAnswer="A"
                    onAnswerSelect={vi.fn()}
                    showCorrectAnswer={true}
                />
            );

            // Correct answer (B) should have green styling
            const correctOption = screen.getByText('B').closest('button');
            expect(correctOption).toHaveClass('border-green-500');
        });

        it('shows incorrect answer styling when wrong answer selected', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    selectedAnswer="A"
                    onAnswerSelect={vi.fn()}
                    showCorrectAnswer={true}
                />
            );

            // Wrong answer (A) should have red styling
            const wrongOption = screen.getByText('A').closest('button');
            expect(wrongOption).toHaveClass('border-red-500');
        });

        it('does not show result styling when showCorrectAnswer is false', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    selectedAnswer="A"
                    onAnswerSelect={vi.fn()}
                    showCorrectAnswer={false}
                />
            );

            const optionA = screen.getByText('A').closest('button');
            expect(optionA).not.toHaveClass('border-green-500');
            expect(optionA).not.toHaveClass('border-red-500');
        });
    });

    describe('keyboard navigation', () => {
        it('options are focusable', () => {
            render(
                <OptionSelector
                    question={mockQuestion}
                    onAnswerSelect={vi.fn()}
                />
            );

            const optionA = screen.getByText('A').closest('button');
            expect(optionA).not.toHaveAttribute('tabindex', '-1');
        });
    });
});

describe('AnswerFeedback', () => {
    describe('correct answer', () => {
        it('shows correct message', () => {
            render(
                <AnswerFeedback
                    isCorrect={true}
                    correctAnswer="B"
                />
            );

            expect(screen.getByText('Correct!')).toBeInTheDocument();
        });

        it('has green styling', () => {
            const { container } = render(
                <AnswerFeedback
                    isCorrect={true}
                    correctAnswer="B"
                />
            );

            const feedbackDiv = container.firstChild as HTMLElement;
            expect(feedbackDiv).toHaveClass('bg-green-50');
            expect(feedbackDiv).toHaveClass('border-green-200');
        });

        it('shows checkmark icon', () => {
            const { container } = render(
                <AnswerFeedback
                    isCorrect={true}
                    correctAnswer="B"
                />
            );

            const svg = container.querySelector('svg');
            expect(svg).toHaveClass('text-green-500');
        });
    });

    describe('incorrect answer', () => {
        it('shows incorrect message with correct answer', () => {
            render(
                <AnswerFeedback
                    isCorrect={false}
                    correctAnswer="B"
                />
            );

            expect(screen.getByText('Incorrect. The correct answer is B.')).toBeInTheDocument();
        });

        it('has red styling', () => {
            const { container } = render(
                <AnswerFeedback
                    isCorrect={false}
                    correctAnswer="B"
                />
            );

            const feedbackDiv = container.firstChild as HTMLElement;
            expect(feedbackDiv).toHaveClass('bg-red-50');
            expect(feedbackDiv).toHaveClass('border-red-200');
        });

        it('shows X icon', () => {
            const { container } = render(
                <AnswerFeedback
                    isCorrect={false}
                    correctAnswer="B"
                />
            );

            const svg = container.querySelector('svg');
            expect(svg).toHaveClass('text-red-500');
        });
    });

    describe('explanation', () => {
        it('shows explanation when provided', () => {
            render(
                <AnswerFeedback
                    isCorrect={true}
                    correctAnswer="B"
                    explanation="Tay-Sachs is caused by hexosaminidase A deficiency."
                />
            );

            expect(
                screen.getByText('Tay-Sachs is caused by hexosaminidase A deficiency.')
            ).toBeInTheDocument();
        });

        it('does not show explanation when not provided', () => {
            render(
                <AnswerFeedback
                    isCorrect={true}
                    correctAnswer="B"
                />
            );

            // Should only have the "Correct!" text, no explanation
            const feedbackContainer = screen.getByText('Correct!').parentElement;
            expect(feedbackContainer?.children.length).toBe(1);
        });
    });
});
