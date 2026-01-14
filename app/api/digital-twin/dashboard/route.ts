/**
 * Digital Twin Dashboard API
 * 
 * 获取用户的仪表盘数据
 * GET /api/digital-twin/dashboard
 * 
 * @module app/api/digital-twin/dashboard/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getDataCollectionStatus } from '@/lib/digital-twin/data-aggregator';
import { filterSensitiveData } from '@/lib/digital-twin/dashboard-generator';
import type { DashboardResponse, DashboardData, AdaptivePlan } from '@/types/digital-twin';

// ============================================
// 常量
// ============================================

/** 数据过期时间（毫秒）- 6 小时 */
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000;

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    void request;
    const supabase = await createServerSupabaseClient();
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    
    // 获取数据收集状态
    const collectionStatus = await getDataCollectionStatus(userId);
    
    // 如果数据不足，返回收集状态
    if (!collectionStatus.isReady) {
      return NextResponse.json({
        status: 'collecting_data',
        collectionStatus,
        message: collectionStatus.message,
      });
    }
    
    // 获取最新分析结果
    const { data: latestAnalysis, error: fetchError } = await supabase
      .from('digital_twin_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !latestAnalysis) {
      // 没有分析结果，提示用户触发分析
      return NextResponse.json({
        status: 'no_analysis',
        collectionStatus,
        message: '数据已就绪，请触发首次分析',
      });
    }
    
    // 检查数据是否过期
    const analysisTime = new Date(latestAnalysis.created_at).getTime();
    const isStale = Date.now() - analysisTime > STALE_THRESHOLD_MS;
    
    // 获取用户隐私设置
    const { data: profile } = await supabase
      .from('profiles')
      .select('medical_history_consent')
      .eq('id', userId)
      .single();
    
    const hasConsent = profile?.medical_history_consent ?? false;
    
    // 处理仪表盘数据
    let dashboardData: DashboardData = latestAnalysis.dashboard_data;
    
    // 应用隐私过滤
    dashboardData = filterSensitiveData(dashboardData, hasConsent);
    
    // 构建响应
    const response: DashboardResponse = {
      dashboardData,
      adaptivePlan: latestAnalysis.adaptive_plan as AdaptivePlan,
      isStale,
      lastAnalyzed: latestAnalysis.created_at,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ 仪表盘 API 错误:', error);
    return NextResponse.json(
      { error: '获取数据时出现问题，请稍后再试' },
      { status: 500 }
    );
  }
}
