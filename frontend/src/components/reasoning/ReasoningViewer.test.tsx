import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReasoningViewer } from './ReasoningViewer';
import type {
    AssociationReasoning,
    HypotheticoReasoning,
    ConstraintReasoning,
    ArgumentReasoning,
} from '../../types/reasoning';

const mockAssociationReasoning: AssociationReasoning = {
    strategy: 'association',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Identify key clinical findings',
            evidence: ['cherry-red spot', 'absent hex A'],
        },
    ],
    conclusion: 'Tay-Sachs disease is the most likely diagnosis.',
    confidence: 0.98,
    correct_option: 'B',
    key_findings: ['Absent hexosaminidase A', 'Cherry-red spot'],
    linked_conditions: [
        {
            condition: 'Tay-Sachs disease',
            strength: 0.98,
            matching_findings: ['cherry-red spot', 'absent hex A'],
        },
    ],
};

const mockHypotheticoReasoning: HypotheticoReasoning = {
    strategy: 'hypothetico',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Formulate hypotheses',
        },
    ],
    conclusion: 'Tay-Sachs hypothesis verified.',
    confidence: 0.95,
    correct_option: 'B',
    hypotheses: [
        {
            option: 'B',
            hypothesis: 'If Tay-Sachs, expect absent hex A',
            predictions: ['Absent hex A', 'Cherry-red spot'],
            verified: true,
            falsified: false,
        },
    ],
};

const mockConstraintReasoning: ConstraintReasoning = {
    strategy: 'constraints',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Apply constraints',
            supports: ['B'],
        },
    ],
    conclusion: 'Only Tay-Sachs satisfies all constraints.',
    confidence: 0.99,
    correct_option: 'B',
    constraints: [
        {
            finding: 'Absent hexosaminidase A',
            eliminates: ['A', 'C', 'D', 'E'],
            reason: 'Other conditions have normal hex A',
        },
    ],
    remaining_options: ['B'],
};

const mockArgumentReasoning: ArgumentReasoning = {
    strategy: 'arguments',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Build arguments',
            supports: ['B'],
        },
    ],
    conclusion: 'Tay-Sachs has the strongest argument.',
    confidence: 0.97,
    correct_option: 'B',
    arguments: [
        {
            option: 'B',
            pros: ['Absent hex A is diagnostic'],
            cons: [],
            net_score: 5,
        },
    ],
};

const mockReasoning = {
    association: mockAssociationReasoning,
    hypothetico: mockHypotheticoReasoning,
    constraints: mockConstraintReasoning,
    arguments: mockArgumentReasoning,
};

describe('ReasoningViewer', () => {
    describe('rendering', () => {
        it('renders all tab buttons', () => {
            render(<ReasoningViewer reasoning={mockReasoning} correctAnswer="B" />);

            expect(screen.getByText('Association')).toBeInTheDocument();
            expect(screen.getByText('Hypothesis Testing')).toBeInTheDocument();
            expect(screen.getByText('Constraints')).toBeInTheDocument();
            expect(screen.getByText('Arguments')).toBeInTheDocument();
        });

        it('renders tab descriptions', () => {
            render(<ReasoningViewer reasoning={mockReasoning} correctAnswer="B" />);

            expect(screen.getByText('Knowledge graph connections')).toBeInTheDocument();
            expect(screen.getByText('Verify/falsify diagnoses')).toBeInTheDocument();
            expect(screen.getByText('Elimination approach')).toBeInTheDocument();
            expect(screen.getByText('Pros and cons analysis')).toBeInTheDocument();
        });

        it('shows association view by default', () => {
            render(<ReasoningViewer reasoning={mockReasoning} correctAnswer="B" />);

            expect(screen.getByText('Association Reasoning')).toBeInTheDocument();
        });
    });

    describe('tab navigation', () => {
        it('switches to hypothetico view when tab is clicked', () => {
            render(<ReasoningViewer reasoning={mockReasoning} correctAnswer="B" />);

            fireEvent.click(screen.getByText('Hypothesis Testing'));
            expect(screen.getByText('Hypothetico-Deductive Reasoning')).toBeInTheDocument();
        });

        it('switches to constraints view when tab is clicked', () => {
            render(<ReasoningViewer reasoning={mockReasoning} correctAnswer="B" />);

            fireEvent.click(screen.getByText('Constraints'));
            expect(screen.getByText('Constraint Satisfaction')).toBeInTheDocument();
        });

        it('switches to arguments view when tab is clicked', () => {
            render(<ReasoningViewer reasoning={mockReasoning} correctAnswer="B" />);

            fireEvent.click(screen.getByText('Arguments'));
            expect(screen.getByText('Argument-Based Reasoning')).toBeInTheDocument();
        });

        it('highlights active tab', () => {
            render(<ReasoningViewer reasoning={mockReasoning} correctAnswer="B" />);

            const associationTab = screen.getByText('Association').closest('button');
            expect(associationTab).toHaveClass('border-primary-500');

            fireEvent.click(screen.getByText('Constraints'));
            const constraintsTab = screen.getByText('Constraints').closest('button');
            expect(constraintsTab).toHaveClass('border-primary-500');
        });
    });

    describe('missing reasoning data', () => {
        it('shows no data message when association reasoning is missing', () => {
            render(
                <ReasoningViewer
                    reasoning={{ ...mockReasoning, association: undefined }}
                    correctAnswer="B"
                />
            );

            expect(screen.getByText(/No association reasoning data available/)).toBeInTheDocument();
        });

        it('shows no data message when hypothetico reasoning is missing', () => {
            render(
                <ReasoningViewer
                    reasoning={{ ...mockReasoning, hypothetico: undefined }}
                    correctAnswer="B"
                />
            );

            fireEvent.click(screen.getByText('Hypothesis Testing'));
            expect(screen.getByText(/No hypothetico reasoning data available/)).toBeInTheDocument();
        });

        it('shows no data message when constraints reasoning is missing', () => {
            render(
                <ReasoningViewer
                    reasoning={{ ...mockReasoning, constraints: undefined }}
                    correctAnswer="B"
                />
            );

            fireEvent.click(screen.getByText('Constraints'));
            expect(screen.getByText(/No constraints reasoning data available/)).toBeInTheDocument();
        });

        it('shows no data message when arguments reasoning is missing', () => {
            render(
                <ReasoningViewer
                    reasoning={{ ...mockReasoning, arguments: undefined }}
                    correctAnswer="B"
                />
            );

            fireEvent.click(screen.getByText('Arguments'));
            expect(screen.getByText(/No arguments reasoning data available/)).toBeInTheDocument();
        });
    });
});
