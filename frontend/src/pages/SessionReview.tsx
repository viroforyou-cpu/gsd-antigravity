import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, CardBody, Button } from '../components/common';
import { QuestionDisplay, OptionSelector } from '../components/question';
import { ReasoningViewer } from '../components/reasoning';
import { reasoningService } from '../services';
import { getReasoningByStrategy } from '../mock/reasoning';
import type { Question, AnswerKey } from '../types/question';
import type { AllReasoningResult } from '../types/reasoning';

interface SessionReviewState {
    questions: Question[];
    answers: Array<{
        questionId: string;
        answer: AnswerKey;
        isCorrect: boolean;
    }>;
    sessionId?: string;
    accuracy?: number;
}

export function SessionReview() {
    const location = useLocation();
    const state = location.state as SessionReviewState | undefined;
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [apiReasoning, setApiReasoning] = useState<Record<string, Record<string, AllReasoningResult | undefined>>>({});
    const [loadingReasoning, setLoadingReasoning] = useState<string | null>(null);

    // Fetch reasoning from API when a question is expanded
    useEffect(() => {
        if (expandedQuestion && state?.sessionId) {
            setLoadingReasoning(expandedQuestion);
            reasoningService.analyzeQuestion(expandedQuestion)
                .then(results => {
                    const reasoningMap: Record<string, AllReasoningResult | undefined> = {};
                    results.forEach(result => {
                        reasoningMap[result.strategy] = result;
                    });
                    setApiReasoning(prev => ({
                        ...prev,
                        [expandedQuestion]: reasoningMap,
                    }));
                })
                .catch(err => {
                    console.error('Failed to fetch reasoning from API:', err);
                    // Will fall back to mock reasoning
                })
                .finally(() => {
                    setLoadingReasoning(null);
                });
        }
    }, [expandedQuestion, state?.sessionId]);

    if (!state || !state.questions || !state.answers) {
        return (
            <Layout title="Session Review">
                <div className="max-w-2xl mx-auto text-center py-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">No Session to Review</h2>
                    <p className="text-gray-600 mb-6">Start a practice session first to see your results here.</p>
                    <Link to="/practice">
                        <Button>Start Practice</Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    const { questions, answers, sessionId, accuracy: apiAccuracy } = state;
    const correctCount = useMemo(() => answers.filter(a => a.isCorrect).length, [answers]);
    const accuracy = useMemo(() =>
        apiAccuracy ?? Math.round((correctCount / answers.length) * 100),
        [apiAccuracy, correctCount, answers.length]
    );

    const toggleQuestion = useCallback((questionId: string) => {
        setExpandedQuestion(prev => prev === questionId ? null : questionId);
    }, []);

    const getReasoningForViewer = useCallback((questionId: string) => {
        // First check if we have API reasoning
        if (apiReasoning[questionId]) {
            return {
                association: apiReasoning[questionId].association,
                hypothetico: apiReasoning[questionId].hypothetico,
                constraints: apiReasoning[questionId].constraints,
                arguments: apiReasoning[questionId].arguments,
            };
        }
        // Fall back to mock reasoning
        return {
            association: getReasoningByStrategy(questionId, 'association') as AllReasoningResult | undefined,
            hypothetico: getReasoningByStrategy(questionId, 'hypothetico') as AllReasoningResult | undefined,
            constraints: getReasoningByStrategy(questionId, 'constraints') as AllReasoningResult | undefined,
            arguments: getReasoningByStrategy(questionId, 'arguments') as AllReasoningResult | undefined,
        };
    }, [apiReasoning]);

    return (
        <Layout title="Session Review">
            <div className="max-w-4xl mx-auto">
                {/* Summary Card */}
                <Card className="mb-8">
                    <CardBody>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
                            <p className="text-gray-600 mb-6">Here's how you performed:</p>

                            <div className="flex justify-center gap-8 mb-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-primary-600">{correctCount}/{answers.length}</p>
                                    <p className="text-sm text-gray-500">Correct</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-4xl font-bold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {Math.round(accuracy)}%
                                    </p>
                                    <p className="text-sm text-gray-500">Accuracy</p>
                                </div>
                            </div>

                            {sessionId && (
                                <div className="mb-4">
                                    <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">
                                        Session ID: {sessionId.slice(0, 8)}...
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-center gap-4">
                                <Link to="/practice">
                                    <Button>Practice Again</Button>
                                </Link>
                                <Link to="/">
                                    <Button variant="outline">Back to Dashboard</Button>
                                </Link>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Question-by-Question Review */}
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Click on each question to see detailed reasoning strategies explaining why the correct answer is correct.
                </p>
                <div className="space-y-4">
                    {questions.map((question, index) => {
                        const answer = answers[index];
                        const isExpanded = expandedQuestion === question.id;
                        const reasoning = getReasoningForViewer(question.id);
                        const hasReasoning = Object.values(reasoning).some(r => r !== undefined);
                        const isLoadingReasoning = loadingReasoning === question.id;

                        return (
                            <Card key={question.id} className="overflow-hidden">
                                {/* Question Header - Clickable */}
                                <button
                                    onClick={() => toggleQuestion(question.id)}
                                    className="w-full text-left"
                                >
                                    <CardBody className="hover:bg-gray-50 transition-colors">
                                        {/* Result Badge */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`px-3 py-1 text-sm font-medium rounded-full ${answer.isCorrect
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    Your answer: <strong>{answer.answer}</strong>
                                                </span>
                                                {!answer.isCorrect && (
                                                    <span className="text-sm text-green-600">
                                                        Correct: <strong>{question.correct_answer}</strong>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {hasReasoning && (
                                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                        Reasoning Available
                                                    </span>
                                                )}
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Question Preview */}
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                <span className="font-medium text-gray-700">Q{index + 1}:</span> {question.stem}
                                            </p>
                                        </div>
                                    </CardBody>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200">
                                        <div className="p-6 space-y-6">
                                            {/* Full Question */}
                                            <QuestionDisplay
                                                question={question}
                                                questionNumber={index + 1}
                                                totalQuestions={questions.length}
                                                showMetadata={true}
                                            />

                                            {/* Options with Results */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-3">Answer Options</h4>
                                                <OptionSelector
                                                    question={question}
                                                    selectedAnswer={answer.answer}
                                                    onAnswerSelect={() => { }}
                                                    showCorrectAnswer={true}
                                                    disabled={true}
                                                />
                                            </div>

                                            {/* Reasoning Visualization */}
                                            {isLoadingReasoning ? (
                                                <div className="p-8 text-center">
                                                    <svg className="animate-spin h-8 w-8 mx-auto text-primary-600 mb-3" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <p className="text-sm text-gray-500">Loading reasoning strategies...</p>
                                                </div>
                                            ) : hasReasoning ? (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Reasoning Strategies</h4>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        Explore different reasoning approaches to understand why <strong>{question.correct_answer}</strong> is the correct answer.
                                                    </p>
                                                    <ReasoningViewer
                                                        reasoning={reasoning}
                                                        correctAnswer={question.correct_answer}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                                                    No detailed reasoning available for this question.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
