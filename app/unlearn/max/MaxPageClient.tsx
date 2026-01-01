'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_ROLES } from '@/lib/config/constants';
import type { AIAssistantProfile, RoleType } from '@/types/assistant';
import { BrandLogoSimple } from '@/components/ui/Icons';
import AIPlanCard from '@/components/AIPlanCard';
import { containsPlans, parsePlans, type ParsedPlan } from '@/lib/plan-parser';
import { PaperSources } from '@/components/chat/PaperSources';
import { AIThinkingLoader } from '@/components/AIThinkingLoader';
import { MotionButton } from '@/components/motion/MotionButton';
import { generateActiveInquiry, type DailyLog } from '@/lib/active-inquiry';
import Link from 'next/link';
import { ArrowLeft, Send, Mic, MicOff, ImagePlus } from 'lucide-react';
import { useMax, type LocalMessage } from '@/hooks/domain/useMax';
import { usePlans } from '@/hooks/domain/usePlans';
import { useChatAI } from '@/hooks/domain/useChatAI';

/**
 * Remove plan sections from content for display
 */
function removePlansFromContent(content: string): string {
  if (!containsPlans(content)) return content;

  let cleaned = content.replace(
    /\*{0,2}(?:方案|建议|计划|选项)\s*[1-9一二三四五][\s:：]+\*{0,2}[^\n]*(?:\n(?!\*{0,2}(?:方案|建议|计划|选项)\s*[1-9一二三四五])[^\n]*)*/gi,
    ''
  );

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  if (cleaned.length < 20) {
    return '根据你的情况，我为你准备了以下方案，请选择一个开始：';
  }

  return cleaned;
}

interface Message {
  role: RoleType;
  content: string;
  timestamp: Date;
  papers?: PaperSource[];
  consensus?: { score: number; level: string; rationale?: string };
}

interface PaperSource {
  rank?: number;
  title: string;
  citationCount: number;
  year?: number;
  url?: string;
  authorityScore?: number;
}

interface MaxPageClientProps {
  initialProfile?: AIAssistantProfile | null;
  dailyLogs?: DailyLog[];
}

export default function MaxPageClient({ initialProfile, dailyLogs = [] }: MaxPageClientProps) {
  const {
    messages: maxMessages,
    addMessage,
    isLoading: isHistoryLoading,
    isSending,
    conversations,
    currentConversationId,
    newConversation,
    switchConversation,
    sendMessage
  } = useMax();
  const { createFromAI } = usePlans();
  const { fetchPapers: fetchChatPapers } = useChatAI();

  const [input, setInput] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Convert Max messages to UI messages
  const messages: Message[] = maxMessages.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: new Date(m.created_at || Date.now()),
    // Note: We lose papers/consensus metadata here as useMax doesn't support it yet.
  }));

  // Initialize: Load last conversation or create new
  useEffect(() => {
    if (historyLoaded) return;
    if (!isHistoryLoading) {
      if (conversations.length > 0) {
        switchConversation(conversations[0].id);
      } else {
        newConversation();
      }
      setHistoryLoaded(true);
    }
  }, [conversations, isHistoryLoading, historyLoaded, switchConversation, newConversation]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message logic
  useEffect(() => {
    if (historyLoaded && maxMessages.length === 0 && initialProfile) {
      const inquiry = generateActiveInquiry({
        dailyLogs: dailyLogs,
        profile: initialProfile ? {
          full_name: initialProfile.full_name || undefined,
          nickname: initialProfile.nickname || undefined,
          preferred_name: initialProfile.preferred_name || undefined
        } : undefined
      });

      addMessage({
        id: 'welcome-' + Date.now(),
        conversation_id: currentConversationId || 'temp',
        role: 'assistant',
        content: inquiry.questionZh,
        created_at: new Date().toISOString()
      });
    }
  }, [historyLoaded, maxMessages.length, initialProfile, dailyLogs, addMessage, currentConversationId]);

  // Fetch Papers Logic
  const fetchPapers = async (query: string) => {
    try {
      const data = await fetchChatPapers(query);
      if (!data) return {};
      if (data.papers && data.papers.length > 0) {
        return {
          papers: data.papers.map((p: any) => ({
            rank: p.rank,
            title: p.title,
            citationCount: p.citationCount,
            year: p.year,
            url: p.url,
          })),
          consensus: data.consensus,
        };
      }
      return {};
    } catch (error) {
      return {};
    }
  };

  // Generate AI Logic
  // Stream reading not fully implemented in this refactor, just getting text
  // Hack to extract papers header if needed
  // (Moved to useMax.sendMessage for MVVM consistency)

  // Handle Plan Confirm
  const handlePlanConfirm = async (selectedPlan: ParsedPlan) => {
    // We use addMessage instead of setMessages
    const loadingId = 'loading-' + Date.now();
    addMessage({
      id: loadingId, conversation_id: currentConversationId || 'temp', role: 'assistant',
      content: '⏳ 正在保存您的计划...', created_at: new Date().toISOString()
    });

    try {
      const createdPlans = await createFromAI([selectedPlan], currentConversationId || 'temp');
      if (!createdPlans) throw new Error('Failed to save plan');

      window.dispatchEvent(new CustomEvent('planSaved', { detail: { plans: createdPlans } }));

      addMessage({
        id: 'confirm-' + Date.now(), conversation_id: currentConversationId || 'temp', role: 'assistant',
        content: `✅ **保存成功！**\n\n「${selectedPlan.title}」已添加至您的健康方案。`,
        created_at: new Date().toISOString()
      });

    } catch (error) {
      addMessage({
        id: 'error-' + Date.now(), conversation_id: currentConversationId || 'temp', role: 'assistant',
        content: '❌ 保存失败，请稍后重试。', created_at: new Date().toISOString()
      });
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    const userContent = input.trim();
    setInput('');
    await sendMessage(userContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF6EF] dark:bg-neutral-950">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white safe-area-inset-top">
        <Link href="/unlearn" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-semibold">Max</h1>
          <p className="text-xs text-white/70">Your Personal Health Agent</p>
        </div>
        <div className="w-9" />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const hasPlans = containsPlans(message.content);
            const plans = hasPlans ? parsePlans(message.content) : [];
            const displayContent = hasPlans ? removePlansFromContent(message.content) : message.content;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${isUser
                      ? 'bg-[#0B3D2E] text-white rounded-br-md'
                      : 'bg-white dark:bg-neutral-800 text-[#2C2C2C] dark:text-white rounded-bl-md shadow-sm border border-[#E7E1D6] dark:border-neutral-700'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                  </div>

                  {!isUser && plans.length > 0 && (
                    <div className="mt-3">
                      <AIPlanCard
                        plans={plans}
                        onConfirm={(selectedPlan) => handlePlanConfirm(selectedPlan)}
                      />
                    </div>
                  )}

                  <p className={`text-[10px] mt-1 ${isUser ? 'text-right text-[#0B3D2E]/50' : 'text-[#0B3D2E]/40'}`}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isSending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-[#E7E1D6] dark:border-neutral-700">
              <AIThinkingLoader />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[#E7E1D6] dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 safe-area-inset-bottom">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-[#F5F1EA] dark:bg-neutral-800 rounded-2xl border-0 focus:ring-2 focus:ring-[#0B3D2E]/20 resize-none text-sm text-[#2C2C2C] dark:text-white placeholder:text-[#0B3D2E]/40"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <MotionButton
            type="submit"
            disabled={!input.trim() || isSending}
            variant="primary"
            size="lg"
            className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0B3D2E] text-white flex items-center justify-center disabled:opacity-50"
            hapticFeedback={true}
          >
            <Send className="w-5 h-5" />
          </MotionButton>
        </form>
      </div>
    </div>
  );
}
