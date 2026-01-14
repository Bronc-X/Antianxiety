'use client';

/**
 * Desktop Feed Presentational Component (The Skin - Desktop)
 */

import { useState } from 'react';
import {
    RefreshCw, Bookmark, BookmarkCheck, ExternalLink,
    Clock, AlertCircle
} from 'lucide-react';
import { Card, CardContent, Button, Skeleton } from '@/components/ui';
import type { UseFeedReturn, FeedItem } from '@/hooks/domain/useFeed';
import Image from 'next/image';

interface DesktopFeedProps {
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

const TYPE_LABELS: Record<string, string> = {
    article: '📚 Article',
    tip: '💡 Tip',
    insight: '🔍 Insight',
    nudge: '🌟 Nudge',
};

function FeedSkeleton() {
    return (
        <div className="p-6 space-y-4 max-w-3xl mx-auto">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>
    );
}

function FeedCard({
    item,
    onRead,
    onSave
}: {
    item: FeedItem;
    onRead: () => void;
    onSave: () => void;
}) {
    const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general;

    return (
        <Card className={`transition-all hover:shadow-md ${item.is_read ? 'opacity-70' : ''}`}>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    {item.image_url && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                                src={item.image_url}
                                alt={item.title}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex gap-2 flex-wrap">
                                <span className="text-xs font-medium">{TYPE_LABELS[item.type]}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
                                    {item.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {item.read_time_minutes}m
                            </div>
                        </div>
                        <h3
                            className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-emerald-600 line-clamp-2"
                            onClick={onRead}
                        >
                            {item.title}
                        </h3>
                        {item.summary && (
                            <p className="text-sm text-gray-500 line-clamp-2">{item.summary}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                            {item.source && (
                                <span className="text-xs text-gray-400">{item.source}</span>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={onSave}
                                    className={`p-2 rounded-lg transition-colors ${item.is_saved
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'hover:bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    {item.is_saved ? (
                                        <BookmarkCheck className="w-4 h-4" />
                                    ) : (
                                        <Bookmark className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={onRead}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function DesktopFeed({ feed }: DesktopFeedProps) {
    const {
        items,
        isLoading,
        isLoadingMore,
        isRefreshing,
        hasMore,
        error,
        loadMore,
        refresh,
        read,
        save,
        setFilters,
    } = feed;

    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const handleFilterChange = (category: string | null) => {
        setActiveFilter(category);
        setFilters(category ? { category } : {});
    };

    if (isLoading) return <FeedSkeleton />;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Your Feed</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Personalized health insights and tips
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={refresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => handleFilterChange(null)}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${!activeFilter
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    All
                </button>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                    <button
                        key={cat}
                        onClick={() => handleFilterChange(cat)}
                        className={`px-4 py-2 rounded-full text-sm capitalize whitespace-nowrap transition-colors ${activeFilter === cat
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Feed Items */}
            <div className="space-y-4">
                {items.map(item => (
                    <FeedCard
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
            </div>

            {/* Load More */}
            {hasMore && items.length > 0 && (
                <div className="mt-6 text-center">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default DesktopFeed;
