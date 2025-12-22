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
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isAdminToken } from '@/lib/admin-auth';

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
    
    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!actionItemId || !replacementReason) {
      return NextResponse.json(
        { error: 'actionItemId and replacementReason are required' },
        { status: 400 }
      );
    }

    if (!isAdmin && userId && user?.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const targetUserId = isAdmin ? (userId || user?.id) : user?.id;
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();

    const ownerId = await getActionItemOwnerId(supabase, actionItemId);
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      );
    }
    if (ownerId !== targetUserId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
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
    const userProfile = await getPreferenceProfile(targetUserId);
    
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
    
    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!originalActionId || !alternative) {
      return NextResponse.json(
        { error: 'originalActionId and alternative are required' },
        { status: 400 }
      );
    }

    if (!isAdmin && userId && user?.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const targetUserId = isAdmin ? (userId || user?.id) : user?.id;
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const ownerId = await getActionItemOwnerId(supabase, originalActionId);
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      );
    }
    if (ownerId !== targetUserId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get current understanding score
    const score = await calculateScore(targetUserId);
    
    // Select the alternative
    const newActionItem = await selectAlternative(
      originalActionId,
      alternative as AlternativeAction,
      targetUserId,
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
    
    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!actionItemId) {
      return NextResponse.json(
        { error: 'actionItemId is required' },
        { status: 400 }
      );
    }

    if (!isAdmin) {
      const supabase = getSupabaseClient();
      const ownerId = await getActionItemOwnerId(supabase, actionItemId);
      if (!ownerId) {
        return NextResponse.json(
          { error: 'Action item not found' },
          { status: 404 }
        );
      }
      if (ownerId !== user?.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
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

async function getActionItemOwnerId(
  supabase: ReturnType<typeof createClient>,
  actionItemId: string
): Promise<string | null> {
  const { data: actionItem } = await supabase
    .from('plan_action_items')
    .select('plan_id')
    .eq('id', actionItemId)
    .maybeSingle();

  if (!actionItem?.plan_id) return null;

  const { data: plan } = await supabase
    .from('user_plans')
    .select('user_id')
    .eq('id', actionItem.plan_id)
    .maybeSingle();

  return plan?.user_id ?? null;
}
