'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Sparkles, Users, Clock, CheckCircle, ArrowRight, Zap, Brain, Activity, Sliders, GraduationCap } from 'lucide-react';
import MaxAvatar from '@/components/max/MaxAvatar';
import MarketingNav from '@/components/MarketingNav';
import {
  UnlearnFeatures,
  UnlearnFooter,
  LogoTicker,
  ProblemSolution,
  AboutStory,
  MaxShowcase,
  TermPopover,
  Logo
} from '@/components/unlearn';

// Campaign config: Reset for demo (Starts near current time)
const CAMPAIGN_START = new Date('2026-01-04T04:00:00+08:00').getTime();
const CAMPAIGN_DURATION_MS = 60 * 60 * 60 * 1000; // 60 hours (was 48)

function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string } {
  if (ms <= 0) return { hours: '00', minutes: '00', seconds: '00' };

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0')
  };
}

/**
 * Early Access Marketing Page
 * Location: /unlearn/app
 * 
 * Features:
 * - 48-hour countdown timer
 * - Dynamic registration counter
 * - Email collection form
 * - No links to main app
 */
export default function EarlyAccessPage() {
  const { language } = useI18n();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [registrationCount, setRegistrationCount] = useState(33);
  const [remainingMs, setRemainingMs] = useState(CAMPAIGN_DURATION_MS);
  // Video check removed

  // Fetch initial count and update countdown
  useEffect(() => {
    // Deterministic "Random" Counter Logic
    // Rules: Random 1-10 min intervals, Max ~9 per hour (safe under 10)
    const calculateVirtualCount = () => {
      const now = Date.now();
      const elapsed = now - CAMPAIGN_START;
      if (elapsed < 0) return 0;

      const HOURS_MS = 3600000;
      const currentHourIndex = Math.floor(elapsed / HOURS_MS);
      const msInCurrentHour = elapsed % HOURS_MS;

      // Base: 33 + 9 per full hour
      const base = 33 + (currentHourIndex * 9);

      // Deterministic Random Offsets for current hour
      let seed = currentHourIndex * 49297 + 12345;
      const rnd = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      // Generate 9 random timestamps within the hour
      const timestamps = Array(9).fill(0).map(() => rnd() * HOURS_MS);
      // Sort them to simulate timeline
      timestamps.sort((a, b) => a - b);

      // Count how many we have passed in this hour
      const passedInHour = timestamps.filter(t => msInCurrentHour >= t).length;

      return base + passedInHour;
    };

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/early-access');
        if (res.ok) {
          const data = await res.json();
          // Use Virtual Simulation only (User requested start at 33, ignoring DB count of 613)
          setRegistrationCount(calculateVirtualCount());
          setRemainingMs(data.remainingMs);
        }
      } catch (e) {
        setRegistrationCount(calculateVirtualCount());
      }
    };

    fetchCount();

    // Update countdown & count every second
    const interval = setInterval(() => {
      const now = Date.now();
      const campaignEnd = CAMPAIGN_START + CAMPAIGN_DURATION_MS;
      const remaining = Math.max(0, campaignEnd - now);
      setRemainingMs(remaining);

      // Update count using deterministic logic
      setRegistrationCount(prev => Math.max(prev, calculateVirtualCount()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Re-sync disabled to maintain "Simulator Mode" (33 start)
  /*
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/early-access');
        if (res.ok) {
          const data = await res.json();
          setRegistrationCount(data.totalCount);
        }
      } catch (e) {
        // Ignore sync errors
      }
    }, 60000);

    return () => clearInterval(syncInterval);
  }, []);
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Basic validation
    if (!email) {
      setError(language === 'en' ? 'Email is required' : '请输入邮箱');
      setIsSubmitting(false);
      return;
    }

    if (!phone) {
      setError(language === 'en' ? 'Phone number is required' : '请输入手机号');
      setIsSubmitting(false);
      return;
    }

    if (!/^\d{11}$/.test(phone)) {
      setError(language === 'en' ? 'Please enter a valid 11-digit phone number' : '请输入有效的11位手机号');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });

      if (!res.ok) {
        throw new Error('Registration failed');
      }

      const data = await res.json();
      setRegistrationCount(data.totalCount);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(language === 'en' ? 'Something went wrong. Please try again.' : '出了点问题，请重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const countdown = formatCountdown(remainingMs);
  const isExpired = remainingMs <= 0;

  return (
    <div className="flex flex-col min-h-screen relative bg-[#F0FDF4] overflow-hidden font-serif">
      {/* Silk Flow Background Animation - Light Theme */}
      <style jsx global>{`
        @keyframes silk-flow-1 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          33% { transform: translate(-45%, -55%) rotate(5deg) scale(1.1); }
          66% { transform: translate(-55%, -45%) rotate(-5deg) scale(0.9); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
        }
        @keyframes silk-flow-2 {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.2); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 0.8; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>

      <div className="fixed inset-0 z-0 bg-[#F0FDF4] overflow-hidden pointer-events-none">
        {/* Base Gradient - Soft White/Green */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#F0F9FF]" />

        {/* Layer 1: Matcha Center - Bright Lime/Green */}
        <div
          className="absolute top-1/2 left-1/2 w-[160vw] h-[160vw] mix-blend-multiply blur-[80px] opacity-60"
          style={{
            background: 'radial-gradient(circle at center, #86efac 0%, #4ade80 30%, transparent 70%)',
            animation: 'silk-flow-1 25s infinite ease-in-out'
          }}
        />

        {/* Layer 2: Sky Blue Accent - Left Side Flow */}
        <div
          className="absolute top-[40%] -left-[20%] w-[140vw] h-[140vw] mix-blend-multiply blur-[90px] opacity-50"
          style={{
            background: 'radial-gradient(circle at center, #7dd3fc 0%, #bae6fd 40%, transparent 70%)',
            animation: 'silk-flow-2 30s infinite linear reverse'
          }}
        />

        {/* Layer 3: The Ripples/Rings - Light Theme subtle detail */}
        <div
          className="absolute top-1/2 left-1/2 w-[200vw] h-[200vw] mix-blend-overlay opacity-40 blur-[40px]"
          style={{
            background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 60px, rgba(22, 163, 74, 0.05) 60px, rgba(22, 163, 74, 0.1) 120px)',
            animation: 'silk-flow-1 40s infinite ease-in-out reverse',
            transformOrigin: 'center center'
          }}
        />

        {/* Layer 4: Top Highlight Shear - "Silk sheen" */}
        <div
          className="absolute inset-0 mix-blend-screen opacity-60"
          style={{
            background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'pulse-slow 10s infinite ease-in-out'
          }}
        />

        {/* Subtle Noise */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-multiply" />
      </div>

      {/* Fixed Navbar */}
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-3 md:px-8 md:py-4 flex justify-between items-center bg-white/60 backdrop-blur-3xl saturate-150 border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div>
          <Logo variant="dark" size="lg" className="shadow-none" />
        </div>
        <button
          onClick={() => document.getElementById('reservation-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="px-5 py-2 bg-[#0B3D2E] text-white rounded-full font-bold text-sm shadow-xl hover:bg-[#064e3b] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          {language === 'en' ? 'Reserve Spot' : '点击预约'}
        </button>
      </nav>

      <main className="flex-1 relative z-10">
        {/* Hero Section with Countdown */}
        <section className="pt-32 pb-20 px-6 relative">
          {/* Animated background - Removed old one */}
          <div className="absolute inset-0 overflow-hidden" />

          <div className="max-w-4xl mx-auto text-center relative z-10">


            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#0B3D2E] mb-8 font-serif italic tracking-tight drop-shadow-sm whitespace-nowrap"
            >
              {language === 'en' ? 'Unlearn Your Anxiety' : '拒绝内卷，科学「躺平」.'}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl md:text-2xl font-serif italic text-[#0B3D2E]/80 mb-12 w-full max-w-[1400px] mx-auto leading-relaxed px-4"
            >
              {language === 'en'
                ? 'A neuroscience-driven platform designed to deconstruct anxiety patterns through biological data and AI guidance.'
                : (
                  <div className="flex flex-col gap-4 md:gap-3 items-center text-center">
                    <div className="md:whitespace-nowrap">
                      融合
                      <TermPopover
                        term="计算神经科学"
                        title="计算神经科学 (Computational Neuroscience)"
                        description={
                          <>
                            <p><strong>别把身体看作简单的机械，它是复杂系统。</strong></p>
                            <p>传统算法只做加减法（如：消耗了500卡路里），而计算神经科学用数学模型模拟大脑与神经系统的动态交互。我们用它来计算你神经回路的“过热阈值”，在你的大脑还没意识到疲劳前，提前刹车。</p>
                          </>
                        }
                      />
                      、
                      <TermPopover
                        term="贝叶斯推断"
                        title="贝叶斯推断 (Bayesian Inference)"
                        description={
                          <>
                            <p><strong>昨天的你，决定了今天的最优解。</strong></p>
                            <p>人体是非线性的。贝叶斯算法拒绝死板的计划表，它将你过去的历史数据（先验概率）与当前的生理状态（新证据）实时融合。</p>
                            <p className="mt-2 text-xs opacity-80 bg-[#0B3D2E]/5 p-2 rounded-lg border border-[#0B3D2E]/10">
                              通俗讲：如果昨晚熬夜且 HRV 低，系统算出你今天“强行“自律会导致受伤的概率高达 80%，Max 就会强制把你的计划从“5KM有氧跑”修改为“轻度运动+深睡恢复”。
                            </p>
                          </>
                        }
                      />
                      和
                      <TermPopover
                        term="迷走神经信号"
                        title="迷走神经信号 (Vagal Signals)"
                        description={
                          <>
                            <p><strong>这是你身体自带的“急刹”。</strong></p>
                            <p>第10对脑神经（迷走神经）是连接大脑与内脏的高速公路，掌管着“休息与消化”模式。焦虑的生理本质，就是这套刹车系统失灵了。</p>
                            <p>Max 通过监测心率差异（需要连接穿戴设备）。当检测到刹车磨损时，我们不讲道理，直接让你停下来。</p>
                          </>
                        }
                      />
                      . 从根源
                      <TermPopover
                        term="量化「焦虑」"
                        title="量化「焦虑」 (Quantifying Anxiety)"
                        description={
                          <>
                            <p><strong>焦虑不是情绪，是数据。</strong></p>
                            <p>我们不会再让你被大脑的胡思乱想骗了。焦虑在生物学上只是交感神经过度激活的表现。</p>
                            <p>我们通过分析皮质醇节律、静息心率与睡眠结构，将这种模糊的“坏心情”，还原为精确的“生理负载指数”。既然是数据，就可以被管理，甚至被消除。</p>
                          </>
                        }
                      />
                      .
                    </div>
                    <div className="md:whitespace-nowrap">
                      你负责愉悦的情绪,
                      <TermPopover
                        term="Max"
                        title="Max"
                        description={
                          <>
                            <p><strong>全球首个 N-of-1 个人健康智能体。</strong></p>
                            <p>你负责感受生活（User Experience），Max 负责处理后台那些繁琐的医学检索、数据清洗与决策计算（Backend Processing）。</p>
                            <p>它是一个 24 小时运行在本地的生物数字孪生，阅尽全球论文，只为你一人的身体负责。</p>
                          </>
                        }
                      />
                      负责繁琐的系统.
                    </div>
                  </div>
                )}
            </motion.div>

            {/* Registration Counter */}
            {/* Status Bar: Counter & Countdown */}
            <div id="reservation-status" className="flex flex-nowrap items-center justify-center gap-2 md:gap-4 mb-10 w-full max-w-4xl mx-auto overflow-x-visible px-2 scroll-mt-24">
              {/* Registration Counter */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex shrink-0 items-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-full bg-white/40 border border-[#0B3D2E]/10 backdrop-blur-md shadow-sm"
              >
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#059669]" />
                <span className="text-[#0B3D2E] italic text-xs md:text-sm">
                  <span className="text-lg md:text-xl font-bold text-[#059669] mr-1">{registrationCount}</span>
                  {language === 'en' ? 'people reserved' : '人已预约'}
                </span>
              </motion.div>

              {/* Countdown Timer (Compact Pill) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                className="inline-flex shrink-0 items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-2.5 rounded-full bg-white/40 border border-[#0B3D2E]/10 backdrop-blur-md shadow-sm relative z-20"
              >
                <div className="flex items-center gap-1 md:gap-1.5 opacity-60">
                  <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#0B3D2E]" />
                  <span className="text-[10px] md:text-xs text-[#0B3D2E] font-medium hidden sm:inline-block">
                    {language === 'en' ? 'ENDS IN' : '距结束'}
                  </span>
                </div>

                {!isExpired ? (
                  <div className="flex items-center gap-1.5 md:gap-2">
                    {[
                      { value: countdown.hours, unit: 'h' },
                      { value: countdown.minutes, unit: 'm' },
                      { value: countdown.seconds, unit: 's' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-baseline gap-0.5">
                        <span className="text-base md:text-lg font-bold text-[#059669] font-serif italic font-feature-settings-tnum leading-none">
                          {item.value}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-[#0B3D2E]/40 font-sans">{item.unit}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[#059669] text-xs md:text-sm font-bold italic">
                    {language === 'en' ? 'Open!' : '已开放'}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Email Form */}
            <motion.div
              id="waitlist-form"
              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-md mx-auto"
            >
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="relative"
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex flex-col gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={language === 'en' ? 'Enter your email' : '输入您的邮箱'}
                        className="w-full px-6 py-4 rounded-xl bg-white/60 border border-[#0B3D2E]/10 text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all shadow-sm"
                        required
                        disabled={isSubmitting}
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={language === 'en' ? 'Enter your phone number' : '输入您的手机号'}
                        className="w-full px-6 py-4 rounded-xl bg-white/60 border border-[#0B3D2E]/10 text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all shadow-sm"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-8 py-4 bg-[#0B3D2E] hover:bg-[#064e3b] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {language === 'en' ? 'Join Waitlist' : '点击预约'}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      <p className="text-center text-[#0B3D2E]/40 text-xs mt-3">
                        {language === 'en'
                          ? 'Limited bandwidth during early access, capped at first 1000 users.'
                          : '项目初期带宽有限，仅限前1000名用户'}
                      </p>

                      {/* Embedded Intro Video */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 aspect-video bg-black relative group"
                      >
                        <video
                          src="/intro.mp4"
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      </motion.div>
                    </div>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-sm mt-3 font-medium"
                      >
                        {error}
                      </motion.p>
                    )}
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#0B3D2E]/5 border border-[#0B3D2E]/10 backdrop-blur-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#059669] flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B3D2E]">
                      {language === 'en' ? "You're on the list!" : '您已加入候补！'}
                    </h3>
                    <p className="text-[#0B3D2E]/70 text-center">
                      {language === 'en'
                        ? "We'll notify you when early access opens. Check your inbox!"
                        : '早期体验开放时我们会通知您，请查收邮件！'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>


            </motion.div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-20 px-6 bg-[#FAF6EF]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B3D2E]/10 text-[#0B3D2E] text-sm mb-4">
                <Zap className="w-4 h-4" />
                {language === 'en' ? 'Coming Soon' : '即将推出'}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B3D2E] font-serif">
                {language === 'en' ? 'What to Expect' : '功能预览'}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mx-auto max-w-6xl">
              {[
                {
                  icon: Brain,
                  title: language === 'en' ? 'Personal Health Agent (Max)' : '个人健康智能体 (Max)',
                  desc: language === 'en'
                    ? 'Your proactive private advisor. Evolving with your data to predict anxiety before it strikes.'
                    : '全天候待命的私人参谋。随着你的数据积累，它会自我进化，比你更早预判焦虑的来临。'
                },
                {
                  icon: Activity,
                  title: language === 'en' ? 'Bio-Data Panoramic Insights' : '生物数据全景洞察',
                  desc: language === 'en'
                    ? 'Visualize invisible anxiety. Integrating 90%+ wearables for a complete dashboard.'
                    : '让看不见的焦虑“数据化”。整合市面90%+可穿戴设备数据，为你构建可视化仪表盘。'
                },
                {
                  icon: Sliders,
                  title: language === 'en' ? 'Adaptive Intervention Plans' : '自适应干预计划',
                  desc: language === 'en'
                    ? 'Better than a coach. Automatically adjusting daily goals for the perfect balance of efficacy and health.'
                    : '比私教更懂你的身体。根据实时状态自动调整每日目标，在效能与健康之间找到完美的平衡点。'
                },
                {
                  icon: GraduationCap,
                  title: language === 'en' ? 'Vagus Nerve Masterclass' : '迷走神经-大师课',
                  desc: language === 'en'
                    ? 'Regain control in 15 mins/day. Practical courses from top neuroscientists.'
                    : '每日 15 分钟，找回掌控感。源自顶尖神经学家的实操课程，我们就教你拿回身体控制权。'
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-4 md:p-8 rounded-2xl overflow-hidden border border-[#0B3D2E]/5 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group h-full"
                >
                  {/* Dynamic Gradient Background (Puzzle Effect) */}
                  <div
                    className="absolute inset-0 z-0 opacity-100 transition-opacity duration-500"
                    style={{
                      background: i === 0 ? 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%)' :
                        i === 1 ? 'linear-gradient(225deg, #DCFCE7 0%, #F0FDF4 100%)' :
                          i === 2 ? 'linear-gradient(45deg, #DCFCE7 0%, #F0FDF4 100%)' :
                            'linear-gradient(315deg, #DCFCE7 0%, #F0FDF4 100%)'
                    }}
                  />

                  {/* Glass Shine */}
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-0 group-hover:bg-white/20 transition-colors duration-500" />

                  {/* Noise Texture */}
                  <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-multiply z-0 pointer-events-none" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center h-full">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/60 shadow-sm flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-[#059669]" strokeWidth={1.5} />
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-[#0B3D2E] mb-3 font-serif leading-tight">{feature.title}</h3>
                    <p className="text-[#0B3D2E]/70 leading-relaxed text-xs md:text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <ProblemSolution />
        <MaxShowcase />
        <AboutStory />
      </main>

      <UnlearnFooter
        className="bg-transparent border-t border-[#0B3D2E]/5 backdrop-blur-sm"
        theme="light"
        logoHref="#"
        socialLinks={{
          twitter: 'https://twitter.com/antianxiety',
          linkedin: 'https://linkedin.com/company/antianxiety',
          youtube: 'https://youtube.com/@antianxiety',
        }}
      />

    </div>
  );
}
