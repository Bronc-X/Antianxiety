'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import AnimatedSection from '@/components/AnimatedSection';
import { MotionButton } from '@/components/motion/MotionButton';
import { BrainLoader } from '@/components/lottie/BrainLoader';
import { AI_ROLES } from '@/lib/config/constants';
import type { AIAssistantProfile, ConversationRow, RoleType } from '@/types/assistant';
import type { ActionItem, ExecutionStatus, FollowUpSession } from '@/types/adaptive-plan';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RefreshCw, Minus } from 'lucide-react';

interface Message {
  role: RoleType;
  content: string;
  timestamp: Date;
}

interface UsageInfo {
  remaining?: string | null;
  limit?: string | null;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    [key: string]: number | undefined;
  } | null;
}

// Follow-up mode types
interface FollowUpModeState {
  isActive: boolean;
  sessionId?: string;
  sessionType?: 'morning' | 'evening';
  actionItems: ActionItem[];
  executionStatuses: Map<string, ExecutionStatus>;
  replacementRequests: Set<string>;
}

interface AIAssistantChatProps {
  initialProfile: AIAssistantProfile;
  followUpSession?: FollowUpSession;
  actionItems?: ActionItem[];
  onFollowUpComplete?: (sessionId: string, responses: Record<string, ExecutionStatus>) => void;
}

/**
 * AI 助理聊天界面
 * 支持对话、记忆、提醒等功能
 */
const resolveDisplayName = (profile?: AIAssistantProfile): string => {
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

const extractHabitMemory = (profile?: AIAssistantProfile): string | string[] | null => {
  if (!profile) return null;
  if (profile.habit_memory_summary) return profile.habit_memory_summary;
  if (Array.isArray(profile.habit_focus) && profile.habit_focus.length > 0) {
    return profile.habit_focus;
  }
  if (profile.latest_habit_note) return profile.latest_habit_note;
  return null;
};

export default function AIAssistantChat({ 
  initialProfile, 
  followUpSession,
  actionItems: initialActionItems,
  onFollowUpComplete,
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();
  
  // Follow-up mode state
  const [followUpMode, setFollowUpMode] = useState<FollowUpModeState>({
    isActive: !!followUpSession,
    sessionId: followUpSession?.id,
    sessionType: followUpSession?.session_type,
    actionItems: initialActionItems || [],
    executionStatuses: new Map(),
    replacementRequests: new Set(),
  });

  // Initialize follow-up mode when session is provided
  useEffect(() => {
    if (followUpSession && initialActionItems) {
      setFollowUpMode({
        isActive: true,
        sessionId: followUpSession.id,
        sessionType: followUpSession.session_type,
        actionItems: initialActionItems,
        executionStatuses: new Map(),
        replacementRequests: new Set(),
      });
      
      // Add follow-up welcome message
      const welcomeMsg = generateFollowUpWelcome(followUpSession.session_type);
      setMessages((prev: Message[]) => {
        if (prev.length === 0 || prev[prev.length - 1].content !== welcomeMsg) {
          return [...prev, {
            role: 'assistant' as RoleType,
            content: welcomeMsg,
            timestamp: new Date(),
          }];
        }
        return prev;
      });
    }
  }, [followUpSession, initialActionItems]);

  // Generate follow-up welcome message
  const generateFollowUpWelcome = (sessionType?: 'morning' | 'evening'): string => {
    if (sessionType === 'morning') {
      return `早安，${resolveDisplayName(initialProfile)}。\n\n新的一天开始了，让我们一起回顾一下今天的计划。\n\n请告诉我你现在的状态，以及昨天的执行情况。`;
    }
    return `晚安，${resolveDisplayName(initialProfile)}。\n\n一天即将结束，让我们一起回顾今天的执行情况。\n\n请告诉我你今天的感受，以及各项行动的完成情况。`;
  };

  // Handle execution status change
  const handleExecutionStatusChange = useCallback((itemId: string, status: ExecutionStatus) => {
    setFollowUpMode((prev: FollowUpModeState) => {
      const newStatuses = new Map(prev.executionStatuses);
      newStatuses.set(itemId, status);
      return { ...prev, executionStatuses: newStatuses };
    });
  }, []);

  // Handle replacement request
  const handleReplacementRequest = useCallback((itemId: string) => {
    setFollowUpMode((prev: FollowUpModeState) => {
      const newRequests = new Set(prev.replacementRequests);
      if (newRequests.has(itemId)) {
        newRequests.delete(itemId);
      } else {
        newRequests.add(itemId);
      }
      return { ...prev, replacementRequests: newRequests };
    });
  }, []);

  // Complete follow-up session
  const handleCompleteFollowUp = useCallback(async () => {
    if (!followUpMode.sessionId) return;
    
    const responses: Record<string, ExecutionStatus> = {};
    followUpMode.executionStatuses.forEach((status: ExecutionStatus, itemId: string) => {
      responses[itemId] = status;
    });
    
    // Mark items needing replacement
    followUpMode.replacementRequests.forEach((itemId: string) => {
      if (!responses[itemId]) {
        responses[itemId] = 'replaced';
      }
    });
    
    onFollowUpComplete?.(followUpMode.sessionId, responses);
    
    // Add completion message
    setMessages((prev: Message[]) => [...prev, {
      role: 'assistant' as RoleType,
      content: '感谢你的反馈！我已经记录了今天的执行情况。\n\n根据你的反馈，我会持续优化你的计划，让它更适合你的节奏。',
      timestamp: new Date(),
    }]);
    
    // Reset follow-up mode
    setFollowUpMode((prev: FollowUpModeState) => ({ ...prev, isActive: false }));
  }, [followUpMode, onFollowUpComplete]);

  // 加载对话历史
  const loadConversationHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50)
        .returns<ConversationRow[]>();

      if (error) {
        console.error('加载对话历史时出错:', error);
        return;
      }

      if (data && data.length > 0) {
        const historyMessages: Message[] = data.map((msg: ConversationRow) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('加载对话历史时出错:', error);
    }
  };

  // 加载历史对话
  useEffect(() => {
    const initializeChat = async () => {
      // 先加载历史对话
      await loadConversationHistory();
      
      // 如果有分析结果且没有历史消息，显示欢迎消息
      if (initialProfile?.ai_analysis_result && initialProfile?.ai_recommendation_plan) {
        setMessages((prev: Message[]) => {
          // 如果已经有消息（从历史加载的），不添加欢迎消息
          if (prev.length > 0) return prev;
          
          const welcomeMessage = generateWelcomeMessage(initialProfile);
          return [{
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
          }];
        });
      }
    };
    
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProfile]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 生成欢迎消息 - Max 风格
  const generateWelcomeMessage = (profile: AIAssistantProfile): string => {
    if (!profile) {
      return `Systems nominal. I'm Max, your Bio-Operating System Co-pilot.\n\nData suggests you're ready to calibrate. Proceed?`;
    }

    const analysis = profile.ai_analysis_result;
    const plan = profile.ai_recommendation_plan;
    const displayName = resolveDisplayName(profile);
    const habitMemory = extractHabitMemory(profile);

    if (!analysis || !plan) {
      return `System detects: ${displayName}. Bio-metrics loading.\n\nProcessing your profile data. Stand by for calibration.`;
    }

    let message = `Systems nominal. ${displayName}, resuming session.\n`;
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
    
    if (analysis.risk_factors && Array.isArray(analysis.risk_factors) && analysis.risk_factors.length > 0) {
      message += `**主要关注点：**\n`;
      analysis.risk_factors.forEach((factor) => {
        message += `- ${factor}\n`;
      });
      message += `\n`;
    }

    if (plan.micro_habits && Array.isArray(plan.micro_habits) && plan.micro_habits.length > 0) {
      message += `**为你定制的微习惯：**\n`;
      plan.micro_habits.forEach((habit, index: number) => {
        message += `${index + 1}. **${habit.name || '未命名习惯'}**\n`;
        message += `   - 线索：${habit.cue || '未指定'}\n`;
        message += `   - 反应：${habit.response || '未指定'}\n`;
        message += `   - 时机：${habit.timing || '未指定'}\n`;
        message += `   - 原理：${habit.rationale || '未指定'}\n\n`;
      });
    }

    message += `Data suggests: No streak tracking required. Post-action, rate effectiveness (1-10).\n\n`;
    message += `System ready. Awaiting input.`;

    return message;
  };

  // 处理消息发送
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 保存用户消息
    await saveMessage(userMessage);

    // 生成 AI 回复（这里使用简化的逻辑，实际应该调用 AI API）
    const aiResponse = await generateAIResponse(userMessage.content);

    const assistantMessage: Message = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, assistantMessage]);
    setIsLoading(false);

    // 保存 AI 回复
    await saveMessage(assistantMessage);
  };

  // 保存消息到数据库
  const saveMessage = async (message: Message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
          metadata: {
            timestamp: message.timestamp.toISOString(),
          },
        });

      if (error) {
        console.error('保存消息时出错:', error);
      }
    } catch (error) {
      console.error('保存消息时出错:', error);
    }
  };

  // 生成 AI 回复（调用 DeepSeek API）
  const generateAIResponse = async (userInput: string): Promise<string> => {
    try {
      // 准备对话历史（只包含 user 和 assistant 消息）
      const conversationHistory = messages
        .filter((msg: Message) => msg.role === AI_ROLES.USER || msg.role === AI_ROLES.ASSISTANT)
        .map((msg: Message) => ({
          role: msg.role === AI_ROLES.USER ? AI_ROLES.USER : AI_ROLES.ASSISTANT,
          content: msg.content,
        }));

      // Prepare follow-up context if in follow-up mode
      const followUpContext = followUpMode.isActive ? {
        sessionId: followUpMode.sessionId,
        sessionType: followUpMode.sessionType,
        actionItems: followUpMode.actionItems.map((item: ActionItem) => ({
          id: item.id,
          title: item.title,
          timing: item.timing,
          status: followUpMode.executionStatuses.get(item.id) || null,
          needsReplacement: followUpMode.replacementRequests.has(item.id),
        })),
        completedCount: followUpMode.executionStatuses.size,
        replacementCount: followUpMode.replacementRequests.size,
      } : undefined;

      // 调用我们的 API 路由
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: conversationHistory,
          userProfile: initialProfile,
          followUpContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 服务暂时不可用');
      }

      const data = await response.json();
      
      // 更新使用情况信息
      if (data.usage) {
        setUsageInfo({
          remaining: data.usage.remaining,
          limit: data.usage.limit,
          usage: data.usage.usage,
        });
      }
      
      // RAG端点返回格式: { success: true, data: { answer, sessionId, knowledgeUsed, metadata } }
      return data.data?.answer || data.response || '抱歉，我无法生成回复。';
    } catch (error) {
      console.error('调用 AI API 时出错:', error);
      // 如果 API 调用失败，返回友好的错误消息
      return `抱歉，AI 服务暂时不可用。请稍后重试。\n\n如果问题持续，请联系技术支持。`;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <AnimatedSection variant="fadeUp" className="mb-4">
        <div className="rounded-lg border border-[#E7E1D6] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#0B3D2E]">Max</h1>
              <p className="mt-1 text-sm text-[#0B3D2E]/70">
                Bio-Operating System Co-pilot
              </p>
            </div>
            {usageInfo && (
              <div className="text-right">
                {usageInfo.remaining && usageInfo.limit && (
                  <div className="text-xs text-[#0B3D2E]/60">
                    <span className="font-medium">剩余次数:</span> {usageInfo.remaining} / {usageInfo.limit}
                  </div>
                )}
                {usageInfo.usage && (
                  <div className="text-xs text-[#0B3D2E]/60 mt-1">
                    <span className="font-medium">Token 使用:</span> {usageInfo.usage.prompt_tokens || 0} + {usageInfo.usage.completion_tokens || 0} = {usageInfo.usage.total_tokens || 0}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>

      {/* Follow-up Mode Action Items Panel */}
      <AnimatePresence>
        {followUpMode.isActive && followUpMode.actionItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-lg border border-[#C4A77D]/30 bg-[#FAF6EF] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[#2C2C2C]">
                {followUpMode.sessionType === 'morning' ? '今日计划' : '今日回顾'}
              </h3>
              <span className="text-xs text-[#2C2C2C]/60">
                {followUpMode.executionStatuses.size}/{followUpMode.actionItems.length} 已记录
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {followUpMode.actionItems.map((item: ActionItem) => {
                const status = followUpMode.executionStatuses.get(item.id);
                const needsReplacement = followUpMode.replacementRequests.has(item.id);
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                      status ? 'bg-white/50' : 'bg-white'
                    } border border-[#E8DFD0]`}
                  >
                    {/* Action Item Title */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${status ? 'text-[#2C2C2C]/70' : 'text-[#2C2C2C]'}`}>
                        {item.title}
                      </p>
                      {item.timing && (
                        <p className="text-xs text-[#2C2C2C]/50">{item.timing}</p>
                      )}
                    </div>
                    
                    {/* Execution Status Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Completed */}
                      <button
                        onClick={() => handleExecutionStatusChange(item.id, 'completed')}
                        className={`p-1.5 rounded-full transition-colors ${
                          status === 'completed'
                            ? 'bg-[#9CAF88] text-white'
                            : 'bg-[#E8DFD0]/50 text-[#2C2C2C]/40 hover:bg-[#9CAF88]/20'
                        }`}
                        title="已完成"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Partial */}
                      <button
                        onClick={() => handleExecutionStatusChange(item.id, 'partial')}
                        className={`p-1.5 rounded-full transition-colors ${
                          status === 'partial'
                            ? 'bg-[#C4A77D] text-white'
                            : 'bg-[#E8DFD0]/50 text-[#2C2C2C]/40 hover:bg-[#C4A77D]/20'
                        }`}
                        title="部分完成"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Skipped */}
                      <button
                        onClick={() => handleExecutionStatusChange(item.id, 'skipped')}
                        className={`p-1.5 rounded-full transition-colors ${
                          status === 'skipped'
                            ? 'bg-[#2C2C2C]/60 text-white'
                            : 'bg-[#E8DFD0]/50 text-[#2C2C2C]/40 hover:bg-[#2C2C2C]/10'
                        }`}
                        title="未执行"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Request Replacement */}
                      <button
                        onClick={() => handleReplacementRequest(item.id)}
                        className={`p-1.5 rounded-full transition-colors ${
                          needsReplacement
                            ? 'bg-[#C4A77D] text-white'
                            : 'bg-[#E8DFD0]/50 text-[#2C2C2C]/40 hover:bg-[#C4A77D]/20'
                        }`}
                        title="需要替换"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Complete Follow-up Button */}
            {followUpMode.executionStatuses.size > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 pt-3 border-t border-[#E8DFD0]"
              >
                <MotionButton
                  onClick={handleCompleteFollowUp}
                  variant="primary"
                  size="sm"
                  className="w-full bg-gradient-to-r from-[#9CAF88] to-[#7A9A6A]"
                  hapticFeedback={true}
                >
                  完成今日记录
                </MotionButton>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-[#E7E1D6] bg-white p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-[#0B3D2E]/60 py-8">
            <p>System ready. Awaiting input.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: Message, index: number) => (
              <div
                key={index}
                className={`flex ${message.role === AI_ROLES.USER ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === AI_ROLES.USER
                      ? 'bg-[#0B3D2E] text-white'
                      : 'bg-[#FAF6EF] text-[#0B3D2E] border border-[#E7E1D6]'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${message.role === AI_ROLES.USER ? 'text-white/70' : 'text-[#0B3D2E]/60'}`}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#FAF6EF] border border-[#E7E1D6] rounded-lg px-4 py-3">
                  <BrainLoader />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-4 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
          disabled={isLoading}
        />
        <MotionButton
          type="submit"
          disabled={isLoading || !input.trim()}
          variant="primary"
          size="default"
          className="bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-6"
          hapticFeedback={true}
        >
          发送
        </MotionButton>
      </form>
    </div>
  );
}
