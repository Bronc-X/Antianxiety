'use client';

import React, { useEffect, useState } from 'react';

interface MatrixTextProps {
    text: string;
    className?: string;
    speed?: number; // ms per char reveal
}

export default function MatrixText({ text, className = '', speed = 50 }: MatrixTextProps) {
    const [displayGiven, setDisplayGiven] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Characters to cycle through for the "decoding" effect
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

    useEffect(() => {
        let currentIndex = 0;
        let iteration = 0;

        const interval = setInterval(() => {
            setDisplayGiven(() => {
                const result = text.split('').map((char, index) => {
                    if (index < currentIndex) {
                        return text[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');

                return result;
            });

            // Logic to advance the clear text index
            // We want a "wave" of random chars that settles into the real text
            if (iteration > 2) { // Allow some scrambling first
                currentIndex += 1; // Reveal one real char per few frames
                iteration = 0;
            } else {
                iteration++;
            }

            if (currentIndex > text.length) {
                setIsComplete(true);
                clearInterval(interval);
                setDisplayGiven(text);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return (
        <span className={`font-mono ${className}`}>
            {displayGiven}
            {!isComplete && <span className="animate-pulse bg-green-500 inline-block w-2 h-4 ml-1 align-middle" />}
        </span>
    );
}
