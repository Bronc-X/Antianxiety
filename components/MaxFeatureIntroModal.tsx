'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Activity, Brain, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface MaxFeatureIntroModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MaxFeatureIntroModal({ isOpen, onClose }: MaxFeatureIntroModalProps) {
    const { language } = useI18n();

    const features = [
        {
            icon: Activity,
            title: language === 'en' ? 'Biometric Sync' : '生物识别同步',
            desc: language === 'en' ? 'Max syncs with Oura, Apple Watch, and Fitbit to see your true fatigue level.' : 'Max 与 Oura、Apple Watch 和 Fitbit 同步，洞察你真实的疲惫程度。'
        },
        {
            icon: Brain,
            title: language === 'en' ? 'Clinical Reasoning' : '临床逻辑推理',
            desc: language === 'en' ? 'Not just LLM talk. Max uses Bayesian logic to pinpoint where your health is leaking.' : '不只是大模型闲聊。Max 使用贝叶斯逻辑精准锁定你的健康流失点。'
        },
        {
            icon: Shield,
            title: language === 'en' ? 'Protective Oversight' : '保护性监视',
            desc: language === 'en' ? 'Max will actively stop you from overtraining when your HRV suggests high injury risk.' : '当 HRV 显示高受伤风险时，Max 会及时阻止你过度训练。'
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-[#0b3d2e] dark:bg-[#0b3d2e] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-emerald-500/20"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Hero Header */}
                        <div className="relative h-48 bg-gradient-to-br from-emerald-900 to-black p-8 flex items-center gap-6">
                            <div className="w-24 h-24 bg-gradient-to-tr from-[#D4AF37] to-emerald-400 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                                <span className="text-4xl font-bold text-white">Max</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-heading font-medium text-white mb-2">
                                    {language === 'en' ? 'Meet Max' : '认识 Max'}
                                </h2>
                                <p className="text-emerald-300/80 font-medium">
                                    {language === 'en' ? 'Your Bio-Operating System Co-pilot' : '你的生物操作系统副驾驶'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 md:p-12">
                            <p className="text-emerald-50/70 text-lg leading-relaxed mb-10">
                                {language === 'en'
                                    ? 'Max isn\'t just an AI chatbot. It\'s a closed-loop intelligence system that connects your wearable data with high-performance coaching to ensure you never burn out again.'
                                    : 'Max 不仅仅是一个 AI 聊天机器人。它是一个闭环智能系统，将你的穿戴设备数据与高效能管理相结合，确保你不再陷入盲目的“自我消耗”。'}
                            </p>

                            <div className="grid sm:grid-cols-3 gap-6 mb-10">
                                {features.map((f, i) => (
                                    <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                        <f.icon className="w-6 h-6 text-[#D4AF37] mb-3" />
                                        <h4 className="text-white font-semibold text-sm mb-2">{f.title}</h4>
                                        <p className="text-emerald-50/40 text-xs leading-tight">{f.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-[#D4AF37] hover:bg-[#B8962D] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D4AF37]/20"
                                >
                                    <Zap size={18} />
                                    {language === 'en' ? 'Experience Calibration' : '立即体验校准'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                                >
                                    {language === 'en' ? 'View Live Demo' : '查看实时演示'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
