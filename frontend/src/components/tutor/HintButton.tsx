/**
 * HintButton - Button to request hints from the tutor.
 *
 * Phase 22: AI Tutor Mode
 */

import { useTutorStore } from '../../stores/tutorStore';
import type { HintLevel } from '../../types/tutor';

interface HintButtonProps {
    currentLevel: number;
    maxHints: number;
    disabled?: boolean;
    className?: string;
}

const HINT_LEVEL_COLORS: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    2: 'bg-orange-100 text-orange-800 border-orange-300',
    3: 'bg-red-100 text-red-800 border-red-300',
};

const HINT_LEVEL_LABELS: Record<number, string> = {
    1: 'Socratic',
    2: 'Directional',
    3: 'Explicit',
};

export function HintButton({
    currentLevel,
    maxHints,
    disabled = false,
    className = '',
}: HintButtonProps) {
    const { requestHint, isLoading } = useTutorStore();

    const handleClick = async () => {
        if (disabled || isLoading) return;
        await requestHint(currentLevel as HintLevel);
    };

    const hintsRemaining = maxHints - currentLevel + 1;
    const isExhausted = currentLevel > maxHints;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={handleClick}
                disabled={disabled || isLoading || isExhausted}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                title={
                    isExhausted
                        ? 'No more hints available'
                        : `Request a ${HINT_LEVEL_LABELS[currentLevel]} hint`
                }
            >
                <span className="text-lg">💡</span>
                <span>Request Hint</span>
                {!isExhausted && (
                    <span
                        className={`ml-1 rounded-full px-2 py-0.5 text-xs ${HINT_LEVEL_COLORS[currentLevel]}`}
                    >
                        Level {currentLevel}
                    </span>
                )}
            </button>

            {/* Hint level indicators */}
            <div className="flex items-center gap-1">
                {Array.from({ length: maxHints }, (_, i) => (
                    <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${i < currentLevel - 1
                                ? 'bg-indigo-600'
                                : 'bg-gray-200'
                            }`}
                        title={`Hint ${i + 1}: ${HINT_LEVEL_LABELS[i + 1]}`}
                    />
                ))}
            </div>

            {/* Remaining hints text */}
            {!isExhausted && (
                <span className="text-xs text-gray-500">
                    {hintsRemaining} hint{hintsRemaining !== 1 ? 's' : ''} remaining
                </span>
            )}
        </div>
    );
}

export default HintButton;
