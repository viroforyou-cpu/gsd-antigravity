"""
Bookmark Repository - handles all bookmark data access.
Supports both mock data and Supabase database.
"""
from typing import List, Dict, Optional
from datetime import datetime

from ..core.config import settings
from ..core.database import get_supabase_client, is_database_connected
from ..models.bookmark import (
    BookmarkResponse,
    BookmarkWithQuestion,
    BookmarkList,
    TagStats
)


class BookmarkRepository:
    """Repository for bookmark data access."""
    
    def __init__(self):
        self._use_mock = settings.use_mock_data or not is_database_connected()
    
    async def get_bookmarks(
        self,
        user_id: str,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> BookmarkList:
        """Get all bookmarks for a user with optional filtering."""
        if self._use_mock:
            return self._get_mock_bookmarks(user_id, tag, search, limit, offset)
        
        return await self._get_db_bookmarks(user_id, tag, search, limit, offset)
    
    async def get_bookmark(
        self,
        user_id: str,
        question_id: str
    ) -> Optional[BookmarkResponse]:
        """Get a specific bookmark by question ID."""
        if self._use_mock:
            return self._get_mock_bookmark(user_id, question_id)
        
        return await self._get_db_bookmark(user_id, question_id)
    
    async def create_bookmark(
        self,
        user_id: str,
        question_id: str,
        note: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> BookmarkResponse:
        """Create a new bookmark."""
        if self._use_mock:
            return self._create_mock_bookmark(user_id, question_id, note, tags)
        
        return await self._create_db_bookmark(user_id, question_id, note, tags)
    
    async def update_bookmark(
        self,
        user_id: str,
        question_id: str,
        note: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Optional[BookmarkResponse]:
        """Update an existing bookmark."""
        if self._use_mock:
            return self._update_mock_bookmark(user_id, question_id, note, tags)
        
        return await self._update_db_bookmark(user_id, question_id, note, tags)
    
    async def delete_bookmark(
        self,
        user_id: str,
        question_id: str
    ) -> bool:
        """Delete a bookmark."""
        if self._use_mock:
            return self._delete_mock_bookmark(user_id, question_id)
        
        return await self._delete_db_bookmark(user_id, question_id)
    
    async def get_tags(self, user_id: str) -> List[TagStats]:
        """Get all tags used by a user with counts."""
        if self._use_mock:
            return self._get_mock_tags(user_id)
        
        return await self._get_db_tags(user_id)
    
    async def search_bookmarks(
        self,
        user_id: str,
        query: str,
        limit: int = 20
    ) -> BookmarkList:
        """Search bookmarks by note content or question stem."""
        if self._use_mock:
            return self._search_mock_bookmarks(user_id, query, limit)
        
        return await self._search_db_bookmarks(user_id, query, limit)
    
    # ========================================
    # Mock Data Methods
    # ========================================
    
    def _get_mock_bookmarks(
        self,
        user_id: str,
        tag: Optional[str],
        search: Optional[str],
        limit: int,
        offset: int
    ) -> BookmarkList:
        """Get mock bookmarks."""
        all_bookmarks = [
            BookmarkWithQuestion(
                id="bm001",
                user_id=user_id,
                question_id="q001",
                note="Important: Remember the hexosaminidase A deficiency pattern",
                tags=["lysosomal", "enzymes"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                question_stem="A 4-month-old infant presents with failure to thrive...",
                question_category="Lysosomal Storage Disorders",
                question_difficulty="medium"
            ),
            BookmarkWithQuestion(
                id="bm002",
                user_id=user_id,
                question_id="q002",
                note="MPS types comparison - need to review",
                tags=["MPS", "lysosomal"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                question_stem="A 2-year-old child presents with developmental delay...",
                question_category="Lysosomal Storage Disorders",
                question_difficulty="hard"
            ),
            BookmarkWithQuestion(
                id="bm003",
                user_id=user_id,
                question_id="q003",
                note="22q11.2 deletion - cardiac defects association",
                tags=["chromosomal", "cardiac"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                question_stem="A newborn presents with hypotonia...",
                question_category="Chromosomal Abnormalities",
                question_difficulty="medium"
            )
        ]
        
        # Filter by tag
        if tag:
            all_bookmarks = [b for b in all_bookmarks if tag in b.tags]
        
        # Filter by search
        if search:
            search_lower = search.lower()
            all_bookmarks = [
                b for b in all_bookmarks
                if search_lower in b.note.lower() or search_lower in b.question_stem.lower()
            ]
        
        total = len(all_bookmarks)
        bookmarks = all_bookmarks[offset:offset + limit]
        
        return BookmarkList(total=total, bookmarks=bookmarks)
    
    def _get_mock_bookmark(
        self,
        user_id: str,
        question_id: str
    ) -> Optional[BookmarkResponse]:
        """Get a mock bookmark."""
        if question_id in ["q001", "q002", "q003"]:
            return BookmarkResponse(
                id=f"bm{question_id}",
                user_id=user_id,
                question_id=question_id,
                note="Sample note",
                tags=["sample"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        return None
    
    def _create_mock_bookmark(
        self,
        user_id: str,
        question_id: str,
        note: Optional[str],
        tags: Optional[List[str]]
    ) -> BookmarkResponse:
        """Create a mock bookmark."""
        return BookmarkResponse(
            id=f"bm-{question_id}",
            user_id=user_id,
            question_id=question_id,
            note=note,
            tags=tags or [],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    def _update_mock_bookmark(
        self,
        user_id: str,
        question_id: str,
        note: Optional[str],
        tags: Optional[List[str]]
    ) -> Optional[BookmarkResponse]:
        """Update a mock bookmark."""
        return BookmarkResponse(
            id=f"bm-{question_id}",
            user_id=user_id,
            question_id=question_id,
            note=note,
            tags=tags or [],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    def _delete_mock_bookmark(
        self,
        user_id: str,
        question_id: str
    ) -> bool:
        """Delete a mock bookmark."""
        return True
    
    def _get_mock_tags(self, user_id: str) -> List[TagStats]:
        """Get mock tags."""
        return [
            TagStats(tag="lysosomal", count=5),
            TagStats(tag="enzymes", count=3),
            TagStats(tag="MPS", count=2),
            TagStats(tag="chromosomal", count=4),
            TagStats(tag="cardiac", count=2),
        ]
    
    def _search_mock_bookmarks(
        self,
        user_id: str,
        query: str,
        limit: int
    ) -> BookmarkList:
        """Search mock bookmarks."""
        return self._get_mock_bookmarks(user_id, None, query, limit, 0)
    
    # ========================================
    # Database Methods
    # ========================================
    
    async def _get_db_bookmarks(
        self,
        user_id: str,
        tag: Optional[str],
        search: Optional[str],
        limit: int,
        offset: int
    ) -> BookmarkList:
        """Get bookmarks from database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_bookmarks(user_id, tag, search, limit, offset)
        
        try:
            query = client.table("question_bookmarks").select(
                "*, questions!inner(id, stem, category, difficulty)"
            ).eq("user_id", user_id)
            
            # Filter by tag using contains
            if tag:
                query = query.contains("tags", [tag])
            
            # Get total count first
            count_query = client.table("question_bookmarks").select(
                "id", count="exact"
            ).eq("user_id", user_id)
            
            if tag:
                count_query = count_query.contains("tags", [tag])
            
            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, 'count') else 0
            
            # Get paginated results
            response = query.order("created_at", desc=True).range(
                offset, offset + limit - 1
            ).execute()
            
            bookmarks = []
            for bm in response.data:
                question = bm.get("questions", {})
                bookmarks.append(BookmarkWithQuestion(
                    id=bm["id"],
                    user_id=bm["user_id"],
                    question_id=bm["question_id"],
                    note=bm.get("note"),
                    tags=bm.get("tags", []),
                    created_at=datetime.fromisoformat(bm["created_at"]),
                    updated_at=datetime.fromisoformat(bm["updated_at"]),
                    question_stem=question.get("stem", "")[:100] + "...",
                    question_category=question.get("category", ""),
                    question_difficulty=question.get("difficulty", "medium")
                ))
            
            return BookmarkList(total=total, bookmarks=bookmarks)
        except Exception as e:
            print(f"Error getting bookmarks: {e}")
            return self._get_mock_bookmarks(user_id, tag, search, limit, offset)
    
    async def _get_db_bookmark(
        self,
        user_id: str,
        question_id: str
    ) -> Optional[BookmarkResponse]:
        """Get a specific bookmark from database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_bookmark(user_id, question_id)
        
        try:
            response = client.table("question_bookmarks").select("*").eq(
                "user_id", user_id
            ).eq("question_id", question_id).execute()
            
            if response.data:
                bm = response.data[0]
                return BookmarkResponse(
                    id=bm["id"],
                    user_id=bm["user_id"],
                    question_id=bm["question_id"],
                    note=bm.get("note"),
                    tags=bm.get("tags", []),
                    created_at=datetime.fromisoformat(bm["created_at"]),
                    updated_at=datetime.fromisoformat(bm["updated_at"])
                )
            
            return None
        except Exception as e:
            print(f"Error getting bookmark: {e}")
            return None
    
    async def _create_db_bookmark(
        self,
        user_id: str,
        question_id: str,
        note: Optional[str],
        tags: Optional[List[str]]
    ) -> BookmarkResponse:
        """Create a bookmark in database."""
        client = get_supabase_client()
        if not client:
            return self._create_mock_bookmark(user_id, question_id, note, tags)
        
        try:
            response = client.table("question_bookmarks").insert({
                "user_id": user_id,
                "question_id": question_id,
                "note": note,
                "tags": tags or []
            }).execute()
            
            if response.data:
                bm = response.data[0]
                return BookmarkResponse(
                    id=bm["id"],
                    user_id=bm["user_id"],
                    question_id=bm["question_id"],
                    note=bm.get("note"),
                    tags=bm.get("tags", []),
                    created_at=datetime.fromisoformat(bm["created_at"]),
                    updated_at=datetime.fromisoformat(bm["updated_at"])
                )
            
            return self._create_mock_bookmark(user_id, question_id, note, tags)
        except Exception as e:
            print(f"Error creating bookmark: {e}")
            return self._create_mock_bookmark(user_id, question_id, note, tags)
    
    async def _update_db_bookmark(
        self,
        user_id: str,
        question_id: str,
        note: Optional[str],
        tags: Optional[List[str]]
    ) -> Optional[BookmarkResponse]:
        """Update a bookmark in database."""
        client = get_supabase_client()
        if not client:
            return self._update_mock_bookmark(user_id, question_id, note, tags)
        
        try:
            update_data = {"updated_at": datetime.utcnow().isoformat()}
            if note is not None:
                update_data["note"] = note
            if tags is not None:
                update_data["tags"] = tags
            
            response = client.table("question_bookmarks").update(update_data).eq(
                "user_id", user_id
            ).eq("question_id", question_id).execute()
            
            if response.data:
                bm = response.data[0]
                return BookmarkResponse(
                    id=bm["id"],
                    user_id=bm["user_id"],
                    question_id=bm["question_id"],
                    note=bm.get("note"),
                    tags=bm.get("tags", []),
                    created_at=datetime.fromisoformat(bm["created_at"]),
                    updated_at=datetime.fromisoformat(bm["updated_at"])
                )
            
            return None
        except Exception as e:
            print(f"Error updating bookmark: {e}")
            return None
    
    async def _delete_db_bookmark(
        self,
        user_id: str,
        question_id: str
    ) -> bool:
        """Delete a bookmark from database."""
        client = get_supabase_client()
        if not client:
            return self._delete_mock_bookmark(user_id, question_id)
        
        try:
            response = client.table("question_bookmarks").delete().eq(
                "user_id", user_id
            ).eq("question_id", question_id).execute()
            
            return True
        except Exception as e:
            print(f"Error deleting bookmark: {e}")
            return False
    
    async def _get_db_tags(self, user_id: str) -> List[TagStats]:
        """Get tags from database."""
        client = get_supabase_client()
        if not client:
            return self._get_mock_tags(user_id)
        
        try:
            response = client.table("question_bookmarks").select(
                "tags"
            ).eq("user_id", user_id).execute()
            
            # Count tags
            tag_counts = {}
            for bm in response.data:
                for tag in bm.get("tags", []):
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            return [
                TagStats(tag=tag, count=count)
                for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])
            ]
        except Exception as e:
            print(f"Error getting tags: {e}")
            return self._get_mock_tags(user_id)
    
    async def _search_db_bookmarks(
        self,
        user_id: str,
        query: str,
        limit: int
    ) -> BookmarkList:
        """Search bookmarks in database."""
        client = get_supabase_client()
        if not client:
            return self._search_mock_bookmarks(user_id, query, limit)
        
        try:
            # Search in note and question stem
            response = client.table("question_bookmarks").select(
                "*, questions!inner(id, stem, category, difficulty)"
            ).eq("user_id", user_id).or_(
                f"note.ilike.%{query}%,questions.stem.ilike.%{query}"
            ).limit(limit).execute()
            
            bookmarks = []
            for bm in response.data:
                question = bm.get("questions", {})
                bookmarks.append(BookmarkWithQuestion(
                    id=bm["id"],
                    user_id=bm["user_id"],
                    question_id=bm["question_id"],
                    note=bm.get("note"),
                    tags=bm.get("tags", []),
                    created_at=datetime.fromisoformat(bm["created_at"]),
                    updated_at=datetime.fromisoformat(bm["updated_at"]),
                    question_stem=question.get("stem", "")[:100] + "...",
                    question_category=question.get("category", ""),
                    question_difficulty=question.get("difficulty", "medium")
                ))
            
            return BookmarkList(total=len(bookmarks), bookmarks=bookmarks)
        except Exception as e:
            print(f"Error searching bookmarks: {e}")
            return self._search_mock_bookmarks(user_id, query, limit)


# Singleton instance
bookmark_repository = BookmarkRepository()
