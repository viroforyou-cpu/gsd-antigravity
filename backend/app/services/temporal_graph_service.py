"""
Temporal Knowledge Graph Service - extends graph capabilities with temporal awareness.
Provides Graphiti-like functionality for tracking knowledge graph changes over time.
Works with FalkorDB for graph storage.
"""
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
from datetime import datetime
import json

from ..core.config import settings
from ..models.graph import (
    GraphNode, GraphEdge, KnowledgeGraph, NodeType, RelationType,
    GraphQueryResult, ReasoningPath, AssociationResult
)


class TemporalNode(GraphNode):
    """Node with temporal information."""
    created_at: datetime
    updated_at: datetime
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    version: int = 1


class TemporalEdge(GraphEdge):
    """Edge with temporal information."""
    created_at: datetime
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None


class TemporalKnowledgeGraph:
    """Knowledge graph with temporal tracking capabilities."""
    
    def __init__(
        self,
        graph_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        self.graph_id = graph_id
        self.user_id = user_id
        self.session_id = session_id
        self.nodes: List[TemporalNode] = []
        self.edges: List[TemporalEdge] = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def add_node(
        self,
        node: GraphNode,
        valid_from: Optional[datetime] = None,
        valid_until: Optional[datetime] = None
    ) -> TemporalNode:
        """Add a node with temporal information."""
        now = datetime.utcnow()
        temporal_node = TemporalNode(
            **node.model_dump(),
            created_at=now,
            updated_at=now,
            valid_from=valid_from,
            valid_until=valid_until,
            version=1
        )
        self.nodes.append(temporal_node)
        self.updated_at = now
        return temporal_node
    
    def add_edge(
        self,
        edge: GraphEdge,
        valid_from: Optional[datetime] = None,
        valid_until: Optional[datetime] = None
    ) -> TemporalEdge:
        """Add an edge with temporal information."""
        now = datetime.utcnow()
        temporal_edge = TemporalEdge(
            **edge.model_dump(),
            created_at=now,
            valid_from=valid_from,
            valid_until=valid_until
        )
        self.edges.append(temporal_edge)
        self.updated_at = now
        return temporal_edge
    
    def get_snapshot(self, at_time: datetime) -> KnowledgeGraph:
        """Get graph state at a specific point in time."""
        valid_nodes = [
            GraphNode(**n.model_dump(exclude={'created_at', 'updated_at', 'valid_from', 'valid_until', 'version'}))
            for n in self.nodes
            if (n.valid_from is None or n.valid_from <= at_time) and
               (n.valid_until is None or n.valid_until > at_time)
        ]
        
        valid_edges = [
            GraphEdge(**e.model_dump(exclude={'created_at', 'valid_from', 'valid_until'}))
            for e in self.edges
            if (e.valid_from is None or e.valid_from <= at_time) and
               (e.valid_until is None or e.valid_until > at_time)
        ]
        
        return KnowledgeGraph(nodes=valid_nodes, edges=valid_edges)


class TemporalGraphServiceInterface(ABC):
    """Abstract interface for temporal graph services."""
    
    @abstractmethod
    async def create_temporal_graph(
        self,
        user_id: str,
        session_id: Optional[str] = None
    ) -> TemporalKnowledgeGraph:
        """Create a new temporal knowledge graph."""
        pass
    
    @abstractmethod
    async def add_fact(
        self,
        graph_id: str,
        subject: str,
        predicate: str,
        object: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a fact (triple) to the graph with temporal tracking."""
        pass
    
    @abstractmethod
    async def get_graph_at_time(
        self,
        graph_id: str,
        at_time: datetime
    ) -> KnowledgeGraph:
        """Get graph state at a specific point in time."""
        pass
    
    @abstractmethod
    async def search_temporal(
        self,
        graph_id: str,
        query: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Search the graph with temporal constraints."""
        pass
    
    @abstractmethod
    async def get_learning_history(
        self,
        user_id: str,
        question_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get the learning history for a user, optionally filtered by question."""
        pass


class MockTemporalGraphService(TemporalGraphServiceInterface):
    """Mock temporal graph service for development."""
    
    def __init__(self):
        self._graphs: Dict[str, TemporalKnowledgeGraph] = {}
        self._facts: List[Dict[str, Any]] = []
    
    async def create_temporal_graph(
        self,
        user_id: str,
        session_id: Optional[str] = None
    ) -> TemporalKnowledgeGraph:
        """Create a new temporal knowledge graph."""
        graph_id = f"graph_{user_id}_{datetime.utcnow().timestamp()}"
        graph = TemporalKnowledgeGraph(
            graph_id=graph_id,
            user_id=user_id,
            session_id=session_id
        )
        self._graphs[graph_id] = graph
        return graph
    
    async def add_fact(
        self,
        graph_id: str,
        subject: str,
        predicate: str,
        object: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a fact with temporal tracking."""
        fact = {
            "graph_id": graph_id,
            "subject": subject,
            "predicate": predicate,
            "object": object,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
            "valid_from": datetime.utcnow().isoformat(),
        }
        self._facts.append(fact)
        return True
    
    async def get_graph_at_time(
        self,
        graph_id: str,
        at_time: datetime
    ) -> KnowledgeGraph:
        """Get graph state at a specific time."""
        if graph_id in self._graphs:
            return self._graphs[graph_id].get_snapshot(at_time)
        return KnowledgeGraph(nodes=[], edges=[])
    
    async def search_temporal(
        self,
        graph_id: str,
        query: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Search with temporal constraints."""
        results = []
        for fact in self._facts:
            if fact["graph_id"] != graph_id:
                continue
            
            # Check temporal constraints
            created = datetime.fromisoformat(fact["created_at"])
            if start_time and created < start_time:
                continue
            if end_time and created > end_time:
                continue
            
            # Simple text matching
            if query.lower() in fact["subject"].lower() or \
               query.lower() in fact["object"].lower():
                results.append(fact)
        
        return results
    
    async def get_learning_history(
        self,
        user_id: str,
        question_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get learning history for a user."""
        # Return mock learning history
        return [
            {
                "user_id": user_id,
                "question_id": "q001",
                "learned_at": datetime.utcnow().isoformat(),
                "concepts": ["Tay-Sachs disease", "HEXA gene", "lysosomal storage"],
                "confidence": 0.85,
            },
            {
                "user_id": user_id,
                "question_id": "q002",
                "learned_at": datetime.utcnow().isoformat(),
                "concepts": ["Cri-du-chat syndrome", "5p deletion"],
                "confidence": 0.75,
            }
        ]


class FalkorDBTemporalService(TemporalGraphServiceInterface):
    """FalkorDB-backed temporal graph service."""
    
    def __init__(self):
        self.host = settings.falkordb_host
        self.port = settings.falkordb_port
        self.graph_name = f"{settings.falkordb_graph_name}_temporal"
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
                    username=settings.falkordb_username if settings.falkordb_username else None,
                    password=settings.falkordb_password if settings.falkordb_password else None
                )
                self._graph = self._client.select_graph(self.graph_name)
            except ImportError:
                raise ImportError("falkordb package required. Install with: pip install falkordb")
        return self._graph
    
    async def create_temporal_graph(
        self,
        user_id: str,
        session_id: Optional[str] = None
    ) -> TemporalKnowledgeGraph:
        """Create a new temporal knowledge graph."""
        graph_id = f"graph_{user_id}_{datetime.utcnow().timestamp()}"
        return TemporalKnowledgeGraph(
            graph_id=graph_id,
            user_id=user_id,
            session_id=session_id
        )
    
    async def add_fact(
        self,
        graph_id: str,
        subject: str,
        predicate: str,
        object: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add a fact with temporal tracking to FalkorDB."""
        client = await self._get_client()
        
        now = datetime.utcnow().isoformat()
        metadata_json = json.dumps(metadata or {})
        
        query = f"""
        MERGE (s:Entity {{name: $subject}})
        MERGE (o:Entity {{name: $object}})
        CREATE (s)-[r:{predicate} {{
            graph_id: $graph_id,
            created_at: $now,
            metadata: $metadata
        }}]->(o)
        """
        
        try:
            client.query(query, {
                "subject": subject,
                "object": object,
                "graph_id": graph_id,
                "now": now,
                "metadata": metadata_json
            })
            return True
        except Exception as e:
            print(f"Error adding fact: {e}")
            return False
    
    async def get_graph_at_time(
        self,
        graph_id: str,
        at_time: datetime
    ) -> KnowledgeGraph:
        """Get graph state at a specific time from FalkorDB."""
        client = await self._get_client()
        
        query = f"""
        MATCH (n)-[r]->(m)
        WHERE r.graph_id = $graph_id
        AND r.created_at <= $at_time
        RETURN n, r, m
        """
        
        try:
            result = client.query(query, {
                "graph_id": graph_id,
                "at_time": at_time.isoformat()
            })
            # Parse result and return KnowledgeGraph
            return KnowledgeGraph(nodes=[], edges=[])
        except Exception as e:
            print(f"Error getting graph at time: {e}")
            return KnowledgeGraph(nodes=[], edges=[])
    
    async def search_temporal(
        self,
        graph_id: str,
        query: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Search with temporal constraints in FalkorDB."""
        client = await self._get_client()
        
        time_filter = ""
        if start_time:
            time_filter += f" AND r.created_at >= '{start_time.isoformat()}'"
        if end_time:
            time_filter += f" AND r.created_at <= '{end_time.isoformat()}'"
        
        cypher = f"""
        MATCH (s)-[r]->(o)
        WHERE r.graph_id = $graph_id
        {time_filter}
        AND (s.name CONTAINS $query OR o.name CONTAINS $query)
        RETURN s.name as subject, type(r) as predicate, o.name as object, r.created_at as created_at
        """
        
        try:
            result = client.query(cypher, {
                "graph_id": graph_id,
                "query": query
            })
            return [dict(row) for row in result.result_set] if result.result_set else []
        except Exception as e:
            print(f"Error searching temporal: {e}")
            return []
    
    async def get_learning_history(
        self,
        user_id: str,
        question_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get learning history from FalkorDB."""
        client = await self._get_client()
        
        query_filter = ""
        if question_id:
            query_filter = " AND r.question_id = $question_id"
        
        cypher = f"""
        MATCH (u:User {{id: $user_id}})-[r:LEARNED]->(c:Concept)
        WHERE 1=1 {query_filter}
        RETURN c.name as concept, r.confidence as confidence, r.learned_at as learned_at
        ORDER BY r.learned_at DESC
        """
        
        try:
            result = client.query(cypher, {
                "user_id": user_id,
                "question_id": question_id
            })
            return [dict(row) for row in result.result_set] if result.result_set else []
        except Exception as e:
            print(f"Error getting learning history: {e}")
            return []


def get_temporal_graph_service() -> TemporalGraphServiceInterface:
    """Factory function to get the appropriate temporal graph service."""
    if settings.use_mock_data:
        return MockTemporalGraphService()
    return FalkorDBTemporalService()
