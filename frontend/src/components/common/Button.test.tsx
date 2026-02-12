import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
    describe('rendering', () => {
        it('should render children correctly', () => {
            render(<Button>Click me</Button>);

            expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
        });

        it('should render with default primary variant', () => {
            render(<Button>Primary</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-primary-600');
        });

        it('should render with secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-gray-600');
        });

        it('should render with outline variant', () => {
            render(<Button variant="outline">Outline</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('border-2');
            expect(button).toHaveClass('border-primary-600');
        });

        it('should render with ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('text-gray-600');
        });

        it('should render with danger variant', () => {
            render(<Button variant="danger">Danger</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-red-600');
        });
    });

    describe('sizes', () => {
        it('should render with small size', () => {
            render(<Button size="sm">Small</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('px-3');
            expect(button).toHaveClass('py-1.5');
            expect(button).toHaveClass('text-sm');
        });

        it('should render with medium size (default)', () => {
            render(<Button size="md">Medium</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('px-4');
            expect(button).toHaveClass('py-2');
        });

        it('should render with large size', () => {
            render(<Button size="lg">Large</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('px-6');
            expect(button).toHaveClass('py-3');
            expect(button).toHaveClass('text-lg');
        });
    });

    describe('icons', () => {
        it('should render left icon', () => {
            render(<Button leftIcon={<span data-testid="left-icon">←</span>}>With Left Icon</Button>);

            expect(screen.getByTestId('left-icon')).toBeInTheDocument();
        });

        it('should render right icon', () => {
            render(<Button rightIcon={<span data-testid="right-icon">→</span>}>With Right Icon</Button>);

            expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        });

        it('should render both icons', () => {
            render(
                <Button
                    leftIcon={<span data-testid="left-icon">←</span>}
                    rightIcon={<span data-testid="right-icon">→</span>}
                >
                    Both Icons
                </Button>
            );

            expect(screen.getByTestId('left-icon')).toBeInTheDocument();
            expect(screen.getByTestId('right-icon')).toBeInTheDocument();
        });
    });

    describe('loading state', () => {
        it('should show loading spinner when isLoading is true', () => {
            render(<Button isLoading>Loading</Button>);

            const button = screen.getByRole('button');
            const spinner = button.querySelector('svg');
            expect(spinner).toBeInTheDocument();
            expect(spinner).toHaveClass('animate-spin');
        });

        it('should be disabled when loading', () => {
            render(<Button isLoading>Loading</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('should not show left icon when loading', () => {
            render(
                <Button isLoading leftIcon={<span data-testid="left-icon">←</span>}>
                    Loading
                </Button>
            );

            expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
        });

        it('should not show right icon when loading', () => {
            render(
                <Button isLoading rightIcon={<span data-testid="right-icon">→</span>}>
                    Loading
                </Button>
            );

            expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
        });
    });

    describe('disabled state', () => {
        it('should be disabled when disabled prop is true', () => {
            render(<Button disabled>Disabled</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('should have disabled styles', () => {
            render(<Button disabled>Disabled</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('disabled:opacity-50');
        });
    });

    describe('full width', () => {
        it('should have full width class when fullWidth is true', () => {
            render(<Button fullWidth>Full Width</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('w-full');
        });

        it('should not have full width class by default', () => {
            render(<Button>Normal Width</Button>);

            const button = screen.getByRole('button');
            expect(button).not.toHaveClass('w-full');
        });
    });

    describe('interactions', () => {
        it('should call onClick handler when clicked', async () => {
            const user = userEvent.setup();
            let clicked = false;
            render(<Button onClick={() => { clicked = true; }}>Click me</Button>);

            await user.click(screen.getByRole('button'));

            expect(clicked).toBe(true);
        });

        it('should not call onClick when disabled', async () => {
            const user = userEvent.setup();
            let clicked = false;
            render(<Button disabled onClick={() => { clicked = true; }}>Disabled</Button>);

            await user.click(screen.getByRole('button'));

            expect(clicked).toBe(false);
        });

        it('should not call onClick when loading', async () => {
            const user = userEvent.setup();
            let clicked = false;
            render(<Button isLoading onClick={() => { clicked = true; }}>Loading</Button>);

            await user.click(screen.getByRole('button'));

            expect(clicked).toBe(false);
        });
    });

    describe('custom className', () => {
        it('should merge custom className with default styles', () => {
            render(<Button className="custom-class">Custom</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('custom-class');
            expect(button).toHaveClass('inline-flex');
        });
    });

    describe('accessibility', () => {
        it('should allow type to be set to button', () => {
            render(<Button type="button">Button</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('type', 'button');
        });

        it('should allow type to be overridden to submit', () => {
            render(<Button type="submit">Submit</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('type', 'submit');
        });

        it('should support aria-label', () => {
            render(<Button aria-label="Close dialog">×</Button>);

            expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
        });
    });
});
