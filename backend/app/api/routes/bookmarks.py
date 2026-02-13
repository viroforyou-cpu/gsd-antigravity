"""
Question Bookmark API routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from ...models.bookmark import (
    BookmarkCreate,
    BookmarkUpdate,
    BookmarkResponse,
    BookmarkList,
    TagStats
)
from ...services.bookmark_repository import bookmark_repository
from ...services.auth_service import get_current_user_optional

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=BookmarkList)
async def get_bookmarks(
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, description="Search in notes"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user = Depends(get_current_user_optional)
):
    """
    Get all bookmarks for the current user.
    
    Supports filtering by tag and searching in notes.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return BookmarkList(total=0, bookmarks=[])
    
    return await bookmark_repository.get_bookmarks(
        user_id=user_id,
        tag=tag,
        search=search,
        limit=limit,
        offset=offset
    )


@router.get("/tags", response_model=list[TagStats])
async def get_tags(
    user = Depends(get_current_user_optional)
):
    """
    Get all tags used by the current user with counts.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return []
    
    return await bookmark_repository.get_tags(user_id)


@router.get("/search", response_model=BookmarkList)
async def search_bookmarks(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    user = Depends(get_current_user_optional)
):
    """
    Search bookmarks by note content or question stem.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return BookmarkList(total=0, bookmarks=[])
    
    return await bookmark_repository.search_bookmarks(
        user_id=user_id,
        query=q,
        limit=limit
    )


@router.get("/{question_id}", response_model=Optional[BookmarkResponse])
async def get_bookmark(
    question_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Get bookmark for a specific question.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        return None
    
    return await bookmark_repository.get_bookmark(user_id, question_id)


@router.post("", response_model=BookmarkResponse)
async def create_bookmark(
    bookmark: BookmarkCreate,
    user = Depends(get_current_user_optional)
):
    """
    Create a new bookmark for a question.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if bookmark already exists
    existing = await bookmark_repository.get_bookmark(user_id, bookmark.question_id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Bookmark already exists for this question"
        )
    
    return await bookmark_repository.create_bookmark(
        user_id=user_id,
        question_id=bookmark.question_id,
        note=bookmark.note,
        tags=bookmark.tags
    )


@router.put("/{question_id}", response_model=BookmarkResponse)
async def update_bookmark(
    question_id: str,
    update: BookmarkUpdate,
    user = Depends(get_current_user_optional)
):
    """
    Update an existing bookmark.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = await bookmark_repository.update_bookmark(
        user_id=user_id,
        question_id=question_id,
        note=update.note,
        tags=update.tags
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return result


@router.delete("/{question_id}")
async def delete_bookmark(
    question_id: str,
    user = Depends(get_current_user_optional)
):
    """
    Delete a bookmark.
    """
    user_id = user["id"] if user else None
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    success = await bookmark_repository.delete_bookmark(user_id, question_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"message": "Bookmark deleted successfully"}
