/**
 * LLM Service - handles all LLM API interactions for question and reasoning generation.
 */
import api from './api';
import type { Question } from '../types/question';

export interface GenerateQuestionRequest {
    category: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    topic_hints?: string[];
}

export interface GenerateReasoningRequest {
    question: Question;
    strategy: 'association' | 'hypothetico' | 'constraints' | 'arguments';
}

export interface GenerateExplanationRequest {
    question: Question;
    correct_answer: string;
}

export interface ReasoningStrategy {
    id: string;
    name: string;
    description: string;
}

export interface LLMStatus {
    mock_mode: boolean;
    model: string;
    api_configured: boolean;
}

export interface ReasoningResult {
    strategy: string;
    steps: ReasoningStep[];
    conclusion: string;
    confidence: number;
    error?: string;
    raw_response?: string;
}

export interface ReasoningStep {
    step_number: number;
    description: string;
    evidence?: string[];
    supports?: string[];
    opposes?: string[];
    eliminated?: string[];
}

/**
 * Generate a new MCQ question using LLM
 */
export async function generateQuestion(request: GenerateQuestionRequest): Promise<Question> {
    const response = await api.post<Question>('/llm/generate-question', request);
    return response.data;
}

/**
 * Generate reasoning for a question using specified strategy
 */
export async function generateReasoning(request: GenerateReasoningRequest): Promise<ReasoningResult> {
    const response = await api.post<ReasoningResult>('/llm/generate-reasoning', {
        question: request.question,
        strategy: request.strategy,
    });
    return response.data;
}

/**
 * Generate explanation for a question's correct answer
 */
export async function generateExplanation(request: GenerateExplanationRequest): Promise<{ explanation: string }> {
    const response = await api.post<{ explanation: string }>('/llm/generate-explanation', {
        question: request.question,
        correct_answer: request.correct_answer,
    });
    return response.data;
}

/**
 * Get list of available reasoning strategies
 */
export async function getReasoningStrategies(): Promise<{ strategies: ReasoningStrategy[] }> {
    const response = await api.get<{ strategies: ReasoningStrategy[] }>('/llm/strategies');
    return response.data;
}

/**
 * Get LLM service status and configuration
 */
export async function getLLMStatus(): Promise<LLMStatus> {
    const response = await api.get<LLMStatus>('/llm/status');
    return response.data;
}

const llmService = {
    generateQuestion,
    generateReasoning,
    generateExplanation,
    getReasoningStrategies,
    getLLMStatus,
};

export default llmService;
