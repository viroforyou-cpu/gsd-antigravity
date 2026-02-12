import { useState } from 'react';
import type {
    AllReasoningResult,
    ReasoningStrategy
} from '../../types/reasoning';
import { AssociationView } from './AssociationView';
import { HypotheticoView } from './HypotheticoView';
import { ConstraintsView } from './ConstraintsView';
import { ArgumentsView } from './ArgumentsView';

interface ReasoningViewerProps {
    reasoning: {
        association?: AllReasoningResult;
        hypothetico?: AllReasoningResult;
        constraints?: AllReasoningResult;
        arguments?: AllReasoningResult;
    };
    correctAnswer: string;
}

type TabId = ReasoningStrategy;

const tabs: { id: TabId; label: string; description: string }[] = [
    { id: 'association', label: 'Association', description: 'Knowledge graph connections' },
    { id: 'hypothetico', label: 'Hypothesis Testing', description: 'Verify/falsify diagnoses' },
    { id: 'constraints', label: 'Constraints', description: 'Elimination approach' },
    { id: 'arguments', label: 'Arguments', description: 'Pros and cons analysis' },
];

export function ReasoningViewer({ reasoning, correctAnswer }: ReasoningViewerProps) {
    const [activeTab, setActiveTab] = useState<TabId>('association');

    const renderReasoningContent = () => {
        switch (activeTab) {
            case 'association':
                return reasoning.association ? (
                    <AssociationView reasoning={reasoning.association} correctAnswer={correctAnswer} />
                ) : (
                    <NoDataMessage strategy="association" />
                );
            case 'hypothetico':
                return reasoning.hypothetico ? (
                    <HypotheticoView reasoning={reasoning.hypothetico} correctAnswer={correctAnswer} />
                ) : (
                    <NoDataMessage strategy="hypothetico" />
                );
            case 'constraints':
                return reasoning.constraints ? (
                    <ConstraintsView reasoning={reasoning.constraints} correctAnswer={correctAnswer} />
                ) : (
                    <NoDataMessage strategy="constraints" />
                );
            case 'arguments':
                return reasoning.arguments ? (
                    <ArgumentsView reasoning={reasoning.arguments} correctAnswer={correctAnswer} />
                ) : (
                    <NoDataMessage strategy="arguments" />
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex -mb-px" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm
                                transition-colors duration-150
                                ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            <div>
                                <span className="block">{tab.label}</span>
                                <span className="block text-xs text-gray-400 mt-0.5">{tab.description}</span>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {renderReasoningContent()}
            </div>
        </div>
    );
}

function NoDataMessage({ strategy }: { strategy: string }) {
    return (
        <div className="text-center py-8 text-gray-500">
            <p>No {strategy} reasoning data available for this question.</p>
        </div>
    );
}
