export type NodeType =
    | 'finding'
    | 'condition'
    | 'gene'
    | 'mechanism'
    | 'inheritance'
    | 'treatment'
    | 'test'
    | 'prognosis'
    | 'population';

export type EdgeRelationship =
    | 'HAS_FINDING'
    | 'CAUSED_BY'
    | 'CAUSES'
    | 'TREATED_BY'
    | 'DIAGNOSED_BY'
    | 'HAS_MECHANISM'
    | 'HAS_INHERITANCE'
    | 'ASSOCIATED_WITH'
    | 'DIFFERENTIAL'
    | 'RISK_FACTOR'
    | 'EXCLUDES'
    | 'SUPPORTS';

export interface GraphNode {
    id: string;
    type: NodeType;
    name: string;
    properties?: Record<string, unknown>;
}

export interface GraphEdge {
    id?: string;
    source: string;
    target: string;
    relationship: string;
    weight?: number;
    properties?: Record<string, unknown>;
}

export interface KnowledgeGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface ReasoningPath {
    start_node: string;
    end_node: string;
    path: string[];
    relationships: string[];
    confidence: number;
    explanation: string;
}

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

export interface GraphQueryResult {
    success: boolean;
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    raw_results?: unknown[];
    error?: string;
}
