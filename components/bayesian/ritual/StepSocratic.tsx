'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldAlert, BadgeCheck, MessageSquare, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface StepSocraticProps {
    onComplete: (data: {
        phantom_definition: string;
        worst_case_reality: boolean;
        objective_perspective: string;
        logic_score: number;
    }) => void;
    onNext: () => void;
}

export default function StepSocratic({ onComplete, onNext }: StepSocraticProps) {
    const { t } = useI18n();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        phantom: '',
        history: false,
        friend: ''
    });

    const handleNext = () => {
        if (step < 2) {
            setStep(prev => prev + 1);
        } else {
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
            title: t('ritual.socratic.q1.title') || "Define the Phantom",
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
        <div className="flex flex-col h-full w-full justify-center">

            {/* Progress Dots - simplified */}
            <div className="flex justify-center gap-2 mb-8">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${i === step ? 'bg-[#E76F51] scale-125' : 'bg-[#E76F51]/20'}`}
                    />
                ))}
            </div>

            {/* Content Area */}
            <div className="relative w-full max-w-xl mx-auto min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-[#E76F51]/10 flex items-center justify-center text-[#E76F51]">
                                <currentQ.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#2D3436] tracking-tight">{currentQ.title}</h3>
                        </div>

                        <p className="text-[#2D3436]/70 text-lg mb-8 leading-relaxed font-medium">
                            {currentQ.subtitle}
                        </p>

                        <div className="mb-8">
                            {currentQ.type === 'text' ? (
                                <textarea
                                    value={currentQ.id === 'phantom' ? answers.phantom : answers.friend}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                                    placeholder={currentQ.placeholder}
                                    className="w-full h-40 p-5 rounded-2xl bg-[#F8F9FA] border-2 border-transparent focus:border-[#E76F51]/20 focus:bg-white text-[#2D3436] placeholder:text-[#B2BEC3] focus:outline-none transition-all resize-none text-lg shadow-inner"
                                    autoFocus
                                />
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setAnswers(prev => ({ ...prev, history: true }))}
                                        className={`group p-6 rounded-2xl border-2 transition-all text-center relative overflow-hidden ${answers.history ? 'border-[#E76F51] bg-[#E76F51] text-white shadow-lg shadow-[#E76F51]/30' : 'border-[#E76F51]/10 hover:border-[#E76F51]/40 hover:bg-[#E76F51]/5 text-[#2D3436]'}`}
                                    >
                                        {answers.history && <Check className="absolute top-3 right-3 w-5 h-5 text-white/50" />}
                                        <span className="block text-xl font-bold mb-1">Yes</span>
                                        <span className={`text-xs uppercase tracking-wide font-bold ${answers.history ? 'text-white/80' : 'text-[#2D3436]/40'}`}>It has happened</span>
                                    </button>

                                    <button
                                        onClick={() => setAnswers(prev => ({ ...prev, history: false }))}
                                        className={`group p-6 rounded-2xl border-2 transition-all text-center relative overflow-hidden ${answers.history === false ? 'border-[#E76F51] bg-[#E76F51] text-white shadow-lg shadow-[#E76F51]/30' : 'border-[#E76F51]/10 hover:border-[#E76F51]/40 hover:bg-[#E76F51]/5 text-[#2D3436]'}`}
                                    >
                                        {answers.history === false && <Check className="absolute top-3 right-3 w-5 h-5 text-white/50" />}
                                        <span className="block text-xl font-bold mb-1">No</span>
                                        <span className={`text-xs uppercase tracking-wide font-bold ${answers.history === false ? 'text-white/80' : 'text-[#2D3436]/40'}`}>Never happened</span>
                                    </button>
                                </div>
                            )}
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-auto pt-4">
                <button
                    onClick={handleNext}
                    disabled={currentQ.type === 'text' && (currentQ.id === 'phantom' ? !answers.phantom : !answers.friend)}
                    className="flex items-center gap-2 px-8 py-3 bg-[#2D3436] text-white rounded-full font-bold shadow-lg hover:bg-[#000] hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                    <span>{step === 2 ? t('ritual.button.analyze') : t('ritual.button.next')}</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
