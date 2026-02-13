import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, KeyboardHintsPanel, ProgressBar } from '../components/common';
import { OptionButton } from '../components/common/OptionButton';
import { useLetterKeySelection, useKeyboardShortcuts } from '../hooks';
import { reviewService, type ReviewQueue as ReviewQueueType, type ReviewQuestion, ReviewQuality } from '../services/reviewService';
import type { AnswerKey } from '../types/question';

type ViewState = 'loading' | 'queue' | 'review' | 'result' | 'empty' | 'error';

interface ReviewResult {
    questionId: string;
    userAnswer: AnswerKey;
    isCorrect: boolean;
    quality: number;
    nextReviewDate: string;
    newInterval: number;
}

export function ReviewQueue() {
    const [viewState, setViewState] = useState<ViewState>('loading');
    const [queue, setQueue] = useState<ReviewQueueType | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<ReviewQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<AnswerKey | undefined>();
    const [showFeedback, setShowFeedback] = useState(false);
    const [showQualitySelect, setShowQualitySelect] = useState(false);
    const [results, setResults] = useState<ReviewResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Load review queue on mount
    useEffect(() => {
        loadQueue();
    }, []);

    const loadQueue = async () => {
        setViewState('loading');
        setError(null);
        try {
            const queueData = await reviewService.getDueReviews(20);
            setQueue(queueData);
            if (queueData.questions.length === 0) {
                setViewState('empty');
            } else {
                setCurrentQuestion(queueData.questions[0]);
                setViewState('queue');
            }
        } catch (err) {
            console.error('Failed to load review queue:', err);
            setError('Failed to load review queue. Please try again.');
            setViewState('error');
        }
    };

    const startReview = () => {
        if (queue && queue.questions.length > 0) {
            setCurrentIndex(0);
            setCurrentQuestion(queue.questions[0]);
            setSelectedAnswer(undefined);
            setShowFeedback(false);
            setShowQualitySelect(false);
            setResults([]);
            setViewState('review');
        }
    };

    const handleAnswerSelect = (answer: AnswerKey) => {
        if (!showFeedback) {
            setSelectedAnswer(answer);
        }
    };

    const submitAnswer = async () => {
        if (!currentQuestion || !selectedAnswer) return;

        // Show feedback first
        setShowFeedback(true);
        setShowQualitySelect(true);
    };

    const submitQuality = async (quality: number) => {
        if (!currentQuestion || !selectedAnswer) return;

        try {
            const result = await reviewService.submitReview({
                question_id: currentQuestion.question_id,
                quality,
                user_answer: selectedAnswer,
            });

            const reviewResult: ReviewResult = {
                questionId: currentQuestion.question_id,
                userAnswer: selectedAnswer,
                isCorrect: quality >= 3,
                quality,
                nextReviewDate: result.next_review_date,
                newInterval: result.new_interval,
            };

            setResults([...results, reviewResult]);
            setShowQualitySelect(false);

            // Move to next question or finish
            if (queue && currentIndex < queue.questions.length - 1) {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                setCurrentQuestion(queue.questions[nextIndex]);
                setSelectedAnswer(undefined);
                setShowFeedback(false);
            } else {
                setViewState('result');
            }
        } catch (err) {
            console.error('Failed to submit review:', err);
            setError('Failed to submit review. Please try again.');
        }
    };

    const skipQuestion = () => {
        if (queue && currentIndex < queue.questions.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setCurrentQuestion(queue.questions[nextIndex]);
            setSelectedAnswer(undefined);
            setShowFeedback(false);
            setShowQualitySelect(false);
        }
    };

    // Keyboard shortcuts
    const answerLetters = ['A', 'B', 'C', 'D', 'E'];
    useLetterKeySelection(
        answerLetters,
        (letter) => handleAnswerSelect(letter as AnswerKey),
        !showFeedback && viewState === 'review'
    );

    useKeyboardShortcuts([
        { key: 'Enter', handler: showQualitySelect ? () => { } : (selectedAnswer ? submitAnswer : () => { }) },
        { key: ' ', handler: showQualitySelect ? () => { } : (selectedAnswer ? submitAnswer : () => { }) },
        { key: 'Escape', handler: viewState === 'review' ? () => setViewState('queue') : () => { } },
        { key: '1', handler: showQualitySelect ? () => submitQuality(ReviewQuality.COMPLETE_FAILURE) : () => { } },
        { key: '2', handler: showQualitySelect ? () => submitQuality(ReviewQuality.INCORRECT_NO_IDEA) : () => { } },
        { key: '3', handler: showQualitySelect ? () => submitQuality(ReviewQuality.INCORRECT_CLOSE) : () => { } },
        { key: '4', handler: showQualitySelect ? () => submitQuality(ReviewQuality.CORRECT_LOW_CONFIDENCE) : () => { } },
        { key: '5', handler: showQualitySelect ? () => submitQuality(ReviewQuality.CORRECT_HESITANT) : () => { } },
        { key: '6', handler: showQualitySelect ? () => submitQuality(ReviewQuality.CORRECT_PERFECT) : () => { } },
    ]);

    const getQualityLabel = (quality: number): string => {
        switch (quality) {
            case 0: return 'Complete Failure';
            case 1: return 'Incorrect - No Idea';
            case 2: return 'Incorrect - Close';
            case 3: return 'Correct - Low Confidence';
            case 4: return 'Correct - Hesitant';
            case 5: return 'Correct - Perfect';
            default: return '';
        }
    };

    const getQualityColor = (quality: number): string => {
        if (quality >= 4) return 'bg-green-500 hover:bg-green-600';
        if (quality >= 3) return 'bg-yellow-500 hover:bg-yellow-600';
        return 'bg-red-500 hover:bg-red-600';
    };

    // Loading state
    if (viewState === 'loading') {
        return (
            <Layout title="Review Queue">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your review queue...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Error state
    if (viewState === 'error') {
        return (
            <Layout title="Review Queue">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardBody className="text-center py-12">
                            <div className="text-red-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Queue</h2>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <Button onClick={loadQueue}>Try Again</Button>
                        </CardBody>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Empty state
    if (viewState === 'empty') {
        return (
            <Layout title="Review Queue">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardBody className="text-center py-12">
                            <div className="text-green-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h2>
                            <p className="text-gray-600 mb-6">
                                You have no questions due for review right now. Great job staying on top of your studies!
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Link to="/practice">
                                    <Button variant="outline">Start Practice Session</Button>
                                </Link>
                                <Link to="/dashboard">
                                    <Button>Back to Dashboard</Button>
                                </Link>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Queue overview
    if (viewState === 'queue') {
        return (
            <Layout title="Review Queue">
                <div className="max-w-4xl mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardBody className="text-center">
                                <p className="text-3xl font-bold text-primary-600">{queue?.due_today || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Due Today</p>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="text-center">
                                <p className="text-3xl font-bold text-red-500">{queue?.overdue || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Overdue</p>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody className="text-center">
                                <p className="text-3xl font-bold text-blue-500">{queue?.upcoming_week || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">This Week</p>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Queue Preview */}
                    <Card className="mb-6">
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900">Questions Due for Review</h2>
                        </CardHeader>
                        <CardBody>
                            {queue?.questions && queue.questions.length > 0 ? (
                                <div className="space-y-3">
                                    {queue.questions.slice(0, 5).map((q, idx) => (
                                        <div
                                            key={q.question_id}
                                            className={`p-3 rounded-lg border ${q.is_overdue
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-gray-200 bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                                            {q.category}
                                                        </span>
                                                        {q.is_overdue && (
                                                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                                                                {q.days_overdue} day{q.days_overdue !== 1 ? 's' : ''} overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-700 line-clamp-2">{q.stem}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {queue.questions.length > 5 && (
                                        <p className="text-sm text-gray-500 text-center">
                                            +{queue.questions.length - 5} more questions
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No questions due</p>
                            )}
                        </CardBody>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                        <Button
                            onClick={startReview}
                            disabled={!queue?.questions?.length}
                            size="lg"
                        >
                            Start Review ({queue?.questions?.length || 0} questions)
                        </Button>
                        <Link to="/dashboard">
                            <Button variant="outline" size="lg">
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    // Review session
    if (viewState === 'review' && currentQuestion) {
        const totalQuestions = queue?.questions?.length || 0;

        return (
            <Layout title="Review Session">
                <div className="max-w-4xl mx-auto">
                    {/* Progress */}
                    <div className="mb-6">
                        <ProgressBar
                            value={currentIndex + 1}
                            max={totalQuestions}
                            showLabel
                        />
                        <p className="text-sm text-gray-500 mt-1 text-center">
                            Question {currentIndex + 1} of {totalQuestions}
                        </p>
                    </div>

                    {/* Question Card */}
                    <Card className="mb-6">
                        <CardBody>
                            {/* Overdue indicator */}
                            {currentQuestion.is_overdue && (
                                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm text-red-700">
                                        ⚠️ This question is {currentQuestion.days_overdue} day{currentQuestion.days_overdue !== 1 ? 's' : ''} overdue
                                    </span>
                                </div>
                            )}

                            {/* Category and difficulty */}
                            <div className="flex gap-2 mb-4">
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                    {currentQuestion.category}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {currentQuestion.difficulty}
                                </span>
                            </div>

                            {/* Question stem */}
                            <div className="prose prose-sm max-w-none mb-6">
                                <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                                    {currentQuestion.stem}
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {Object.entries(currentQuestion.options).map(([key, text]) => (
                                    <OptionButton
                                        key={key}
                                        optionKey={key as AnswerKey}
                                        optionText={text as string}
                                        state={selectedAnswer === key ? 'selected' : 'default'}
                                        showResult={false}
                                        onClick={() => handleAnswerSelect(key as AnswerKey)}
                                        disabled={showFeedback}
                                    />
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Quality Selection (after answering) */}
                    {showQualitySelect && (
                        <Card className="mb-6 border-2 border-primary-200">
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-gray-900">Rate Your Recall</h3>
                            </CardHeader>
                            <CardBody>
                                <p className="text-sm text-gray-600 mb-4">
                                    How well did you remember this? This affects when you'll see it next.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((quality) => (
                                        <Button
                                            key={quality}
                                            onClick={() => submitQuality(quality)}
                                            className={`${getQualityColor(quality)} text-white`}
                                            size="sm"
                                        >
                                            <span className="text-xs">{quality}:</span> {getQualityLabel(quality)}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                    Press keys 1-6 to quickly select (1=Complete Failure, 6=Perfect)
                                </p>
                            </CardBody>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={skipQuestion}
                            disabled={showQualitySelect}
                        >
                            Skip
                        </Button>

                        {!showQualitySelect && (
                            <Button
                                onClick={submitAnswer}
                                disabled={!selectedAnswer}
                            >
                                Submit Answer
                            </Button>
                        )}
                    </div>

                    {/* Keyboard Hints */}
                    <KeyboardHintsPanel
                        hints={[
                            { keys: ['A-E'], label: 'Select answer' },
                            { keys: ['Enter'], label: 'Submit' },
                            { keys: ['Esc'], label: 'Exit review' },
                            ...(showQualitySelect ? [{ keys: ['1-6'], label: 'Rate recall' }] : []),
                        ]}
                    />
                </div>
            </Layout>
        );
    }

    // Results
    if (viewState === 'result') {
        const correctCount = results.filter(r => r.isCorrect).length;
        const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

        return (
            <Layout title="Review Complete">
                <div className="max-w-4xl mx-auto">
                    {/* Summary Card */}
                    <Card className="mb-6">
                        <CardBody className="text-center py-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Complete!</h2>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div>
                                    <p className="text-3xl font-bold text-primary-600">{results.length}</p>
                                    <p className="text-sm text-gray-500">Reviewed</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                                    <p className="text-sm text-gray-500">Correct</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-blue-600">{accuracy}%</p>
                                    <p className="text-sm text-gray-500">Accuracy</p>
                                </div>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <Link to="/dashboard">
                                    <Button>Back to Dashboard</Button>
                                </Link>
                                <Button variant="outline" onClick={loadQueue}>
                                    Review More
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Detailed Results */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {results.map((result, idx) => (
                                    <div
                                        key={result.questionId}
                                        className={`p-3 rounded-lg border ${result.isCorrect
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                Question {idx + 1}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                    Quality: {result.quality}/5
                                                </span>
                                                <span className={`text-sm font-medium ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                    {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </Layout>
        );
    }

    return null;
}

export default ReviewQueue;
