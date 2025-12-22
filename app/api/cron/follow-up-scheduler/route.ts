/**
 * Follow-up Scheduler Cron Job
 * 问询调度定时任务
 * 
 * Requirements: 1.1, 1.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  scheduleSession,
  markOverdueSessions,
  isWithinCheckInWindow,
} from '@/lib/services/follow-up-service';
import type { SessionType } from '@/types/adaptive-plan';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/cron/follow-up-scheduler
 * Run the follow-up scheduler
 * 
 * This should be called by a cron job every hour
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    const now = new Date();
    const currentHour = now.getHours();
    
    // Determine session type based on current time
    let sessionType: SessionType | null = null;
    
    // Morning window: 9:00-10:00
    if (currentHour >= 9 && currentHour < 10) {
      sessionType = 'morning';
    }
    // Evening window: 20:00-21:00
    else if (currentHour >= 20 && currentHour < 21) {
      sessionType = 'evening';
    }
    
    const results = {
      scheduledSessions: 0,
      markedMissed: 0,
      errors: [] as string[],
    };
    
    // Get all users with active plans
    const { data: activePlans, error: plansError } = await supabase
      .from('user_plans')
      .select('id, user_id')
      .eq('status', 'active');
    
    if (plansError) {
      console.error('Failed to get active plans:', plansError);
      return NextResponse.json(
        { error: 'Failed to get active plans' },
        { status: 500 }
      );
    }
    
    if (!activePlans || activePlans.length === 0) {
      return NextResponse.json({
        message: 'No active plans found',
        results,
      });
    }
    
    // Process each user with an active plan
    for (const plan of activePlans) {
      try {
        // Mark overdue sessions as missed
        const missedCount = await markOverdueSessions(plan.user_id);
        results.markedMissed += missedCount;
        
        // Schedule new session if within window
        if (sessionType) {
          // Check if session already exists for today
          const today = now.toISOString().split('T')[0];
          const { data: existingSession } = await supabase
            .from('follow_up_sessions')
            .select('id')
            .eq('user_id', plan.user_id)
            .eq('plan_id', plan.id)
            .eq('session_type', sessionType)
            .gte('scheduled_at', `${today}T00:00:00`)
            .lt('scheduled_at', `${today}T23:59:59`)
            .single();
          
          if (!existingSession) {
            await scheduleSession({
              userId: plan.user_id,
              planId: plan.id,
              type: sessionType,
            });
            results.scheduledSessions++;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`User ${plan.user_id}: ${errorMessage}`);
      }
    }
    
    return NextResponse.json({
      message: 'Scheduler completed',
      sessionType,
      results,
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return NextResponse.json(
      { error: 'Scheduler failed' },
      { status: 500 }
    );
  }
}
