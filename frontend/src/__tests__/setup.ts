import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { server, resetMsw, setupMsw, teardownMsw } from './mocks/server';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Setup MSW server
beforeAll(() => {
    setupMsw();
});

afterAll(() => {
    teardownMsw();
});

beforeEach(() => {
    resetMsw();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock crypto.randomUUID for tests
Object.defineProperty(globalThis, 'crypto', {
    value: {
        randomUUID: () => Math.random().toString(36).substring(2, 15),
        subtle: {
            digest: vi.fn(),
        },
        getRandomValues: (array: Uint8Array) => {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        },
    },
});

// Export server for custom test scenarios
export { server };
