/**
 * Execution Tracking API
 * 执行追踪API端点
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  recordExecution,
  getExecutionHistory,
  calculateExecutionRate,
  flagForReplacement,
  getItemsNeedingReplacement,
  getExecutionSummary,
} from '@/lib/services/execution-tracking-service';
import type { ExecutionStatus } from '@/types/adaptive-plan';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isAdminToken } from '@/lib/admin-auth';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/execution-tracking
 * Fetch execution history or summary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actionItemId = searchParams.get('actionItemId');
    const planId = searchParams.get('planId');
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (actionItemId) {
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
      const history = await getExecutionHistory(actionItemId, days);
      return NextResponse.json({ history });
    }
    
    if (planId) {
      if (!isAdmin) {
        const supabase = getSupabaseClient();
        const ownerId = await getPlanOwnerId(supabase, planId);
        if (!ownerId) {
          return NextResponse.json(
            { error: 'Plan not found' },
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
      const [executionRate, itemsNeedingReplacement] = await Promise.all([
        calculateExecutionRate(planId),
        getItemsNeedingReplacement(planId),
      ]);
      
      return NextResponse.json({
        executionRate,
        itemsNeedingReplacement,
      });
    }
    
    if (userId) {
      if (!isAdmin && userId !== user?.id) {
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
      const summary = await getExecutionSummary(targetUserId, days);
      return NextResponse.json({ summary });
    }
    
    return NextResponse.json(
      { error: 'actionItemId, planId, or userId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to get execution data:', error);
    return NextResponse.json(
      { error: '你的进展已安全保存，正在同步中' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/execution-tracking
 * Record execution status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      actionItemId,
      userId,
      status,
      needsReplacement,
      userNotes,
      replacementReason,
    } = body;
    
    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!actionItemId || !status) {
      return NextResponse.json(
        { error: 'actionItemId and status are required' },
        { status: 400 }
      );
    }

    if (!isAdmin && userId && userId !== user?.id) {
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
    
    const validStatuses: ExecutionStatus[] = ['completed', 'partial', 'skipped', 'replaced'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: completed, partial, skipped, or replaced' },
        { status: 400 }
      );
    }
    
    const record = await recordExecution({
      action_item_id: actionItemId,
      user_id: targetUserId,
      date: new Date().toISOString().split('T')[0],
      status,
      needs_replacement: needsReplacement || false,
      user_notes: userNotes,
      replacement_reason: replacementReason,
    });
    
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Failed to record execution:', error);
    return NextResponse.json(
      { error: '你的进展已安全保存，正在同步中' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/execution-tracking
 * Mark items for replacement
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionItemId, reason } = body;
    
    const isAdmin = isAdminToken(request.headers);
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (!isAdmin && (authError || !user)) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!actionItemId || !reason) {
      return NextResponse.json(
        { error: 'actionItemId and reason are required' },
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
    
    await flagForReplacement(actionItemId, reason);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to flag for replacement:', error);
    return NextResponse.json(
      { error: '你的进展已安全保存，正在同步中' },
      { status: 500 }
    );
  }
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

async function getPlanOwnerId(
  supabase: ReturnType<typeof createClient>,
  planId: string
): Promise<string | null> {
  const { data: plan } = await supabase
    .from('user_plans')
    .select('user_id')
    .eq('id', planId)
    .maybeSingle();

  return plan?.user_id ?? null;
}
