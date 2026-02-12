import type { Question } from '../../types/question';
import { Card, CardBody } from '../common';

interface QuestionDisplayProps {
    question: Question;
    questionNumber?: number;
    totalQuestions?: number;
    showMetadata?: boolean;
}

export function QuestionDisplay({
    question,
    questionNumber,
    totalQuestions,
    showMetadata = true,
}: QuestionDisplayProps) {
    const difficultyColors = {
        easy: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        hard: 'bg-red-100 text-red-700',
    };

    return (
        <Card className="mb-6">
            <CardBody>
                {/* Question Header */}
                {showMetadata && (
                    <div className="flex items-center gap-3 mb-4">
                        {questionNumber !== undefined && (
                            <span className="text-sm font-medium text-gray-500">
                                Question {questionNumber}
                                {totalQuestions !== undefined && ` of ${totalQuestions}`}
                            </span>
                        )}
                        <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[question.difficulty]}`}
                        >
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {question.category}
                        </span>
                    </div>
                )}

                {/* Question Stem */}
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                        {question.stem}
                    </p>
                </div>

                {/* Source Reference */}
                {question.source_reference && showMetadata && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            <span className="font-medium">Source:</span> {question.source_reference}
                        </p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

interface QuestionNavigationProps {
    currentIndex: number;
    totalQuestions: number;
    onPrevious: () => void;
    onNext: () => void;
    onSubmit?: () => void;
    canGoBack?: boolean;
    isLastQuestion?: boolean;
    hasAnswer?: boolean;
}

export function QuestionNavigation({
    currentIndex,
    totalQuestions,
    onPrevious,
    onNext,
    onSubmit,
    canGoBack = true,
    isLastQuestion = false,
    hasAnswer = false,
}: QuestionNavigationProps) {
    return (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
                onClick={onPrevious}
                disabled={currentIndex === 0 || !canGoBack}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${currentIndex === 0 || !canGoBack
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                `}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
            </button>

            {/* Progress Indicator */}
            <div className="flex items-center gap-1">
                {Array.from({ length: totalQuestions }, (_, i) => (
                    <div
                        key={i}
                        className={`
                            w-2 h-2 rounded-full transition-colors duration-150
                            ${i === currentIndex ? 'bg-primary-500' : 'bg-gray-300'}
                        `}
                    />
                ))}
            </div>

            {isLastQuestion ? (
                <button
                    onClick={onSubmit}
                    disabled={!hasAnswer}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-colors duration-150
                        ${hasAnswer
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                    `}
                >
                    Submit Session
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            ) : (
                <button
                    onClick={onNext}
                    disabled={!hasAnswer}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-colors duration-150
                        ${hasAnswer
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                    `}
                >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
        </div>
    );
}
