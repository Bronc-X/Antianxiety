"use client";

import { motion } from "framer-motion";
import { Settings, ChevronRight, Moon, Bell, Shield } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="flex flex-col h-full w-full relative bg-slate-50">

            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex justify-between items-center z-10">
                <h1 className="text-2xl font-bold text-slate-900">个人中心</h1>
                <button className="text-slate-400 hover:text-slate-600">
                    <Settings className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">

                {/* Avatar Section */}
                <div className="flex flex-col items-center py-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                            <motion.circle
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 0.85 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="50" cy="50" r="46" fill="none" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round"
                            />
                        </svg>
                        <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden relative border-4 border-white shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-3xl">
                                🧘
                            </div>
                        </div>
                        <div className="absolute bottom-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                            LV. 5
                        </div>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Rico</h2>
                    <p className="text-slate-400 text-sm">平静探索者</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm">
                        <div className="text-3xl font-bold text-slate-900 mb-1">12</div>
                        <div className="text-xs text-slate-400">连续天数</div>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm">
                        <div className="text-3xl font-bold text-slate-900 mb-1">340</div>
                        <div className="text-xs text-slate-400">正念分钟</div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="bg-white rounded-[2rem] p-2 shadow-sm space-y-1">
                    {[
                        { icon: Moon, label: "深色模式", value: "关" },
                        { icon: Bell, label: "提醒设置", value: "每日" },
                        { icon: Shield, label: "隐私安全", value: "" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-slate-900">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400 font-medium">{item.value}</span>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
