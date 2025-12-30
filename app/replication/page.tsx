"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Layout, Calendar, User, Wind, PlayCircle } from "lucide-react";
import Link from "next/link";
import InteractiveShape from "@/components/replication/InteractiveShape";

const DEMOS = [
    {
        title: "完整流程 (Onboarding)",
        desc: "3D 引导页流程",
        path: "/replication/onboarding",
        icon: PlayCircle,
        color: "bg-slate-900 text-white"
    },
    {
        title: "仪表盘 (Dashboard)",
        desc: "核心数据与导航",
        path: "/replication/dashboard",
        icon: Layout,
        color: "bg-white text-slate-900"
    },
    {
        title: "情绪日记 (Diary)",
        desc: "时间轴与记录",
        path: "/replication/diary",
        icon: Calendar,
        color: "bg-white text-slate-900"
    },
    {
        title: "正念播放器 (Mindfulness)",
        desc: "呼吸练习动画",
        path: "/replication/mindfulness",
        icon: Wind,
        color: "bg-white text-slate-900"
    },
    {
        title: "个人中心 (Profile)",
        desc: "环形进度头像",
        path: "/replication/profile",
        icon: User,
        color: "bg-white text-slate-900"
    },
];

export default function ReplicationHub() {
    return (
        <div className="flex flex-col h-full w-full bg-slate-50 relative overflow-hidden">
            {/* Background Ambient */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none" />

            <div className="flex-1 overflow-y-auto px-6 py-12 pb-32 no-scrollbar z-10">

                <div className="mb-8 text-center relative">
                    <div className="w-20 h-20 mx-auto mb-4 relative">
                        <div className="absolute inset-0 scale-150 opacity-50"><InteractiveShape /></div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">UI Replication</h1>
                    <p className="text-slate-500 text-sm mt-2">Anti-Anxiety Design System v1.0</p>
                </div>

                <div className="space-y-4">
                    {DEMOS.map((demo, i) => (
                        <Link href={demo.path} key={i}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:scale-[1.02] transition-transform ${demo.color}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${demo.color === 'bg-slate-900 text-white' ? 'bg-white/20' : 'bg-slate-100'}`}>
                                        <demo.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-base">{demo.title}</div>
                                        <div className={`text-xs ${demo.color === 'bg-slate-900 text-white' ? 'text-slate-400' : 'text-slate-400'}`}>{demo.desc}</div>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-indigo-900 leading-relaxed">
                            <span className="font-bold block mb-1">设计亮点 (Design Highlights)</span>
                            <ul className="list-disc list-inside space-y-1 text-indigo-700/80">
                                <li>2.5D Glassmorphism 交互光球</li>
                                <li>Framer Motion 页面平滑过渡</li>
                                <li>Anti-Anxiety 治愈系配色适配</li>
                                <li>Spring 物理级动画触感</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
