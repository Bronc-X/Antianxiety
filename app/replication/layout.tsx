"use client";

import { usePathname } from "next/navigation";
import { GlassNav } from "@/components/replication/GlassNav";

export default function ReplicationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const hideNav = pathname.includes("onboarding") || pathname.includes("activity-level") || pathname.includes("mindfulness") || pathname === "/replication";

    return (
        <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4">
            {/* Mobile Frame Container */}
            <div className="w-full max-w-sm h-[844px] bg-slate-50 rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-slate-900/5">
                {children}

                {!hideNav && <GlassNav />}
            </div>
        </div>
    );
}
