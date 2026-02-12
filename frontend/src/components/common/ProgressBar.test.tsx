import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar, CircularProgress, StepProgress } from './ProgressBar';

describe('ProgressBar', () => {
    describe('basic rendering', () => {
        it('should render with value and max', () => {
            render(<ProgressBar value={5} max={10} />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toBeInTheDocument();
            expect(progressbar).toHaveAttribute('aria-valuenow', '5');
            expect(progressbar).toHaveAttribute('aria-valuemin', '0');
            expect(progressbar).toHaveAttribute('aria-valuemax', '10');
        });

        it('should calculate percentage correctly', () => {
            render(<ProgressBar value={3} max={10} />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveStyle({ width: '30%' });
        });

        it('should clamp percentage to 0 when value is negative', () => {
            render(<ProgressBar value={-5} max={10} />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveStyle({ width: '0%' });
        });

        it('should clamp percentage to 100 when value exceeds max', () => {
            render(<ProgressBar value={15} max={10} />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveStyle({ width: '100%' });
        });
    });

    describe('label display', () => {
        it('should show label when showLabel is true', () => {
            render(<ProgressBar value={3} max={10} showLabel />);

            expect(screen.getByText('3 of 10')).toBeInTheDocument();
            expect(screen.getByText('30%')).toBeInTheDocument();
        });

        it('should not show label by default', () => {
            render(<ProgressBar value={3} max={10} />);

            expect(screen.queryByText('3 of 10')).not.toBeInTheDocument();
        });

        it('should round percentage in label', () => {
            render(<ProgressBar value={1} max={3} showLabel />);

            expect(screen.getByText('33%')).toBeInTheDocument();
        });
    });

    describe('sizes', () => {
        it('should render with small size', () => {
            render(<ProgressBar value={5} max={10} size="sm" />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveClass('h-1');
        });

        it('should render with medium size (default)', () => {
            render(<ProgressBar value={5} max={10} size="md" />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveClass('h-2');
        });

        it('should render with large size', () => {
            render(<ProgressBar value={5} max={10} size="lg" />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveClass('h-3');
        });
    });

    describe('colors', () => {
        it('should render with primary color (default)', () => {
            render(<ProgressBar value={5} max={10} color="primary" />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveClass('bg-primary-500');
        });

        it('should render with success color', () => {
            render(<ProgressBar value={5} max={10} color="success" />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveClass('bg-green-500');
        });

        it('should render with warning color', () => {
            render(<ProgressBar value={5} max={10} color="warning" />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveClass('bg-yellow-500');
        });

        it('should render with danger color', () => {
            render(<ProgressBar value={5} max={10} color="danger" />);

            const progressbar = screen.getByRole('progressbar');
            expect(progressbar).toHaveClass('bg-red-500');
        });
    });

    describe('custom className', () => {
        it('should merge custom className', () => {
            render(<ProgressBar value={5} max={10} className="custom-class" />);

            const container = screen.getByRole('progressbar').parentElement?.parentElement;
            expect(container).toHaveClass('custom-class');
        });
    });
});

describe('CircularProgress', () => {
    describe('basic rendering', () => {
        it('should render with value and max', () => {
            const { container } = render(<CircularProgress value={5} max={10} />);

            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute('width', '120');
            expect(svg).toHaveAttribute('height', '120');
        });

        it('should show percentage label by default', () => {
            render(<CircularProgress value={5} max={10} />);

            expect(screen.getByText('50%')).toBeInTheDocument();
        });

        it('should hide label when showLabel is false', () => {
            render(<CircularProgress value={5} max={10} showLabel={false} />);

            expect(screen.queryByText('50%')).not.toBeInTheDocument();
        });

        it('should round percentage in label', () => {
            render(<CircularProgress value={1} max={3} />);

            expect(screen.getByText('33%')).toBeInTheDocument();
        });
    });

    describe('size customization', () => {
        it('should render with custom size', () => {
            const { container } = render(<CircularProgress value={5} max={10} size={200} />);

            const svg = container.querySelector('svg');
            expect(svg).toHaveAttribute('width', '200');
            expect(svg).toHaveAttribute('height', '200');
        });

        it('should render with custom stroke width', () => {
            const { container } = render(<CircularProgress value={5} max={10} strokeWidth={12} />);

            const circles = container.querySelectorAll('circle');
            circles.forEach(circle => {
                expect(circle).toHaveAttribute('stroke-width', '12');
            });
        });
    });

    describe('colors', () => {
        it('should render with primary color (default)', () => {
            const { container } = render(<CircularProgress value={5} max={10} color="primary" />);

            const progressCircle = container.querySelectorAll('circle')[1];
            expect(progressCircle).toHaveClass('text-primary-500');
        });

        it('should render with success color', () => {
            const { container } = render(<CircularProgress value={5} max={10} color="success" />);

            const progressCircle = container.querySelectorAll('circle')[1];
            expect(progressCircle).toHaveClass('text-green-500');
        });

        it('should render with warning color', () => {
            const { container } = render(<CircularProgress value={5} max={10} color="warning" />);

            const progressCircle = container.querySelectorAll('circle')[1];
            expect(progressCircle).toHaveClass('text-yellow-500');
        });

        it('should render with danger color', () => {
            const { container } = render(<CircularProgress value={5} max={10} color="danger" />);

            const progressCircle = container.querySelectorAll('circle')[1];
            expect(progressCircle).toHaveClass('text-red-500');
        });
    });

    describe('edge cases', () => {
        it('should handle zero value', () => {
            render(<CircularProgress value={0} max={10} />);

            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should handle value equal to max', () => {
            render(<CircularProgress value={10} max={10} />);

            expect(screen.getByText('100%')).toBeInTheDocument();
        });

        it('should clamp negative values', () => {
            render(<CircularProgress value={-5} max={10} />);

            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should clamp values exceeding max', () => {
            render(<CircularProgress value={15} max={10} />);

            expect(screen.getByText('100%')).toBeInTheDocument();
        });
    });
});

describe('StepProgress', () => {
    describe('basic rendering', () => {
        it('should render correct number of steps', () => {
            const { container } = render(<StepProgress steps={5} currentStep={2} />);

            const stepElements = container.querySelectorAll('.flex-1');
            expect(stepElements).toHaveLength(5);
        });

        it('should highlight completed steps', () => {
            const { container } = render(<StepProgress steps={5} currentStep={3} />);

            const stepElements = container.querySelectorAll('.flex-1');
            // Steps 0, 1, 2 should be completed (index < currentStep)
            expect(stepElements[0]).toHaveClass('bg-primary-500');
            expect(stepElements[1]).toHaveClass('bg-primary-500');
            expect(stepElements[2]).toHaveClass('bg-primary-500');
        });

        it('should highlight current step differently', () => {
            const { container } = render(<StepProgress steps={5} currentStep={2} />);

            const stepElements = container.querySelectorAll('.flex-1');
            // Step at currentStep index should be "current" style
            expect(stepElements[2]).toHaveClass('bg-primary-300');
        });

        it('should show remaining steps as incomplete', () => {
            const { container } = render(<StepProgress steps={5} currentStep={2} />);

            const stepElements = container.querySelectorAll('.flex-1');
            // Steps after currentStep should be incomplete
            expect(stepElements[3]).toHaveClass('bg-gray-200');
            expect(stepElements[4]).toHaveClass('bg-gray-200');
        });
    });

    describe('edge cases', () => {
        it('should handle currentStep at 0', () => {
            const { container } = render(<StepProgress steps={3} currentStep={0} />);

            const stepElements = container.querySelectorAll('.flex-1');
            expect(stepElements[0]).toHaveClass('bg-primary-300');
            expect(stepElements[1]).toHaveClass('bg-gray-200');
            expect(stepElements[2]).toHaveClass('bg-gray-200');
        });

        it('should handle currentStep at last step', () => {
            const { container } = render(<StepProgress steps={3} currentStep={2} />);

            const stepElements = container.querySelectorAll('.flex-1');
            expect(stepElements[0]).toHaveClass('bg-primary-500');
            expect(stepElements[1]).toHaveClass('bg-primary-500');
            expect(stepElements[2]).toHaveClass('bg-primary-300');
        });

        it('should handle single step', () => {
            const { container } = render(<StepProgress steps={1} currentStep={0} />);

            const stepElements = container.querySelectorAll('.flex-1');
            expect(stepElements).toHaveLength(1);
            expect(stepElements[0]).toHaveClass('bg-primary-300');
        });
    });

    describe('custom className', () => {
        it('should merge custom className', () => {
            const { container } = render(<StepProgress steps={3} currentStep={1} className="custom-class" />);

            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper).toHaveClass('custom-class');
            expect(wrapper).toHaveClass('flex');
            expect(wrapper).toHaveClass('items-center');
        });
    });
});
