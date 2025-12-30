"use client";

import { Home, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const NAV_ITEMS = [
    { id: "home", icon: Home, label: "首页" },
    { id: "diary", icon: Calendar, label: "情绪日记" },
    { id: "profile", icon: User, label: "个人中心" },
];

export const GlassNav = () => {
    const [active, setActive] = useState("home");

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-20 rounded-[2.5rem] bg-white/80 backdrop-blur-xl shadow-2xl shadow-black/5 border border-white/20 flex items-center justify-around px-2 z-50">
            {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className="relative flex flex-col items-center justify-center w-20 h-full"
                    >
                        {isActive && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute top-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-tr from-slate-100 to-white rounded-full shadow-inner -z-10"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]" />
                            </motion.div>
                        )}

                        <Icon
                            className={`w-6 h-6 transition-colors duration-300 ${isActive ? "text-slate-900 fill-slate-900" : "text-slate-400"}`}
                            strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className={`text-[10px] font-semibold mt-1 transition-colors duration-300 ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </div>
    );
};
