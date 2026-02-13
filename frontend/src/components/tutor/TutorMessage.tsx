/**
 * TutorMessage - Individual message component for tutor chat.
 *
 * Phase 22: AI Tutor Mode
 */

import type { TutorMessage as TutorMessageType } from '../../types/tutor';

interface TutorMessageProps {
    message: TutorMessageType;
    className?: string;
}

const MESSAGE_TYPE_ICONS: Record<string, string> = {
    question: '❓',
    hint: '💡',
    explanation: '📖',
    guidance: '🎯',
    feedback: '✨',
    greeting: '👋',
    summary: '📋',
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
    question: 'Question',
    hint: 'Hint',
    explanation: 'Explanation',
    guidance: 'Guidance',
    feedback: 'Feedback',
    greeting: 'Welcome',
    summary: 'Summary',
};

export function TutorMessage({ message, className = '' }: TutorMessageProps) {
    const isTutor = message.role === 'tutor';
    const icon = MESSAGE_TYPE_ICONS[message.message_type] || '💬';
    const label = MESSAGE_TYPE_LABELS[message.message_type] || '';
    const content: string = typeof message.content === 'string' ? message.content : String(message.content);
    const metadata = message.metadata as Record<string, unknown> | undefined;

    return (
        <div
            className={`flex ${isTutor ? 'justify-start' : 'justify-end'} ${className}`}
        >
            <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${isTutor
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-indigo-600 text-white'
                    }`}
            >
                {/* Message type indicator for tutor messages */}
                {isTutor && message.message_type !== 'greeting' && (
                    <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                        <span>{icon}</span>
                        <span>{label}</span>
                    </div>
                )}

                {/* Message content */}
                <div className="text-sm whitespace-pre-wrap">{content}</div>

                {/* Timestamp */}
                <div
                    className={`mt-1 text-xs ${isTutor ? 'text-gray-400' : 'text-indigo-200'
                        }`}
                >
                    {formatTime(message.created_at)}
                </div>

                {/* Hint level indicator */}
                {message.message_type === 'hint' && metadata?.level && (
                    <div className="mt-1 text-xs text-gray-500">
                        Level {metadata.level as number} of 3
                    </div>
                )}

                {/* Feedback indicator */}
                {message.message_type === 'feedback' && metadata?.is_correct !== undefined && (
                    <div
                        className={`mt-1 text-xs font-medium ${metadata.is_correct ? 'text-green-600' : 'text-amber-600'
                            }`}
                    >
                        {metadata.is_correct ? '✓ Correct!' : '← Not quite right'}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default TutorMessage;
