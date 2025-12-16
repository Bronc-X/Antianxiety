'use client';

/**
 * Test Page for BayesianAnimation Component
 * Also tests React Grab integration - Alt+Click any component to open source
 */

import { useState } from 'react';
import { BayesianAnimation } from '@/components/max/BayesianAnimation';
import { motion } from 'framer-motion';

export default function TestBayesianPage() {
  const [key, setKey] = useState(0);
  const [prior, setPrior] = useState(75);
  const [posterior, setPosterior] = useState(32);

  const handleReplay = () => {
    setKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif text-[#E8DFD0]">
            贝叶斯动画测试
          </h1>
          <p className="text-gray-400 text-sm">
            测试 BayesianAnimation 组件 + React Grab 开发工具
          </p>
          <p className="text-xs text-[#9CAF88]">
            💡 按住 Alt 键点击任意组件，在 Kiro 中打开源文件
          </p>
        </div>

        {/* Controls */}
        <div className="bg-[#2C2C2C] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-medium text-[#C4A77D]">参数调整</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Prior (初始信念): {prior}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={prior}
                onChange={(e) => setPrior(Number(e.target.value))}
                className="w-full h-2 bg-[#3C3C3C] rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Posterior (后验概率): {posterior}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={posterior}
                onChange={(e) => setPosterior(Number(e.target.value))}
                className="w-full h-2 bg-[#3C3C3C] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReplay}
            className="w-full py-3 bg-[#0B3D2E] text-white rounded-lg font-medium"
          >
            🔄 重新播放动画
          </motion.button>
        </div>

        {/* Animation Display */}
        <div className="bg-[#2C2C2C] rounded-xl p-6">
          <h2 className="text-lg font-medium text-[#C4A77D] mb-4">动画预览</h2>
          
          <BayesianAnimation
            key={key}
            prior={prior}
            likelihood={0.3}
            evidence={0.7}
            posterior={posterior}
            duration={3000}
          />
        </div>

        {/* React Grab Test */}
        <div className="bg-[#2C2C2C] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-medium text-[#C4A77D]">React Grab 测试</h2>
          <p className="text-sm text-gray-400">
            按住 Alt 键，点击下面的按钮，应该会在 Kiro IDE 中打开源文件
          </p>
          
          <div className="flex gap-4">
            <TestButton label="测试按钮 1" />
            <TestButton label="测试按钮 2" />
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>BayesianAnimation: components/max/BayesianAnimation.tsx</p>
          <p>DevTools: components/DevTools.tsx</p>
          <p>This Page: app/test-bayesian/page.tsx</p>
        </div>
      </div>
    </div>
  );
}

function TestButton({ label }: { label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-4 py-2 bg-[#3C3C3C] rounded-lg text-sm text-gray-300 hover:bg-[#4C4C4C] transition-colors"
    >
      {label}
    </motion.button>
  );
}
