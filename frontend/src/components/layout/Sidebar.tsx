import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
    label: string;
    icon?: ReactNode;
    href: string;
}

interface SidebarProps {
    items?: NavItem[];
    children?: ReactNode;
    onClose?: () => void;
}

const defaultNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'Practice', href: '/practice' },
    { label: 'History', href: '/history' },
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
];

export function Sidebar({ items = defaultNavItems, children, onClose }: SidebarProps) {
    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen lg:min-h-[calc(100vh-65px)]">
            <div className="p-4">
                {/* Mobile close button */}
                {onClose && (
                    <div className="flex justify-end lg:hidden mb-2">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Close menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <nav className="space-y-1">
                    {items.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={onClose}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium
                                transition-colors duration-150
                                ${isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
                            `}
                        >
                            {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                {children && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {children}
                    </div>
                )}
            </div>
        </aside>
    );
}
