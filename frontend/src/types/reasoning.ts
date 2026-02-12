export type ReasoningStrategy = 'association' | 'hypothetico' | 'constraints' | 'arguments';

export interface ReasoningStep {
    step_number: number;
    description: string;
    evidence?: string[];
    supports?: string[];  // option IDs supported (e.g., 'A', 'B')
    opposes?: string[];   // option IDs opposed
}

export interface ReasoningResult {
    strategy: ReasoningStrategy;
    question_id: string;
    steps: ReasoningStep[];
    conclusion: string;
    confidence: number;
    correct_option: string;
}

// Association reasoning - uses knowledge graph connections
export interface AssociationReasoning extends ReasoningResult {
    strategy: 'association';
    key_findings: string[];
    linked_conditions: Array<{
        condition: string;
        strength: number;
        matching_findings: string[];
    }>;
}

// Hypothetico-deductive reasoning - hypothesis testing approach
export interface HypotheticoReasoning extends ReasoningResult {
    strategy: 'hypothetico';
    hypotheses: Array<{
        option: string;
        hypothesis: string;
        predictions: string[];
        verified: boolean;
        falsified: boolean;
    }>;
}

// Constraint satisfaction - elimination approach
export interface ConstraintReasoning extends ReasoningResult {
    strategy: 'constraints';
    constraints: Array<{
        finding: string;
        eliminates: string[];  // options eliminated by this finding
        reason: string;
    }>;
    remaining_options: string[];
}

// Argument-based reasoning - pros/cons for each option
export interface ArgumentReasoning extends ReasoningResult {
    strategy: 'arguments';
    arguments: Array<{
        option: string;
        pros: string[];
        cons: string[];
        net_score: number;
    }>;
}

export type AllReasoningResult = AssociationReasoning | HypotheticoReasoning | ConstraintReasoning | ArgumentReasoning;
