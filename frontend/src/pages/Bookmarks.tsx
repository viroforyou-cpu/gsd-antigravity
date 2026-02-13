import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Card, CardBody, CardHeader, Button } from '../components/common';
import { bookmarkService } from '../services/bookmarkService';
import type { BookmarkWithQuestion, TagStats } from '../services/bookmarkService';

export function Bookmarks() {
    const [bookmarks, setBookmarks] = useState<BookmarkWithQuestion[]>([]);
    const [tags, setTags] = useState<TagStats[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadBookmarks();
        loadTags();
    }, [selectedTag, searchQuery]);

    const loadBookmarks = async () => {
        setLoading(true);
        try {
            const result = await bookmarkService.getBookmarks(
                selectedTag || undefined,
                searchQuery || undefined
            );
            setBookmarks(result.bookmarks);
            setTotal(result.total);
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTags = async () => {
        try {
            const result = await bookmarkService.getTags();
            setTags(result);
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };

    const handleDeleteBookmark = async (questionId: string) => {
        try {
            await bookmarkService.deleteBookmark(questionId);
            setBookmarks(bookmarks.filter(b => b.question_id !== questionId));
            setTotal(total - 1);
            loadTags(); // Refresh tag counts
        } catch (error) {
            console.error('Error deleting bookmark:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadBookmarks();
    };

    return (
        <Layout title="Bookmarks">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Bookmarks</h2>
                        <p className="text-gray-600">{total} saved questions</p>
                    </div>
                    <Link to="/practice">
                        <Button>Start Practice</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Tags */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedTag(null)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedTag === null
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="font-medium">All bookmarks</span>
                                        <span className="text-sm text-gray-500 ml-2">({total})</span>
                                    </button>

                                    {tags.map((tag) => (
                                        <button
                                            key={tag.tag}
                                            onClick={() => setSelectedTag(tag.tag)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedTag === tag.tag
                                                    ? 'bg-primary-100 text-primary-700'
                                                    : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            <span className="font-medium">{tag.tag}</span>
                                            <span className="text-sm text-gray-500 ml-2">({tag.count})</span>
                                        </button>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Search */}
                        <Card className="mb-6">
                            <CardBody>
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search bookmarks..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <Button type="submit">Search</Button>
                                    {searchQuery && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </form>
                            </CardBody>
                        </Card>

                        {/* Bookmarks List */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading bookmarks...</p>
                            </div>
                        ) : bookmarks.length === 0 ? (
                            <Card>
                                <CardBody className="text-center py-12">
                                    <svg
                                        className="w-16 h-16 mx-auto text-gray-400 mb-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        No bookmarks found
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {searchQuery || selectedTag
                                            ? 'Try adjusting your search or filter'
                                            : 'Start bookmarking questions to save them for later'}
                                    </p>
                                    <Link to="/practice">
                                        <Button>Start Practice</Button>
                                    </Link>
                                </CardBody>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {bookmarks.map((bookmark) => (
                                    <Card key={bookmark.id}>
                                        <CardBody>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    {/* Tags */}
                                                    {bookmark.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                            {bookmark.tags.map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Question stem */}
                                                    <p className="text-gray-900 mb-2 line-clamp-2">
                                                        {bookmark.question_stem}
                                                    </p>

                                                    {/* Category and difficulty */}
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <span className="px-2 py-0.5 rounded bg-gray-100">
                                                            {bookmark.question_category}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded ${bookmark.question_difficulty === 'easy'
                                                                ? 'bg-green-100 text-green-700'
                                                                : bookmark.question_difficulty === 'medium'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {bookmark.question_difficulty}
                                                        </span>
                                                    </div>

                                                    {/* Note */}
                                                    {bookmark.note && (
                                                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
                                                            <span className="font-medium text-yellow-800">Note:</span>{' '}
                                                            {bookmark.note}
                                                        </div>
                                                    )}

                                                    {/* Created date */}
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        Saved on {new Date(bookmark.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Link to={`/practice?question=${bookmark.question_id}`}>
                                                        <Button variant="outline" size="sm">
                                                            Practice
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteBookmark(bookmark.question_id)}
                                                        className="text-red-600 hover:bg-red-50"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Bookmarks;
