'use client';

/**
 * 测试页面 - 对比两个贝叶斯组件
 * 1. CognitiveScale (认知天平)
 * 2. BayesianAnimation (贝叶斯动画)
 */

import { useState } from 'react';
import { CognitiveScale } from '@/components/bayesian/CognitiveScale';
import { BayesianAnimation } from '@/components/max/BayesianAnimation';
import { motion } from 'framer-motion';
import { Evidence } from '@/lib/bayesian-evidence';

export default function TestScalePage() {
  const [key, setKey] = useState(0);
  const [prior, setPrior] = useState(75);
  const [posterior, setPosterior] = useState(32);

  // 模拟证据数据
  const mockEvidence: Evidence[] = [
    { type: 'bio', value: 'HRV=55ms', weight: 0.3 },
    { type: 'science', value: '研究支持', weight: 0.5, consensus: 0.85 },
    { type: 'action', value: '呼吸练习', weight: 0.2 },
  ];

  const handleReplay = () => {
    setKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-light text-[#E8DFD0]">
            贝叶斯组件对比测试
          </h1>
          <p className="text-white/40 text-sm">
            对比 CognitiveScale 和 BayesianAnimation 两个组件
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-medium text-[#C4A77D]">参数调整</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-white/40">Prior (恐惧): {prior}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={prior}
                onChange={(e) => setPrior(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
            
            <div>
              <label className="text-xs text-white/40">Posterior (真相): {posterior}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={posterior}
                onChange={(e) => setPosterior(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#9CAF88]"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReplay}
            className="w-full py-3 bg-[#0B3D2E] text-white rounded-xl font-medium text-sm"
          >
            🔄 重新播放动画
          </motion.button>
        </div>

        {/* Component 1: CognitiveScale */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">组件 1</span>
            <h2 className="text-lg font-light">CognitiveScale (认知天平)</h2>
          </div>
          <p className="text-white/40 text-xs">路径: components/bayesian/CognitiveScale.tsx</p>
          
          <div className="bg-white/5 rounded-2xl p-6">
            <CognitiveScale
              key={`scale-${key}`}
              priorScore={prior}
              posteriorScore={posterior}
              evidenceStack={mockEvidence}
              isAnimating={false}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-xs">VS</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Component 2: BayesianAnimation */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#9CAF88]/20 text-[#9CAF88] rounded-full text-xs">组件 2</span>
            <h2 className="text-lg font-light">BayesianAnimation (贝叶斯动画)</h2>
          </div>
          <p className="text-white/40 text-xs">路径: components/max/BayesianAnimation.tsx</p>
          
          <div className="bg-white/5 rounded-2xl p-6">
            <BayesianAnimation
              key={`anim-${key}`}
              prior={prior}
              likelihood={0.3}
              evidence={0.7}
              posterior={posterior}
              duration={10000}
              beliefContext="metabolic_crash"
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-white/30 space-y-1 pt-4">
          <p>访问: /test-scale</p>
          <p>点击"重新播放动画"查看 BayesianAnimation 的完整动画流程</p>
        </div>
      </div>
    </div>
  );
}
