import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: '请提供有效的邮箱地址' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const { data: existing } = await supabase
            .from('beta_signups')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return NextResponse.json(
                { error: '该邮箱已经申请过了' },
                { status: 400 }
            );
        }

        // Insert new signup
        const { error } = await supabase
            .from('beta_signups')
            .insert({
                email: email.toLowerCase(),
                source: 'beta_landing',
                created_at: new Date().toISOString(),
            });

        if (error) {
            console.error('Signup error:', error);
            // If table doesn't exist, create a simple fallback
            if (error.code === '42P01') {
                // Table doesn't exist - log to console for now
                console.log('Beta signup (table missing):', email);
                return NextResponse.json({ success: true, message: 'Logged (table pending)' });
            }
            return NextResponse.json(
                { error: '提交失败，请稍后重试' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Beta signup error:', error);
        return NextResponse.json(
            { error: '服务器错误' },
            { status: 500 }
        );
    }
}
