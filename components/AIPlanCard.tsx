'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generatePlanName, type PersonalizedPlanName } from '@/lib/plan-naming';

interface Plan {
  title: string;
  content: string;
  difficulty?: string;
  duration?: string;
}

interface AIPlanCardProps {
  plans: Plan[];
  onConfirm: (selectedPlan: Plan) => void;
  userContext?: {
    primaryConcern?: string;
    metabolicType?: string;
    targetOutcome?: string;
    aiPersonality?: 'cute_pet' | 'strict_coach' | 'gentle_friend' | 'science_nerd' | 'default';
  };
}

/**
 * 从方案内容中提取关注点关键词
 */
function extractConcernFromContent(content: string): string {
  const keywords: Record<string, string> = {
    '减重': 'weight_loss',
    '减脂': 'fat_loss',
    '燃脂': 'fat_loss',
    '瘦身': 'weight_loss',
    '压力': 'stress_management',
    '焦虑': 'stress_management',
    '放松': 'stress_management',
    '睡眠': 'sleep_improvement',
    '失眠': 'sleep_improvement',
    '安眠': 'sleep_improvement',
    '能量': 'energy_boost',
    '精力': 'energy_boost',
    '疲劳': 'energy_boost',
    '活力': 'energy_boost',
    '增肌': 'muscle_gain',
    '肌肉': 'muscle_gain',
    '力量': 'strength',
  };
  
  for (const [keyword, concern] of Object.entries(keywords)) {
    if (content.includes(keyword)) {
      return concern;
    }
  }
  
  return 'general';
}

export default function AIPlanCard({ plans, onConfirm, userContext }: AIPlanCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 为每个方案生成个性化名称（根据 AI 风格）
  const personalizedNames = useMemo<PersonalizedPlanName[]>(() => {
    return plans.map((plan, index) => {
      // 从方案内容中提取关注点
      const concern = userContext?.primaryConcern || extractConcernFromContent(plan.content + plan.title);
      
      return generatePlanName({
        primaryConcern: concern,
        metabolicType: userContext?.metabolicType,
        targetOutcome: userContext?.targetOutcome,
        difficulty: plan.difficulty,
        duration: plan.duration,
        planIndex: index,
        aiPersonality: userContext?.aiPersonality, // 传递 AI 风格
      });
    });
  }, [plans, userContext]);

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

          {/* 方案标题 - 使用个性化名称 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg mr-1">{personalizedNames[index]?.emoji}</span>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-[#0B3D2E]">
                {personalizedNames[index]?.title || plan.title}
              </span>
              {personalizedNames[index]?.subtitle && (
                <span className="text-xs text-[#0B3D2E]/60">
                  {personalizedNames[index].subtitle}
                </span>
              )}
            </div>
            {plan.difficulty && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-auto">
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
