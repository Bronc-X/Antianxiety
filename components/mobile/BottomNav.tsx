"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Sparkles, FlaskConical, Settings } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        {
            name: "Dashboard",
            path: "/mobile/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Max",
            path: "/mobile/max",
            icon: Sparkles,
        },
        {
            name: "Science",
            path: "/mobile/science",
            icon: FlaskConical,
        },
        {
            name: "Settings",
            path: "/mobile/settings",
            icon: Settings,
        },
    ];

    return (
        <div className="fixed bottom-6 left-6 right-6 z-50">
            {/* Glass Container */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 shadow-xl shadow-indigo-900/5 pointer-events-none" />

            <div className="relative flex justify-around items-center p-2">
                {navItems.map((item) => {
                    const isActive = pathname?.startsWith(item.path);
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className="relative flex flex-col items-center justify-center w-16 h-16"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-slate-900 rounded-[2rem] shadow-lg shadow-slate-900/20 z-0"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                            <div className={`relative z-10 flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}>
                                <item.icon className={`w-6 h-6 ${isActive ? "stroke-2" : "stroke-[1.5]"}`} />
                                <span className={`text-[10px] font-medium transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 scale-0'}`}>{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
