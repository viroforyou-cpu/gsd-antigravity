import api from './api';
import type { User, AuthTokens } from '../stores/authStore';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    username?: string;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
}

export interface PasswordResetData {
    email: string;
}

export interface PasswordResetConfirmData {
    token: string;
    new_password: string;
}

class AuthService {
    /**
     * Register a new user account
     */
    async register(credentials: RegisterCredentials): Promise<{ user: User; tokens: AuthTokens }> {
        await api.post<User>('/auth/register', credentials);
        // After registration, automatically log the user in
        const loginResult = await this.login({
            email: credentials.email,
            password: credentials.password,
        });
        return loginResult;
    }

    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
        const tokensResponse = await api.post<AuthTokens>('/auth/login', credentials);
        const tokens = tokensResponse.data;

        // Store tokens in localStorage for axios interceptor
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);

        // Get user info
        const userResponse = await api.get<User>('/auth/me', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        return {
            user: userResponse.data,
            tokens,
        };
    }

    /**
     * Logout the current user
     */
    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Ignore logout errors
            console.warn('Logout API call failed:', error);
        } finally {
            // Always clear local tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }

    /**
     * Refresh the access token
     */
    async refreshToken(): Promise<AuthTokens> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await api.post<AuthTokens>('/auth/refresh', {
            refresh_token: refreshToken,
        });

        const tokens = response.data;
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);

        return tokens;
    }

    /**
     * Get current user info
     */
    async getCurrentUser(): Promise<User> {
        const response = await api.get<User>('/auth/me');
        return response.data;
    }

    /**
     * Change password
     */
    async changePassword(data: ChangePasswordData): Promise<void> {
        await api.post('/auth/change-password', data);
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(data: PasswordResetData): Promise<void> {
        await api.post('/auth/forgot-password', data);
    }

    /**
     * Confirm password reset with token
     */
    async confirmPasswordReset(data: PasswordResetConfirmData): Promise<void> {
        await api.post('/auth/reset-password', data);
    }

    /**
     * Check if user has a valid token stored
     */
    hasStoredToken(): boolean {
        return !!localStorage.getItem('access_token');
    }

    /**
     * Get stored access token
     */
    getStoredAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    /**
     * Clear all stored tokens
     */
    clearTokens(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
}

export const authService = new AuthService();
export default authService;
