'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// 动态导入图表组件，减少初始 bundle 大小
export const HabitCompletionChart = dynamic(
  () => import('@/components/HabitCompletionChart'),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center text-[#0B3D2E]/60">
        加载图表中...
      </div>
    ),
    ssr: false,
  }
) as ComponentType<{ data: any[] }>;

export const BeliefScoreChart = dynamic(
  () => import('@/components/BeliefScoreChart'),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center text-[#0B3D2E]/60">
        加载图表中...
      </div>
    ),
    ssr: false,
  }
) as ComponentType<{ data: any[] }>;

export const XFeed = dynamic(
  () => import('@/components/XFeed'),
  {
    loading: () => (
      <div className="h-32 flex items-center justify-center text-[#0B3D2E]/60">
        加载中...
      </div>
    ),
    ssr: false,
  }
) as ComponentType;

