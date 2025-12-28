/**
 * Understanding Score API
 * 用户理解度评分API端点
 * 
 * Requirements: 5.6, 5.8
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateScore,
  getScoreHistory,
  isDeepUnderstandingAchieved,
} from '@/lib/services/understanding-score-service';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isAdminToken } from '@/lib/admin-auth';

/**
 * GET /api/understanding-score
 * Fetch current score and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const includeHistory = searchParams.get('includeHistory') === 'true';
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

    if (!isAdmin && requestedUserId && requestedUserId !== user?.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    const targetUserId = isAdmin ? (requestedUserId || user?.id) : user?.id;
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Get current score
    const score = await calculateScore(targetUserId);
    
    // Get history if requested
    let history: { date: string; score: number; factors_changed: string[] }[] = [];
    if (includeHistory) {
      history = await getScoreHistory(targetUserId, days);
    }
    
    // Check deep understanding status
    const isDeepUnderstanding = await isDeepUnderstandingAchieved(targetUserId);
    
    return NextResponse.json({
      score: {
        current: score.current_score,
        breakdown: score.score_breakdown,
        isDeepUnderstanding,
        lastUpdated: score.last_updated,
      },
      history,
    });
  } catch (error) {
    console.error('Failed to get understanding score:', error);
    return NextResponse.json(
      { error: '正在重新评估，请稍候' },
      { status: 500 }
    );
  }
}
