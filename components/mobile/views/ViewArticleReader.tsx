"use client";

import React, { useMemo } from "react";
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
import type { FeedItem, FeedFeedbackInput } from "@/hooks/domain/useFeed";

interface ViewArticleReaderProps {
    onClose: () => void;
    article: FeedItem;
    onSave?: (id: string) => Promise<boolean> | void;
    onFeedback?: (input: FeedFeedbackInput) => Promise<'added' | 'removed' | null> | void;
}

export const ViewArticleReader = ({ onClose, article, onSave, onFeedback }: ViewArticleReaderProps) => {
    const bodyText = article.content || article.summary || '';
    const paragraphs = useMemo(() => {
        if (!bodyText) return [];
        return bodyText
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);
    }, [bodyText]);

    const sourceLabel = article.source || article.source_type || '';
    const readTimeLabel = typeof article.read_time_minutes === 'number' && article.read_time_minutes > 0
        ? `${article.read_time_minutes} min read`
        : 'Quick read';
    const categoryLabel = (article.category || article.type || 'general').toUpperCase();

    const handleSave = async () => {
        if (!onSave) return;
        await onSave(article.id);
    };

    const handleShare = async () => {
        if (article.source_url && typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.summary || undefined,
                    url: article.source_url,
                });
                return;
            } catch {
                // Ignore share errors and fall back to open
            }
        }

        if (article.source_url && typeof window !== 'undefined') {
            window.open(article.source_url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleFeedback = async (feedbackType: FeedFeedbackInput['feedbackType']) => {
        if (!onFeedback) return;
        await onFeedback({
            contentId: article.id,
            contentUrl: article.source_url,
            contentTitle: article.title?.slice(0, 80) || '',
            source: article.source_type || article.source || null,
            feedbackType,
        });
    };

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
                        onClick={handleSave}
                        disabled={!onSave}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            article.is_saved ? "text-emerald-600 bg-emerald-50" : "text-stone-400 hover:bg-stone-100",
                            !onSave && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <Bookmark size={20} className={cn(article.is_saved && "fill-current")} />
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={!article.source_url}
                        className={cn(
                            "p-2 rounded-full text-stone-400 hover:bg-stone-100",
                            !article.source_url && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                <div className="mb-6">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 block">{categoryLabel}</span>
                    <h1 className="text-3xl font-bold text-emerald-950 dark:text-emerald-50 leading-tight mb-4">
                        {article.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                        {sourceLabel && <span>{sourceLabel}</span>}
                        {sourceLabel && <span>•</span>}
                        <span>{readTimeLabel}</span>
                        {article.source_url && (
                            <>
                                <span>•</span>
                                <a
                                    href={article.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700"
                                >
                                    Open source
                                </a>
                            </>
                        )}
                    </div>
                </div>

                <div className="w-full h-48 rounded-2xl overflow-hidden mb-8">
                    {article.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={article.image_url} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100" />
                    )}
                </div>

                <div className="prose prose-stone dark:prose-invert prose-lg">
                    {article.summary && article.content && article.summary !== article.content && (
                        <p className="text-stone-600">{article.summary}</p>
                    )}
                    {paragraphs.length > 0 ? (
                        paragraphs.map((paragraph, index) => (
                            <p key={`${article.id}-p-${index}`}>{paragraph}</p>
                        ))
                    ) : (
                        <p className="text-stone-500">No additional content available.</p>
                    )}
                </div>

                {/* Feedback Section */}
                <div className="mt-12 pt-8 border-t border-stone-100 dark:border-white/5">
                    <p className="text-center text-sm text-stone-400 mb-4">Was this helpful?</p>
                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => handleFeedback('like')}
                            className="flex flex-col items-center gap-1 text-stone-400 hover:text-emerald-600 transition-colors"
                        >
                            <div className="p-3 rounded-full bg-stone-50 dark:bg-white/5 hover:bg-emerald-50"><ThumbsUp size={20} /></div>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex flex-col items-center gap-1 text-stone-400 hover:text-emerald-600 transition-colors"
                        >
                            <div className="p-3 rounded-full bg-stone-50 dark:bg-white/5 hover:bg-emerald-50"><MessageSquare size={20} /></div>
                        </button>
                        <button
                            onClick={() => handleFeedback('dislike')}
                            className="flex flex-col items-center gap-1 text-stone-400 hover:text-rose-500 transition-colors"
                        >
                            <div className="p-3 rounded-full bg-stone-50 dark:bg-white/5 hover:bg-rose-50"><ThumbsDown size={20} /></div>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
