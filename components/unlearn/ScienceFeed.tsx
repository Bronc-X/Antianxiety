'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ExternalLink, Clock, ThumbsUp, ThumbsDown, Loader2, Sparkles } from 'lucide-react';

interface FeedItem {
    id: string;
    source_url: string;
    source_type: string;
    content_text: string;
    published_at: string;
    relevance_score?: number;
}

export default function ScienceFeed() {
    const { language } = useI18n();
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [limit, setLimit] = useState(5);
    const [hasMore, setHasMore] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    useEffect(() => {
        fetchFeed(limit);
    }, [limit, language]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchFeed(limit);
        }, 60000);

        const handleFocus = () => fetchFeed(limit);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [limit, language]);

    const fetchFeed = async (nextLimit: number, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setErrorMessage(null);
            setIsUnauthorized(false);
            const res = await fetch(`/api/feed?limit=${nextLimit}`, { cache: 'no-store' });
            if (res.status === 401) {
                setItems([]);
                setHasMore(false);
                setIsUnauthorized(true);
                return;
            }
            if (!res.ok) {
                throw new Error('Failed to fetch feed');
            }
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                // Transform API response to expected format
                const transformedItems = data.items.map((item: any) => ({
                    id: item.id?.toString() || String(Math.random()),
                    source_url: item.source_url || '#',
                    source_type: item.source_type || 'research',
                    content_text: item.content_text || item.title || item.summary || '',
                    published_at: item.published_at
                        ? new Date(item.published_at).toLocaleDateString()
                        : new Date().toLocaleDateString(),
                    relevance_score: item.relevance_score,
                }));
                setItems(transformedItems);
                setHasMore(transformedItems.length >= nextLimit);
            } else {
                setItems([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch feed:', error);
            setErrorMessage(language === 'en' ? 'Unable to load feed right now.' : '暂时无法加载内容。');
            setItems([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const submitFeedback = async (itemId: string, isPositive: boolean) => {
        try {
            await fetch('/api/feed-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentId: itemId,
                    contentUrl: items.find(item => item.id === itemId)?.source_url,
                    contentTitle: items.find(item => item.id === itemId)?.content_text?.slice(0, 80) || '',
                    source: items.find(item => item.id === itemId)?.source_type,
                    feedbackType: isPositive ? 'like' : 'dislike',
                }),
            });
            fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => {});
            fetch('/api/user/refresh', { method: 'POST' }).catch(() => {});
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
    };

    const handleLoadMore = async () => {
        const nextLimit = limit + 5;
        setLimit(nextLimit);
        await fetchFeed(nextLimit, true);
    };

    const handleRefresh = async () => {
        await fetchFeed(limit);
    };

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            nature: 'Nature',
            science: 'Science',
            lancet: 'The Lancet',
            cell: 'Cell',
            jama: 'JAMA',
            pubmed: 'PubMed',
        };
        return labels[source] || source;
    };

    if (loading) {
        return (
            <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[900px] mx-auto flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[900px] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37]">
                        {language === 'en' ? 'Curated For You' : '为你精选'}
                    </p>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Latest research relevant to you' : '与你相关的最新研究'}
                    </h2>
                    <p className="text-white/60 max-w-xl mx-auto">
                        {language === 'en'
                            ? 'AI-curated articles based on your health profile and interests'
                            : 'AI 根据你的健康档案和兴趣精选的文章'}
                    </p>
                </div>

                {/* Feed Items */}
                {items.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-8 text-center text-white/70">
                        <p className="mb-3 text-white/80">
                            {isUnauthorized
                                ? (language === 'en' ? 'Please sign in to see your personalized feed.' : '请先登录以查看个性化内容。')
                                : (language === 'en' ? 'No personalized content yet.' : '暂时没有个性化内容。')}
                        </p>
                        <p className="text-sm text-white/50 mb-6">
                            {language === 'en'
                                ? 'Complete daily calibration or connect your OS hub to start recommendations.'
                                : '完成每日校准或连接 OS Hub，即可开始获取推荐。'}
                        </p>
                        {errorMessage && (
                            <p className="text-sm text-red-300 mb-4">{errorMessage}</p>
                        )}
                        <button
                            onClick={handleRefresh}
                            className="px-5 py-2 border border-white/20 text-white hover:bg-white/5 transition-colors"
                        >
                            {language === 'en' ? 'Refresh' : '刷新'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Source Badge */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-xs text-[#D4AF37] font-medium uppercase tracking-wider">
                                                {getSourceLabel(item.source_type)}
                                            </span>
                                            <span className="text-xs text-white/30 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {item.published_at}
                                            </span>
                                            {item.relevance_score && (
                                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    {Math.round(item.relevance_score * 100)}% {language === 'en' ? 'relevant' : '相关'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <p className="text-white leading-relaxed mb-4">
                                            {item.content_text}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4">
                                            <a
                                                href={item.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#E5C158] transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {language === 'en' ? 'Read More' : '阅读原文'}
                                            </a>
                                            <div className="flex items-center gap-2 ml-auto">
                                                <button
                                                    onClick={() => submitFeedback(item.id, true)}
                                                    className="p-2 text-white/30 hover:text-emerald-400 transition-colors"
                                                    title={language === 'en' ? 'Helpful' : '有帮助'}
                                                >
                                                    <ThumbsUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => submitFeedback(item.id, false)}
                                                    className="p-2 text-white/30 hover:text-red-400 transition-colors"
                                                    title={language === 'en' ? 'Not relevant' : '不相关'}
                                                >
                                                    <ThumbsDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && items.length > 0 && (
                    <div className="text-center mt-8">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-6 py-3 border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            {loadingMore
                                ? (language === 'en' ? 'Loading...' : '加载中...')
                                : (language === 'en' ? 'Load More Articles' : '加载更多文章')}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
