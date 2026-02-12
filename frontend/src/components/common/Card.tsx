import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: 'default' | 'bordered' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    subtitle?: string;
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

const variantStyles = {
    default: 'bg-white',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md',
};

const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export function Card({
    children,
    variant = 'bordered',
    padding = 'md',
    className = '',
    ...props
}: CardProps) {
    return (
        <div
            className={`rounded-lg ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, subtitle, className = '', ...props }: CardHeaderProps) {
    return (
        <div className={`border-b border-gray-100 pb-3 mb-3 ${className}`} {...props}>
            <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
    return (
        <div className={`${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
    return (
        <div
            className={`border-t border-gray-100 pt-3 mt-3 flex items-center justify-end gap-2 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
