"use client";

import { motion } from "framer-motion";
import { Home, Calendar, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { id: "dashboard", icon: Home, label: "首页", path: "/replication/dashboard" },
    { id: "diary", icon: Calendar, label: "情绪日记", path: "/replication/diary" },
    { id: "profile", icon: User, label: "个人中心", path: "/replication/profile" },
];

export const GlassNav = () => {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (pathname === path) return true;
        // Handle sub-routes or specific dashboard matches if needed
        return false;
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 p-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-900/10 rounded-full">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className="relative"
                        >
                            <div
                                className={`
                                    relative px-6 py-3 rounded-full flex items-center gap-2 transition-all duration-300
                                    ${active ? "text-white" : "text-slate-400 hover:text-slate-600"}
                                `}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-slate-900 rounded-full shadow-lg shadow-teal-900/20"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className={`w-5 h-5 relative z-10 ${active ? "fill-current" : ""}`} />
                                {active && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="text-sm font-medium relative z-10 whitespace-nowrap overflow-hidden"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
