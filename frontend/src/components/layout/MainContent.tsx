import type { ReactNode } from 'react';

interface MainContentProps {
    children: ReactNode;
    className?: string;
}

export function MainContent({ children, className = '' }: MainContentProps) {
    return (
        <main className={`flex-1 p-6 bg-gray-50 overflow-auto ${className}`}>
            {children}
        </main>
    );
}
