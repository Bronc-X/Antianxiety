/**
 * Phase Goals Settings API
 * 
 * Retrieves user's Phase Goals for display in Settings page.
 * Implements Property 5: Goal-Settings Synchronization
 * 
 * Requirements: 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PhaseGoal } from '@/types/adaptive-interaction';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's Phase Goals
    const { data: goals, error } = await supabase
      .from('phase_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching phase goals:', error);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    return NextResponse.json({ 
      goals: goals as PhaseGoal[],
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Phase goals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
