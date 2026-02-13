/**
 * KnowledgeGraph - Interactive knowledge graph visualization component
 * Uses React Flow for graph rendering with custom node and edge styling
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    BackgroundVariant,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { KnowledgeGraph as KnowledgeGraphType, GraphNode, GraphEdge, NodeType } from '../../types/graph';
import { nodeTypes } from './nodes/CustomNodes';
import { getLayoutedElements, convertToReactFlowFormat } from './utils/layout';
import { GraphLegend } from './GraphLegend';
import { GraphControls } from './GraphControls';

interface KnowledgeGraphProps {
    graph: KnowledgeGraphType;
    height?: number;
    showLegend?: boolean;
    showControls?: boolean;
    highlightNode?: string;
    highlightPath?: string[];
    onNodeClick?: (node: GraphNode) => void;
    onEdgeClick?: (edge: GraphEdge) => void;
}

// Node type styling configuration for legend
const nodeTypeConfig: Record<NodeType, { color: string; bgColor: string; icon: string }> = {
    finding: { color: 'bg-blue-500', bgColor: 'bg-blue-50', icon: '🔍' },
    condition: { color: 'bg-red-500', bgColor: 'bg-red-50', icon: '🩺' },
    gene: { color: 'bg-green-500', bgColor: 'bg-green-50', icon: '🧬' },
    mechanism: { color: 'bg-purple-500', bgColor: 'bg-purple-50', icon: '⚙️' },
    inheritance: { color: 'bg-orange-500', bgColor: 'bg-orange-50', icon: '📊' },
    treatment: { color: 'bg-teal-500', bgColor: 'bg-teal-50', icon: '💊' },
    test: { color: 'bg-cyan-500', bgColor: 'bg-cyan-50', icon: '🔬' },
    prognosis: { color: 'bg-yellow-500', bgColor: 'bg-yellow-50', icon: '📈' },
    population: { color: 'bg-gray-500', bgColor: 'bg-gray-50', icon: '👥' },
};

// Edge relationship styling for legend
const edgeStyleConfig: Record<string, { stroke: string; animated: boolean; dashed: boolean }> = {
    HAS_FINDING: { stroke: '#6B7280', animated: false, dashed: false },
    CAUSED_BY: { stroke: '#EF4444', animated: false, dashed: true },
    CAUSES: { stroke: '#EF4444', animated: false, dashed: true },
    TREATED_BY: { stroke: '#14B8A6', animated: false, dashed: false },
    DIAGNOSED_BY: { stroke: '#06B6D4', animated: false, dashed: false },
    HAS_MECHANISM: { stroke: '#8B5CF6', animated: false, dashed: false },
    HAS_INHERITANCE: { stroke: '#F97316', animated: false, dashed: false },
    ASSOCIATED_WITH: { stroke: '#6B7280', animated: false, dashed: true },
    DIFFERENTIAL: { stroke: '#8B5CF6', animated: false, dashed: true },
    RISK_FACTOR: { stroke: '#F59E0B', animated: false, dashed: false },
    EXCLUDES: { stroke: '#EF4444', animated: true, dashed: true },
    SUPPORTS: { stroke: '#22C55E', animated: true, dashed: false },
    OPPOSES: { stroke: '#EF4444', animated: true, dashed: false },
    INHERITED_AS: { stroke: '#F97316', animated: false, dashed: false },
};

export function KnowledgeGraph({
    graph,
    height = 500,
    showLegend = true,
    showControls = true,
    highlightNode,
    highlightPath = [],
    onNodeClick,
}: KnowledgeGraphProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    // Convert and layout graph data when it changes
    useEffect(() => {
        if (graph.nodes.length === 0) return;

        // Convert to React Flow format
        const { nodes: convertedNodes, edges: convertedEdges } = convertToReactFlowFormat(
            graph,
            graph.edges
        );

        // Apply highlighting
        const nodesWithHighlight = convertedNodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                isHighlighted: highlightNode === node.id || highlightPath.includes(node.id),
                isSelected: selectedNode === node.id,
            },
        }));

        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodesWithHighlight,
            convertedEdges,
            { direction: 'TB' }
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [graph, highlightNode, highlightPath, selectedNode, setNodes, setEdges]);

    // Handle node click
    const handleNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            setSelectedNode(node.id);
            if (onNodeClick) {
                const graphNode = graph.nodes.find((n) => n.id === node.id);
                if (graphNode) {
                    onNodeClick(graphNode);
                }
            }
        },
        [graph.nodes, onNodeClick]
    );

    // Minimap node color function
    const minimapNodeColor = useCallback((node: Node) => {
        const type = node.type as NodeType;
        const config = nodeTypeConfig[type];
        if (config) {
            // Return the background color without the Tailwind class
            const colorMap: Record<string, string> = {
                'bg-blue-50': '#EFF6FF',
                'bg-red-50': '#FEF2F2',
                'bg-green-50': '#F0FDF4',
                'bg-purple-50': '#FAF5FF',
                'bg-orange-50': '#FFF7ED',
                'bg-teal-50': '#F0FDFA',
                'bg-cyan-50': '#ECFEFF',
                'bg-yellow-50': '#FEFCE8',
                'bg-gray-50': '#F9FAFB',
            };
            return colorMap[config.bgColor] || '#F9FAFB';
        }
        return '#F9FAFB';
    }, []);

    return (
        <div className="relative w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div style={{ height }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.2}
                    maxZoom={2}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                    }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <Controls showInteractive={false} />
                    <MiniMap
                        nodeColor={minimapNodeColor}
                        nodeStrokeWidth={3}
                        zoomable
                        pannable
                    />
                    {showControls && (
                        <Panel position="top-right">
                            <GraphControls />
                        </Panel>
                    )}
                </ReactFlow>
            </div>

            {/* Legend */}
            {showLegend && <GraphLegend nodeTypes={nodeTypeConfig} edgeStyles={edgeStyleConfig} />}
        </div>
    );
}

export default KnowledgeGraph;
