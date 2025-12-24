'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Zap, Brain, Activity, Watch, Sun, ArrowRight, Check, Crown, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

/**
 * 升级页面（营销漏斗中的关键转化页）
 * 用户完成问卷后必经此页面，展示核心服务功能
 * 目标：让用户了解平台价值，引导开通会员
 */
export default function UpgradePage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSkipping, setIsSkipping] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [returnPath, setReturnPath] = useState('/onboarding/profile');

  useEffect(() => {
    const from = searchParams.get('from');
    const returnTo = searchParams.get('returnTo');

    if (returnTo) {
      setReturnPath(returnTo);
    } else if (from === 'landing' || from === 'menu') {
      setReturnPath('/landing');
    } else if (from === 'settings') {
      setReturnPath('/settings');
    }
  }, [searchParams]);

  const handleSubscribe = (plan: string) => {
    console.log('✅ 用户选择订阅:', plan);
    // TODO: 接入支付系统
    alert(language === 'en' ? `Subscribing to ${plan} plan...` : `正在开通${plan === 'pro' ? '专业版' : '企业版'}...`);
  };

  const handleSkip = () => {
    setIsSkipping(true);
    console.log('✅ 用户跳过升级，返回:', returnPath);
    router.push(returnPath);
  };

  const features = [
    {
      id: 'active_ai',
      icon: Zap,
      title: language === 'en' ? 'Active AI Care' : '主动式 AI 诊疗',
      desc: language === 'en'
        ? 'The world\'s most attentive health assistant. It doesn\'t wait for you to ask—it proactively reaches out when it detects data anomalies.'
        : '世界上最了解你的医疗助理。它不会等你开口，而是通过数据异常主动发起关怀，像私人医生一样敏锐。',
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: 'science',
      icon: Brain,
      title: language === 'en' ? 'Precision Science' : '精准科研情报',
      desc: language === 'en'
        ? 'Filters 99% of noise. Based on your health profile, pushes only clinical research and guidelines relevant to your symptoms.'
        : '为你过滤 99% 的噪音。基于你的健康画像，只推送与你当前症状高度相关的科研论文与临床指南。',
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: 'bayesian',
      icon: Activity,
      title: language === 'en' ? 'Bayesian Engine' : '贝叶斯推理引擎',
      desc: language === 'en'
        ? 'Not a vague search. Uses Bayesian probability to transform fuzzy feelings into precise medical hypotheses.'
        : '不再是百度的模糊搜索。基于贝叶斯概率模型，将模糊的身体感受转化为精准的医疗假设。',
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: 'calibration',
      icon: Sun,
      title: language === 'en' ? 'Daily Calibration' : '身心每日校准',
      desc: language === 'en'
        ? '1-minute rapid scan. Logs not just data, but faint signals to build your personal bio-model.'
        : '1分钟快速扫描追踪。记录的不只是数据，更是你身体的微弱信号，建立你的个人生物模型。',
      color: "from-amber-500 to-orange-600",
    },
    {
      id: 'ecosystem',
      icon: Watch,
      title: language === 'en' ? 'Full Ecosystem' : '全生态设备支持',
      desc: language === 'en'
        ? 'No need to buy new hardware. Compatible with Apple Watch, Huawei, Xiaomi, Fitbit and more.'
        : '不需要为了使用软件买新手表。支持 Apple Watch、华为、小米、Fitbit 等主流设备。',
      color: "from-pink-500 to-rose-600",
    },
  ];

  const plans = [
    {
      id: 'free',
      name: language === 'en' ? 'Free' : '免费版',
      price: '¥0',
      priceEn: '$0',
      period: language === 'en' ? '/forever' : '/永久',
      desc: language === 'en' ? 'Get started with basics' : '体验核心功能',
      features: [
        language === 'en' ? 'Clinical assessment (GAD-7, PHQ-9, ISI)' : '临床量表评估 (GAD-7, PHQ-9, ISI)',
        language === 'en' ? 'Basic health insights' : '基础健康洞察',
        language === 'en' ? 'Community support' : '社区支持',
      ],
      cta: language === 'en' ? 'Current Plan' : '当前方案',
      popular: false,
      color: 'border-gray-200 dark:border-gray-700',
    },
    {
      id: 'pro',
      name: language === 'en' ? 'Pro' : '专业版',
      price: '¥29',
      priceEn: '$4.99',
      period: language === 'en' ? '/month' : '/月',
      desc: language === 'en' ? 'Unlock all 5 core features' : '解锁全部5项核心功能',
      features: [
        language === 'en' ? '✦ Active AI Care - proactive health alerts' : '✦ 主动式 AI 诊疗 - 数据异常主动关怀',
        language === 'en' ? '✦ Precision Science - personalized research' : '✦ 精准科研情报 - 个性化论文推送',
        language === 'en' ? '✦ Bayesian Engine - precise diagnostics' : '✦ 贝叶斯推理引擎 - 精准医疗假设',
        language === 'en' ? '✦ Daily Calibration - 1-min scan' : '✦ 身心每日校准 - 1分钟快速扫描',
        language === 'en' ? '✦ Full Ecosystem - all devices' : '✦ 全生态设备支持 - 主流设备同步',
        language === 'en' ? '✦ Priority Max AI support' : '✦ Max AI 优先响应',
      ],
      cta: language === 'en' ? 'Upgrade to Pro' : '升级专业版',
      popular: true,
      color: 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20',
    },
    {
      id: 'enterprise',
      name: language === 'en' ? 'Enterprise' : '企业版',
      price: language === 'en' ? 'Custom' : '定制',
      priceEn: 'Custom',
      period: '',
      desc: language === 'en' ? 'For teams and organizations' : '企业/团队定制',
      features: [
        language === 'en' ? 'Everything in Pro' : '包含专业版所有功能',
        language === 'en' ? 'Team health dashboard' : '团队健康仪表盘',
        language === 'en' ? 'API access' : 'API 接入',
        language === 'en' ? 'Dedicated account manager' : '专属客户经理',
        language === 'en' ? 'Custom integrations' : '定制集成方案',
      ],
      cta: language === 'en' ? 'Contact Sales' : '联系销售',
      popular: false,
      color: 'border-gray-200 dark:border-gray-700',
    },
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
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 backdrop-blur-sm border border-[#D4AF37]/20 rounded-full mb-6">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-[#D4AF37]">
              {language === 'en' ? 'Unlock Full Potential' : '解锁全部潜能'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight mb-4">
            {language === 'en' ? 'Choose Your Plan' : '选择适合你的方案'}
          </h1>

          <p className="text-lg text-[#1A1A1A]/70 dark:text-white/70 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Start free, upgrade when you\'re ready for more.'
              : '免费开始，随时升级获取更多功能。'
            }
          </p>
        </motion.div>

        {/* 功能亮点 - 展开式布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 bg-white/60 dark:bg-[#2C2C2C]/60 backdrop-blur-sm rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 hover:shadow-lg transition-all ${idx === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 💰 会员定价卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative p-6 rounded-2xl bg-white dark:bg-[#2C2C2C] border-2 ${plan.color} transition-shadow duration-300 hover:shadow-xl flex flex-col h-full`}
              style={plan.popular ? { boxShadow: '0 0 40px rgba(212, 175, 55, 0.4)' } : {}}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white text-xs font-bold rounded-full shadow-lg">
                  {language === 'en' ? '🔥 MOST POPULAR' : '🔥 最受欢迎'}
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{language === 'en' ? plan.priceEn : plan.price}</span>
                  <span className="text-sm text-[#1A1A1A]/60 dark:text-white/60">{plan.period}</span>
                </div>
                <p className="text-sm text-[#1A1A1A]/60 dark:text-white/60 mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-3 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.id === 'free' ? handleSkip() : handleSubscribe(plan.id)}
                disabled={isSkipping}
                className={`w-full py-3 rounded-xl font-semibold transition-all mt-6 ${plan.popular
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white hover:shadow-lg hover:scale-105'
                  : plan.id === 'free'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-[#0B3D2E] text-white hover:bg-[#0a3427]'
                  } disabled:opacity-50`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* 信任标识 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-6 text-sm text-[#1A1A1A]/50 dark:text-white/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>{language === 'en' ? 'SSL Encrypted' : 'SSL 加密'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{language === 'en' ? 'Cancel Anytime' : '随时取消'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{language === 'en' ? '7-Day Trial' : '7天免费试用'}</span>
            </div>
          </div>
        </motion.div>

        {/* 跳过继续 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="text-sm text-[#1A1A1A]/50 dark:text-white/50 hover:text-[#1A1A1A] dark:hover:text-white underline transition-colors disabled:opacity-50"
          >
            {isSkipping
              ? (language === 'en' ? 'Loading...' : '加载中...')
              : (language === 'en' ? 'Continue with Free Plan →' : '继续使用免费版 →')
            }
          </button>
        </motion.div>
      </div>
    </div>
  );
}

