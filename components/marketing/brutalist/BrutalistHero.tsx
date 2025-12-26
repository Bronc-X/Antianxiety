'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function BrutalistHero() {
    return (
        <section className="brutalist-section min-h-screen flex items-center pt-20">
            <div className="max-w-6xl mx-auto w-full">
                <div className="grid lg:grid-cols-[2fr,1fr] gap-12 items-end">
                    {/* Main Content */}
                    <div>
                        {/* Eyebrow */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <span className="brutalist-body uppercase tracking-[0.3em] text-[#888]">
                                Bio-Digital Twin
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="brutalist-h1 mb-8"
                        >
                            Optimization,
                            <br />
                            <span className="text-[#888]">Minus the</span>
                            <br />
                            Anxiety.
                        </motion.h1>

                        {/* Subhead */}
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="brutalist-body-lg max-w-xl mb-12"
                        >
                            The world's first Bio-Digital Twin that runs 100% on-device.
                            Stop chasing linear algorithms. Start listening to your biology.
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <a href="/brutalist/signup" className="brutalist-cta group inline-flex">
                                <span>Request Access</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </a>
                        </motion.div>
                    </div>

                    {/* Right Column - Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="hidden lg:block space-y-8 border-l border-[#222] pl-8"
                    >
                        <div>
                            <div className="text-5xl font-bold tracking-tight">100%</div>
                            <div className="brutalist-body mt-2">On-Device Processing</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold tracking-tight">0</div>
                            <div className="brutalist-body mt-2">Cloud Dependencies</div>
                        </div>
                        <div>
                            <div className="text-5xl font-bold tracking-tight signal-green">∞</div>
                            <div className="brutalist-body mt-2">Privacy by Design</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
