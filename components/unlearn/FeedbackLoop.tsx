'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { TrendingUp, Brain, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface FeedbackMetric {
    label: string;
    value: number;
    change: number;
    status: 'improving' | 'stable' | 'declining';
}

export default function FeedbackLoop() {
    const { language } = useI18n();

    const metrics: FeedbackMetric[] = [
        {
            label: language === 'en' ? 'Prediction Accuracy' : '预测准确率',
            value: 94,
            change: 2.3,
            status: 'improving',
        },
        {
            label: language === 'en' ? 'Understanding Score' : '理解度评分',
            value: 87,
            change: 5.1,
            status: 'improving',
        },
        {
            label: language === 'en' ? 'Intervention Success' : '干预成功率',
            value: 78,
            change: -1.2,
            status: 'stable',
        },
    ];

    const learningEvents = [
        {
            time: '2h ago',
            event: language === 'en'
                ? 'Updated stress pattern recognition based on your morning data'
                : '根据你的早间数据更新了压力模式识别',
            type: 'update',
        },
        {
            time: '5h ago',
            event: language === 'en'
                ? 'Learned that caffeine after 2pm correlates with your sleep issues'
                : '发现下午2点后的咖啡与你的睡眠问题相关',
            type: 'insight',
        },
        {
            time: '1d ago',
            event: language === 'en'
                ? 'Adjusted HRV baseline after 7 days of data collection'
                : '在收集7天数据后调整了HRV基线',
            type: 'calibration',
        },
    ];

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#FAF6EF' }}>
            <div className="max-w-[1000px] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37]">
                        {language === 'en' ? 'Self-Correcting AI' : 'AI 自我修正'}
                    </p>
                    <h2
                        className="text-[#1A1A1A] font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Your digital twin learns and adapts' : '你的数字孪生不断学习与适应'}
                    </h2>
                    <p className="text-[#1A1A1A]/60 max-w-xl mx-auto">
                        {language === 'en'
                            ? 'Max constantly refines its understanding of you based on new data and feedback'
                            : 'Max 根据新数据和反馈不断完善对你的理解'}
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {metrics.map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-white border border-[#1A1A1A]/10"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-[#1A1A1A]/60">{metric.label}</span>
                                <div className={`flex items-center gap-1 text-sm ${metric.status === 'improving' ? 'text-emerald-600' :
                                        metric.status === 'declining' ? 'text-red-500' :
                                            'text-[#1A1A1A]/40'
                                    }`}>
                                    {metric.status === 'improving' ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : metric.status === 'declining' ? (
                                        <AlertCircle className="w-4 h-4" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                                </div>
                            </div>
                            <div className="text-4xl font-bold text-[#0B3D2E] mb-2">
                                {metric.value}%
                            </div>
                            {/* Progress bar */}
                            <div className="h-2 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#0B3D2E]"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${metric.value}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Learning Timeline */}
                <div className="bg-white border border-[#1A1A1A]/10 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-[#0B3D2E] flex items-center justify-center">
                            <Brain className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#1A1A1A]">
                                {language === 'en' ? 'Recent Learning Events' : '最近的学习事件'}
                            </h3>
                            <p className="text-sm text-[#1A1A1A]/50">
                                {language === 'en' ? 'How Max is improving for you' : 'Max 正在如何为你改进'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {learningEvents.map((event, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4 p-4 bg-[#FAF6EF] border-l-2 border-[#D4AF37]"
                            >
                                <RefreshCw className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-[#1A1A1A]">{event.event}</p>
                                    <p className="text-sm text-[#1A1A1A]/40 mt-1">{event.time}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
