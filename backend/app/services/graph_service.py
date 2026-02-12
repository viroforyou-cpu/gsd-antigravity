"""
Graph Database Service - handles all knowledge graph operations.
Supports both mock implementation and FalkorDB integration.
"""
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
import json

from ..core.config import settings
from ..models.graph import (
    GraphNode, GraphEdge, KnowledgeGraph, NodeType, RelationType,
    GraphQueryResult, ReasoningPath, AssociationResult
)


class GraphServiceInterface(ABC):
    """Abstract interface for graph database services."""
    
    @abstractmethod
    async def get_graph_for_question(self, question_id: str) -> KnowledgeGraph:
        """Get the knowledge graph associated with a question."""
        pass
    
    @abstractmethod
    async def find_associations(
        self, 
        findings: List[str], 
        max_depth: int = 2
    ) -> AssociationResult:
        """Find conditions associated with given clinical findings."""
        pass
    
    @abstractmethod
    async def find_reasoning_path(
        self,
        start_findings: List[str],
        target_condition: str
    ) -> Optional[ReasoningPath]:
        """Find a reasoning path from findings to a condition."""
        pass
    
    @abstractmethod
    async def execute_query(self, query: str) -> GraphQueryResult:
        """Execute a raw Cypher query on the graph database."""
        pass
    
    @abstractmethod
    async def add_node(self, node: GraphNode) -> bool:
        """Add a node to the graph."""
        pass
    
    @abstractmethod
    async def add_edge(self, edge: GraphEdge) -> bool:
        """Add an edge to the graph."""
        pass
    
    @abstractmethod
    async def get_node(self, node_id: str) -> Optional[GraphNode]:
        """Get a node by ID."""
        pass
    
    @abstractmethod
    async def get_connected_nodes(
        self, 
        node_id: str, 
        relationship: Optional[str] = None,
        max_depth: int = 1
    ) -> List[GraphNode]:
        """Get nodes connected to a given node."""
        pass


class MockGraphService(GraphServiceInterface):
    """Mock graph service for development without FalkorDB."""
    
    def __init__(self):
        self._graphs = self._build_mock_graphs()
        self._nodes = self._build_mock_nodes()
        self._edges = self._build_mock_edges()
    
    async def get_graph_for_question(self, question_id: str) -> KnowledgeGraph:
        """Return a mock knowledge graph for a question."""
        # Return a pre-built graph based on question ID
        if question_id in self._graphs:
            return self._graphs[question_id]
        
        # Return a default graph
        return self._build_default_graph()
    
    async def find_associations(
        self, 
        findings: List[str], 
        max_depth: int = 2
    ) -> AssociationResult:
        """Find mock associations for clinical findings."""
        # Build mock association result
        associated_conditions = []
        reasoning_paths = []
        
        # Map findings to conditions
        finding_to_conditions = {
            "cherry-red spot": [
                {"condition_id": "c1", "condition_name": "Tay-Sachs disease", "score": 0.9, "evidence": ["cherry-red spot", "developmental regression"]},
                {"condition_id": "c2", "condition_name": "Niemann-Pick type A", "score": 0.7, "evidence": ["cherry-red spot", "hepatosplenomegaly"]},
            ],
            "developmental regression": [
                {"condition_id": "c1", "condition_name": "Tay-Sachs disease", "score": 0.85, "evidence": ["developmental regression", "startle response"]},
                {"condition_id": "c3", "condition_name": "Sandhoff disease", "score": 0.75, "evidence": ["developmental regression"]},
            ],
            "hepatosplenomegaly": [
                {"condition_id": "c2", "condition_name": "Niemann-Pick type A", "score": 0.9, "evidence": ["hepatosplenomegaly", "cherry-red spot"]},
                {"condition_id": "c4", "condition_name": "Gaucher disease", "score": 0.8, "evidence": ["hepatosplenomegaly", "bone pain"]},
            ],
            "startle response": [
                {"condition_id": "c1", "condition_name": "Tay-Sachs disease", "score": 0.95, "evidence": ["startle response", "cherry-red spot"]},
            ],
            "absent hexosaminidase A": [
                {"condition_id": "c1", "condition_name": "Tay-Sachs disease", "score": 1.0, "evidence": ["absent hexosaminidase A"]},
            ]
        }
        
        # Aggregate conditions based on findings
        condition_scores: Dict[str, Dict[str, Any]] = {}
        for finding in findings:
            finding_lower = finding.lower()
            for key, conditions in finding_to_conditions.items():
                if key in finding_lower or finding_lower in key:
                    for cond in conditions:
                        cond_id = cond["condition_id"]
                        if cond_id not in condition_scores:
                            condition_scores[cond_id] = {
                                "condition_id": cond_id,
                                "condition_name": cond["condition_name"],
                                "score": 0,
                                "evidence": []
                            }
                        condition_scores[cond_id]["score"] += cond["score"] / len(findings)
                        for ev in cond["evidence"]:
                            if ev not in condition_scores[cond_id]["evidence"]:
                                condition_scores[cond_id]["evidence"].append(ev)
        
        associated_conditions = list(condition_scores.values())
        associated_conditions.sort(key=lambda x: x["score"], reverse=True)
        
        # Build reasoning paths for top conditions
        for cond in associated_conditions[:3]:
            path = ReasoningPath(
                start_node=findings[0] if findings else "unknown",
                end_node=cond["condition_name"],
                path=[findings[0] if findings else "unknown"] + cond["evidence"] + [cond["condition_name"]],
                relationships=["HAS_FINDING"] * (len(cond["evidence"]) + 1),
                confidence=cond["score"],
                explanation=f"Path from {findings[0]} to {cond['condition_name']} via {', '.join(cond['evidence'])}"
            )
            reasoning_paths.append(path)
        
        return AssociationResult(
            query_findings=findings,
            associated_conditions=associated_conditions[:5],
            reasoning_paths=reasoning_paths
        )
    
    async def find_reasoning_path(
        self,
        start_findings: List[str],
        target_condition: str
    ) -> Optional[ReasoningPath]:
        """Find a mock reasoning path."""
        # Build a simple mock path
        if not start_findings:
            return None
        
        return ReasoningPath(
            start_node=start_findings[0],
            end_node=target_condition,
            path=start_findings + [target_condition],
            relationships=["ASSOCIATED_WITH"] * len(start_findings),
            confidence=0.85,
            explanation=f"Clinical findings {', '.join(start_findings)} suggest {target_condition}"
        )
    
    async def execute_query(self, query: str) -> GraphQueryResult:
        """Execute a mock query."""
        return GraphQueryResult(
            success=True,
            nodes=list(self._nodes.values())[:5],
            edges=list(self._edges.values())[:5],
            raw_results=[{"query": query, "mock": True}]
        )
    
    async def add_node(self, node: GraphNode) -> bool:
        """Add a node to mock storage."""
        self._nodes[node.id] = node
        return True
    
    async def add_edge(self, edge: GraphEdge) -> bool:
        """Add an edge to mock storage."""
        if not edge.id:
            edge.id = f"e_{edge.source}_{edge.target}"
        self._edges[edge.id] = edge
        return True
    
    async def get_node(self, node_id: str) -> Optional[GraphNode]:
        """Get a node from mock storage."""
        return self._nodes.get(node_id)
    
    async def get_connected_nodes(
        self, 
        node_id: str, 
        relationship: Optional[str] = None,
        max_depth: int = 1
    ) -> List[GraphNode]:
        """Get connected nodes from mock storage."""
        connected = []
        for edge in self._edges.values():
            if edge.source == node_id:
                if relationship is None or edge.relationship == relationship:
                    target = self._nodes.get(edge.target)
                    if target:
                        connected.append(target)
            elif edge.target == node_id:
                if relationship is None or edge.relationship == relationship:
                    source = self._nodes.get(edge.source)
                    if source:
                        connected.append(source)
        return connected
    
    def _build_mock_nodes(self) -> Dict[str, GraphNode]:
        """Build mock nodes for development."""
        return {
            "n1": GraphNode(id="n1", type=NodeType.FINDING, name="cherry-red spot"),
            "n2": GraphNode(id="n2", type=NodeType.FINDING, name="hepatosplenomegaly"),
            "n3": GraphNode(id="n3", type=NodeType.FINDING, name="developmental regression"),
            "n4": GraphNode(id="n4", type=NodeType.FINDING, name="startle response"),
            "n5": GraphNode(id="n5", type=NodeType.FINDING, name="absent hexosaminidase A"),
            "n6": GraphNode(id="n6", type=NodeType.CONDITION, name="Tay-Sachs disease"),
            "n7": GraphNode(id="n7", type=NodeType.CONDITION, name="Niemann-Pick type A"),
            "n8": GraphNode(id="n8", type=NodeType.CONDITION, name="Gaucher disease"),
            "n9": GraphNode(id="n9", type=NodeType.GENE, name="HEXA gene"),
            "n10": GraphNode(id="n10", type=NodeType.GENE, name="SMPD1 gene"),
            "n11": GraphNode(id="n11", type=NodeType.MECHANISM, name="lysosomal storage"),
            "n12": GraphNode(id="n12", type=NodeType.INHERITANCE, name="autosomal recessive"),
            "n13": GraphNode(id="n13", type=NodeType.POPULATION, name="Ashkenazi Jewish"),
        }
    
    def _build_mock_edges(self) -> Dict[str, GraphEdge]:
        """Build mock edges for development."""
        return {
            "e1": GraphEdge(id="e1", source="n6", target="n1", relationship="HAS_FINDING", weight=0.9),
            "e2": GraphEdge(id="e2", source="n6", target="n3", relationship="HAS_FINDING", weight=0.95),
            "e3": GraphEdge(id="e3", source="n6", target="n4", relationship="HAS_FINDING", weight=0.9),
            "e4": GraphEdge(id="e4", source="n6", target="n5", relationship="HAS_FINDING", weight=1.0),
            "e5": GraphEdge(id="e5", source="n6", target="n9", relationship="CAUSED_BY", weight=1.0),
            "e6": GraphEdge(id="e6", source="n6", target="n12", relationship="HAS_INHERITANCE", weight=1.0),
            "e7": GraphEdge(id="e7", source="n6", target="n13", relationship="RISK_FACTOR", weight=0.8),
            "e8": GraphEdge(id="e8", source="n7", target="n1", relationship="HAS_FINDING", weight=0.6),
            "e9": GraphEdge(id="e9", source="n7", target="n2", relationship="HAS_FINDING", weight=0.9),
            "e10": GraphEdge(id="e10", source="n7", target="n10", relationship="CAUSED_BY", weight=1.0),
            "e11": GraphEdge(id="e11", source="n8", target="n2", relationship="HAS_FINDING", weight=0.8),
            "e12": GraphEdge(id="e12", source="n9", target="n11", relationship="ASSOCIATED_WITH", weight=0.9),
        }
    
    def _build_mock_graphs(self) -> Dict[str, KnowledgeGraph]:
        """Build mock graphs for specific questions."""
        return {
            "q001": KnowledgeGraph(
                nodes=list(self._build_mock_nodes().values()),
                edges=list(self._build_mock_edges().values())
            ),
            "q002": KnowledgeGraph(
                nodes=[
                    GraphNode(id="n1", type=NodeType.FINDING, name="hypotonia"),
                    GraphNode(id="n2", type=NodeType.FINDING, name="feeding difficulties"),
                    GraphNode(id="n3", type=NodeType.FINDING, name="low-set ears"),
                    GraphNode(id="n4", type=NodeType.CONDITION, name="Cri-du-chat syndrome"),
                    GraphNode(id="n5", type=NodeType.CONDITION, name="Down syndrome"),
                    GraphNode(id="n6", type=NodeType.MECHANISM, name="5p deletion"),
                    GraphNode(id="n7", type=NodeType.MECHANISM, name="trisomy 21"),
                ],
                edges=[
                    GraphEdge(id="e1", source="n4", target="n1", relationship="HAS_FINDING", weight=0.9),
                    GraphEdge(id="e2", source="n4", target="n2", relationship="HAS_FINDING", weight=0.8),
                    GraphEdge(id="e3", source="n4", target="n3", relationship="HAS_FINDING", weight=0.7),
                    GraphEdge(id="e4", source="n4", target="n6", relationship="CAUSED_BY", weight=1.0),
                    GraphEdge(id="e5", source="n5", target="n1", relationship="HAS_FINDING", weight=0.8),
                    GraphEdge(id="e6", source="n5", target="n7", relationship="CAUSED_BY", weight=1.0),
                ]
            )
        }
    
    def _build_default_graph(self) -> KnowledgeGraph:
        """Build a default graph for unknown questions."""
        return KnowledgeGraph(
            nodes=[
                GraphNode(id="n1", type=NodeType.FINDING, name="Clinical presentation"),
                GraphNode(id="n2", type=NodeType.CONDITION, name="Suspected condition"),
                GraphNode(id="n3", type=NodeType.MECHANISM, name="Underlying mechanism"),
            ],
            edges=[
                GraphEdge(id="e1", source="n2", target="n1", relationship="HAS_FINDING", weight=0.8),
                GraphEdge(id="e2", source="n2", target="n3", relationship="CAUSED_BY", weight=0.9),
            ]
        )


class FalkorDBService(GraphServiceInterface):
    """FalkorDB graph database service implementation."""
    
    def __init__(self):
        self.host = settings.falkordb_host
        self.port = settings.falkordb_port
        self.username = settings.falkordb_username
        self.password = settings.falkordb_password
        self.graph_name = settings.falkordb_graph_name
        self._client = None
        self._graph = None
    
    async def _get_client(self):
        """Get or create the FalkorDB client."""
        if self._client is None:
            try:
                from falkordb import FalkorDB
                
                self._client = FalkorDB(
                    host=self.host,
                    port=self.port,
                    username=self.username if self.username else None,
                    password=self.password if self.password else None
                )
                self._graph = self._client.select_graph(self.graph_name)
            except ImportError:
                raise ImportError("falkordb package required. Install with: pip install falkordb")
        return self._graph
    
    async def get_graph_for_question(self, question_id: str) -> KnowledgeGraph:
        """Get the knowledge graph for a question from FalkorDB."""
        client = await self._get_client()
        
        # Query to get all nodes and edges related to a question
        query = """
        MATCH (q:Question {id: $question_id})-[:HAS_GRAPH]->(g:Graph)
        MATCH (g)-[:CONTAINS]->(n)
        OPTIONAL MATCH (n)-[r]->(m)
        WHERE (g)-[:CONTAINS]->(m)
        RETURN n, r, m
        """
        
        try:
            result = client.query(query, {"question_id": question_id})
            return self._parse_query_result_to_graph(result)
        except Exception as e:
            # Return empty graph on error
            return KnowledgeGraph(nodes=[], edges=[])
    
    async def find_associations(
        self, 
        findings: List[str], 
        max_depth: int = 2
    ) -> AssociationResult:
        """Find conditions associated with clinical findings using graph traversal."""
        client = await self._get_client()
        
        # Build Cypher query for association finding
        finding_list = "', '".join(findings)
        query = f"""
        MATCH (f:Finding)
        WHERE f.name IN ['{finding_list}']
        MATCH (f)-[:ASSOCIATED_WITH|HAS_FINDING*1..{max_depth}]-(c:Condition)
        WITH c, COUNT(f) as finding_count, COLLECT(f.name) as matched_findings
        RETURN c.id as condition_id, c.name as condition_name, 
               finding_count as score, matched_findings as evidence
        ORDER BY score DESC
        LIMIT 5
        """
        
        try:
            result = client.query(query)
            return self._parse_association_result(result, findings)
        except Exception as e:
            return AssociationResult(
                query_findings=findings,
                associated_conditions=[],
                reasoning_paths=[],
                error=str(e)
            )
    
    async def find_reasoning_path(
        self,
        start_findings: List[str],
        target_condition: str
    ) -> Optional[ReasoningPath]:
        """Find a reasoning path from findings to condition."""
        client = await self._get_client()
        
        finding_list = "', '".join(start_findings)
        query = f"""
        MATCH path = SHORTESTPATH(
            (f:Finding)-[:ASSOCIATED_WITH|HAS_FINDING*]-(c:Condition {{name: '{target_condition}'}})
        )
        WHERE f.name IN ['{finding_list}']
        RETURN [n in nodes(path) | n.name] as node_names,
               [r in relationships(path) | type(r)] as rel_types,
               length(path) as path_length
        ORDER BY path_length
        LIMIT 1
        """
        
        try:
            result = client.query(query)
            if result.result_set:
                row = result.result_set[0]
                return ReasoningPath(
                    start_node=start_findings[0],
                    end_node=target_condition,
                    path=row[0],
                    relationships=row[1],
                    confidence=1.0 / (row[2] + 1),  # Higher confidence for shorter paths
                    explanation=f"Path found via {', '.join(row[0])}"
                )
        except Exception:
            pass
        
        return None
    
    async def execute_query(self, query: str) -> GraphQueryResult:
        """Execute a raw Cypher query."""
        client = await self._get_client()
        
        try:
            result = client.query(query)
            # FalkorDB returns a ResultSet object with different structure
            raw_results = []
            if result and hasattr(result, 'result_set') and result.result_set:
                for row in result.result_set:
                    if isinstance(row, dict):
                        raw_results.append(row)
                    elif isinstance(row, (list, tuple)):
                        # Convert list/tuple to a simple dict with index keys
                        raw_results.append({f"col_{i}": str(val) for i, val in enumerate(row)})
                    else:
                        raw_results.append({"result": str(row)})
            return GraphQueryResult(
                success=True,
                raw_results=raw_results
            )
        except Exception as e:
            return GraphQueryResult(
                success=False,
                error=str(e)
            )
    
    async def add_node(self, node: GraphNode) -> bool:
        """Add a node to the FalkorDB graph."""
        client = await self._get_client()
        
        props = {
            "id": node.id,
            "name": node.name,
            **(node.properties or {})
        }
        # Build property string for Cypher
        props_parts = []
        for k, v in props.items():
            if isinstance(v, str):
                props_parts.append(f"{k}: '{v}'")
            elif isinstance(v, (int, float)):
                props_parts.append(f"{k}: {v}")
            else:
                props_parts.append(f"{k}: '{str(v)}'")
        props_str = ", ".join(props_parts)
        
        query = f"CREATE (n:{node.type} {{{props_str}}})"
        
        try:
            client.query(query)
            return True
        except Exception as e:
            print(f"Error adding node: {e}")
            return False
    
    async def add_edge(self, edge: GraphEdge) -> bool:
        """Add an edge to the FalkorDB graph."""
        client = await self._get_client()
        
        props = {
            "weight": edge.weight or 1.0,
            **(edge.properties or {})
        }
        props_parts = []
        for k, v in props.items():
            if isinstance(v, str):
                props_parts.append(f"{k}: '{v}'")
            elif isinstance(v, (int, float)):
                props_parts.append(f"{k}: {v}")
            else:
                props_parts.append(f"{k}: '{str(v)}'")
        props_str = ", ".join(props_parts)
        
        query = f"MATCH (a {{id: '{edge.source}'}}), (b {{id: '{edge.target}'}}) CREATE (a)-[r:{edge.relationship} {{{props_str}}}]->(b)"
        
        try:
            client.query(query)
            return True
        except Exception as e:
            print(f"Error adding edge: {e}")
            return False
    
    async def get_node(self, node_id: str) -> Optional[GraphNode]:
        """Get a node by ID from FalkorDB."""
        client = await self._get_client()
        
        query = f"MATCH (n {{id: '{node_id}'}}) RETURN n, labels(n)"
        
        try:
            result = client.query(query)
            if result.result_set:
                node_data, labels = result.result_set[0]
                return GraphNode(
                    id=node_data.get("id"),
                    type=labels[0] if labels else "finding",
                    name=node_data.get("name", ""),
                    properties={k: v for k, v in node_data.items() 
                               if k not in ["id", "name"]}
                )
        except Exception:
            pass
        
        return None
    
    async def get_connected_nodes(
        self, 
        node_id: str, 
        relationship: Optional[str] = None,
        max_depth: int = 1
    ) -> List[GraphNode]:
        """Get nodes connected to a given node."""
        client = await self._get_client()
        
        rel_pattern = f":{relationship}" if relationship else ""
        query = f"""
        MATCH (n {{id: '{node_id}'}})-[r{rel_pattern}*1..{max_depth}]-(m)
        RETURN DISTINCT m, labels(m)
        """
        
        try:
            result = client.query(query)
            nodes = []
            for row in result.result_set:
                node_data, labels = row
                nodes.append(GraphNode(
                    id=node_data.get("id"),
                    type=labels[0] if labels else "finding",
                    name=node_data.get("name", ""),
                    properties={k: v for k, v in node_data.items() 
                               if k not in ["id", "name"]}
                ))
            return nodes
        except Exception:
            return []
    
    def _parse_query_result_to_graph(self, result) -> KnowledgeGraph:
        """Parse FalkorDB query result into KnowledgeGraph."""
        nodes = []
        edges = []
        seen_node_ids = set()
        seen_edge_ids = set()
        
        if hasattr(result, 'result_set') and result.result_set:
            for row in result.result_set:
                # Parse nodes
                if len(row) > 0 and row[0]:
                    node_data = row[0]
                    if isinstance(node_data, dict):
                        node_id = node_data.get("id", f"n_{len(nodes)}")
                        if node_id not in seen_node_ids:
                            nodes.append(GraphNode(
                                id=node_id,
                                type=NodeType.FINDING,  # Default type
                                name=node_data.get("name", ""),
                                properties=node_data
                            ))
                            seen_node_ids.add(node_id)
                
                # Parse edges
                if len(row) > 1 and row[1]:
                    edge_data = row[1]
                    if isinstance(edge_data, dict):
                        edge_id = edge_data.get("id", f"e_{len(edges)}")
                        if edge_id not in seen_edge_ids:
                            edges.append(GraphEdge(
                                id=edge_id,
                                source=edge_data.get("src", ""),
                                target=edge_data.get("dest", ""),
                                relationship=edge_data.get("type", "RELATED_TO"),
                                weight=edge_data.get("weight", 1.0)
                            ))
                            seen_edge_ids.add(edge_id)
        
        return KnowledgeGraph(nodes=nodes, edges=edges)
    
    def _parse_association_result(
        self, 
        result, 
        findings: List[str]
    ) -> AssociationResult:
        """Parse FalkorDB association query result."""
        conditions = []
        paths = []
        
        if hasattr(result, 'result_set') and result.result_set:
            for row in result.result_set:
                conditions.append({
                    "condition_id": row[0],
                    "condition_name": row[1],
                    "score": row[2],
                    "evidence": row[3] if len(row) > 3 else []
                })
        
        return AssociationResult(
            query_findings=findings,
            associated_conditions=conditions,
            reasoning_paths=paths
        )


# Factory function to get the appropriate graph service
def get_graph_service() -> GraphServiceInterface:
    """Get the appropriate graph service based on configuration."""
    if settings.use_mock_graph:
        return MockGraphService()
    return FalkorDBService()


# Singleton instance
_graph_service: Optional[GraphServiceInterface] = None


def graph_service() -> GraphServiceInterface:
    """Get or create the graph service singleton."""
    global _graph_service
    if _graph_service is None:
        _graph_service = get_graph_service()
    return _graph_service
