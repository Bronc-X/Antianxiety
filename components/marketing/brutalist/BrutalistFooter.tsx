'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function BrutalistFooter() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        {
            q: 'Why is it called Anti-Anxiety?',
            a: "Because modern fitness technology creates performance anxiety. It gamifies your health, shames you for resting, and optimizes for engagement over wellbeing. We built the antidote.",
        },
        {
            q: 'How is this different from Apple Health or Oura?',
            a: 'They track. We calibrate. They push linear goals. We adapt to your biology. They upload to the cloud. We process 100% on-device.',
        },
        {
            q: 'Is my data really private?',
            a: "Yes. We have no servers. No accounts. No cloud. Your biometric data never leaves your iPhone. We literally cannot access it even if we wanted to.",
        },
        {
            q: 'What does "Bayesian Calibration" mean?',
            a: "It's a statistical method that updates predictions based on new evidence. As we learn more about your body's patterns, our recommendations become increasingly personalized and accurate.",
        },
    ];

    return (
        <footer className="bg-[#050505] border-t border-[#222]">
            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <span className="brutalist-body uppercase tracking-[0.3em] text-[#888] mb-4 block">
                        FAQ
                    </span>
                    <h2 className="brutalist-h2">Questions.</h2>
                </motion.div>

                <div className="space-y-0">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.05 * index }}
                            className="border-b border-[#222]"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                className="w-full py-6 flex items-center justify-between text-left hover:bg-[#0a0a0a] transition-colors px-4 -mx-4"
                            >
                                <span className="brutalist-h3 pr-4">{faq.q}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-[#888] transition-transform shrink-0 ${openFaq === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openFaq === index && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pb-6 px-4 -mx-4"
                                >
                                    <p className="brutalist-body-lg">{faq.a}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="border-t border-[#222] py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <h2 className="brutalist-h2 mb-6">
                            Ready to reclaim
                            <br />
                            <span className="signal-green">your biology?</span>
                        </h2>
                        <p className="brutalist-body-lg mb-8 max-w-xl mx-auto">
                            Join the beta. Limited to 500 users who value privacy over vanity metrics.
                        </p>
                        <button className="brutalist-cta brutalist-cta-filled group">
                            <span>Join the Beta (TestFlight)</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-[#222] py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[#555] text-sm">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-white tracking-tighter">Anti-Anxiety</span>
                        <span>© {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Research</a>
                    </div>
                    <div className="font-mono text-xs">
                        EST. 2024 · Built in 🇨🇳 for 🌍
                    </div>
                </div>
            </div>
        </footer>
    );
}
