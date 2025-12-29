'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Clock, Check, Plus, Minus, ExternalLink } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Tab component - Industrial Toggle
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-4 text-[10px] font-mono font-bold uppercase tracking-widest transition-all relative ${active ? 'text-black bg-white' : 'text-[#666666] hover:text-white'
                }`}
        >
            {children}
            {active && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00FF94]" />}
        </button>
    );
}

const feedItems = [
    { id: '1', source: 'NATURE', title: 'HRV & Stress Prediction Models', time: '5 MIN' },
    { id: '2', source: 'LANCET', title: 'Vagal Tone Optimization', time: '7 MIN' },
    { id: '3', source: 'JAMA', title: 'Circadian Entrainment Protocols', time: '4 MIN' },
    { id: '4', source: 'CELL', title: 'Mitochondrial Function in Anxiety', time: '6 MIN' },
];

const initialSteps = [
    { id: '1', title: 'MORNING PROTOCOL', time: '0700', completed: true },
    { id: '2', title: 'SUNLIGHT EXPOSURE', time: '0730', completed: true },
    { id: '3', title: 'NON-SLEEP DEEP REST', time: '1400', completed: false },
    { id: '4', title: 'EVENING WIND-DOWN', time: '2100', completed: false },
];

export default function DarkDiscover() {
    const { language } = useI18n();
    const [activeTab, setActiveTab] = useState<'feed' | 'plan'>('feed');
    const [steps, setSteps] = useState(initialSteps);

    const toggleStep = (id: string) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
        Haptics.impact({ style: ImpactStyle.Light });
    };

    return (
        <div className="min-h-screen bg-black flex flex-col pt-12 pb-20">
            {/* Header */}
            <div className="px-5 pb-6 border-b border-[#222222]">
                <h1 className="text-3xl font-sans font-bold tracking-tighter text-white">INTEL</h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#222222]">
                <TabButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')}>
                    DATABASE
                </TabButton>
                <TabButton active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}>
                    PROTOCOL
                </TabButton>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'feed' ? (
                    <div className="divide-y divide-[#111111]">
                        {feedItems.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-5 hover:bg-[#0A0A0A] group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-mono text-[#00FF94] tracking-widest uppercase border border-[#00FF94] px-1">
                                        {item.source}
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-[#444444] group-hover:text-white" />
                                </div>
                                <h3 className="text-base font-bold text-[#E5E5E5] leading-tight mb-2 tracking-tight">
                                    {item.title}
                                </h3>
                                <span className="text-[10px] font-mono text-[#555555] flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> READ TIME: {item.time}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-[#111111]">
                        <div className="p-5 bg-[#007AFF10] border-l-2 border-[#007AFF]">
                            <h4 className="text-[10px] font-mono text-[#007AFF] tracking-widest mb-1">CURRENT STATUS</h4>
                            <p className="text-xl font-bold text-white tracking-tighter">PHASE 2: OPTIMIZATION</p>
                        </div>
                        {steps.map((step, i) => (
                            <button
                                key={step.id}
                                onClick={() => toggleStep(step.id)}
                                className={`w-full p-5 flex items-center justify-between group transition-colors ${step.completed ? 'bg-[#050505]' : 'bg-black hover:bg-[#0A0A0A]'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${step.completed ? 'bg-[#007AFF] border-[#007AFF]' : 'border-[#444444] group-hover:border-white'}`}>
                                        {step.completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-mono uppercase tracking-wide transition-colors ${step.completed ? 'text-[#444444] line-through' : 'text-[#CCCCCC]'}`}>
                                            {step.title}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono text-[#444444] tracking-widest">
                                    {step.time}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
