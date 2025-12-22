'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import type { AIAssistantProfile } from '@/types/assistant';
import { MotionButton } from '@/components/motion/MotionButton';

// 使用 Next.js dynamic 懒加载浮窗聊天组件，减少初始 bundle
const AIAssistantFloatingChat = dynamic(() => import('./AIAssistantFloatingChat'), {
  loading: () => (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-96 h-full sm:h-[600px] flex items-center justify-center bg-[#FAF6EF] sm:rounded-2xl shadow-2xl border border-[#E7E1D6]">
      <div className="text-[#0B3D2E]">加载中...</div>
    </div>
  ),
  ssr: false,
});

export default function AIAssistantFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [profile, setProfile] = useState<AIAssistantProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();
  
  // 拖动位置状态
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 检查用户登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('检查登录状态失败:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 加载用户资料
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single<AIAssistantProfile>();

        if (!error && data) {
          setProfile(data);
        }
      } catch (error) {
        console.error('加载用户资料失败:', error);
      }
    };

    if (isChatOpen) {
      loadProfile();
    }
  }, [isChatOpen, supabase]);

  // 如果未登录，不渲染按钮
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* 拖动约束容器 */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
      
      {/* 移动端隐藏浮窗按钮，使用底部导航栏的 Max 入口 */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        style={{ x, y }}
        className="fixed bottom-6 right-6 z-50 cursor-move touch-none hidden md:block"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, type: 'spring' }}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
      >
        <MotionButton
          onClick={() => !isDragging && setIsChatOpen(true)}
          variant="primary"
          size="lg"
          className="flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-5 py-4 sm:px-6 sm:py-4 text-white shadow-lg min-h-[56px] sm:min-h-0 pointer-events-auto"
          hapticFeedback={true}
        >
          <span className="text-base sm:text-lg font-semibold">唤醒MAX</span>
        </MotionButton>
      </motion.div>

      <AnimatePresence>
        {isChatOpen && (
          <AIAssistantFloatingChat
            initialProfile={profile}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
