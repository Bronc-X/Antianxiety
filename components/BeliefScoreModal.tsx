'use client';

import { useState, useEffect } from 'react';

interface BeliefScoreModalProps {
  isOpen: boolean;
  habitName: string;
  onClose: () => void;
  onSubmit: (score: number) => Promise<void>;
}

/**
 * 信念分数模态框组件
 * 询问用户对习惯的信念分数（1-10分）
 */
export default function BeliefScoreModal({
  isOpen,
  habitName,
  onClose,
  onSubmit,
}: BeliefScoreModalProps) {
  const [selectedScore, setSelectedScore] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当模态框打开时，重置分数为默认值
  useEffect(() => {
    if (isOpen) {
      setSelectedScore(5);
    }
  }, [isOpen]);

  // 处理提交
  const handleSubmit = async () => {
    if (selectedScore < 1 || selectedScore > 10) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedScore);
      onClose();
    } catch (error) {
      console.error('提交信念分数时出错:', error);
      // 错误处理已在父组件中完成
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          完成习惯：{habitName}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          在1到10分之间，您多大程度上&quot;相信&quot;这个习惯正在帮助您缓解焦虑？
        </p>

        {/* 分数选择器 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">信念分数</span>
            <span className="text-lg font-semibold text-blue-600">{selectedScore} 分</span>
          </div>

          {/* 滑块 */}
          <input
            type="range"
            min="1"
            max="10"
            value={selectedScore}
            onChange={(e) => setSelectedScore(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            disabled={isSubmitting}
          />

          {/* 分数标签 */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '确认完成'}
          </button>
        </div>
      </div>
    </div>
  );
}

