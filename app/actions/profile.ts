'use server';

/**
 * Profile Server Actions (The Brain)
 * 
 * Pure server-side functions for user profile operations.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { toSerializable, dateToISO } from '@/lib/dto-utils';
import type { ActionResult } from '@/types/architecture';

// ============================================
// Types
// ============================================

export interface UserProfile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;

    // Demographics
    age: number | null;
    gender: string | null;
    height: number | null;
    weight: number | null;

    // Preferences
    language: string;
    timezone: string | null;
    notification_enabled: boolean;

    // Health Profile
    primary_goal: string | null;
    ai_personality: string | null;
    current_focus: string | null;

    // Integrations
    wearable_connected: boolean;
    wearable_type: string | null;

    // Stats
    member_since: string;
    streak_days: number;
    total_logs: number;
}

export interface UpdateProfileInput {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    language?: string;
    timezone?: string;
    notification_enabled?: boolean;
    primary_goal?: string;
    ai_personality?: string;
    current_focus?: string;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get current user profile.
 */
export async function getProfile(): Promise<ActionResult<UserProfile>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            return { success: false, error: 'Profile not found' };
        }

        // Get stats
        const { count: logCount } = await supabase
            .from('daily_wellness_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const userProfile: UserProfile = {
            id: profile.id,
            email: user.email || '',
            first_name: profile.first_name,
            last_name: profile.last_name,
            full_name: profile.full_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            age: profile.age,
            gender: profile.gender,
            height: profile.height,
            weight: profile.weight,
            language: profile.preferred_language || 'zh',
            timezone: profile.timezone,
            notification_enabled: profile.notification_enabled ?? true,
            primary_goal: profile.primary_goal,
            ai_personality: profile.ai_personality,
            current_focus: profile.current_focus,
            wearable_connected: !!profile.wearable_token,
            wearable_type: profile.wearable_type,
            member_since: dateToISO(profile.created_at) || new Date().toISOString(),
            streak_days: profile.current_streak || 0,
            total_logs: logCount || 0,
        };

        return toSerializable({ success: true, data: userProfile });

    } catch (error) {
        console.error('[Profile Action] getProfile error:', error);
        return { success: false, error: 'Failed to load profile' };
    }
}

/**
 * Update user profile.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<UserProfile>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.first_name !== undefined) updatePayload.first_name = input.first_name;
        if (input.last_name !== undefined) updatePayload.last_name = input.last_name;
        if (input.full_name !== undefined) updatePayload.full_name = input.full_name;
        if (input.username !== undefined) updatePayload.username = input.username;
        if (input.avatar_url !== undefined) updatePayload.avatar_url = input.avatar_url;
        if (input.age !== undefined) updatePayload.age = input.age;
        if (input.gender !== undefined) updatePayload.gender = input.gender;
        if (input.height !== undefined) updatePayload.height = input.height;
        if (input.weight !== undefined) updatePayload.weight = input.weight;
        if (input.language !== undefined) updatePayload.preferred_language = input.language;
        if (input.timezone !== undefined) updatePayload.timezone = input.timezone;
        if (input.notification_enabled !== undefined) updatePayload.notification_enabled = input.notification_enabled;
        if (input.primary_goal !== undefined) updatePayload.primary_goal = input.primary_goal;
        if (input.ai_personality !== undefined) updatePayload.ai_personality = input.ai_personality;
        if (input.current_focus !== undefined) updatePayload.current_focus = input.current_focus;

        const { error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        // Return updated profile
        return getProfile();

    } catch (error) {
        console.error('[Profile Action] updateProfile error:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

/**
 * Upload avatar.
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<string>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        const file = formData.get('avatar') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update profile
        await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        return { success: true, data: publicUrl };

    } catch (error) {
        console.error('[Profile Action] uploadAvatar error:', error);
        return { success: false, error: 'Failed to upload avatar' };
    }
}

/**
 * Delete account.
 */
export async function deleteAccount(): Promise<ActionResult<void>> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Please sign in' };
        }

        // Mark profile as deleted (soft delete)
        await supabase
            .from('profiles')
            .update({
                deleted_at: new Date().toISOString(),
                email_verified: false,
            })
            .eq('id', user.id);

        // Sign out
        await supabase.auth.signOut();

        return { success: true };

    } catch (error) {
        console.error('[Profile Action] deleteAccount error:', error);
        return { success: false, error: 'Failed to delete account' };
    }
}
