'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AI_ROLES } from '@/lib/config/constants';
import type { AIAssistantProfile, RoleType } from '@/types/assistant';
import { ImageUploadIcon } from '@/components/ui/Icons';
import AIPlanCard from '@/components/AIPlanCard';
import { containsPlans, parsePlans, type ParsedPlan } from '@/lib/plan-parser';
import { PaperSources } from '@/components/chat/PaperSources';
import { AIThinkingBlock } from '@/components/AIThinkingBlock';
import { type DailyLog, type PlanItem } from '@/lib/active-inquiry';
import { PlanReviewChecklist } from '@/components/PlanReviewChecklist';
import { useChatAI } from '@/hooks/domain/useChatAI';
import { useChatConversation } from '@/hooks/domain/useChatConversation';
import { usePlans } from '@/hooks/domain/usePlans';
import Image from 'next/image';

// --- Icons ---
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);


// --- Helper Functions ---
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

// --- Types ---
type SpeechRecognitionConstructor = new () => SpeechRecognition;
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
}

interface Message {
  role: RoleType;
  content: string;
  timestamp: Date;
  papers?: PaperSource[];
  thought?: string; // 🆕 Added thought process field
  isThinking?: boolean; // 🆕 Track if currently thinking
  consensus?: { score: number; level: string; rationale?: string };
  reviewItems?: PlanItem[]; // 🆕 Added reviewItems for checklist UI
}
interface PaperSource {
  rank?: number;
  title: string;
  citationCount: number;
  year?: number;
  url?: string;
  authorityScore?: number;
}
// ParsedPlan is imported from @/lib/plan-parser, removing local definition to avoid conflict

interface AIAssistantFloatingChatProps {
  initialProfile?: AIAssistantProfile | null;
  dailyLogs?: DailyLog[];
  onClose?: () => void;
}

const resolveDisplayName = (profile?: AIAssistantProfile | null): string => {
  if (!profile) return '朋友';
  const candidates = [
    profile.full_name,
    profile.nickname,
    profile.preferred_name
  ];
  const found = candidates.find((item: string | null | undefined) => item && item.trim().length > 0);
  return found ? found.trim() : '朋友';
};

// --- Main Component ---
export default function AIAssistantFloatingChat({ initialProfile, onClose }: AIAssistantFloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { sendPayload, error: chatError } = useChatAI();
  const {
    loadHistory: loadConversationHistory,
    saveMessage: persistMessage,
    isLoading: historyLoading,
    error: historyError,
  } = useChatConversation();
  const { createFromAI } = usePlans();

  // MiniMax UI States
  const [historyLoaded, setHistoryLoaded] = useState(false); // 🆕
  const isInitialState = messages.length === 0 && !isLoading;

  // Load History
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await loadConversationHistory(50);
        if (data && data.length > 0) {
          const sorted = [...data].reverse();
          setMessages(sorted.map(msg => {
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
          }));
          setSessionId(sorted[sorted.length - 1]?.session_id || null);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setHistoryLoaded(true); // 🆕 Mark history as loaded
      }
    };
    loadHistory();
  }, [loadConversationHistory]);

  // Voice Init
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const speechWindow = window as unknown as {
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
      SpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor = speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognitionInstance = new SpeechRecognitionCtor();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'zh-CN';
    recognitionRef.current = recognitionInstance;
  }, []);

  const handleSaveMessage = useCallback(async (msg: Message) => {
    try {
      const success = await persistMessage({
        role: msg.role,
        content: msg.content,
        session_id: sessionId,
        metadata: {
          timestamp: msg.timestamp.toISOString(),
          papers: msg.papers,
          consensus: msg.consensus,
        },
      });
      if (!success) {
        console.error('保存消息失败');
      }
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  }, [persistMessage, sessionId]);

  // 🆕 Active Inquiry Trigger
  useEffect(() => {
    const checkActiveInquiry = async () => {
      // Wait for history load, and only trigger if no messages exist
      if (!historyLoaded || messages.length > 0) return;

      try {
        const data = await sendPayload({ trigger_checkin: true, stream: false });
        if (data?.content) {
          const activeMsg: Message = {
            role: 'assistant',
            content: data.content,
            timestamp: new Date(),
            reviewItems: data.metadata?.reviewItems // 🆕 Capture review items
          };
          setMessages([activeMsg]);
          await handleSaveMessage(activeMsg);
        }
      } catch (e) {
        console.error('Active inquiry failed:', e);
      }
    };

    checkActiveInquiry();
  }, [historyLoaded, messages.length, handleSaveMessage, sendPayload]); // Run when historyLoaded changes

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('图片太大'); return; }
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Chat Logic
  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    setInput('');
    setIsLoading(true);

    try {
      // 🆕 Initialize assistant message with thinking state
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isThinking: true,
        thought: '正在调取用户画像...\n分析今日监测数据...\n搜索相关临床文献...'
      };
      setMessages(prev => [...prev, assistantMessage]);

      const chatData = await sendPayload({
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        stream: false,
      });

      if (!chatData) {
        throw new Error('AI response failed');
      }

      const aiContent =
        chatData?.data?.answer
        || chatData?.response
        || chatData?.reply
        || chatData?.message
        || '抱歉，无法生成回复。';
      const papers = chatData?.papers || [];
      const consensus = chatData?.consensus;

      setUploadedImage(null);

      // 🆕 Finalize assistant message
      setMessages(prev => {
        const last = [...prev];
        const msg = last[last.length - 1];
        if (msg && msg.role === 'assistant') {
          msg.isThinking = false;
          msg.papers = papers;
          msg.consensus = consensus;
          msg.content = aiContent;
        }
        return last;
      });

      // Save to DB
      const finalAssistantMsg = {
        role: 'assistant' as RoleType,
        content: aiContent,
        timestamp: new Date(),
        papers,
        thought: assistantMessage.thought
      };
      await handleSaveMessage(userMessage);
      await handleSaveMessage(finalAssistantMsg);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: '发生错误，请重试', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  // 处理方案确认
  const handlePlanConfirm = async (selectedPlan: ParsedPlan) => {
    console.log('=== 开始保存方案 ===', selectedPlan);
    const loadingMessage: Message = {
      role: 'assistant',
      content: '⏳ 正在保存您的计划...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const createdPlans = await createFromAI([selectedPlan as ParsedPlan], sessionId || undefined);

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));

      if (!createdPlans) throw new Error('保存计划失败');

      window.dispatchEvent(new CustomEvent('planSaved', { detail: createdPlans }));

      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ **保存成功！**\n\n您选择的「${selectedPlan.title}」已成功添加至您的健康方案表。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      await handleSaveMessage(confirmMessage);

    } catch (error) {
      console.error('保存失败:', error);
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 保存失败，请重试', timestamp: new Date() }]);
    }
  };

  const handlePlanConfirmWithModification = async (currentPlan: ParsedPlan, modification: string) => {
    const loadingMessage: Message = {
      role: 'assistant',
      content: '⏳ 正在应用修改并保存...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    const modifiedPlan = {
      ...currentPlan,
      content: `${currentPlan.content}\n\n📝 补充说明：${modification}`,
    };

    try {
      const createdPlans = await createFromAI([modifiedPlan as ParsedPlan], sessionId || undefined);

      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在应用修改并保存...'));
      if (!createdPlans) throw new Error('保存计划失败');

      window.dispatchEvent(new CustomEvent('planSaved', { detail: createdPlans }));

      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ **保存成功！**\n\n您选择的「${currentPlan.title}」已成功添加至您的健康方案表。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      await handleSaveMessage(confirmMessage);
    } catch (error) {
      console.error('保存失败:', error);
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在应用修改并保存...'));
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 保存失败，请重试', timestamp: new Date() }]);
    }
  };

  // 🆕 Handle Plan Review Checklist Submission
  const handlePlanReviewSubmit = async (selectedItems: PlanItem[]) => {
    let content = '';
    if (selectedItems.length === 0) {
      content = "一切正常，我都能坚持。";
    } else {
      const itemTexts = selectedItems.map(i => i.text).join('\n- ');
      content = `我在执行以下项目时遇到了困难，请帮我调整或提供平替方案：\n- ${itemTexts}`;
    }

    // Add user message
    const userMessage: Message = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    await handleSaveMessage(userMessage);

    setIsLoading(true);

    // Send to AI
    try {
      const data = await sendPayload({
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        stream: false,
      });

      if (data) {
        const aiContent =
          data?.data?.answer
          || data?.response
          || data?.reply
          || data?.message
          || '抱歉，无法生成回复。';

        const assistantMessage: Message = {
          role: 'assistant',
          content: aiContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        await handleSaveMessage(assistantMessage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto scroll
  useEffect(() => {
    if (!isInitialState) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialState]);

  const isHistoryLoading = historyLoading && !historyLoaded;
  const errorMessage = historyError || chatError;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div className={`w-full max-w-7xl h-[85vh] bg-white rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200 ${isHistoryLoading ? 'animate-pulse' : ''}`}>

        {/* --- Sidebar --- */}
        <div className="w-64 bg-gray-50/50 border-r border-gray-100 flex flex-col hidden md:flex">
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center gap-2 transition-all hover:shadow-md active:scale-95"
            >
              <PlusIcon className="w-5 h-5" />
              <span>新建任务</span>
            </button>
            <div className="mt-4 relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索"
                className="w-full bg-gray-100 hover:bg-white focus:bg-white text-sm py-2 pl-9 pr-3 rounded-lg border-transparent focus:border-gray-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            <div className="text-xs font-medium text-gray-400 px-3 py-2">任务记录</div>
            {/* Context specific history items could go here */}
            <div className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm text-gray-600 truncate transition-colors">
              如何缓解焦虑...
            </div>
            <div className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer text-sm text-gray-600 truncate transition-colors">
              睡眠改善计划
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">A</div>
              <div className="text-sm font-medium text-gray-700">AntiAnxiety User</div>
            </div>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 flex flex-col relative bg-white">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 overflow-y-auto ${isInitialState ? 'flex items-center justify-center' : ''}`}>

            {isInitialState ? (
              <div className="max-w-2xl w-full px-8 flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-4xl font-medium text-gray-900 mb-4">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return '上午好';
                      if (hour < 18) return '下午好';
                      return '晚上好';
                    })()}，有什么可以帮忙的？
                  </h1>
                </motion.div>

                {/* Centered Input for Initial State */}
                <div className="w-full relative group">
                  <form onSubmit={handleSubmit}>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="请输入任务，然后交给 AI Agent"
                      className="w-full h-40 p-6 pr-32 rounded-3xl border border-gray-200 shadow-sm focus:shadow-lg focus:border-gray-300 outline-none resize-none text-lg text-gray-700 bg-white transition-shadow"
                    />
                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                        <button type="button" className="px-3 py-1 text-xs font-medium text-gray-700 bg-white shadow-sm rounded-md">高效</button>
                        <button type="button" className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">自定义</button>
                        <button type="button" className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">专业</button>
                      </div>
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="bg-[#0B3D2E] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#06261c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        运行
                      </button>
                    </div>
                    <div className="absolute bottom-6 left-6 flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <ImageUploadIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>

                <div className="flex flex-wrap gap-3 mt-12 justify-center">
                  {['定时任务', '制作网页', '调研报告', '视频生成', '更多'].map((tag) => (
                    <button key={tag} className="px-5 py-2.5 bg-white border border-gray-100 text-gray-600 rounded-full text-sm font-medium hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-2">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
                {messages.map((message, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index}
                    className={`flex gap-4 ${message.role === AI_ROLES.USER ? 'flex-row-reverse' : ''}`}
                  >
                    {/* AVATAR SECTION */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm border border-gray-100 ${message.role === AI_ROLES.USER ? 'bg-emerald-600' : 'bg-white'}`}>
                      {message.role === AI_ROLES.USER ? (
                        <span className="text-white font-sans font-bold text-lg">
                          {/* Get first char, default to 'U' if empty */}
                          {(resolveDisplayName(initialProfile) || 'User').charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <Image
                          src="/max-avatar.png"
                          alt="Max"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className={`max-w-[80%] space-y-2`}>
                      {/* MESSAGE BUBBLE */}
                      <div className={`p-4 rounded-2xl shadow-sm ${message.role === AI_ROLES.USER
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white border border-[#E7E1D6] text-[#0B3D2E] rounded-tl-none'
                        }`}>
                        <div className="whitespace-pre-wrap leading-relaxed font-sans">
                          {message.role === AI_ROLES.ASSISTANT && (
                            <AIThinkingBlock
                              thought={message.thought}
                              isThinking={message.isThinking || false}
                              defaultExpanded={index === messages.length - 1} // Only expand last one by default
                            />
                          )}
                          {message.role === AI_ROLES.ASSISTANT && containsPlans(message.content)
                            ? removePlansFromContent(message.content)
                            : message.content}
                        </div>
                      </div>

                      {/* AI EXTRAS */}
                      {message.role === AI_ROLES.ASSISTANT && message.reviewItems && message.reviewItems.length > 0 && (
                        <div className="mt-2">
                          <PlanReviewChecklist
                            items={message.reviewItems}
                            onSubmit={handlePlanReviewSubmit}
                          />
                        </div>
                      )}
                      {message.role === AI_ROLES.ASSISTANT && containsPlans(message.content) && (
                        <div className="mt-2">
                          <AIPlanCard
                            plans={parsePlans(message.content)}
                            onConfirm={handlePlanConfirm}
                            onConfirmWithModification={handlePlanConfirmWithModification}
                          />
                        </div>
                      )}
                      {message.role === AI_ROLES.ASSISTANT && message.papers && message.papers.length > 0 && (
                        <div className="mt-2">
                          <PaperSources
                            papers={message.papers.map(p => ({
                              paperId: p.url || `paper-${p.rank}`,
                              title: p.title,
                              citationCount: p.citationCount,
                              url: p.url || `https://scholar.google.com/scholar?q=${encodeURIComponent(p.title)}`, // Fallback to Google Scholar
                              year: p.year,
                            }))}
                            defaultExpanded={false}
                            maxVisible={3}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Bottom Chat Input (Only shows when chat is active) */}
          {!isInitialState && (
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="max-w-4xl mx-auto relative">
                <div className="relative border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-[#0B3D2E]/10 bg-white">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="输入新的消息..."
                    className="w-full py-4 pl-4 pr-32 rounded-2xl outline-none resize-none bg-transparent"
                    style={{ minHeight: '60px', maxHeight: '120px' }}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    {uploadedImage && <span className="text-xs bg-gray-100 px-2 py-1 rounded">已传图</span>}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                    >
                      <ImageUploadIcon className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim() && !uploadedImage}
                      className="p-2 bg-[#0B3D2E] text-white rounded-lg hover:bg-[#06261c] disabled:opacity-50 transition-colors"
                    >
                      <SendIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          {errorMessage && (
            <p className="mt-3 text-sm text-red-500">{errorMessage}</p>
          )}

        </div>
      </div>
    </motion.div>
  );
}
