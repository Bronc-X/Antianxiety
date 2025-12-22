'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BrainCircuit, CheckCircle2 } from 'lucide-react';

interface AIThinkingBlockProps {
    thought?: string;
    isThinking: boolean;
    defaultExpanded?: boolean;
}

/**
 * AIThinkingBlock
 * 
 * A DeepSeek-style collapsible block for displaying AI's thinking/reasoning process.
 * Features premium glassmorphism design and smooth animations.
 */
export function AIThinkingBlock({
    thought,
    isThinking,
    defaultExpanded = true
}: AIThinkingBlockProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // If no thought and not thinking, don't show anything
    if (!thought && !isThinking) return null;

    return (
        <div className="my-2 overflow-hidden rounded-xl border border-emerald-100/50 bg-emerald-50/30 backdrop-blur-sm">
            {/* Header / Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isThinking ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                            <BrainCircuit className="w-3.5 h-3.5" />
                        </motion.div>
                    ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>{isThinking ? 'Max 正在思考...' : '思考过程'}</span>
                </div>

                <div className="flex items-center gap-2 opacity-60">
                    <span className="text-[10px]">{isExpanded ? '收起' : '查看'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
            </button>

            {/* Content Area */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-4 pb-3 pt-1 border-t border-emerald-100/30">
                            <div className="text-xs leading-relaxed text-emerald-800/70 font-sans italic space-y-2">
                                {thought ? (
                                    thought.split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="h-2 w-3/4 bg-emerald-200/40 rounded animate-pulse" />
                                        <div className="h-2 w-1/2 bg-emerald-200/40 rounded animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
