'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
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

/**
 * 从消息内容中移除方案部分
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

const resolveDisplayName = (profile?: AIAssistantProfile | null): string => {
  if (!profile) return 'Friend';
  const candidates = [
    profile.full_name,
    profile.nickname,
    profile.preferred_name,
    profile.username,
    profile.email?.split?.('@')?.[0],
  ];
  const found = candidates.find((item?: string | null) => item && String(item).trim().length > 0);
  return found ? String(found).trim() : 'Friend';
};

export default function MaxPageClient({ initialProfile, dailyLogs = [] }: MaxPageClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClientSupabaseClient();


  // 加载对话历史
  const loadConversationHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_conversations')
        .select('role, content, created_at, session_id, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('加载对话历史失败:', error);
        return;
      }

      if (data && data.length > 0) {
        const sortedData = [...data].reverse();

        const historyMessages: Message[] = sortedData.map((msg) => {
          const metadata = msg.metadata as {
            papers?: PaperSource[];
            consensus?: { score: number; level: string; rationale?: string };
          } | null;

          return {
            role: msg.role as RoleType,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            papers: metadata?.papers,
            consensus: metadata?.consensus,
          };
        });
        setMessages(historyMessages);

        const lastSessionId = sortedData[sortedData.length - 1].session_id;
        if (lastSessionId) {
          setSessionId(lastSessionId);
        }
      }
    } catch (error) {
      console.error('加载对话历史异常:', error);
    }
  }, [supabase]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      await loadConversationHistory();
      setHistoryLoaded(true);
    };
    init();
  }, [loadConversationHistory]);

  // 显示欢迎消息
  useEffect(() => {
    if (historyLoaded && messages.length === 0 && initialProfile) {
      const inquiry = generateActiveInquiry({
        dailyLogs: dailyLogs,
        profile: initialProfile ? {
          full_name: initialProfile.full_name || undefined,
          nickname: initialProfile.nickname || undefined,
          preferred_name: initialProfile.preferred_name || undefined
        } : undefined
      });

      setMessages([{
        role: 'assistant',
        content: inquiry.questionZh,
        timestamp: new Date(),
      }]);
    }
  }, [historyLoaded, initialProfile, messages.length, dailyLogs]);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 保存消息
  const saveMessage = async (message: Message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const insertData: any = {
        user_id: user.id,
        role: message.role,
        content: message.content,
        metadata: {
          timestamp: message.timestamp.toISOString(),
          papers: message.papers || [],
          consensus: message.consensus || null,
        },
      };

      if (sessionId) {
        insertData.session_id = sessionId;
      }

      await supabase.from('chat_conversations').insert(insertData);
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  };

  // 获取论文
  const fetchPapers = async (query: string) => {
    try {
      const response = await fetch('/api/chat/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) return {};

      const data = await response.json();
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

  // 生成 AI 回复
  const generateAIResponse = async (userInput: string) => {
    try {
      const chatMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userInput }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!response.ok) {
        if (response.status === 401) return { content: '登录已过期，请刷新页面。' };
        return { content: 'AI 服务暂时不可用，请稍后重试。' };
      }

      let papers: PaperSource[] | undefined;
      let consensus: any;

      const papersHeader = response.headers.get('x-neuromind-papers');
      const consensusHeader = response.headers.get('x-neuromind-consensus');

      if (papersHeader) {
        try {
          papers = JSON.parse(Buffer.from(papersHeader, 'base64').toString('utf-8'));
        } catch (e) { }
      }

      if (consensusHeader) {
        try {
          consensus = JSON.parse(Buffer.from(consensusHeader, 'base64').toString('utf-8'));
        } catch (e) { }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
      }

      return { content: fullResponse || '抱歉，无法生成回复。', papers, consensus };
    } catch (error) {
      return { content: '网络错误，请检查连接后重试。' };
    }
  };

  // 处理方案确认
  const handlePlanConfirm = async (selectedPlan: ParsedPlan) => {
    const loadingMessage: Message = {
      role: 'assistant',
      content: '⏳ 正在保存您的计划...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch('/api/plans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans: [selectedPlan], sessionId }),
      });

      const result = await response.json();

      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));

      if (!response.ok) throw new Error(result.error);

      window.dispatchEvent(new CustomEvent('planSaved', { detail: result.data }));

      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ **保存成功！**\n\n「${selectedPlan.title}」已添加至您的健康方案。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      await saveMessage(confirmMessage);
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ 保存失败，请稍后重试。',
        timestamp: new Date(),
      }]);
    }
  };

  // 发送消息
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const papersPromise = fetchPapers(currentInput);
    const aiResponse = await generateAIResponse(currentInput);
    const papersResponse = await papersPromise;

    const papers = papersResponse.papers?.length ? papersResponse.papers : aiResponse.papers;
    const consensus = papersResponse.consensus || aiResponse.consensus;

    const assistantMessage: Message = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      papers,
      consensus,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);

    await saveMessage(userMessage);
    await saveMessage(assistantMessage);
  };

  // 处理键盘事件 - 支持中文输入法
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 检查是否在输入法组合状态（中文输入时）
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return; // 输入法组合中，不处理
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };


  return (
    <div className="flex flex-col h-screen bg-[#FAF6EF] dark:bg-neutral-950">
      {/* 头部 */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white safe-area-inset-top">
        <Link href="/landing" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-semibold">Max</h1>
          <p className="text-xs text-white/70">Your Personal Health Agent</p>
        </div>
        <div className="w-9" /> {/* 占位保持居中 */}
      </header>

      {/* 消息列表 */}
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
                  {/* 消息气泡 */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-[#0B3D2E] text-white rounded-br-md'
                        : 'bg-white dark:bg-neutral-800 text-[#2C2C2C] dark:text-white rounded-bl-md shadow-sm border border-[#E7E1D6] dark:border-neutral-700'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                  </div>

                  {/* 方案卡片 */}
                  {!isUser && plans.length > 0 && (
                    <div className="mt-3">
                      <AIPlanCard
                        plans={plans}
                        onConfirm={(selectedPlan) => handlePlanConfirm(selectedPlan)}
                      />
                    </div>
                  )}

                  {/* 论文来源 */}
                  {!isUser && message.papers && message.papers.length > 0 && (
                    <div className="mt-3">
                      <PaperSources
                        papers={message.papers.map(p => ({
                          paperId: p.url || `paper-${p.rank || 0}`,
                          title: p.title,
                          citationCount: p.citationCount,
                          year: p.year || new Date().getFullYear(),
                          url: p.url || '',
                        }))}
                      />
                    </div>
                  )}

                  {/* 时间戳 */}
                  <p className={`text-[10px] mt-1 ${isUser ? 'text-right text-[#0B3D2E]/50' : 'text-[#0B3D2E]/40'}`}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* 加载状态 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-[#E7E1D6] dark:border-neutral-700">
              <AIThinkingLoader />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
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
            disabled={!input.trim() || isLoading}
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
