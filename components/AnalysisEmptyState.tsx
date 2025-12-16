'use client';

import { Lock, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

/**
 * Analysis Empty State Component
 * Displayed when user has no daily logs yet
 * Encourages user to complete daily check-ins
 */
export default function AnalysisEmptyState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Lock Icon */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-[#0B3D2E]/10 animate-pulse" />
          <div className="relative flex h-full items-center justify-center">
            <Lock className="h-12 w-12 text-[#0B3D2E]/60" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-semibold text-[#0B3D2E]">
          解锁您的代谢指纹分析
        </h2>

        {/* Description */}
        <p className="mb-8 text-[#0B3D2E]/70 leading-relaxed">
          完成<span className="font-semibold text-[#0B3D2E]">至少 1 天的健康打卡</span>，
          AI将为您生成专属的代谢雷达图和健康短板分析。
        </p>

        {/* Features */}
        <div className="mb-8 space-y-4">
          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E]/10">
              <TrendingUp className="h-4 w-4 text-[#0B3D2E]" />
            </div>
            <div>
              <p className="font-medium text-[#0B3D2E]">6维代谢雷达图</p>
              <p className="text-sm text-[#0B3D2E]/60">
                睡眠、压力、能量、运动、水分、整体健康
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E]/10">
              <Activity className="h-4 w-4 text-[#0B3D2E]" />
            </div>
            <div>
              <p className="font-medium text-[#0B3D2E]">AI健康短板分析</p>
              <p className="text-sm text-[#0B3D2E]/60">
                基于真实数据，找出影响健康的关键因素
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/assistant"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
        >
          <Activity className="h-5 w-5" />
          开始今日健康打卡
        </Link>

        {/* Data Integrity Note */}
        <p className="mt-6 text-xs text-[#0B3D2E]/50">
          🔒 我们坚持数据完整性原则，绝不使用虚假数据
        </p>
      </div>
    </div>
  );
}
