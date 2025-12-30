"use client";

import BottomNav from "./BottomNav";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function MobileLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/mobile/login";

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden font-sans">
            {/* Ambient Background - Matching Replication Page */}
            {!isLoginPage && (
                <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-100/40 to-transparent pointer-events-none z-0" />
            )}

            {/* Content Area */}
            <main className={`flex-1 relative z-10 overflow-y-auto no-scrollbar ${!isLoginPage ? 'pb-32' : ''}`}>
                {children}
            </main>

            {!isLoginPage && <BottomNav />}
        </div>
    );
}
