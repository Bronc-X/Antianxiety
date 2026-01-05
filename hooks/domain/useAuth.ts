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
import type { Session } from '@supabase/supabase-js';
import {
    getCurrentUser,
    signInWithEmail,
    signUpWithEmail,
    signOut as signOutAction,
    resetPassword as resetPasswordAction,
    requireAuth as requireAuthAction,
    ensureUserProfile,
    type UserProfile,
} from '@/app/actions/auth';

// ============================================
// Types
// ============================================

export interface UseAuthReturn {
    // Data
    user: UserProfile | null;
    isAuthenticated: boolean;
    session: Session | null;

    // States
    isLoading: boolean;
    isSigningIn: boolean;
    isSigningUp: boolean;
    isSigningOut: boolean;
    error: string | null;

    // Actions
    signIn: (email: string, password: string, redirectTo?: string) => Promise<boolean>;
    signUp: (
        email: string,
        password: string,
        options?: { redirectTo?: string; shouldRedirect?: boolean }
    ) => Promise<boolean>;
    signInWithOAuth: (provider: 'twitter' | 'github', redirectTo?: string) => Promise<string | null>;
    sendPhoneOtp: (phone: string, options?: { shouldCreateUser?: boolean; data?: Record<string, string> }) => Promise<boolean>;
    verifyPhoneOtp: (phone: string, token: string, type?: 'sms') => Promise<boolean>;
    signOut: (redirectTo?: string) => Promise<boolean>;
    resetPassword: (email: string, redirectTo?: string) => Promise<boolean>;
    updatePassword: (password: string) => Promise<boolean>;
    requireAuth: (redirectTo?: string) => Promise<UserProfile | null>;
    refresh: () => Promise<void>;
    clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useAuth(): UseAuthReturn {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
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
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        } catch {
            setUser(null);
            setSession(null);
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
                    ensureUserProfile(session.user.id).catch(() => {});
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
                setSession(session ?? null);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUser]);

    // Sign in
    const signIn = useCallback(async (email: string, password: string, redirectTo?: string): Promise<boolean> => {
        setIsSigningIn(true);
        setError(null);

        try {
            const result = await signInWithEmail(email, password);

            if (result.success && result.data) {
                setUser(result.data);
                router.push(redirectTo || '/unlearn');
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
    const signUp = useCallback(async (
        email: string,
        password: string,
        options?: { redirectTo?: string; shouldRedirect?: boolean }
    ): Promise<boolean> => {
        setIsSigningUp(true);
        setError(null);

        try {
            const redirectTo = options?.redirectTo ?? `${window.location.origin}/unlearn/onboarding`;
            const shouldRedirect = options?.shouldRedirect !== false;
            const result = await signUpWithEmail(email, password, redirectTo);

            if (result.success && result.data) {
                setUser(result.data);
                if (shouldRedirect) {
                    router.push(options?.redirectTo || '/unlearn/onboarding');
                }
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
    const signOut = useCallback(async (redirectTo?: string): Promise<boolean> => {
        setIsSigningOut(true);
        setError(null);

        try {
            const result = await signOutAction();

            if (result.success) {
                setUser(null);
                router.push(redirectTo || '/unlearn');
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
    const resetPassword = useCallback(async (email: string, redirectTo?: string): Promise<boolean> => {
        setError(null);

        try {
            const result = await resetPasswordAction(email, redirectTo);

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

    // OAuth sign in
    const signInWithOAuth = useCallback(async (
        provider: 'twitter' | 'github',
        redirectTo?: string
    ): Promise<string | null> => {
        setError(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectTo || `${window.location.origin}/auth/callback?next=/unlearn`,
                    skipBrowserRedirect: false,
                },
            });

            if (error) {
                setError(error.message || 'OAuth sign in failed');
                return null;
            }

            return data?.url || null;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'OAuth sign in failed');
            return null;
        }
    }, []);

    // Send phone OTP (login/signup)
    const sendPhoneOtp = useCallback(async (
        phone: string,
        options?: { shouldCreateUser?: boolean; data?: Record<string, string> }
    ): Promise<boolean> => {
        setError(null);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOtp({
                phone,
                options,
            });

            if (error) {
                setError(error.message || 'Failed to send OTP');
                return false;
            }
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
            return false;
        }
    }, []);

    // Verify phone OTP
    const verifyPhoneOtp = useCallback(async (
        phone: string,
        token: string,
        type: 'sms' = 'sms'
    ): Promise<boolean> => {
        setError(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.verifyOtp({
                phone,
                token,
                type,
            });

            if (error) {
                setError(error.message || 'OTP verification failed');
                return false;
            }

            if (data?.session?.user) {
                setUser({
                    id: data.session.user.id,
                    email: data.session.user.email,
                });
                ensureUserProfile(data.session.user.id).catch(() => {});
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'OTP verification failed');
            return false;
        }
    }, []);

    // Update password
    const updatePassword = useCallback(async (password: string): Promise<boolean> => {
        setError(null);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message || 'Failed to update password');
                return false;
            }
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update password');
            return false;
        }
    }, []);

    // Require auth (server-side guard)
    const requireAuth = useCallback(async (redirectTo?: string): Promise<UserProfile | null> => {
        try {
            const result = await requireAuthAction(redirectTo);
            if (result) {
                setUser(result);
                return result;
            }
        } catch {
            setUser(null);
        }
        return null;
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
        isAuthenticated: Boolean(user || session?.user),
        session,
        isLoading,
        isSigningIn,
        isSigningUp,
        isSigningOut,
        error,
        signIn,
        signUp,
        signInWithOAuth,
        sendPhoneOtp,
        verifyPhoneOtp,
        signOut,
        resetPassword,
        updatePassword,
        requireAuth,
        refresh,
        clearError,
    };
}
