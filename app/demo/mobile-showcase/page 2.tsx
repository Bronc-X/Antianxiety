'use client';

import React, { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { BiometricGate } from '@/components/auth/BiometricGate';
import { MotionButton } from '@/components/motion/MotionButton';
import { triggerHaptic } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Smartphone, RefreshCw, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function MobileDemoPage() {
    const [items, setItems] = useState([1, 2, 3]);
    const [showGate, setShowGate] = useState(false);

    const handleRefresh = async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setItems(prev => [prev.length + 1, ...prev]);
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-32">
                {/* Header simulating app header */}
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold font-playfair">Mobile Elements</h1>
                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                </div>

                {/* Biometric Gate Demo */}
                {/* To demo the gate, we wrap a modal or section. Here we conditionally show it. */}
                {showGate && (
                    <div className="fixed inset-0 z-50">
                        <BiometricGate>
                            <div className="w-full h-full bg-emerald-50 flex flex-col items-center justify-center p-8">
                                <h2 className="text-2xl font-bold mb-4">Unlocked!</h2>
                                <p className="mb-8">This content was protected.</p>
                                <MotionButton onClick={() => setShowGate(false)}>Close Demo</MotionButton>
                            </div>
                        </BiometricGate>
                    </div>
                )}

                <PullToRefresh onRefresh={handleRefresh}>
                    <div className="p-6 space-y-8">

                        {/* Introduction */}
                        <section className="space-y-2">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" />
                                    Simulation Mode
                                </h3>
                                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                                    Resize your browser to mobile width (or open devtools mobile view) to get the full experience.
                                </p>
                            </div>
                        </section>

                        {/* Haptics Section */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 opacity-50 uppercase tracking-wider text-xs">Tactile Feedback</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <MotionButton
                                    onClick={() => triggerHaptic.tap()}
                                    className="h-24 flex flex-col gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md text-neutral-900 dark:text-white"
                                    variant="ghost"
                                >
                                    <span className="text-xs font-medium text-neutral-500">Tap</span>
                                    <div className="w-2 h-2 rounded-full bg-neutral-400" />
                                </MotionButton>

                                <MotionButton
                                    onClick={() => triggerHaptic.medium()}
                                    className="h-24 flex flex-col gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md text-neutral-900 dark:text-white"
                                    variant="ghost"
                                >
                                    <span className="text-xs font-medium text-neutral-500">Impact</span>
                                    <div className="w-4 h-4 rounded-full bg-neutral-600" />
                                </MotionButton>

                                <MotionButton
                                    onClick={() => triggerHaptic.success()}
                                    className="h-24 flex flex-col gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 shadow-sm text-emerald-900 dark:text-emerald-100"
                                    variant="ghost"
                                >
                                    <span className="text-xs font-medium text-emerald-600">Success</span>
                                    <div className="w-6 h-6 rounded-full bg-emerald-500" />
                                </MotionButton>

                                <MotionButton
                                    onClick={() => triggerHaptic.error()}
                                    className="h-24 flex flex-col gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 shadow-sm text-red-900 dark:text-red-100"
                                    variant="ghost"
                                >
                                    <span className="text-xs font-medium text-red-600">Error</span>
                                    <div className="w-1 h-16 rounded-full bg-red-500 animate-pulse" />
                                </MotionButton>
                            </div>
                        </section>

                        {/* Interaction Section */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 opacity-50 uppercase tracking-wider text-xs">Interactions</h2>
                            <div className="space-y-4">
                                <div
                                    className="p-6 rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-between"
                                    onClick={() => setShowGate(true)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-sm">
                                            <Fingerprint className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Biometric Gate</h3>
                                            <p className="text-sm text-neutral-500">Tap to test lock screen</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-neutral-400" />
                                </div>

                                <div className="p-6 rounded-3xl bg-neutral-100/50 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                                    <RefreshCw className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                                    <p className="text-sm text-neutral-500">Pull down from top to test the refresh animation</p>
                                </div>
                            </div>
                        </section>

                        {/* List Demo for Pull to Refresh */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 opacity-50 uppercase tracking-wider text-xs">Dynamic List</h2>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {items.map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-500">
                                                {i}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">List Item {i}</h4>
                                                <p className="text-xs text-neutral-400">Pull down to add more...</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>

                        <div className="flex justify-center pt-8">
                            <Link href="/">
                                <MotionButton variant="outline" className="gap-2">
                                    <Home className="w-4 h-4" />
                                    Back to Home
                                </MotionButton>
                            </Link>
                        </div>

                    </div>
                </PullToRefresh>
            </div>
        </MobileLayout>
    );
}
