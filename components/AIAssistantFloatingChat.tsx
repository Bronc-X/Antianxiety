'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_ROLES } from '@/lib/config/constants';
import type { AIAssistantProfile, ConversationRow, RoleType } from '@/types/assistant';
import { ImageUploadIcon, MicrophoneIcon, BrandLogoSimple } from '@/components/ui/Icons';
import AIPlanCard from '@/components/AIPlanCard';
import { containsPlans, parsePlans, type ParsedPlan } from '@/lib/plan-parser';
import { PaperSources } from '@/components/chat/PaperSources';

/**
 * 从消息内容中移除方案部分，避免重复显示
 * 当方案会单独显示为卡片时，从文本中移除方案内容
 */
function removePlansFromContent(content: string): string {
  if (!containsPlans(content)) return content;
  
  // 移除方案块（方案1：xxx 到下一个方案或结尾）
  let cleaned = content.replace(
    /\*{0,2}(?:方案|建议|计划|选项)\s*[1-9一二三四五][\s:：]+\*{0,2}[^\n]*(?:\n(?!\*{0,2}(?:方案|建议|计划|选项)\s*[1-9一二三四五])[^\n]*)*/gi,
    ''
  );
  
  // 清理多余的空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  // 如果清理后内容太短，返回一个简短的提示
  if (cleaned.length < 20) {
    return '根据你的情况，我为你准备了以下方案，请选择一个开始：';
  }
  
  return cleaned;
}
import { BrainLoader } from '@/components/lottie/BrainLoader';
import { AIThinkingLoader } from '@/components/AIThinkingLoader';
import { MotionButton } from '@/components/motion/MotionButton';
import { generateActiveInquiry, type DailyLog } from '@/lib/active-inquiry';

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
  papers?: PaperSource[];  // 论文来源
  consensus?: { score: number; level: string; rationale?: string };  // 共识度
}

// 论文来源类型
interface PaperSource {
  rank?: number;
  title: string;
  citationCount: number;
  year?: number;
  url?: string;
  authorityScore?: number;
}

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

export default function AIAssistantFloatingChat({ initialProfile, dailyLogs = [], onClose }: AIAssistantFloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // 会话ID管理
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();
  

  
  // 处理方案确认
  const handlePlanConfirm = async (selectedPlan: ParsedPlan) => {
    console.log('\n=== 开始保存方案 ===');
    console.log('👤 用户选择的方案:', selectedPlan);
    
    // 显示加载提示
    const loadingMessage: Message = {
      role: 'assistant',
      content: '⏳ 正在保存您的计划...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      
      console.log('📤 准备调用 API...');
      console.log('📍 API 地址:', '/api/plans/create');
      console.log('📦 请求数据:', { plans: [selectedPlan], sessionId });
      
      // 调用API保存计划
      const response = await fetch('/api/plans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plans: [selectedPlan],  // 包装成数组
          sessionId: sessionId 
        }),
      });
      
      console.log('📊 HTTP 状态码:', response.status);
      console.log('📊 响应 OK:', response.ok);
      
      const result = await response.json();
      console.log('📦 API 响应数据:', result);
      
      if (!response.ok) {
        console.error('=== API 调用失败 ===');
        console.error('❌ HTTP 状态:', response.status);
        console.error('❌ 错误详情:', result);
        
        // 移除加载消息
        setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));
        
        throw new Error(result.error || '保存计划失败');
      }
      
      console.log('=== 保存成功 ===');
      console.log('✅ 计划保存成功');
      console.log('📊 保存的计划详情:', result.data?.plans);
      console.log('🔢 保存数量:', result.data?.count);
      
      // 移除加载消息
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));
      
      // 触发全局事件，通知其他组件刷新
      console.log('📢 发送全局事件: planSaved');
      window.dispatchEvent(new CustomEvent('planSaved', { detail: result.data }));
      
      // 显示成功提示
      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ **保存成功！**\n\n您选择的「${selectedPlan.title}」已成功添加至您的健康方案表。\n\n📍 **接下来：**\n1. 前往主页查看您的方案\n2. 每日点击✓勾选记录完成情况\n3. 我将根据您的执行数据为您调整建议`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      
      // 保存确认消息到数据库
      await saveMessage(confirmMessage);
      
    } catch (error) {
      console.error('\n=== 保存失败 ===');
      console.error('❌ 错误类型:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ 错误消息:', error instanceof Error ? error.message : String(error));
      console.error('❌ 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
      
      // 移除加载消息
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在保存您的计划...'));
      
      // 显示错误提示
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ 抱歉，保存计划失败。请稍后重试。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // 处理带修改意见的方案确认 - 直接应用修改并保存，不再需要二次确认
  const handlePlanConfirmWithModification = async (currentPlan: ParsedPlan, modification: string) => {
    console.log('📝 用户确认方案并带修改意见:', currentPlan.title);
    console.log('📝 修改意见:', modification);
    
    // 显示加载提示
    const loadingMessage: Message = {
      role: 'assistant',
      content: '⏳ 正在应用修改并保存...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    // 直接将修改意见合并到方案内容中，然后保存
    const modifiedPlan: ParsedPlan = {
      ...currentPlan,
      content: `${currentPlan.content}\n\n📝 补充说明：${modification}`,
    };
    
    try {
      console.log('📤 准备调用 API 保存修改后的方案...');
      
      // 调用API保存计划
      const response = await fetch('/api/plans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plans: [modifiedPlan],
          sessionId: sessionId 
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // 移除加载消息
        setMessages(prev => prev.filter(msg => msg.content === '⏳ 正在应用修改并保存...'));
        throw new Error(result.error || '保存计划失败');
      }
      
      // 移除加载消息
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在应用修改并保存...'));
      
      // 触发全局事件
      window.dispatchEvent(new CustomEvent('planSaved', { detail: result.data }));
      
      // 直接显示成功消息，不需要再次确认
      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ **保存成功！**\n\n您选择的「${currentPlan.title}」已成功添加至您的健康方案表。\n\n📍 **接下来：**\n1. 前往主页查看您的方案\n2. 每日点击✓勾选记录完成情况\n3. 我将根据您的执行数据为您调整建议`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);
      await saveMessage(confirmMessage);
      
    } catch (error) {
      console.error('❌ 保存失败:', error);
      
      // 移除加载消息
      setMessages(prev => prev.filter(msg => msg.content !== '⏳ 正在应用修改并保存...'));
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ 抱歉，保存计划失败。请稍后重试。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    
    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsVoiceSupported(hasSpeechRecognition);

      if (hasSpeechRecognition) {
        const speechWindow = window as unknown as {
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
    console.log('🔄 开始加载对话历史...');
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ 获取用户失败:', authError);
        return;
      }
      
      if (!user) {
        console.log('⚠️ 用户未登录，跳过加载历史');
        return;
      }
      
      console.log('👤 当前用户:', user.id);

      // 直接加载用户最近的50条对话，不限制session
      // 按时间倒序获取最新的50条，然后在前端反转顺序
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('role, content, created_at, session_id, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ 加载对话历史失败:', error.message, error.details, error.hint);
        return;
      }

      console.log('📊 数据库返回:', data?.length || 0, '条记录');

      if (data && data.length > 0) {
        // 反转顺序，让最早的消息在前面
        const sortedData = [...data].reverse();
        
        const historyMessages: Message[] = sortedData.map((msg) => {
          // 从 metadata 中提取论文和共识度数据
          const metadata = msg.metadata as { 
            papers?: PaperSource[]; 
            consensus?: { score: number; level: string; rationale?: string };
            timestamp?: string;
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
        
        // 设置最后一条消息的session_id为当前sessionId
        const lastSessionId = sortedData[sortedData.length - 1].session_id;
        if (lastSessionId) {
          setSessionId(lastSessionId);
        }
        
        console.log('✅ 已加载', sortedData.length, '条历史消息');
        console.log('📝 最新消息:', sortedData[sortedData.length - 1]?.content?.substring(0, 50) + '...');
        if (lastSessionId) {
          console.log('💾 已保存sessionId:', lastSessionId);
        }
      } else {
        console.log('📭 没有历史消息');
      }
    } catch (error) {
      console.error('❌ 加载对话历史异常:', error);
    }
  }, [supabase]);

  // 初始化聊天
  useEffect(() => {
    const initializeChat = async () => {
      await loadConversationHistory();
      setHistoryLoaded(true);  // 标记历史加载完成
    };

    initializeChat();
  }, [loadConversationHistory]);

  // 显示欢迎消息（如果没有历史消息）
  // 使用 ref 来追踪是否已经尝试加载过历史
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  useEffect(() => {
    // 只有在历史加载完成后，且没有消息时，才显示欢迎消息
    if (historyLoaded && messages.length === 0 && initialProfile) {
      console.log('📝 没有历史消息，显示欢迎消息');
      const welcomeMessage = generateWelcomeMessage(initialProfile);
      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, [historyLoaded, initialProfile, messages.length]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 生成欢迎消息 (Active Inquiry - 主动询问)
  const generateWelcomeMessage = (profile: AIAssistantProfile): string => {
    const displayName = resolveDisplayName(profile);
    
    // 使用 Active Inquiry 服务生成基于数据的诊断问题
    const inquiry = generateActiveInquiry({
      dailyLogs: dailyLogs,
      profile: profile ? {
        full_name: profile.full_name || undefined,
        nickname: profile.nickname || undefined,
        preferred_name: profile.preferred_name || undefined
      } : undefined
    });
    
    // 根据优先级构建消息
    if (inquiry.priority === 'high' || inquiry.priority === 'medium') {
      // 高/中优先级：直接提出诊断问题
      return inquiry.questionZh;
    }
    
    // 低优先级或无数据：提供上下文问候
    if (inquiry.dataPoints.length > 0) {
      return `${inquiry.questionZh}\n\n📊 今日数据：${inquiry.dataPoints.join(' | ')}`;
    }
    
    return inquiry.questionZh;
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

    // 并行调用 AI API 和论文 API
    console.log('🚀 开始并行调用 AI 和论文 API, 查询:', currentInput);
    
    // 先启动论文搜索（不等待）
    const papersPromise = fetchPapers(currentInput);
    
    // 同时启动 AI 响应
    const aiResponse = await generateAIResponse(currentInput, uploadedImage || undefined);
    
    // 等待论文结果
    const papersResponse = await papersPromise;
    
    console.log('📊 论文响应:', JSON.stringify(papersResponse));
    console.log('📊 AI响应中的论文:', aiResponse.papers);
    
    // 清除已上传的图片
    setUploadedImage(null);

    // 合并论文数据（优先使用单独 API 的结果）
    const papers = (papersResponse.papers && papersResponse.papers.length > 0)
      ? papersResponse.papers 
      : aiResponse.papers;
    const consensus = papersResponse.consensus || aiResponse.consensus;
    
    console.log('📊 最终论文数据:', papers);
    console.log('📊 论文数量:', papers?.length || 0);

    const assistantMessage: Message = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      papers: papers,
      consensus: consensus,
    };
    
    console.log('📊 助手消息中的论文:', assistantMessage.papers?.length || 0, '篇');

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
    setIsGeneratingAnswer(false);

    // 保存用户消息和AI回复
    await saveMessage(userMessage);
    await saveMessage(assistantMessage);
  };
  
  // 获取论文数据（单独 API）
  const fetchPapers = async (query: string): Promise<{
    papers?: PaperSource[];
    consensus?: { score: number; level: string; rationale?: string };
  }> => {
    console.log('📚 [fetchPapers] 开始调用, 查询:', query);
    try {
      const url = '/api/chat/papers';
      console.log('📚 [fetchPapers] 请求 URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      console.log('📚 [fetchPapers] 响应状态:', response.status);
      
      if (!response.ok) {
        console.warn('⚠️ [fetchPapers] API 返回错误:', response.status);
        return {};
      }
      
      const data = await response.json();
      console.log('📚 [fetchPapers] 返回数据:', JSON.stringify(data).substring(0, 200));
      
      if (data.papers && data.papers.length > 0) {
        const papers = data.papers.map((p: any) => ({
          rank: p.rank,
          title: p.title,
          citationCount: p.citationCount,
          year: p.year,
          url: p.url,
        }));
        console.log('📚 [fetchPapers] 解析后论文数:', papers.length);
        return {
          papers,
          consensus: data.consensus,
        };
      }
      
      console.log('📚 [fetchPapers] 没有论文数据');
      return {};
    } catch (error) {
      console.error('❌ [fetchPapers] 调用失败:', error);
      return {};
    }
  };

  // 保存消息 - 即使没有 sessionId 也保存
  const saveMessage = async (message: Message) => {
    console.log('💾 开始保存消息:', message.role, message.content.substring(0, 30) + '...');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ 保存消息 - 获取用户失败:', authError);
        return;
      }
      
      if (!user) {
        console.error('❌ 保存消息 - 用户未登录');
        return;
      }

      // 构建插入数据，session_id 可选
      const insertData: {
        user_id: string;
        role: string;
        content: string;
        metadata: Record<string, unknown>;
        session_id?: string;
      } = {
        user_id: user.id,
        role: message.role,
        content: message.content,
        metadata: {
          timestamp: message.timestamp.toISOString(),
          papers: message.papers || [],
          consensus: message.consensus || null,
        },
      };

      // 如果有 sessionId，添加到数据中
      if (sessionId) {
        insertData.session_id = sessionId;
      }

      console.log('📤 插入数据:', { 
        user_id: user.id, 
        role: message.role, 
        content_length: message.content.length,
        has_session: !!sessionId 
      });

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert(insertData)
        .select('id');
      
      if (error) {
        console.error('❌ 保存消息失败:', error.message, error.details, error.hint, error.code);
      } else {
        console.log('✅ 消息已保存到数据库, ID:', data?.[0]?.id, sessionId ? `(session: ${sessionId})` : '(无session)');
      }
    } catch (error) {
      console.error('❌ 保存消息异常:', error);
    }
  };

  // 生成 AI 回复 (适配新的流式 API)
  // 返回包含内容和论文数据的对象
  interface AIResponseResult {
    content: string;
    papers?: PaperSource[];
    consensus?: { score: number; level: string; rationale?: string };
  }
  
  const generateAIResponse = async (userInput: string, imageData?: string): Promise<AIResponseResult> => {
    try {
      // 构建消息数组 (新 API 格式)
      const chatMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userInput }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages
        }),
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        // 根据状态码提供更具体的错误信息
        if (response.status === 401) {
          return { content: '您的登录已过期，请刷新页面重新登录。' };
        } else if (response.status === 403) {
          return { content: '内容已过滤：让我们专注于您的健康与平静。' };
        } else if (response.status === 500) {
          return { content: '服务器内部错误，请稍后重试。' };
        }
        return { content: 'AI 服务暂时不可用，请稍后重试。' };
      }

      // 读取论文和共识度数据（从 headers）
      // 注意：必须在读取 body 之前获取 headers
      let papers: PaperSource[] | undefined;
      let consensus: { score: number; level: string; rationale?: string } | undefined;
      
      // 打印所有响应 headers 用于调试
      console.log('📋 响应 Headers:');
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
      });
      
      const papersHeader = response.headers.get('x-neuromind-papers');
      const consensusHeader = response.headers.get('x-neuromind-consensus');
      const searchStatus = response.headers.get('x-neuromind-search-status');
      
      console.log('🔍 搜索状态:', searchStatus);
      console.log('📚 论文 Header 原始值:', papersHeader ? papersHeader.substring(0, 200) : 'null');
      
      if (papersHeader) {
        try {
          // 解码 Base64 编码的 JSON
          const decodedPapers = Buffer.from(papersHeader, 'base64').toString('utf-8');
          papers = JSON.parse(decodedPapers);
          console.log('📚 收到论文数据:', papers?.length, '篇');
          if (papers && papers.length > 0) {
            console.log('📚 第一篇论文:', papers[0].title);
          }
        } catch (e) {
          console.warn('解析论文数据失败:', e);
        }
      } else {
        console.log('⚠️ 没有收到论文 header');
      }
      
      if (consensusHeader) {
        try {
          // 解码 Base64 编码的 JSON
          const decodedConsensus = Buffer.from(consensusHeader, 'base64').toString('utf-8');
          consensus = JSON.parse(decodedConsensus);
          console.log('🎯 共识度:', consensus?.level, `(${((consensus?.score || 0) * 100).toFixed(0)}%)`);
        } catch (e) {
          console.warn('解析共识度数据失败:', e);
        }
      }

      // 读取流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
      }

      console.log('✅ AI响应完成');
      return { 
        content: fullResponse || '抱歉，我无��生成回复。',
        papers,
        consensus
      };
    } catch (error) {
      console.error('❌ 调用 AI API 时出错:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { content: '网络连接失败，请检查您的网络连接后重试。' };
      }
      
      return { content: '抱歉，AI 服务暂时不可用。请稍后重试。' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1], // 平和的贝塞尔曲线
        }
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.95,
        transition: {
          duration: 0.3,
          ease: [0.4, 0, 1, 1]
        }
      }}
      className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 w-full sm:w-96 h-full sm:h-[600px] flex flex-col bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-[#E7E1D6] overflow-hidden"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white safe-area-inset-top">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-lg font-semibold">AI 助理</h3>
            {/* Pro用户徽章 */}
            {true && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black"
              >
                PRO
              </motion.span>
            )}
          </div>
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
                <div className="max-w-[85%] sm:max-w-[80%]">
                  <div
                    className={`rounded-lg px-4 py-2.5 sm:px-3 sm:py-2 ${
                      message.role === AI_ROLES.USER
                        ? 'bg-[#0B3D2E] text-white'
                        : 'bg-white text-[#0B3D2E] border border-[#E7E1D6]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-base sm:text-sm leading-relaxed">
                      {message.role === AI_ROLES.ASSISTANT && containsPlans(message.content)
                        ? removePlansFromContent(message.content)
                        : message.content}
                    </div>
                    <div className={`text-xs mt-1.5 sm:mt-1 ${message.role === AI_ROLES.USER ? 'text-white/70' : 'text-[#0B3D2E]/60'}`}>
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {/* AI方案卡片 */}
                  {message.role === AI_ROLES.ASSISTANT && containsPlans(message.content) && (
                    <AIPlanCard
                      plans={parsePlans(message.content)}
                      onConfirm={handlePlanConfirm}
                      onConfirmWithModification={handlePlanConfirmWithModification}
                    />
                  )}
                  
                  {/* 论文来源展示 */}
                  {message.role === AI_ROLES.ASSISTANT && message.papers && message.papers.length > 0 && (
                    <div className="mt-2">
                      <PaperSources 
                        papers={message.papers.map(p => ({
                          paperId: p.url || `paper-${p.rank}`,
                          title: p.title,
                          citationCount: p.citationCount,
                          url: p.url || '#',
                          year: p.year,
                        }))}
                        defaultExpanded={false}
                        maxVisible={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <MarqueeBorderBox isActive={isGeneratingAnswer}>
                  <div className="bg-white rounded-xl px-4 py-4 shadow-sm">
                    <AIThinkingLoader 
                      size="sm" 
                      showProgress={true} 
                      onGeneratingStart={() => setIsGeneratingAnswer(true)}
                    />
                  </div>
                </MarqueeBorderBox>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入框 */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#E7E1D6] safe-area-inset-bottom">
        {/* 图片预览 */}
        {uploadedImage && (
          <div className="mb-2 relative inline-block">
            <img 
              src={uploadedImage} 
              alt="待识别图片" 
              className="max-h-32 rounded-lg border border-[#E7E1D6]"
            />
            <button
              type="button"
              onClick={() => setUploadedImage(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-2">
          <div className="flex-1 relative">
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的问题..."
              className="w-full rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] px-4 py-3 sm:py-2 pr-12 sm:pr-10 text-base sm:text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 touch-manipulation"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {/* 图片上传按钮 - 极简高级 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 sm:p-1.5 rounded-lg transition-all touch-manipulation bg-[#0B3D2E]/10 text-[#0B3D2E] hover:bg-[#0B3D2E]/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="上传图片"
                title="上传图片识图"
              >
                <ImageUploadIcon className="w-5 h-5" />
              </button>
              {/* 语音输入按钮 - 极简高级 */}
              {recognition && (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  className={`p-2 sm:p-1.5 rounded-lg transition-all touch-manipulation ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-[#0B3D2E]/10 text-[#0B3D2E] hover:bg-[#0B3D2E]/20 hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label="语音输入"
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <MotionButton
            type="submit"
            disabled={isLoading || !input.trim()}
            variant="default"
            size="default"
            className="rounded-lg bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-5 py-3 sm:px-4 sm:py-2 text-white shadow-md min-w-[48px] sm:min-w-0"
            hapticFeedback={true}
            aria-label="发送"
          >
            <SendIcon className="w-5 h-5 sm:w-4 sm:h-4" />
          </MotionButton>
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


// 跑马灯边框组件 - 非匀速绿色渐变效果
function MarqueeBorderBox({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  if (!isActive) {
    return (
      <div className="rounded-xl border border-[#E7E1D6]">
        {children}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl p-[2px] overflow-hidden">
      {/* 跑马灯边框 - 三圈变速动画 */}
      <div className="absolute inset-0 rounded-xl">
        {/* 第一圈 - 快速 */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, #22c55e 10%, #10b981 20%, #059669 30%, transparent 40%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1], // 非匀速 - 先快后慢
          }}
        />
        {/* 第二圈 - 中速 */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'conic-gradient(from 120deg, transparent 0%, #0B3D2E 8%, #22c55e 16%, transparent 24%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1], // 非匀速 - 平滑变速
          }}
        />
        {/* 第三圈 - 慢速 */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'conic-gradient(from 240deg, transparent 0%, #059669 5%, #10b981 10%, #22c55e 15%, transparent 20%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: [0.65, 0, 0.35, 1], // 非匀速 - 慢启快停
          }}
        />
      </div>
      
      {/* 内容区域 */}
      <div className="relative rounded-xl bg-white">
        {children}
      </div>
      
      {/* 发光效果 */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: '0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1)',
        }}
        animate={{
          boxShadow: [
            '0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.05)',
            '0 0 25px rgba(34, 197, 94, 0.4), inset 0 0 25px rgba(34, 197, 94, 0.15)',
            '0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.05)',
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
