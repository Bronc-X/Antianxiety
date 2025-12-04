/**
 * PaperSources Component
 * 论文来源展示组件 - Perplexity 风格
 * 
 * 在 AI 回答下方展示科学论文来源
 * 采用 California Calm 设计风格
 * 
 * @module components/chat/PaperSources
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

// ============================================
// Types
// ============================================

export interface PaperSource {
  paperId: string;
  title: string;
  abstract?: string | null;
  citationCount: number;
  url: string;
  journal?: string;
  year?: number;
  authors?: string[];
  doi?: string;
}

interface PaperSourcesProps {
  papers: PaperSource[];
  className?: string;
  /** 是否默认展开 */
  defaultExpanded?: boolean;
  /** 最大显示数量，超出折叠 */
  maxVisible?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * 格式化引用数量
 */
function formatCitationCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * 计算共识等级 - 使用深绿色主题
 */
function getConsensusLevel(citationCount: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (citationCount >= 1000) {
    return {
      label: 'High Consensus',
      color: 'text-[#0B3D2E]',
      bgColor: 'bg-[#0B3D2E]'
    };
  }
  if (citationCount >= 200) {
    return {
      label: 'Moderate',
      color: 'text-[#0B3D2E]/80',
      bgColor: 'bg-[#0B3D2E]/80'
    };
  }
  return {
    label: 'Emerging',
    color: 'text-[#0B3D2E]/60',
    bgColor: 'bg-[#0B3D2E]/60'
  };
}

/**
 * 截断文本
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// ============================================
// Sub Components
// ============================================

function PaperCard({ 
  paper, 
  index 
}: { 
  paper: PaperSource; 
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const consensus = getConsensusLevel(paper.citationCount);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-[#0B3D2E]/20 rounded-xl p-4 
                 hover:border-[#0B3D2E]/40 transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        {/* 序号标签 */}
        <span className={`${consensus.bgColor} text-white text-xs font-medium 
                         px-2.5 py-1 rounded-lg shrink-0`}>
          {index + 1}
        </span>
        
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <h4 className="font-medium text-sm text-[#0B3D2E] leading-snug">
            {paper.title}
          </h4>
          
          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#0B3D2E]/60">
            {paper.journal && (
              <span className="font-medium">{paper.journal}</span>
            )}
            {paper.year && (
              <span>• {paper.year}</span>
            )}
            <span className={consensus.color}>
              • {formatCitationCount(paper.citationCount)} citations
            </span>
          </div>
          
          {/* 摘要（可展开） */}
          {paper.abstract && (
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-[#0B3D2E]/70 mt-2 leading-relaxed"
                >
                  {truncateText(paper.abstract, 200)}
                </motion.p>
              )}
            </AnimatePresence>
          )}
          
          {/* 操作栏 */}
          <div className="flex items-center gap-3 mt-3">
            {paper.abstract && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-[#0B3D2E]/50 
                           hover:text-[#0B3D2E]/80 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Abstract
                  </>
                )}
              </button>
            )}
            
            <a
              href={paper.doi ? `https://doi.org/${paper.doi}` : paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#0B3D2E] 
                         hover:text-[#0B3D2E]/70 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View Paper
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function PaperSources({
  papers,
  className = '',
  defaultExpanded = true,
  maxVisible = 3
}: PaperSourcesProps) {
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState(!defaultExpanded);
  
  if (!papers || papers.length === 0) {
    return null;
  }
  
  const visiblePapers = showAll ? papers : papers.slice(0, maxVisible);
  const hasMore = papers.length > maxVisible;
  
  return (
    <div className={`mt-4 ${className}`}>
      {/* 标题栏 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <BookOpen className="w-4 h-4 text-[#0B3D2E]" />
        <span className="text-sm font-medium text-[#0B3D2E]">
          Scientific Evidence
        </span>
        <span className="text-xs text-white bg-[#0B3D2E]/80 
                         px-2 py-0.5 rounded-full">
          {papers.length} sources
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-[#0B3D2E]/60 ml-auto transition-transform
                      ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>
      
      {/* 论文列表 */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {visiblePapers.map((paper, index) => (
              <PaperCard 
                key={paper.paperId} 
                paper={paper} 
                index={index} 
              />
            ))}
            
            {/* 展开更多按钮 */}
            {hasMore && !showAll && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-xs text-[#0B3D2E]/60 
                           hover:text-[#0B3D2E] transition-colors
                           border border-dashed border-[#0B3D2E]/30 rounded-lg"
              >
                Show {papers.length - maxVisible} more sources
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Inline Citation Component
// ============================================

interface InlineCitationProps {
  index: number;
  paper: PaperSource;
}

/**
 * 内联引用标记组件
 * 用于在文本中显示 [1] [2] 等引用标记
 */
export function InlineCitation({ index, paper }: InlineCitationProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <span className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => window.open(paper.url, '_blank')}
        className="inline-flex items-center justify-center w-5 h-5 
                   text-[10px] font-medium text-[#0B3D2E] bg-[#0B3D2E]/10 
                   rounded hover:bg-[#0B3D2E]/20 transition-colors
                   cursor-pointer align-super"
      >
        {index + 1}
      </button>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                       w-64 p-3 bg-white rounded-lg shadow-lg border 
                       border-[#E8DFD0] z-50"
          >
            <p className="text-xs font-medium text-[#0B3D2E] line-clamp-2">
              {paper.title}
            </p>
            <p className="text-[10px] text-[#0B3D2E]/60 mt-1">
              {formatCitationCount(paper.citationCount)} citations
            </p>
            {/* 小三角 */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 
                            border-8 border-transparent border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default PaperSources;
