import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Campaign config: starts at 2026-01-03 00:00:00 CST (UTC+8)
const CAMPAIGN_START = new Date('2026-01-03T00:00:00+08:00').getTime();
const BASE_COUNT = 55; // Initial count
const VIRTUAL_INCREMENT_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

function getVirtualCount(): number {
    const now = Date.now();
    if (now < CAMPAIGN_START) return BASE_COUNT;

    const elapsed = now - CAMPAIGN_START;
    const virtualIncrements = Math.floor(elapsed / VIRTUAL_INCREMENT_INTERVAL_MS);
    return BASE_COUNT + virtualIncrements;
}

export async function POST(req: NextRequest) {
    try {
        const { email, phone } = await req.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        if (!phone || typeof phone !== 'string') {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Basic phone validation (11 digits for CN)
        const phoneRegex = /^\d{11}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Insert email and phone
        const { error } = await supabase
            .from('early_access_signups')
            .insert({
                email: email.toLowerCase().trim(),
                phone: phone.trim()
            });

        if (error) {
            if (error.code === '23505') {
                // Duplicate email - still return success
                const { count } = await supabase
                    .from('early_access_signups')
                    .select('*', { count: 'exact', head: true });

                return NextResponse.json({
                    success: true,
                    message: 'Already registered',
                    totalCount: getVirtualCount() + (count || 0)
                });
            }
            throw error;
        }

        // Get updated count
        const { count } = await supabase
            .from('early_access_signups')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            totalCount: getVirtualCount() + (count || 0)
        });

    } catch (error) {
        console.error('Early access signup error:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { count } = await supabase
            .from('early_access_signups')
            .select('*', { count: 'exact', head: true });

        const campaignEnd = CAMPAIGN_START + (60 * 60 * 60 * 1000); // 60 hours
        const now = Date.now();
        const remainingMs = Math.max(0, campaignEnd - now);

        return NextResponse.json({
            totalCount: getVirtualCount() + (count || 0),
            realCount: count || 0,
            remainingMs,
            campaignEnd
        });

    } catch (error) {
        console.error('Early access count error:', error);
        return NextResponse.json(
            { totalCount: getVirtualCount(), remainingMs: 0 },
            { status: 200 }
        );
    }
}
