'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import type { AIAssistantProfile } from '@/types/assistant';
import { MotionButton } from '@/components/motion/MotionButton';
import MaxFeatureIntroModal from './MaxFeatureIntroModal';

// 使用 Next.js dynamic 懒加载浮窗聊天组件，减少初始 bundle
const AIAssistantFloatingChat = dynamic(() => import('./AIAssistantFloatingChat'), {
  loading: () => (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-96 h-full sm:h-[600px] flex items-center justify-center bg-[#FAF6EF] sm:rounded-2xl shadow-2xl border border-[#E7E1D6]">
      <div className="text-[#0B3D2E]">Loading...</div>
    </div>
  ),
  ssr: false,
});

export default function AIAssistantFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const pathname = usePathname();
  const isWelcomePage = pathname === '/welcome';
  const isMarketingPage = ['/unlearn', '/beta'].some(p => pathname?.startsWith(p));
  const [profile, setProfile] = useState<AIAssistantProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Check if guide was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('max_guide_dismissed');
    if (!dismissed) {
      setShowGuide(true);
    }
  }, []);
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
        console.error('Auth check failed:', error);
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
        console.error('Failed to load profile:', error);
      }
    };

    if (isChatOpen) {
      loadProfile();
    }
  }, [isChatOpen, supabase]);

  // Check for mobile routes
  const isMobileRoute = pathname?.startsWith('/mobile');

  // 如果未登录且不在欢迎页，或者在营销页面，或者是移动端路由，不渲染按钮
  if (isMarketingPage || isMobileRoute || (!isAuthenticated && !isWelcomePage)) {
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
          onClick={() => {
            if (!isDragging) {
              if (isWelcomePage) {
                setIsIntroOpen(true);
              } else {
                setIsChatOpen(true);
              }
            }
          }}
          variant="primary"
          size="lg"
          className="flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-8 py-6 sm:px-10 sm:py-7 text-white shadow-lg min-h-[90px] sm:min-h-0 pointer-events-auto relative group/max"
          hapticFeedback={true}
        >
          <span className="text-2xl sm:text-3xl font-semibold">Max</span>

          {/* Max Intro Bubble - Shows on onboarding */}
          {/* Max Intro Bubble - Closable Guide */}
          <AnimatePresence>
            {!isDragging && showGuide && !isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-full right-0 mb-4 w-72 p-5 bg-[#0b3d2e] text-white rounded-2xl rounded-br-none shadow-[0_8px_30px_rgba(11,61,46,0.3)] pointer-events-auto cursor-default z-50 border border-emerald-400/20 backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Tail */}
                <div className="absolute right-0 bottom-[-8px] w-4 h-4 bg-[#0b3d2e] [clip-path:polygon(0_0,100%_0,100%_100%)]" />

                {/* Content */}
                <div className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGuide(false);
                      localStorage.setItem('max_guide_dismissed', 'true');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setShowGuide(false);
                        localStorage.setItem('max_guide_dismissed', 'true');
                      }
                    }}
                    className="absolute -top-1 -right-1 p-1 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </div>

                  <div className="flex gap-3 mb-2">
                    <span className="text-xl">👋</span>
                    <h4 className="font-bold text-base">Hi, I'm Max</h4>
                  </div>

                  <p className="text-sm leading-relaxed font-medium text-emerald-50/90">
                    I'm Max. I monitor your physiological signals in real-time, search global interventions, and dynamically optimize your wellness plan.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

      <MaxFeatureIntroModal
        isOpen={isIntroOpen}
        onClose={() => setIsIntroOpen(false)}
      />
    </>
  );
}
