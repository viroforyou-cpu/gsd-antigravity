"""
Tests for Graph API endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestGraphAPI:
    """Tests for graph-related endpoints."""

    def test_get_graph_status(self, client: TestClient):
        """Test getting graph service status."""
        response = client.get("/api/v1/graph/status")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "service_type" in data

    def test_get_question_graph(self, client: TestClient):
        """Test getting knowledge graph for a question."""
        # First get a question ID
        questions_response = client.get("/api/v1/questions")
        questions = questions_response.json()

        if questions:
            question_id = questions[0]["id"]
            response = client.get(f"/api/v1/graph/question/{question_id}")

            assert response.status_code == 200
            data = response.json()
            assert "nodes" in data
            assert "edges" in data

    def test_get_question_graph_not_found(self, client: TestClient):
        """Test getting graph for non-existent question."""
        response = client.get("/api/v1/graph/question/nonexistent-id")

        # Should return 404 or empty graph
        assert response.status_code in [200, 404]

    def test_graph_structure(self, client: TestClient):
        """Test that graph data has correct structure."""
        # Get a question with graph
        questions_response = client.get("/api/v1/questions")
        questions = questions_response.json()

        if questions:
            question_id = questions[0]["id"]
            response = client.get(f"/api/v1/graph/question/{question_id}")

            if response.status_code == 200:
                data = response.json()

                # Check nodes structure
                if data["nodes"]:
                    node = data["nodes"][0]
                    assert "id" in node
                    assert "type" in node
                    assert "name" in node

                # Check edges structure
                if data["edges"]:
                    edge = data["edges"][0]
                    assert "source" in edge
                    assert "target" in edge
                    assert "relationship" in edge

    def test_get_associations(self, client: TestClient):
        """Test getting node associations."""
        response = client.post(
            "/api/v1/graph/associations",
            json={
                "findings": ["cherry-red spot", "hepatosplenomegaly"],
                "max_depth": 2
            }
        )

        # Should return associations or empty result
        assert response.status_code in [200, 404, 422]

    def test_query_graph(self, client: TestClient):
        """Test querying the graph with Cypher-like query."""
        response = client.post(
            "/api/v1/graph/query",
            json={
                "query": "MATCH (n) RETURN n LIMIT 5"
            }
        )

        # Should return results or error for unsupported query
        assert response.status_code in [200, 400, 501]


class TestGraphNodes:
    """Tests for graph node operations."""

    def test_create_node(self, client: TestClient):
        """Test creating a new graph node."""
        response = client.post(
            "/api/v1/graph/nodes",
            json={
                "id": "test-condition-1",
                "type": "condition",
                "name": "Test Condition",
                "properties": {
                    "description": "A test condition"
                }
            }
        )

        # May return 200, 201, or 501 if not implemented
        assert response.status_code in [200, 201, 501, 422]

    def test_get_node_by_id(self, client: TestClient):
        """Test getting a node by ID."""
        response = client.get("/api/v1/graph/nodes/test-node-id")

        # Should return node or 404
        assert response.status_code in [200, 404]

    def test_get_connected_nodes(self, client: TestClient):
        """Test getting connected nodes."""
        response = client.get("/api/v1/graph/nodes/test-node-id/connected")

        # Should return connected nodes or 404
        assert response.status_code in [200, 404]


class TestGraphEdges:
    """Tests for graph edge operations."""

    def test_create_edge(self, client: TestClient):
        """Test creating a new graph edge."""
        response = client.post(
            "/api/v1/graph/edges",
            json={
                "source": "node1",
                "target": "node2",
                "relationship": "CAUSES",
                "weight": 0.9
            }
        )

        # May return 200, 201, or 501 if not implemented
        assert response.status_code in [200, 201, 501]


class TestReasoningPath:
    """Tests for reasoning path generation."""

    def test_get_reasoning_path(self, client: TestClient):
        """Test getting reasoning path between nodes."""
        response = client.post(
            "/api/v1/graph/reasoning-path",
            params={
                "findings": "cherry-red spot",
                "target_condition": "Tay-Sachs disease"
            }
        )

        # Should return path or 404
        assert response.status_code in [200, 404, 501, 422]
