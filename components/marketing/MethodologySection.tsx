'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export default function MethodologySection() {
    const { t, language } = useI18n();

    const methods = [
        {
            key: 'cognitiveLoad',
            index: '01',
        },
        {
            key: 'habitStreaks',
            index: '02',
        },
        {
            key: 'theSignal',
            index: '03',
        }
    ];

    return (
        <section className="py-32 px-6 md:px-12 max-w-[1400px] mx-auto border-t border-[#1A1A1A]/5 dark:border-white/5 bg-[#FAF6EF] dark:bg-[#1A1A1A]">
            {/* Title Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-center mb-32 relative z-10"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="inline-block mb-6"
                >
                    <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#D4AF37] border-b border-[#D4AF37]/30 pb-2">
                        {t('landing.coreIdea') || (language === 'en' ? 'Core Philosophy' : '核心理念')}
                    </span>
                </motion.div>

                <h2 className="font-heading text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-[#1A1A1A] dark:text-white tracking-tighter">
                    {language === 'en' ? (
                        <>The <span className="font-serif italic text-[#D4AF37] pr-4">Architecture</span> <br />of Calm.</>
                    ) : (
                        <>构建<br /><span className="font-serif italic text-[#D4AF37] text-6xl md:text-8xl pr-4">绝对平静</span>的架构</>
                    )}
                </h2>
            </motion.div>

            {/* Three Cards in a Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                {methods.map((method, index) => (
                    <motion.div
                        key={method.key}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.15, duration: 1, ease: "easeOut" }}
                        className="group relative p-8 md:p-10 rounded-[2rem] bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:border-[#D4AF37]/30 transition-all duration-700 hover:shadow-2xl hover:shadow-[#D4AF37]/5 hover:-translate-y-2 overflow-hidden"
                    >
                        {/* Hover Gradient Bloom */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 via-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="flex justify-between items-start mb-12 relative">
                            <span className="font-serif text-5xl text-[#D4AF37]/20 group-hover:text-[#D4AF37] transition-colors duration-500 italic">
                                {method.index}
                            </span>
                            <motion.div
                                className="w-12 h-12 rounded-full border border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
                            >
                                <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                            </motion.div>
                        </div>

                        <h3 className="text-2xl font-bold text-[#1A1A1A] dark:text-white mb-6 group-hover:text-[#D4AF37] transition-colors duration-500 tracking-tight">
                            {t(`landing.${method.key}Title`)}
                        </h3>

                        <div className="h-px w-12 bg-[#D4AF37]/30 mb-6 group-hover:w-full transition-all duration-700 ease-out" />

                        <p className="text-base text-[#1A1A1A]/60 dark:text-white/60 leading-relaxed font-medium">
                            {t(`landing.${method.key}P1`)}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-[#D4AF37]/5 to-transparent blur-[100px] pointer-events-none -z-10" />
        </section>
    );
}
