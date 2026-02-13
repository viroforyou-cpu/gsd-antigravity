import { useState, useEffect } from 'react';
import { bookmarkService } from '../../services/bookmarkService';
import type { Bookmark } from '../../services/bookmarkService';

interface BookmarkButtonProps {
    questionId: string;
    initialBookmarked?: boolean;
    onBookmarkChange?: (bookmarked: boolean) => void;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function BookmarkButton({
    questionId,
    initialBookmarked = false,
    onBookmarkChange,
    showLabel = false,
    size = 'md',
}: BookmarkButtonProps) {
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [loading, setLoading] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [note, setNote] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [_existingBookmark, setExistingBookmark] = useState<Bookmark | null>(null);

    // Check bookmark status on mount
    useEffect(() => {
        const checkBookmark = async () => {
            try {
                const bookmark = await bookmarkService.getBookmark(questionId);
                if (bookmark) {
                    setBookmarked(true);
                    setExistingBookmark(bookmark);
                    setNote(bookmark.note || '');
                    setTags(bookmark.tags || []);
                }
            } catch (error) {
                console.error('Error checking bookmark status:', error);
            }
        };
        checkBookmark();
    }, [questionId]);

    const handleClick = async () => {
        if (bookmarked) {
            // Remove bookmark
            setLoading(true);
            try {
                await bookmarkService.deleteBookmark(questionId);
                setBookmarked(false);
                setExistingBookmark(null);
                onBookmarkChange?.(false);
            } catch (error) {
                console.error('Error removing bookmark:', error);
            } finally {
                setLoading(false);
            }
        } else {
            // Show modal to add note
            setShowNoteModal(true);
        }
    };

    const handleSaveBookmark = async () => {
        setLoading(true);
        try {
            const result = await bookmarkService.createBookmark({
                question_id: questionId,
                note: note || undefined,
                tags: tags.length > 0 ? tags : undefined,
            });
            setBookmarked(true);
            setExistingBookmark(result);
            onBookmarkChange?.(true);
            setShowNoteModal(false);
        } catch (error) {
            console.error('Error creating bookmark:', error);
        } finally {
            setLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'p-1.5 text-sm',
        md: 'p-2 text-base',
        lg: 'p-3 text-lg',
    };

    const iconSizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                className={`
          ${sizeClasses[size]}
          rounded-lg transition-colors
          ${bookmarked
                        ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                    }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
                title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
                {loading ? (
                    <svg className={`animate-spin ${iconSizeClasses[size]}`} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : (
                    <svg
                        className={iconSizeClasses[size]}
                        fill={bookmarked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                    </svg>
                )}
                {showLabel && (
                    <span className="ml-2">
                        {bookmarked ? 'Bookmarked' : 'Bookmark'}
                    </span>
                )}
            </button>

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Bookmark</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note (optional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add a note to help you remember..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tags (optional)
                                </label>
                                <input
                                    type="text"
                                    value={tags.join(', ')}
                                    onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                    placeholder="Enter tags separated by commas"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowNoteModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveBookmark}
                                disabled={loading}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Bookmark'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BookmarkButton;
