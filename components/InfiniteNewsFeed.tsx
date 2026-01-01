"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCuratedFeed } from "@/hooks/domain/useCuratedFeed";

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
    benefit: "基于你的健康数据分析，AI 正在筛选与你当前状态最相关的内容。",
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
    benefit: "Based on your health data analysis, AI is filtering content most relevant to your current state.",
  },
];

const getMatchScoreColor = (score: number): string => {
  if (score >= 96) return "#166534";
  if (score >= 91) return "#15803d";
  if (score >= 86) return "#16a34a";
  return "#22c55e";
};

// Platform logos as SVG components
const PlatformLogo = ({ source, className = "w-4 h-4" }: { source: string; className?: string }) => {
  switch (source) {
    case "pubmed":
      // PubMed official blue logo - simplified version
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6" width="20" height="12" rx="6" fill="#326599" />
          <text x="12" y="14" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial" fontWeight="bold">PM</text>
        </svg>
      );
    case "semantic_scholar":
      // Semantic Scholar - orange/yellow AI-like mark
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#F5A623" />
          <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="7" cy="12" r="2" fill="white" />
          <circle cx="17" cy="12" r="2" fill="white" />
          <circle cx="12" cy="7" r="2" fill="white" />
          <circle cx="12" cy="17" r="2" fill="white" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#FF0000">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "x":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
        </svg>
      );
    case "reddit":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#FF4500">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      );
    default:
      return <span className="text-xs font-mono">{source}</span>;
  }
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
  const { fetchPage: fetchCuratedPage, sendFeedback } = useCuratedFeed();

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

      const data = await fetchCuratedPage({
        limit: PAGE_SIZE,
        cursor: nextCursor,
        language,
        cycle: overrideCycle,
        exclude: excludeList,
        userId,
      });

      if (!data) {
        throw new Error("Failed to load feed");
      }
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
                      <div className="w-16 h-16 rounded-xl bg-[#FAF6EF] dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <PlatformLogo source={item.source} className="w-8 h-8 text-[#9CAF88]" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* 标题 + 匹配度 */}
                      <div className="flex items-start justify-between gap-3 mb-2">
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

                      {/* 简介/核心摘要 */}
                      <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed line-clamp-3 mb-3">
                        {item.summary}
                      </p>

                      {/* 出处信息 */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mb-4 pb-3 border-b border-[#E7E1D6]/50">
                        <span className="px-2 py-1 rounded border border-[#E7E1D6] flex items-center gap-1.5 bg-white/50">
                          <PlatformLogo source={item.source} className="w-4 h-4" />
                          <span className="text-[#6B7B66] font-medium">{item.sourceLabel}</span>
                        </span>
                        {item.author && <span className="text-[#6B7B66]">• {item.author}</span>}
                        <span className="text-[#9CAF88]">{formatDate(item.publishedAt, isZh)}</span>
                        {showLanguageHint && (
                          <span className="px-2 py-0.5 rounded border border-amber-200 text-amber-600 bg-amber-50">
                            {isZh ? "英文原文" : "Non-English"}
                          </span>
                        )}
                      </div>

                      {/* AI 推荐原因 - 展示思考逻辑 */}
                      <div className="rounded-xl border border-[#9CAF88]/30 bg-gradient-to-r from-[#9CAF88]/5 to-[#D4AF37]/5 px-4 py-3">
                        <div className="mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0B3D2E]/70">
                            {isZh ? "Max 推荐理由" : "Why Max Recommends This"}
                          </span>
                        </div>
                        <p className="text-sm text-[#0B3D2E]/80 dark:text-neutral-200 leading-relaxed italic">
                          "{item.benefit}"
                        </p>
                      </div>

                      {/* 查看原文链接 + 反馈按钮 */}
                      <div className="mt-4 flex items-center justify-between">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0B3D2E] hover:text-[#D4AF37] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          {isZh ? "阅读全文 →" : "Read Full Article →"}
                        </a>

                        <div className="flex items-center gap-2">
                          {/* Tags */}
                          {item.matchedTags.length > 0 && (
                            <div className="flex gap-1 mr-2">
                              {item.matchedTags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#9CAF88]/10 text-[#6B7B66]">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Feedback Buttons */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await sendFeedback({
                                  contentId: item.id,
                                  contentUrl: item.url,
                                  contentTitle: item.title,
                                  source: item.source,
                                  feedbackType: 'bookmark'
                                });
                                // Visual feedback - toggle active state
                                const btn = e.currentTarget;
                                btn.classList.toggle('text-[#D4AF37]');
                                btn.classList.toggle('text-gray-400');
                              } catch (err) {
                                console.error('Feedback error:', err);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#D4AF37]/10 text-gray-400 transition-colors"
                            title={isZh ? "收藏" : "Bookmark"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>

                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await sendFeedback({
                                  contentId: item.id,
                                  contentUrl: item.url,
                                  contentTitle: item.title,
                                  source: item.source,
                                  feedbackType: 'dislike'
                                });
                                // Visual feedback
                                const btn = e.currentTarget;
                                btn.classList.toggle('text-red-400');
                                btn.classList.toggle('text-gray-400');
                              } catch (err) {
                                console.error('Feedback error:', err);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 transition-colors"
                            title={isZh ? "不感兴趣" : "Not Interested"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                          </button>
                        </div>
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
