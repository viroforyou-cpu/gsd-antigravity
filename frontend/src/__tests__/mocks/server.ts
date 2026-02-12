import { setupServer } from 'msw/node';
import { handlers, resetTestSessions } from './handlers';

// Create the MSW server for Node.js (used in Vitest)
export const server = setupServer(...handlers);

// Export reset helper for tests
export { resetTestSessions };

// Setup and teardown helpers
export const setupMsw = () => {
    // Start server before all tests
    server.listen({
        onUnhandledRequest: 'warn', // Warn on unhandled requests
    });
};

export const teardownMsw = () => {
    // Close server after all tests
    server.close();
};

export const resetMsw = () => {
    // Reset handlers and test data between tests
    server.resetHandlers();
    resetTestSessions();
};
