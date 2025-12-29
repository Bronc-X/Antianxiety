'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Activity, Coffee, Moon, Clipboard } from 'lucide-react';

interface Plan {
    id: string;
    title: string;
    plan_type: string;
    difficulty: number;
    status: string;
    content: any;
    created_at: string;
}

export function MobilePlansList() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [completingId, setCompletingId] = useState<string | null>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const res = await fetch('/api/plans/list?status=active&limit=10');
            const result = await res.json();
            if (result.success) {
                setPlans(result.data.plans || []);
            }
        } catch (e) {
            console.error('Failed to load plans', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async (id: string) => {
        setCompletingId(id);
        try {
            const res = await fetch('/api/plans/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: id, status: 'completed', completionDate: new Date().toISOString() })
            });
            if (res.ok) {
                // Remove efficiently
                setPlans(prev => prev.filter(p => p.id !== id));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCompletingId(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'exercise': return <Activity className="w-4 h-4 text-[#00FF94]" />;
            case 'diet': return <Coffee className="w-4 h-4 text-[#FF9500]" />;
            case 'sleep': return <Moon className="w-4 h-4 text-[#B388FF]" />;
            default: return <Clipboard className="w-4 h-4 text-[#007AFF]" />;
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-[#666666] text-xs animate-pulse">SYNCING PLANS...</div>;
    }

    if (plans.length === 0) {
        return (
            <div className="p-8 text-center border border-[#1A1A1A] rounded-2xl bg-[#0A0A0A] border-dashed">
                <p className="text-[#666666] text-sm">No active plans.</p>
                <p className="text-[#444444] text-xs mt-1">Chat with Max to generate one.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {plans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] flex items-center gap-4 group active:scale-[0.98] transition-transform"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#111111] flex items-center justify-center border border-[#222222]">
                            {getIcon(plan.plan_type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">{plan.title}</h3>
                            <p className="text-[10px] text-[#666666] uppercase tracking-wide mt-0.5">
                                {new Date(plan.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <button
                            disabled={completingId === plan.id}
                            onClick={() => handleComplete(plan.id)}
                            className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#666666] hover:bg-[#00FF94] hover:text-black hover:border-[#00FF94] transition-all"
                        >
                            {completingId === plan.id ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
