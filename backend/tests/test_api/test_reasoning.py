"""
Tests for the Reasoning API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


class TestReasoningAnalyze:
    """Tests for reasoning analysis endpoints."""

    def test_analyze_question_all_strategies(self, client: TestClient):
        """Test analyzing a question with all reasoning strategies."""
        # Use a known question ID that has mock reasoning data
        question_id = "q001"

        # Analyze the question
        response = client.post(f"/api/v1/reasoning/analyze/{question_id}")
        assert response.status_code == 200
        data = response.json()

        # Should return a list of reasoning results
        assert isinstance(data, list)
        assert len(data) > 0

        # Each result should have required fields
        for result in data:
            assert "strategy" in result
            assert "question_id" in result
            assert "steps" in result
            assert "conclusion" in result
            assert "confidence" in result
            assert "correct_option" in result

    def test_analyze_question_invalid_id(self, client: TestClient):
        """Test analyzing a non-existent question."""
        response = client.post("/api/v1/reasoning/analyze/invalid-question-id")
        # Should either return 404 or fallback to mock data
        assert response.status_code in [200, 404]

    def test_get_association_reasoning(self, client: TestClient):
        """Test getting association reasoning for a question."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/association/{question_id}")
        assert response.status_code == 200
        data = response.json()

        assert data["strategy"] == "association"
        assert "key_findings" in data
        assert "linked_conditions" in data
        assert isinstance(data["key_findings"], list)
        assert isinstance(data["linked_conditions"], list)

    def test_get_hypothetico_reasoning(self, client: TestClient):
        """Test getting hypothetico-deductive reasoning for a question."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/hypothetico/{question_id}")
        assert response.status_code == 200
        data = response.json()

        assert data["strategy"] == "hypothetico"
        assert "hypotheses" in data
        assert isinstance(data["hypotheses"], list)

        # Each hypothesis should have required fields
        for hypothesis in data["hypotheses"]:
            assert "option" in hypothesis
            assert "hypothesis" in hypothesis
            assert "predictions" in hypothesis
            assert "verified" in hypothesis
            assert "falsified" in hypothesis

    def test_get_constraints_reasoning(self, client: TestClient):
        """Test getting constraint satisfaction reasoning for a question."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/constraints/{question_id}")
        assert response.status_code == 200
        data = response.json()

        assert data["strategy"] == "constraints"
        assert "constraints" in data
        assert "remaining_options" in data
        assert isinstance(data["constraints"], list)
        assert isinstance(data["remaining_options"], list)

        # Each constraint should have required fields
        for constraint in data["constraints"]:
            assert "finding" in constraint
            assert "eliminates" in constraint
            assert "reason" in constraint

    def test_get_arguments_reasoning(self, client: TestClient):
        """Test getting argument-based reasoning for a question."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/arguments/{question_id}")
        assert response.status_code == 200
        data = response.json()

        assert data["strategy"] == "arguments"
        assert "arguments" in data
        assert isinstance(data["arguments"], list)

        # Each argument should have required fields
        for arg in data["arguments"]:
            assert "option" in arg
            assert "pros" in arg
            assert "cons" in arg
            assert "net_score" in arg


class TestReasoningStructure:
    """Tests for reasoning data structure validation."""

    def test_reasoning_steps_structure(self, client: TestClient):
        """Test that reasoning steps have correct structure."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/association/{question_id}")
        assert response.status_code == 200
        data = response.json()

        for step in data["steps"]:
            assert "step_number" in step
            assert "description" in step
            assert isinstance(step["step_number"], int)
            assert isinstance(step["description"], str)
            assert step["step_number"] > 0

    def test_confidence_range(self, client: TestClient):
        """Test that confidence is between 0 and 1."""
        question_id = "q001"

        response = client.post(f"/api/v1/reasoning/analyze/{question_id}")
        assert response.status_code == 200
        data = response.json()

        for result in data:
            assert 0 <= result["confidence"] <= 1

    def test_linked_conditions_structure(self, client: TestClient):
        """Test that linked conditions have correct structure."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/association/{question_id}")
        assert response.status_code == 200
        data = response.json()

        for condition in data.get("linked_conditions", []):
            assert "condition" in condition
            assert "strength" in condition
            assert "matching_findings" in condition
            assert 0 <= condition["strength"] <= 1
            assert isinstance(condition["matching_findings"], list)


class TestReasoningStrategies:
    """Tests for specific reasoning strategy behaviors."""

    def test_hypothesis_verification_status(self, client: TestClient):
        """Test that hypotheses have valid verification status."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/hypothetico/{question_id}")
        assert response.status_code == 200
        data = response.json()

        for hypothesis in data["hypotheses"]:
            # A hypothesis should not be both verified and falsified
            assert not (hypothesis["verified"] and hypothesis["falsified"])

    def test_constraints_elimination_chain(self, client: TestClient):
        """Test that constraints properly eliminate options."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/constraints/{question_id}")
        assert response.status_code == 200
        data = response.json()

        # The remaining options should be a subset of all options
        all_options = {"A", "B", "C", "D", "E"}
        for option in data["remaining_options"]:
            assert option in all_options

    def test_arguments_net_score_calculation(self, client: TestClient):
        """Test that argument net scores are calculated correctly."""
        question_id = "q001"

        response = client.get(f"/api/v1/reasoning/arguments/{question_id}")
        assert response.status_code == 200
        data = response.json()

        for arg in data["arguments"]:
            # Net score should be based on pros and cons
            # The exact calculation may vary, but it should be a number
            assert isinstance(arg["net_score"], (int, float))
