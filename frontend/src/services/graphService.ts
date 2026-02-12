/**
 * Graph Service - handles all knowledge graph API interactions
 */
import api from './api';
import type { KnowledgeGraph, GraphNode, GraphEdge } from '../types/graph';

export interface AssociationResult {
    query_findings: string[];
    associated_conditions: Array<{
        condition_id: string;
        condition_name: string;
        score: number;
        evidence: string[];
    }>;
    reasoning_paths: ReasoningPath[];
    graph?: KnowledgeGraph;
    error?: string;
}

export interface ReasoningPath {
    start_node: string;
    end_node: string;
    path: string[];
    relationships: string[];
    confidence: number;
    explanation: string;
}

export interface GraphStatus {
    service_type: 'mock' | 'falkordb';
    falkordb_host: string | null;
    falkordb_port: number | null;
    graph_name: string;
    status: string;
}

/**
 * Get the knowledge graph for a specific question
 */
export async function getGraphForQuestion(questionId: string): Promise<KnowledgeGraph> {
    const response = await api.get<KnowledgeGraph>(`/graph/question/${questionId}`);
    return response.data;
}

/**
 * Find conditions associated with clinical findings
 */
export async function findAssociations(findings: string[], maxDepth: number = 2): Promise<AssociationResult> {
    const response = await api.post<AssociationResult>('/graph/associations', {
        findings,
        max_depth: maxDepth,
    });
    return response.data;
}

/**
 * Find conditions associated with clinical findings (GET version)
 */
export async function findAssociationsGet(findings: string[]): Promise<AssociationResult> {
    const findingsParam = findings.join(',');
    const response = await api.get<AssociationResult>(`/graph/associations`, {
        params: { findings: findingsParam },
    });
    return response.data;
}

/**
 * Find a reasoning path from findings to a condition
 */
export async function findReasoningPath(
    findings: string[],
    targetCondition: string
): Promise<ReasoningPath> {
    const response = await api.post<ReasoningPath>('/graph/reasoning-path', null, {
        params: {
            findings: findings.join(','),
            target_condition: targetCondition,
        },
    });
    return response.data;
}

/**
 * Add a node to the knowledge graph
 */
export async function addNode(node: {
    id: string;
    type: string;
    name: string;
    properties?: Record<string, unknown>;
}): Promise<{ success: boolean; node_id: string }> {
    const response = await api.post<{ success: boolean; node_id: string }>('/graph/nodes', node);
    return response.data;
}

/**
 * Add an edge to the knowledge graph
 */
export async function addEdge(edge: {
    source: string;
    target: string;
    relationship: string;
    weight?: number;
    properties?: Record<string, unknown>;
}): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/graph/edges', edge);
    return response.data;
}

/**
 * Get a specific node by ID
 */
export async function getNode(nodeId: string): Promise<GraphNode> {
    const response = await api.get<GraphNode>(`/graph/nodes/${nodeId}`);
    return response.data;
}

/**
 * Get nodes connected to a specific node
 */
export async function getConnectedNodes(
    nodeId: string,
    relationship?: string,
    maxDepth: number = 1
): Promise<GraphNode[]> {
    const response = await api.get<GraphNode[]>(`/graph/nodes/${nodeId}/connected`, {
        params: {
            relationship,
            max_depth: maxDepth,
        },
    });
    return response.data;
}

/**
 * Execute a raw Cypher query
 */
export async function executeQuery(query: string): Promise<{
    success: boolean;
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    raw_results?: unknown[];
    error?: string;
}> {
    const response = await api.post('/graph/query', { query });
    return response.data;
}

/**
 * Get the graph database status
 */
export async function getGraphStatus(): Promise<GraphStatus> {
    const response = await api.get<GraphStatus>('/graph/status');
    return response.data;
}

const graphService = {
    getGraphForQuestion,
    findAssociations,
    findAssociationsGet,
    findReasoningPath,
    addNode,
    addEdge,
    getNode,
    getConnectedNodes,
    executeQuery,
    getGraphStatus,
};

export default graphService;
