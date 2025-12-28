/**
 * Digital Twin Analyze API
 * 
 * 触发完整的 AI 分析流程
 * POST /api/digital-twin/analyze
 * 
 * @module app/api/digital-twin/analyze/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aggregateUserData, isDataSufficientForAnalysis } from '@/lib/digital-twin/data-aggregator';
import { analyzeWithLLM } from '@/lib/digital-twin/llm-analyzer';
import { generateDashboardData } from '@/lib/digital-twin/dashboard-generator';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types/digital-twin';

// ============================================
// 常量
// ============================================

/** 分析冷却时间（毫秒）- 6 小时 */
const ANALYSIS_COOLDOWN_MS = 6 * 60 * 60 * 1000;

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 解析请求
    const body: AnalyzeRequest = await request.json();
    const userId = body.userId || user.id;
    const forceRefresh = body.forceRefresh || false;
    
    // 安全检查：用户只能分析自己的数据
    if (userId !== user.id) {
      return NextResponse.json(
        { error: '无权访问此数据' },
        { status: 403 }
      );
    }
    
    // 检查冷却时间（除非强制刷新）
    if (!forceRefresh) {
      const { data: recentAnalysis } = await supabase
        .from('digital_twin_analyses')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (recentAnalysis) {
        const lastAnalysisTime = new Date(recentAnalysis.created_at).getTime();
        const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
        
        if (timeSinceLastAnalysis < ANALYSIS_COOLDOWN_MS) {
          const remainingMinutes = Math.ceil((ANALYSIS_COOLDOWN_MS - timeSinceLastAnalysis) / 60000);
          return NextResponse.json(
            { 
              error: `分析冷却中，请 ${remainingMinutes} 分钟后再试`,
              cooldownRemaining: remainingMinutes,
            },
            { status: 429 }
          );
        }
      }
    }
    
    // 聚合用户数据
    const userData = await aggregateUserData(userId);
    
    // 检查数据是否足够
    if (!isDataSufficientForAnalysis(userData)) {
      return NextResponse.json(
        { 
          error: '数据不足，无法进行分析',
          status: 'collecting_data',
          hasBaseline: userData.baseline !== null,
          calibrationCount: userData.calibrations.length,
          requiredCalibrations: 3,
        },
        { status: 400 }
      );
    }
    
    // 执行 AI 分析
    const analysisResult = await analyzeWithLLM(userData);
    
    // 生成仪表盘数据
    const dashboardData = generateDashboardData(analysisResult, userData);
    
    // 存储分析结果
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('digital_twin_analyses')
      .insert({
        user_id: userId,
        input_snapshot: userData,
        physiological_assessment: analysisResult.assessment,
        longitudinal_predictions: analysisResult.predictions,
        adaptive_plan: analysisResult.adaptivePlan,
        papers_used: [],
        dashboard_data: dashboardData,
        model_used: analysisResult.modelUsed,
        confidence_score: analysisResult.confidenceScore,
        analysis_version: 1,
        expires_at: new Date(Date.now() + ANALYSIS_COOLDOWN_MS).toISOString(),
      })
      .select('id')
      .single();
    
    if (saveError) {
      console.error('❌ 保存分析结果失败:', saveError);
      // 即使保存失败，也返回分析结果
    }
    
    // 存储历史记录
    if (savedAnalysis) {
      await supabase.from('analysis_history').insert({
        user_id: userId,
        analysis_id: savedAnalysis.id,
        anxiety_score: analysisResult.assessment.anxietyLevel.score,
        sleep_quality: analysisResult.assessment.sleepHealth.score,
        stress_resilience: analysisResult.assessment.stressResilience.score,
        mood_stability: analysisResult.assessment.moodStability.score,
        energy_level: analysisResult.assessment.energyLevel.score,
        hrv_estimate: analysisResult.assessment.hrvEstimate.score,
        overall_status: analysisResult.assessment.overallStatus,
        confidence_score: analysisResult.confidenceScore,
      });
    }
    
    // 构建响应（不包含敏感信息）
    const response: AnalyzeResponse = {
      success: true,
      analysisId: savedAnalysis?.id || 'temp-' + Date.now(),
      dashboardData,
      adaptivePlan: analysisResult.adaptivePlan,
      lastAnalyzed: analysisResult.analysisTimestamp,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ 分析 API 错误:', error);
    return NextResponse.json(
      { error: '分析过程中出现问题，请稍后再试' },
      { status: 500 }
    );
  }
}
