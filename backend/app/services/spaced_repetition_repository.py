"""
Spaced Repetition Repository - handles all SRS data access.
Implements the SM-2 algorithm for optimal review scheduling.
"""
from typing import List, Dict, Optional, Tuple
from datetime import date, datetime, timedelta
from decimal import Decimal
import random

from ..core.config import settings
from ..core.database import get_supabase_client, is_database_connected
from ..models.spaced_repetition import (
    SpacedRepetitionResponse,
    ReviewQueue,
    ReviewQuestion,
    ReviewResult,
    SRSStats,
    ReviewQuality
)


class SpacedRepetitionRepository:
    """Repository for spaced repetition data access with SM-2 algorithm."""
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
    
    # ========================================
    # SM-2 Algorithm Implementation
    # ========================================
    
    def calculate_next_review(
        self,
        current_ease: Decimal,
        current_interval: int,
        repetitions: int,
        quality: int
    ) -> Tuple[Decimal, int, int]:
        """
        SM-2 algorithm variant for MCQ practice.
        
        Quality mapping for MCQ:
        - 5: Correct answer, high confidence, quick response
        - 4: Correct answer, some hesitation
        - 3: Correct answer, low confidence or took hints
        - 2: Incorrect answer, but close
        - 1: Incorrect answer, no idea
        - 0: Complete failure / did not attempt
        
        Returns: (new_ease, new_interval, new_repetitions)
        """
        if quality >= 3:
            # Successful recall
            if repetitions == 0:
                new_interval = 1
            elif repetitions == 1:
                new_interval = 6
            else:
                new_interval = round(current_interval * float(current_ease))
            
            new_repetitions = repetitions + 1
            # Update ease factor
            new_ease = current_ease + Decimal(
                str(0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            )
        else:
            # Failed recall - reset
            new_interval = 1
            new_repetitions = 0
            new_ease = max(Decimal("1.3"), current_ease - Decimal("0.2"))
        
        return max(Decimal("1.3"), new_ease), new_interval, new_repetitions
    
    # ========================================
    # Public API Methods
    # ========================================
    
    async def get_due_reviews(
        self,
        user_id: str,
        limit: int = 20
    ) -> ReviewQueue:
        """Get questions due for review today."""
        if self._use_mock:
            return self._get_mock_review_queue(user_id, limit)
        
        return await self._get_db_due_reviews(user_id, limit)
    
    async def submit_review(
        self,
        user_id: str,
        question_id: str,
        quality: int,
        time_spent_seconds: Optional[int] = None,
        is_correct: Optional[bool] = None
    ) -> ReviewResult:
        """Submit a review result and update SRS data."""
        if self._use_mock:
            return self._get_mock_review_result(question_id, quality)
        
        return await self._db_submit_review(user_id, question_id, quality, time_spent_seconds, is_correct)
    
    async def get_srs_stats(self, user_id: str) -> SRSStats:
        """Get SRS statistics for a user."""
        if self._use_mock:
            return self._get_mock_srs_stats(user_id)
        
        return await self._get_db_srs_stats(user_id)
    
    async def get_upcoming_reviews(
        self,
        user_id: str,
        days: int = 14
    ) -> List[Dict]:
        """Get upcoming review schedule."""
        if self._use_mock:
            return self._get_mock_upcoming(user_id, days)
        
        return await self._get_db_upcoming_reviews(user_id, days)
    
    async def initialize_srs_for_question(
        self,
        user_id: str,
        question_id: str
    ) -> SpacedRepetitionResponse:
        """Initialize SRS data for a new question."""
        if self._use_mock:
            return self._get_mock_srs_entry(user_id, question_id)
        
        return await self._db_initialize_srs(user_id, question_id)
    
    async def get_question_srs(
        self,
        user_id: str,
        question_id: str
    ) -> Optional[SpacedRepetitionResponse]:
        """Get SRS data for a specific question."""
        if self._use_mock:
            return self._get_mock_srs_entry(user_id, question_id)
        
        return await self._get_db_question_srs(user_id, question_id)
    
    # ========================================
    # Mock Data Methods
    # ========================================
    
    def _get_mock_review_queue(self, user_id: str, limit: int) -> ReviewQueue:
        """Get mock review queue."""
        today = date.today()
        
        questions = [
            ReviewQuestion(
                question_id="q001",
                stem="A 4-month-old infant presents with failure to thrive, hepatosplenomegaly, and developmental regression. Physical exam reveals cherry-red spot in the macula. Laboratory studies show normal liver enzymes but absent hexosaminidase A activity in leukocytes.",
                options={
                    "A": "Niemann-Pick disease type A",
                    "B": "Tay-Sachs disease",
                    "C": "Gaucher disease type 1",
                    "D": "Fabry disease",
                    "E": "Krabbe disease"
                },
                category="Lysosomal Storage Disorders",
                difficulty="medium",
                srs_data=SpacedRepetitionResponse(
                    id="srs001",
                    user_id=user_id,
                    question_id="q001",
                    ease_factor=Decimal("2.50"),
                    interval_days=6,
                    repetitions=2,
                    next_review_date=today,
                    last_review_date=today - timedelta(days=6),
                    total_reviews=5,
                    total_correct=4,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                ),
                is_overdue=False,
                days_overdue=0
            ),
            ReviewQuestion(
                question_id="q002",
                stem="A 2-year-old child presents with developmental delay, coarse facial features, and hepatosplenomegaly. Bone X-rays show dysostosis multiplex. Which enzyme deficiency is most likely?",
                options={
                    "A": "Alpha-L-iduronidase",
                    "B": "Iduronate sulfatase",
                    "C": "Heparan N-sulfatase",
                    "D": "Alpha-galactosidase A",
                    "E": "Glucocerebrosidase"
                },
                category="Lysosomal Storage Disorders",
                difficulty="hard",
                srs_data=SpacedRepetitionResponse(
                    id="srs002",
                    user_id=user_id,
                    question_id="q002",
                    ease_factor=Decimal("2.30"),
                    interval_days=3,
                    repetitions=1,
                    next_review_date=today - timedelta(days=2),
                    last_review_date=today - timedelta(days=5),
                    total_reviews=3,
                    total_correct=2,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                ),
                is_overdue=True,
                days_overdue=2
            ),
            ReviewQuestion(
                question_id="q003",
                stem="A newborn presents with hypotonia, feeding difficulties, and distinctive facial features including a small jaw and cleft palate. Cardiac examination reveals tetralogy of Fallot. What is the most likely diagnosis?",
                options={
                    "A": "DiGeorge syndrome (22q11.2 deletion)",
                    "B": "Down syndrome",
                    "C": "Pierre Robin sequence",
                    "D": "Edwards syndrome",
                    "E": "Patau syndrome"
                },
                category="Chromosomal Abnormalities",
                difficulty="medium",
                srs_data=None,
                is_overdue=False,
                days_overdue=0
            )
        ]
        
        return ReviewQueue(
            due_today=3,
            overdue=1,
            upcoming_week=7,
            questions=questions[:limit]
        )
    
    def _get_mock_review_result(
        self,
        question_id: str,
        quality: int
    ) -> ReviewResult:
        """Get mock review result."""
        new_ease, new_interval, _ = self.calculate_next_review(
            Decimal("2.50"), 6, 2, quality
        )
        
        is_correct = quality >= 3
        
        return ReviewResult(
            question_id=question_id,
            previous_interval=6,
            new_interval=new_interval,
            previous_ease=Decimal("2.50"),
            new_ease=new_ease,
            next_review_date=date.today() + timedelta(days=new_interval),
            is_correct=is_correct,
            message="Great job!" if is_correct else "Keep practicing!"
        )
    
    def _get_mock_srs_stats(self, user_id: str) -> SRSStats:
        """Get mock SRS statistics."""
        today = date.today()
        forecast = []
        for i in range(14):
            forecast.append({
                "date": (today + timedelta(days=i)).isoformat(),
                "count": random.randint(0, 10) if i > 0 else 3
            })
        
        return SRSStats(
            total_cards=45,
            cards_due_today=3,
            cards_overdue=1,
            cards_upcoming_week=12,
            average_ease=Decimal("2.45"),
            average_interval=Decimal("8.5"),
            retention_rate=Decimal("0.85"),
            total_reviews=150,
            reviews_today=3,
            forecast=forecast
        )
    
    def _get_mock_upcoming(self, user_id: str, days: int) -> List[Dict]:
        """Get mock upcoming reviews."""
        today = date.today()
        upcoming = []
        
        for i in range(days):
            upcoming.append({
                "date": (today + timedelta(days=i)).isoformat(),
                "count": random.randint(0, 8)
            })
        
        return upcoming
    
    def _get_mock_srs_entry(
        self,
        user_id: str,
        question_id: str
    ) -> SpacedRepetitionResponse:
        """Get mock SRS entry."""
        return SpacedRepetitionResponse(
            id=f"srs-{question_id}",
            user_id=user_id,
            question_id=question_id,
            ease_factor=Decimal("2.50"),
            interval_days=0,
            repetitions=0,
            next_review_date=date.today(),
            last_review_date=None,
            total_reviews=0,
            total_correct=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    # ========================================
    # Database Methods
    # ========================================
    
    async def _get_db_due_reviews(
        self,
        user_id: str,
        limit: int
    ) -> ReviewQueue:
        """Get due reviews from database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_review_queue(user_id, limit)
        
        try:
            today = date.today().isoformat()
            
            # Get SRS entries due today or overdue
            srs_response = client.table("spaced_repetition").select(
                "*, questions!inner(id, stem, options, category, difficulty)"
            ).eq("user_id", user_id).lte(
                "next_review_date", today
            ).order("next_review_date").limit(limit).execute()
            
            questions = []
            overdue_count = 0
            
            for srs in srs_response.data:
                question = srs.get("questions", {})
                next_review = date.fromisoformat(srs["next_review_date"])
                is_overdue = next_review < date.today()
                
                if is_overdue:
                    overdue_count += 1
                
                questions.append(ReviewQuestion(
                    question_id=question.get("id", srs["question_id"]),
                    stem=question.get("stem", ""),
                    options=question.get("options", {}),
                    category=question.get("category", ""),
                    difficulty=question.get("difficulty", "medium"),
                    srs_data=SpacedRepetitionResponse(
                        id=srs["id"],
                        user_id=srs["user_id"],
                        question_id=srs["question_id"],
                        ease_factor=Decimal(str(srs["ease_factor"])),
                        interval_days=srs["interval_days"],
                        repetitions=srs["repetitions"],
                        next_review_date=next_review,
                        last_review_date=date.fromisoformat(srs["last_review_date"]) if srs.get("last_review_date") else None,
                        total_reviews=srs["total_reviews"],
                        total_correct=srs["total_correct"],
                        created_at=datetime.fromisoformat(srs["created_at"]),
                        updated_at=datetime.fromisoformat(srs["updated_at"])
                    ),
                    is_overdue=is_overdue,
                    days_overdue=(date.today() - next_review).days if is_overdue else 0
                ))
            
            # Get upcoming week count
            week_ahead = (date.today() + timedelta(days=7)).isoformat()
            upcoming_response = client.table("spaced_repetition").select(
                "id", count="exact"
            ).eq("user_id", user_id).gt(
                "next_review_date", today
            ).lte("next_review_date", week_ahead).execute()
            
            upcoming_week = upcoming_response.count if hasattr(upcoming_response, 'count') else 0
            
            return ReviewQueue(
                due_today=len(questions),
                overdue=overdue_count,
                upcoming_week=upcoming_week,
                questions=questions
            )
        except Exception as e:
            print(f"Error getting due reviews: {e}")
            return self._get_mock_review_queue(user_id, limit)
    
    async def _db_submit_review(
        self,
        user_id: str,
        question_id: str,
        quality: int,
        time_spent_seconds: Optional[int],
        is_correct: Optional[bool]
    ) -> ReviewResult:
        """Submit review to database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_review_result(question_id, quality)
        
        try:
            # Get current SRS data
            srs_response = client.table("spaced_repetition").select("*").eq(
                "user_id", user_id
            ).eq("question_id", question_id).execute()
            
            if srs_response.data:
                srs = srs_response.data[0]
                current_ease = Decimal(str(srs["ease_factor"]))
                current_interval = srs["interval_days"]
                repetitions = srs["repetitions"]
            else:
                # Initialize new SRS entry
                current_ease = Decimal("2.50")
                current_interval = 0
                repetitions = 0
            
            # Calculate new values
            new_ease, new_interval, new_repetitions = self.calculate_next_review(
                current_ease, current_interval, repetitions, quality
            )
            
            is_correct_bool = quality >= 3
            
            # Update database
            next_review = date.today() + timedelta(days=new_interval)
            
            update_data = {
                "ease_factor": float(new_ease),
                "interval_days": new_interval,
                "repetitions": new_repetitions,
                "next_review_date": next_review.isoformat(),
                "last_review_date": date.today().isoformat(),
                "total_reviews": (srs.get("total_reviews", 0) + 1) if srs_response.data else 1,
                "total_correct": (srs.get("total_correct", 0) + (1 if is_correct_bool else 0)) if srs_response.data else (1 if is_correct_bool else 0),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if srs_response.data:
                client.table("spaced_repetition").update(update_data).eq(
                    "id", srs["id"]
                ).execute()
            else:
                # Create new entry
                client.table("spaced_repetition").insert({
                    "user_id": user_id,
                    "question_id": question_id,
                    **update_data
                }).execute()
            
            return ReviewResult(
                question_id=question_id,
                previous_interval=current_interval,
                new_interval=new_interval,
                previous_ease=current_ease,
                new_ease=new_ease,
                next_review_date=next_review,
                is_correct=is_correct_bool,
                message="Great job!" if is_correct_bool else "Keep practicing!"
            )
        except Exception as e:
            print(f"Error submitting review: {e}")
            return self._get_mock_review_result(question_id, quality)
    
    async def _get_db_srs_stats(self, user_id: str) -> SRSStats:
        """Get SRS statistics from database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_srs_stats(user_id)
        
        try:
            today = date.today().isoformat()
            
            # Get all SRS entries for user
            response = client.table("spaced_repetition").select("*").eq(
                "user_id", user_id
            ).execute()
            
            entries = response.data
            
            if not entries:
                return SRSStats(
                    total_cards=0,
                    cards_due_today=0,
                    cards_overdue=0,
                    cards_upcoming_week=0,
                    average_ease=Decimal("2.50"),
                    average_interval=Decimal("0"),
                    retention_rate=Decimal("0"),
                    total_reviews=0,
                    reviews_today=0,
                    forecast=[]
                )
            
            total_cards = len(entries)
            due_today = sum(1 for e in entries if e["next_review_date"] <= today)
            overdue = sum(1 for e in entries if e["next_review_date"] < today)
            
            week_ahead = (date.today() + timedelta(days=7)).isoformat()
            upcoming_week = sum(
                1 for e in entries 
                if today < e["next_review_date"] <= week_ahead
            )
            
            avg_ease = sum(float(e["ease_factor"]) for e in entries) / total_cards
            avg_interval = sum(e["interval_days"] for e in entries) / total_cards
            
            total_reviews = sum(e["total_reviews"] for e in entries)
            total_correct = sum(e["total_correct"] for e in entries)
            retention = total_correct / total_reviews if total_reviews > 0 else 0
            
            # Generate forecast
            forecast = []
            for i in range(14):
                target_date = (date.today() + timedelta(days=i)).isoformat()
                count = sum(
                    1 for e in entries 
                    if e["next_review_date"] == target_date
                )
                forecast.append({"date": target_date, "count": count})
            
            return SRSStats(
                total_cards=total_cards,
                cards_due_today=due_today,
                cards_overdue=overdue,
                cards_upcoming_week=upcoming_week,
                average_ease=Decimal(str(round(avg_ease, 2))),
                average_interval=Decimal(str(round(avg_interval, 1))),
                retention_rate=Decimal(str(round(retention, 2))),
                total_reviews=total_reviews,
                reviews_today=due_today,
                forecast=forecast
            )
        except Exception as e:
            print(f"Error getting SRS stats: {e}")
            return self._get_mock_srs_stats(user_id)
    
    async def _get_db_upcoming_reviews(
        self,
        user_id: str,
        days: int
    ) -> List[Dict]:
        """Get upcoming reviews from database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_upcoming(user_id, days)
        
        try:
            end_date = (date.today() + timedelta(days=days)).isoformat()
            
            response = client.table("spaced_repetition").select(
                "next_review_date"
            ).eq("user_id", user_id).lte(
                "next_review_date", end_date
            ).execute()
            
            # Group by date
            by_date = {}
            for entry in response.data:
                d = entry["next_review_date"]
                by_date[d] = by_date.get(d, 0) + 1
            
            # Fill in all dates
            upcoming = []
            for i in range(days):
                target_date = (date.today() + timedelta(days=i)).isoformat()
                upcoming.append({
                    "date": target_date,
                    "count": by_date.get(target_date, 0)
                })
            
            return upcoming
        except Exception as e:
            print(f"Error getting upcoming reviews: {e}")
            return self._get_mock_upcoming(user_id, days)
    
    async def _db_initialize_srs(
        self,
        user_id: str,
        question_id: str
    ) -> SpacedRepetitionResponse:
        """Initialize SRS entry in database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_srs_entry(user_id, question_id)
        
        try:
            response = client.table("spaced_repetition").insert({
                "user_id": user_id,
                "question_id": question_id,
                "ease_factor": 2.50,
                "interval_days": 0,
                "repetitions": 0,
                "next_review_date": date.today().isoformat(),
                "total_reviews": 0,
                "total_correct": 0
            }).execute()
            
            if response.data:
                srs = response.data[0]
                return SpacedRepetitionResponse(
                    id=srs["id"],
                    user_id=srs["user_id"],
                    question_id=srs["question_id"],
                    ease_factor=Decimal(str(srs["ease_factor"])),
                    interval_days=srs["interval_days"],
                    repetitions=srs["repetitions"],
                    next_review_date=date.fromisoformat(srs["next_review_date"]),
                    last_review_date=None,
                    total_reviews=srs["total_reviews"],
                    total_correct=srs["total_correct"],
                    created_at=datetime.fromisoformat(srs["created_at"]),
                    updated_at=datetime.fromisoformat(srs["updated_at"])
                )
            
            return self._get_mock_srs_entry(user_id, question_id)
        except Exception as e:
            print(f"Error initializing SRS: {e}")
            return self._get_mock_srs_entry(user_id, question_id)
    
    async def _get_db_question_srs(
        self,
        user_id: str,
        question_id: str
    ) -> Optional[SpacedRepetitionResponse]:
        """Get SRS data for a specific question from database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_srs_entry(user_id, question_id)
        
        try:
            response = client.table("spaced_repetition").select("*").eq(
                "user_id", user_id
            ).eq("question_id", question_id).execute()
            
            if response.data:
                srs = response.data[0]
                return SpacedRepetitionResponse(
                    id=srs["id"],
                    user_id=srs["user_id"],
                    question_id=srs["question_id"],
                    ease_factor=Decimal(str(srs["ease_factor"])),
                    interval_days=srs["interval_days"],
                    repetitions=srs["repetitions"],
                    next_review_date=date.fromisoformat(srs["next_review_date"]),
                    last_review_date=date.fromisoformat(srs["last_review_date"]) if srs.get("last_review_date") else None,
                    total_reviews=srs["total_reviews"],
                    total_correct=srs["total_correct"],
                    created_at=datetime.fromisoformat(srs["created_at"]),
                    updated_at=datetime.fromisoformat(srs["updated_at"])
                )
            
            return None
        except Exception as e:
            print(f"Error getting question SRS: {e}")
            return None


# Singleton instance
spaced_repetition_repository = SpacedRepetitionRepository()
