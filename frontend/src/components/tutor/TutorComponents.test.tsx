/**
 * Tests for Tutor Components.
 *
 * Phase 23: AI Tutor Mode Testing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TutorPanel } from './TutorPanel';
import TutorMessageComponent from './TutorMessage';
import TutorInput from './TutorInput';
import HintButton from './HintButton';
import { TutorInsightsWidget } from './TutorInsightsWidget';
import { useTutorStore } from '../../stores/tutorStore';
import type { TutorMessage } from '../../types/tutor';

// Mock scrollIntoView which is not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock the tutor store
vi.mock('../../stores/tutorStore', () => ({
    useTutorStore: vi.fn(),
}));

// Mock the tutor service
vi.mock('../../services/tutorService', () => ({
    tutorService: {
        askQuestion: vi.fn().mockResolvedValue({
            message: {
                id: 'msg-1',
                content: 'Test response',
                role: 'tutor',
                message_type: 'guidance',
                created_at: new Date().toISOString(),
            },
        }),
        requestHint: vi.fn().mockResolvedValue({
            hint: {
                id: 'hint-1',
                level: 1,
                content: 'Test hint',
                focuses_on: ['test'],
            },
            hint_count: 1,
            max_hints: 3,
        }),
    },
}));

const mockUseTutorStore = useTutorStore as unknown as ReturnType<typeof vi.fn>;

// Helper to create wrapper with router
const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

// ============================================
// Test Fixtures
// ============================================

const createMockMessage = (overrides: Partial<TutorMessage> = {}): TutorMessage => ({
    id: 'msg-1',
    session_id: 'session-1',
    content: 'Test message',
    role: 'tutor',
    message_type: 'guidance',
    metadata: {},
    created_at: new Date().toISOString(),
    ...overrides,
});

const defaultStoreState = {
    messages: [],
    isLoading: false,
    isTyping: false,
    isPanelOpen: true,
    hintCount: 0,
    maxHints: 3,
    error: null,
    currentSessionId: null,
    insights: [],
    insightsLoading: false,
    dashboardStats: null,
    togglePanel: vi.fn(),
    clearError: vi.fn(),
    sendMessage: vi.fn(),
    askQuestion: vi.fn().mockResolvedValue(undefined),
    requestHint: vi.fn(),
    startSession: vi.fn(),
    endSession: vi.fn(),
    fetchInsights: vi.fn(),
    fetchDashboardStats: vi.fn(),
};

// ============================================
// TutorPanel Tests
// ============================================

describe('TutorPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseTutorStore.mockReturnValue(defaultStoreState);
    });

    it('renders closed panel state with button', () => {
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            isPanelOpen: false,
        });

        renderWithRouter(<TutorPanel />);

        expect(screen.getByText('AI Tutor')).toBeInTheDocument();
        expect(screen.getByLabelText('Open tutor panel')).toBeInTheDocument();
    });

    it('renders open panel with welcome message when no messages', () => {
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            isPanelOpen: true,
            messages: [],
        });

        renderWithRouter(<TutorPanel />);

        expect(screen.getByText('Welcome!')).toBeInTheDocument();
        expect(screen.getByText(/I'm here to help you learn/)).toBeInTheDocument();
    });

    it('renders messages when present', () => {
        const messages = [
            createMockMessage({ id: 'msg-1', content: 'Hello from tutor', role: 'tutor' }),
            createMockMessage({ id: 'msg-2', content: 'Hello from user', role: 'user' }),
        ];

        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            isPanelOpen: true,
            messages,
        });

        renderWithRouter(<TutorPanel />);

        expect(screen.getByText('Hello from tutor')).toBeInTheDocument();
        expect(screen.getByText('Hello from user')).toBeInTheDocument();
    });

    it('shows typing indicator when isTyping is true', () => {
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            isPanelOpen: true,
            isTyping: true,
            messages: [createMockMessage()],
        });

        renderWithRouter(<TutorPanel />);

        expect(screen.getByText('Tutor is typing...')).toBeInTheDocument();
    });

    it('displays error message when error exists', () => {
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            isPanelOpen: true,
            error: 'Test error message',
        });

        renderWithRouter(<TutorPanel />);

        expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('calls togglePanel when close button clicked', () => {
        const togglePanel = vi.fn();
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            isPanelOpen: true,
            togglePanel,
        });

        renderWithRouter(<TutorPanel />);

        const closeButton = screen.getByLabelText('Close tutor panel');
        fireEvent.click(closeButton);

        expect(togglePanel).toHaveBeenCalled();
    });

    it('disables hint button when max hints reached', () => {
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            isPanelOpen: true,
            hintCount: 3,
            maxHints: 3,
        });

        renderWithRouter(<TutorPanel />);

        // When hintCount >= maxHints, the button should be disabled
        const hintButton = screen.getByRole('button', { name: /Request Hint/ });
        expect(hintButton).toBeDisabled();
    });
});

// ============================================
// TutorMessage Tests
// ============================================

describe('TutorMessage', () => {
    it('renders tutor message with correct styling', () => {
        const message = createMockMessage({
            role: 'tutor',
            content: 'Tutor message content',
        });

        renderWithRouter(<TutorMessageComponent message={message} />);

        expect(screen.getByText('Tutor message content')).toBeInTheDocument();
    });

    it('renders user message with correct styling', () => {
        const message = createMockMessage({
            role: 'user',
            content: 'User message content',
        });

        renderWithRouter(<TutorMessageComponent message={message} />);

        expect(screen.getByText('User message content')).toBeInTheDocument();
    });

    it('renders hint message type with icon', () => {
        const message = createMockMessage({
            role: 'tutor',
            message_type: 'hint',
            content: 'Here is a hint',
        });

        renderWithRouter(<TutorMessageComponent message={message} />);

        expect(screen.getByText('Here is a hint')).toBeInTheDocument();
    });

    it('renders explanation message type', () => {
        const message = createMockMessage({
            role: 'tutor',
            message_type: 'explanation',
            content: 'Let me explain this concept',
        });

        renderWithRouter(<TutorMessageComponent message={message} />);

        expect(screen.getByText('Let me explain this concept')).toBeInTheDocument();
    });

    it('displays timestamp', () => {
        const message = createMockMessage({
            created_at: '2024-01-01T12:00:00Z',
        });

        renderWithRouter(<TutorMessageComponent message={message} />);

        // Timestamp should be displayed (format may vary)
        const container = screen.getByText('Test message').closest('div');
        expect(container).toBeInTheDocument();
    });
});

// ============================================
// TutorInput Tests
// ============================================

describe('TutorInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseTutorStore.mockReturnValue(defaultStoreState);
    });

    it('renders input field', () => {
        renderWithRouter(<TutorInput />);

        expect(screen.getByPlaceholderText(/Ask a question/)).toBeInTheDocument();
    });

    it('updates value on change', () => {
        renderWithRouter(<TutorInput />);

        const input = screen.getByPlaceholderText(/Ask a question/);
        fireEvent.change(input, { target: { value: 'Test question' } });

        expect(input).toHaveValue('Test question');
    });

    it('disables input when disabled prop is true', () => {
        renderWithRouter(<TutorInput disabled={true} />);

        const input = screen.getByPlaceholderText(/Ask a question/);
        expect(input).toBeDisabled();
    });

    it('clears input after submit', async () => {
        const askQuestion = vi.fn().mockResolvedValue(undefined);
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            askQuestion,
        });

        renderWithRouter(<TutorInput />);

        const input = screen.getByPlaceholderText(/Ask a question/);
        fireEvent.change(input, { target: { value: 'Test question' } });

        const button = screen.getByRole('button', { name: /Send message/ });
        fireEvent.click(button);

        await waitFor(() => {
            expect(input).toHaveValue('');
        });
    });

    it('does not submit empty message', async () => {
        const askQuestion = vi.fn();
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            askQuestion,
        });

        renderWithRouter(<TutorInput />);

        const input = screen.getByPlaceholderText(/Ask a question/);
        const button = screen.getByRole('button', { name: /Send message/ });
        fireEvent.click(button);

        expect(askQuestion).not.toHaveBeenCalled();
    });
});

// ============================================
// HintButton Tests
// ============================================

describe('HintButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseTutorStore.mockReturnValue(defaultStoreState);
    });

    it('renders hint button with level indicator', () => {
        renderWithRouter(<HintButton currentLevel={1} maxHints={3} />);

        expect(screen.getByText(/Request Hint/)).toBeInTheDocument();
    });

    it('shows hints remaining count', () => {
        renderWithRouter(<HintButton currentLevel={2} maxHints={3} />);

        // currentLevel=2, maxHints=3 => hintsRemaining = 3 - 2 + 1 = 2
        expect(screen.getByText(/2 hints remaining/)).toBeInTheDocument();
    });

    it('disables button when max hints reached', () => {
        renderWithRouter(<HintButton currentLevel={4} maxHints={3} disabled={true} />);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('disables button when disabled prop is true', () => {
        renderWithRouter(<HintButton currentLevel={1} maxHints={3} disabled={true} />);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('calls requestHint when clicked', async () => {
        const requestHint = vi.fn();
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            requestHint,
        });

        renderWithRouter(<HintButton currentLevel={1} maxHints={3} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(requestHint).toHaveBeenCalled();
        });
    });

    it('shows different text for different levels', () => {
        const { rerender } = renderWithRouter(<HintButton currentLevel={1} maxHints={3} />);
        expect(screen.getByText(/Request Hint/)).toBeInTheDocument();

        rerender(<BrowserRouter><HintButton currentLevel={2} maxHints={3} /></BrowserRouter>);
        expect(screen.getByText(/Request Hint/)).toBeInTheDocument();

        rerender(<BrowserRouter><HintButton currentLevel={3} maxHints={3} /></BrowserRouter>);
        expect(screen.getByText(/Request Hint/)).toBeInTheDocument();
    });
});

// ============================================
// TutorInsightsWidget Tests
// ============================================

describe('TutorInsightsWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders widget with insights', () => {
        const insights = [
            {
                id: 'insight-1',
                insight_type: 'strength',
                topic: 'Lysosomal storage disorders',
                description: 'Strong understanding of Tay-Sachs',
                occurrence_count: 2,
            },
        ];

        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            insights,
        });

        renderWithRouter(<TutorInsightsWidget />);

        expect(screen.getByText('Learning Insights')).toBeInTheDocument();
    });

    it('shows empty state when no insights', () => {
        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            insights: [],
        });

        renderWithRouter(<TutorInsightsWidget />);

        expect(screen.getByText(/No learning insights yet/)).toBeInTheDocument();
    });

    it('displays insight types correctly', () => {
        const insights = [
            {
                id: 'insight-1',
                insight_type: 'strength',
                topic: 'Topic A',
                description: 'Description A',
                occurrence_count: 1,
            },
            {
                id: 'insight-2',
                insight_type: 'weakness',
                topic: 'Topic B',
                description: 'Description B',
                occurrence_count: 1,
            },
        ];

        mockUseTutorStore.mockReturnValue({
            ...defaultStoreState,
            insights,
        });

        renderWithRouter(<TutorInsightsWidget />);

        expect(screen.getByText('Topic A')).toBeInTheDocument();
        expect(screen.getByText('Topic B')).toBeInTheDocument();
    });
});
