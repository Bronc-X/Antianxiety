import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

interface RegisterRequest {
  email?: string;
  password?: string;
  name?: string;
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequest;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const adminSupabase = getAdminSupabase();
    if (adminSupabase) {
      const { error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || null, signup_method: 'ios' },
      });

      if (createError && !createError.message?.includes('already')) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
    } else {
      const supabase = await createServerSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || null },
        },
      });
      if (signUpError && !signUpError.message?.includes('already')) {
        return NextResponse.json({ error: signUpError.message }, { status: 400 });
      }
    }

    // Auto sign-in for mobile clients.
    const supabase = await createServerSupabaseClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.session || !signInData.user) {
      return NextResponse.json({ error: signInError?.message || 'Account created but sign in failed' }, { status: 400 });
    }

    return NextResponse.json({
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        name: signInData.user.user_metadata?.name || name || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
