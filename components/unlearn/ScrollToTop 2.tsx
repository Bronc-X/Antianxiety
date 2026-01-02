'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket } from 'lucide-react';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 100) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed bottom-24 right-6 z-[100] md:bottom-28 md:right-6 pointer-events-none">
                    <motion.button
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        whileHover={{ scale: 1.1, rotate: -45 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className="
                            pointer-events-auto
                            flex items-center justify-center 
                            w-12 h-12 
                            rounded-full 
                            bg-white/90 dark:bg-zinc-800/90 
                            backdrop-blur-md 
                            border border-zinc-200 dark:border-zinc-700
                            shadow-xl
                            text-[#0B3D2E] dark:text-[#D4AF37]
                            transition-colors
                        "
                        aria-label="Scroll to top"
                    >
                        <Rocket className="w-5 h-5 -rotate-45" strokeWidth={2.5} />
                    </motion.button>
                </div>
            )}
        </AnimatePresence>
    );
}
