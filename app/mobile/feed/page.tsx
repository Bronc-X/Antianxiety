'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { ChevronRight, Clock, BookOpen, ExternalLink } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface FeedItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    readTime: number;
    imageUrl?: string;
    category: string;
}

// Mock data - would be fetched from /api/feed
const mockFeed: FeedItem[] = [
    {
        id: '1',
        title: 'HRV与焦虑：新研究揭示心率变异性如何预测情绪状态',
        summary: '斯坦福大学最新研究表明，心率变异性可以提前24小时预测焦虑发作...',
        source: 'Nature Medicine',
        readTime: 5,
        category: 'HRV',
    },
    {
        id: '2',
        title: '正念冥想对自主神经系统的长期影响',
        summary: '为期8周的正念训练可显著提高基线HRV，改善压力恢复能力...',
        source: 'JAMA Psychiatry',
        readTime: 7,
        category: 'Mindfulness',
    },
    {
        id: '3',
        title: '睡眠质量与第二天工作效率的量化关系',
        summary: '深度睡眠每增加30分钟，第二天认知表现提升15%...',
        source: 'Sleep Research',
        readTime: 4,
        category: 'Sleep',
    },
];

export default function MobileFeed() {
    const { language } = useI18n();
    const [feed, setFeed] = useState<FeedItem[]>(mockFeed);
    const [loading, setLoading] = useState(false);

    const handleCardTap = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch { }
    };

    return (
        <div className="px-4 pt-4 pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h1 className="text-2xl font-bold text-gray-900">
                    {language === 'en' ? 'Science Feed' : '科学资讯'}
                </h1>
                <p className="text-sm text-gray-500">
                    {language === 'en'
                        ? 'Personalized research for you'
                        : '为你个性化推荐的研究'
                    }
                </p>
            </motion.div>

            {/* Category Pills */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide"
            >
                {['All', 'HRV', 'Sleep', 'Stress', 'Mindfulness'].map((cat, i) => (
                    <motion.button
                        key={cat}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCardTap}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${i === 0
                                ? 'bg-[#0B3D2E] text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {cat}
                    </motion.button>
                ))}
            </motion.div>

            {/* Feed Cards */}
            <div className="space-y-4">
                {feed.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCardTap}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-[#0B3D2E] bg-[#0B3D2E]/10 px-2 py-0.5 rounded-full">
                                        {item.category}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {item.readTime} min
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                    {item.summary}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" />
                                        {item.source}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Load More */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-6 py-4 bg-gray-100 text-gray-600 font-medium rounded-2xl flex items-center justify-center gap-2"
            >
                {language === 'en' ? 'Load More' : '加载更多'}
                <ChevronRight className="w-4 h-4" />
            </motion.button>
        </div>
    );
}
