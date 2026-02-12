import { http, HttpResponse, delay } from 'msw';
import { mockQuestions } from '../../mock/questions';
import { mockGraphs } from '../../mock/graphs';
import type { Session } from '../../types/session';
import type {
    AssociationReasoning,
    HypotheticoReasoning,
    ConstraintReasoning,
    ArgumentReasoning,
} from '../../types/reasoning';

const API_BASE = 'http://localhost:8002/api/v1';

// In-memory session storage for tests
let testSessions: Session[] = [];
let sessionCounter = 0;

// Extended session with time tracking
interface TestSession extends Session {
    time_spent?: Record<string, number>;
}

// Reset sessions helper (exported for use in tests)
export const resetTestSessions = () => {
    testSessions = [];
    sessionCounter = 0;
};

// Mock reasoning data
const mockAssociationReasoning: AssociationReasoning = {
    strategy: 'association',
    question_id: 'q001',
    steps: [
        {
            step_number: 1,
            description: 'Identify key clinical findings from the case presentation',
            evidence: ['4-month-old infant', 'failure to thrive', 'hepatosplenomegaly'],
        },
        {
            step_number: 2,
            description: 'Map findings to potential conditions',
            supports: ['B'],
            opposes: ['A', 'C'],
        },
    ],
    conclusion: 'Tay-Sachs disease has the strongest association with the clinical findings.',
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
            description: 'Formulate hypotheses for each diagnostic option',
        },
        {
            step_number: 2,
            description: 'Test each hypothesis against clinical findings',
            supports: ['B'],
        },
    ],
    conclusion: 'Tay-Sachs hypothesis is verified.',
    confidence: 0.95,
    correct_option: 'B',
    hypotheses: [
        {
            option: 'B',
            hypothesis: 'If Tay-Sachs, expect absent hex A and cherry-red spot',
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
            description: 'Apply constraint of absent hexosaminidase A',
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
            description: 'Build argument case for each option',
            supports: ['B'],
        },
    ],
    conclusion: 'Tay-Sachs has the strongest net argument.',
    confidence: 0.97,
    correct_option: 'B',
    arguments: [
        {
            option: 'B',
            pros: ['Absent hex A is diagnostic', 'Cherry-red spot classic'],
            cons: [],
            net_score: 5,
        },
    ],
};

// Mock dashboard data
const mockDashboardData = {
    total_sessions: 15,
    total_questions: 150,
    correct_answers: 120,
    accuracy: 0.8,
    average_time_per_question: 45,
    categories: [
        {
            category: 'Lysosomal Storage Disorders',
            total_questions: 25,
            correct_answers: 20,
            accuracy: 0.8,
        },
        {
            category: 'Muscular Disorders',
            total_questions: 30,
            correct_answers: 25,
            accuracy: 0.833,
        },
    ],
    recent_sessions: [],
    weekly_progress: [
        { week: '2024-W01', sessions: 3, accuracy: 0.75 },
        { week: '2024-W02', sessions: 4, accuracy: 0.82 },
    ],
};

export const handlers = [
    // Questions endpoints
    http.get(`${API_BASE}/questions`, async () => {
        await delay(100);
        return HttpResponse.json({
            questions: mockQuestions,
            total: mockQuestions.length,
            page: 1,
            page_size: 10,
        });
    }),

    http.get(`${API_BASE}/questions/random`, async () => {
        await delay(100);
        const randomIndex = Math.floor(Math.random() * mockQuestions.length);
        return HttpResponse.json(mockQuestions[randomIndex]);
    }),

    http.get(`${API_BASE}/questions/:id`, async ({ params }) => {
        await delay(100);
        const { id } = params;
        const question = mockQuestions.find((q) => q.id === id);
        if (!question) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(question);
    }),

    http.get(`${API_BASE}/questions/:id/graph`, async ({ params }) => {
        await delay(100);
        const { id } = params;
        const graph = mockGraphs[id as string];
        if (!graph) {
            return HttpResponse.json({ nodes: [], edges: [] });
        }
        return HttpResponse.json(graph);
    }),

    // Sessions endpoints
    http.post(`${API_BASE}/sessions`, async ({ request }) => {
        await delay(100);
        const body = (await request.json()) as {
            question_ids?: string[];
            category?: string;
            difficulty?: string;
        };

        sessionCounter++;
        const sessionId = `session-${sessionCounter}`;

        let questions = mockQuestions;
        if (body?.category) {
            questions = mockQuestions.filter((q) => q.category === body.category);
        }
        if (body?.difficulty) {
            questions = questions.filter((q) => q.difficulty === body.difficulty);
        }

        const session: TestSession = {
            id: sessionId,
            questions: questions.slice(0, 5),
            answers: {},
            started_at: new Date().toISOString(),
            current_index: 0,
            time_spent: {},
        };

        testSessions.push(session);
        return HttpResponse.json(session);
    }),

    http.get(`${API_BASE}/sessions/:id`, async ({ params }) => {
        await delay(100);
        const { id } = params;
        const session = testSessions.find((s) => s.id === id);
        if (!session) {
            return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json(session);
    }),

    http.put(`${API_BASE}/sessions/:id/answer`, async ({ request, params }) => {
        await delay(100);
        const { id } = params;
        const body = (await request.json()) as {
            question_id: string;
            answer: string;
            time_spent_seconds?: number;
        };

        const session = testSessions.find((s) => s.id === id) as TestSession | undefined;
        if (!session) {
            return new HttpResponse(null, { status: 404 });
        }

        session.answers[body.question_id] = body.answer;
        if (body.time_spent_seconds && session.time_spent) {
            session.time_spent[body.question_id] = body.time_spent_seconds;
        }

        // Move to next question
        session.current_index = Math.min(
            session.current_index + 1,
            session.questions.length
        );

        return HttpResponse.json(session);
    }),

    http.post(`${API_BASE}/sessions/:id/complete`, async ({ params }) => {
        await delay(100);
        const { id } = params;
        const session = testSessions.find((s) => s.id === id);
        if (!session) {
            return new HttpResponse(null, { status: 404 });
        }

        session.completed_at = new Date().toISOString();

        // Calculate score
        let correct = 0;
        for (const question of session.questions) {
            if (session.answers[question.id] === question.correct_answer) {
                correct++;
            }
        }

        return HttpResponse.json({
            ...session,
            score: {
                correct,
                total: session.questions.length,
                percentage: (correct / session.questions.length) * 100,
            },
        });
    }),

    http.get(`${API_BASE}/sessions/:id/review`, async ({ params }) => {
        await delay(100);
        const { id } = params;
        const session = testSessions.find((s) => s.id === id) as TestSession | undefined;
        if (!session) {
            return new HttpResponse(null, { status: 404 });
        }

        const timeSpent = session.time_spent || {};
        const totalTime = Object.values(timeSpent).reduce((a: number, b: number) => a + b, 0);

        const review = {
            session,
            questions: session.questions.map((q) => ({
                question: q,
                user_answer: session.answers[q.id] || null,
                is_correct: session.answers[q.id] === q.correct_answer,
                reasoning: q.id === 'q001' ? {
                    association: mockAssociationReasoning,
                    hypothetico: mockHypotheticoReasoning,
                    constraints: mockConstraintReasoning,
                    arguments: mockArgumentReasoning,
                } : null,
            })),
            summary: {
                total_questions: session.questions.length,
                correct_answers: Object.keys(session.answers).filter(
                    (qid) =>
                        session.answers[qid] ===
                        session.questions.find((q) => q.id === qid)?.correct_answer
                ).length,
                time_spent_seconds: totalTime,
            },
        };

        return HttpResponse.json(review);
    }),

    // Reasoning endpoints
    http.post(`${API_BASE}/reasoning/analyze`, async ({ request }) => {
        await delay(150);
        const body = (await request.json()) as { question_id: string };

        if (body.question_id === 'q001') {
            return HttpResponse.json({
                association: mockAssociationReasoning,
                hypothetico: mockHypotheticoReasoning,
                constraints: mockConstraintReasoning,
                arguments: mockArgumentReasoning,
            });
        }

        return HttpResponse.json({
            association: null,
            hypothetico: null,
            constraints: null,
            arguments: null,
        });
    }),

    http.post(`${API_BASE}/reasoning/association`, async ({ request }) => {
        await delay(100);
        const body = (await request.json()) as { question_id: string };
        if (body.question_id === 'q001') {
            return HttpResponse.json(mockAssociationReasoning);
        }
        return HttpResponse.json(null);
    }),

    http.post(`${API_BASE}/reasoning/hypothetico`, async ({ request }) => {
        await delay(100);
        const body = (await request.json()) as { question_id: string };
        if (body.question_id === 'q001') {
            return HttpResponse.json(mockHypotheticoReasoning);
        }
        return HttpResponse.json(null);
    }),

    http.post(`${API_BASE}/reasoning/constraints`, async ({ request }) => {
        await delay(100);
        const body = (await request.json()) as { question_id: string };
        if (body.question_id === 'q001') {
            return HttpResponse.json(mockConstraintReasoning);
        }
        return HttpResponse.json(null);
    }),

    http.post(`${API_BASE}/reasoning/arguments`, async ({ request }) => {
        await delay(100);
        const body = (await request.json()) as { question_id: string };
        if (body.question_id === 'q001') {
            return HttpResponse.json(mockArgumentReasoning);
        }
        return HttpResponse.json(null);
    }),

    // Progress endpoints
    http.get(`${API_BASE}/progress/dashboard`, async () => {
        await delay(100);
        return HttpResponse.json(mockDashboardData);
    }),

    http.get(`${API_BASE}/progress/categories`, async () => {
        await delay(100);
        return HttpResponse.json(mockDashboardData.categories);
    }),

    http.get(`${API_BASE}/progress/history`, async () => {
        await delay(100);
        return HttpResponse.json({
            sessions: testSessions.map((s) => ({
                id: s.id,
                started_at: s.started_at,
                completed_at: s.completed_at,
                questions_count: s.questions.length,
                answers_count: Object.keys(s.answers).length,
            })),
            total: testSessions.length,
        });
    }),

    // Graph endpoints
    http.get(`${API_BASE}/graph/status`, async () => {
        await delay(50);
        return HttpResponse.json({
            status: 'mock',
            connected: false,
            message: 'Using mock graph data',
        });
    }),

    http.get(`${API_BASE}/graph/question/:id`, async ({ params }) => {
        await delay(100);
        const { id } = params;
        const graph = mockGraphs[id as string];
        if (!graph) {
            return HttpResponse.json({ nodes: [], edges: [] });
        }
        return HttpResponse.json(graph);
    }),

    // LLM endpoints
    http.get(`${API_BASE}/llm/status`, async () => {
        await delay(50);
        return HttpResponse.json({
            status: 'mock',
            connected: false,
            model: 'mock-llm',
            message: 'Using mock LLM responses',
        });
    }),

    http.get(`${API_BASE}/llm/strategies`, async () => {
        await delay(50);
        return HttpResponse.json([
            { id: 'association', name: 'Association/Graph-Based', description: 'Uses knowledge graph associations' },
            { id: 'hypothetico', name: 'Hypothetico-Deductive', description: 'Tests hypotheses against evidence' },
            { id: 'constraints', name: 'Constraint Satisfaction', description: 'Eliminates options using constraints' },
            { id: 'arguments', name: 'Argument-Based', description: 'Weighs pros and cons for each option' },
        ]);
    }),
];
