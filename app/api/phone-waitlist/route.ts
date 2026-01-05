import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * API to collect phone numbers from users who want to join the phone signup beta.
 * Stores them in `phone_waitlist` table for later SMS activation.
 */

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone || typeof phone !== 'string') {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Basic phone validation (at least 6 digits for international compatibility)
        const cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length < 6 || cleanedPhone.length > 15) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Insert phone number into waitlist
        const { error } = await supabase
            .from('phone_waitlist')
            .insert({
                phone: phone.trim(),
                source: 'signup_page'
            });

        if (error) {
            if (error.code === '23505') {
                // Duplicate phone - still return success
                return NextResponse.json({
                    success: true,
                    message: 'already_registered'
                });
            }
            console.error('Phone waitlist insert error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'registered'
        });

    } catch (error) {
        console.error('Phone waitlist error:', error);
        return NextResponse.json(
            { error: 'Failed to save phone number' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { count } = await supabase
            .from('phone_waitlist')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            totalCount: count || 0
        });

    } catch (error) {
        console.error('Phone waitlist count error:', error);
        return NextResponse.json(
            { totalCount: 0 },
            { status: 200 }
        );
    }
}
