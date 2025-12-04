'use client';

/**
 * Test UX Page
 * Verification page for Step 2: UI & Haptics components
 * 
 * Tests:
 * - MotionButton with tap animation and haptics
 * - BrainLoader Lottie animation
 * - Other motion components
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MotionButton } from '@/components/motion/MotionButton';
import { BrainLoader } from '@/components/lottie/BrainLoader';
import { LoadingAnimation } from '@/components/lottie/LoadingAnimation';
import { SuccessAnimation } from '@/components/lottie/SuccessAnimation';
import { EmptyStateAnimation } from '@/components/lottie/EmptyStateAnimation';
import { GlassCard } from '@/components/layout';
import { StaggerList } from '@/components/motion/StaggerList';
import { BreathingBackground } from '@/components/motion/BreathingBackground';
import { pageTransition } from '@/lib/animations';

export default function TestUXPage() {
  const [clickCount, setClickCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 解决 hydration 不匹配问题
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleButtonClick = () => {
    setClickCount(prev => prev + 1);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative">
      {/* Breathing Background */}
      <BreathingBackground />
      
      {/* 使用 motion.div 替代 PageTransition 避免嵌套 AnimatePresence */}
      <motion.div
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        transition={pageTransition.transition}
      >
        <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
          <h1 className="text-3xl font-bold text-primary mb-8">
            Step 2: UI & Haptics 测试页面
          </h1>

          {/* Section 1: MotionButton */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">1. MotionButton 组件</h2>
            <p className="text-muted-foreground mb-4">
              点击按钮测试 whileTap scale(0.95) 动画和触觉反馈（原生平台）
            </p>
            
            <div className="flex flex-wrap gap-4">
              <MotionButton 
                variant="default" 
                onClick={handleButtonClick}
              >
                Primary Button
              </MotionButton>
              
              <MotionButton 
                variant="secondary" 
                onClick={handleButtonClick}
              >
                Secondary
              </MotionButton>
              
              <MotionButton 
                variant="ghost" 
                onClick={handleButtonClick}
              >
                Ghost
              </MotionButton>
              
              <MotionButton 
                variant="outline" 
                onClick={handleButtonClick}
              >
                Outline
              </MotionButton>
              
              <MotionButton 
                variant="default" 
                size="lg"
                onClick={handleButtonClick}
              >
                Large Button
              </MotionButton>
              
              <MotionButton 
                variant="default" 
                size="sm"
                onClick={handleButtonClick}
              >
                Small
              </MotionButton>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              点击次数: <span className="font-bold text-primary">{clickCount}</span>
            </p>
          </GlassCard>

          {/* Section 2: BrainLoader */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. BrainLoader 组件</h2>
            <p className="text-muted-foreground mb-4">
              AI 思考状态的 Lottie 动画（用于 AI 处理时显示）
            </p>
            
            <div className="flex flex-wrap items-end gap-8">
              <div className="text-center">
                <BrainLoader />
                <p className="text-xs text-muted-foreground mt-2">Default (96px)</p>
              </div>
            </div>
          </GlassCard>

          {/* Section 3: Loading & Success Animations */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">3. Loading & Success 动画</h2>
            <p className="text-muted-foreground mb-4">
              加载和成功状态的 Lottie 动画
            </p>
            
            <div className="flex flex-wrap items-center gap-8">
              <div className="text-center">
                <LoadingAnimation size="md" />
                <p className="text-xs text-muted-foreground mt-2">Loading</p>
              </div>
              
              {showSuccess && (
                <div className="text-center">
                  <SuccessAnimation 
                    size="md" 
                    onComplete={() => setTimeout(() => setShowSuccess(false), 1000)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">Success!</p>
                </div>
              )}
              
              <MotionButton 
                variant="default"
                onClick={handleLoadingDemo}
                disabled={isLoading}
              >
                {isLoading ? '处理中...' : '触发 Loading → Success'}
              </MotionButton>
            </div>
          </GlassCard>

          {/* Section 4: Empty State Animations */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">4. Empty State 动画</h2>
            <p className="text-muted-foreground mb-4">
              空状态提示动画
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <EmptyStateAnimation type="no-data" size="sm" />
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <EmptyStateAnimation type="no-results" size="sm" />
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <EmptyStateAnimation type="offline" size="sm" />
              </div>
            </div>
          </GlassCard>

          {/* Section 5: StaggerList */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">5. StaggerList 动画</h2>
            <p className="text-muted-foreground mb-4">
              列表项依次入场动画 (stagger 50ms)
            </p>
            
            <StaggerList className="space-y-2">
              {['第一项', '第二项', '第三项', '第四项', '第五项'].map((item, index) => (
                <div 
                  key={index}
                  className="p-3 bg-primary/10 rounded-lg text-primary"
                >
                  {item} - 依次入场
                </div>
              ))}
            </StaggerList>
          </GlassCard>

          {/* Section 6: Platform Info */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">6. 平台信息</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">当前环境: </span>
                <span className="font-medium">
                  {mounted ? 'Browser (Web)' : '加载中...'}
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                注意: 触觉反馈仅在原生平台 (Android/iOS) 上生效，Web 端会静默跳过
              </p>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
