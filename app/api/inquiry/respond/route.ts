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
      console.error('❌ [Inquiry] Error updating inquiry:', updateError);
      return NextResponse.json({ error: 'Failed to record response' }, { status: 500 });
    }
    
    console.log('✅ [Inquiry] Response recorded:', {
      inquiryId,
      response,
      dataGaps: updatedInquiry.data_gaps_addressed,
      respondedAt: updatedInquiry.responded_at
    });

    // Sync inquiry response to daily_calibrations
    const dataGaps = updatedInquiry.data_gaps_addressed || [];
    if (dataGaps.length > 0) {
      const gapField = dataGaps[0];
      const today = new Date().toISOString().split('T')[0];
      
      // Map response values to calibration data
      const calibrationUpdate: Record<string, unknown> = {};
      
      switch (gapField) {
        case 'sleep_hours':
          // Map sleep response to hours
          const sleepMap: Record<string, number> = {
            'under_6': 5,
            '6_7': 6.5,
            '7_8': 7.5,
            'over_8': 8.5,
          };
          calibrationUpdate.sleep_hours = sleepMap[response] || null;
          break;
          
        case 'stress_level':
          // Map stress response to level (1-10 scale)
          const stressMap: Record<string, number> = {
            'low': 3,
            'medium': 6,
            'high': 9,
          };
          calibrationUpdate.stress_level = stressMap[response] || null;
          break;
          
        case 'exercise_duration':
          // Map exercise response to minutes
          const exerciseMap: Record<string, number> = {
            'none': 0,
            'light': 15,
            'moderate': 30,
            'intense': 60,
          };
          calibrationUpdate.exercise_duration = exerciseMap[response] || null;
          break;
          
        case 'mood':
          // Map mood response to score (1-10 scale)
          const moodMap: Record<string, number> = {
            'bad': 3,
            'okay': 6,
            'great': 9,
          };
          calibrationUpdate.mood_score = moodMap[response] || null;
          break;
          
        case 'meal_quality':
          // Store as text for now
          calibrationUpdate.meal_quality = response;
          break;
          
        case 'water_intake':
          // Store as text for now
          calibrationUpdate.water_intake = response;
          break;
      }
      
      // Upsert to daily_calibrations
      if (Object.keys(calibrationUpdate).length > 0) {
        const { error: calibrationError } = await supabase
          .from('daily_calibrations')
          .upsert({
            user_id: user.id,
            date: today,
            ...calibrationUpdate,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,date',
          });
          
        if (calibrationError) {
          console.warn('Error syncing to daily_calibrations:', calibrationError);
          // Don't fail the request for this
        } else {
          console.log(`✅ Synced ${gapField} to daily_calibrations:`, calibrationUpdate);
        }
      }
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

    const cookieHeader = request.headers.get('cookie') ?? '';
    await fetch(new URL('/api/user/refresh', request.url), {
      method: 'POST',
      headers: { cookie: cookieHeader },
    }).catch(() => {});
    await fetch(new URL('/api/user/profile-sync', request.url), {
      method: 'POST',
      headers: { cookie: cookieHeader },
    }).catch(() => {});

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
