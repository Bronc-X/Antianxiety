'use client';

/**
 * 测试页面 - ReframingRitual 完整版
 * 
 * 这是昨天的完整贝叶斯仪式组件
 */

import { useState } from 'react';
import { ReframingRitual } from '@/components/max/ReframingRitual';
import { motion } from 'framer-motion';
import { BeliefOutput } from '@/types/max';

export default function TestReframePage() {
  const [showRitual, setShowRitual] = useState(false);
  const [lastResult, setLastResult] = useState<BeliefOutput | null>(null);

  const handleComplete = (result: BeliefOutput) => {
    setLastResult(result);
    setShowRitual(false);
  };

  const handleCancel = () => {
    setShowRitual(false);
  };

  // 模拟 HRV 数据
  const mockHrvData = {
    rmssd: 52,
    sdnn: 48,
    lf_hf_ratio: 1.15,
    timestamp: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      {!showRitual ? (
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-screen">
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-light text-[#E8DFD0]">
              ReframingRitual 测试
            </h1>
            <p className="text-white/40 text-sm">
              这是昨天的完整版贝叶斯仪式组件
            </p>
            
            <div className="bg-white/5 rounded-2xl p-6 text-left space-y-3">
              <h3 className="text-[#C4A77D] text-sm font-medium">组件特性</h3>
              <ul className="text-white/60 text-sm space-y-2">
                <li>✅ Glassmorphism 玻璃态容器</li>
                <li>✅ 4 步流程：input → evidence → calculate → result</li>
                <li>✅ Max AI 响应集成（打字动画）</li>
                <li>✅ 恐惧输入滑块 + 文本描述</li>
                <li>✅ HRV 生理数据展示</li>
                <li>✅ 科学论文进度条</li>
                <li>✅ BayesianAnimation 贝叶斯动画</li>
                <li>✅ 结果确认提示</li>
              </ul>
            </div>

            {lastResult && (
              <div className="bg-[#9CAF88]/10 rounded-2xl p-4 border border-[#9CAF88]/20">
                <p className="text-[#9CAF88] text-sm">上次结果</p>
                <p className="text-white/60 text-xs mt-1">
                  Prior: {lastResult.prior}% → Posterior: {lastResult.posterior}%
                </p>
                <p className="text-white/40 text-xs">
                  降低了 {lastResult.prior - lastResult.posterior}%
                </p>
              </div>
            )}

            <motion.button
              onClick={() => setShowRitual(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#C4A77D] to-[#D4B78D] 
                text-[#1a1a2e] font-medium shadow-lg"
            >
              开始仪式
            </motion.button>

            <p className="text-white/30 text-xs">
              路径: components/max/ReframingRitual.tsx
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto py-8">
          <ReframingRitual
            onComplete={handleComplete}
            onCancel={handleCancel}
            hrvData={mockHrvData}
          />
        </div>
      )}
    </div>
  );
}
