import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    handler: () => void;
    description?: string;
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = !shortcut.ctrl || event.ctrlKey;
                const shiftMatch = !shortcut.shift || event.shiftKey;
                const altMatch = !shortcut.alt || event.altKey;
                const metaMatch = !shortcut.meta || event.metaKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
                    event.preventDefault();
                    shortcut.handler();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

/**
 * Hook for handling escape key press
 */
export function useEscapeKey(callback: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [callback, enabled]);
}

/**
 * Hook for handling arrow key navigation in a list
 */
export function useArrowNavigation(
    itemCount: number,
    onSelect: (index: number) => void,
    options?: {
        enabled?: boolean;
        loop?: boolean;
        horizontal?: boolean;
    }
) {
    const { enabled = true, loop = true, horizontal = false } = options || {};
    const selectedIndexRef = useRef(0);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
        const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';

        let newIndex = selectedIndexRef.current;

        if (event.key === nextKey) {
            event.preventDefault();
            newIndex = selectedIndexRef.current + 1;
            if (newIndex >= itemCount) {
                newIndex = loop ? 0 : itemCount - 1;
            }
        } else if (event.key === prevKey) {
            event.preventDefault();
            newIndex = selectedIndexRef.current - 1;
            if (newIndex < 0) {
                newIndex = loop ? itemCount - 1 : 0;
            }
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(selectedIndexRef.current);
            return;
        } else {
            return;
        }

        selectedIndexRef.current = newIndex;
        onSelect(newIndex);
    }, [enabled, itemCount, loop, horizontal, onSelect]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const setSelectedIndex = useCallback((index: number) => {
        selectedIndexRef.current = index;
    }, []);

    return { setSelectedIndex };
}

/**
 * Hook for handling number key selection (1-9, 0 for 10)
 */
export function useNumberKeySelection(
    maxNumber: number,
    onSelect: (number: number) => void,
    enabled = true
) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyPress = (event: KeyboardEvent) => {
            // Handle 1-9
            if (event.key >= '1' && event.key <= '9') {
                const num = parseInt(event.key, 10);
                if (num <= maxNumber) {
                    event.preventDefault();
                    onSelect(num);
                }
            }
            // Handle 0 as 10
            else if (event.key === '0' && maxNumber >= 10) {
                event.preventDefault();
                onSelect(10);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [maxNumber, onSelect, enabled]);
}

/**
 * Hook for handling letter key selection (A-Z for answer options)
 */
export function useLetterKeySelection(
    letters: string[],
    onSelect: (letter: string) => void,
    enabled = true
) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyPress = (event: KeyboardEvent) => {
            const key = event.key.toUpperCase();
            if (letters.includes(key)) {
                event.preventDefault();
                onSelect(key);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [letters, onSelect, enabled]);
}

/**
 * Hook for focus trap within a container
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled = true) {
    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTab = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTab);
        firstElement?.focus();

        return () => container.removeEventListener('keydown', handleTab);
    }, [containerRef, enabled]);
}
