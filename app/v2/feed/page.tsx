'use client';

/**
 * V2 Feed Page - 期刊推荐
 * 
 * 用户可见的核心功能之一：95% 个性化匹配的科学期刊推荐
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFeed } from '@/hooks/domain/useFeed';

export default function V2FeedPage() {
    const { items, isLoading, markRead, toggleSave, refresh } = useFeed();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-purple-400">加载推荐中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <Link href="/v2/home" className="text-purple-400 hover:text-purple-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">期刊推荐</h1>
                    <p className="text-purple-400/60 text-sm">95% 个性化匹配</p>
                </div>
                <button
                    onClick={refresh}
                    className="text-purple-400 hover:text-purple-300"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </header>

            {/* Feed Items */}
            <div className="space-y-4">
                {items.map((item, index) => (
                    <motion.article
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-2xl hover:bg-purple-900/30 transition-colors cursor-pointer"
                        onClick={() => markRead(item.id)}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-purple-600/30 rounded text-purple-300 text-xs">
                                        {item.source || 'Science'}
                                    </span>
                                    {item.relevance_score && (
                                        <span className="text-purple-400/60 text-xs">
                                            {Math.round(item.relevance_score * 100)}% 匹配
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-white font-medium mb-2 line-clamp-2">
                                    {item.title}
                                </h3>
                                {item.summary && (
                                    <p className="text-purple-300/60 text-sm line-clamp-3">
                                        {item.summary}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSave(item.id);
                                }}
                                className={`p-2 rounded-lg transition-colors ${item.is_saved
                                        ? 'text-pink-400 bg-pink-600/20'
                                        : 'text-purple-400/50 hover:text-purple-400'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill={item.is_saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                        </div>
                    </motion.article>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-12 text-purple-400/50">
                        <p>暂无推荐</p>
                        <p className="text-sm mt-2">完成更多校准后，推荐会更精准</p>
                    </div>
                )}
            </div>
        </div>
    );
}
