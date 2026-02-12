import type { ArgumentReasoning, AllReasoningResult } from '../../types/reasoning';

interface ArgumentsViewProps {
    reasoning: AllReasoningResult;
    correctAnswer: string;
}

function isArgumentReasoning(reasoning: AllReasoningResult): reasoning is ArgumentReasoning {
    return reasoning.strategy === 'arguments';
}

export function ArgumentsView({ reasoning, correctAnswer }: ArgumentsViewProps) {
    if (!isArgumentReasoning(reasoning)) {
        return <div className="p-4 text-gray-500">Invalid reasoning type for arguments view</div>;
    }

    const { steps, conclusion, confidence, arguments: args } = reasoning;

    // Sort arguments by net score for better visualization
    const sortedArgs = [...args].sort((a, b) => b.net_score - a.net_score);

    return (
        <div className="space-y-6">
            {/* Header with confidence */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Argument-Based Reasoning</h3>
                    <p className="text-sm text-gray-500">Weighing pros and cons for each diagnostic option</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                        {Math.round(confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                </div>
            </div>

            {/* Reasoning Steps */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Analysis Process</h4>
                <div className="space-y-2">
                    {steps.map((step) => (
                        <div key={step.step_number} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                                {step.step_number}
                            </div>
                            <p className="text-sm text-gray-700">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Arguments Comparison */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Arguments by Option</h4>

                {/* Score Overview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-3">Net Argument Score (Pros - Cons)</p>
                    <div className="space-y-2">
                        {sortedArgs.map((arg) => {
                            const isCorrect = arg.option === correctAnswer;
                            return (
                                <div key={arg.option} className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect
                                        ? 'bg-green-500 text-white ring-2 ring-green-300'
                                        : 'bg-gray-300 text-gray-700'
                                        }`}>
                                        {arg.option}
                                    </span>
                                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-px h-full bg-gray-400" />
                                        </div>
                                        <div
                                            className={`h-full rounded-full transition-all ${arg.net_score > 0
                                                ? 'bg-green-500 ml-auto'
                                                : 'bg-red-400'
                                                }`}
                                            style={{
                                                width: `${Math.min(Math.abs(arg.net_score) * 10, 50)}%`,
                                                marginLeft: arg.net_score > 0 ? 'auto' : `${50 - Math.min(Math.abs(arg.net_score) * 10, 50)}%`
                                            }}
                                        />
                                    </div>
                                    <span className={`w-8 text-sm font-bold ${arg.net_score > 0 ? 'text-green-600' : arg.net_score < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {arg.net_score > 0 ? '+' : ''}{arg.net_score}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detailed Arguments */}
                <div className="space-y-4">
                    {args.map((arg) => {
                        const isCorrect = arg.option === correctAnswer;
                        return (
                            <div
                                key={arg.option}
                                className={`p-4 rounded-lg border-2 ${isCorrect
                                    ? 'bg-green-50 border-green-300'
                                    : arg.net_score < 0
                                        ? 'bg-red-50/50 border-red-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {/* Option Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isCorrect
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-300 text-gray-700'
                                            }`}>
                                            {arg.option}
                                        </span>
                                        {isCorrect && (
                                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                                Correct Answer
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-bold ${arg.net_score > 0 ? 'text-green-600' : arg.net_score < 0 ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                            {arg.net_score > 0 ? '+' : ''}{arg.net_score}
                                        </span>
                                        <p className="text-xs text-gray-500">Net Score</p>
                                    </div>
                                </div>

                                {/* Pros and Cons Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Pros */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm font-medium text-green-700">Supporting Evidence</span>
                                        </div>
                                        <div className="space-y-1">
                                            {arg.pros.length > 0 ? (
                                                arg.pros.map((pro, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm">
                                                        <span className="text-green-500 mt-0.5">+</span>
                                                        <span className="text-gray-700">{pro}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No supporting evidence</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cons */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span className="text-sm font-medium text-red-700">Opposing Evidence</span>
                                        </div>
                                        <div className="space-y-1">
                                            {arg.cons.length > 0 ? (
                                                arg.cons.map((con, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm">
                                                        <span className="text-red-500 mt-0.5">−</span>
                                                        <span className="text-gray-700">{con}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No opposing evidence</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Conclusion */}
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                <h4 className="text-sm font-medium text-primary-800 mb-2">Conclusion</h4>
                <p className="text-sm text-primary-700">{conclusion}</p>
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-primary-600">Strongest Argument:</span>
                    <span className="px-2 py-1 bg-primary-600 text-white rounded font-bold">{correctAnswer}</span>
                </div>
            </div>
        </div>
    );
}
