'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export default function VillainSection() {
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
                        The Problem
                    </span>
                    <h2 className="brutalist-h2">
                        The &ldquo;Close Your Rings&rdquo;
                        <br />
                        <span className="text-[#FF4444]">Trap.</span>
                    </h2>
                </motion.div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left - Explanation */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="space-y-6"
                    >
                        <p className="brutalist-body-lg">
                            Conventional fitness apps push for <strong className="text-white">linear progress</strong>.
                            Hit your steps. Burn your calories. Close your rings.
                        </p>
                        <p className="brutalist-body-lg">
                            But your body doesn&apos;t work that way. It functions in <strong className="text-white">cycles</strong>—
                            circadian rhythms, hormonal fluctuations, recovery periods.
                        </p>
                        <p className="brutalist-body-lg">
                            Forcing consistency onto a cyclical system creates one thing:
                            <span className="text-[#FF4444] font-semibold"> cortisol, not fitness.</span>
                        </p>
                    </motion.div>

                    {/* Right - Visual Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="space-y-4"
                    >
                        {/* The Linear Trap */}
                        <div className="brutalist-card border-[#FF4444]/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-[#FF4444]/10 border border-[#FF4444]/30">
                                    <TrendingUp className="w-5 h-5 text-[#FF4444]" />
                                </div>
                                <div>
                                    <h4 className="brutalist-h3 text-[#FF4444] mb-2">Linear Algorithms</h4>
                                    <p className="brutalist-body">
                                        &ldquo;You haven&apos;t closed your rings in 3 days. Are you giving up?&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* The Guilt */}
                        <div className="brutalist-card border-[#FF4444]/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-[#FF4444]/10 border border-[#FF4444]/30">
                                    <AlertTriangle className="w-5 h-5 text-[#FF4444]" />
                                </div>
                                <div>
                                    <h4 className="brutalist-h3 text-[#FF4444] mb-2">Data Anxiety</h4>
                                    <p className="brutalist-body">
                                        Notifications that shame you for resting when your HRV is already crashed.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* The Result */}
                        <div className="brutalist-card border-[#FF4444]/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-[#FF4444]/10 border border-[#FF4444]/30">
                                    <Activity className="w-5 h-5 text-[#FF4444]" />
                                </div>
                                <div>
                                    <h4 className="brutalist-h3 text-[#FF4444] mb-2">Cortisol Spike</h4>
                                    <p className="brutalist-body">
                                        Training through fatigue increases stress hormones, not VO2 max.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
