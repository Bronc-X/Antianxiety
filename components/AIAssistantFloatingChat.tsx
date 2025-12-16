'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_ROLES } from '@/lib/config/constants';
import type { AIAssistantProfile, RoleType } from '@/types/assistant';
import { ImageUploadIcon, MicrophoneIcon } from '@/components/ui/Icons';
import AIPlanCard from '@/components/AIPlanCard';
import { containsPlans, parsePlans, type ParsedPlan } from '@/lib/plan-parser';
import { PaperSources } from '@/components/chat/PaperSources';
import { AIThinkingLoader } from '@/components/AIThinkingLoader';
import { MotionButton } from '@/components/motion/MotionButton';
import { generateActiveInquiry, type DailyLog } from '@/lib/active-inquiry';

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
const HistoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const GalleryIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionErrorEvent {
  error: string;
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
export default function AIAssistantFloatingChat({ initialProfile, dailyLogs = [], onClose }: AIAssistantFloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();

  // MiniMax UI States
  const [showHistory, setShowHistory] = useState(true);
  const isInitialState = messages.length === 0 && !isLoading;

  // Load History
  useEffect(() => {
    const loadHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('chat_conversations')
        .select('role, content, created_at, session_id, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const sorted = [...data].reverse();
        setMessages(sorted.map(msg => ({
          role: msg.role as RoleType,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          papers: (msg.metadata as any)?.papers,
          consensus: (msg.metadata as any)?.consensus
        })));
        if (sorted[sorted.length - 1].session_id) {
          setSessionId(sorted[sorted.length - 1].session_id);
        }
      }
    };
    loadHistory();
  }, [supabase]);

  // Voice Init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsVoiceSupported(hasSpeechRecognition);
      if (hasSpeechRecognition) {
        const speechWindow = window as unknown as {
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
          SpeechRecognition?: SpeechRecognitionConstructor;
        };
        const SpeechRecognitionCtor = speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition;
        if (SpeechRecognitionCtor) {
          const recognitionInstance = new SpeechRecognitionCtor();
          recognitionInstance.continuous = false;
          recognitionInstance.interimResults = false;
          recognitionInstance.lang = 'zh-CN';
          recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + transcript);
            setIsRecording(false);
            setVoiceError(null);
          };
          recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
            setIsRecording(false);
            setVoiceError(`语音识别错误: ${event.error}`); // Simplified error handling
            setTimeout(() => setVoiceError(null), 3000);
          };
          recognitionInstance.onend = () => setIsRecording(false);
          setRecognition(recognitionInstance);
        }
      }
    }
  }, []);

  const handleVoiceInput = async () => {
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setVoiceError(null);
      recognition.start();
      setIsRecording(true);
    } catch {
      setVoiceError('无法访问麦克风');
    }
  };

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

    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setIsGeneratingAnswer(true);

    try {
      // Parallel fetch papers & AI
      const papersPromise = fetch('/api/chat/papers', {
        method: 'POST', body: JSON.stringify({ query: currentInput })
      }).then(res => res.json()).catch(() => ({}));

      const aiResponsePromise = fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      const [papersData, aiResponse] = await Promise.all([papersPromise, aiResponsePromise]);

      let aiContent = '抱歉，无法生成回复。';
      let papers = papersData.papers || [];
      // Handle AI Stream (Simplified for this rewrite, ideally use full reader)
      if (aiResponse.ok && aiResponse.body) {
        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        aiContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiContent += decoder.decode(value, { stream: true });
        }
        // Check headers for papers if API returns them there
        const papersHeader = aiResponse.headers.get('x-antianxiety-papers');
        if (papersHeader && papers.length === 0) {
          try { papers = JSON.parse(Buffer.from(papersHeader, 'base64').toString()); } catch { }
        }
      }

      setUploadedImage(null);

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        papers: papers,
        consensus: papersData.consensus
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save to DB
      await saveMessage(userMessage);
      await saveMessage(assistantMessage);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: '发生错误，请重试', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setIsGeneratingAnswer(false);
    }
  };

  const saveMessage = async (msg: Message) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('chat_conversations').insert({
      user_id: user.id,
      role: msg.role,
      content: msg.content,
      metadata: { timestamp: msg.timestamp, papers: msg.papers },
      session_id: sessionId
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  // 处理方案确认
  const handlePlanConfirm = async (selectedPlan: any) => {
    console.log('=== 开始保存方案 ===', selectedPlan);
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
        body: JSON.stringify({ plans: [selectedPlan], sessionId: sessionId }),
      });

      const result = await response.json();

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));

      if (!response.ok) throw new Error(result.error || '保存计划失败');

      window.dispatchEvent(new CustomEvent('planSaved', { detail: result.data }));

      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ **保存成功！**\n\n您选择的「${selectedPlan.title}」已成功添加至您的健康方案表。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      await saveMessage(confirmMessage);

    } catch (error) {
      console.error('保存失败:', error);
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 保存失败，请重试', timestamp: new Date() }]);
    }
  };

  const handlePlanConfirmWithModification = async (currentPlan: any, modification: string) => {
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
      const response = await fetch('/api/plans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans: [modifiedPlan], sessionId: sessionId }),
      });
      const result = await response.json();

      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在应用修改并保存...'));
      if (!response.ok) throw new Error(result.error || '保存计划失败');

      window.dispatchEvent(new CustomEvent('planSaved', { detail: result.data }));

      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ **保存成功！**\n\n您选择的「${currentPlan.title}」已成功添加至您的健康方案表。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      await saveMessage(confirmMessage);
    } catch (error) {
      console.error('保存失败:', error);
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在应用修改并保存...'));
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 保存失败，请重试', timestamp: new Date() }]);
    }
  };

  // Auto scroll
  useEffect(() => {
    if (!isInitialState) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialState]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-7xl h-[85vh] bg-white rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200">

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
                        <img src="/max-avatar.png" alt="Max" className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className={`max-w-[80%] space-y-2`}>
                      {/* MESSAGE BUBBLE */}
                      <div className={`p-4 rounded-2xl shadow-sm ${message.role === AI_ROLES.USER
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white border border-[#E7E1D6] text-[#0B3D2E] rounded-tl-none'
                        }`}>
                        <div className="whitespace-pre-wrap leading-relaxed font-sans">
                          {message.role === AI_ROLES.ASSISTANT && containsPlans(message.content)
                            ? removePlansFromContent(message.content)
                            : message.content}
                        </div>
                      </div>

                      {/* AI EXTRAS */}
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
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
                      <AIThinkingLoader size="sm" showProgress={true} />
                    </div>
                  </div>
                )}
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

        </div>
      </div>
    </motion.div>
  );
}
