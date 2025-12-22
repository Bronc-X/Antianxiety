/**
 * Alternative Generation API
 * 智能平替推荐API端点
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateAlternatives,
  selectAlternative,
  trackAlternativeSuccess,
} from '@/lib/services/alternative-generation-service';
import { getPreferenceProfile } from '@/lib/services/preference-profile-service';
import { calculateScore } from '@/lib/services/understanding-score-service';
import type { ActionItem, AlternativeAction } from '@/types/adaptive-plan';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * POST /api/alternatives
 * Generate alternatives for selected items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionItemId, userId, replacementReason } = body;
    
    if (!actionItemId || !userId || !replacementReason) {
      return NextResponse.json(
        { error: 'actionItemId, userId, and replacementReason are required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Get the action item
    const { data: actionItem, error: itemError } = await supabase
      .from('plan_action_items')
      .select('*')
      .eq('id', actionItemId)
      .single();
    
    if (itemError || !actionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      );
    }
    
    // Get user preference profile
    const userProfile = await getPreferenceProfile(userId);
    
    // Generate alternatives
    const alternatives = await generateAlternatives(
      mapDbToActionItem(actionItem),
      userProfile,
      replacementReason
    );
    
    return NextResponse.json({ alternatives });
  } catch (error) {
    console.error('Failed to generate alternatives:', error);
    return NextResponse.json(
      { error: '正在寻找更适合你的方式...' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alternatives
 * Select an alternative
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalActionId, alternative, userId } = body;
    
    if (!originalActionId || !alternative || !userId) {
      return NextResponse.json(
        { error: 'originalActionId, alternative, and userId are required' },
        { status: 400 }
      );
    }
    
    // Get current understanding score
    const score = await calculateScore(userId);
    
    // Select the alternative
    const newActionItem = await selectAlternative(
      originalActionId,
      alternative as AlternativeAction,
      userId,
      score.current_score
    );
    
    return NextResponse.json({ actionItem: newActionItem });
  } catch (error) {
    console.error('Failed to select alternative:', error);
    return NextResponse.json(
      { error: '正在寻找更适合你的方式...' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/alternatives
 * Track alternative success
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actionItemId = searchParams.get('actionItemId');
    const days = parseInt(searchParams.get('days') || '3', 10);
    
    if (!actionItemId) {
      return NextResponse.json(
        { error: 'actionItemId is required' },
        { status: 400 }
      );
    }
    
    const result = await trackAlternativeSuccess(actionItemId, days);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to track alternative success:', error);
    return NextResponse.json(
      { error: '正在寻找更适合你的方式...' },
      { status: 500 }
    );
  }
}

// Helper function
interface DbActionItem {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  timing: string | null;
  duration: string | null;
  steps: string[];
  expected_outcome: string | null;
  scientific_rationale: Record<string, unknown> | null;
  item_order: number;
  is_established: boolean;
  replacement_count: number;
  created_at: string;
  updated_at: string;
}

function mapDbToActionItem(db: DbActionItem): ActionItem {
  return {
    id: db.id,
    plan_id: db.plan_id,
    title: db.title,
    description: db.description,
    timing: db.timing || '',
    duration: db.duration || '',
    steps: db.steps || [],
    expected_outcome: db.expected_outcome || '',
    scientific_rationale: (db.scientific_rationale || {
      physiology: '',
      neurology: '',
      psychology: '',
      behavioral_science: '',
      summary: '',
    }) as ActionItem['scientific_rationale'],
    order: db.item_order,
    is_established: db.is_established,
    replacement_count: db.replacement_count,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}
