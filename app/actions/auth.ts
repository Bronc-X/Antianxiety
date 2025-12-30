'use server';

/**
 * Auth Server Actions (The Brain)
 * 
 * Handles all authentication operations via Supabase Auth.
 * These actions are the single source of truth for auth logic.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

// ============================================
// Types
// ============================================

export interface AuthResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface UserProfile {
    id: string;
    email: string | undefined;
    created_at?: string;
}

// ============================================
// Actions
// ============================================

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthResult<UserProfile>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return { success: false, error: error?.message || 'Not authenticated' };
        }

        return {
            success: true,
            data: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get user',
        };
    }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
    email: string,
    password: string
): Promise<AuthResult<UserProfile>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data.user) {
            return { success: false, error: 'No user returned' };
        }

        return {
            success: true,
            data: {
                id: data.user.id,
                email: data.user.email,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Sign in failed',
        };
    }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    redirectTo?: string
): Promise<AuthResult<UserProfile>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data.user) {
            return { success: false, error: 'No user returned' };
        }

        return {
            success: true,
            data: {
                id: data.user.id,
                email: data.user.email,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Sign up failed',
        };
    }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Sign out failed',
        };
    }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Reset failed',
        };
    }
}

/**
 * Server-side auth check with redirect
 */
export async function requireAuth(redirectTo: string = '/login') {
    const result = await getCurrentUser();
    if (!result.success) {
        redirect(redirectTo);
    }
    return result.data!;
}
