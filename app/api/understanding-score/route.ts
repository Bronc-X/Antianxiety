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

/**
 * GET /api/understanding-score
 * Fetch current score and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Get current score
    const score = await calculateScore(userId);
    
    // Get history if requested
    let history: { date: string; score: number; factors_changed: string[] }[] = [];
    if (includeHistory) {
      history = await getScoreHistory(userId, days);
    }
    
    // Check deep understanding status
    const isDeepUnderstanding = await isDeepUnderstandingAchieved(userId);
    
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
