import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/authService';
import { LoadingSpinner } from './components/common';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const PracticeSession = lazy(() => import('./pages/PracticeSession').then(m => ({ default: m.PracticeSession })));
const SessionReview = lazy(() => import('./pages/SessionReview').then(m => ({ default: m.SessionReview })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function App() {
  const { login, setLoading, isAuthenticated } = useAuthStore();

  // Try to restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      if (authService.hasStoredToken() && !isAuthenticated) {
        setLoading(true);
        try {
          const user = await authService.getCurrentUser();
          const tokens = {
            access_token: authService.getStoredAccessToken() || '',
            refresh_token: localStorage.getItem('refresh_token') || '',
            token_type: 'bearer',
            expires_in: 3600,
          };
          login(user, tokens);
        } catch (error) {
          // Token invalid, clear it
          authService.clearTokens();
        } finally {
          setLoading(false);
        }
      }
    };

    restoreSession();
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/practice" element={
            <ProtectedRoute>
              <PracticeSession />
            </ProtectedRoute>
          } />
          <Route path="/review" element={
            <ProtectedRoute>
              <SessionReview />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
