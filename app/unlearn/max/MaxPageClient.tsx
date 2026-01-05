'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIAssistantProfile, RoleType } from '@/types/assistant';
import AIPlanCard from '@/components/AIPlanCard';
import { containsPlans, parsePlans, type ParsedPlan } from '@/lib/plan-parser';
import { AIThinkingLoader } from '@/components/AIThinkingLoader';
import { MotionButton } from '@/components/motion/MotionButton';
import { generateActiveInquiry, type DailyLog } from '@/lib/active-inquiry';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Zap, Brain, Sparkles, Menu, X, Mic } from 'lucide-react';
import { useMax } from '@/hooks/domain/useMax';
import { usePlans } from '@/hooks/domain/usePlans';
import { ChatSidebar } from '@/components/chat/ChatSidebar';

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
  id: string;
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
    deleteChat,
    sendMessage,
    modelMode,
    setModelMode,
    starterQuestions,
  } = useMax();
  const { createFromAI } = usePlans();

  const [input, setInput] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Convert Max messages to UI messages
  const messages: Message[] = maxMessages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.created_at || Date.now()),
    // Note: We lose papers/consensus metadata here as useMax doesn't support it yet.
  }));

  // Initialize: Load last conversation or create new
  // Initialize: Always create NEW conversation
  useEffect(() => {
    if (historyLoaded) return;
    if (!isHistoryLoading) {
      // Force new conversation every time page opens
      newConversation();
      setHistoryLoaded(true);
    }
  }, [isHistoryLoading, historyLoaded, newConversation]);

  // Auto-scroll. Should only auto-scroll if it is active state.
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

  // Handle Plan Confirm
  const handlePlanConfirm = async (selectedPlan: ParsedPlan) => {
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

  const handlePlanConfirmWithModification = useCallback(
    async (selectedPlan: ParsedPlan, modification: string) => {
      const promptLines = [
        '请基于我刚选择的方案进行调整，并保持中强度。',
        `修改要求：${modification}`,
        `方案标题：${selectedPlan.title}`,
        selectedPlan.content ? `方案内容：${selectedPlan.content}` : '',
        selectedPlan.difficulty ? `当前难度：${selectedPlan.difficulty}` : '',
        selectedPlan.duration ? `当前时长：${selectedPlan.duration}` : '',
        '请按系统规定的方案格式输出，给出2-3个可选方案，并包含平替选项。',
      ].filter(Boolean);

      await sendMessage(promptLines.join('\n'));
    },
    [sendMessage]
  );

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

  const handleSuggestionClick = useCallback((question: string) => {
    setInput(question);
    inputRef.current?.focus();
  }, []);

  const showInlineStarters = starterQuestions.length > 0 && messages.length > 0;

  // Modal close handler
  const router = useRouter();
  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/unlearn');
    }
  }, [router]);

  return (
    // Backdrop
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md sm:p-6 md:p-8 animate-in fade-in duration-300 font-sans text-sm">

      {/* Modal Window - use dvh for keyboard-aware height on iOS */}
      <div className="w-full h-[100dvh] sm:h-[92vh] sm:max-w-[1400px] bg-gradient-to-br from-[#0B3D2E] to-[#020A08] text-white/90 sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/10 animate-in zoom-in-95 duration-300">

        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors backdrop-blur-md group"
          title="Close"
        >
          <X className="w-6 h-6 opacity-70 group-hover:opacity-100" />
        </button>

        {/* Sidebar */}
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewConversation={async () => { await newConversation(); setSidebarOpen(false); }}
          onSwitchConversation={(id) => { switchConversation(id); setSidebarOpen(false); }}
          onDeleteConversation={async (id) => { await deleteChat(id); }}
          isLoading={isHistoryLoading}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 bg-transparent relative transition-all duration-300 ${sidebarOpen ? 'md:blur-0 blur-sm pointer-events-none md:pointer-events-auto opacity-50 md:opacity-100' : ''}`}>

          {/* Floating Menu Button (Mobile) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-5 left-5 z-40 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors backdrop-blur-md md:hidden"
            title={sidebarOpen ? '关闭侧栏' : '打开侧栏'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Empty State Layout */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500">

              {/* Hero Logo & Greeting */}
              <div className="flex flex-col items-center mb-10 scale-90 sm:scale-100 transition-transform">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 animate-ping" />
                  <img
                    src="/max-avatar.png"
                    alt="Max Logo"
                    className="relative w-full h-full object-contain drop-shadow-[0_0_30px_rgba(42,157,143,0.4)] animate-pulse"
                    style={{ animationDuration: '4s' }}
                  />
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-medium text-white/90 text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 tracking-tight">
                  Hello, I'm Max.
                </h1>
                <p className="text-white/40 mt-3 text-lg font-light tracking-wide">需要我为你做些什么？</p>
              </div>

              {/* Central Input Box */}
              <div className="w-full max-w-2xl px-4">
                <form onSubmit={handleSubmit} className="relative group">
                  <div className="relative bg-[#2A9D8F]/20 rounded-[2rem] border border-[#2A9D8F]/30 p-2 pl-6 flex items-center gap-2 shadow-2xl transition-all focus-within:border-[#2A9D8F]/40 focus-within:ring-1 focus-within:ring-[#2A9D8F]/40">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="问问 Max..."
                      rows={1}
                      autoFocus
                      className="flex-1 bg-transparent border-0 focus:ring-0 resize-none text-lg text-white placeholder:text-white/30 py-3 font-sans"
                      style={{ maxHeight: '200px' }}
                    />

                    {/* Actions */}
                    <div className="flex items-center gap-1 pr-2">
                      {/* Mode Toggle */}
                      <div className="hidden sm:flex items-center gap-1 bg-black/20 rounded-full p-1 mr-2">
                        <button type="button" onClick={() => setModelMode('fast')} className={`p-2 rounded-full transition-all ${modelMode === 'fast' ? 'bg-amber-500 text-black' : 'text-white/50 hover:text-white'}`}><Zap className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setModelMode('think')} className={`p-2 rounded-full transition-all ${modelMode === 'think' ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white'}`}><Brain className="w-4 h-4" /></button>
                      </div>

                      <button type="button" className="p-3 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"><Mic className="w-5 h-5" /></button>
                      <button type="submit" disabled={!input.trim() || isSending} className="p-3 rounded-full bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-5 h-5 ml-0.5" /></button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Starter Suggestions (Bottom) */}
              {starterQuestions.length > 0 && (
                <div className="mt-12 w-full max-w-4xl px-4">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {starterQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(q)}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-white/80 text-sm transition-all hover:scale-105 active:scale-95 text-left font-sans"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Active Chat State
            <>
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const hasPlans = containsPlans(message.content);
                    const plans = hasPlans ? parsePlans(message.content) : [];
                    const displayContent = hasPlans ? removePlansFromContent(message.content) : message.content;

                    return (
                      <motion.div
                        key={message.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >


                        <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>


                          <div
                            className={`rounded-2xl px-5 py-4 border backdrop-blur-md shadow-sm ${isUser
                              ? 'bg-[#2A9D8F]/20 border-[#2A9D8F]/30 text-white rounded-br-sm'
                              : 'bg-white/5 border-white/10 text-white/90 rounded-bl-sm'
                              }`}
                          >
                            <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                          </div>

                          {!isUser && plans.length > 0 && (
                            <div className="mt-3 w-full">
                              <AIPlanCard
                                plans={plans}
                                onConfirm={(selectedPlan) => handlePlanConfirm(selectedPlan)}
                                onConfirmWithModification={handlePlanConfirmWithModification}
                              />
                            </div>
                          )}

                          <p className={`text-[10px] mt-1 ${isUser ? 'text-right text-white/20' : 'text-white/20'}`}>
                            {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {isSending && (
                    <motion.div key="thinking-indicator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                      {/* Standard Max Avatar for Thinking State */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full overflow-hidden relative flex items-center justify-center bg-white/10 ring-1 ring-white/20">
                          <img src="/max-avatar.png" className="w-full h-full object-cover animate-pulse" alt="Max is thinking..." />
                        </div>
                      </div>

                      {/* Thinking Bubble */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                        <AIThinkingLoader />
                      </div>
                    </motion.div>
                  )}

                  {/* Inline Starter Suggestions */}
                  {starterQuestions.length > 0 && messages.length < 3 && (
                    <div className="py-4">
                      <div className="flex flex-wrap items-center justify-start gap-2 pl-1">
                        {starterQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(q)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/70 text-sm transition-all hover:scale-105 active:scale-95 text-left font-sans"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div key="messages-end" ref={messagesEndRef} />
                </AnimatePresence>
              </div>

              {/* Bottom Input Area (Sticky) - with keyboard safe area */}
              <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-t from-black/40 to-transparent pb-safe">
                <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
                  <div className="relative bg-[#2A9D8F]/20 rounded-[24px] border border-[#2A9D8F]/30 flex items-end gap-2 p-2 shadow-lg transition-colors hover:border-[#2A9D8F]/40 focus-within:border-[#2A9D8F]/40">

                    {/* Compact Mode Toggle */}
                    <div className="flex flex-col gap-1 pb-2 pl-2">
                      <button type="button" onClick={() => setModelMode('fast')} className={`p-1.5 rounded-lg transition-all ${modelMode === 'fast' ? 'text-amber-400 bg-white/10' : 'text-white/30 hover:text-white'}`}><Zap className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setModelMode('think')} className={`p-1.5 rounded-lg transition-all ${modelMode === 'think' ? 'text-indigo-400 bg-white/10' : 'text-white/30 hover:text-white'}`}><Brain className="w-4 h-4" /></button>
                    </div>

                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="问问 Max..."
                      rows={1}
                      className="flex-1 bg-transparent border-0 focus:ring-0 resize-none text-sm sm:text-base text-white placeholder:text-white/30 py-3 max-h-32 font-sans"
                    />

                    <div className="flex items-center gap-1 pb-1 pr-1">
                      <button type="button" className="p-2 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"><Mic className="w-5 h-5" /></button>
                      <button type="submit" disabled={!input.trim() || isSending} className="p-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-50 hover:opacity-100"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
