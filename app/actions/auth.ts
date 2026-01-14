'use server';

/**
 * Auth Server Actions (The Brain)
 * 
 * Handles all authentication operations via Supabase Auth.
 * These actions are the single source of truth for auth logic.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { GET as getWeChatQrRoute } from '@/app/api/auth/wechat/qr/route';
import { GET as getRedditLoginRoute } from '@/app/api/auth/reddit/route';

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

export interface WeChatQrResult {
    loginUrl: string;
    state: string;
    qrUrl: string;
}

export interface RedditLoginResult {
    url: string;
}

// ============================================
// Helpers
// ============================================

type AuthJsonPayload = {
    error?: string;
} & Record<string, unknown>;

function getAdminSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    return createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

async function parseJsonResponse(response: Response): Promise<unknown> {
    const raw = await response.text();
    try {
        return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function ensureProfileRow(userId: string): Promise<void> {
    const payload = { id: userId };

    try {
        const supabase = await createServerSupabaseClient();
        const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .limit(1);

        if (data && data.length > 0) {
            return;
        }

        const { error } = await supabase.from('profiles').insert(payload);
        if (!error) {
            return;
        }
    } catch {
        // Fallback to service role below.
    }

    const adminSupabase = getAdminSupabase();
    if (!adminSupabase) return;

    try {
        await adminSupabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });
    } catch {
        // Best-effort fallback; avoid blocking auth flow.
    }
}

export async function ensureUserProfile(userId: string): Promise<AuthResult> {
    try {
        await ensureProfileRow(userId);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to ensure profile',
        };
    }
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

        await ensureProfileRow(data.user.id);

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

        await ensureProfileRow(data.user.id);

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
 * Fetch WeChat QR login URL.
 */
export async function getWeChatQr(): Promise<AuthResult<WeChatQrResult>> {
    try {
        const response = await getWeChatQrRoute(new Request('http://auth.local/wechat/qr'));
        const data = await parseJsonResponse(response);
        const payload = typeof data === 'object' && data !== null ? (data as AuthJsonPayload) : null;

        if (!response.ok) {
            return { success: false, error: payload?.error || 'Failed to load WeChat QR' };
        }

        return { success: true, data: data as WeChatQrResult };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to load WeChat QR',
        };
    }
}

/**
 * Get Reddit OAuth login URL.
 */
export async function getRedditLoginUrl(): Promise<AuthResult<RedditLoginResult>> {
    try {
        const response = await getRedditLoginRoute();
        const location = response.headers.get('location');

        if (!location) {
            return { success: false, error: 'Failed to generate Reddit login URL' };
        }

        return { success: true, data: { url: location } };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate Reddit login URL',
        };
    }
}

/**
 * Reset password
 */
export async function resetPassword(email: string, redirectTo?: string): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(
            email,
            redirectTo ? { redirectTo } : undefined
        );

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
export async function requireAuth(redirectTo: string = '/unlearn/login') {
    const result = await getCurrentUser();
    if (!result.success) {
        redirect(redirectTo);
    }
    return result.data!;
}
