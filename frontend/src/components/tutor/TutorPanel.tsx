/**
 * TutorPanel - Main chat interface for AI Tutor.
 *
 * Phase 22: AI Tutor Mode
 */

import { useState, useRef, useEffect } from 'react';
import { useTutorStore } from '../../stores/tutorStore';
import TutorMessageComponent from './TutorMessage';
import TutorInput from './TutorInput';
import HintButton from './HintButton';
import type { TutorMessage } from '../../types/tutor';

interface TutorPanelProps {
    className?: string;
}

export function TutorPanel({ className = '' }: TutorPanelProps) {
    const {
        messages,
        isLoading,
        isTyping,
        isPanelOpen,
        hintCount,
        maxHints,
        error,
        togglePanel,
        clearError,
    } = useTutorStore();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showQuickActions, setShowQuickActions] = useState(true);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Hide quick actions after first user message
    useEffect(() => {
        const hasUserMessage = messages.some((m) => m.role === 'user');
        setShowQuickActions(!hasUserMessage);
    }, [messages]);

    if (!isPanelOpen) {
        return (
            <button
                onClick={togglePanel}
                className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-white shadow-lg hover:bg-indigo-700 transition-colors"
                aria-label="Open tutor panel"
            >
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                <span className="font-medium">AI Tutor</span>
            </button>
        );
    }

    return (
        <div
            className={`fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-gray-200 bg-white shadow-xl ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                        <svg
                            className="h-5 w-5 text-indigo-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">AI Tutor</h2>
                        <p className="text-xs text-gray-500">Your learning companion</p>
                    </div>
                </div>
                <button
                    onClick={togglePanel}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close tutor panel"
                >
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
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                            <svg
                                className="h-8 w-8 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-2 font-medium text-gray-900">Welcome!</h3>
                        <p className="text-sm text-gray-500">
                            I'm here to help you learn. Ask me questions or request hints to
                            guide your thinking.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <TutorMessageComponent key={message.id} message={message} />
                        ))}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="flex gap-1">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                                </div>
                                <span className="text-sm">Tutor is typing...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Error display */}
            {error && (
                <div className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <span>{error}</span>
                    <button
                        onClick={clearError}
                        className="text-red-500 hover:text-red-700"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Quick Actions */}
            {showQuickActions && messages.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2">
                    <p className="mb-2 text-xs text-gray-500">Quick actions:</p>
                    <div className="flex flex-wrap gap-2">
                        <QuickActionButton
                            onClick={() => { }}
                            disabled={isLoading}
                        >
                            Explain this concept
                        </QuickActionButton>
                        <QuickActionButton
                            onClick={() => { }}
                            disabled={isLoading}
                        >
                            What should I focus on?
                        </QuickActionButton>
                    </div>
                </div>
            )}

            {/* Hint Button */}
            <div className="border-t border-gray-100 px-4 py-2">
                <HintButton
                    currentLevel={hintCount + 1}
                    maxHints={maxHints}
                    disabled={isLoading || hintCount >= maxHints}
                />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
                <TutorInput disabled={isLoading} />
            </div>
        </div>
    );
}

interface QuickActionButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

function QuickActionButton({ onClick, disabled, children }: QuickActionButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {children}
        </button>
    );
}

export default TutorPanel;
