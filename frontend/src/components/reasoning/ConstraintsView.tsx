import type { ConstraintReasoning, AllReasoningResult } from '../../types/reasoning';

interface ConstraintsViewProps {
    reasoning: AllReasoningResult;
    correctAnswer: string;
}

function isConstraintReasoning(reasoning: AllReasoningResult): reasoning is ConstraintReasoning {
    return reasoning.strategy === 'constraints';
}

export function ConstraintsView({ reasoning, correctAnswer }: ConstraintsViewProps) {
    if (!isConstraintReasoning(reasoning)) {
        return <div className="p-4 text-gray-500">Invalid reasoning type for constraints view</div>;
    }

    const { steps, conclusion, confidence, constraints, remaining_options } = reasoning;

    // Calculate options eliminated at each step for funnel visualization
    const allOptions = ['A', 'B', 'C', 'D', 'E'];
    let eliminatedSoFar: string[] = [];

    const getFunnelStepData = () => {
        return constraints.map((constraint, index) => {
            const newlyEliminated = constraint.eliminates.filter(opt => !eliminatedSoFar.includes(opt));
            eliminatedSoFar = [...eliminatedSoFar, ...newlyEliminated];
            const remaining = allOptions.filter(opt => !eliminatedSoFar.includes(opt));
            return {
                constraint,
                newlyEliminated,
                remaining,
                stepNumber: index + 1,
            };
        });
    };

    const funnelSteps = getFunnelStepData();

    return (
        <div className="space-y-6">
            {/* Header with confidence */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Constraint Satisfaction</h3>
                    <p className="text-sm text-gray-500">Systematic elimination through clinical constraints</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                        {Math.round(confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                </div>
            </div>

            {/* Funnel Visualization */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Elimination Funnel</h4>
                <div className="relative">
                    {/* Initial State */}
                    <div className="mb-4">
                        <div className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-lg">
                            {allOptions.map((opt) => (
                                <span
                                    key={opt}
                                    className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-sm"
                                >
                                    {opt}
                                </span>
                            ))}
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-1">Starting: 5 possible diagnoses</p>
                    </div>

                    {/* Funnel Steps */}
                    {funnelSteps.map((step, index) => (
                        <div key={index} className="relative mb-4">
                            {/* Arrow */}
                            <div className="flex justify-center mb-2">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </div>

                            {/* Constraint Card */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-2">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                                        {step.stepNumber}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-800">{step.constraint.finding}</p>
                                        <p className="text-xs text-red-600 mt-1">{step.constraint.reason}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Eliminated Options */}
                            {step.newlyEliminated.length > 0 && (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-xs text-gray-500">Eliminates:</span>
                                    {step.newlyEliminated.map((opt) => (
                                        <span
                                            key={opt}
                                            className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs line-through opacity-60"
                                        >
                                            {opt}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Remaining Options */}
                            <div className="flex items-center justify-center gap-2">
                                {step.remaining.map((opt) => (
                                    <span
                                        key={opt}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${opt === correctAnswer
                                            ? 'bg-green-500 text-white ring-2 ring-green-300 ring-offset-2'
                                            : 'bg-gray-300 text-gray-700'
                                            }`}
                                    >
                                        {opt}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Final Result */}
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                        <p className="text-sm font-medium text-green-800 mb-2">Final Diagnosis</p>
                        <div className="flex justify-center">
                            {remaining_options.map((opt) => (
                                <span
                                    key={opt}
                                    className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xl ring-4 ring-green-300"
                                >
                                    {opt}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reasoning Steps */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Process Summary</h4>
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

            {/* Conclusion */}
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                <h4 className="text-sm font-medium text-primary-800 mb-2">Conclusion</h4>
                <p className="text-sm text-primary-700">{conclusion}</p>
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-primary-600">Remaining Option:</span>
                    <span className="px-2 py-1 bg-primary-600 text-white rounded font-bold">{correctAnswer}</span>
                </div>
            </div>
        </div>
    );
}
