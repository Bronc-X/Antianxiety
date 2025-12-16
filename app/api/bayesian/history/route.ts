/**
 * Bayesian History API Endpoint
 * 
 * 获取用户的焦虑历史数据，用于绘制焦虑曲线
 * 
 * GET /api/bayesian/history
 * 
 * @module app/api/bayesian/history/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ============================================
// Types
// ============================================

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface HistoryDataPoint {
  id: string;
  date: string;
  belief_context: string;
  prior_score: number;
  posterior_score: number;
  evidence_stack: unknown[];
  exaggeration_factor: number;
}

interface HistoryResponse {
  success: boolean;
  data?: {
    points: HistoryDataPoint[];
    summary: {
      total_entries: number;
      average_prior: number;
      average_posterior: number;
      average_reduction: number;
      trend: 'improving' | 'stable' | 'worsening';
    };
  };
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * 根据时间范围计算起始日期
 */
function getStartDate(timeRange: TimeRange): Date | null {
  const now = new Date();
  
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * 计算趋势
 */
function calculateTrend(points: HistoryDataPoint[]): 'improving' | 'stable' | 'worsening' {
  if (points.length < 3) {
    return 'stable';
  }

  // 取最近 5 个点和之前 5 个点比较
  const recentPoints = points.slice(-5);
  const olderPoints = points.slice(-10, -5);

  if (olderPoints.length === 0) {
    return 'stable';
  }

  const recentAvg = recentPoints.reduce((sum, p) => sum + p.posterior_score, 0) / recentPoints.length;
  const olderAvg = olderPoints.reduce((sum, p) => sum + p.posterior_score, 0) / olderPoints.length;

  const diff = recentAvg - olderAvg;

  if (diff < -5) {
    return 'improving';  // 后验分数降低 = 焦虑减少 = 改善
  } else if (diff > 5) {
    return 'worsening';
  } else {
    return 'stable';
  }
}

// ============================================
// API Handler
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    const supabase = await createClient();
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '请先登录以查看历史数据' },
        { status: 401 }
      );
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') || '30d') as TimeRange;
    const context = searchParams.get('context');

    // 构建查询
    let query = supabase
      .from('bayesian_beliefs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // 添加时间范围过滤
    const startDate = getStartDate(timeRange);
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    // 添加上下文过滤
    if (context) {
      query = query.eq('belief_context', context);
    }

    const { data: beliefs, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Failed to fetch history:', fetchError);
      return NextResponse.json(
        { success: false, error: '获取历史数据时遇到问题，请稍后重试' },
        { status: 500 }
      );
    }

    // 转换数据格式
    const points: HistoryDataPoint[] = (beliefs || []).map(belief => ({
      id: belief.id,
      date: belief.created_at,
      belief_context: belief.belief_context,
      prior_score: belief.prior_score,
      posterior_score: belief.posterior_score,
      evidence_stack: belief.evidence_stack || [],
      exaggeration_factor: belief.calculation_details?.exaggeration_factor || 
        (belief.posterior_score > 0 ? belief.prior_score / belief.posterior_score : 1)
    }));

    // 计算汇总统计
    const totalEntries = points.length;
    const averagePrior = totalEntries > 0 
      ? points.reduce((sum, p) => sum + p.prior_score, 0) / totalEntries 
      : 0;
    const averagePosterior = totalEntries > 0 
      ? points.reduce((sum, p) => sum + p.posterior_score, 0) / totalEntries 
      : 0;
    const averageReduction = averagePrior - averagePosterior;
    const trend = calculateTrend(points);

    return NextResponse.json({
      success: true,
      data: {
        points,
        summary: {
          total_entries: totalEntries,
          average_prior: Math.round(averagePrior * 10) / 10,
          average_posterior: Math.round(averagePosterior * 10) / 10,
          average_reduction: Math.round(averageReduction * 10) / 10,
          trend
        }
      }
    });

  } catch (error) {
    console.error('❌ History API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '正在加载您的认知历程，请稍候...' 
      },
      { status: 500 }
    );
  }
}
