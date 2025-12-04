'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generatePlanName, type PersonalizedPlanName } from '@/lib/plan-naming';
import { Save } from 'lucide-react';

interface Plan {
  title: string;
  content: string;
  difficulty?: string;
  duration?: string;
}

interface AIPlanCardProps {
  plans: Plan[];
  onConfirm: (selectedPlan: Plan) => void;
  onConfirmWithModification?: (currentPlan: Plan, modification: string) => void; // 新增：带修改意见的确认
  isReviewMode?: boolean; // 新增：是否为审核模式（修改后的方案）
  userContext?: {
    primaryConcern?: string;
    metabolicType?: string;
    targetOutcome?: string;
    aiPersonality?: 'cute_pet' | 'mayo_doctor' | 'gentle_thea' | 'science_phd' | 'default';
  };
}

// 阶段类型
type Stage = 'select' | 'review';

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

export default function AIPlanCard({ 
  plans, 
  onConfirm, 
  onConfirmWithModification,
  isReviewMode = false,
  userContext 
}: AIPlanCardProps) {
  // 如果只有一个方案，自动进入审核模式
  const autoReviewMode = plans.length === 1;
  const effectiveReviewMode = isReviewMode || autoReviewMode;
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(autoReviewMode ? 0 : null);
  const [stage, setStage] = useState<Stage>(effectiveReviewMode ? 'review' : 'select');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
    effectiveReviewMode ? plans[0] : null
  );
  const [modificationInput, setModificationInput] = useState(''); // 修改意见输入
  const [isProcessing, setIsProcessing] = useState(false); // 处理中状态

  // 为每个方案生成个性化名称
  const personalizedNames = useMemo<PersonalizedPlanName[]>(() => {
    return plans.map((plan, index) => {
      const concern = userContext?.primaryConcern || extractConcernFromContent(plan.content + plan.title);
      return generatePlanName({
        primaryConcern: concern,
        metabolicType: userContext?.metabolicType,
        targetOutcome: userContext?.targetOutcome,
        difficulty: plan.difficulty,
        duration: plan.duration,
        planIndex: index,
        aiPersonality: userContext?.aiPersonality,
      });
    });
  }, [plans, userContext]);

  // 进入审核阶段
  const handleNextStep = () => {
    if (selectedIndex === null) {
      alert('请先选择一个方案');
      return;
    }
    setSelectedPlan(plans[selectedIndex]);
    setStage('review');
  };

  // 最终确认保存（可能带修改意见）
  const handleFinalConfirm = () => {
    if (!selectedPlan) return;
    
    // 如果有修改意见，调用带修改的确认
    if (modificationInput.trim() && onConfirmWithModification) {
      console.log('🔘 用户确认保存（带修改意见）');
      console.log('📝 修改意见:', modificationInput);
      setIsProcessing(true);
      onConfirmWithModification(selectedPlan, modificationInput.trim());
    } else {
      // 没有修改意见，直接保存
      console.log('🔘 用户最终确认保存');
      console.log('✅ 最终方案:', selectedPlan);
      onConfirm(selectedPlan);
    }
  };

  // 如果是审核模式（修改后的方案），直接显示审核界面
  if (isReviewMode && plans.length === 1) {
    const plan = plans[0];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 space-y-3"
      >
        <div className="bg-[#F5F2ED] rounded-lg p-4 border border-[#E7E1D6]">
          <h3 className="font-semibold text-[#0B3D2E] mb-3">📋 修改后的方案</h3>
          
          <div className="space-y-2">
            <div>
              <span className="text-xs text-[#0B3D2E]/60">方案名称</span>
              <p className="font-medium text-[#0B3D2E]">{plan.title}</p>
            </div>
            <div>
              <span className="text-xs text-[#0B3D2E]/60">方案内容</span>
              <p className="text-sm text-[#0B3D2E]/80 whitespace-pre-wrap">{plan.content}</p>
            </div>
            {plan.difficulty && (
              <div>
                <span className="text-xs text-[#0B3D2E]/60">难度</span>
                <p className="text-sm text-[#0B3D2E]/80">{plan.difficulty}</p>
              </div>
            )}
            {plan.duration && (
              <div>
                <span className="text-xs text-[#0B3D2E]/60">预期时长</span>
                <p className="text-sm text-[#0B3D2E]/80">{plan.duration}</p>
              </div>
            )}
          </div>
          
          {/* 修改意见输入区 */}
          <div className="mt-4 pt-4 border-t border-[#E7E1D6]">
            <p className="text-xs text-[#0B3D2E]/60 mb-2">
              如需继续修改，请在下方输入（可选）
            </p>
            <textarea
              value={modificationInput}
              onChange={(e) => setModificationInput(e.target.value)}
              placeholder="例如：把时间改成晚上9点、增加一个热身环节..."
              className="w-full px-3 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:outline-none text-sm resize-none bg-white text-[#0B3D2E] placeholder:text-[#0B3D2E]/40"
              rows={2}
              disabled={isProcessing}
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (modificationInput.trim() && onConfirmWithModification) {
              setIsProcessing(true);
              onConfirmWithModification(plan, modificationInput.trim());
            } else {
              onConfirm(plan);
            }
          }}
          disabled={isProcessing}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <Save className="w-4 h-4" />
          {isProcessing ? '正在保存...' : '保存方案'}
        </button>
      </motion.div>
    );
  }

  // 阶段1: 选择方案
  if (stage === 'select') {
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

        {/* 下一步按钮 */}
        <div className="pt-2">
          <button
            onClick={handleNextStep}
            disabled={selectedIndex === null}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {selectedIndex === null ? '请选择一个方案' : '下一步'}
          </button>
        </div>
      </motion.div>
    );
  }

  // 阶段2: 审核确认
  if (stage === 'review' && selectedPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 space-y-3"
      >
        <div className="bg-[#F5F2ED] rounded-lg p-4 border border-[#E7E1D6]">
          <h3 className="font-semibold text-[#0B3D2E] mb-3">📋 确认您的方案</h3>
          
          <div className="space-y-2">
            <div>
              <span className="text-xs text-[#0B3D2E]/60">方案名称</span>
              <p className="font-medium text-[#0B3D2E]">{selectedPlan.title}</p>
            </div>
            <div>
              <span className="text-xs text-[#0B3D2E]/60">方案内容</span>
              <p className="text-sm text-[#0B3D2E]/80 whitespace-pre-wrap">{selectedPlan.content}</p>
            </div>
            {selectedPlan.difficulty && (
              <div>
                <span className="text-xs text-[#0B3D2E]/60">难度</span>
                <p className="text-sm text-[#0B3D2E]/80">{selectedPlan.difficulty}</p>
              </div>
            )}
            {selectedPlan.duration && (
              <div>
                <span className="text-xs text-[#0B3D2E]/60">预期时长</span>
                <p className="text-sm text-[#0B3D2E]/80">{selectedPlan.duration}</p>
              </div>
            )}
          </div>
          
          {/* 修改意见输入区 */}
          <div className="mt-4 pt-4 border-t border-[#E7E1D6]">
            <p className="text-xs text-[#0B3D2E]/60 mb-2">
              如需修改，请在下方输入修改意见（可选）
            </p>
            <textarea
              value={modificationInput}
              onChange={(e) => setModificationInput(e.target.value)}
              placeholder="我写完了补充内容，就可以直接保存了"
              className="w-full px-3 py-2 rounded-lg border border-[#E7E1D6] focus:border-[#0B3D2E] focus:outline-none text-sm resize-none bg-white text-[#0B3D2E] placeholder:text-[#0B3D2E]/40"
              rows={2}
              disabled={isProcessing}
            />
          </div>
        </div>

        <button
          onClick={handleFinalConfirm}
          disabled={isProcessing}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <Save className="w-4 h-4" />
          {isProcessing ? '正在保存...' : '保存方案'}
        </button>
      </motion.div>
    );
  }

  return null;
}
