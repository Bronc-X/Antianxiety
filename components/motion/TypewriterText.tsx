'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export default function TypewriterText({ text, className = '', delay = 0 }: TypewriterTextProps) {
    const words = text.split(' ');

    // Stagger effect for words
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: delay
            }
        }
    };

    const child = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100
            }
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className={`flex flex-wrap gap-x-1.5 ${className}`}
        >
            {words.map((word, i) => (
                <motion.span key={i} variants={child} className="inline-block">
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
}
