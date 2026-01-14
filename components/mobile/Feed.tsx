'use client';

/**
 * Mobile Feed Presentational Component (The Skin - Mobile)
 */

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Bookmark, BookmarkCheck, Clock,
    WifiOff, AlertCircle, ChevronDown
} from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import type { UseFeedReturn, FeedItem } from '@/hooks/domain/useFeed';

interface MobileFeedProps {
    feed: UseFeedReturn;
}

const CATEGORY_COLORS: Record<string, string> = {
    sleep: 'bg-indigo-100 text-indigo-700',
    stress: 'bg-rose-100 text-rose-700',
    nutrition: 'bg-green-100 text-green-700',
    exercise: 'bg-amber-100 text-amber-700',
    mental: 'bg-purple-100 text-purple-700',
    general: 'bg-gray-100 text-gray-700',
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

function MobileFeedCard({
    item,
    onRead,
    onSave
}: {
    item: FeedItem;
    onRead: () => void;
    onSave: () => void;
}) {
    const { impact } = useHaptics();
    const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general;

    const handleSave = async () => {
        await impact(ImpactStyle.Light);
        onSave();
    };

    return (
        <motion.div
            variants={itemVariants}
            className={`bg-white rounded-2xl overflow-hidden shadow-sm ${item.is_read ? 'opacity-70' : ''}`}
        >
            {item.image_url && (
                <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="100vw"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
                        {item.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.read_time_minutes}m
                    </span>
                </div>
                <h3
                    className="font-semibold text-gray-900 mb-2 line-clamp-2"
                    onClick={onRead}
                >
                    {item.title}
                </h3>
                {item.summary && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.summary}</p>
                )}
                <div className="flex items-center justify-between">
                    {item.source && (
                        <span className="text-xs text-gray-400">{item.source}</span>
                    )}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSave}
                        className={`p-2 rounded-xl ${item.is_saved
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                    >
                        {item.is_saved ? (
                            <BookmarkCheck className="w-5 h-5" />
                        ) : (
                            <Bookmark className="w-5 h-5" />
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

export function MobileFeed({ feed }: MobileFeedProps) {
    const {
        items,
        isLoading,
        isLoadingMore,
        isRefreshing,
        isOffline,
        hasMore,
        error,
        loadMore,
        refresh,
        read,
        save,
    } = feed;

    const { impact } = useHaptics();

    const handleRefresh = async () => {
        await impact(ImpactStyle.Medium);
        refresh();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-200 rounded-2xl h-48 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Offline Banner */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2"
                    >
                        <WifiOff className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Showing cached content</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg border-b px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Your Feed</h1>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 bg-gray-100 rounded-xl"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </motion.button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-50 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-4 pb-24"
            >
                {items.map(item => (
                    <MobileFeedCard
                        key={item.id}
                        item={item}
                        onRead={() => read(item.id)}
                        onSave={() => save(item.id)}
                    />
                ))}

                {items.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-lg">No items in your feed</p>
                        <p className="text-sm">Check back later for new content</p>
                    </div>
                )}

                {/* Load More */}
                {hasMore && items.length > 0 && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="w-full py-4 bg-white rounded-2xl text-gray-600 font-medium flex items-center justify-center gap-2"
                    >
                        {isLoadingMore ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <ChevronDown className="w-5 h-5" />
                                Load More
                            </>
                        )}
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
}

export default MobileFeed;
