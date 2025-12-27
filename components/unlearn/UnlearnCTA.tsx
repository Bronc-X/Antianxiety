'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import UnlearnButton from './UnlearnButton';

export default function UnlearnCTA() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Email submitted:', email);
    };

    return (
        <section
            ref={containerRef}
            className="relative py-32 overflow-hidden"
            style={{ backgroundColor: '#0B3D2E' }}
        >
            {/* Gradient Orbs */}
            <div
                className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
                style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
            />
            <div
                className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
                style={{ backgroundColor: 'rgba(212, 175, 55, 0.06)' }}
            />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="relative z-10 max-w-3xl mx-auto px-6 text-center"
            >
                <h2
                    className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-6"
                    style={{ fontSize: 'clamp(36px, 6vw, 56px)' }}
                >
                    Ready to take control of your mental health?
                </h2>
                <p className="text-lg text-white/60 leading-relaxed mb-10 max-w-xl mx-auto">
                    Join thousands of people who are already using Antianxiety to understand their patterns
                    and build lasting resilience.
                </p>

                {/* Email Signup Form */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="
              flex-1 px-5 py-4
              bg-white/10 backdrop-blur-sm
              border border-white/20
              text-white placeholder-white/50
              focus:outline-none focus:border-[#D4AF37]
              transition-colors
            "
                        required
                    />
                    <UnlearnButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        icon="arrow"
                    >
                        Get Started
                    </UnlearnButton>
                </form>

                <p className="text-sm text-white/40 mt-6">
                    Free to start • No credit card required • Cancel anytime
                </p>
            </motion.div>
        </section>
    );
}
