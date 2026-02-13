/**
 * GraphLegend - Legend component for knowledge graph visualization
 * Shows node types and edge relationship types
 */
import { useState } from 'react';
import type { NodeType } from '../../types/graph';

interface NodeTypeConfig {
    color: string;
    bgColor: string;
    icon: string;
}

interface EdgeStyleConfig {
    stroke: string;
    animated: boolean;
    dashed: boolean;
}

interface GraphLegendProps {
    nodeTypes: Record<NodeType, NodeTypeConfig>;
    edgeStyles: Record<string, EdgeStyleConfig>;
}

const nodeTypeLabels: Record<NodeType, string> = {
    finding: 'Clinical Finding',
    condition: 'Condition/Disease',
    gene: 'Gene',
    mechanism: 'Mechanism',
    inheritance: 'Inheritance Pattern',
    treatment: 'Treatment',
    test: 'Diagnostic Test',
    prognosis: 'Prognosis',
    population: 'Population',
};

const edgeStyleLabels: Record<string, string> = {
    HAS_FINDING: 'Has Finding',
    CAUSED_BY: 'Caused By',
    CAUSES: 'Causes',
    TREATED_BY: 'Treated By',
    DIAGNOSED_BY: 'Diagnosed By',
    HAS_MECHANISM: 'Has Mechanism',
    HAS_INHERITANCE: 'Inherited As',
    ASSOCIATED_WITH: 'Associated With',
    DIFFERENTIAL: 'Differential Diagnosis',
    RISK_FACTOR: 'Risk Factor',
    EXCLUDES: 'Excludes',
    SUPPORTS: 'Supports',
    OPPOSES: 'Opposes',
    INHERITED_AS: 'Inherited As',
};

export function GraphLegend({ nodeTypes, edgeStyles }: GraphLegendProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-t-lg"
            >
                <span>Legend</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 py-3 border-t border-gray-100">
                    {/* Node Types */}
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Node Types
                        </h4>
                        <div className="space-y-1.5">
                            {Object.entries(nodeTypes).map(([type, config]) => (
                                <div key={type} className="flex items-center gap-2">
                                    <div
                                        className={`w-6 h-6 rounded flex items-center justify-center text-xs ${config.bgColor} border border-gray-200`}
                                    >
                                        {config.icon}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                        {nodeTypeLabels[type as NodeType] || type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Edge Types */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Relationships
                        </h4>
                        <div className="space-y-1.5">
                            {Object.entries(edgeStyles).slice(0, 6).map(([relationship, config]) => (
                                <div key={relationship} className="flex items-center gap-2">
                                    <div className="w-8 h-0.5 flex items-center">
                                        <div
                                            className={`w-full h-0.5 ${config.dashed ? 'border-dashed' : ''}`}
                                            style={{
                                                backgroundColor: config.stroke,
                                                borderStyle: config.dashed ? 'dashed' : 'solid',
                                                borderWidth: config.dashed ? '1px' : '0',
                                            }}
                                        />
                                        <div
                                            className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4"
                                            style={{ borderBottomColor: config.stroke, transform: 'rotate(90deg)', marginLeft: '-2px' }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-600">
                                        {edgeStyleLabels[relationship] || relationship}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GraphLegend;
