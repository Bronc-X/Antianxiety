'use client';

import { motion } from 'framer-motion';
import { Shield, Smartphone, Lock, FileCheck } from 'lucide-react';

export default function PrivacySection() {
    const features = [
        {
            icon: Shield,
            title: 'No Cloud Uploads',
            desc: 'Your biometrics never leave your device. Zero telemetry. Zero tracking.',
        },
        {
            icon: Smartphone,
            title: 'No Account Required',
            desc: 'Start using immediately. No email. No sign-up. Just you and your data.',
        },
        {
            icon: Lock,
            title: 'On-Device AI',
            desc: 'All inference runs locally. Your health patterns stay private.',
        },
        {
            icon: FileCheck,
            title: 'GDPR Compliant by Design',
            desc: "Can't sell what we don't have. Privacy isn't a feature—it's the architecture.",
        },
    ];

    return (
        <section className="brutalist-section bg-[#00FF94]/5">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-16 text-center"
                >
                    <span className="brutalist-badge mb-6 inline-flex">
                        <Lock className="w-3 h-3" />
                        <span>Privacy First</span>
                    </span>
                    <h2 className="brutalist-h2">
                        What happens on your iPhone,
                        <br />
                        <span className="signal-green">stays on your iPhone.</span>
                    </h2>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="grid md:grid-cols-2 gap-1 bg-[#222] p-1"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                            className="bg-[#050505] p-8 hover:bg-[#0a0a0a] transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 border border-[#00FF94]/50 signal-green-glow">
                                    <feature.icon className="w-5 h-5 signal-green" />
                                </div>
                                <div>
                                    <h4 className="brutalist-h3 signal-green mb-2">{feature.title}</h4>
                                    <p className="brutalist-body">{feature.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <p className="brutalist-body-lg max-w-2xl mx-auto">
                        In an era of data breaches and invasive health tracking,
                        we chose a different path: <strong className="signal-green">yours.</strong>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
