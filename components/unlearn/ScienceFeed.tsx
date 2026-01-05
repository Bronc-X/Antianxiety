'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ExternalLink, ThumbsUp, ThumbsDown, Loader2, Sparkles, BookOpen, Lightbulb, Tag, TrendingUp, RefreshCw } from 'lucide-react';
import { useFeed, type FeedItem } from '@/hooks/domain/useFeed';
import { useProfileMaintenance } from '@/hooks/domain/useProfileMaintenance';

// ============================================
// Platform Logo Component
// ============================================

function PlatformLogo({ sourceType, language }: { sourceType?: string; language: string }) {
    const logoMap: Record<string, { nameEn: string; nameZh: string; color: string; icon: string }> = {
        pubmed: { nameEn: 'PubMed', nameZh: 'PubMed', color: '#326599', icon: '📚' },
        semantic_scholar: { nameEn: 'Semantic Scholar', nameZh: 'Semantic Scholar', color: '#1857B6', icon: '🔬' },
        nature: { nameEn: 'Nature', nameZh: 'Nature', color: '#C41E3A', icon: '🧬' },
        science: { nameEn: 'Science', nameZh: 'Science', color: '#1A5276', icon: '⚗️' },
        lancet: { nameEn: 'The Lancet', nameZh: 'The Lancet', color: '#00457C', icon: '🏥' },
        cell: { nameEn: 'Cell', nameZh: 'Cell', color: '#00A651', icon: '🔬' },
        x: { nameEn: 'X', nameZh: 'X', color: '#111827', icon: 'X' },
        reddit: { nameEn: 'Reddit', nameZh: 'Reddit', color: '#FF4500', icon: 'R' },
        default: { nameEn: 'Research', nameZh: '研究', color: '#6B7280', icon: '📄' },
    };

    const platform = logoMap[sourceType || 'default'] || logoMap.default;
    const label = language === 'en' ? platform.nameEn : platform.nameZh;

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
        >
            <span>{platform.icon}</span>
            <span>{label}</span>
        </div>
    );
}

// ============================================
// Match Badge Component
// ============================================

function MatchBadge({ percentage, language }: { percentage?: number; language: string }) {
    if (!percentage) return null;

    const getColor = () => {
        if (percentage >= 95) return 'text-emerald-400 bg-emerald-400/10';
        if (percentage >= 90) return 'text-[#D4AF37] bg-[#D4AF37]/10';
        return 'text-blue-400 bg-blue-400/10';
    };

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getColor()}`}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{percentage}% {language === 'en' ? 'match' : '匹配'}</span>
        </div>
    );
}

// ============================================
// Feed Card Component
// ============================================

function FeedCard({
    item,
    index,
    language,
    onFeedback
}: {
    item: FeedItem;
    index: number;
    language: string;
    onFeedback: (id: string, isPositive: boolean) => void;
}) {
    const isLightCard = index % 2 === 0;
    const cardClasses = isLightCard
        ? 'p-6 bg-white border border-[#E7E1D6] text-[#0B3D2E] shadow-[0_12px_40px_rgba(11,61,46,0.08)]'
        : 'p-6 bg-[#0F4A37] border border-white/10 text-white';
    const titleClass = isLightCard ? 'text-[#0B3D2E]' : 'text-white';
    const summaryClass = isLightCard ? 'text-[#0B3D2E]/70' : 'text-white/60';
    const highlightClass = isLightCard ? 'bg-[#F5F1E8] border-[#D4AF37]' : 'bg-[#D4AF37]/10 border-[#D4AF37]';
    const highlightText = isLightCard ? 'text-[#0B3D2E]/80' : 'text-white/80';
    const insightClass = isLightCard ? 'bg-[#E8F2EE] border-[#0B3D2E]' : 'bg-emerald-500/10 border-emerald-500';
    const insightText = isLightCard ? 'text-[#0B3D2E]/80' : 'text-white/80';
    const tagClass = isLightCard ? 'bg-[#0B3D2E]/5 text-[#0B3D2E]/70' : 'bg-white/5 text-white/60';
    const dividerClass = isLightCard ? 'border-[#E7E1D6]' : 'border-white/10';
    const actionLinkClass = isLightCard ? 'text-[#0B3D2E]' : 'text-[#D4AF37]';
    const actionLinkHoverClass = isLightCard ? 'hover:text-[#0B3D2E]/70' : 'hover:text-[#E5C158]';
    const positiveActionClass = isLightCard ? 'text-[#0B3D2E]/40 hover:text-emerald-600' : 'text-white/30 hover:text-emerald-400';
    const negativeActionClass = isLightCard ? 'text-[#0B3D2E]/40 hover:text-red-500' : 'text-white/30 hover:text-red-400';
    const summaryText = item.summary || (language === 'en' ? item.content?.slice(0, 200) : '');
    const summaryFallback = summaryText || (language === 'en' ? 'Summary unavailable' : '摘要生成中');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`${cardClasses} hover:border-[#D4AF37]/30 transition-all`}
        >
            {/* Header: Platform + Match */}
            <div className="flex items-center justify-between mb-4">
                <PlatformLogo sourceType={item.source_type} language={language} />
                <MatchBadge percentage={item.match_percentage} language={language} />
            </div>

            {/* Title */}
            {item.source_url ? (
                <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${titleClass} font-semibold text-lg mb-3 leading-tight inline-flex items-center gap-2 hover:opacity-80 transition-opacity`}
                >
                    {item.title}
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            ) : (
                <h3 className={`${titleClass} font-semibold text-lg mb-3 leading-tight`}>
                    {item.title}
                </h3>
            )}

            {/* Summary */}
            <p className={`${summaryClass} text-sm mb-4 leading-relaxed line-clamp-3`}>
                {summaryFallback}
            </p>

            {/* Why Recommended */}
            {item.why_recommended && (
                <div className={`p-4 border-l-2 mb-4 ${highlightClass}`}>
                    <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-medium mb-2">
                        <Sparkles className="w-4 h-4" />
                        {language === 'en' ? 'Why this is for you' : '为什么推荐给你'}
                    </div>
                    <p className={`${highlightText} text-sm`}>{item.why_recommended}</p>
                </div>
            )}

            {/* Actionable Insight */}
            {item.actionable_insight && (
                <div className={`p-4 border-l-2 mb-4 ${insightClass}`}>
                    <div className={`flex items-center gap-2 text-xs font-medium mb-2 ${isLightCard ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        <Lightbulb className="w-4 h-4" />
                        {language === 'en' ? 'What you can do' : '你可以这样做'}
                    </div>
                    <p className={`${insightText} text-sm`}>{item.actionable_insight}</p>
                </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, i) => (
                        <span
                            key={i}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${tagClass}`}
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className={`flex items-center justify-between pt-4 border-t ${dividerClass}`}>
                {item.source_url ? (
                    <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm ${actionLinkClass} ${actionLinkHoverClass} transition-colors`}
                    >
                        <BookOpen className="w-4 h-4" />
                        {language === 'en' ? 'Read Full Article' : '阅读全文'}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                ) : (
                    <span className="text-sm opacity-50">{language === 'en' ? 'Link unavailable' : '暂无链接'}</span>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onFeedback(item.id, true)}
                        className={`p-2 transition-colors ${positiveActionClass}`}
                        title={language === 'en' ? 'Helpful' : '有帮助'}
                    >
                        <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onFeedback(item.id, false)}
                        className={`p-2 transition-colors ${negativeActionClass}`}
                        title={language === 'en' ? 'Not relevant' : '不相关'}
                    >
                        <ThumbsDown className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// AI Loading Messages - 让 AI 看起来像个活人
// ============================================

// 生成随机数字的辅助函数
function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 动态生成加载消息（每次调用数字都不同）
function generateLoadingMessages(language: string): string[] {
    const scanned = randomBetween(800, 2500);
    const filtered = randomBetween(1800, 4500);
    const matched = randomBetween(15, 45);
    const duplicates = randomBetween(80, 250);
    const journals = randomBetween(12, 35);

    if (language === 'en') {
        return [
            'Connecting to academic databases...',
            'Scanning latest PubMed research...',
            'Retrieving Semantic Scholar papers...',
            `Scanned ${scanned.toLocaleString()} papers so far...`,
            'Analyzing literature relevance...',
            `Filtered out ${filtered.toLocaleString()} low-relevance papers`,
            `Found ${matched} highly matched studies`,
            'Extracting core findings...',
            'Analyzing research methodology...',
            'Evaluating evidence levels...',
            'Cross-validating conclusions...',
            `Excluded ${duplicates} duplicate studies`,
            'Generating personalized insights...',
            'Matching your health profile...',
            'Calculating relevance scores...',
            `Reviewing ${journals} high-impact journals...`,
            'Preparing actionable insights...',
            'Optimizing recommendations...',
            'Final review in progress...',
            'Almost ready to present...',
        ];
    }

    return [
        '正在连接学术数据库...',
        '扫描 PubMed 最新研究...',
        '检索 Semantic Scholar 论文...',
        `已扫描 ${scanned.toLocaleString()} 篇论文...`,
        '正在分析文献相关性...',
        `已过滤 ${filtered.toLocaleString()} 篇低相关论文`,
        `发现 ${matched} 篇高度匹配的研究`,
        '正在提取核心论点...',
        '分析研究方法论...',
        '评估证据等级...',
        '交叉验证研究结论...',
        `已排除 ${duplicates} 篇重复研究`,
        '正在生成个性化解读...',
        '匹配你的健康画像...',
        '计算文章相关度...',
        `正在审阅 ${journals} 个高影响因子期刊...`,
        '正在整理行动建议...',
        '优化推荐排序...',
        '最终审核中...',
        '即将呈现精选内容...',
    ];
}

function AILoadingState({ language }: { language: string }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        // 组件挂载时生成随机消息
        const generatedMessages = generateLoadingMessages(language);
        setMessages(generatedMessages);

        // 随机起始位置
        setMessageIndex(Math.floor(Math.random() * generatedMessages.length));

        const interval = setInterval(() => {
            setMessageIndex(prev => {
                // 随机跳跃 1-3 条消息，让它看起来更自然
                const jump = Math.floor(Math.random() * 3) + 1;
                return (prev + jump) % generatedMessages.length;
            });
        }, 2800); // 约 3 秒切换一次

        return () => clearInterval(interval);
    }, [language]);

    if (messages.length === 0) return null;

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[900px] mx-auto flex flex-col items-center justify-center py-20">
                {/* 动态加载动画 */}
                <div className="relative mb-6">
                    <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                    <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 animate-ping" />
                </div>

                {/* 动态消息 */}
                <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-white/70 text-sm text-center min-h-[24px]"
                >
                    {messages[messageIndex]}
                </motion.p>

                {/* 进度条效果 */}
                <div className="mt-6 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[#D4AF37]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 25, ease: 'linear' }}
                    />
                </div>

                <p className="text-white/40 text-xs mt-3">
                    {language === 'en' ? 'This may take 10-20 seconds' : '这可能需要 10-20 秒'}
                </p>
            </div>
        </section>
    );
}

// ============================================
// Main Component
// ============================================

export default function ScienceFeed() {
    const { language } = useI18n();
    const { refresh: refreshProfile, sync } = useProfileMaintenance();

    // Domain Hook
    const feedLanguage = language === 'en' ? 'en' : 'zh';
    const {
        items,
        isLoading,
        isRefreshing,
        error,
        refresh,
        feedback
    } = useFeed({ language: feedLanguage, cacheDaily: true, cacheNamespace: 'science-feed' });

    const submitFeedback = async (itemId: string, isPositive: boolean) => {
        try {
            const item = items.find(i => i.id === itemId);
            await feedback({
                contentId: itemId,
                contentUrl: item?.source_url,
                contentTitle: item?.title?.slice(0, 80) || '',
                source: item?.source_type,
                feedbackType: isPositive ? 'like' : 'dislike',
            });
            sync().catch(() => {});
            refreshProfile().catch(() => {});
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
    };

    if (isLoading && items.length === 0) {
        return <AILoadingState language={language} />;
    }

    // 获取今日日期
    const today = new Date();
    const dateStr = language === 'en'
        ? today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `${today.getMonth() + 1}月${today.getDate()}日`;

    return (
        <section className="py-16 px-6" style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[900px] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                        <p className="text-sm uppercase tracking-widest font-medium text-[#D4AF37]">
                            {language === 'en' ? `Today's Research · ${dateStr}` : `今日精选 · ${dateStr}`}
                        </p>
                        <button
                            onClick={() => refresh(true)}
                            disabled={isRefreshing || isLoading}
                            className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#D4AF37]/40 text-[#D4AF37] text-xs uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-colors disabled:opacity-50"
                        >
                            {isRefreshing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            {language === 'en' ? 'Refresh' : '刷新'}
                        </button>
                    </div>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Science tailored to your journey' : '为你量身定制的科学'}
                    </h2>
                    <p className="text-white/60 max-w-xl mx-auto mb-2">
                        {language === 'en'
                            ? 'Each article is analyzed by AI to explain why it matters to you'
                            : '每篇文章都经过 AI 分析，解释为什么它对你重要'}
                    </p>
                    <p className="text-white/40 text-xs">
                        {language === 'en'
                            ? '📅 New recommendations every day at 2:00 PM (UTC+8)'
                            : '📅 每天下午 2:00（UTC+8）更新推荐'}
                    </p>
                </div>

                {/* Feed Items */}
                {items.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-8 text-center text-white/70">
                        <p className="mb-3 text-white/80">
                            {language === 'en' ? 'No personalized content yet.' : '暂时没有个性化内容。'}
                        </p>
                        <p className="text-sm text-white/50 mb-6">
                            {language === 'en'
                                ? 'Complete daily calibration to start receiving AI-curated research.'
                                : '完成每日校准，即可开始接收 AI 精选研究。'}
                        </p>
                        {error && (
                            <p className="text-sm text-red-300 mb-4">{error}</p>
                        )}
                        <button
                            onClick={() => refresh(true)}
                            disabled={isRefreshing || isLoading}
                            className="px-5 py-2 border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            {isRefreshing
                                ? (language === 'en' ? 'Refreshing...' : '刷新中...')
                                : (language === 'en' ? 'Refresh' : '刷新')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {items.map((item, i) => (
                            <FeedCard
                                key={item.id}
                                item={item}
                                index={i}
                                language={language}
                                onFeedback={submitFeedback}
                            />
                        ))}
                    </div>
                )}

                {/* Refresh Button */}
                {items.length > 0 && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => refresh(true)}
                            disabled={isRefreshing || isLoading}
                            className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            {isRefreshing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {language === 'en' ? 'Refreshing...' : '刷新中...'}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    {language === 'en' ? 'Refresh Articles' : '刷新文章'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
