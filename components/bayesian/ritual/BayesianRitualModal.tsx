'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Hexagon, Brain, Fingerprint, Calculator, Award } from 'lucide-react'; // Added icons for visual steps
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

const stepConfig: Record<RitualStep, {
    labelKey: string;
    icon: React.ElementType;
    color: string;
    gradient: string
}> = {
    input: {
        labelKey: 'ritual.step.define',
        icon: Brain,
        color: '#2A9D8F',
        gradient: 'from-[#43cea2] to-[#185a9d]' // Teal to Blue
    },
    socratic: {
        labelKey: 'ritual.step.logic',
        icon: Hexagon,
        color: '#E76F51',
        gradient: 'from-[#ff9966] to-[#ff5e62]' // Orange to Red
    },
    evidence: {
        labelKey: 'ritual.step.evidence',
        icon: Fingerprint,
        color: '#264653',
        gradient: 'from-[#603813] to-[#b29f94]' // Earth tones
    },
    calculation: {
        labelKey: 'ritual.step.calibration',
        icon: Calculator,
        color: '#E9C46A',
        gradient: 'from-[#11998e] to-[#38ef7d]' // Green (Matrix-like)
    },
    result: {
        labelKey: 'ritual.step.truth',
        icon: Award,
        color: '#F4A261',
        gradient: 'from-[#fce38a] to-[#f38181]' // Gold/Pink
    }
};

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 20 : -20,
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
        x: direction < 0 ? 20 : -20,
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

    // Calculate progress for the bar
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

    const activeConfig = stepConfig[currentStep];
    const ActiveIcon = activeConfig.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
            {/* Backdrop with High Blur */}
            <div className="absolute inset-0 bg-[#FDFBF7]/90 backdrop-blur-3xl" />

            {/* Main Container - Centered 'Card' */}
            <div className="relative w-full max-w-2xl bg-white border border-[#EBE5da] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:min-h-[600px] sm:aspect-[4/5] lg:aspect-auto transform transition-all">

                {/* Progress Bar (Integrated into top) */}
                <div className="absolute top-0 left-0 w-full h-1 bg-black/5 z-20">
                    <motion.div
                        className="h-full bg-gradient-to-r from-transparent to-white/50"
                        style={{ backgroundColor: activeConfig.color }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step Header (Theme-based) */}
                <div className={`relative h-32 w-full bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-between px-8 text-white transition-all duration-500 overflow-hidden shrink-0`}>
                    {/* Abstract shapes */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl mix-blend-overlay" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl mix-blend-overlay" />

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/20">
                            <ActiveIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                Step {currentStepIndex + 1} of {stepsOrder.length}
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {t(activeConfig.labelKey)}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onCancel}
                        className="relative z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white relative overflow-hidden">
                    <div className="absolute inset-0 overflow-y-auto p-0 sm:p-2">
                        {/* Centered Content Container */}
                        <div className="w-full h-full p-6 sm:p-8 flex flex-col">
                            <AnimatePresence mode="wait" custom={direction} initial={false}>
                                {currentStep === 'input' && (
                                    <motion.div
                                        key="step-input"
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="flex-1 flex flex-col"
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
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="flex-1"
                                    >
                                        <StepSocratic
                                            onComplete={handleSocraticComplete}
                                            onNext={() => { }}
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
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="flex-1"
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
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="flex-1"
                                    >
                                        <StepCalculation
                                            prior={Math.round(ritualData.prior * ritualData.logic_modifier)}
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
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="flex-1"
                                    >
                                        <StepResult
                                            prior={ritualData.prior}
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
            </div>
        </motion.div>
    );
}
