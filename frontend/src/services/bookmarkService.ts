import api from './api';

export interface Bookmark {
    id: string;
    user_id: string;
    question_id: string;
    note: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface BookmarkWithQuestion extends Bookmark {
    question_stem: string;
    question_category: string;
    question_difficulty: string;
}

export interface BookmarkList {
    total: number;
    bookmarks: BookmarkWithQuestion[];
}

export interface TagStats {
    tag: string;
    count: number;
}

export interface BookmarkCreate {
    question_id: string;
    note?: string;
    tags?: string[];
}

export interface BookmarkUpdate {
    note?: string;
    tags?: string[];
}

export const bookmarkService = {
    /**
     * Get all bookmarks for the current user
     */
    async getBookmarks(
        tag?: string,
        search?: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<BookmarkList> {
        const response = await api.get<BookmarkList>('/bookmarks', {
            params: { tag, search, limit, offset },
        });
        return response.data;
    },

    /**
     * Get all tags used by the current user
     */
    async getTags(): Promise<TagStats[]> {
        const response = await api.get<TagStats[]>('/bookmarks/tags');
        return response.data;
    },

    /**
     * Search bookmarks by note content or question stem
     */
    async searchBookmarks(query: string, limit: number = 20): Promise<BookmarkList> {
        const response = await api.get<BookmarkList>('/bookmarks/search', {
            params: { q: query, limit },
        });
        return response.data;
    },

    /**
     * Get bookmark for a specific question
     */
    async getBookmark(questionId: string): Promise<Bookmark | null> {
        const response = await api.get<Bookmark | null>(`/bookmarks/${questionId}`);
        return response.data;
    },

    /**
     * Create a new bookmark
     */
    async createBookmark(bookmark: BookmarkCreate): Promise<Bookmark> {
        const response = await api.post<Bookmark>('/bookmarks', bookmark);
        return response.data;
    },

    /**
     * Update an existing bookmark
     */
    async updateBookmark(questionId: string, update: BookmarkUpdate): Promise<Bookmark> {
        const response = await api.put<Bookmark>(`/bookmarks/${questionId}`, update);
        return response.data;
    },

    /**
     * Delete a bookmark
     */
    async deleteBookmark(questionId: string): Promise<void> {
        await api.delete(`/bookmarks/${questionId}`);
    },

    /**
     * Toggle bookmark status (create or delete)
     */
    async toggleBookmark(
        questionId: string,
        note?: string,
        tags?: string[]
    ): Promise<{ bookmarked: boolean; bookmark?: Bookmark }> {
        const existing = await this.getBookmark(questionId);

        if (existing) {
            await this.deleteBookmark(questionId);
            return { bookmarked: false };
        } else {
            const bookmark = await this.createBookmark({ question_id: questionId, note, tags });
            return { bookmarked: true, bookmark };
        }
    },
};

export default bookmarkService;
