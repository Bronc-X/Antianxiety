import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { valid: false, error: 'Invite code is required' },
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

        // Check if invite code exists and is valid
        const { data: inviteCode, error } = await supabase
            .from('invite_codes')
            .select('id, code, max_uses, current_uses, expires_at')
            .eq('code', code.trim().toUpperCase())
            .single();

        if (error || !inviteCode) {
            return NextResponse.json(
                { valid: false, error: 'Invalid invite code' },
                { status: 200 }
            );
        }

        // Check if code has expired
        if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
            return NextResponse.json(
                { valid: false, error: 'Invite code has expired' },
                { status: 200 }
            );
        }

        // Check if code has reached max uses
        if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
            return NextResponse.json(
                { valid: false, error: 'Invite code has reached its usage limit' },
                { status: 200 }
            );
        }

        // Code is valid
        return NextResponse.json({ valid: true }, { status: 200 });
    } catch (error) {
        console.error('Invite code validation error:', error);
        return NextResponse.json(
            { valid: false, error: 'Validation failed' },
            { status: 500 }
        );
    }
}
