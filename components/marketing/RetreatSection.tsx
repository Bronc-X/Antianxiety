'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Heart, Activity } from 'lucide-react';

export default function RetreatSection() {
    const { t, language } = useI18n();

    return (
        <section className="py-32 px-6 md:px-12 max-w-[1400px] mx-auto bg-[#FAF6EF] text-[#1A1A1A] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
                {/* Text Side */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="order-2 md:order-1"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <span className="text-xs font-bold tracking-[0.2em] text-emerald-600 uppercase">
                            {language === 'en' ? 'The Solution' : '我们的答案'}
                        </span>
                    </motion.div>

                    <h2 className="font-heading text-4xl md:text-5xl leading-tight mb-8">
                        {language === 'en' ? (
                            <>Rest is <span className="italic text-[#D4AF37]">Strategy.</span></>
                        ) : (
                            <>这不叫偷懒，<br />叫<span className="italic text-[#D4AF37]">战术性撤退</span>。</>
                        )}
                    </h2>

                    <div className="bg-black/5 backdrop-blur-sm border border-black/10 p-8 rounded-[2px] mb-8">
                        <p className="text-xl font-light leading-relaxed mb-6 font-serif italic text-black">
                            {language === 'en'
                                ? '"Hey, the data sees your deep fatigue. Forcing a workout today will hurt your immunity. Your best task: Go home, take a hot bath, sleep 20 mins early."'
                                : '“嘿，数据看到了你深层的疲惫。今天强行运动会伤害免疫系统。今天的最佳任务是：回家，洗个热水澡，早睡20分钟。”'}
                        </p>
                        <div className="flex items-center gap-3 opacity-50">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs tracking-widest uppercase">AI Health Coach Analysis</span>
                        </div>
                    </div>

                    <p className="text-black/40 max-w-md leading-relaxed">
                        {language === 'en'
                            ? 'After 30, knowing when to stop requires more courage than blindly pushing through.'
                            : '30岁以后，敢于休息比盲目坚持更需要勇气。'}
                    </p>
                </motion.div>

                {/* Visual Side (HRV Gauge) */}
                <div className="order-1 md:order-2 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative w-80 h-80"
                    >
                        {/* Simplified elegant gauge representation */}
                        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="90" fill="none" stroke="#ddd" strokeWidth="1" />
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#ddd" strokeWidth="8" strokeLinecap="round" strokeDasharray="502" strokeDashoffset="0" opacity="0.2" />

                            {/* Active arc - Synced with status (GOOD -> green) */}
                            <motion.circle
                                cx="100" cy="100" r="80" fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray="502"
                                initial={{ strokeDashoffset: 502 }}
                                whileInView={{ strokeDashoffset: 100 }}
                                transition={{ duration: 2, ease: "easeOut" }}
                            />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl font-heading text-[#1A1A1A]">58</span>
                            <span className="text-xs tracking-[0.2em] text-emerald-600 mt-2 font-bold">HRV GOOD</span>
                            {/* Status Legend */}
                            <div className="flex items-center gap-3 mt-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="text-[10px] text-black/50">&lt;40</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    <span className="text-[10px] text-black/50">40-55</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] text-black/50">&gt;55</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
