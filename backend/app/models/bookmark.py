"""
Question Bookmark models for user bookmarks and notes.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class BookmarkBase(BaseModel):
    """Base model for bookmarks."""
    note: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class BookmarkCreate(BookmarkBase):
    """Model for creating a new bookmark."""
    question_id: str


class BookmarkUpdate(BaseModel):
    """Model for updating a bookmark."""
    note: Optional[str] = None
    tags: Optional[List[str]] = None


class BookmarkResponse(BookmarkBase):
    """Response model for a bookmark."""
    id: str
    user_id: str
    question_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookmarkWithQuestion(BookmarkResponse):
    """Bookmark with question details."""
    question_stem: str
    question_category: str
    question_difficulty: str


class BookmarkList(BaseModel):
    """Model for a list of bookmarks."""
    total: int
    bookmarks: List[BookmarkWithQuestion]


class TagStats(BaseModel):
    """Model for tag statistics."""
    tag: str
    count: int
