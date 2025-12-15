'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, ShieldAlert, BadgeCheck, MessageSquare } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StepSocraticProps {
    onComplete: (data: {
        phantom_definition: string;
        worst_case_reality: boolean;
        objective_perspective: string;
        logic_score: number; // 0-1 score reducing the prior
    }) => void;
    onNext: () => void;
}

export default function StepSocratic({ onComplete, onNext }: StepSocraticProps) {
    const { t } = useI18n();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        phantom: '',
        history: false, // Has this actually happened before?
        friend: ''      // What would you tell a friend?
    });

    const handleNext = () => {
        if (step < 2) {
            setStep(prev => prev + 1);
        } else {
            // Calculate pseudo "Logic Score" to help reduce anxiety
            // If it hasn't happened before, logic score is higher (more effective at reduction)
            const logicScore = answers.history ? 0.6 : 0.9;

            onComplete({
                phantom_definition: answers.phantom,
                worst_case_reality: answers.history,
                objective_perspective: answers.friend,
                logic_score: logicScore
            });
            onNext();
        }
    };

    const questions = [
        {
            id: 'phantom',
            icon: ShieldAlert,
            title: t('ritual.socratic.q1.title') || "Define the Phantom", // Fallback if key missing
            subtitle: t('ritual.socratic.q1.subtitle') || "What is the absolute worst-case scenario you are fearing?",
            type: 'text',
            placeholder: "e.g., Everyone will laugh and I'll lose my job..."
        },
        {
            id: 'history',
            icon: BadgeCheck,
            title: t('ritual.socratic.q2.title') || "Reality Check",
            subtitle: t('ritual.socratic.q2.subtitle') || "Has this worst-case scenario actually happened to you before?",
            type: 'boolean'
        },
        {
            id: 'friend',
            icon: MessageSquare,
            title: t('ritual.socratic.q3.title') || "Objective Shift",
            subtitle: t('ritual.socratic.q3.subtitle') || "If a friend had this exact worry, what would you tell them?",
            type: 'text',
            placeholder: "e.g., You're overthinking it, you're prepared..."
        }
    ];

    const currentQ = questions[step];

    return (
        <div className="flex flex-col h-full pt-4 md:pt-10 max-w-2xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="inline-block px-3 py-1 rounded-full bg-[#9CAF88]/10 text-[#0B3D2E] text-xs font-medium tracking-wider mb-4 border border-[#9CAF88]/20">
                    PHASE 1.5 : LOGIC EXAMINATION
                </div>
                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-4">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#0B3D2E]' : 'bg-[#E7E1D6]'}`} />
                    ))}
                </div>
            </motion.div>

            {/* Question Card - Card Stack Effect */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ x: 100, opacity: 0, rotate: 5, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ x: -100, opacity: 0, rotate: -5, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="bg-white rounded-2xl p-8 border border-[#E7E1D6] shadow-2xl shadow-[#0B3D2E]/5 min-h-[300px] flex flex-col origin-bottom"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[#FAF6EF] flex items-center justify-center border border-[#E7E1D6]">
                            <currentQ.icon className="w-6 h-6 text-[#0B3D2E]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif text-[#0B3D2E]">{currentQ.title}</h3>
                        </div>
                    </div>

                    <p className="text-[#0B3D2E]/70 mb-8 text-lg">{currentQ.subtitle}</p>

                    <div className="flex-1">
                        {currentQ.type === 'text' ? (
                            <textarea
                                value={currentQ.id === 'phantom' ? answers.phantom : answers.friend}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                                placeholder={currentQ.placeholder}
                                className="w-full h-32 p-4 rounded-xl bg-[#FAF6EF] border-0 text-[#0B3D2E] placeholder:text-[#0B3D2E]/30 focus:ring-1 focus:ring-[#0B3D2E] resize-none transform transition-transform focus:scale-[1.01]"
                                autoFocus
                            />
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setAnswers(prev => ({ ...prev, history: true }));
                                    }}
                                    className={`p-6 rounded-xl border-2 transition-all text-center transform hover:scale-105 active:scale-95 ${answers.history ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-lg' : 'border-[#E7E1D6] text-[#0B3D2E] hover:border-[#0B3D2E]/30'}`}
                                >
                                    <span className="block text-lg font-medium mb-1">Yes</span>
                                    <span className="text-xs opacity-70">It has happened</span>
                                </button>
                                <button
                                    onClick={() => setAnswers(prev => ({ ...prev, history: false }))}
                                    className={`p-6 rounded-xl border-2 transition-all text-center transform hover:scale-105 active:scale-95 ${!answers.history ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white shadow-lg' : 'border-[#E7E1D6] text-[#0B3D2E] hover:border-[#0B3D2E]/30'}`}
                                >
                                    <span className="block text-lg font-medium mb-1">No</span>
                                    <span className="text-xs opacity-70">Never happened</span>
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={handleNext}
                    disabled={currentQ.type === 'text' && (currentQ.id === 'phantom' ? !answers.phantom : !answers.friend)}
                    className="group flex items-center gap-2 px-8 py-4 bg-[#0B3D2E] text-[#FAF6EF] rounded-xl hover:bg-[#154a3a] transition-all shadow-lg shadow-[#0B3D2E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-sm font-medium tracking-wider uppercase">
                        {step === 2 ? 'Complete Analysis' : 'Next Question'}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
}
