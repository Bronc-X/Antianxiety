'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BrutalistNav from './BrutalistNav';

interface Plan {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'archived';
    source: string;
    created_at: string;
}

export default function BrutalistPlans() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/brutalist/signup');
                return;
            }

            const { data } = await supabase
                .from('user_plans')
                .select('*')
                .eq('user_id', user.id)
                .neq('status', 'archived')
                .order('created_at', { ascending: false });

            if (data) setPlans(data as Plan[]);
            else {
                // Mock data if empty
                setPlans([
                    {
                        id: 'mock-1',
                        title: 'Morning Sun Protocol',
                        description: 'View AM sunlight for 10-30 minutes within 1 hour of waking.',
                        status: 'active',
                        source: 'Max AI',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'mock-2',
                        title: 'NSDR (Non-Sleep Deep Rest)',
                        description: 'Practice NSDR for 20 mins when feeling afternoon fatigue.',
                        status: 'active',
                        source: 'Huberman',
                        created_at: new Date().toISOString()
                    }
                ]);
            }
            setLoading(false);
        };
        fetchPlans();
    }, [supabase, router]);

    const togglePlan = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'active' : 'completed';

        // Optimistic update
        setPlans(plans.map(p => p.id === id ? { ...p, status: newStatus } : p));

        if (!id.startsWith('mock')) {
            await supabase.from('user_plans').update({ status: newStatus }).eq('id', id);
        }
    };

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
                                            {plan.title}
                                        </h3>
                                        <span className="text-[10px] uppercase tracking-wider bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] px-1.5 py-0.5">
                                            {plan.source}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${plan.status === 'completed' ? 'text-[var(--brutalist-muted)]' : 'text-[var(--brutalist-fg)]/80'}`}>
                                        {plan.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {plans.length === 0 && !loading && (
                        <div className="text-center py-20 border border-dashed border-[var(--brutalist-border)]">
                            <p className="text-[var(--brutalist-muted)] mb-4">NO ACTIVE PROTOCOLS</p>
                            <button onClick={() => router.push('/brutalist/max')} className="brutalist-cta">
                                ASK MAX TO GENERATE PLAN
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
