import type { AssociationReasoning, AllReasoningResult } from '../../types/reasoning';

interface AssociationViewProps {
    reasoning: AllReasoningResult;
    correctAnswer: string;
}

function isAssociationReasoning(reasoning: AllReasoningResult): reasoning is AssociationReasoning {
    return reasoning.strategy === 'association';
}

export function AssociationView({ reasoning, correctAnswer }: AssociationViewProps) {
    if (!isAssociationReasoning(reasoning)) {
        return <div className="p-4 text-gray-500">Invalid reasoning type for association view</div>;
    }

    const { steps, conclusion, confidence, key_findings, linked_conditions } = reasoning;

    return (
        <div className="space-y-6">
            {/* Header with confidence */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Association Reasoning</h3>
                    <p className="text-sm text-gray-500">Knowledge graph-based diagnostic matching</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                        {Math.round(confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                </div>
            </div>

            {/* Key Findings */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Key Clinical Findings</h4>
                <div className="flex flex-wrap gap-2">
                    {key_findings.map((finding, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {finding}
                        </span>
                    ))}
                </div>
            </div>

            {/* Reasoning Steps */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Reasoning Steps</h4>
                <div className="space-y-3">
                    {steps.map((step) => (
                        <div key={step.step_number} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                                {step.step_number}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-700">{step.description}</p>
                                {step.evidence && step.evidence.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {step.evidence.map((ev, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {ev}
                                            </span>
                                        ))}
                                    </div>
                                )}
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

            {/* Linked Conditions */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Condition Associations</h4>
                <div className="space-y-3">
                    {linked_conditions.map((condition, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border ${condition.strength > 0.8
                                ? 'bg-green-50 border-green-200'
                                : condition.strength > 0.5
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{condition.condition}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${condition.strength > 0.8
                                                ? 'bg-green-500'
                                                : condition.strength > 0.5
                                                    ? 'bg-yellow-500'
                                                    : 'bg-gray-400'
                                                }`}
                                            style={{ width: `${condition.strength * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">
                                        {Math.round(condition.strength * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {condition.matching_findings.map((finding, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-white/50 text-gray-600 rounded border border-gray-200">
                                        {finding}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Conclusion */}
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                <h4 className="text-sm font-medium text-primary-800 mb-2">Conclusion</h4>
                <p className="text-sm text-primary-700">{conclusion}</p>
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-primary-600">Correct Answer:</span>
                    <span className="px-2 py-1 bg-primary-600 text-white rounded font-bold">{correctAnswer}</span>
                </div>
            </div>
        </div>
    );
}
