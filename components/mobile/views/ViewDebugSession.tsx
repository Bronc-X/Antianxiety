"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bug, RefreshCw } from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { useDebugSession } from "@/hooks/domain/useDebugSession";
import { cn } from "@/lib/utils";

interface ViewDebugSessionProps {
    onBack?: () => void;
}

export const ViewDebugSession = ({ onBack }: ViewDebugSessionProps) => {
    const { load, isLoading, error } = useDebugSession();
    const [session, setSession] = useState<unknown>(null);

    const handleLoad = async () => {
        const result = await load();
        if (result) {
            setSession(result);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-stone-600 dark:text-stone-300" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Debug Session</h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Session diagnostics</p>
                    </div>
                </div>
                <button
                    onClick={handleLoad}
                    disabled={isLoading}
                    className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={cn("w-5 h-5 text-stone-500", isLoading && "animate-spin")} />
                </button>
            </div>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Debug Payload</h3>
                </div>
                <button
                    onClick={handleLoad}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                >
                    Load Debug Session
                </button>
                {error && <div className="text-xs text-rose-500">{error}</div>}
                {session && (
                    <pre className="text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                )}
            </CardGlass>
        </motion.div>
    );
};
