import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useKeyboardShortcuts,
    useEscapeKey,
    useArrowNavigation,
    useNumberKeySelection,
    useLetterKeySelection,
} from './useKeyboard';

// Helper to dispatch keyboard events
const dispatchKeyEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
    });
    window.dispatchEvent(event);
    return event;
};

describe('useKeyboardShortcuts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls handler when shortcut key is pressed', () => {
        const handler = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts([{ key: 'a', handler }])
        );

        dispatchKeyEvent('a');
        expect(handler).toHaveBeenCalled();
    });

    it('calls handler when ctrl shortcut is pressed', () => {
        const handler = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts([{ key: 's', ctrl: true, handler }])
        );

        dispatchKeyEvent('s', { ctrlKey: true });
        expect(handler).toHaveBeenCalled();
    });

    it('does not call handler when modifier is missing', () => {
        const handler = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts([{ key: 's', ctrl: true, handler }])
        );

        dispatchKeyEvent('s');
        expect(handler).not.toHaveBeenCalled();
    });

    it('handles case-insensitive key matching', () => {
        const handler = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts([{ key: 'A', handler }])
        );

        dispatchKeyEvent('a');
        expect(handler).toHaveBeenCalled();
    });

    it('prevents default behavior when shortcut matches', () => {
        const handler = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts([{ key: 'a', handler }])
        );

        const event = dispatchKeyEvent('a');
        expect(event.defaultPrevented).toBe(true);
    });
});

describe('useEscapeKey', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls callback when Escape is pressed', () => {
        const callback = vi.fn();
        renderHook(() => useEscapeKey(callback));

        dispatchKeyEvent('Escape');
        expect(callback).toHaveBeenCalled();
    });

    it('does not call callback when disabled', () => {
        const callback = vi.fn();
        renderHook(() => useEscapeKey(callback, false));

        dispatchKeyEvent('Escape');
        expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback for other keys', () => {
        const callback = vi.fn();
        renderHook(() => useEscapeKey(callback));

        dispatchKeyEvent('Enter');
        expect(callback).not.toHaveBeenCalled();
    });
});

describe('useArrowNavigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls onSelect with next index on ArrowDown', () => {
        const onSelect = vi.fn();
        renderHook(() => useArrowNavigation(5, onSelect));

        dispatchKeyEvent('ArrowDown');
        expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('calls onSelect with previous index on ArrowUp', () => {
        const onSelect = vi.fn();
        renderHook(() => useArrowNavigation(5, onSelect));

        // Move to index 1 first
        act(() => {
            dispatchKeyEvent('ArrowDown');
        });

        // Then move back
        act(() => {
            dispatchKeyEvent('ArrowUp');
        });

        expect(onSelect).toHaveBeenLastCalledWith(0);
    });

    it('loops to beginning when at end and loop is true', () => {
        const onSelect = vi.fn();
        renderHook(() => useArrowNavigation(3, onSelect, { loop: true }));

        // Move down 3 times (should end up at index 0 due to loop)
        dispatchKeyEvent('ArrowDown'); // 0 -> 1
        dispatchKeyEvent('ArrowDown'); // 1 -> 2
        dispatchKeyEvent('ArrowDown'); // 2 -> 0 (loop)

        expect(onSelect).toHaveBeenLastCalledWith(0);
    });

    it('does not loop when loop is false', () => {
        const onSelect = vi.fn();
        renderHook(() => useArrowNavigation(3, onSelect, { loop: false }));

        // Move down 3 times
        dispatchKeyEvent('ArrowDown'); // 0 -> 1
        dispatchKeyEvent('ArrowDown'); // 1 -> 2
        dispatchKeyEvent('ArrowDown'); // 2 -> 2 (no loop)

        expect(onSelect).toHaveBeenLastCalledWith(2);
    });

    it('calls onSelect with current index on Enter', () => {
        const onSelect = vi.fn();
        renderHook(() => useArrowNavigation(5, onSelect));

        dispatchKeyEvent('Enter');
        expect(onSelect).toHaveBeenCalledWith(0);
    });

    it('does not respond when disabled', () => {
        const onSelect = vi.fn();
        renderHook(() => useArrowNavigation(5, onSelect, { enabled: false }));

        dispatchKeyEvent('ArrowDown');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('uses horizontal arrows when horizontal is true', () => {
        const onSelect = vi.fn();
        renderHook(() => useArrowNavigation(5, onSelect, { horizontal: true }));

        dispatchKeyEvent('ArrowRight');
        expect(onSelect).toHaveBeenCalledWith(1);

        dispatchKeyEvent('ArrowDown');
        // Should not have been called again (ArrowDown doesn't work in horizontal mode)
        expect(onSelect).toHaveBeenCalledTimes(1);
    });
});

describe('useNumberKeySelection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls onSelect with number when number key is pressed', () => {
        const onSelect = vi.fn();
        renderHook(() => useNumberKeySelection(5, onSelect));

        dispatchKeyEvent('3');
        expect(onSelect).toHaveBeenCalledWith(3);
    });

    it('does not call onSelect when number exceeds max', () => {
        const onSelect = vi.fn();
        renderHook(() => useNumberKeySelection(3, onSelect));

        dispatchKeyEvent('5');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('calls onSelect with 10 when 0 is pressed and max >= 10', () => {
        const onSelect = vi.fn();
        renderHook(() => useNumberKeySelection(10, onSelect));

        dispatchKeyEvent('0');
        expect(onSelect).toHaveBeenCalledWith(10);
    });

    it('does not call onSelect for 0 when max < 10', () => {
        const onSelect = vi.fn();
        renderHook(() => useNumberKeySelection(5, onSelect));

        dispatchKeyEvent('0');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('does not respond when disabled', () => {
        const onSelect = vi.fn();
        renderHook(() => useNumberKeySelection(5, onSelect, false));

        dispatchKeyEvent('3');
        expect(onSelect).not.toHaveBeenCalled();
    });
});

describe('useLetterKeySelection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls onSelect with letter when letter key is pressed', () => {
        const onSelect = vi.fn();
        renderHook(() => useLetterKeySelection(['A', 'B', 'C'], onSelect));

        dispatchKeyEvent('a');
        expect(onSelect).toHaveBeenCalledWith('A');
    });

    it('does not call onSelect for letters not in list', () => {
        const onSelect = vi.fn();
        renderHook(() => useLetterKeySelection(['A', 'B'], onSelect));

        dispatchKeyEvent('c');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('does not respond when disabled', () => {
        const onSelect = vi.fn();
        renderHook(() => useLetterKeySelection(['A', 'B'], onSelect, false));

        dispatchKeyEvent('a');
        expect(onSelect).not.toHaveBeenCalled();
    });
});
