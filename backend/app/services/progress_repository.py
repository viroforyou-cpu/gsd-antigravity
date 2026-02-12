"""
Progress Repository - handles all progress/dashboard data access.
Supports both mock data and Supabase database.
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from ..core.config import settings
from ..core.database import get_supabase_client, is_database_connected
from ..models.session import SessionStats


class ProgressRepository:
    """Repository for progress and dashboard data access."""
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
    
    async def get_dashboard(self, user_id: Optional[str] = None) -> Dict:
        """Get dashboard data for the user."""
        if self._use_mock:
            return self._get_mock_dashboard(user_id)
        
        return await self._get_db_dashboard(user_id)
    
    async def get_categories_progress(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get progress breakdown by category."""
        if self._use_mock:
            return self._get_mock_categories_progress(user_id)
        
        return await self._get_db_categories_progress(user_id)
    
    async def get_history(
        self,
        user_id: Optional[str] = None,
        days: int = 30
    ) -> List[Dict]:
        """Get historical performance data."""
        if self._use_mock:
            return self._get_mock_history(user_id, days)
        
        return await self._get_db_history(user_id, days)
    
    # ========================================
    # Mock Data Methods
    # ========================================
    
    def _get_mock_dashboard(self, user_id: Optional[str]) -> Dict:
        """Get mock dashboard data."""
        return {
            "total_sessions": 15,
            "total_questions": 150,
            "total_correct": 112,
            "overall_accuracy": 0.747,
            "total_time_minutes": 225,
            "streak_days": 5,
            "recent_sessions": [
                {
                    "id": "s001",
                    "date": datetime.utcnow().isoformat(),
                    "questions": 10,
                    "correct": 8,
                    "category": "Lysosomal Storage Disorders"
                }
            ],
            "improvement": {
                "week_over_week": 0.05,
                "trend": "improving"
            }
        }
    
    def _get_mock_categories_progress(self, user_id: Optional[str]) -> List[Dict]:
        """Get mock category progress."""
        return [
            {
                "category": "Lysosomal Storage Disorders",
                "total_questions": 45,
                "correct_answers": 36,
                "accuracy": 0.80,
                "last_practiced": datetime.utcnow().isoformat()
            },
            {
                "category": "Chromosomal Abnormalities",
                "total_questions": 30,
                "correct_answers": 21,
                "accuracy": 0.70,
                "last_practiced": (datetime.utcnow() - timedelta(days=2)).isoformat()
            },
            {
                "category": "Inherited Metabolic Disorders",
                "total_questions": 25,
                "correct_answers": 18,
                "accuracy": 0.72,
                "last_practiced": (datetime.utcnow() - timedelta(days=1)).isoformat()
            },
            {
                "category": "Cancer Genetics",
                "total_questions": 20,
                "correct_answers": 14,
                "accuracy": 0.70,
                "last_practiced": (datetime.utcnow() - timedelta(days=3)).isoformat()
            },
            {
                "category": "Neurogenetics",
                "total_questions": 15,
                "correct_answers": 10,
                "accuracy": 0.67,
                "last_practiced": (datetime.utcnow() - timedelta(days=4)).isoformat()
            },
            {
                "category": "Mitochondrial Disorders",
                "total_questions": 15,
                "correct_answers": 13,
                "accuracy": 0.87,
                "last_practiced": (datetime.utcnow() - timedelta(days=1)).isoformat()
            }
        ]
    
    def _get_mock_history(self, user_id: Optional[str], days: int) -> List[Dict]:
        """Get mock history data."""
        history = []
        for i in range(min(days, 14)):
            date = datetime.utcnow() - timedelta(days=i)
            questions = 10 + (i % 5)
            correct = int(questions * (0.65 + (i % 3) * 0.05))
            
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "sessions": 1 + (i % 2),
                "questions": questions,
                "correct": correct,
                "accuracy": correct / questions
            })
        
        return history
    
    # ========================================
    # Database Methods
    # ========================================
    
    async def _get_db_dashboard(self, user_id: Optional[str]) -> Dict:
        """Get dashboard data from database."""
        client = get_supabase_client()
        if not client or not user_id:
            return self._get_mock_dashboard(user_id)
        
        try:
            # Get session stats
            sessions_response = client.table("sessions").select(
                "id, total_questions, correct_answers, time_spent_seconds, started_at"
            ).eq("user_id", user_id).eq("status", "completed").execute()
            
            sessions = sessions_response.data
            
            if not sessions:
                return {
                    "total_sessions": 0,
                    "total_questions": 0,
                    "total_correct": 0,
                    "overall_accuracy": 0.0,
                    "total_time_minutes": 0,
                    "streak_days": 0,
                    "recent_sessions": [],
                    "improvement": {"week_over_week": 0, "trend": "no_data"}
                }
            
            total_questions = sum(s.get("total_questions", 0) for s in sessions)
            total_correct = sum(s.get("correct_answers", 0) for s in sessions)
            total_time = sum(s.get("time_spent_seconds", 0) for s in sessions)
            
            # Calculate streak
            streak = self._calculate_streak(sessions)
            
            # Get recent sessions
            recent = sorted(sessions, key=lambda x: x["started_at"], reverse=True)[:5]
            
            return {
                "total_sessions": len(sessions),
                "total_questions": total_questions,
                "total_correct": total_correct,
                "overall_accuracy": total_correct / total_questions if total_questions > 0 else 0,
                "total_time_minutes": total_time // 60,
                "streak_days": streak,
                "recent_sessions": [
                    {
                        "id": s["id"],
                        "date": s["started_at"],
                        "questions": s.get("total_questions", 0),
                        "correct": s.get("correct_answers", 0)
                    }
                    for s in recent
                ],
                "improvement": await self._calculate_improvement(client, user_id)
            }
        except Exception as e:
            print(f"Error getting dashboard: {e}")
            return self._get_mock_dashboard(user_id)
    
    async def _get_db_categories_progress(self, user_id: Optional[str]) -> List[Dict]:
        """Get category progress from database."""
        client = get_supabase_client()
        if not client or not user_id:
            return self._get_mock_categories_progress(user_id)
        
        try:
            response = client.table("user_progress").select("*").eq("user_id", user_id).execute()
            
            if not response.data:
                return []
            
            return [
                {
                    "category": row["category"],
                    "total_questions": row.get("total_questions", 0),
                    "correct_answers": row.get("correct_answers", 0),
                    "accuracy": row.get("correct_answers", 0) / row.get("total_questions", 1) if row.get("total_questions", 0) > 0 else 0,
                    "last_practiced": row.get("last_practiced")
                }
                for row in response.data
            ]
        except Exception as e:
            print(f"Error getting categories progress: {e}")
            return self._get_mock_categories_progress(user_id)
    
    async def _get_db_history(self, user_id: Optional[str], days: int) -> List[Dict]:
        """Get history from database."""
        client = get_supabase_client()
        if not client or not user_id:
            return self._get_mock_history(user_id, days)
        
        try:
            start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            response = client.table("sessions").select(
                "started_at, total_questions, correct_answers"
            ).eq("user_id", user_id).eq("status", "completed").gte(
                "started_at", start_date
            ).order("started_at", desc=True).execute()
            
            # Group by date
            by_date = defaultdict(lambda: {"sessions": 0, "questions": 0, "correct": 0})
            
            for session in response.data:
                date = session["started_at"][:10]  # Get YYYY-MM-DD
                by_date[date]["sessions"] += 1
                by_date[date]["questions"] += session.get("total_questions", 0)
                by_date[date]["correct"] += session.get("correct_answers", 0)
            
            return [
                {
                    "date": date,
                    "sessions": data["sessions"],
                    "questions": data["questions"],
                    "correct": data["correct"],
                    "accuracy": data["correct"] / data["questions"] if data["questions"] > 0 else 0
                }
                for date, data in sorted(by_date.items(), reverse=True)
            ]
        except Exception as e:
            print(f"Error getting history: {e}")
            return self._get_mock_history(user_id, days)
    
    def _calculate_streak(self, sessions: List[Dict]) -> int:
        """Calculate the current practice streak in days."""
        if not sessions:
            return 0
        
        # Get unique dates
        dates = set()
        for session in sessions:
            date_str = session.get("started_at", "")[:10]
            if date_str:
                dates.add(date_str)
        
        if not dates:
            return 0
        
        # Count consecutive days from today
        streak = 0
        today = datetime.utcnow().date()
        
        for i in range(365):  # Max 1 year streak
            check_date = (today - timedelta(days=i)).isoformat()
            if check_date in dates:
                streak += 1
            else:
                break
        
        return streak
    
    async def _calculate_improvement(self, client, user_id: str) -> Dict:
        """Calculate week-over-week improvement."""
        try:
            this_week_start = (datetime.utcnow() - timedelta(days=7)).isoformat()
            last_week_start = (datetime.utcnow() - timedelta(days=14)).isoformat()
            
            # This week
            this_week = client.table("sessions").select(
                "total_questions, correct_answers"
            ).eq("user_id", user_id).eq("status", "completed").gte(
                "started_at", this_week_start
            ).execute()
            
            # Last week
            last_week = client.table("sessions").select(
                "total_questions, correct_answers"
            ).eq("user_id", user_id).eq("status", "completed").gte(
                "started_at", last_week_start
            ).lt("started_at", this_week_start).execute()
            
            this_correct = sum(s.get("correct_answers", 0) for s in this_week.data)
            this_total = sum(s.get("total_questions", 0) for s in this_week.data)
            last_correct = sum(s.get("correct_answers", 0) for s in last_week.data)
            last_total = sum(s.get("total_questions", 0) for s in last_week.data)
            
            this_acc = this_correct / this_total if this_total > 0 else 0
            last_acc = last_correct / last_total if last_total > 0 else 0
            
            improvement = this_acc - last_acc
            
            return {
                "week_over_week": round(improvement, 3),
                "trend": "improving" if improvement > 0.01 else ("declining" if improvement < -0.01 else "stable")
            }
        except Exception:
            return {"week_over_week": 0, "trend": "no_data"}


# Singleton instance
progress_repository = ProgressRepository()
