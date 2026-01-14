"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, Heart, RefreshCw } from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { useCuratedFeed } from "@/hooks/domain/useCuratedFeed";
import { useBrowser } from "@/hooks/useBrowser";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface CuratedItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    source: string;
    sourceLabel?: string;
    matchScore?: number;
    publishedAt?: string | null;
    author?: string | null;
    thumbnail?: string | null;
    language?: string;
    matchedTags?: string[];
    benefit?: string;
}

interface ViewCuratedFeedProps {
    onBack?: () => void;
}

export const ViewCuratedFeed = ({ onBack }: ViewCuratedFeedProps) => {
    const { language } = useI18n();
    const { fetchPage, sendFeedback, markRead, isLoading, error } = useCuratedFeed();
    const { open } = useBrowser();
    const [items, setItems] = useState<CuratedItem[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    const loadFeed = useCallback(async ({ reset = false, cursor }: { reset?: boolean; cursor?: number } = {}) => {
        const startCursor = reset ? 0 : cursor ?? 0;
        if (reset) {
            setItems([]);
            setNextCursor(null);
        }
        const data = await fetchPage({
            limit: 10,
            cursor: startCursor,
            language: language === "en" ? "en" : "zh"
        });
        if (!data) return;
        const newItems = data.items || [];
        setItems(prev => (reset ? newItems : [...prev, ...newItems]));
        setNextCursor(data.nextCursor ?? null);
    }, [fetchPage, language]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadFeed({ reset: true });
        }, 0);
        return () => window.clearTimeout(timer);
    }, [language, loadFeed]);

    const toggleFeedback = async (item: CuratedItem, type: "like" | "bookmark") => {
        const action = await sendFeedback({
            contentId: item.id,
            contentUrl: item.url,
            contentTitle: item.title,
            source: item.sourceLabel || item.source,
            feedbackType: type
        });
        if (!action) return;
        if (type === "like") {
            setLikedIds(prev => {
                const next = new Set(prev);
                if (action === "added") next.add(item.id);
                if (action === "removed") next.delete(item.id);
                return next;
            });
        } else {
            setSavedIds(prev => {
                const next = new Set(prev);
                if (action === "added") next.add(item.id);
                if (action === "removed") next.delete(item.id);
                return next;
            });
        }
    };

    const handleOpen = async (item: CuratedItem) => {
        if (!item.url) return;
        setReadIds(prev => {
            const next = new Set(prev);
            next.add(item.id);
            return next;
        });
        void markRead({
            contentId: item.id,
            title: item.title,
            summary: item.summary,
            url: item.url,
            source: item.source,
            sourceLabel: item.sourceLabel,
            matchScore: item.matchScore,
            matchedTags: item.matchedTags,
            benefit: item.benefit
        });
        await open(item.url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-stone-600 dark:text-stone-300" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Curated Feed</h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Personalized research stream</p>
                    </div>
                </div>
                <button
                    onClick={() => loadFeed({ reset: true })}
                    disabled={isLoading}
                    className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={cn("w-5 h-5 text-stone-500", isLoading && "animate-spin")} />
                </button>
            </div>

            {error && (
                <CardGlass className="p-4 text-sm text-rose-500">{error}</CardGlass>
            )}

            <div className="space-y-4">
                {items.map((item) => {
                    const isRead = readIds.has(item.id);
                    return (
                        <CardGlass key={item.id} className={cn("p-4 space-y-3", isRead && "opacity-70")}>
                            <div className="text-xs text-stone-400 uppercase tracking-wider">
                                {item.sourceLabel || item.source}
                            </div>
                            <div className="text-base font-semibold text-emerald-950 dark:text-emerald-50">
                                {item.title}
                            </div>
                            <div className="text-sm text-stone-500 dark:text-stone-400">
                                {item.summary}
                            </div>
                            {item.url && (
                                <button
                                    type="button"
                                    onClick={() => handleOpen(item)}
                                    className="text-xs font-semibold text-emerald-600"
                                    aria-label={`Open ${item.title}`}
                                >
                                    Open Source
                                </button>
                            )}
                            {item.benefit && (
                                <div className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl">
                                    {item.benefit}
                                </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-stone-400">
                                <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "—"}</span>
                                <div className="flex items-center gap-2">
                                    {isRead && (
                                        <span className="text-[10px] uppercase tracking-wider text-emerald-500">Read</span>
                                    )}
                                    <button
                                        onClick={() => toggleFeedback(item, "like")}
                                        className={cn(
                                            "p-2 rounded-lg border",
                                            likedIds.has(item.id)
                                                ? "bg-rose-50 text-rose-500 border-rose-200"
                                                : "bg-white border-stone-200 text-stone-400"
                                        )}
                                    >
                                        <Heart size={14} />
                                    </button>
                                    <button
                                        onClick={() => toggleFeedback(item, "bookmark")}
                                        className={cn(
                                            "p-2 rounded-lg border",
                                            savedIds.has(item.id)
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                : "bg-white border-stone-200 text-stone-400"
                                        )}
                                    >
                                        <Bookmark size={14} />
                                    </button>
                                </div>
                            </div>
                        </CardGlass>
                    );
                })}
            </div>

            {nextCursor !== null && (
                <button
                    onClick={() => loadFeed({ cursor: nextCursor ?? 0 })}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 text-sm font-semibold"
                >
                    {isLoading ? "Loading..." : "Load More"}
                </button>
            )}
        </motion.div>
    );
};
