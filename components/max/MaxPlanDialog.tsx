'use client';

/**
 * MaxPlanDialog - AI-Powered Plan Creation Dialog
 * 
 * Max 协助制定计划的对话式界面
 * 支持数据分析、主动问询、计划生成和项目替换
 * 
 * @module components/max/MaxPlanDialog
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { MotionButton } from '@/components/motion/MotionButton';
import { MessageDeduplicator, filterDuplicateMessages } from '@/lib/max/message-deduplicator';
import {
  X, Loader2, Sparkles, RefreshCw, Check, MessageCircle,
  ChevronRight, Brain, Zap, Moon, Heart, Dumbbell, Apple, Smile, Target
} from 'lucide-react';
import type {
  ChatMessage,
  PlanItemDraft,
  DataStatus,
  PlanChatResponse,
  PlanReplaceResponse,
  NextAction,
  PlanCategory,
} from '@/types/max-plan';

interface MaxPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated?: () => void;
}

// 类别图标映射
const CATEGORY_ICONS: Record<PlanCategory, typeof Moon> = {
  sleep: Moon,
  stress: Brain,
  fitness: Dumbbell,
  nutrition: Apple,
  mental: Smile,
  habits: Target,
};

// 类别颜色映射
const CATEGORY_COLORS: Record<PlanCategory, string> = {
  sleep: 'bg-indigo-500/10 text-indigo-600',
  stress: 'bg-purple-500/10 text-purple-600',
  fitness: 'bg-emerald-500/10 text-emerald-600',
  nutrition: 'bg-orange-500/10 text-orange-600',
  mental: 'bg-pink-500/10 text-pink-600',
  habits: 'bg-blue-500/10 text-blue-600',
};

// 难度标签
const DIFFICULTY_LABELS: Record<string, Record<string, string>> = {
  easy: { zh: '简单', en: 'Easy' },
  medium: { zh: '中等', en: 'Medium' },
  hard: { zh: '困难', en: 'Hard' },
};

export default function MaxPlanDialog({ isOpen, onClose, onPlanCreated }: MaxPlanDialogProps) {
  const { language } = useI18n();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [planItems, setPlanItems] = useState<PlanItemDraft[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [nextAction, setNextAction] = useState<NextAction>('question');
  const [loading, setLoading] = useState(false);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // 消息去重器 - 锁定会话语言
  const deduplicatorRef = useRef<MessageDeduplicator>(new MessageDeduplicator());
  const sessionLanguageRef = useRef<'zh' | 'en' | null>(null);

  // 客户端挂载检测（用于 Portal）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 初始化对话
  useEffect(() => {
    console.log('[MaxPlanDialog] useEffect triggered, isOpen:', isOpen, 'sessionId:', sessionId);
    if (isOpen && !sessionId) {
      initDialog();
    }
  }, [isOpen]);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMessage]);

  // 清理会话
  useEffect(() => {
    console.log('[MaxPlanDialog] Cleanup effect, isOpen:', isOpen);
    if (!isOpen) {
      // 延迟清理，让动画完成
      const timer = setTimeout(() => {
        console.log('[MaxPlanDialog] Cleaning up session state');
        setSessionId(null);
        setMessages([]);
        setPlanItems([]);
        setDataStatus(null);
        setNextAction('question');
        setTypingMessage(null);
        // 重置去重器和语言锁定
        deduplicatorRef.current.reset();
        sessionLanguageRef.current = null;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 获取当前会话语言（锁定后不变）
  const getSessionLanguage = useCallback((): 'zh' | 'en' => {
    if (sessionLanguageRef.current === null) {
      // 将 language 转换为 'zh' | 'en'
      sessionLanguageRef.current = language === 'en' ? 'en' : 'zh';
    }
    return sessionLanguageRef.current;
  }, [language]);

  const initDialog = async () => {
    console.log('[MaxPlanDialog] initDialog called, isOpen:', isOpen);
    setLoading(true);
    // 锁定会话语言
    const sessionLang = getSessionLanguage();
    
    try {
      console.log('[MaxPlanDialog] Fetching /api/max/plan-chat...');
      const res = await fetch('/api/max/plan-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Language-Preference': sessionLang,
        },
        body: JSON.stringify({ action: 'init', language: sessionLang }),
      });

      console.log('[MaxPlanDialog] Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[MaxPlanDialog] API error:', errorText);
        // 即使失败也显示一条消息，不关闭对话框
        const errorMsg: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'max',
          content: sessionLang === 'zh' 
            ? '抱歉，初始化遇到问题。请稍后再试，或点击右上角关闭后重新打开。' 
            : 'Sorry, initialization failed. Please try again later.',
          timestamp: new Date(),
        };
        setMessages([errorMsg]);
        setLoading(false);
        return;
      }

      const data: PlanChatResponse = await res.json();
      console.log('[MaxPlanDialog] Response data:', data);
      
      if (data.success) {
        setSessionId(data.sessionId);
        setDataStatus(data.dataStatus);
        setNextAction(data.nextAction);
        
        // 直接设置消息，不使用打字效果
        console.log('[MaxPlanDialog] Setting messages:', data.messages);
        setMessages(data.messages || []);

        // 如果下一步是生成，自动触发
        if (data.nextAction === 'generate') {
          await handleGenerate(data.sessionId);
        }
      } else {
        // API 返回 success: false
        const errorMsg: ChatMessage = {
          id: `error_${Date.now()}`,
          role: 'max',
          content: data.error || (sessionLang === 'zh' ? '初始化失败' : 'Initialization failed'),
          timestamp: new Date(),
        };
        setMessages([errorMsg]);
      }
    } catch (error) {
      console.error('[MaxPlanDialog] Init error:', error);
      // 即使出错也显示消息，不关闭对话框
      const sessionLang = getSessionLanguage();
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'max',
        content: sessionLang === 'zh' 
          ? '网络连接出现问题，请检查网络后重试。' 
          : 'Network error. Please check your connection.',
        timestamp: new Date(),
      };
      setMessages([errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const showMessageWithTyping = async (msg: ChatMessage): Promise<void> => {
    // 检查是否重复（双重保险）
    if (deduplicatorRef.current.isDuplicate(msg)) {
      return;
    }
    
    if (msg.role === 'max') {
      setTypingMessage('...');
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      setTypingMessage(null);
    }
    
    // 标记为已显示并添加到消息列表
    deduplicatorRef.current.markDisplayed(msg);
    setMessages(prev => [...prev, msg]);
  };

  const handleOptionSelect = async (value: string, questionId?: string) => {
    if (!sessionId) return;
    const sessionLang = getSessionLanguage();

    // 添加用户消息（使用唯一 ID）
    const userMsgId = `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: value,
      timestamp: new Date(),
    };
    
    // 检查是否重复
    if (!deduplicatorRef.current.isDuplicate(userMsg)) {
      deduplicatorRef.current.markDisplayed(userMsg);
      setMessages(prev => [...prev, userMsg]);
    }
    
    setLoading(true);

    try {
      const res = await fetch('/api/max/plan-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Language-Preference': sessionLang,
        },
        body: JSON.stringify({
          action: 'respond',
          sessionId,
          questionId,
          message: value,
          language: sessionLang,
        }),
      });

      const data: PlanChatResponse = await res.json();

      if (data.success) {
        setNextAction(data.nextAction);
        
        // 过滤重复消息
        const filteredMessages = filterDuplicateMessages(data.messages, deduplicatorRef.current);
        for (const msg of filteredMessages) {
          await showMessageWithTyping(msg);
        }

        if (data.nextAction === 'generate') {
          await handleGenerate(sessionId);
        }
      }
    } catch (error) {
      console.error('[MaxPlanDialog] Respond error:', error);
      toast({
        message: sessionLang === 'zh' ? '发送失败，请重试' : 'Failed to send, please retry',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (sid: string) => {
    setLoading(true);
    const sessionLang = getSessionLanguage();
    
    try {
      const res = await fetch('/api/max/plan-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Language-Preference': sessionLang,
        },
        body: JSON.stringify({
          action: 'generate',
          sessionId: sid,
          language: sessionLang,
        }),
      });

      const data: PlanChatResponse = await res.json();

      if (data.success) {
        // 过滤重复消息
        const filteredMessages = filterDuplicateMessages(data.messages, deduplicatorRef.current);
        for (const msg of filteredMessages) {
          await showMessageWithTyping(msg);
        }
        
        if (data.planItems) {
          setPlanItems(data.planItems);
        }
        setNextAction(data.nextAction);
      }
    } catch (error) {
      console.error('[MaxPlanDialog] Generate error:', error);
      toast({
        message: sessionLang === 'zh' ? '生成计划失败' : 'Failed to generate plan',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!sessionId) return;
    setLoading(true);
    const sessionLang = getSessionLanguage();

    try {
      const res = await fetch('/api/max/plan-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Language-Preference': sessionLang,
        },
        body: JSON.stringify({
          action: 'skip',
          sessionId,
          language: sessionLang,
        }),
      });

      const data: PlanChatResponse = await res.json();

      if (data.success) {
        // 过滤重复消息
        const filteredMessages = filterDuplicateMessages(data.messages, deduplicatorRef.current);
        for (const msg of filteredMessages) {
          await showMessageWithTyping(msg);
        }
        
        if (data.nextAction === 'generate') {
          await handleGenerate(sessionId);
        }
      }
    } catch (error) {
      console.error('[MaxPlanDialog] Skip error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceItem = async (item: PlanItemDraft) => {
    if (!sessionId || replacingItemId) return;
    const sessionLang = getSessionLanguage();
    
    setReplacingItemId(item.id);

    try {
      const res = await fetch('/api/max/plan-replace', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Language-Preference': sessionLang,
        },
        body: JSON.stringify({
          itemId: item.id,
          currentItem: item,
          sessionId,
          language: sessionLang,
        }),
      });

      const data: PlanReplaceResponse = await res.json();

      if (data.success && data.newItem) {
        setPlanItems(prev => prev.map(p => 
          p.id === item.id ? data.newItem : p
        ));
        
        toast({
          message: sessionLang === 'zh' ? '已替换为新建议' : 'Replaced with new suggestion',
          type: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('[MaxPlanDialog] Replace error:', error);
      toast({
        message: sessionLang === 'zh' ? '替换失败' : 'Failed to replace',
        type: 'error',
      });
    } finally {
      setReplacingItemId(null);
    }
  };

  const handleSavePlan = async () => {
    if (planItems.length === 0) return;
    const sessionLang = getSessionLanguage();
    
    setSaving(true);

    try {
      // 转换为 plans/create API 格式
      const payload = {
        plans: [{
          title: sessionLang === 'zh' ? 'Max 个性化计划' : 'Max Personalized Plan',
          content: planItems.map(item => item.action).join('\n'),
          items: planItems.map(item => ({
            text: `${item.title}: ${item.action}`,
            category: item.category,
            difficulty: item.difficulty,
          })),
        }],
        sessionId,
      };

      const res = await fetch('/api/plans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save plan');
      }

      toast({
        message: sessionLang === 'zh' ? '计划已保存！' : 'Plan saved!',
        type: 'success',
      });

      onPlanCreated?.();
      onClose();
    } catch (error) {
      console.error('[MaxPlanDialog] Save error:', error);
      toast({
        message: sessionLang === 'zh' ? '保存失败，请重试' : 'Failed to save, please retry',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // 获取最后一条带选项的消息
  const lastMessageWithOptions = messages.filter(m => m.options && m.options.length > 0).pop();
  
  // 获取会话语言用于 UI 显示
  const displayLanguage = sessionLanguageRef.current || language;

  // 对话框内容
  const dialogContent = isOpen ? (
    <motion.div
      key="max-plan-dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <motion.div
        key="max-plan-dialog-content"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[85vh] bg-[#FAF6EF] border border-[#1A1A1A]/10 overflow-hidden flex flex-col rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A]/10 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0B3D2E] rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A]">
                    {displayLanguage === 'zh' ? 'Max 协助制定计划' : 'Create Plan with Max'}
                  </h3>
                  <p className="text-xs text-[#1A1A1A]/50">
                    {displayLanguage === 'zh' ? '个性化健康方案' : 'Personalized health plan'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} language={displayLanguage} />
              ))}
              
              {/* Typing Indicator */}
              {typingMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 bg-[#0B3D2E] rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="bg-white border border-[#1A1A1A]/10 px-4 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#1A1A1A]/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#1A1A1A]/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#1A1A1A]/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Plan Items */}
              {planItems.length > 0 && nextAction === 'review' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 mt-4"
                >
                  {planItems.map((item, index) => (
                    <PlanItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      language={displayLanguage}
                      isReplacing={replacingItemId === item.id}
                      onReplace={() => handleReplaceItem(item)}
                    />
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Options */}
            {lastMessageWithOptions && nextAction === 'question' && !loading && (
              <div className="p-4 border-t border-[#1A1A1A]/10 bg-white">
                <div className="flex flex-wrap gap-2">
                  {lastMessageWithOptions.options?.map((option) => (
                    <MotionButton
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleOptionSelect(option.value, lastMessageWithOptions.id)}
                      className="text-sm"
                    >
                      {option.label}
                    </MotionButton>
                  ))}
                </div>
                <button
                  onClick={handleSkip}
                  className="mt-3 text-xs text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 transition-colors"
                >
                  {displayLanguage === 'zh' ? '跳过问题，直接生成' : 'Skip and generate'}
                </button>
              </div>
            )}

            {/* Action Buttons - Sticky at bottom */}
            {planItems.length > 0 && nextAction === 'review' && (
              <div className="sticky bottom-0 p-4 border-t border-[#1A1A1A]/10 bg-white shadow-lg">
                <MotionButton
                  onClick={handleSavePlan}
                  disabled={saving}
                  className="w-full bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white min-h-[48px] rounded-lg text-base font-medium"
                  hapticFeedback
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {displayLanguage === 'zh' ? '保存中...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {displayLanguage === 'zh' ? '确认并保存计划' : 'Confirm and Save Plan'}
                    </>
                  )}
                </MotionButton>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="p-4 border-t border-[#1A1A1A]/10 bg-white flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#0B3D2E] animate-spin mr-2" />
                <span className="text-sm text-[#1A1A1A]/50">
                  {displayLanguage === 'zh' ? 'Max 正在思考...' : 'Max is thinking...'}
                </span>
              </div>
            )}
      </motion.div>
    </motion.div>
  ) : null;

  // 使用 Portal 渲染到 body，确保在所有元素之上
  console.log('[MaxPlanDialog] Render check - mounted:', mounted, 'isOpen:', isOpen, 'dialogContent:', dialogContent ? 'exists' : 'null');
  
  if (!mounted) {
    console.log('[MaxPlanDialog] Not mounted yet, returning null');
    return null;
  }

  // 如果 isOpen 为 false，返回 null
  if (!isOpen) {
    return null;
  }

  // 直接渲染，不使用 Portal（测试用）
  console.log('[MaxPlanDialog] Rendering dialog directly (no portal)');
  return (
    <div 
      id="max-plan-dialog-overlay"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '5px solid red'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: '#FAF6EF', 
          padding: '24px', 
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#1A1A1A', fontWeight: 600 }}>
            {displayLanguage === 'zh' ? 'Max 协助制定计划' : 'Create Plan with Max'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>
        
        {/* Messages */}
        <div style={{ marginBottom: '16px' }}>
          {messages.length === 0 && !loading && (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              {displayLanguage === 'zh' ? '正在加载...' : 'Loading...'}
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} style={{ 
              marginBottom: '8px', 
              padding: '12px', 
              backgroundColor: msg.role === 'max' ? '#fff' : '#0B3D2E',
              color: msg.role === 'max' ? '#1A1A1A' : '#fff',
              borderRadius: '8px'
            }}>
              {msg.content}
            </div>
          ))}
        </div>
        
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
            {displayLanguage === 'zh' ? 'Max 正在思考...' : 'Max is thinking...'}
          </div>
        )}
        
        {/* Options */}
        {lastMessageWithOptions && nextAction === 'question' && !loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lastMessageWithOptions.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value, lastMessageWithOptions.id)}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #0B3D2E', 
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 消息气泡组件
function MessageBubble({ message, language }: { message: ChatMessage; language: string }) {
  const isMax = message.role === 'max';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isMax ? '' : 'flex-row-reverse'}`}
    >
      {isMax && (
        <div className="w-8 h-8 bg-[#0B3D2E] rounded-full flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isMax
            ? 'bg-white border border-[#1A1A1A]/10 rounded-tl-none'
            : 'bg-[#0B3D2E] text-white rounded-tr-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

// 计划项卡片组件
function PlanItemCard({
  item,
  index,
  language,
  isReplacing,
  onReplace,
}: {
  item: PlanItemDraft;
  index: number;
  language: string;
  isReplacing: boolean;
  onReplace: () => void;
}) {
  const Icon = CATEGORY_ICONS[item.category] || Target;
  const colorClass = CATEGORY_COLORS[item.category] || 'bg-gray-500/10 text-gray-600';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-[#1A1A1A]/10 p-4 rounded-lg"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-[#1A1A1A] truncate">{item.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${
              item.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' :
              item.difficulty === 'hard' ? 'bg-red-500/10 text-red-600' :
              'bg-[#D4AF37]/10 text-[#D4AF37]'
            }`}>
              {DIFFICULTY_LABELS[item.difficulty]?.[language] || item.difficulty}
            </span>
          </div>
          <p className="text-sm text-[#1A1A1A]/70 mb-2">{item.action}</p>
          <p className="text-xs text-[#1A1A1A]/50 italic">{item.rationale}</p>
        </div>
        <button
          onClick={onReplace}
          disabled={isReplacing}
          className="p-2 text-[#1A1A1A]/40 hover:text-[#0B3D2E] hover:bg-[#0B3D2E]/5 rounded-lg transition-colors disabled:opacity-50"
          title={language === 'zh' ? '换一个' : 'Replace'}
        >
          {isReplacing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
