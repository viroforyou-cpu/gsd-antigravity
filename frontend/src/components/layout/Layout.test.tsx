import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

// Helper to wrap components with Router
const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);
    return render(ui, { wrapper: BrowserRouter });
};

describe('Header', () => {
    describe('rendering', () => {
        it('renders default title', () => {
            render(<Header />);

            expect(screen.getByText('GeneReason')).toBeInTheDocument();
        });

        it('renders custom title', () => {
            render(<Header title="Custom Title" />);

            expect(screen.getByText('Custom Title')).toBeInTheDocument();
        });

        it('renders children', () => {
            render(
                <Header>
                    <button>Test Button</button>
                </Header>
            );

            expect(screen.getByText('Test Button')).toBeInTheDocument();
        });
    });

    describe('menu button', () => {
        it('does not show menu button by default', () => {
            render(<Header />);

            expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
        });

        it('shows menu button when showMenuButton is true', () => {
            render(<Header showMenuButton={true} />);

            expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
        });

        it('calls onMenuClick when menu button is clicked', () => {
            const onMenuClick = vi.fn();
            render(<Header showMenuButton={true} onMenuClick={onMenuClick} />);

            fireEvent.click(screen.getByLabelText('Toggle menu'));
            expect(onMenuClick).toHaveBeenCalled();
        });
    });
});

describe('Sidebar', () => {
    describe('rendering', () => {
        it('renders default navigation items', () => {
            renderWithRouter(<Sidebar />);

            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Practice')).toBeInTheDocument();
            expect(screen.getByText('History')).toBeInTheDocument();
            expect(screen.getByText('Settings')).toBeInTheDocument();
        });

        it('renders custom navigation items', () => {
            const customItems = [
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
            ];

            renderWithRouter(<Sidebar items={customItems} />);

            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('About')).toBeInTheDocument();
            expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        });

        it('renders children', () => {
            renderWithRouter(
                <Sidebar>
                    <div>Extra Content</div>
                </Sidebar>
            );

            expect(screen.getByText('Extra Content')).toBeInTheDocument();
        });
    });

    describe('close button', () => {
        it('does not show close button when onClose is not provided', () => {
            renderWithRouter(<Sidebar />);

            expect(screen.queryByLabelText('Close menu')).not.toBeInTheDocument();
        });

        it('shows close button when onClose is provided', () => {
            const onClose = vi.fn();
            renderWithRouter(<Sidebar onClose={onClose} />);

            expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
        });

        it('calls onClose when close button is clicked', () => {
            const onClose = vi.fn();
            renderWithRouter(<Sidebar onClose={onClose} />);

            fireEvent.click(screen.getByLabelText('Close menu'));
            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('navigation', () => {
        it('renders navigation links with correct hrefs', () => {
            renderWithRouter(<Sidebar />);

            const dashboardLink = screen.getByText('Dashboard').closest('a');
            expect(dashboardLink).toHaveAttribute('href', '/');

            const practiceLink = screen.getByText('Practice').closest('a');
            expect(practiceLink).toHaveAttribute('href', '/practice');
        });

        it('calls onClose when navigation link is clicked', () => {
            const onClose = vi.fn();
            renderWithRouter(<Sidebar onClose={onClose} />);

            fireEvent.click(screen.getByText('Practice'));
            expect(onClose).toHaveBeenCalled();
        });
    });
});
