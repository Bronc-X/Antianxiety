'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 内容项类型定义
 */
interface FeedItem {
  id: number | string;
  source_url: string;
  source_type: string;
  content_text: string;
  published_at: string | null;
  relevance_score?: number | null;
}

interface FeedResponseMeta {
  ready: boolean;
  reason: string;
  message?: string | null;
  fallback?: 'latest' | 'trending' | 'none';
}

/**
 * 个性化信息流组件
 * 根据用户画像向量，显示高度相关的内容（相关性 >= 4.5/5）
 * 符合 readme.md 要求：只保留高度正相关的内容
 */
export default function PersonalizedFeed({
  limit = 10,
  sourceType,
}: {
  limit?: number;
  sourceType?: string;
}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<FeedResponseMeta | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 构建查询参数
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      if (sourceType) {
        params.append('source_type', sourceType);
      }

      // 调用 API（Next.js API 路由会自动处理 cookies 认证）
      const response = await fetch(`/api/feed?${params.toString()}`, {
        credentials: 'include', // 包含 cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取信息流失败');
      }

      const data = (await response.json()) as {
        items?: FeedItem[];
        personalization?: FeedResponseMeta;
        message?: string;
      };

      setItems(data.items || []);
      setMeta(data.personalization || null);
      setInfoMessage(data.message || null);
    } catch (err) {
      console.error('获取信息流失败:', err);
      const message = err instanceof Error ? err.message : '获取信息流失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limit, sourceType]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

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
    return labels[type] || type;
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
    return colors[type] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
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

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">个性化信息流</h3>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchFeed}
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
            {meta?.message ||
              infoMessage ||
              '暂无相关内容。请先完成个人资料设置，或等待内容池更新。'}
          </p>
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
          onClick={fetchFeed}
          className="text-sm text-gray-600 hover:text-gray-900"
          title="刷新"
        >
          🔄
        </button>
      </div>

      {meta && (
        <div className="mb-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {meta.message || (meta.ready ? '个性化筛选已启用。' : '暂未生成个性化画像，展示最新高质量内容。')}
          {meta.fallback && meta.fallback !== 'none' && (
            <span className="ml-2 text-gray-500">
              （当前内容来源：{meta.fallback === 'latest' ? '最新内容池' : '精选热议'}）
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
                    item.source_type
                  )}`}
                >
                  {getSourceTypeLabel(item.source_type)}
                </span>
                <span className="text-xs text-gray-500">
                  相关性:{' '}
                  {typeof item.relevance_score === 'number'
                    ? `${item.relevance_score.toFixed(1)}/5.0`
                    : '4.5+/5.0'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(item.published_at)}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {item.content_text}
            </p>

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
          </div>
        ))}
      </div>

      {items.length >= limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchFeed()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}

