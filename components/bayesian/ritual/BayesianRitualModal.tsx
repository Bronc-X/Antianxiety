'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import StepInput from '@/components/bayesian/ritual/StepInput';
import StepSocratic from '@/components/bayesian/ritual/StepSocratic';
import StepEvidence from '@/components/bayesian/ritual/StepEvidence';
import StepCalculation from '@/components/bayesian/ritual/StepCalculation';
import StepResult from '@/components/bayesian/ritual/StepResult';
import { BeliefOutput, Paper } from '@/types/max';
import { useI18n } from '@/lib/i18n';

interface BayesianRitualModalProps {
    onComplete: (result: BeliefOutput) => void;
    onCancel: () => void;
    mockHrv?: boolean;
}

// Stages of the ritual
type RitualStep = 'input' | 'socratic' | 'evidence' | 'calculation' | 'result';

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0,
        scale: 0.98
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0,
        scale: 0.98
    })
};

export default function BayesianRitualModal({ onComplete, onCancel, mockHrv = false }: BayesianRitualModalProps) {
    const { t } = useI18n();
    const [currentStep, setCurrentStep] = useState<RitualStep>('input');
    const [direction, setDirection] = useState(0);

    // Data Accumulator
    const [ritualData, setRitualData] = useState({
        prior: 70, // Default 70% anxiety
        worry: '',

        // Socratic Data
        phantom: '',
        history: false,
        friend_perspective: '',
        logic_modifier: 1, // 1 = no change, <1 reduces prior

        // Evidence Data
        hrv: { rmssd: 0, lf_hf: 0, score: 0 },
        papers: [] as Paper[],

        // Results
        likelihood: 0,
        evidenceWeight: 0,
        posterior: 0
    });

    const [isCalculating, setIsCalculating] = useState(false);

    // Navigation Handlers
    const stepsOrder: RitualStep[] = ['input', 'socratic', 'evidence', 'calculation', 'result'];
    const currentStepIndex = stepsOrder.indexOf(currentStep);
    const progress = ((currentStepIndex + 1) / stepsOrder.length) * 100;

    const goToStep = (step: RitualStep) => {
        const newIndex = stepsOrder.indexOf(step);
        setDirection(newIndex > currentStepIndex ? 1 : -1);
        setCurrentStep(step);
    };

    const handleInputComplete = (data: { prior: number; worry: string }) => {
        setRitualData(prev => ({ ...prev, ...data }));
        goToStep('socratic');
    };

    const handleSocraticComplete = (data: { phantom_definition: string; worst_case_reality: boolean; objective_perspective: string; logic_score: number }) => {
        setRitualData(prev => ({
            ...prev,
            phantom: data.phantom_definition,
            history: data.worst_case_reality,
            friend_perspective: data.objective_perspective,
            logic_modifier: data.logic_score
        }));
        // Proceed to evidence gathering
        goToStep('evidence');
    };

    const handleEvidenceCollected = (data: { hrv: any; papers: Paper[]; likelihood: number; evidenceWeight: number }) => {
        setRitualData(prev => ({
            ...prev,
            hrv: data.hrv,
            papers: data.papers,
            likelihood: data.likelihood,
            evidenceWeight: data.evidenceWeight
        }));
        goToStep('calculation');
    };

    const handleCalculationStart = async () => {
        setIsCalculating(true);
        try {
            // Adjust prior based on logic check
            // If logic was strong, the "effective prior" entering the formula is lower
            const effectivePrior = Math.round(ritualData.prior * ritualData.logic_modifier);

            const response = await fetch('/api/max/belief', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prior: effectivePrior, // Use modified prior
                    hrv_data: ritualData.hrv,
                    paper_ids: ritualData.papers.map(p => p.id),
                    belief_text: ritualData.worry
                })
            });

            if (!response.ok) throw new Error('Calculation failed');

            const result = await response.json();

            // Artificial delay for the "magic" feeling if API is too fast
            await new Promise(r => setTimeout(r, 1500));

            setRitualData(prev => ({
                ...prev,
                posterior: result.calculation.posterior,
                likelihood: result.calculation.likelihood,
                evidenceWeight: result.calculation.evidence
            }));

            setIsCalculating(false);
            goToStep('result');

        } catch (error) {
            console.error(error);
            setIsCalculating(false);
            // Fallback for demo/offline
            const fallbackPosterior = Math.round((ritualData.prior * 0.4 * ritualData.logic_modifier) / (0.4 * ritualData.prior + 0.1 * (100 - ritualData.prior)) * 100);
            setRitualData(prev => ({
                ...prev,
                posterior: Math.min(fallbackPosterior, 100),
                likelihood: 0.4,
                evidenceWeight: 0.8
            }));
            goToStep('result');
        }
    };

    useEffect(() => {
        if (currentStep !== 'calculation') return;
        if (isCalculating) return;
        if (ritualData.posterior !== 0) return;
        const timer = setTimeout(() => {
            void handleCalculationStart();
        }, 100);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, isCalculating, ritualData.posterior]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
        >
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-[#FAF6EF]/90 backdrop-blur-3xl" />

            {/* Main Container */}
            <div className="relative w-full h-full max-w-6xl bg-white/40 border border-[#E7E1D6] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/50 hover:bg-white text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-all"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Left Panel: Context/Nav (Hidden on mobile) */}
                <div className="hidden md:flex w-1/4 bg-[#FAF6EF] border-r border-[#E7E1D6] flex-col p-8 justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CAF88]/10 rounded-full blur-3xl -mr-32 -mt-10 pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-2 text-[#0B3D2E] font-serif text-xl mb-12">
                            <ChevronLeft className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100" onClick={onCancel} />
                            <span>{t('ritual.title')}</span>
                        </div>

                        <div className="space-y-8">
                            {[
                                t('ritual.step.define'),
                                t('ritual.step.logic'),
                                t('ritual.step.evidence'),
                                t('ritual.step.calibration'),
                                t('ritual.step.truth')
                            ].map((step, idx) => (
                                <div key={step} className="flex items-center gap-4 group">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${idx === currentStepIndex
                                        ? 'bg-[#0B3D2E] text-[#FAF6EF] shadow-lg shadow-[#0B3D2E]/20 scale-110'
                                        : idx < currentStepIndex
                                            ? 'bg-[#9CAF88] text-white'
                                            : 'bg-[#E7E1D6] text-[#0B3D2E]/40'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${idx === currentStepIndex ? 'text-[#0B3D2E]' : 'text-[#0B3D2E]/40'
                                        }`}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-xs text-[#0B3D2E]/30 leading-relaxed">
                        {t('ritual.quote.text')}
                        <br />{t('ritual.quote.author')}
                    </div>
                </div>

                {/* Right Panel: Active Step */}
                <div className="flex-1 relative flex flex-col bg-white/60">
                    {/* Top Progress Bar (Mobile) */}
                    <div className="md:hidden w-full h-1 bg-[#E7E1D6]">
                        <motion.div
                            className="h-full bg-[#0B3D2E]"
                            animate={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex-1 p-6 md:p-12 overflow-y-auto overflow-x-hidden relative">
                        <AnimatePresence mode="wait" custom={direction} initial={false}>
                            {currentStep === 'input' && (
                                <motion.div
                                    key="step-input"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="w-full h-full"
                                >
                                    <StepInput
                                        worry={ritualData.worry}
                                        prior={ritualData.prior}
                                        onChange={(updates) => setRitualData((prev) => ({ ...prev, ...updates }))}
                                        onNext={() => handleInputComplete({ prior: ritualData.prior, worry: ritualData.worry })}
                                    />
                                </motion.div>
                            )}
                            {currentStep === 'socratic' && (
                                <motion.div
                                    key="step-socratic"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="w-full h-full"
                                >
                                    <StepSocratic
                                        onComplete={handleSocraticComplete}
                                        onNext={() => { }} // Internal next handling
                                    />
                                </motion.div>
                            )}
                            {currentStep === 'evidence' && (
                                <motion.div
                                    key="step-evidence"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="w-full h-full"
                                >
                                    <StepEvidence
                                        onEvidenceCollected={handleEvidenceCollected}
                                        onNext={() => goToStep('calculation')}
                                    />
                                </motion.div>
                            )}
                            {currentStep === 'calculation' && (
                                <motion.div
                                    key="step-calc"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="w-full h-full"
                                >
                                    <StepCalculation
                                        prior={Math.round(ritualData.prior * ritualData.logic_modifier)} // Show MODIFIED prior
                                        likelihood={ritualData.likelihood}
                                        evidence={ritualData.evidenceWeight}
                                        posterior={ritualData.posterior}
                                        onNext={() => goToStep('result')}
                                    />
                                </motion.div>
                            )}
                            {currentStep === 'result' && (
                                <motion.div
                                    key="step-result"
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="w-full h-full"
                                >
                                    <StepResult
                                        prior={ritualData.prior} // Show ORIGINAL prior for contrast
                                        posterior={ritualData.posterior}
                                        worry={ritualData.worry}
                                        onComplete={() => onComplete({
                                            prior: ritualData.prior,
                                            likelihood: ritualData.likelihood,
                                            evidence: ritualData.evidenceWeight,
                                            posterior: ritualData.posterior,
                                            papers_used: ritualData.papers,
                                            calculation_steps: []
                                        })}
                                        onRedo={() => goToStep('input')}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
