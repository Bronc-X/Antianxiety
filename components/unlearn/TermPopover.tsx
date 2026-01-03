'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface TermPopoverProps {
    term: string;
    title: string;
    description: React.ReactNode;
}

export default function TermPopover({ term, title, description }: TermPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLSpanElement>(null);
    const isTouch = useRef(false);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <span
            className="relative inline-block"
            ref={containerRef}
            onTouchStart={() => { isTouch.current = true; }}
            onMouseEnter={() => { if (!isTouch.current) setIsOpen(true); }}
            onMouseLeave={() => setIsOpen(false)}
        >
            <span
                className="cursor-pointer inline-flex items-center border-b-[1.5px] border-dotted border-[#D4AF37]/60 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-300 pb-0.5 select-none gap-1 group relative leading-none"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
            >
                <span className="font-medium text-[#0B3D2E] group-hover:text-[#D4AF37] transition-colors">{term}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-white transition-colors transform translate-y-0.5"
                >
                    <ChevronDown className="w-2.5 h-2.5" strokeWidth={3} />
                </motion.span>
            </span>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] max-w-[92vw] md:w-[380px]"
                    >
                        <div className="relative group/card cursor-default">
                            {/* Premium Gradient Border */}
                            <div className="absolute -inset-[1px] bg-gradient-to-br from-[#D4AF37]/40 via-[#ffffff]/20 to-[#0B3D2E]/20 rounded-xl blur-sm opacity-50 group-hover/card:opacity-100 transition-opacity duration-500" />

                            <div className="relative bg-[#FAF6EF]/95 dark:bg-[#0B3D2E]/95 backdrop-blur-2xl p-5 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-[#D4AF37]/20">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                <h4 className="font-serif italic font-bold text-lg text-[#0B3D2E] mb-2 pb-2 border-b border-[#0B3D2E]/10 flex items-start justify-between gap-2">
                                    <span className="flex-1 break-words hyphens-auto leading-tight min-w-0 pr-1">{title}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                                </h4>

                                <div className="text-xs text-[#0B3D2E]/80 leading-relaxed font-sans text-justify space-y-2 relative z-10 whitespace-normal break-words">
                                    {description}
                                </div>
                            </div>

                            {/* Arrow (Top) */}
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FAF6EF] -rotate-45 border-t border-r border-[#D4AF37]/20 z-50" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}
