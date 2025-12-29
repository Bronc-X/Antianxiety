'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Bell, ChevronRight } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { BioGauge, StatBlock, InsightCard } from '@/components/mobile-dark/DarkComponents';
import Link from 'next/link';

// Area Chart Component
function EnergyChart({ data }: { data: number[] }) {
    const width = 320;
    const height = 120;
    const padding = { top: 10, right: 0, bottom: 20, left: 0 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * chartWidth + padding.left;
        const y = chartHeight - ((value - minValue) / range) * chartHeight + padding.top;
        return { x, y };
    });

    const pathD = points.reduce((acc, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;

        // Smooth curve
        const prev = points[index - 1];
        const cp1x = prev.x + (point.x - prev.x) / 3;
        const cp2x = prev.x + 2 * (point.x - prev.x) / 3;
        return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    // Area fill path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

    return (
        <svg width={width} height={height} className="w-full">
            <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00FF94" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00FF94" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                    key={ratio}
                    x1={padding.left}
                    y1={padding.top + ratio * chartHeight}
                    x2={width - padding.right}
                    y2={padding.top + ratio * chartHeight}
                    stroke="#1A1A1A"
                    strokeWidth={0.5}
                />
            ))}

            {/* Area fill */}
            <motion.path
                d={areaD}
                fill="url(#areaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            />

            {/* Line */}
            <motion.path
                d={pathD}
                fill="none"
                stroke="#00FF94"
                strokeWidth={1.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />

            {/* Time labels */}
            {['12AM', '6AM', '12PM', '6PM', 'NOW'].map((label, i) => (
                <text
                    key={label}
                    x={padding.left + (i / 4) * chartWidth}
                    y={height - 4}
                    fill="#444444"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                >
                    {label}
                </text>
            ))}
        </svg>
    );
}

export default function DarkDashboard() {
    const { language } = useI18n();
    const [showAlert, setShowAlert] = useState(false);

    // Mock 24h energy data
    const energyData = [
        45, 40, 35, 30, 28, 25, 30, 45, 65, 75, 80, 78,
        70, 65, 60, 55, 50, 55, 60, 70, 75, 72, 68, 65
    ];

    const currentHour = new Date().getHours();
    const currentEnergy = energyData[currentHour] || 65;

    // Determine status based on recovery
    const getStatus = (value: number) => {
        if (value >= 70) return { text: 'OPTIMAL', color: 'green' as const };
        if (value >= 50) return { text: 'MODERATE', color: 'yellow' as const };
        return { text: 'RECOVERY NEEDED', color: 'red' as const };
    };

    const status = getStatus(currentEnergy);

    return (
        <div className="pb-8" style={{ background: '#000000' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 pt-4 pb-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1
                            className="text-xl font-mono font-bold tracking-tight"
                            style={{ color: '#FFFFFF' }}
                        >
                            {language === 'en' ? 'SYSTEM: ACTIVE' : '系统：运行中'}
                        </h1>
                        <p
                            className="text-[11px] font-mono mt-1"
                            style={{ color: '#00FF94' }}
                        >
                            {language === 'en'
                                ? `Recovery is ${currentEnergy}% of baseline`
                                : `恢复度为基线的 ${currentEnergy}%`
                            }
                        </p>
                    </div>

                    {/* Notification */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            try {
                                await Haptics.impact({ style: ImpactStyle.Light });
                            } catch { }
                        }}
                        className="relative w-10 h-10 flex items-center justify-center"
                        style={{
                            background: '#0A0A0A',
                            border: '1px solid #222222',
                        }}
                    >
                        <Bell className="w-4 h-4" style={{ color: '#666666' }} />
                        <div
                            className="absolute top-2 right-2 w-1.5 h-1.5"
                            style={{ background: '#FF3B30' }}
                        />
                    </motion.button>
                </div>
            </motion.div>

            {/* Bio-Status Gauge */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center py-8"
            >
                <BioGauge
                    value={currentEnergy}
                    label="RECOVERY"
                    status={status.text}
                    color={status.color}
                />
            </motion.div>

            {/* Calibrate Button */}
            <div className="px-5 mb-6">
                <Link href="/mobile-dark/calibration">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                            try {
                                await Haptics.impact({ style: ImpactStyle.Medium });
                            } catch { }
                        }}
                        className="w-full py-4 flex items-center justify-center gap-2"
                        style={{
                            background: '#0A0A0A',
                            border: '1px solid #00FF94',
                        }}
                    >
                        <span
                            className="text-sm font-mono uppercase tracking-wider"
                            style={{ color: '#00FF94' }}
                        >
                            {language === 'en' ? 'CALIBRATE TODAY' : '今日校准'}
                        </span>
                        <ChevronRight className="w-4 h-4" style={{ color: '#00FF94' }} />
                    </motion.button>
                </Link>
            </div>

            {/* Energy Wave Chart */}
            <div className="px-5 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4"
                    style={{
                        background: '#0A0A0A',
                        border: '1px solid #1A1A1A',
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span
                            className="text-[10px] font-mono uppercase tracking-[0.15em]"
                            style={{ color: '#555555' }}
                        >
                            {language === 'en' ? '24H ENERGY WAVE' : '24小时能量曲线'}
                        </span>
                        <span
                            className="text-[10px] font-mono"
                            style={{ color: '#00FF94' }}
                        >
                            LIVE
                        </span>
                    </div>
                    <EnergyChart data={energyData} />
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="px-5 mb-6">
                <div className="grid grid-cols-2 gap-[1px]" style={{ background: '#1A1A1A' }}>
                    <StatBlock
                        label="HRV"
                        value="56"
                        unit="ms"
                        trend="up"
                        delay={0.3}
                    />
                    <StatBlock
                        label={language === 'en' ? 'SLEEP' : '睡眠'}
                        value="6:52"
                        unit="hr"
                        trend="down"
                        color="blue"
                        delay={0.35}
                    />
                    <StatBlock
                        label={language === 'en' ? 'STRAIN' : '负荷'}
                        value="4.2"
                        trend="neutral"
                        color="yellow"
                        delay={0.4}
                    />
                    <StatBlock
                        label={language === 'en' ? 'RESTING HR' : '静息心率'}
                        value="62"
                        unit="bpm"
                        trend="up"
                        delay={0.45}
                    />
                </div>
            </div>

            {/* RAG Insight Card */}
            <div className="px-5 mb-6">
                <InsightCard
                    source="NATURE MEDICINE • 2024"
                    conclusion={language === 'en'
                        ? "Your HRV pattern suggests elevated stress. Consider 10 minutes of deep breathing before your afternoon meeting."
                        : "你的HRV模式显示压力升高。建议在下午会议前进行10分钟深呼吸。"
                    }
                    detail={language === 'en'
                        ? "Based on analysis of your last 7 days of biometric data, morning HRV averages 15% below your personal baseline. Studies show brief breathing exercises can restore parasympathetic tone within 5-10 minutes."
                        : "根据过去7天的生物特征数据分析，晨间HRV平均比个人基线低15%。研究表明，简短的呼吸练习可在5-10分钟内恢复副交感神经张力。"
                    }
                    delay={0.5}
                />
            </div>

            {/* Mini action row */}
            <div className="px-5">
                <div
                    className="flex items-center justify-between p-4"
                    style={{
                        background: '#0A0A0A',
                        border: '1px solid #1A1A1A',
                    }}
                >
                    <span
                        className="text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: '#444444' }}
                    >
                        {language === 'en' ? 'LAST SYNC' : '上次同步'}
                    </span>
                    <span
                        className="text-[10px] font-mono"
                        style={{ color: '#666666' }}
                    >
                        2 MIN AGO
                    </span>
                </div>
            </div>
        </div>
    );
}
