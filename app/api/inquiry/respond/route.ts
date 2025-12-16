/**
 * Inquiry Response API
 * 
 * Handles user responses to active inquiries.
 * Updates inquiry_history and adjusts future inquiry priorities.
 * 
 * Requirements: 4.5
 * Property 12: Inquiry Response Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RespondRequest {
  inquiryId: string;
  response: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RespondRequest = await request.json();
    const { inquiryId, response } = body;

    if (!inquiryId || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the inquiry record with response
    const { data: updatedInquiry, error: updateError } = await supabase
      .from('inquiry_history')
      .update({
        user_response: response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', inquiryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating inquiry:', updateError);
      return NextResponse.json({ error: 'Failed to record response' }, { status: 500 });
    }

    // Update user activity pattern (for optimal timing calculation)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    // Upsert activity pattern
    const { error: patternError } = await supabase
      .from('user_activity_patterns')
      .upsert({
        user_id: user.id,
        day_of_week: dayOfWeek,
        hour_of_day: hourOfDay,
        activity_score: 0.7, // Responding to inquiry indicates high engagement
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id,day_of_week,hour_of_day',
      });

    if (patternError) {
      console.warn('Error updating activity pattern:', patternError);
      // Don't fail the request for this
    }

    return NextResponse.json({
      success: true,
      inquiry: updatedInquiry,
      message: '感谢你的回答！这将帮助我更好地了解你。',
    });
  } catch (error) {
    console.error('Inquiry respond API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
