export interface QuestionOptions {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
}

export type AnswerKey = 'A' | 'B' | 'C' | 'D' | 'E';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionCategory =
    | 'Lysosomal Storage Disorders'
    | 'Muscular Disorders'
    | 'Organic Acidemias'
    | 'Neural Tube Defects'
    | 'Chromosomal Disorders'
    | 'Imprinting Disorders'
    | 'Neurocutaneous Disorders'
    | 'Inflammatory Myopathies';

export interface Question {
    id: string;
    stem: string;
    options: QuestionOptions;
    correct_answer: AnswerKey;
    difficulty: QuestionDifficulty;
    category: QuestionCategory;
    source_reference?: string;
    created_at: string;
}

export interface QuestionWithUserAnswer extends Question {
    user_answer?: AnswerKey;
    is_correct?: boolean;
}
