import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
    id: string;
    email: string;
    username: string | null;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setTokens: (tokens: AuthTokens | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    login: (user: User, tokens: AuthTokens) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            setTokens: (tokens) => set({ tokens }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            login: (user, tokens) => set({
                user,
                tokens,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            }),

            logout: () => set({
                user: null,
                tokens: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            }),

            updateUser: (userData) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...userData } });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                tokens: state.tokens,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectTokens = (state: AuthState) => state.tokens;
