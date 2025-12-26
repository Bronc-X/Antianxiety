'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function BrutalistNav() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-sm border-b border-[#222222]">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo - Left */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center"
                >
                    <span className="text-xl font-bold tracking-tighter text-white">
                        Anti-Anxiety
                    </span>
                </motion.div>

                {/* Status Badge - Right */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="brutalist-badge"
                >
                    <Lock className="w-3 h-3" />
                    <span>Local Vault: Active</span>
                </motion.div>
            </div>
        </nav>
    );
}
