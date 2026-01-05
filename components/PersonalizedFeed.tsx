'use client';

import { useEffect } from 'react';
import { useFeed } from '@/hooks/domain/useFeed';
import { useI18n } from '@/lib/i18n';

/**
 * 个性化信息流组件
 * 根据用户画像向量，显示高度相关的内容（相关性 >= 4.5/5）
 * Conform to MVVM: Uses useFeed hook (Bridge)
 */
export default function PersonalizedFeed({
  limit = 20,
  sourceType,
}: {
  limit?: number;
  sourceType?: string;
}) {
  const { language } = useI18n();
  const feedLanguage = language === 'en' ? 'en' : 'zh';
  const {
    items,
    personalization,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    setFilters
  } = useFeed({ language: feedLanguage, cacheDaily: true, cacheNamespace: 'personalized-feed' });

  // Update filters when props change
  useEffect(() => {
    setFilters({ sourceType });
  }, [sourceType, setFilters]);

  /**
   * 获取来源类型标签
   */
  const getSourceTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      x: 'X (Twitter)',
      reddit: 'Reddit',
      journal: '学术期刊',
      research_institution: '研究机构',
      university: '大学',
    };
    // Handles undefined or null safely
    return labels[type || ''] || type || 'Unknown';
  };

  /**
   * 获取来源类型颜色
   */
  const getSourceTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      x: 'bg-blue-100 text-blue-800',
      reddit: 'bg-orange-100 text-orange-800',
      journal: 'bg-purple-100 text-purple-800',
      research_institution: 'bg-green-100 text-green-800',
      university: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type || ''] || 'bg-gray-100 text-gray-800';
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '精选内容';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return '未知时间';
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">个性化信息流</h3>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">个性化信息流</h3>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => refresh()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">个性化信息流</h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">
            {personalization?.message ||
              '暂无相关内容。请先完成个人资料设置，或等待内容池更新。'}
          </p>
          <button
            onClick={() => refresh()}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            刷新试试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">个性化信息流</h3>
          <p className="text-sm text-gray-600 mt-1">
            只显示与您高度相关的内容（相关性 ≥ 4.5/5）
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="text-sm text-gray-600 hover:text-gray-900"
          title="刷新"
        >
          🔄
        </button>
      </div>

      {personalization && (
        <div className="mb-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {personalization.message || (personalization.ready ? '个性化筛选已启用。' : '暂未生成个性化画像，展示最新高质量内容。')}
          {personalization.fallback && personalization.fallback !== 'none' && (
            <span className="ml-2 text-gray-500">
              （当前内容来源：{personalization.fallback === 'latest' ? '最新内容池' : '精选热议'}）
            </span>
          )}
        </div>
      )}

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceTypeColor(
                    item.source_type || 'default'
                  )}`}
                >
                  {getSourceTypeLabel(item.source_type || 'default')}
                </span>
                <span className="text-xs text-gray-500">
                  相关性:{' '}
                  {typeof item.relevance_score === 'number'
                    ? `${item.relevance_score.toFixed(1)}/5.0`
                    : '4.5+/5.0'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(item.created_at)}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {item.content || item.summary}
            </p>

            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                查看原文
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}

            {/* AI Insights Display (Optional, relying on implementation in FeedItem) */}
            {item.why_recommended && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                💡 {item.why_recommended}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => loadMore()}
          disabled={isLoadingMore}
          className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          {isLoadingMore ? '加载中...' : '加载更多'}
        </button>
      </div>
    </div>
  );
}

