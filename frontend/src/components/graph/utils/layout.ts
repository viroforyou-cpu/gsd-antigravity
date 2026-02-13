/**
 * Layout utilities for React Flow using Dagre
 */
import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export interface LayoutOptions {
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    nodeWidth?: number;
    nodeHeight?: number;
    nodeSpacing?: number;
    rankSpacing?: number;
}

const defaultOptions: LayoutOptions = {
    direction: 'TB',
    nodeWidth: 180,
    nodeHeight: 60,
    nodeSpacing: 60,
    rankSpacing: 100,
};

/**
 * Apply automatic layout to nodes and edges using Dagre
 */
export function getLayoutedElements(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
    const opts = { ...defaultOptions, ...options };

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure graph layout
    dagreGraph.setGraph({
        rankdir: opts.direction,
        nodesep: opts.nodeSpacing,
        ranksep: opts.rankSpacing,
        marginx: 50,
        marginy: 50,
    });

    // Add nodes to dagre graph
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: opts.nodeWidth,
            height: opts.nodeHeight,
        });
    });

    // Add edges to dagre graph
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Apply layout
    dagre.layout(dagreGraph);

    // Get positioned nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - opts.nodeWidth! / 2,
                y: nodeWithPosition.y - opts.nodeHeight! / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}

/**
 * Convert knowledge graph data to React Flow format
 */
export function convertToReactFlowFormat(
    graphData: { nodes: Array<{ id: string; type: string; name: string; properties?: Record<string, unknown> }> },
    edges: Array<{ id?: string; source: string; target: string; relationship: string; weight?: number }>
): { nodes: Node[]; edges: Edge[] } {
    // Edge relationship styling
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

    const convertedNodes: Node[] = graphData.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
            label: node.name,
            type: node.type,
            properties: node.properties,
        },
    }));

    const convertedEdges: Edge[] = edges.map((edge, index) => {
        const style = edgeStyleConfig[edge.relationship] || edgeStyleConfig.HAS_FINDING;
        return {
            id: edge.id || `edge-${index}`,
            source: edge.source,
            target: edge.target,
            label: edge.relationship.replace(/_/g, ' '),
            animated: style.animated,
            style: {
                stroke: style.stroke,
                strokeWidth: 2,
            },
            labelStyle: { fill: '#6B7280', fontSize: 10 },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
            data: {
                relationship: edge.relationship,
                weight: edge.weight,
            },
        };
    });

    return { nodes: convertedNodes, edges: convertedEdges };
}

export default getLayoutedElements;
