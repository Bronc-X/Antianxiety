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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-24"
            >
                <span className="block text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37] mb-6">
                    {t('landing.coreIdea') || (language === 'en' ? 'Core Philosophy' : '核心理念')}
                </span>
                <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-tight text-[#1A1A1A] dark:text-white">
                    {language === 'en' ? (
                        <>The <span className="italic text-[#D4AF37]">Architecture</span> of Calm.</>
                    ) : (
                        <>平静的<span className="italic text-[#D4AF37]">架构</span>。</>
                    )}
                </h2>
            </motion.div>

            {/* Three Cards in a Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
                {methods.map((method, index) => (
                    <motion.div
                        key={method.key}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 }}
                        className="group cursor-default"
                    >
                        <div className="h-px w-full bg-[#1A1A1A]/10 mb-8 group-hover:bg-[#D4AF37] transition-colors duration-1000 origin-left" />
                        <div className="text-xs font-mono uppercase tracking-widest text-[#1A1A1A]/40 mb-4">{method.index}</div>
                        <h3 className="text-2xl font-medium text-[#1A1A1A] dark:text-white mb-6 group-hover:text-[#D4AF37] transition-colors duration-500">
                            {t(`landing.${method.key}Title`)}
                        </h3>
                        <p className="text-base text-[#1A1A1A]/70 dark:text-white/70 leading-relaxed font-light">
                            {t(`landing.${method.key}P1`)}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
