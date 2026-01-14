'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MatrixText from '@/components/motion/MatrixText';

interface AIThinkingLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onGeneratingStart?: () => void;
}

// 思考阶段定义 - 速度 0.6 倍（时长 / 0.6）
const THINKING_STAGES = [
  { id: 'context', label: '读取档案', duration: 1000 },
  { id: 'bio', label: '分析数据', duration: 1333 },
  { id: 'search', label: '搜索文献', duration: 2500 },
  { id: 'consensus', label: '计算共识', duration: 1333 },
];

export function AIThinkingLoader({ size = 'md', showProgress = true, onGeneratingStart }: AIThinkingLoaderProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressComplete, setProgressComplete] = useState(false);

  // 进度条完成后进入生成阶段
  useEffect(() => {
    if (currentStage >= THINKING_STAGES.length && !isGenerating) {
      const timer = setTimeout(() => {
        setProgressComplete(true);
        setIsGenerating(true);
        onGeneratingStart?.();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentStage, isGenerating, onGeneratingStart]);

  // 模拟进度推进
  useEffect(() => {
    if (progressComplete) return;

    let stageTimer: NodeJS.Timeout;

    const advanceStage = () => {
      if (currentStage < THINKING_STAGES.length) {
        setCurrentStage(prev => prev + 1);
        setStageProgress(0);
      }
    };

    // 进度条动画 - 速度 0.6 倍
    const progressTimer = setInterval(() => {
      setStageProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 12 + 5;
      });
    }, 250);

    // 阶段切换
    const stage = THINKING_STAGES[currentStage];
    if (stage) {
      stageTimer = setTimeout(advanceStage, stage.duration);
    }

    return () => {
      clearTimeout(stageTimer);
      clearInterval(progressTimer);
    };
  }, [currentStage, progressComplete]);

  // 调整后的尺寸 - 加长
  const sizeClasses = {
    sm: 'w-56',
    md: 'w-64',
    lg: 'w-72',
  };

  const currentStageData = THINKING_STAGES[currentStage];

  // 生成阶段：显示 AntiAnxiety 呼吸效果
  if (isGenerating) {
    return (
      <div className={`${sizeClasses[size]} mx-auto py-3`}>
        <AntiAnxietyBreathing />
      </div>
    );
  }

  // 进度条阶段 - 更高级的设计
  return (
    <div className={`${sizeClasses[size]} mx-auto py-3`}>
      <div className="flex flex-col items-center">
        {/* 当前阶段文字 */}
        <AnimatePresence mode="wait">
          {currentStageData && (
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-center mb-3"
            >
              <span className="text-xs font-medium text-white/90 tracking-wide">
                <MatrixText text={currentStageData.label} speed={40} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 进度条 - 更高级的胶囊形状 */}
        {showProgress && (
          <div className="w-full px-2">
            {/* 进度条容器 - 胶囊形状 */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
              {/* 进度填充 - 渐变 + 光泽 */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #2A9D8F 0%, #ffffff 100%)',
                }}
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentStage / THINKING_STAGES.length) * 100) + (stageProgress / THINKING_STAGES.length)}%`
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
              {/* 光泽效果 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
            </div>

            {/* 阶段指示点 - 更精致 */}
            <div className="flex justify-between mt-2 px-0.5">
              {THINKING_STAGES.map((stage, idx) => (
                <motion.div
                  key={stage.id}
                  className={`w-1 h-1 rounded-full transition-colors duration-500 ${idx < currentStage
                    ? 'bg-[#2A9D8F]'
                    : idx === currentStage
                      ? 'bg-white'
                      : 'bg-white/20'
                    }`}
                  animate={idx === currentStage ? {
                    scale: [1, 1.5, 1],
                  } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// AntiAnxiety 呼吸效果组件 - 带 logo
function AntiAnxietyBreathing() {
  return (
    <div className="flex flex-col items-center justify-center py-3">
      {/* Logo 圆点 + 文字呼吸动画 */}
      <motion.div
        className="flex items-center gap-2"
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Logo 圆点 - 翡翠绿 */}
        <motion.span
          className="w-2 h-2 rounded-full bg-emerald-500"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(16, 185, 129, 0)',
              '0 0 8px 2px rgba(16, 185, 129, 0.4)',
              '0 0 0 0 rgba(16, 185, 129, 0)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* 品牌文字 */}
        <span className="text-sm font-bold tracking-tight text-white/90">
          AntiAnxiety™
        </span>
      </motion.div>

      {/* 底部提示文字 */}
      <motion.p
        className="text-[10px] text-white/60 mt-2"
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        生成中...
      </motion.p>
    </div>
  );
}

export default AIThinkingLoader;
