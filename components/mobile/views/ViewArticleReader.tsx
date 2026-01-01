"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    X,
    Share2,
    Bookmark,
    ThumbsUp,
    ThumbsDown,
    MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewArticleReaderProps {
    onClose: () => void;
    article: any;
}

export const ViewArticleReader = ({ onClose, article }: ViewArticleReaderProps) => {
    const [saved, setSaved] = useState(article?.saved || false);

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-[60] bg-white dark:bg-[#050505] flex flex-col"
        >
            {/* Nav Bar */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-stone-100 dark:border-white/5 bg-white/90 dark:bg-black/90 backdrop-blur-md sticky top-0 z-10">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500"
                >
                    <X size={24} />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSaved(!saved)}
                        className={cn("p-2 rounded-full transition-colors", saved ? "text-emerald-600 bg-emerald-50" : "text-stone-400 hover:bg-stone-100")}
                    >
                        <Bookmark size={20} className={saved ? "fill-current" : ""} />
                    </button>
                    <button className="p-2 rounded-full text-stone-400 hover:bg-stone-100">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                <div className="mb-6">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 block">{article?.category || "Science"}</span>
                    <h1 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50 leading-tight mb-4">
                        {article?.title || "Understanding the Science of Sleep"}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-stone-500">
                        <img src="https://i.pravatar.cc/150?u=science" className="w-8 h-8 rounded-full bg-stone-200" alt="Author" />
                        <span>By Dr. Sarah C.</span>
                        <span>•</span>
                        <span>10 min read</span>
                    </div>
                </div>

                <div className="w-full h-48 rounded-2xl overflow-hidden mb-8">
                    <img src={article?.img || "https://images.unsplash.com/photo-1511296187010-86b2e30cad41"} className="w-full h-full object-cover" alt="Cover" />
                </div>

                <div className="prose prose-stone dark:prose-invert prose-lg">
                    <p>
                        Sleep is not just a passive state of rest; it is an active process crucial for physical and mental health. During sleep, your body undergoes repair, your brain consolidates memories, and your hormones regulate extensively.
                    </p>
                    <p>
                        Research shows that consistent sleep patterns are linked to lower cortisol levels, improved cognitive function, and better emotional regulation.
                    </p>
                    <h3>The Role of Circadian Rhythms</h3>
                    <p>
                        Your body has an internal clock that regulates the sleep-wake cycle. Light exposure, specifically natural sunlight in the morning, is the primary zeitgeber (time giver) that anchors this rhythm.
                    </p>
                </div>

                {/* Feedback Section */}
                <div className="mt-12 pt-8 border-t border-stone-100 dark:border-white/5">
                    <p className="text-center text-sm text-stone-400 mb-4">Was this helpful?</p>
                    <div className="flex justify-center gap-6">
                        <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-emerald-600 transition-colors">
                            <div className="p-3 rounded-full bg-stone-50 dark:bg-white/5 hover:bg-emerald-50"><ThumbsUp size={20} /></div>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-emerald-600 transition-colors">
                            <div className="p-3 rounded-full bg-stone-50 dark:bg-white/5 hover:bg-emerald-50"><MessageSquare size={20} /></div>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-rose-500 transition-colors">
                            <div className="p-3 rounded-full bg-stone-50 dark:bg-white/5 hover:bg-rose-50"><ThumbsDown size={20} /></div>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
