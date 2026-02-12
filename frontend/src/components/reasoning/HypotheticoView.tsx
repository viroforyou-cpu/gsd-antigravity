import type { HypotheticoReasoning, AllReasoningResult } from '../../types/reasoning';

interface HypotheticoViewProps {
    reasoning: AllReasoningResult;
    correctAnswer: string;
}

function isHypotheticoReasoning(reasoning: AllReasoningResult): reasoning is HypotheticoReasoning {
    return reasoning.strategy === 'hypothetico';
}

export function HypotheticoView({ reasoning, correctAnswer }: HypotheticoViewProps) {
    if (!isHypotheticoReasoning(reasoning)) {
        return <div className="p-4 text-gray-500">Invalid reasoning type for hypothetico view</div>;
    }

    const { steps, conclusion, confidence, hypotheses } = reasoning;

    return (
        <div className="space-y-6">
            {/* Header with confidence */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hypothetico-Deductive Reasoning</h3>
                    <p className="text-sm text-gray-500">Hypothesis testing through verification and falsification</p>
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
                <h4 className="text-sm font-medium text-gray-700 mb-3">Reasoning Process</h4>
                <div className="space-y-3">
                    {steps.map((step) => (
                        <div key={step.step_number} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                                {step.step_number}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-700">{step.description}</p>
                                {step.supports && step.supports.length > 0 && (
                                    <div className="mt-2 flex gap-1">
                                        {step.supports.map((opt) => (
                                            <span key={opt} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                                Supports {opt}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hypotheses Testing */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Hypothesis Testing</h4>
                <div className="space-y-4">
                    {hypotheses.map((hyp) => {
                        const isCorrect = hyp.option === correctAnswer;
                        return (
                            <div
                                key={hyp.option}
                                className={`p-4 rounded-lg border-2 transition-all ${hyp.verified
                                    ? 'bg-green-50 border-green-300'
                                    : hyp.falsified
                                        ? 'bg-red-50 border-red-200 opacity-75'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${hyp.verified
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-300 text-gray-600'
                                            }`}>
                                            {hyp.option}
                                        </span>
                                        <div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${hyp.verified
                                                ? 'bg-green-200 text-green-800'
                                                : 'bg-red-200 text-red-800'
                                                }`}>
                                                {hyp.verified ? '✓ VERIFIED' : '✗ FALSIFIED'}
                                            </span>
                                        </div>
                                    </div>
                                    {isCorrect && (
                                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                            Correct Answer
                                        </span>
                                    )}
                                </div>

                                {/* Hypothesis Statement */}
                                <div className="mb-3 p-3 bg-white/50 rounded border border-gray-200">
                                    <p className="text-sm text-gray-700 italic">"{hyp.hypothesis}"</p>
                                </div>

                                {/* Predictions */}
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">Predictions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {hyp.predictions.map((prediction, i) => (
                                            <span
                                                key={i}
                                                className={`text-xs px-2 py-1 rounded ${hyp.verified
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700 line-through'
                                                    }`}
                                            >
                                                {prediction}
                                            </span>
                                        ))}
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
                    <span className="text-sm text-primary-600">Verified Hypothesis:</span>
                    <span className="px-2 py-1 bg-primary-600 text-white rounded font-bold">{correctAnswer}</span>
                </div>
            </div>
        </div>
    );
}
