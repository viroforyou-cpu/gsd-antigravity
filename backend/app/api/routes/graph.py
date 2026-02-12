"""
Graph API Routes - endpoints for knowledge graph operations.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from ...services.graph_service import graph_service, GraphServiceInterface
from ...models.graph import (
    KnowledgeGraph, GraphNode, GraphEdge, 
    AssociationResult, ReasoningPath, NodeType
)

router = APIRouter(prefix="/graph", tags=["graph"])


class FindAssociationsRequest(BaseModel):
    """Request model for finding associations."""
    findings: List[str]
    max_depth: Optional[int] = 2


class AddNodeRequest(BaseModel):
    """Request model for adding a node."""
    id: str
    type: str
    name: str
    properties: Optional[dict] = None


class AddEdgeRequest(BaseModel):
    """Request model for adding an edge."""
    source: str
    target: str
    relationship: str
    weight: Optional[float] = 1.0
    properties: Optional[dict] = None


class CypherQueryRequest(BaseModel):
    """Request model for raw Cypher queries."""
    query: str


@router.get("/question/{question_id}", response_model=KnowledgeGraph)
async def get_graph_for_question(question_id: str):
    """
    Get the knowledge graph associated with a specific question.
    
    This endpoint retrieves all nodes and edges that form the knowledge
    graph for reasoning about a particular medical genetics question.
    """
    try:
        service = graph_service()
        graph = await service.get_graph_for_question(question_id)
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/associations", response_model=AssociationResult)
async def find_associations(request: FindAssociationsRequest):
    """
    Find conditions associated with given clinical findings.
    
    This endpoint uses graph traversal to find medical conditions that
    are associated with the provided clinical findings. The results are
    ranked by association strength.
    """
    try:
        service = graph_service()
        result = await service.find_associations(
            findings=request.findings,
            max_depth=request.max_depth or 2
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/associations", response_model=AssociationResult)
async def find_associations_get(
    findings: str = Query(..., description="Comma-separated list of findings")
):
    """
    Find conditions associated with given clinical findings (GET version).
    
    Query parameter 'findings' should be a comma-separated list of clinical findings.
    """
    try:
        findings_list = [f.strip() for f in findings.split(",")]
        service = graph_service()
        result = await service.find_associations(findings=findings_list)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reasoning-path", response_model=ReasoningPath)
async def find_reasoning_path(
    findings: List[str] = Query(..., description="List of clinical findings"),
    target_condition: str = Query(..., description="Target condition to find path to")
):
    """
    Find a reasoning path from clinical findings to a target condition.
    
    This endpoint finds the shortest path through the knowledge graph
    from the given findings to the specified condition.
    """
    try:
        service = graph_service()
        path = await service.find_reasoning_path(
            start_findings=findings,
            target_condition=target_condition
        )
        if path is None:
            raise HTTPException(
                status_code=404, 
                detail="No reasoning path found"
            )
        return path
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nodes", response_model=dict)
async def add_node(request: AddNodeRequest):
    """
    Add a new node to the knowledge graph.
    
    Creates a new node with the specified type, name, and properties.
    """
    try:
        service = graph_service()
        node = GraphNode(
            id=request.id,
            type=request.type,
            name=request.name,
            properties=request.properties
        )
        success = await service.add_node(node)
        return {"success": success, "node_id": request.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edges", response_model=dict)
async def add_edge(request: AddEdgeRequest):
    """
    Add a new edge (relationship) to the knowledge graph.
    
    Creates a relationship between two nodes with the specified type and weight.
    """
    try:
        service = graph_service()
        edge = GraphEdge(
            source=request.source,
            target=request.target,
            relationship=request.relationship,
            weight=request.weight,
            properties=request.properties
        )
        success = await service.add_edge(edge)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}", response_model=GraphNode)
async def get_node(node_id: str):
    """
    Get a specific node by its ID.
    """
    try:
        service = graph_service()
        node = await service.get_node(node_id)
        if node is None:
            raise HTTPException(status_code=404, detail="Node not found")
        return node
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}/connected", response_model=List[GraphNode])
async def get_connected_nodes(
    node_id: str,
    relationship: Optional[str] = Query(None, description="Filter by relationship type"),
    max_depth: int = Query(1, ge=1, le=3, description="Maximum traversal depth")
):
    """
    Get all nodes connected to a specific node.
    
    Optionally filter by relationship type and limit traversal depth.
    """
    try:
        service = graph_service()
        nodes = await service.get_connected_nodes(
            node_id=node_id,
            relationship=relationship,
            max_depth=max_depth
        )
        return nodes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def execute_query(request: CypherQueryRequest):
    """
    Execute a raw Cypher query on the graph database.
    
    **Warning**: This endpoint should be restricted in production
    to prevent unauthorized queries.
    """
    try:
        service = graph_service()
        result = await service.execute_query(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_graph_status():
    """
    Get the current status of the graph database connection.
    
    Returns information about whether the graph service is using
    mock data or a real FalkorDB connection.
    """
    from ...core.config import settings
    
    return {
        "service_type": "mock" if settings.use_mock_graph else "falkordb",
        "falkordb_host": settings.falkordb_host if not settings.use_mock_graph else None,
        "falkordb_port": settings.falkordb_port if not settings.use_mock_graph else None,
        "graph_name": settings.falkordb_graph_name,
        "status": "connected" if not settings.use_mock_graph else "mock_mode"
    }
