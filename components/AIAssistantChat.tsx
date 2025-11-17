'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import AnimatedSection from '@/components/AnimatedSection';
import { AI_ROLES } from '@/lib/config/constants';
import type { AIAssistantProfile, ConversationRow, MicroHabit, RoleType } from '@/types/assistant';

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

interface AIAssistantChatProps {
  initialProfile: AIAssistantProfile;
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
  const found = candidates.find((item?: string) => item && String(item).trim().length > 0);
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

export default function AIAssistantChat({ initialProfile }: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();

  // 加载对话历史
  const loadConversationHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from<ConversationRow>('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

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
  };

  // 加载历史对话
  useEffect(() => {
    const initializeChat = async () => {
      // 先加载历史对话
      await loadConversationHistory();
      
      // 如果有分析结果且没有历史消息，显示欢迎消息
      if (initialProfile?.ai_analysis_result && initialProfile?.ai_recommendation_plan) {
        setMessages(prev => {
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

    message += `记住，我们不会要求你"打卡"。每次行动后，问问自己："这对我有帮助吗？"（1-10分）。\n\n`;
    message += `有什么问题随时问我。`;

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

    setMessages(prev => [...prev, userMessage]);
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

    setMessages(prev => [...prev, assistantMessage]);
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
        .filter(msg => msg.role === AI_ROLES.USER || msg.role === AI_ROLES.ASSISTANT)
        .map(msg => ({
          role: msg.role === AI_ROLES.USER ? AI_ROLES.USER : AI_ROLES.ASSISTANT,
          content: msg.content,
        }));

      // 调用我们的 API 路由
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
      
      // 更新使用情况信息
      if (data.usage) {
        setUsageInfo({
          remaining: data.usage.remaining,
          limit: data.usage.limit,
          usage: data.usage.usage,
        });
      }
      
      return data.response || '抱歉，我无法生成回复。';
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
              <h1 className="text-2xl font-semibold text-[#0B3D2E]">你的专属健康代理</h1>
              <p className="mt-1 text-sm text-[#0B3D2E]/70">
                基于生理真相，提供冷静、科学的建议
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

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-[#E7E1D6] bg-white p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-[#0B3D2E]/60 py-8">
            <p>开始与你的 AI 助理对话吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
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
                <div className="bg-[#FAF6EF] border border-[#E7E1D6] rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#0B3D2E]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#0B3D2E]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#0B3D2E]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
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
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="flex-1 rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-4 py-2 text-sm text-[#0B3D2E] placeholder:text-[#0B3D2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-6 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </div>
  );
}

