import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, ai_settings')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.user_metadata?.name || user.user_metadata?.full_name || null,
      aiSettings: profile?.ai_settings || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
