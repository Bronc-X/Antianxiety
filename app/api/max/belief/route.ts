/**
 * Max Belief API
 * POST: Calculate and store belief session
 * GET: Fetch belief history
 * 
 * @module app/api/max/belief/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server';
import { calculatePosterior } from '@/lib/max/bayesian-engine';
import { BeliefInput, BeliefSession } from '@/types/max';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { prior, hrv_data, paper_ids, belief_text } = body as BeliefInput & { belief_text?: string };
    
    // Validate prior
    if (typeof prior !== 'number' || prior < 0 || prior > 100) {
      return NextResponse.json(
        { error: 'Prior must be a number between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Calculate posterior
    const result = await calculatePosterior({ prior, hrv_data, paper_ids });
    
    // Store session
    const { data: session, error: insertError } = await supabase
      .from('belief_sessions')
      .insert({
        user_id: user.id,
        prior_value: result.prior,
        posterior_value: result.posterior,
        likelihood: result.likelihood,
        evidence_weight: result.evidence,
        papers_used: result.papers_used,
        hrv_data: hrv_data || null,
        belief_text: belief_text || null
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error storing belief session:', insertError);
      return NextResponse.json(
        { error: 'Data persistence anomaly. Session not saved.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      session,
      calculation: result,
      message: `Probability adjusted to ${result.posterior}%. Proceed?`
    });
  } catch (error) {
    console.error('Error processing belief:', error);
    return NextResponse.json(
      { error: 'Processing anomaly detected.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Fetch belief history (RLS ensures user only sees their own data)
    const { data: sessions, error: fetchError } = await supabase
      .from('belief_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (fetchError) {
      console.error('Error fetching belief history:', fetchError);
      return NextResponse.json(
        { error: 'Data retrieval anomaly.' },
        { status: 500 }
      );
    }
    
    // Get total count
    const { count } = await supabase
      .from('belief_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    return NextResponse.json({
      sessions: sessions as BeliefSession[],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching belief history:', error);
    return NextResponse.json(
      { error: 'Processing anomaly detected.' },
      { status: 500 }
    );
  }
}
