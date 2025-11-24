import React from 'react';
import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AnalysisClientView from './AnalysisClientView';

/**
 * AI 代谢分析报告页面 (Server Component)
 * 展示用户的代谢指标雷达图、健康短板分析
 * 路径: /analysis
 * 
 * CRITICAL: 
 * 1. 首次进入检查用户是否完成个人设置（身高、体重、年龄）
 * 2. 未完成则引导到 /onboarding/profile
 * 3. 已完成则显示新版分析报告
 */

export const dynamic = 'force-dynamic';

export default async function AIAnalysisPage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 检查用户是否完成了个人设置
  const { data: profile } = await supabase
    .from('profiles')
    .select('height, weight, age, gender')
    .eq('id', user.id)
    .single();

  // 如果未完成个人设置，引导到设置页面
  if (!profile || !profile.height || !profile.weight || !profile.age) {
    redirect('/onboarding/profile');
  }

  // 已完成设置，显示分析报告
  return <AnalysisClientView profile={profile} />;
}
