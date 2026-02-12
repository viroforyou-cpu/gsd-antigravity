import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssociationView } from './AssociationView';
import { HypotheticoView } from './HypotheticoView';
import { ConstraintsView } from './ConstraintsView';
import { ArgumentsView } from './ArgumentsView';
import type {
    AssociationReasoning,
    HypotheticoReasoning,
    ConstraintReasoning,
    ArgumentReasoning,
    AllReasoningResult,
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
        {
            step_number: 2,
            description: 'Map findings to conditions',
            supports: ['B'],
            opposes: ['A'],
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
        {
            condition: 'Niemann-Pick type A',
            strength: 0.45,
            matching_findings: ['cherry-red spot'],
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
        {
            step_number: 2,
            description: 'Test hypotheses against evidence',
            supports: ['B'],
        },
    ],
    conclusion: 'Tay-Sachs hypothesis verified.',
    confidence: 0.95,
    correct_option: 'B',
    hypotheses: [
        {
            option: 'A',
            hypothesis: 'If Niemann-Pick, expect hepatosplenomegaly',
            predictions: ['Hepatosplenomegaly', 'Normal hex A'],
            verified: false,
            falsified: true,
        },
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
            description: 'Apply constraint of absent hex A',
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
        {
            finding: 'No hepatosplenomegaly',
            eliminates: ['A'],
            reason: 'Niemann-Pick typically has organomegaly',
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
            description: 'Build arguments for each option',
            supports: ['B'],
        },
    ],
    conclusion: 'Tay-Sachs has the strongest argument.',
    confidence: 0.97,
    correct_option: 'B',
    arguments: [
        {
            option: 'A',
            pros: ['Can present with cherry-red spot'],
            cons: ['Hepatosplenomegaly expected', 'Normal hex A expected'],
            net_score: -1,
        },
        {
            option: 'B',
            pros: ['Absent hex A is diagnostic', 'Cherry-red spot classic'],
            cons: [],
            net_score: 5,
        },
    ],
};

describe('AssociationView', () => {
    it('renders the component header', () => {
        render(
            <AssociationView reasoning={mockAssociationReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Association Reasoning')).toBeInTheDocument();
    });

    it('renders key findings', () => {
        render(
            <AssociationView reasoning={mockAssociationReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Absent hexosaminidase A')).toBeInTheDocument();
        expect(screen.getByText('Cherry-red spot')).toBeInTheDocument();
    });

    it('renders reasoning steps', () => {
        render(
            <AssociationView reasoning={mockAssociationReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Identify key clinical findings')).toBeInTheDocument();
        expect(screen.getByText('Map findings to conditions')).toBeInTheDocument();
    });

    it('renders supports tags', () => {
        render(
            <AssociationView reasoning={mockAssociationReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Supports B')).toBeInTheDocument();
    });

    it('renders linked conditions', () => {
        render(
            <AssociationView reasoning={mockAssociationReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Tay-Sachs disease')).toBeInTheDocument();
        expect(screen.getByText('Niemann-Pick type A')).toBeInTheDocument();
    });

    it('renders conclusion', () => {
        render(
            <AssociationView reasoning={mockAssociationReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Tay-Sachs disease is the most likely diagnosis.')).toBeInTheDocument();
    });

    it('shows error for wrong reasoning type', () => {
        const wrongReasoning = { strategy: 'hypothetico' } as AllReasoningResult;
        render(<AssociationView reasoning={wrongReasoning} correctAnswer="B" />);

        expect(screen.getByText(/Invalid reasoning type/)).toBeInTheDocument();
    });
});

describe('HypotheticoView', () => {
    it('renders the component header', () => {
        render(
            <HypotheticoView reasoning={mockHypotheticoReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Hypothetico-Deductive Reasoning')).toBeInTheDocument();
    });

    it('renders reasoning steps', () => {
        render(
            <HypotheticoView reasoning={mockHypotheticoReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Formulate hypotheses')).toBeInTheDocument();
        expect(screen.getByText('Test hypotheses against evidence')).toBeInTheDocument();
    });

    it('renders hypotheses', () => {
        render(
            <HypotheticoView reasoning={mockHypotheticoReasoning} correctAnswer="B" />
        );

        expect(screen.getByText(/If Niemann-Pick/)).toBeInTheDocument();
        expect(screen.getByText(/If Tay-Sachs/)).toBeInTheDocument();
    });

    it('renders conclusion', () => {
        render(
            <HypotheticoView reasoning={mockHypotheticoReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Tay-Sachs hypothesis verified.')).toBeInTheDocument();
    });

    it('shows error for wrong reasoning type', () => {
        const wrongReasoning = { strategy: 'association' } as AllReasoningResult;
        render(<HypotheticoView reasoning={wrongReasoning} correctAnswer="B" />);

        expect(screen.getByText(/Invalid reasoning type/)).toBeInTheDocument();
    });
});

describe('ConstraintsView', () => {
    it('renders the component header', () => {
        render(
            <ConstraintsView reasoning={mockConstraintReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Constraint Satisfaction')).toBeInTheDocument();
    });

    it('renders initial options display', () => {
        render(
            <ConstraintsView reasoning={mockConstraintReasoning} correctAnswer="B" />
        );

        expect(screen.getByText(/Starting: 5 possible diagnoses/)).toBeInTheDocument();
    });

    it('renders constraint findings', () => {
        render(
            <ConstraintsView reasoning={mockConstraintReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Absent hexosaminidase A')).toBeInTheDocument();
        expect(screen.getByText('No hepatosplenomegaly')).toBeInTheDocument();
    });

    it('renders conclusion', () => {
        render(
            <ConstraintsView reasoning={mockConstraintReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Only Tay-Sachs satisfies all constraints.')).toBeInTheDocument();
    });

    it('shows error for wrong reasoning type', () => {
        const wrongReasoning = { strategy: 'association' } as AllReasoningResult;
        render(<ConstraintsView reasoning={wrongReasoning} correctAnswer="B" />);

        expect(screen.getByText(/Invalid reasoning type/)).toBeInTheDocument();
    });
});

describe('ArgumentsView', () => {
    it('renders the component header', () => {
        render(
            <ArgumentsView reasoning={mockArgumentReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Argument-Based Reasoning')).toBeInTheDocument();
    });

    it('renders analysis steps', () => {
        render(
            <ArgumentsView reasoning={mockArgumentReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Build arguments for each option')).toBeInTheDocument();
    });

    it('renders pros for each option', () => {
        render(
            <ArgumentsView reasoning={mockArgumentReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Absent hex A is diagnostic')).toBeInTheDocument();
        expect(screen.getByText('Cherry-red spot classic')).toBeInTheDocument();
    });

    it('renders cons for each option', () => {
        render(
            <ArgumentsView reasoning={mockArgumentReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Hepatosplenomegaly expected')).toBeInTheDocument();
        expect(screen.getByText('Normal hex A expected')).toBeInTheDocument();
    });

    it('renders conclusion', () => {
        render(
            <ArgumentsView reasoning={mockArgumentReasoning} correctAnswer="B" />
        );

        expect(screen.getByText('Tay-Sachs has the strongest argument.')).toBeInTheDocument();
    });

    it('shows error for wrong reasoning type', () => {
        const wrongReasoning = { strategy: 'association' } as AllReasoningResult;
        render(<ArgumentsView reasoning={wrongReasoning} correctAnswer="B" />);

        expect(screen.getByText(/Invalid reasoning type/)).toBeInTheDocument();
    });
});
