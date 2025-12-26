'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Moon, Zap } from 'lucide-react';

export default function BayesianSection() {
    return (
        <section className="brutalist-section">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-16"
                >
                    <span className="brutalist-body uppercase tracking-[0.3em] text-[#888] mb-4 block">
                        The Solution
                    </span>
                    <h2 className="brutalist-h2">
                        Bayesian
                        <br />
                        <span className="signal-green">Calibration.</span>
                    </h2>
                </motion.div>

                {/* Flow Diagram */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="mb-16"
                >
                    <div className="brutalist-flow justify-center flex-wrap gap-4 md:gap-6">
                        {/* Node 1 */}
                        <div className="brutalist-flow-node text-center">
                            <div className="text-xs text-[#888] mb-1">INPUT</div>
                            <div className="text-white font-semibold">HRV Drop</div>
                            <div className="text-xs text-[#888] mt-1">-15% from baseline</div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="brutalist-flow-arrow hidden md:block" />

                        {/* Node 2 */}
                        <div className="brutalist-flow-node text-center border-[#00FF94]/30">
                            <div className="text-xs text-[#888] mb-1">PROCESS</div>
                            <div className="signal-green font-semibold">Bayesian Filter</div>
                            <div className="text-xs text-[#888] mt-1">P(fatigue|data)</div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="brutalist-flow-arrow hidden md:block" />

                        {/* Node 3 */}
                        <div className="brutalist-flow-node text-center border-[#00FF94]/50 signal-green-glow">
                            <div className="text-xs text-[#888] mb-1">OUTPUT</div>
                            <div className="signal-green font-bold">Rest Day</div>
                            <div className="text-xs text-[#888] mt-1">Goal adjusted</div>
                        </div>
                    </div>
                </motion.div>

                {/* Tagline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center mb-16"
                >
                    <p className="brutalist-h3 text-white">
                        Permission to rest, <span className="signal-green">backed by math.</span>
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="grid md:grid-cols-2 gap-4"
                >
                    <div className="brutalist-card">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#00FF94]/10 border border-[#00FF94]/30">
                                <Moon className="w-5 h-5 signal-green" />
                            </div>
                            <div>
                                <h4 className="brutalist-h3 mb-2">Dynamic Recovery</h4>
                                <p className="brutalist-body">
                                    We use probabilistic inference to detect when your nervous system
                                    is in parasympathetic deficit—and adjust your goals automatically.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="brutalist-card">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#00FF94]/10 border border-[#00FF94]/30">
                                <Zap className="w-5 h-5 signal-green" />
                            </div>
                            <div>
                                <h4 className="brutalist-h3 mb-2">Peak Day Detection</h4>
                                <p className="brutalist-body">
                                    When all signals align—high HRV, good sleep, low stress—we push
                                    you harder. The right intensity at the right time.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
