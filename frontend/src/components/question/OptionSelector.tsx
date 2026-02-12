import type { Question, AnswerKey } from '../../types/question';
import { OptionButton } from '../common';

interface OptionSelectorProps {
    question: Question;
    selectedAnswer?: AnswerKey;
    onAnswerSelect: (answer: AnswerKey) => void;
    showCorrectAnswer?: boolean;
    disabled?: boolean;
}

export function OptionSelector({
    question,
    selectedAnswer,
    onAnswerSelect,
    showCorrectAnswer = false,
    disabled = false,
}: OptionSelectorProps) {
    const options = Object.entries(question.options) as [AnswerKey, string][];

    const getOptionState = (optionKey: AnswerKey): 'default' | 'selected' | 'correct' | 'incorrect' => {
        if (showCorrectAnswer) {
            if (optionKey === question.correct_answer) {
                return 'correct';
            }
            if (optionKey === selectedAnswer && selectedAnswer !== question.correct_answer) {
                return 'incorrect';
            }
            return 'default';
        }
        if (optionKey === selectedAnswer) {
            return 'selected';
        }
        return 'default';
    };

    return (
        <div className="space-y-3">
            {options.map(([key, text]) => (
                <OptionButton
                    key={key}
                    optionKey={key}
                    optionText={text}
                    state={getOptionState(key)}
                    showResult={showCorrectAnswer}
                    onClick={() => !disabled && onAnswerSelect(key)}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}

interface AnswerFeedbackProps {
    isCorrect: boolean;
    correctAnswer: AnswerKey;
    explanation?: string;
}

export function AnswerFeedback({ isCorrect, correctAnswer, explanation }: AnswerFeedbackProps) {
    return (
        <div
            className={`
                mt-4 p-4 rounded-lg border
                ${isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }
            `}
        >
            <div className="flex items-start gap-3">
                {isCorrect ? (
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                )}
                <div>
                    <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}.`}
                    </p>
                    {explanation && (
                        <p className={`mt-1 text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {explanation}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
