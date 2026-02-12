import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, CardBody, Button, KeyboardHintsPanel, StepProgress } from '../components/common';
import { QuestionDisplay, OptionSelector } from '../components/question';
import { useLetterKeySelection, useKeyboardShortcuts } from '../hooks';
import { sessionService } from '../services';
import { mockQuestions } from '../mock/questions'; // Fallback for offline mode
import type { Question, AnswerKey } from '../types/question';
import type { SessionResponse } from '../services/sessionService';

type SessionState = 'setup' | 'loading' | 'active' | 'completing' | 'error';

interface SessionAnswer {
    questionId: string;
    answer: AnswerKey;
    isCorrect: boolean;
}

// Convert backend session questions to frontend Question format
// Note: correct_answer is not included in session questions (to be fetched on completion)
function convertToQuestion(sq: SessionResponse['questions'][0]): Question {
    // Find the matching question from mock data to get correct_answer
    const mockQ = mockQuestions.find(mq => mq.id === sq.question.id);
    return {
        id: sq.question.id,
        stem: sq.question.stem,
        options: {
            A: sq.question.options.A || '',
            B: sq.question.options.B || '',
            C: sq.question.options.C || '',
            D: sq.question.options.D || '',
            E: sq.question.options.E || '',
        },
        correct_answer: (mockQ?.correct_answer || 'A') as AnswerKey, // Fallback, will be updated from API
        difficulty: sq.question.difficulty as Question['difficulty'],
        category: sq.question.category as Question['category'],
        source_reference: sq.question.source_reference,
        created_at: new Date().toISOString(),
    };
}

export function PracticeSession() {
    const navigate = useNavigate();
    const [sessionState, setSessionState] = useState<SessionState>('setup');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<SessionAnswer[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | undefined>();
    const [showFeedback, setShowFeedback] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Setup options
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [questionCount, setQuestionCount] = useState<number>(5);
    const [useApi, setUseApi] = useState<boolean>(true); // Toggle for API vs mock mode

    const categories = ['all', 'Lysosomal Storage Disorders', 'Chromosomal Abnormalities', 'Inherited Metabolic Disorders', 'Muscular Disorders'];

    const startSession = async () => {
        setSessionState('loading');
        setError(null);

        if (useApi) {
            try {
                const session = await sessionService.createSession(selectedCategory, questionCount);
                setSessionId(session.id);
                const convertedQuestions = session.questions.map(convertToQuestion);
                setQuestions(convertedQuestions);
                setAnswers([]);
                setCurrentIndex(0);
                setSelectedAnswer(undefined);
                setShowFeedback(false);
                setSessionState('active');
            } catch (err) {
                console.error('Failed to create session via API, falling back to mock data:', err);
                // Fallback to mock data
                startMockSession();
            }
        } else {
            startMockSession();
        }
    };

    const startMockSession = () => {
        let filteredQuestions = [...mockQuestions];
        if (selectedCategory !== 'all') {
            filteredQuestions = filteredQuestions.filter(q => q.category === selectedCategory);
        }
        // Shuffle and take requested count
        const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, questionCount));
        setAnswers([]);
        setCurrentIndex(0);
        setSelectedAnswer(undefined);
        setShowFeedback(false);
        setSessionId(null);
        setSessionState('active');
    };

    const handleAnswerSelect = (answer: AnswerKey) => {
        if (showFeedback) return;
        setSelectedAnswer(answer);
    };

    const submitAnswer = async () => {
        if (!selectedAnswer) return;

        const currentQuestion = questions[currentIndex];
        const isCorrect = selectedAnswer === currentQuestion.correct_answer;

        const newAnswer: SessionAnswer = {
            questionId: currentQuestion.id,
            answer: selectedAnswer,
            isCorrect,
        };

        setAnswers(prev => [...prev, newAnswer]);

        // Submit to API if using API mode
        if (useApi && sessionId) {
            try {
                await sessionService.submitAnswer(sessionId, currentQuestion.id, selectedAnswer);
            } catch (err) {
                console.error('Failed to submit answer to API:', err);
                // Continue anyway - local state is updated
            }
        }

        setShowFeedback(true);
    };

    const goToNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(undefined);
            setShowFeedback(false);
        } else {
            // Session complete
            await completeSession();
        }
    };

    const completeSession = async () => {
        setSessionState('completing');

        if (useApi && sessionId) {
            try {
                const result = await sessionService.completeSession(sessionId);
                // Update answers with correct information from API
                const updatedAnswers: SessionAnswer[] = result.answers.map(a => ({
                    questionId: a.question_id,
                    answer: (a.user_answer || 'A') as AnswerKey,
                    isCorrect: a.is_correct,
                }));

                // Update questions with correct answers from API
                const updatedQuestions = questions.map(q => {
                    const answerDetail = result.answers.find(a => a.question_id === q.id);
                    if (answerDetail) {
                        return { ...q, correct_answer: answerDetail.correct_answer as AnswerKey };
                    }
                    return q;
                });

                navigate('/review', {
                    state: {
                        questions: updatedQuestions,
                        answers: updatedAnswers,
                        sessionId: result.id,
                        accuracy: result.accuracy,
                    }
                });
            } catch (err) {
                console.error('Failed to complete session via API:', err);
                // Fallback to local navigation
                navigate('/review', { state: { questions, answers } });
            }
        } else {
            // Local mode - just navigate with local data
            navigate('/review', { state: { questions, answers } });
        }
    };

    // Keyboard navigation for answer selection (A-E keys)
    const answerLetters = ['A', 'B', 'C', 'D', 'E'];
    useLetterKeySelection(
        answerLetters,
        (letter) => handleAnswerSelect(letter as AnswerKey),
        sessionState === 'active' && !showFeedback
    );

    // Keyboard shortcuts for submit/next
    useKeyboardShortcuts([
        {
            key: 'Enter',
            handler: () => {
                if (sessionState === 'active') {
                    if (!showFeedback && selectedAnswer) {
                        submitAnswer();
                    } else if (showFeedback) {
                        goToNext();
                    }
                }
            },
        },
        {
            key: ' ',
            handler: () => {
                if (sessionState === 'active') {
                    if (!showFeedback && selectedAnswer) {
                        submitAnswer();
                    } else if (showFeedback) {
                        goToNext();
                    }
                }
            },
        },
    ]);

    // Setup Screen
    if (sessionState === 'setup' || sessionState === 'loading') {
        return (
            <Layout title="Practice Session">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardBody>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Start Practice Session</h2>

                            {/* API Mode Toggle */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useApi}
                                        onChange={(e) => setUseApi(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Connect to Backend API</span>
                                        <p className="text-xs text-gray-500">
                                            {useApi ? 'Using backend at localhost:8000' : 'Using local mock data (offline mode)'}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Category Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    disabled={sessionState === 'loading'}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Question Count */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Questions
                                </label>
                                <div className="flex gap-2">
                                    {[5, 10, 15, 20].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setQuestionCount(count)}
                                            disabled={sessionState === 'loading'}
                                            className={`
                                                px-4 py-2 rounded-lg border-2 font-medium transition-colors
                                                ${questionCount === count
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }
                                                ${sessionState === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Start Button */}
                            <Button
                                onClick={startSession}
                                fullWidth
                                size="lg"
                                disabled={sessionState === 'loading'}
                            >
                                {sessionState === 'loading' ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Starting...
                                    </span>
                                ) : 'Start Session'}
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Error State
    if (sessionState === 'error') {
        return (
            <Layout title="Practice Session">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-red-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Error</h2>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <Button onClick={() => setSessionState('setup')}>Try Again</Button>
                        </CardBody>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Completing State
    if (sessionState === 'completing') {
        return (
            <Layout title="Practice Session">
                <div className="max-w-2xl mx-auto text-center py-12">
                    <svg className="animate-spin h-12 w-12 mx-auto text-primary-600 mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-900">Completing Session...</h2>
                    <p className="text-gray-500">Calculating your results</p>
                </div>
            </Layout>
        );
    }

    // Active Session
    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex];

    return (
        <Layout title="Practice Session">
            <div className="max-w-4xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-500">
                            Question {currentIndex + 1} of {questions.length}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-600">
                                Score: {answers.filter(a => a.isCorrect).length}/{answers.length}
                            </span>
                            {sessionId && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                    API Connected
                                </span>
                            )}
                        </div>
                    </div>
                    <StepProgress steps={questions.length} currentStep={currentIndex} />
                </div>

                {/* Question with animation */}
                <div key={currentIndex} className="animate-fade-in">
                    <QuestionDisplay
                        question={currentQuestion}
                        questionNumber={currentIndex + 1}
                        totalQuestions={questions.length}
                    />
                </div>

                {/* Options */}
                <OptionSelector
                    question={currentQuestion}
                    selectedAnswer={selectedAnswer}
                    onAnswerSelect={handleAnswerSelect}
                    showCorrectAnswer={showFeedback}
                    disabled={showFeedback}
                />

                {/* Feedback */}
                {showFeedback && (
                    <div className={`mt-4 p-4 rounded-lg ${currentAnswer?.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`font-medium ${currentAnswer?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {currentAnswer?.isCorrect ? '✓ Correct!' : `✗ Incorrect. The correct answer is ${currentQuestion.correct_answer}.`}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    {!showFeedback ? (
                        <Button
                            onClick={submitAnswer}
                            disabled={!selectedAnswer}
                        >
                            Submit Answer
                        </Button>
                    ) : (
                        <Button onClick={goToNext}>
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                        </Button>
                    )}
                </div>

                {/* Keyboard Hints */}
                <div className="mt-8">
                    {!showFeedback ? (
                        <KeyboardHintsPanel
                            hints={[
                                { keys: ['A', 'B', 'C', 'D', 'E'], label: 'Select answer' },
                                { keys: ['Enter'], label: 'Submit' },
                            ]}
                        />
                    ) : (
                        <KeyboardHintsPanel
                            hints={[
                                { keys: ['Enter'], label: currentIndex < questions.length - 1 ? 'Next question' : 'Finish' },
                            ]}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
}
