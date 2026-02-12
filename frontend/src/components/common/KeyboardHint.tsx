interface KeyboardHintProps {
    keys: string[];
    label: string;
    className?: string;
}

export function KeyboardHint({ keys, label, className = '' }: KeyboardHintProps) {
    return (
        <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
            <span className="flex gap-1">
                {keys.map((key, index) => (
                    <span key={index}>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono shadow-sm">
                            {key}
                        </kbd>
                        {index < keys.length - 1 && <span className="text-gray-400 mx-0.5">+</span>}
                    </span>
                ))}
            </span>
            <span>{label}</span>
        </div>
    );
}

interface KeyboardHintsPanelProps {
    hints: { keys: string[]; label: string }[];
    className?: string;
}

export function KeyboardHintsPanel({ hints, className = '' }: KeyboardHintsPanelProps) {
    return (
        <div className={`flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
            {hints.map((hint, index) => (
                <KeyboardHint key={index} keys={hint.keys} label={hint.label} />
            ))}
        </div>
    );
}
