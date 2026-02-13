/**
 * TutorInput - User input component for tutor chat.
 *
 * Phase 22: AI Tutor Mode
 */

import { useState, useCallback, type KeyboardEvent } from 'react';
import { useTutorStore } from '../../stores/tutorStore';

interface TutorInputProps {
    disabled?: boolean;
    className?: string;
}

export function TutorInput({ disabled = false, className = '' }: TutorInputProps) {
    const [input, setInput] = useState('');
    const { askQuestion, isLoading } = useTutorStore();

    const handleSubmit = useCallback(async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading || disabled) return;

        setInput('');
        await askQuestion(trimmedInput);
    }, [input, isLoading, disabled, askQuestion]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit]
    );

    return (
        <div className={`flex items-end gap-2 ${className}`}>
            <div className="relative flex-1">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    disabled={disabled || isLoading}
                    rows={1}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {input.length > 0 && `${input.length}/500`}
                </div>
            </div>
            <button
                onClick={handleSubmit}
                disabled={!input.trim() || disabled || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
            >
                {isLoading ? (
                    <svg
                        className="h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default TutorInput;
