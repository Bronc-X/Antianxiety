'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function BrutalistHero() {
    return (
        <section className="brutalist-section min-h-screen flex items-center pt-20 relative overflow-hidden">
            {/* Ambient Glow - Behind everything */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[150px] animate-pulse" style={{ background: 'rgba(0, 255, 148, 0.08)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(34, 211, 238, 0.08)', animationDelay: '1s' }} />
            </div>

            <div className="max-w-6xl mx-auto w-full relative" style={{ zIndex: 10 }}>
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
                            <span className="inline-flex items-center gap-2 brutalist-badge brutalist-neon-border">
                                <Sparkles className="w-3 h-3" />
                                Bio-Digital Twin
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.1, type: "spring", stiffness: 50 }}
                            className="brutalist-h1 mb-8"
                            style={{ color: '#FFFFFF' }}
                        >
                            <span className="block">Optimization,</span>
                            <span className="block brutalist-muted-text">Minus the</span>
                            <motion.span
                                className="block"
                                style={{
                                    background: 'linear-gradient(90deg, #00FF94, #22D3EE, #00FF94)',
                                    backgroundSize: '200% 100%',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                                animate={{
                                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                                Anxiety.
                            </motion.span>
                        </motion.h1>

                        {/* Subhead */}
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="brutalist-body-lg max-w-xl mb-12"
                            style={{ color: '#CCCCCC' }}
                        >
                            The world&apos;s first Bio-Digital Twin that runs <span style={{ color: '#FFFFFF', fontWeight: 600 }}>100% on-device</span>.
                            Stop chasing linear algorithms. Start listening to your biology.
                        </motion.p>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-wrap gap-4"
                        >
                            <motion.a
                                href="/brutalist/signup"
                                className="brutalist-cta brutalist-cta-filled group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>Request Access</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </motion.a>
                            <motion.a
                                href="#demo"
                                className="brutalist-cta group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>Try Demo</span>
                            </motion.a>
                        </motion.div>
                    </div>

                    {/* Right Column - Stats with Animation */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.5, type: "spring" }}
                        className="hidden lg:block space-y-8 border-l border-[#2A2A2A] pl-8"
                    >
                        {[
                            { value: '100%', label: 'On-Device Processing', delay: 0 },
                            { value: '0', label: 'Cloud Dependencies', delay: 0.1 },
                            { value: '∞', label: 'Privacy by Design', delay: 0.2, isGreen: true },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 + stat.delay }}
                                className="brutalist-float"
                                style={{ animationDelay: `${i * 0.5}s` }}
                            >
                                <div className={`text-5xl font-bold tracking-tight ${stat.isGreen ? 'signal-green' : ''}`}>
                                    {stat.value}
                                </div>
                                <div className="brutalist-body mt-2">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-xs text-[#555] uppercase tracking-wider">Scroll</span>
                    <motion.div
                        className="w-px h-8 bg-gradient-to-b from-[#00FF94] to-transparent"
                        animate={{ scaleY: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>
            </div>
        </section>
    );
}
