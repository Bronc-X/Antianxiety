'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { BookOpen, ExternalLink, Clock, ThumbsUp, ThumbsDown, Loader2, Sparkles } from 'lucide-react';

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

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/feed?limit=5');
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                setItems(data.items);
            } else {
                // Demo data
                setItems([
                    {
                        id: '1',
                        source_url: 'https://nature.com/articles/example1',
                        source_type: 'nature',
                        content_text: language === 'en'
                            ? 'New research shows HRV-based interventions can reduce anxiety symptoms by 47% in 12 weeks'
                            : '新研究表明基于HRV的干预可以在12周内将焦虑症状减少47%',
                        published_at: '2024-12-25',
                        relevance_score: 0.92,
                    },
                    {
                        id: '2',
                        source_url: 'https://science.org/articles/example2',
                        source_type: 'science',
                        content_text: language === 'en'
                            ? 'Sleep optimization protocol shows significant improvements in autonomic nervous system function'
                            : '睡眠优化方案显示出自主神经系统功能的显著改善',
                        published_at: '2024-12-24',
                        relevance_score: 0.88,
                    },
                    {
                        id: '3',
                        source_url: 'https://lancet.com/articles/example3',
                        source_type: 'lancet',
                        content_text: language === 'en'
                            ? 'Digital twins in healthcare: personalized treatment prediction reaches 94% accuracy'
                            : '医疗领域的数字孪生：个性化治疗预测准确率达到94%',
                        published_at: '2024-12-23',
                        relevance_score: 0.85,
                    },
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async (itemId: string, isPositive: boolean) => {
        try {
            await fetch('/api/feed-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, feedback: isPositive ? 'positive' : 'negative' }),
            });
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
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

                {/* Load More */}
                <div className="text-center mt-8">
                    <button className="px-6 py-3 border border-white/20 text-white hover:bg-white/5 transition-colors">
                        {language === 'en' ? 'Load More Articles' : '加载更多文章'}
                    </button>
                </div>
            </div>
        </section>
    );
}
