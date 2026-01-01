'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BrutalistNav from './BrutalistNav';
import { usePlans } from '@/hooks/domain/usePlans';
import { useAuth } from '@/hooks/domain/useAuth';

export default function BrutalistPlans() {
    const router = useRouter();
    const { plans, isLoading, isSaving, error, complete, resume } = usePlans();
    const { isLoading: authLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/brutalist/signup');
        }
    }, [authLoading, isAuthenticated, router]);

    const togglePlan = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'active' : 'completed';

        if (newStatus === 'completed') {
            await complete(id);
        } else {
            await resume(id);
        }
    };

    if (isLoading || authLoading) {
        return (
            <div className="brutalist-page min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00FF94] border-t-transparent rounded-full animate-spin animate-pulse" />
            </div>
        );
    }

    return (
        <div className="brutalist-page min-h-screen">
            <BrutalistNav />
            <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="brutalist-h2 mb-2">Protocols</h1>
                        <p className="text-[var(--brutalist-muted)] text-sm font-mono">active behavioral modifications.</p>
                    </div>
                </header>

                <div className="space-y-4">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`group relative border p-6 transition-all ${plan.status === 'completed'
                                    ? 'border-[var(--signal-green)] bg-[var(--signal-green)]/5 opacity-70'
                                    : 'border-[var(--brutalist-border)] bg-[var(--brutalist-card-bg)] hover:border-[var(--brutalist-fg)]'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => togglePlan(plan.id, plan.status)}
                                    disabled={isSaving}
                                    className={`flex-shrink-0 w-6 h-6 border flex items-center justify-center transition-colors ${plan.status === 'completed'
                                            ? 'bg-[var(--signal-green)] border-[var(--signal-green)] text-black'
                                            : 'border-[var(--brutalist-muted)] hover:border-[var(--brutalist-fg)]'
                                        }`}
                                >
                                    {plan.status === 'completed' && <Check className="w-4 h-4" />}
                                </button>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold text-lg mb-2 ${plan.status === 'completed' ? 'line-through text-[var(--brutalist-muted)]' : ''}`}>
                                            {plan.name}
                                        </h3>
                                        <span className="text-[10px] uppercase tracking-wider bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] px-1.5 py-0.5">
                                            {plan.category}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${plan.status === 'completed' ? 'text-[var(--brutalist-muted)]' : 'text-[var(--brutalist-fg)]/80'}`}>
                                        {plan.description || 'No description'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {plans.length === 0 && !isLoading && (
                        <div className="text-center py-20 border border-dashed border-[var(--brutalist-border)]">
                            <p className="text-[var(--brutalist-muted)] mb-4">NO ACTIVE PROTOCOLS</p>
                            <button onClick={() => router.push('/brutalist/max')} className="brutalist-cta">
                                ASK MAX TO GENERATE PLAN
                            </button>
                        </div>
                    )}
                </div>
                {error && (
                    <div className="mt-6 text-center text-xs text-red-400">{error}</div>
                )}
            </main>
        </div>
    );
}
