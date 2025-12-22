/**
 * Execution Tracking API
 * 执行追踪API端点
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordExecution,
  getExecutionHistory,
  calculateExecutionRate,
  flagForReplacement,
  getItemsNeedingReplacement,
  getExecutionSummary,
} from '@/lib/services/execution-tracking-service';
import type { ExecutionStatus } from '@/types/adaptive-plan';

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
    
    if (actionItemId) {
      const history = await getExecutionHistory(actionItemId, days);
      return NextResponse.json({ history });
    }
    
    if (planId) {
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
      const summary = await getExecutionSummary(userId, days);
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
    
    if (!actionItemId || !userId || !status) {
      return NextResponse.json(
        { error: 'actionItemId, userId, and status are required' },
        { status: 400 }
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
      user_id: userId,
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
    
    if (!actionItemId || !reason) {
      return NextResponse.json(
        { error: 'actionItemId and reason are required' },
        { status: 400 }
      );
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
