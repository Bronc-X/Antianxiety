'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Plan {
  title: string;
  content: string;
  difficulty?: string;
  duration?: string;
}

interface AIPlanCardProps {
  plans: Plan[];
  onConfirm: (selectedPlan: Plan) => void;
}

export default function AIPlanCard({ plans, onConfirm }: AIPlanCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleConfirm = () => {
    console.log('🔘 用户点击了确认按钮');
    console.log('📋 当前选中的索引:', selectedIndex);
    console.log('📦 所有方案:', plans);
    
    if (selectedIndex === null) {
      console.error('❌ 没有选中任何方案');
      alert('请先选择一个方案');
      return;
    }
    
    const selectedPlan = plans[selectedIndex];
    console.log('✅ 选中的方案:', selectedPlan);
    
    if (!selectedPlan) {
      console.error('❌ 选中的方案不存在');
      alert('方案数据错误，请重试');
      return;
    }
    
    try {
      console.log('📤 准备调用 onConfirm 回调...');
      onConfirm(selectedPlan);
      console.log('✅ onConfirm 调用完成');
    } catch (error) {
      console.error('❌ 调用 onConfirm 时出错:', error);
      alert('保存失败，请查看控制台');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-3"
    >
      {plans.map((plan, index) => (
        <button
          key={index}
          onClick={() => setSelectedIndex(index)}
          className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer text-left w-full ${
            selectedIndex === index
              ? 'border-[#0B3D2E] bg-[#0B3D2E]/5 shadow-md'
              : 'border-[#E7E1D6] bg-white hover:border-[#0B3D2E]/30'
          }`}
        >
          {/* 单选按钮 */}
          <div className="absolute top-3 right-3">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedIndex === index 
                ? 'border-[#0B3D2E] bg-[#0B3D2E]' 
                : 'border-gray-300 bg-white'
            }`}>
              {selectedIndex === index && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </div>

          {/* 方案标题 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-semibold text-[#0B3D2E]">
              {plan.title}
            </span>
            {plan.difficulty && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {plan.difficulty}
              </span>
            )}
          </div>

          {/* 方案内容 */}
          <div className="text-sm text-[#0B3D2E]/80 whitespace-pre-wrap leading-relaxed">
            {plan.content}
          </div>

          {/* 预期时长 */}
          {plan.duration && (
            <div className="mt-2 text-xs text-[#0B3D2E]/60">
              预期时长: {plan.duration}
            </div>
          )}
        </button>
      ))}

      {/* 确认按钮 */}
      <div className="pt-2">
        <button
          onClick={handleConfirm}
          disabled={selectedIndex === null}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {selectedIndex === null ? '请选择一个方案' : '确认计划'}
        </button>
      </div>
    </motion.div>
  );
}
