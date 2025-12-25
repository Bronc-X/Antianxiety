import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Invite code is required' },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookies) {
                        cookies.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Increment the usage count
        const { error } = await supabase.rpc('increment_invite_code_usage', {
            p_code: code.trim().toUpperCase()
        });

        if (error) {
            // If RPC doesn't exist, fall back to direct update
            const { error: updateError } = await supabase
                .from('invite_codes')
                .update({ current_uses: supabase.rpc('increment', { x: 1 }) as unknown as number })
                .eq('code', code.trim().toUpperCase());

            if (updateError) {
                console.error('Failed to increment invite code usage:', updateError);
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Use invite code error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to use invite code' },
            { status: 500 }
        );
    }
}
