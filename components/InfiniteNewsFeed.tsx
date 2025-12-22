"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";

interface CuratedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: "pubmed" | "semantic_scholar" | "youtube" | "x" | "reddit";
  sourceLabel: string;
  matchScore: number;
  publishedAt?: string | null;
  author?: string | null;
  thumbnail?: string | null;
  language: "zh" | "en";
  matchedTags: string[];
  benefit: string;
}

const PAGE_SIZE = 10;

const fallbackNewsZh: CuratedItem[] = [
  {
    id: "fallback-1",
    title: "正在加载个性化内容...",
    summary: "系统正在根据你的健康画像获取相关内容。",
    url: "#",
    source: "semantic_scholar",
    sourceLabel: "加载中",
    matchScore: 0,
    publishedAt: null,
    author: null,
    thumbnail: null,
    language: "zh",
    matchedTags: [],
    benefit: "完成更多记录后，我们会给出更精准的推荐理由与可执行要点。",
  },
];

const fallbackNewsEn: CuratedItem[] = [
  {
    id: "fallback-1",
    title: "Loading personalized content...",
    summary: "We are fetching tailored sources based on your profile.",
    url: "#",
    source: "semantic_scholar",
    sourceLabel: "Loading",
    matchScore: 0,
    publishedAt: null,
    author: null,
    thumbnail: null,
    language: "en",
    matchedTags: [],
    benefit: "Once you log more data, we will explain why each item matters and how to use it.",
  },
];

const getMatchScoreColor = (score: number): string => {
  if (score >= 96) return "#166534";
  if (score >= 91) return "#15803d";
  if (score >= 86) return "#16a34a";
  return "#22c55e";
};

const getMatchScoreBg = (score: number): string => {
  if (score >= 96) return "rgba(22, 101, 52, 0.15)";
  if (score >= 91) return "rgba(21, 128, 61, 0.12)";
  if (score >= 86) return "rgba(22, 163, 74, 0.10)";
  return "rgba(34, 197, 94, 0.08)";
};

const formatDate = (value?: string | null, isZh?: boolean) => {
  if (!value) return isZh ? "精选内容" : "Curated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return isZh ? "精选内容" : "Curated";
  return new Intl.DateTimeFormat(isZh ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const mergeUnique = (current: CuratedItem[], next: CuratedItem[]) => {
  const seen = new Set(current.map((item) => item.id));
  const merged = [...current];
  next.forEach((item) => {
    if (!seen.has(item.id)) {
      merged.push(item);
      seen.add(item.id);
    }
  });
  return merged;
};

interface InfiniteNewsFeedProps {
  language?: string;
  variant?: "terminal" | "minimal" | "card" | "calm";
  userId?: string;
}

export default function InfiniteNewsFeed({
  language = "en",
  userId,
}: InfiniteNewsFeedProps) {
  const loadingRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storedTopRef = useRef(false);
  const excludeIdsRef = useRef<string[]>([]);

  const isZh = language?.startsWith("zh") || language === "zh";
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [items, setItems] = useState<CuratedItem[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  const [hasMore, setHasMore] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = userId || "anon";
  const storageDateKey = `nma_curated_feed_date_${storageKey}`;
  const storageTopKey = `nma_curated_feed_top_${storageKey}`;

  const fetchPage = useCallback(
    async (
      nextCursor: number,
      replace: boolean,
      overrideExclude?: string[],
      overrideCycle: number = 0
    ) => {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        cursor: nextCursor.toString(),
        language,
        cycle: String(overrideCycle),
      });
      if (userId) params.set("userId", userId);
      const excludeList = overrideExclude ?? excludeIdsRef.current;
      if (excludeList.length > 0) params.set("exclude", excludeList.join(","));

      const response = await fetch(`/api/curated-feed?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load feed");
      }

      const data = await response.json();
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => (replace ? nextItems : mergeUnique(prev, nextItems)));
      setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.nextCursor));
    },
    [language, userId]
  );

  useEffect(() => {
    setItems([]);
    setKeywords([]);
    setCursor(0);
    setHasMore(true);
    setCycle(0);
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    excludeIdsRef.current = [];
    storedTopRef.current = false;

    let initialExclude: string[] = [];

    if (typeof window !== "undefined") {
      const lastDate = window.localStorage.getItem(storageDateKey);
      const lastTop = window.localStorage.getItem(storageTopKey);

      if (lastDate && lastDate !== today && lastTop) {
        try {
          const parsed = JSON.parse(lastTop);
          if (Array.isArray(parsed)) {
            initialExclude = parsed.slice(0, 10);
          }
        } catch {
          initialExclude = [];
        }
      }
    }

    excludeIdsRef.current = initialExclude;

    setIsLoading(true);
    fetchPage(0, true, initialExclude, 0)
      .catch((err) => {
        console.error("[CuratedFeed] Fetch error:", err);
        setError(isZh ? "暂时无法加载内容" : "Unable to load content");
        setItems(isZh ? fallbackNewsZh : fallbackNewsEn);
      })
      .finally(() => setIsLoading(false));
  }, [fetchPage, isZh, language, storageDateKey, storageTopKey, today]);

  useEffect(() => {
    if (storedTopRef.current || items.length === 0) return;
    if (typeof window === "undefined") return;
    const topIds = items.slice(0, 10).map((item) => item.id);
    window.localStorage.setItem(storageDateKey, today);
    window.localStorage.setItem(storageTopKey, JSON.stringify(topIds));
    storedTopRef.current = true;
  }, [items, storageDateKey, storageTopKey, today]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    if (!hasMore || cursor === null) {
      const nextCycle = cycle + 1;
      setCycle(nextCycle);
      setIsLoadingMore(true);
      try {
        await fetchPage(0, false, undefined, nextCycle);
      } catch (err) {
        console.error("[CuratedFeed] Load more error:", err);
      } finally {
        setIsLoadingMore(false);
      }
      return;
    }
    setIsLoadingMore(true);
    try {
      await fetchPage(cursor, false, undefined, cycle);
    } catch (err) {
      console.error("[CuratedFeed] Load more error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, cycle, fetchPage, hasMore, isLoadingMore]);

  useEffect(() => {
    if (!loadingRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.4 }
    );
    observer.observe(loadingRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-b from-[#FFFDF8] to-white dark:from-neutral-900 dark:to-neutral-950">
      <div className="px-5 py-4 border-b border-[#E7E1D6] dark:border-neutral-800 bg-gradient-to-r from-[#FFFDF8] to-white dark:from-neutral-900 dark:to-neutral-900 z-20 relative">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#0B3D2E] dark:text-white">
            {isZh ? "为你精选" : "Curated For You"}
          </h3>
          <span className="text-xs text-[#9CAF88] dark:text-neutral-400 font-mono">
            {today}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
          {isZh
            ? "基于你的健康画像，从 PubMed、Semantic Scholar、YouTube、X、Reddit 精选"
            : "Based on your profile, curated from PubMed, Semantic Scholar, YouTube, X, Reddit"}
        </p>
        {keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="text-[11px] font-mono text-[#6B7B66] border border-[#E7E1D6] px-2 py-0.5 rounded"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 bg-gradient-to-b from-[#FFFDF8] to-transparent dark:from-neutral-900 dark:to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10 bg-gradient-to-t from-white to-transparent dark:from-neutral-950 dark:to-transparent" />

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain py-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {error && (
            <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {items.map((item, index) => {
            const scoreColor = getMatchScoreColor(item.matchScore);
            const scoreBg = getMatchScoreBg(item.matchScore);
            const showLanguageHint = item.language !== (isZh ? "zh" : "en");

            return (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{
                  duration: 0.45,
                  delay: (index % 4) * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mx-5 mb-4 rounded-2xl border border-[#E7E1D6]/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#FAF6EF] dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-xs font-mono text-[#9CAF88]">
                        {item.sourceLabel}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-base font-semibold text-[#0B3D2E] dark:text-white leading-snug">
                          {item.title}
                        </h4>
                        <span
                          className="flex-shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md"
                          style={{ color: scoreColor, backgroundColor: scoreBg }}
                        >
                          {isZh ? "匹配" : "Match"} {item.matchScore}%
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed mt-2 line-clamp-3">
                        {item.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-3">
                        <span className="px-2 py-0.5 rounded border border-[#E7E1D6] text-[#6B7B66] font-mono">
                          {item.sourceLabel}
                        </span>
                        {item.author && <span>{item.author}</span>}
                        <span>{formatDate(item.publishedAt, isZh)}</span>
                        {showLanguageHint && (
                          <span className="px-2 py-0.5 rounded border border-[#E7E1D6] text-[#9CAF88] font-mono">
                            {isZh ? "英文内容" : "Non-English"}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-[#E7E1D6]/80 bg-[#FAF6EF]/80 dark:bg-neutral-800/80 px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9CAF88] mb-2">
                          {isZh ? "为什么推荐给你" : "Why This Matters for You"}
                        </div>
                        <p className="text-sm text-[#0B3D2E]/80 dark:text-neutral-200 leading-relaxed">
                          {item.benefit}
                        </p>
                      </div>

                      <div className="mt-4">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#9CAF88] hover:text-[#7A9A6A] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          {isZh ? "查看原文" : "View Source"}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div ref={loadingRef} className="h-20 flex items-center justify-center w-full">
            <AnimatePresence>
              {(isLoading || isLoadingMore) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  className="relative flex items-center justify-center"
                >
                  <div className="absolute w-12 h-12 bg-[#9CAF88]/20 rounded-full blur-xl" />
                  <Loader2 className="w-6 h-6 text-[#9CAF88] animate-spin relative z-10" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
