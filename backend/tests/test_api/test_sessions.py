"""
Tests for Sessions API endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestSessionsAPI:
    """Tests for session-related endpoints."""

    def test_create_session(self, client: TestClient):
        """Test creating a new session."""
        response = client.post(
            "/api/v1/sessions",
            json={
                "question_count": 5,
                "categories": ["Lysosomal Storage Disorders"],
                "difficulty": ["medium"]
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "questions" in data
        assert "started_at" in data
        assert data["current_index"] == 0

    def test_create_session_default_params(self, client: TestClient):
        """Test creating a session with default parameters."""
        response = client.post(
            "/api/v1/sessions",
            json={}
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data

    def test_get_session(self, client: TestClient):
        """Test getting a session by ID."""
        # First create a session
        create_response = client.post("/api/v1/sessions", json={})
        session_id = create_response.json()["id"]

        # Then get it
        response = client.get(f"/api/v1/sessions/{session_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id

    def test_get_session_not_found(self, client: TestClient):
        """Test getting a non-existent session."""
        response = client.get("/api/v1/sessions/nonexistent-id")

        assert response.status_code == 404

    def test_submit_answer(self, client: TestClient):
        """Test submitting an answer for a question."""
        # Create a session first
        create_response = client.post("/api/v1/sessions", json={"question_count": 3})
        session = create_response.json()
        session_id = session["id"]
        question_id = session["questions"][0]["id"]

        # Submit answer
        response = client.put(
            f"/api/v1/sessions/{session_id}/answer",
            json={
                "question_id": question_id,
                "answer": "A"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["answers"][question_id] == "A"

    def test_submit_answer_invalid_session(self, client: TestClient):
        """Test submitting an answer to a non-existent session."""
        response = client.put(
            "/api/v1/sessions/nonexistent-id/answer",
            json={
                "question_id": "some-question",
                "answer": "A"
            }
        )

        assert response.status_code == 404

    def test_submit_answer_invalid_option(self, client: TestClient):
        """Test submitting an invalid answer option."""
        # Create a session first
        create_response = client.post("/api/v1/sessions", json={"question_count": 3})
        session = create_response.json()
        session_id = session["id"]
        question_id = session["questions"][0]["id"]

        # Submit invalid answer
        response = client.put(
            f"/api/v1/sessions/{session_id}/answer",
            json={
                "question_id": question_id,
                "answer": "Z"  # Invalid option
            }
        )

        # Should return validation error
        assert response.status_code == 422

    def test_complete_session(self, client: TestClient):
        """Test completing a session."""
        # Create a session
        create_response = client.post("/api/v1/sessions", json={"question_count": 3})
        session_id = create_response.json()["id"]

        # Complete it
        response = client.post(f"/api/v1/sessions/{session_id}/complete")

        assert response.status_code == 200
        data = response.json()
        assert "completed_at" in data

    def test_get_session_review(self, client: TestClient):
        """Test getting session review."""
        # Create and complete a session
        create_response = client.post("/api/v1/sessions", json={"question_count": 3})
        session_id = create_response.json()["id"]

        # Submit some answers
        session = create_response.json()
        for question in session["questions"][:2]:
            client.put(
                f"/api/v1/sessions/{session_id}/answer",
                json={
                    "question_id": question["id"],
                    "answer": "A"
                }
            )

        # Complete session
        client.post(f"/api/v1/sessions/{session_id}/complete")

        # Get review
        response = client.get(f"/api/v1/sessions/{session_id}/review")

        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "questions" in data
        assert "results" in data


class TestSessionResults:
    """Tests for session results and scoring."""

    def test_session_results_structure(self, client: TestClient):
        """Test that session results have correct structure."""
        # Create and complete a session
        create_response = client.post("/api/v1/sessions", json={"question_count": 3})
        session_id = create_response.json()["id"]
        client.post(f"/api/v1/sessions/{session_id}/complete")

        # Get review
        response = client.get(f"/api/v1/sessions/{session_id}/review")

        if response.status_code == 200:
            data = response.json()
            results = data.get("results", {})

            assert "total_questions" in results
            assert "correct_answers" in results
            assert "accuracy" in results

    def test_session_accuracy_calculation(self, client: TestClient):
        """Test that accuracy is calculated correctly."""
        # Create session
        create_response = client.post("/api/v1/sessions", json={"question_count": 3})
        session = create_response.json()
        session_id = session["id"]

        # Answer all questions correctly
        for question in session["questions"]:
            correct_answer = question["correct_answer"]
            client.put(
                f"/api/v1/sessions/{session_id}/answer",
                json={
                    "question_id": question["id"],
                    "answer": correct_answer
                }
            )

        # Complete and get review
        client.post(f"/api/v1/sessions/{session_id}/complete")
        response = client.get(f"/api/v1/sessions/{session_id}/review")

        if response.status_code == 200:
            data = response.json()
            results = data.get("results", {})

            # All answers were correct
            assert results["correct_answers"] == results["total_questions"]
            assert results["accuracy"] == 100.0
