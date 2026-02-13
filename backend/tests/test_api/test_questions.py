"""
Tests for Questions API endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestQuestionsAPI:
    """Tests for question-related endpoints."""

    def test_list_questions(self, client: TestClient):
        """Test listing all questions."""
        response = client.get("/api/v1/questions")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_questions_pagination(self, client: TestClient):
        """Test questions pagination."""
        response = client.get("/api/v1/questions?skip=0&limit=5")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5

    def test_get_question_by_id(self, client: TestClient):
        """Test getting a specific question."""
        # First get list to find a valid ID
        list_response = client.get("/api/v1/questions")
        questions = list_response.json()

        if questions:
            question_id = questions[0]["id"]
            response = client.get(f"/api/v1/questions/{question_id}")

            assert response.status_code == 200
            data = response.json()
            assert data["id"] == question_id
            assert "stem" in data
            assert "options" in data
            assert "correct_answer" in data

    def test_get_question_not_found(self, client: TestClient):
        """Test getting a non-existent question."""
        # Use a valid UUID format that doesn't exist
        response = client.get("/api/v1/questions/00000000-0000-0000-0000-000000000000")

        assert response.status_code == 404

    def test_get_random_question(self, client: TestClient):
        """Test getting a random question."""
        response = client.get("/api/v1/questions/random")

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "stem" in data
        assert "options" in data

    def test_get_random_question_with_category(self, client: TestClient):
        """Test getting a random question filtered by category."""
        response = client.get(
            "/api/v1/questions/random",
            params={"category": "Lysosomal Storage Disorders"}
        )

        # Should return 200 or 404 if no questions in category
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            assert data["category"] == "Lysosomal Storage Disorders"

    def test_get_random_question_with_difficulty(self, client: TestClient):
        """Test getting a random question filtered by difficulty."""
        response = client.get(
            "/api/v1/questions/random",
            params={"difficulty": "medium"}
        )

        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            assert data["difficulty"] == "medium"

    def test_question_structure(self, client: TestClient):
        """Test that questions have the correct structure."""
        response = client.get("/api/v1/questions/random")

        if response.status_code == 200:
            data = response.json()

            # Check required fields
            assert "id" in data
            assert "stem" in data
            assert "options" in data
            assert "correct_answer" in data
            assert "difficulty" in data
            assert "category" in data

            # Check options structure
            options = data["options"]
            assert "A" in options
            assert "B" in options
            assert "C" in options
            assert "D" in options
            assert "E" in options

            # Check correct_answer is valid
            assert data["correct_answer"] in ["A", "B", "C", "D", "E"]

            # Check difficulty is valid
            assert data["difficulty"] in ["easy", "medium", "hard"]


class TestQuestionValidation:
    """Tests for question data validation."""

    def test_question_options_are_strings(self, client: TestClient):
        """Test that all question options are strings."""
        response = client.get("/api/v1/questions/random")

        if response.status_code == 200:
            data = response.json()
            options = data["options"]

            for key, value in options.items():
                assert isinstance(value, str), f"Option {key} should be a string"

    def test_question_stem_not_empty(self, client: TestClient):
        """Test that question stem is not empty."""
        response = client.get("/api/v1/questions/random")

        if response.status_code == 200:
            data = response.json()
            assert len(data["stem"]) > 0
