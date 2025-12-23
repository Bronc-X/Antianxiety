'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Zap, Brain, Activity, Watch, Sun, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

/**
 * 升级页面（营销漏斗中的关键转化页）
 * 用户完成问卷后必经此页面，展示核心服务功能
 * 目标：让用户了解平台价值，引导进入主应用
 */
export default function UpgradePage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSkipping, setIsSkipping] = useState(false);
  const [returnPath, setReturnPath] = useState('/onboarding/profile');

  useEffect(() => {
    // 检查来源：如果有 from 参数或 returnTo 参数，使用它
    const from = searchParams.get('from');
    const returnTo = searchParams.get('returnTo');

    if (returnTo) {
      setReturnPath(returnTo);
    } else if (from === 'landing' || from === 'menu') {
      // 从landing页或菜单进入，返回landing
      setReturnPath('/landing');
    } else if (from === 'settings') {
      // 从设置页面进入，返回设置页面
      setReturnPath('/settings');
    }
    // 否则保持默认的 /onboarding/profile（onboarding流程）
  }, [searchParams]);

  const handleContinue = () => {
    setIsSkipping(true);
    console.log('✅ 用户继续，返回:', returnPath);
    router.push(returnPath);
  };

  const features = [
    {
      id: 'active_ai',
      icon: Zap,
      title: language === 'en' ? 'Active AI Care' : '主动式 AI 诊疗',
      desc: language === 'en'
        ? 'The world\'s most attentive health assistant. It doesn\'t wait for you to ask.'
        : '世界上最了解你的医疗助理。它不会等你开口，而是通过数据异常主动发起关怀。',
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: 'science',
      icon: Brain,
      title: language === 'en' ? 'Precision Science' : '精准科研情报',
      desc: language === 'en'
        ? 'Filters 99% of noise. Push only clinical research relevant to your symptoms.'
        : '为你过滤 99% 的噪音。只推送与你当前症状高度相关的科研论文。',
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: 'bayesian',
      icon: Activity,
      title: language === 'en' ? 'Bayesian Engine' : '贝叶斯推理引擎',
      desc: language === 'en'
        ? 'Not a vague search. Transforms fuzzy feelings into precise medical hypotheses.'
        : '不再是百度的模糊搜索。将模糊的身体感受转化为精准的医疗假设。',
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: 'calibration',
      icon: Sun,
      title: language === 'en' ? 'Daily Calibration' : '身心每日校准',
      desc: language === 'en'
        ? '1-minute rapid scan. Logs not just data, but faint signals.'
        : '1分钟快速扫描。记录的不只是数据，更是你身体的微弱信号。',
      color: "from-amber-500 to-orange-600",
    },
    {
      id: 'ecosystem',
      icon: Watch,
      title: language === 'en' ? 'Full Ecosystem' : '全生态设备支持',
      desc: language === 'en'
        ? 'Compatible with Apple Watch, Oura, Fitbit and more.'
        : '支持 Apple Watch、华为、小米、Fitbit 等主流设备。',
      color: "from-pink-500 to-rose-600",
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-white p-6 md:p-12 relative overflow-hidden">

      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37] rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#9CAF88] rounded-full filter blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* 主标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 backdrop-blur-sm border border-[#D4AF37]/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-[#D4AF37]">
              {language === 'en' ? 'Core Technology' : '核心功能'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight mb-4">
            {language === 'en' ? 'Smarter, Not Harder.' : '不是更努力，而是更聪明。'}
          </h1>

          <p className="text-lg text-[#1A1A1A]/70 dark:text-white/70 max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Discover how Antianxiety helps you understand and manage your health with precision.'
              : '了解 Antianxiety 如何帮助你精准理解和管理你的健康。'
            }
          </p>
        </motion.div>

        {/* 核心功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group overflow-hidden rounded-2xl p-8 bg-white/50 dark:bg-[#2C2C2C]/50 backdrop-blur-sm border border-[#1A1A1A]/10 dark:border-white/10 min-h-[280px] flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
            >
              {/* Hover 装饰 */}
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 scale-150 rotate-12 pointer-events-none">
                <feature.icon className="w-48 h-48 stroke-[1]" />
              </div>

              <div className="relative z-10">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-medium mb-4 tracking-tight group-hover:text-[#D4AF37] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed">
                  {feature.desc}
                </p>
              </div>

              <div className="w-full h-[1px] bg-[#1A1A1A]/10 dark:bg-white/10 mt-6 group-hover:bg-[#D4AF37]/50 transition-colors duration-500 origin-left scale-x-50 group-hover:scale-x-100" />

              {/* Arrow hint */}
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA 按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={handleContinue}
            disabled={isSkipping}
            className="px-8 py-4 bg-gradient-to-r from-[#0B3D2E] to-[#1a5c47] dark:from-[#9CAF88] dark:to-[#7a9268] text-white dark:text-[#1A1A1A] rounded-xl text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSkipping 
              ? (language === 'en' ? 'Loading...' : '加载中...') 
              : (language === 'en' ? 'Continue to Dashboard' : '进入控制台')
            }
          </button>

          <p className="mt-4 text-sm text-[#1A1A1A]/60 dark:text-white/60">
            {language === 'en' 
              ? 'Start your journey to better health'
              : '开始你的健康之旅'
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}
