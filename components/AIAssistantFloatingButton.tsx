'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import type { AIAssistantProfile } from '@/types/assistant';

// 使用 Next.js dynamic 懒加载浮窗聊天组件，减少初始 bundle
const AIAssistantFloatingChat = dynamic(() => import('./AIAssistantFloatingChat'), {
  loading: () => (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-96 h-full sm:h-[600px] flex items-center justify-center bg-white sm:rounded-2xl shadow-2xl">
      <div className="text-[#0B3D2E]/60">加载中...</div>
    </div>
  ),
  ssr: false,
});

export default function AIAssistantFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [profile, setProfile] = useState<AIAssistantProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClientSupabaseClient();

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
      <motion.div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.button
          onClick={() => setIsChatOpen(true)}
          className="flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-5 py-4 sm:px-6 sm:py-4 text-white shadow-lg active:shadow-xl sm:hover:shadow-xl transition-all touch-manipulation min-h-[56px] sm:min-h-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-base sm:text-lg font-semibold">AI 助理</span>
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap hidden sm:inline"
              >
                点击对话
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
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

