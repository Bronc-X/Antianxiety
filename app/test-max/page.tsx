'use client';

/**
 * Max Logic Engine Test Page
 * 测试所有 Max 相关功能和 UI 组件
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BayesianAnimation } from '@/components/max/BayesianAnimation';
import MaxSettings from '@/components/max/MaxSettings';
import { ReframingRitual } from '@/components/max/ReframingRitual';

type TestSection = 'settings' | 'bayesian' | 'ritual' | 'api';

export default function TestMaxPage() {
  const [activeSection, setActiveSection] = useState<TestSection>('settings');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Test API endpoints
  const testSettingsAPI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/max/settings');
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
    setIsLoading(false);
  };

  const testBeliefAPI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/max/belief');
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
    setIsLoading(false);
  };

  const testResponseAPI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/max/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'slider_change',
          sliderType: 'honesty',
          value: 75
        })
      });
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1C1C1C]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-serif text-[#E8DFD0]">Max Logic Engine 测试</h1>
          <p className="text-gray-400 text-sm mt-1">测试所有 Max 相关功能和 UI 组件</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="sticky top-[73px] z-40 bg-[#1C1C1C] border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {[
              { id: 'settings', label: '⚙️ Max Settings', desc: '滑块 + 模式选择' },
              { id: 'bayesian', label: '📊 Bayesian Animation', desc: '公式动画' },
              { id: 'ritual', label: '🧘 Reframing Ritual', desc: '重构仪式' },
              { id: 'api', label: '🔌 API Tests', desc: '接口测试' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as TestSection)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  activeSection === tab.id
                    ? 'bg-[#0B3D2E] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Max Settings Section */}
        {activeSection === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#2C2C2C] rounded-2xl p-6">
              <h2 className="text-xl font-medium text-[#C4A77D] mb-4">Max Settings 组件</h2>
              <p className="text-gray-400 text-sm mb-6">
                工业/科幻风格的滑块，调整 Max 的诚实度和幽默感。
                滑块变化时会触发 Max 的实时反馈。
              </p>
              <MaxSettings />
            </div>

            <div className="bg-[#2C2C2C] rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-3">功能说明</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• <span className="text-[#9CAF88]">诚实度滑块</span>: 0-100，控制 Max 的直接程度</li>
                <li>• <span className="text-[#9CAF88]">幽默感滑块</span>: 0-100，100 时触发特殊彩蛋</li>
                <li>• <span className="text-[#9CAF88]">模式选择</span>: default / TARS (简洁模式)</li>
                <li>• <span className="text-[#9CAF88]">实时反馈</span>: 滑块变化时 Max 会给出评论</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Bayesian Animation Section */}
        {activeSection === 'bayesian' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <BayesianAnimationTest />
          </motion.div>
        )}

        {/* Reframing Ritual Section */}
        {activeSection === 'ritual' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#2C2C2C] rounded-2xl p-6">
              <h2 className="text-xl font-medium text-[#C4A77D] mb-4">Reframing Ritual 组件</h2>
              <p className="text-gray-400 text-sm mb-6">
                认知重构仪式，用于处理焦虑信念。包含 Prior 滑块、证据展示和 Max 响应。
              </p>
              <ReframingRitual
                onComplete={(result) => {
                  console.log('Ritual complete:', result);
                  alert(`仪式完成！\nPrior: ${result.prior}%\nPosterior: ${result.posterior}%`);
                }}
              />
            </div>
          </motion.div>
        )}

        {/* API Tests Section */}
        {activeSection === 'api' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#2C2C2C] rounded-2xl p-6">
              <h2 className="text-xl font-medium text-[#C4A77D] mb-4">API 端点测试</h2>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={testSettingsAPI}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#0B3D2E] rounded-lg text-sm hover:bg-[#0B3D2E]/80 disabled:opacity-50"
                >
                  GET /api/max/settings
                </button>
                <button
                  onClick={testBeliefAPI}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#0B3D2E] rounded-lg text-sm hover:bg-[#0B3D2E]/80 disabled:opacity-50"
                >
                  GET /api/max/belief
                </button>
                <button
                  onClick={testResponseAPI}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#0B3D2E] rounded-lg text-sm hover:bg-[#0B3D2E]/80 disabled:opacity-50"
                >
                  POST /api/max/response
                </button>
              </div>

              {isLoading && (
                <div className="text-center py-4">
                  <span className="text-gray-400">Loading...</span>
                </div>
              )}

              {apiResponse && (
                <pre className="bg-[#1C1C1C] rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-96">
                  {apiResponse}
                </pre>
              )}
            </div>

            <div className="bg-[#2C2C2C] rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-3">API 端点说明</h3>
              <ul className="space-y-3 text-sm">
                <li className="p-3 bg-[#1C1C1C] rounded-lg">
                  <code className="text-[#9CAF88]">GET /api/max/settings</code>
                  <p className="text-gray-400 mt-1">获取用户的 AI 设置（诚实度、幽默感、模式）</p>
                </li>
                <li className="p-3 bg-[#1C1C1C] rounded-lg">
                  <code className="text-[#9CAF88]">PATCH /api/max/settings</code>
                  <p className="text-gray-400 mt-1">更新用户的 AI 设置</p>
                </li>
                <li className="p-3 bg-[#1C1C1C] rounded-lg">
                  <code className="text-[#9CAF88]">GET /api/max/belief</code>
                  <p className="text-gray-400 mt-1">获取用户的信念历史记录</p>
                </li>
                <li className="p-3 bg-[#1C1C1C] rounded-lg">
                  <code className="text-[#9CAF88]">POST /api/max/belief</code>
                  <p className="text-gray-400 mt-1">创建新的信念会话</p>
                </li>
                <li className="p-3 bg-[#1C1C1C] rounded-lg">
                  <code className="text-[#9CAF88]">POST /api/max/response</code>
                  <p className="text-gray-400 mt-1">生成 Max 的响应（基于上下文和设置）</p>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Bayesian Animation Test Component
function BayesianAnimationTest() {
  const [key, setKey] = useState(0);
  const [prior, setPrior] = useState(75);
  const [posterior, setPosterior] = useState(32);
  const [duration, setDuration] = useState(3000);

  return (
    <>
      <div className="bg-[#2C2C2C] rounded-2xl p-6">
        <h2 className="text-xl font-medium text-[#C4A77D] mb-4">Bayesian Animation 组件</h2>
        <p className="text-gray-400 text-sm mb-6">
          贝叶斯公式动画，展示从 Prior 到 Posterior 的计算过程。
        </p>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Prior (初始信念): {prior}%</label>
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
            <label className="text-sm text-gray-400 block mb-2">Posterior (后验概率): {posterior}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={posterior}
              onChange={(e) => setPosterior(Number(e.target.value))}
              className="w-full h-2 bg-[#3C3C3C] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">动画时长: {duration}ms</label>
            <input
              type="range"
              min="1000"
              max="5000"
              step="500"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-[#3C3C3C] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setKey((k) => k + 1)}
            className="w-full py-3 bg-[#0B3D2E] text-white rounded-lg font-medium hover:bg-[#0B3D2E]/80 transition-colors"
          >
            🔄 重新播放动画
          </button>
        </div>

        {/* Animation */}
        <div className="bg-[#1C1C1C] rounded-xl p-4">
          <BayesianAnimation
            key={key}
            prior={prior}
            likelihood={0.3}
            evidence={0.7}
            posterior={posterior}
            duration={duration}
          />
        </div>
      </div>

      <div className="bg-[#2C2C2C] rounded-2xl p-6">
        <h3 className="text-lg font-medium text-white mb-3">动画阶段说明</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• <span className="text-[#C4A77D]">Phase 1 - Formula</span>: 显示贝叶斯公式，高亮 Prior</li>
          <li>• <span className="text-[#9CAF88]">Phase 2 - Calculate</span>: 注入证据，高亮 Likelihood 和 Evidence</li>
          <li>• <span className="text-[#9CAF88]">Phase 3 - Countdown</span>: 数字从 Prior 滚动到 Posterior</li>
        </ul>
      </div>
    </>
  );
}
