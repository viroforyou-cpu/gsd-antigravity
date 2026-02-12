"""
Locust load testing file for GeneReason API.
Run with: locust -f locustfile.py --host http://localhost:8002

This tests the critical paths of the API:
1. Question retrieval (list and individual)
2. Session management
3. Reasoning generation
4. Progress tracking
"""
from locust import HttpUser, task, between
import random
import json


class GeneReasonUser(HttpUser):
    """
    Simulates a typical user of the GeneReason application.
    Users browse questions, start practice sessions, and review results.
    """
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    # Sample question IDs for testing (will be populated dynamically)
    question_ids = []
    session_ids = []
    
    def on_start(self):
        """Called when a user starts. Get initial data."""
        # Get list of questions to use in tests
        self.get_question_ids()
    
    def get_question_ids(self):
        """Fetch question IDs for testing."""
        response = self.client.get("/api/v1/questions?limit=20")
        if response.status_code == 200:
            data = response.json()
            self.question_ids = [q["id"] for q in data.get("questions", [])]
    
    @task(10)
    def get_questions_list(self):
        """Get list of questions - most common operation."""
        params = {
            "limit": random.choice([10, 20, 50]),
            "offset": random.randint(0, 10)
        }
        self.client.get("/api/v1/questions", params=params, name="/api/v1/questions")
    
    @task(8)
    def get_single_question(self):
        """Get a single question by ID."""
        if self.question_ids:
            question_id = random.choice(self.question_ids)
            self.client.get(
                f"/api/v1/questions/{question_id}",
                name="/api/v1/questions/[id]"
            )
    
    @task(5)
    def get_random_question(self):
        """Get a random question for practice."""
        self.client.get("/api/v1/questions/random", name="/api/v1/questions/random")
    
    @task(3)
    def get_categories(self):
        """Get question categories."""
        self.client.get("/api/v1/questions/categories", name="/api/v1/questions/categories")
    
    @task(4)
    def start_session(self):
        """Start a new practice session."""
        payload = {
            "question_count": random.choice([5, 10, 15]),
            "category": random.choice([None, "Mendelian Inheritance", "Molecular Genetics"])
        }
        response = self.client.post(
            "/api/v1/sessions",
            json=payload,
            name="/api/v1/sessions [POST]"
        )
        if response.status_code == 200:
            data = response.json()
            if "id" in data:
                self.session_ids.append(data["id"])
    
    @task(6)
    def get_session(self):
        """Get session details."""
        if self.session_ids:
            session_id = random.choice(self.session_ids)
            self.client.get(
                f"/api/v1/sessions/{session_id}",
                name="/api/v1/sessions/[id]"
            )
    
    @task(3)
    def submit_answer(self):
        """Submit an answer for a session question."""
        if self.session_ids and self.question_ids:
            session_id = random.choice(self.session_ids)
            question_id = random.choice(self.question_ids)
            payload = {
                "question_id": question_id,
                "answer": random.choice(["A", "B", "C", "D", "E"])
            }
            self.client.put(
                f"/api/v1/sessions/{session_id}/answer",
                json=payload,
                name="/api/v1/sessions/[id]/answer"
            )
    
    @task(2)
    def get_reasoning(self):
        """Get reasoning for a question."""
        if self.question_ids:
            question_id = random.choice(self.question_ids)
            payload = {
                "question_id": question_id,
                "strategy": random.choice([
                    "association",
                    "hypothetico",
                    "constraints",
                    "arguments"
                ])
            }
            self.client.post(
                "/api/v1/reasoning/analyze",
                json=payload,
                name="/api/v1/reasoning/analyze"
            )
    
    @task(2)
    def get_progress_dashboard(self):
        """Get progress dashboard data."""
        self.client.get("/api/v1/progress/dashboard", name="/api/v1/progress/dashboard")
    
    @task(1)
    def get_graph(self):
        """Get knowledge graph for a question."""
        if self.question_ids:
            question_id = random.choice(self.question_ids)
            self.client.get(
                f"/api/v1/graph/question/{question_id}",
                name="/api/v1/graph/question/[id]"
            )
    
    @task(1)
    def health_check(self):
        """Check API health."""
        self.client.get("/health", name="/health")


class PowerUser(HttpUser):
    """
    Simulates a power user who spends more time per session
    and makes more intensive API calls.
    """
    
    wait_time = between(0.5, 2)
    question_ids = []
    
    def on_start(self):
        self.get_question_ids()
    
    def get_question_ids(self):
        response = self.client.get("/api/v1/questions?limit=50")
        if response.status_code == 200:
            data = response.json()
            self.question_ids = [q["id"] for q in data.get("questions", [])]
    
    @task(5)
    def rapid_question_browsing(self):
        """Quickly browse through questions."""
        for _ in range(5):
            if self.question_ids:
                question_id = random.choice(self.question_ids)
                self.client.get(
                    f"/api/v1/questions/{question_id}",
                    name="/api/v1/questions/[id] (power)"
                )
    
    @task(3)
    def intensive_reasoning(self):
        """Request multiple reasoning strategies."""
        if self.question_ids:
            question_id = random.choice(self.question_ids)
            for strategy in ["association", "hypothetico", "constraints", "arguments"]:
                payload = {
                    "question_id": question_id,
                    "strategy": strategy
                }
                self.client.post(
                    "/api/v1/reasoning/analyze",
                    json=payload,
                    name="/api/v1/reasoning/analyze (power)"
                )
    
    @task(2)
    def session_with_full_review(self):
        """Start a session, answer questions, and get full review."""
        # Start session
        response = self.client.post(
            "/api/v1/sessions",
            json={"question_count": 5},
            name="/api/v1/sessions [POST] (power)"
        )
        
        if response.status_code == 200:
            data = response.json()
            session_id = data.get("id")
            
            if session_id:
                # Get session details
                self.client.get(
                    f"/api/v1/sessions/{session_id}",
                    name="/api/v1/sessions/[id] (power)"
                )
                
                # Complete session
                self.client.post(
                    f"/api/v1/sessions/{session_id}/complete",
                    name="/api/v1/sessions/[id]/complete (power)"
                )
                
                # Get review
                self.client.get(
                    f"/api/v1/sessions/{session_id}/review",
                    name="/api/v1/sessions/[id]/review (power)"
                )


class APIHealthCheck(HttpUser):
    """
    Minimal user that just checks API health.
    Useful for monitoring baseline response times.
    """
    
    wait_time = between(5, 10)
    
    @task
    def check_health(self):
        self.client.get("/health")
    
    @task
    def check_root(self):
        self.client.get("/")
