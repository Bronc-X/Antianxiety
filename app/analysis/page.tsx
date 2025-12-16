import React from 'react';
import { requireAuth } from '@/lib/auth-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AnalysisClientView from './AnalysisClientView';
import ProfileIncompleteView from './ProfileIncompleteView';

/**
 * AI 代谢分析报告页面 (Server Component)
 * 展示用户的代谢指标雷达图、健康短板分析
 * 路径: /analysis
 * 
 * CRITICAL: 
 * 1. 首次进入检查用户是否完成个人设置（身高、体重、年龄）
 * 2. 未完成则显示引导页面，而不是直接重定向
 * 3. 已完成则显示新版分析报告
 */

export const dynamic = 'force-dynamic';

interface ProfileData {
  height?: number | null;
  weight?: number | null;
  age?: number | null;
  gender?: string | null;
}

export default async function AIAnalysisPage() {
  const { user } = await requireAuth();
  const supabase = await createServerSupabaseClient();

  // 检查用户是否完成了个人设置
  const [profileResult, plansResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('height, weight, age, gender, full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
  ]);

  const { data: profile, error } = profileResult;
  const plans = plansResult.data || [];

  // 如果查询出错，重定向到profile设置
  if (error) {
    console.error('获取用户profile失败:', error);
    redirect('/onboarding/profile');
  }

  // 检查必需字段
  const requiredFields = [
    { key: 'height', label: '身高' },
    { key: 'weight', label: '体重' }, 
    { key: 'age', label: '年龄' }
  ];

  const missingFields: string[] = [];
  const completedFields: string[] = [];

  requiredFields.forEach(field => {
    const value = profile?.[field.key as keyof ProfileData];
    if (!value) {
      missingFields.push(field.label);
    } else {
      completedFields.push(field.label);
    }
  });

  // 如果有缺失字段，显示引导页面而不是直接重定向
  if (missingFields.length > 0) {
    return <ProfileIncompleteView missingFields={missingFields} completedFields={completedFields} />;
  }

  // 已完成设置，显示分析报告
  return <AnalysisClientView profile={profile} plans={plans} />;
}
