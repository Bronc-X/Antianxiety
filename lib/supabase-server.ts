import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization') ?? headerStore.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const globalHeaders: Record<string, string> = {};
  if (bearerToken) {
    globalHeaders.Authorization = `Bearer ${bearerToken}`;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: Object.keys(globalHeaders).length > 0 ? { headers: globalHeaders } : undefined,
      cookies: {
        get(name: string) {
          try {
            const value = cookieStore.get(name)?.value;
            if (value) return value;
            if (name === 'sb-access-token' && bearerToken) return bearerToken;
            return undefined;
          } catch (error) {
            console.error('Error getting cookie:', error);
            return undefined;
          }
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          // Next.js 16: Cookie 写入只能在 Server Actions/Route Handlers 中进行
          // 在 Server Components 中静默跳过
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // 静默处理：Server Component 中无法写入 cookie
          }
        },
        remove(name: string, options: { path?: string }) {
          // Next.js 16: Cookie 删除只能在 Server Actions/Route Handlers 中进行
          // 在 Server Components 中静默跳过
          try {
            cookieStore.delete({ name, ...options });
          } catch {
            // 静默处理：Server Component 中无法删除 cookie
          }
        },
      },
    }
  );
}



// Alias for backward compatibility
export const createClient = createServerSupabaseClient;
