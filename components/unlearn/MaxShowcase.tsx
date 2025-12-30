'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/domain/useAuth';
import { Sparkles, MessageCircle, Brain, Heart, Star, ArrowRight, X } from 'lucide-react';

interface MaxShowcaseProps {
    onOpenChat?: () => void;
}

export default function MaxShowcase({ onOpenChat }: MaxShowcaseProps) {
    const { language } = useI18n();
    const router = useRouter();
    // Use Domain Hook
    const { isAuthenticated } = useAuth();

    const [activeFeature, setActiveFeature] = useState(0);

    const handleChatClick = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        onOpenChat?.();
    };

    const features = language === 'en' ? [
        {
            icon: Brain,
            title: 'Understands Your Patterns',
            description: 'Max learns your unique stress triggers and recovery patterns over time.',
        },
        {
            icon: Heart,
            title: 'Emotionally Intelligent',
            description: 'Unlike other AI, Max knows when to push and when to let you rest.',
        },
        {
            icon: Star,
            title: 'Evidence-Based Guidance',
            description: 'Every suggestion is backed by clinical research and your personal data.',
        },
    ] : [
        {
            icon: Brain,
            title: '理解你的模式',
            description: '随着时间推移，Max 会学习你独特的压力触发因素和恢复模式。',
        },
        {
            icon: Heart,
            title: '情感智能',
            description: '与其他人工智能不同，Max 知道何时该推动你，何时该让你休息。',
        },
        {
            icon: Star,
            title: '循证指导',
            description: '每一条建议都基于临床研究和你的个人数据。',
        },
    ];

    const conversations = language === 'en' ? [
        { role: 'user', text: "I'm feeling overwhelmed today..." },
        { role: 'max', text: "I noticed your HRV dropped 15% this morning. Let's take it easy. How about a 5-minute breathing exercise?" },
        { role: 'user', text: "That sounds good." },
        { role: 'max', text: "Great. I'll adjust your afternoon tasks. Remember, strategic rest is not weakness—it's wisdom." },
    ] : [
        { role: 'user', text: '我今天感觉压力很大...' },
        { role: 'max', text: '我注意到你今早的心率变异性下降了百分之十五。我们慢慢来。做个五分钟的呼吸练习怎么样？' },
        { role: 'user', text: '听起来不错。' },
        { role: 'max', text: '很好。我会调整你下午的任务。记住，战略性休息不是软弱——而是智慧。' },
    ];

    return (
        <section id="max" className="py-24 px-6 relative overflow-hidden scroll-mt-24" style={{ backgroundColor: '#0B3D2E' }}>
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#D4AF37]/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1200px] mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm text-[#D4AF37] font-medium tracking-wider uppercase">
                            {language === 'en' ? 'Meet Max' : '认识 Max'}
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-6">
                        {language === 'en' ? (
                            <>Your Personal Health Agent That <span className="italic text-[#D4AF37]">Actually Cares</span></>
                        ) : (
                            <>你的个人健康智能体，<span className="italic text-[#D4AF37]">真正关心你</span></>
                        )}
                    </h2>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto font-serif">
                        {language === 'en'
                            ? 'Max combines clinical expertise with emotional intelligence to guide you toward lasting calm.'
                            : 'Max 将临床专业知识与情感智能相结合，引导你走向持久的平静。'}
                    </p>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Chat Demo */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        <div className="p-6 bg-white rounded-lg shadow-xl">
                            {/* Chat Header */}
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                                <div className="w-12 h-12 bg-[#0B3D2E] rounded-full flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <h4 className="text-[#1A1A1A] font-semibold font-serif">Max</h4>
                                    <p className="text-[#1A1A1A]/60 text-sm">
                                        {language === 'en' ? 'Your Personal Health Agent' : '你的个人健康智能体'}
                                    </p>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-emerald-600 text-xs">{language === 'en' ? 'Online' : '在线'}</span>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="space-y-4 mb-6">
                                {conversations.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + i * 0.2 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'max' && (
                                            <div className="w-8 h-8 bg-[#0B3D2E] rounded-full flex items-center justify-center mr-3 shrink-0">
                                                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[75%] p-4 font-serif rounded-lg ${msg.role === 'user'
                                                ? 'text-[#1A1A1A]'
                                                : 'bg-[#0B3D2E]/5 text-[#1A1A1A]'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA */}
                            <button
                                onClick={handleChatClick}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0B3D2E] text-white font-semibold hover:bg-[#0B3D2E]/90 transition-colors text-sm rounded-lg"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {language === 'en' ? 'Talk to Max' : '和 Max 聊聊'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Features List */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                onMouseEnter={() => setActiveFeature(i)}
                                className={`p-6 cursor-pointer transition-all ${activeFeature === i
                                    ? 'bg-[#D4AF37]/10 border-l-4 border-[#D4AF37]'
                                    : 'bg-white/5 border-l-4 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${activeFeature === i ? 'bg-[#D4AF37] text-[#0B3D2E]' : 'bg-white/10 text-white'
                                        }`}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold font-serif text-lg mb-2">{feature.title}</h4>
                                        <p className="text-white/80 font-serif">{feature.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
