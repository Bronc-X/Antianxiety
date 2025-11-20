'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { motion } from 'framer-motion';
import { AI_ROLES } from '@/lib/config/constants';
import type { AIAssistantProfile, ConversationRow, RoleType } from '@/types/assistant';

// TypeScript 类型定义
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

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// 使用 SVG 图标替代 lucide-react
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const MicOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 7l10 10" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

interface Message {
  role: RoleType;
  content: string;
  timestamp: Date;
}

interface AIAssistantFloatingChatProps {
  initialProfile?: AIAssistantProfile | null;
  onClose?: () => void;
}

const resolveDisplayName = (profile?: AIAssistantProfile | null): string => {
  if (!profile) return '朋友';
  const candidates = [
    profile.full_name,
    profile.nickname,
    profile.preferred_name,
    profile.username,
    profile.email?.split?.('@')?.[0],
  ];
  const found = candidates.find((item?: string | null) => item && String(item).trim().length > 0);
  return found ? String(found).trim() : '朋友';
};

const extractHabitMemory = (profile?: AIAssistantProfile | null): string | string[] | null => {
  if (!profile) return null;
  if (profile.habit_memory_summary) return profile.habit_memory_summary;
  if (Array.isArray(profile.habit_focus) && profile.habit_focus.length > 0) {
    return profile.habit_focus;
  }
  if (profile.latest_habit_note) return profile.latest_habit_note;
  return null;
};

export default function AIAssistantFloatingChat({ initialProfile, onClose }: AIAssistantFloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsVoiceSupported(hasSpeechRecognition);

      if (hasSpeechRecognition) {
        const speechWindow = window as Window & {
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
          SpeechRecognition?: SpeechRecognitionConstructor;
        };
        const SpeechRecognitionCtor =
          speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition;
        if (!SpeechRecognitionCtor) {
          setVoiceError('当前浏览器不支持语音识别功能');
          return;
        }

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
          const errorType = event.error;
          setIsRecording(false);
          
          // 根据错误类型显示不同的提示
          switch (errorType) {
            case 'not-allowed':
              setVoiceError('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
              break;
            case 'no-speech':
              setVoiceError('未检测到语音，请重试');
              break;
            case 'audio-capture':
              setVoiceError('无法访问麦克风，请检查设备设置');
              break;
            case 'network':
              setVoiceError('网络错误，请检查网络连接');
              break;
            case 'aborted':
              // 用户主动停止，不显示错误
              setVoiceError(null);
              break;
            default:
              setVoiceError(`语音识别错误: ${errorType}`);
          }
          
          // 3秒后自动清除错误提示
          if (errorType !== 'aborted') {
            setTimeout(() => setVoiceError(null), 3000);
          }
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // 加载对话历史
  const loadConversationHistory = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20)
        .returns<ConversationRow[]>();

      if (error) {
        console.error('加载对话历史时出错:', error);
        return;
      }

      if (data && data.length > 0) {
        const historyMessages: Message[] = data.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('加载对话历史时出错:', error);
    }
  }, [supabase]);

  // 初始化聊天
  useEffect(() => {
    const initializeChat = async () => {
      await loadConversationHistory();
    };

    initializeChat();
  }, [loadConversationHistory]);

  // 显示欢迎消息（如果没有历史消息）
  useEffect(() => {
    if (messages.length === 0 && initialProfile) {
      const welcomeMessage = generateWelcomeMessage(initialProfile);
      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, [initialProfile, messages.length]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 生成欢迎消息
  const generateWelcomeMessage = (profile: AIAssistantProfile): string => {
    if (!profile) {
      return `你好，我是你的专属健康代理。\n朋友，我会记住你的习惯偏好，随时等你继续对话。\n\n有什么问题随时问我。`;
    }

    const analysis = profile.ai_analysis_result;
    const plan = profile.ai_recommendation_plan;
    const displayName = resolveDisplayName(profile);
    const habitMemory = extractHabitMemory(profile);

    if (!analysis || !plan) {
      return `你好，我是你的专属健康代理。\n${displayName}，我会继续跟踪你的微习惯，保持上下文不丢失。\n\n你的资料正在分析中，请稍候。有什么问题随时问我。`;
    }

    let message = `你好，我是你的专属健康代理。\n${displayName}，很高兴继续陪你一起复盘。\n`;
    if (habitMemory) {
      if (Array.isArray(habitMemory)) {
        message += `我已经记住你最近专注的习惯：${habitMemory.slice(0, 3).join('、')}。\n\n`;
      } else {
        message += `我已经记住你最近的习惯重点：「${habitMemory}」。\n\n`;
      }
    } else {
      message += `我会持续保留你的习惯记忆，确保我们每次对话都在同一上下文里。\n\n`;
    }
    message += `基于你提供的资料，我已经完成了初步分析（置信度：${analysis.confidence_score || 0}%）。\n\n`;
    message += `有什么问题随时问我。`;

    return message;
  };

  // 处理语音输入
  const handleVoiceInput = async () => {
    if (!recognition) {
      setVoiceError('您的浏览器不支持语音识别功能');
      setTimeout(() => setVoiceError(null), 3000);
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    // 检查麦克风权限
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 如果权限已授予，停止流并开始语音识别
      stream.getTracks().forEach(track => track.stop());
      setVoiceError(null);
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      setIsRecording(false);
      const domError = error as DOMException;
      if (domError.name === 'NotAllowedError' || domError.name === 'PermissionDeniedError') {
        setVoiceError('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
      } else if (domError.name === 'NotFoundError' || domError.name === 'DevicesNotFoundError') {
        setVoiceError('未找到麦克风设备，请检查设备连接');
      } else {
        setVoiceError('无法访问麦克风，请检查设备设置');
      }
      setTimeout(() => setVoiceError(null), 5000);
    }
  };

  // 处理消息发送
  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
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

    await saveMessage(userMessage);

    const aiResponse = await generateAIResponse(currentInput);

    const assistantMessage: Message = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);

    await saveMessage(assistantMessage);
  };

  // 保存消息
  const saveMessage = async (message: Message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
          metadata: {
            timestamp: message.timestamp.toISOString(),
          },
        });
    } catch (error) {
      console.error('保存消息时出错:', error);
    }
  };

  // 生成 AI 回复
  const generateAIResponse = async (userInput: string): Promise<string> => {
    try {
      const conversationHistory = messages
        .filter(msg => msg.role === AI_ROLES.USER || msg.role === AI_ROLES.ASSISTANT)
        .map(msg => ({
          role: msg.role === AI_ROLES.USER ? AI_ROLES.USER : AI_ROLES.ASSISTANT,
          content: msg.content,
        }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: conversationHistory,
          userProfile: initialProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 服务暂时不可用');
      }

      const data = await response.json();
      return data.response || '抱歉，我无法生成回复。';
    } catch (error) {
      console.error('调用 AI API 时出错:', error);
      return `抱歉，AI 服务暂时不可用。请稍后重试。`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-96 h-full sm:h-[600px] flex flex-col bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-[#E7E1D6] overflow-hidden"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white safe-area-inset-top">
        <div>
          <h3 className="text-xl sm:text-lg font-semibold">AI 助理</h3>
          <p className="text-sm sm:text-xs text-white/80">你的专属健康代理</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 sm:p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors touch-manipulation"
            aria-label="关闭"
          >
            <XIcon className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#FAF6EF] space-y-3 sm:space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-[#0B3D2E]/60 py-8">
            <p className="text-base sm:text-sm">开始与你的 AI 助理对话吧</p>
            <p className="text-sm sm:text-xs mt-2 text-[#0B3D2E]/40">点击麦克风图标可以语音输入</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === AI_ROLES.USER ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-4 py-2.5 sm:px-3 sm:py-2 ${
                    message.role === AI_ROLES.USER
                      ? 'bg-[#0B3D2E] text-white'
                      : 'bg-white text-[#0B3D2E] border border-[#E7E1D6]'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-base sm:text-sm leading-relaxed">{message.content}</div>
                  <div className={`text-xs mt-1.5 sm:mt-1 ${message.role === AI_ROLES.USER ? 'text-white/70' : 'text-[#0B3D2E]/60'}`}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E7E1D6] rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#0B3D2E]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#0B3D2E]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#0B3D2E]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入框 */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#E7E1D6] safe-area-inset-bottom">
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题..."
              className="w-full rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] px-4 py-3 sm:py-2 pr-12 sm:pr-10 text-base sm:text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 touch-manipulation"
              disabled={isLoading}
            />
            {recognition && (
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-1.5 rounded-full transition-colors touch-manipulation ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-[#0B3D2E]/60 active:bg-[#0B3D2E]/20 sm:hover:text-[#0B3D2E] sm:hover:bg-[#0B3D2E]/10'
                }`}
                aria-label={isRecording ? '停止录音' : '开始录音'}
              >
                {isRecording ? <MicOffIcon className="w-5 h-5 sm:w-4 sm:h-4" /> : <MicIcon className="w-5 h-5 sm:w-4 sm:h-4" />}
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-5 py-3 sm:px-4 sm:py-2 text-white shadow-md active:shadow-lg sm:hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation min-w-[48px] sm:min-w-0"
            aria-label="发送"
          >
            <SendIcon className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </form>
        {isRecording && (
          <div className="mt-2 text-xs text-center text-red-500 animate-pulse">
            正在录音...
          </div>
        )}
        {voiceError && (
          <div className="mt-2 text-xs text-center text-red-500 bg-red-50 px-2 py-1 rounded">
            {voiceError}
          </div>
        )}
        {!isVoiceSupported && (
          <div className="mt-2 text-xs text-center text-[#0B3D2E]/60">
            您的浏览器不支持语音输入
          </div>
        )}
      </div>
    </motion.div>
  );
}

