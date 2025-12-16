export const API_BASE = process.env.API_BASE || process.env.EXPO_PUBLIC_API_BASE || '';
export const DEEP_LINK_SCHEME = process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME || 'myapp';

export const hasApiBase = Boolean(API_BASE);
export const hasSupabaseEnv =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) && Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
