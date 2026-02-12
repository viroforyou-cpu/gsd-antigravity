import { useState } from 'react';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
    children: ReactNode;
    title?: string;
    showSidebar?: boolean;
}

export function Layout({ children, title, showSidebar = true }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                title={title}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                showMenuButton={showSidebar}
            />
            <div className="flex">
                {showSidebar && (
                    <>
                        {/* Mobile sidebar overlay */}
                        {sidebarOpen && (
                            <div
                                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            />
                        )}

                        {/* Sidebar with responsive classes */}
                        <div className={`
                            fixed lg:static inset-y-0 left-0 z-50
                            transform transition-transform duration-300 ease-in-out
                            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        `}>
                            <Sidebar onClose={() => setSidebarOpen(false)} />
                        </div>
                    </>
                )}
                <MainContent>
                    {children}
                </MainContent>
            </div>
        </div>
    );
}
