'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Shield, Target, Sparkles, Heart } from 'lucide-react';

export default function AboutStory() {
    const { language } = useI18n();

    const values = [
        {
            icon: Shield,
            title: language === 'en' ? 'Data Trust' : '数据信任',
            desc: language === 'en' ? 'Your biological data is encrypted and used only for your health calibration.' : '你的生理数据经过严格加密，仅用于你的身心校准，绝不妥协。'
        },
        {
            icon: Target,
            title: language === 'en' ? 'Evidence Based' : '循证医学',
            desc: language === 'en' ? 'Every suggestion is backed by clinical research and real-time biometric analysis.' : '每一项建议都基于临床研究与实时生物识别分析，拒绝鸡汤。'
        },
        {
            icon: Heart,
            title: language === 'en' ? 'Human Centered' : '以人为本',
            desc: language === 'en' ? 'We care about your fatigue level more than your completion rate.' : '相比于完成率，我们更在意你的疲惫程度和真实感受。'
        }
    ];

    return (
        <section className="py-24 px-6 md:px-12 overflow-hidden relative" style={{ backgroundColor: '#FAF6EF' }}>
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-[#D4AF37]/5 to-transparent blur-[120px] pointer-events-none -z-10" />

            <div className="max-w-[1400px] mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-block mb-6"
                        >
                            <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/30 pb-2">
                                {language === 'en' ? 'Who We Are' : '我们是谁'}
                            </span>
                        </motion.div>

                        <h2 className="font-heading text-4xl md:text-5xl text-[#1A1A1A] leading-[1.1] mb-8 tracking-tight">
                            {language === 'en' ? (
                                <>A <span className="font-serif italic text-[#0B3D2E] relative inline-block">Bio-Rhythm
                                    <svg className="absolute -bottom-2 w-full h-3 text-[#D4AF37]/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                                    </svg>
                                </span> New Paradigm.</>
                            ) : (
                                <>我们致力于开启一场<span className="font-serif italic text-[#0B3D2E] text-3xl md:text-4xl relative inline-block mx-2">生理节律
                                    <svg className="absolute -bottom-2 w-full h-3 text-[#D4AF37]/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                                    </svg>
                                </span>的新范式。</>
                            )}
                        </h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-lg md:text-xl text-[#1A1A1A]/70 leading-relaxed mb-12 max-w-xl font-light"
                        >
                            {language === 'en'
                                ? 'We are a team of burnt-out high achievers who realized that "pushing through" was breaking us. We built the tool we needed: one that uses clinical data to protect us from our own ambition.'
                                : '我们是一群曾因"过度努力"而崩溃的开发者。我们意识到，那种盲目的坚持正在摧毁我们的健康。所以，我们为自己造了这个工具——用临床数据，来保护我们免受"野心"的反噬。'}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-5 p-6 bg-white border border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="w-12 h-12 bg-[#0B3D2E] flex items-center justify-center shrink-0">
                                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                            </div>
                            <p className="text-sm md:text-base font-medium text-[#1A1A1A] leading-relaxed relative z-10">
                                {language === 'en'
                                    ? 'Our promise: We will never guilt-trip you into a workout when your body needs sleep.'
                                    : '我们的承诺：当你的身体需要睡眠时，我们绝不会用"自律"来道德绑架你。'}
                            </p>
                        </motion.div>
                    </motion.div>

                    <div className="grid gap-6">
                        {values.map((v, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.8, ease: "easeOut" }}
                                whileHover={{ x: -10, backgroundColor: 'rgba(11, 61, 46, 0.03)' }}
                                className="flex gap-6 p-8 bg-white border border-transparent hover:border-[#0B3D2E]/20 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#0B3D2E]/5 group cursor-default"
                            >
                                <div className="w-14 h-14 bg-[#0B3D2E] flex items-center justify-center text-white shrink-0 group-hover:bg-[#D4AF37] transition-all duration-300 shadow-lg group-hover:shadow-[#D4AF37]/30 group-hover:rotate-6">
                                    <v.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-[#1A1A1A] mb-2 group-hover:text-[#0B3D2E] transition-colors">{v.title}</h4>
                                    <p className="text-[#1A1A1A]/60 leading-relaxed group-hover:text-[#1A1A1A]/80 transition-colors">{v.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
