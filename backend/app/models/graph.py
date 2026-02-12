"""
Graph models for knowledge graph storage and retrieval.
Compatible with FalkorDB graph database structure.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class NodeType(str, Enum):
    """Types of nodes in the medical genetics knowledge graph."""
    FINDING = "finding"           # Clinical finding or symptom
    CONDITION = "condition"       # Disease or condition
    GENE = "gene"                 # Gene
    MECHANISM = "mechanism"       # Pathophysiological mechanism
    INHERITANCE = "inheritance"   # Inheritance pattern
    TREATMENT = "treatment"       # Treatment or intervention
    TEST = "test"                 # Diagnostic test
    PROGNOSIS = "prognosis"       # Prognostic information
    POPULATION = "population"     # Population/ethnicity risk factors


class RelationType(str, Enum):
    """Types of relationships in the knowledge graph."""
    HAS_FINDING = "HAS_FINDING"
    CAUSED_BY = "CAUSED_BY"
    CAUSES = "CAUSES"
    TREATED_BY = "TREATED_BY"
    DIAGNOSED_BY = "DIAGNOSED_BY"
    HAS_MECHANISM = "HAS_MECHANISM"
    HAS_INHERITANCE = "HAS_INHERITANCE"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    DIFFERENTIAL = "DIFFERENTIAL"
    RISK_FACTOR = "RISK_FACTOR"
    EXCLUDES = "EXCLUDES"
    SUPPORTS = "SUPPORTS"


class GraphNode(BaseModel):
    """A node in the knowledge graph."""
    id: str
    type: NodeType
    name: str
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        use_enum_values = True


class GraphEdge(BaseModel):
    """An edge (relationship) in the knowledge graph."""
    id: Optional[str] = None
    source: str
    target: str
    relationship: str
    weight: Optional[float] = 1.0
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)


class KnowledgeGraph(BaseModel):
    """Complete knowledge graph structure."""
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
    
    def get_node_by_id(self, node_id: str) -> Optional[GraphNode]:
        """Get a node by its ID."""
        for node in self.nodes:
            if node.id == node_id:
                return node
        return None
    
    def get_edges_for_node(self, node_id: str) -> List[GraphEdge]:
        """Get all edges connected to a node."""
        return [
            edge for edge in self.edges
            if edge.source == node_id or edge.target == node_id
        ]
    
    def get_outgoing_edges(self, node_id: str) -> List[GraphEdge]:
        """Get all outgoing edges from a node."""
        return [edge for edge in self.edges if edge.source == node_id]
    
    def get_incoming_edges(self, node_id: str) -> List[GraphEdge]:
        """Get all incoming edges to a node."""
        return [edge for edge in self.edges if edge.target == node_id]


class GraphQueryResult(BaseModel):
    """Result of a graph database query."""
    success: bool
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
    raw_results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


class ReasoningPath(BaseModel):
    """A reasoning path through the knowledge graph."""
    start_node: str
    end_node: str
    path: List[str]  # Node IDs in order
    relationships: List[str]  # Relationship types in order
    confidence: float
    explanation: str


class AssociationResult(BaseModel):
    """Result of association-based reasoning."""
    query_findings: List[str]
    associated_conditions: List[Dict[str, Any]]  # [{condition_id, condition_name, score, evidence}]
    reasoning_paths: List[ReasoningPath]
    graph: Optional[KnowledgeGraph] = None
