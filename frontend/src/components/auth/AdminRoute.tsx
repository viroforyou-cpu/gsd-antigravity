/**
 * AdminRoute - Route protection for admin-only pages.
 *
 * Phase 24: Admin Dashboard
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LoadingSpinner } from '../common';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to access this page.
                    </p>
                    <a
                        href="/"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Return to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
