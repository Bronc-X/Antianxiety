'use client';

/**
 * useAuth Domain Hook (The Bridge)
 * 
 * Manages authentication state and operations.
 * Connects auth Server Actions to UI components.
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import {
    getCurrentUser,
    signInWithEmail,
    signUpWithEmail,
    signOut as signOutAction,
    resetPassword as resetPasswordAction,
    type UserProfile,
} from '@/app/actions/auth';

// ============================================
// Types
// ============================================

export interface UseAuthReturn {
    // Data
    user: UserProfile | null;
    isAuthenticated: boolean;

    // States
    isLoading: boolean;
    isSigningIn: boolean;
    isSigningUp: boolean;
    isSigningOut: boolean;
    error: string | null;

    // Actions
    signIn: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<boolean>;
    resetPassword: (email: string) => Promise<boolean>;
    refresh: () => Promise<void>;
    clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useAuth(): UseAuthReturn {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load user on mount
    const loadUser = useCallback(async () => {
        try {
            const result = await getCurrentUser();
            if (result.success && result.data) {
                setUser(result.data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();

        // Listen to auth state changes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email,
                    });
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUser]);

    // Sign in
    const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsSigningIn(true);
        setError(null);

        try {
            const result = await signInWithEmail(email, password);

            if (result.success && result.data) {
                setUser(result.data);
                router.push('/unlearn/app');
                return true;
            } else {
                setError(result.error || 'Sign in failed');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
            return false;
        } finally {
            setIsSigningIn(false);
        }
    }, [router]);

    // Sign up
    const signUp = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsSigningUp(true);
        setError(null);

        try {
            const redirectTo = `${window.location.origin}/onboarding`;
            const result = await signUpWithEmail(email, password, redirectTo);

            if (result.success && result.data) {
                setUser(result.data);
                router.push('/onboarding');
                return true;
            } else {
                setError(result.error || 'Sign up failed');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed');
            return false;
        } finally {
            setIsSigningUp(false);
        }
    }, [router]);

    // Sign out
    const signOut = useCallback(async (): Promise<boolean> => {
        setIsSigningOut(true);
        setError(null);

        try {
            const result = await signOutAction();

            if (result.success) {
                setUser(null);
                router.push('/unlearn');
                return true;
            } else {
                setError(result.error || 'Sign out failed');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign out failed');
            return false;
        } finally {
            setIsSigningOut(false);
        }
    }, [router]);

    // Reset password
    const resetPassword = useCallback(async (email: string): Promise<boolean> => {
        setError(null);

        try {
            const result = await resetPasswordAction(email);

            if (result.success) {
                return true;
            } else {
                setError(result.error || 'Reset failed');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Reset failed');
            return false;
        }
    }, []);

    // Refresh user
    const refresh = useCallback(async () => {
        await loadUser();
    }, [loadUser]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        isSigningIn,
        isSigningUp,
        isSigningOut,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refresh,
        clearError,
    };
}
