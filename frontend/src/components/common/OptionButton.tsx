import type { ButtonHTMLAttributes } from 'react';

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled';

interface OptionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
    optionKey: string;
    optionText: string;
    state?: OptionState;
    showResult?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

const stateStyles: Record<OptionState, string> = {
    default: 'border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700',
    selected: 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200',
    correct: 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200',
    incorrect: 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200',
    disabled: 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed',
};

export function OptionButton({
    optionKey,
    optionText,
    state = 'default',
    showResult = false,
    onClick,
    disabled = false,
    className = '',
}: OptionButtonProps) {
    const currentState = disabled ? 'disabled' : state;

    const getIcon = () => {
        if (state === 'correct') {
            return (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            );
        }
        if (state === 'incorrect') {
            return (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
            );
        }
        return null;
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-150
                flex items-start gap-3
                ${stateStyles[currentState]}
                ${className}
            `}
        >
            <span
                className={`
                    flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                    text-sm font-semibold
                    ${state === 'selected' ? 'bg-primary-500 text-white' : ''}
                    ${state === 'correct' ? 'bg-green-500 text-white' : ''}
                    ${state === 'incorrect' ? 'bg-red-500 text-white' : ''}
                    ${state === 'default' ? 'bg-gray-100 text-gray-600' : ''}
                    ${state === 'disabled' ? 'bg-gray-100 text-gray-400' : ''}
                `}
            >
                {optionKey}
            </span>
            <span className="flex-1 text-sm leading-relaxed">{optionText}</span>
            {showResult && getIcon() && <span className="flex-shrink-0">{getIcon()}</span>}
        </button>
    );
}
