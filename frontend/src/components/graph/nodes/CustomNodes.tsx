/**
 * Custom Node Components for React Flow Knowledge Graph
 * Each node type has distinct visual styling for medical genetics entities
 */
import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeType } from '../../../types/graph';

// Node type styling configuration
const nodeTypeConfig: Record<NodeType, { color: string; bgColor: string; borderColor: string; icon: string }> = {
    finding: { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', icon: '🔍' },
    condition: { color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-300', icon: '🩺' },
    gene: { color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-300', icon: '🧬' },
    mechanism: { color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', icon: '⚙️' },
    inheritance: { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', icon: '📊' },
    treatment: { color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-300', icon: '💊' },
    test: { color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-300', icon: '🔬' },
    prognosis: { color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', icon: '📈' },
    population: { color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', icon: '👥' },
};

interface BaseNodeData {
    label: string;
    type: NodeType;
    properties?: Record<string, unknown>;
    isHighlighted?: boolean;
    isSelected?: boolean;
}

// Base node component with common styling
const BaseNode = memo(({ data, isConnectable }: NodeProps<BaseNodeData>) => {
    const config = nodeTypeConfig[data.type] || nodeTypeConfig.finding;
    const highlightClass = data.isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2' : '';
    const selectedClass = data.isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : '';

    return (
        <div
            className={`
                px-4 py-2 rounded-lg border-2 shadow-sm
                ${config.bgColor} ${config.borderColor}
                ${highlightClass} ${selectedClass}
                transition-all duration-200 hover:shadow-md
                min-w-[120px] max-w-[200px]
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="!bg-gray-400 !w-2 !h-2"
            />
            <div className="flex items-center gap-2">
                <span className="text-lg">{config.icon}</span>
                <span className={`font-medium text-sm ${config.color} truncate`}>
                    {data.label}
                </span>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="!bg-gray-400 !w-2 !h-2"
            />
        </div>
    );
});

BaseNode.displayName = 'BaseNode';

// Specialized node components
export const FindingNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'finding' }} />
));
FindingNode.displayName = 'FindingNode';

export const ConditionNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'condition' }} />
));
ConditionNode.displayName = 'ConditionNode';

export const GeneNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'gene' }} />
));
GeneNode.displayName = 'GeneNode';

export const MechanismNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'mechanism' }} />
));
MechanismNode.displayName = 'MechanismNode';

export const InheritanceNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'inheritance' }} />
));
InheritanceNode.displayName = 'InheritanceNode';

export const TreatmentNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'treatment' }} />
));
TreatmentNode.displayName = 'TreatmentNode';

export const TestNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'test' }} />
));
TestNode.displayName = 'TestNode';

export const PrognosisNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'prognosis' }} />
));
PrognosisNode.displayName = 'PrognosisNode';

export const PopulationNode = memo((props: NodeProps<BaseNodeData>) => (
    <BaseNode {...props} data={{ ...props.data, type: 'population' }} />
));
PopulationNode.displayName = 'PopulationNode';

// Node types map for React Flow
export const nodeTypes = {
    finding: FindingNode,
    condition: ConditionNode,
    gene: GeneNode,
    mechanism: MechanismNode,
    inheritance: InheritanceNode,
    treatment: TreatmentNode,
    test: TestNode,
    prognosis: PrognosisNode,
    population: PopulationNode,
    // Default fallback
    default: BaseNode,
};

export default BaseNode;
