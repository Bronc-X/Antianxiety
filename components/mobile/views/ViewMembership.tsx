"use client";

/**
 * ViewMembership - Membership Upgrade Page
 * 
 * 会员拉页，展示免费版 vs Pro 版 vs Founding 版功能对比
 * 基于 /unlearn/onboarding/upgrade/page.tsx 内容移植
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Crown,
    Check,
    X,
    Sparkles,
    Brain,
    Moon,
    Zap,
    Shield,
    ArrowRight,
    Star,
    Gem // For Founding plan
} from "lucide-react";
import { cn } from "@/lib/utils";


const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};

interface ViewMembershipProps {
    onNavigate?: (view: string) => void;
}

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '¥0',
        period: '',
        desc: '极简的每日状态镜子',
        color: 'border-stone-200 dark:border-white/10',
        bg: 'bg-white dark:bg-white/5',
        features: [
            { text: '每日快照 (HRV/皮质醇)', included: true },
            { text: '硬件同步 (Apple/Oura)', included: true },
            { text: '7 天数据回顾', included: true },
            { text: '基础 AI 问询', included: true },
            { text: '全周期记忆', included: false },
            { text: '贝叶斯引擎动态计划', included: false },
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '¥19',
        period: '/月',
        desc: '为数据优化生活的精英打造',
        popular: true,
        color: 'border-amber-400',
        bg: 'bg-gradient-to-br from-emerald-900/80 to-teal-900/80',
        features: [
            { text: '包含 Free 全部权益', included: true },
            { text: '全周期记忆 (1年趋势)', included: true, highlight: true },
            { text: '贝叶斯引擎动态计划', included: true, highlight: true },
            { text: '深度 RAG (Nature级文献)', included: true },
            { text: 'Verified 黑色徽章', included: true },
            { text: '优先客服 + OTA 更新', included: true },
        ]
    },
    {
        id: 'founding',
        name: 'Founding',
        price: '¥499',
        period: '终身',
        desc: '限量 500 席，早期共建者',
        badge: '限量 500',
        color: 'border-[#C4A77D]',
        bg: 'bg-gradient-to-br from-[#1A1A1A] to-[#2C2C2C]',
        features: [
            { text: 'Pro 全部权益 · 终身有效', included: true },
            { text: '年度数字孪生PDF报告', included: true, highlight: true },
            { text: '核心社区 + 创始人直连', included: true, highlight: true },
            { text: 'OG 元老金徽章', included: true },
            { text: 'Beta 功能优先体验', included: true },
        ]
    }
];

export const ViewMembership = ({ onNavigate }: ViewMembershipProps) => {
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'founding'>('pro');

    const handleContinue = () => {
        // For now, just go to home
        // In production, this would trigger payment flow for Pro/Founding
        onNavigate?.('home');
    };

    const handleSkip = () => {
        onNavigate?.('home');
    };

    const currentPlan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
            className="flex-1 flex flex-col py-4 px-4"
        >
            {/* Header */}
            <div className="text-center mb-6 pt-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded-full mb-4"
                >
                    <Crown size={14} />
                    <span>UNLOCK FULL POTENTIAL</span>
                </motion.div>
                <h1 className="text-2xl font-serif font-bold text-emerald-950 dark:text-emerald-50 mb-2">
                    选择适合你的方案
                </h1>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                    免费开始，随时为健康投资升级
                </p>
            </div>

            {/* Plan Cards */}
            <div className="space-y-4 mb-6">
                {PLANS.map((plan) => (
                    <motion.div
                        key={plan.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPlan(plan.id as any)}
                        className={cn(
                            "relative p-5 rounded-2xl cursor-pointer transition-all border-2",
                            selectedPlan === plan.id
                                ? `${plan.color} shadow-xl shadow-stone-500/10`
                                : "border-stone-100 dark:border-white/5 opacity-80",
                            selectedPlan === plan.id && plan.id === 'pro' ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white" : "",
                            selectedPlan === plan.id && plan.id === 'founding' ? "bg-gradient-to-br from-slate-800 to-slate-900 text-[#C4A77D]" : "",
                            selectedPlan === plan.id && plan.id === 'free' ? "bg-white dark:bg-white/10" : "",
                            (selectedPlan !== plan.id) && "bg-white dark:bg-white/5"
                        )}
                    >
                        {/* Badges */}
                        {plan.popular && selectedPlan === plan.id && (
                            <div className="absolute -top-3 right-4 px-3 py-1 bg-amber-400 text-emerald-950 text-[10px] font-bold rounded-full shadow-lg">
                                POPULAR
                            </div>
                        )}
                        {plan.badge && (
                            <div className="absolute -top-3 right-4 px-3 py-1 bg-[#C4A77D] text-[#0B3D2E] text-[10px] font-bold rounded-full shadow-lg">
                                {plan.badge}
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {plan.id === 'founding' ? <Gem size={20} /> : plan.id === 'pro' ? <Crown size={20} /> : <Sparkles size={20} />}
                                <span className={cn(
                                    "font-bold font-serif text-lg",
                                    selectedPlan !== plan.id && "text-stone-700 dark:text-stone-200"
                                )}>{plan.name}</span>
                            </div>
                            <div className="text-right flex items-baseline gap-1">
                                <span className={cn(
                                    "text-xl font-bold font-serif",
                                    selectedPlan !== plan.id && "text-stone-900 dark:text-stone-100"
                                )}>{plan.price}</span>
                                <span className={cn(
                                    "text-xs opacity-70",
                                    selectedPlan !== plan.id && "text-stone-500"
                                )}>{plan.period}</span>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedPlan === plan.id && (
                            <p className={cn(
                                "text-xs mb-4 opacity-80",
                                selectedPlan !== plan.id && "text-stone-500"
                            )}>
                                {plan.desc}
                            </p>
                        )}

                        {/* Features */}
                        <div className="space-y-2">
                            {(plan.id !== 'free' || selectedPlan === 'free' ? plan.features : plan.features.slice(0, 2)).map((feature, i) => (
                                <div key={i} className={cn(
                                    "flex items-center gap-2 text-xs",
                                    selectedPlan !== plan.id && "text-stone-500 dark:text-stone-400"
                                )}>
                                    {feature.included ? (
                                        <Check size={14} className={cn(
                                            selectedPlan === plan.id && plan.highlight ? "text-current" : "text-emerald-500",
                                            selectedPlan !== plan.id && "text-emerald-500"
                                        )} />
                                    ) : (
                                        <X size={14} className="opacity-30" />
                                    )}
                                    <span className={feature.highlight && selectedPlan === plan.id ? "font-bold" : "opacity-90"}>
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                            {plan.id === 'free' && selectedPlan !== 'free' && (
                                <div className="text-[10px] opacity-50 pl-6 pt-1">
                                    + {plan.features.length - 2} more...
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-auto space-y-3 pt-4">
                <motion.button
                    onClick={handleContinue}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full py-4 rounded-2xl font-semibold text-white",
                        selectedPlan === 'founding'
                            ? "bg-gradient-to-r from-[#C4A77D] to-[#A0855B] text-[#0B3D2E]"
                            : "bg-gradient-to-r from-emerald-600 to-teal-600",
                        "shadow-lg shadow-emerald-500/20",
                        "flex items-center justify-center gap-2",
                        "transition-all"
                    )}
                >
                    {selectedPlan === 'free' ? (
                        <>
                            免费开始
                            <ArrowRight size={18} />
                        </>
                    ) : (
                        <>
                            {selectedPlan === 'founding' ? '锁定席位' : '立即订阅'} (7天免费)
                        </>
                    )}
                </motion.button>

                {selectedPlan !== 'free' && (
                    <button
                        onClick={handleSkip}
                        className="w-full py-2 text-center text-stone-400 text-xs hover:text-stone-600 transition-colors"
                    >
                        暂不升级，继续使用免费版
                    </button>
                )}

                <p className="text-center text-[10px] text-stone-300 px-4">
                    随时可取消 · 安全支付加密
                </p>
            </div>
        </motion.div>
    );
};

export default ViewMembership;
