interface ProgressBarProps {
    value: number;
    max: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'success' | 'warning' | 'danger';
    className?: string;
}

const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
};

const colorStyles = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
};

export function ProgressBar({
    value,
    max,
    showLabel = false,
    size = 'md',
    color = 'primary',
    className = '',
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={className}>
            {showLabel && (
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{value} of {max}</span>
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
                <div
                    className={`${sizeStyles[size]} ${colorStyles[color]} rounded-full transition-all duration-300 ease-out`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    );
}

interface CircularProgressProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    color?: 'primary' | 'success' | 'warning' | 'danger';
    showLabel?: boolean;
    className?: string;
}

const circularColorStyles = {
    primary: 'text-primary-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
};

export function CircularProgress({
    value,
    max,
    size = 120,
    strokeWidth = 8,
    color = 'primary',
    showLabel = true,
    className = '',
}: CircularProgressProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`${circularColorStyles[color]} transition-all duration-300 ease-out`}
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
        </div>
    );
}

interface StepProgressProps {
    steps: number;
    currentStep: number;
    className?: string;
}

export function StepProgress({ steps, currentStep, className = '' }: StepProgressProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {Array.from({ length: steps }, (_, index) => (
                <div
                    key={index}
                    className={`
                        flex-1 h-2 rounded-full transition-all duration-300
                        ${index < currentStep
                            ? 'bg-primary-500'
                            : index === currentStep
                                ? 'bg-primary-300'
                                : 'bg-gray-200'
                        }
                    `}
                />
            ))}
        </div>
    );
}
