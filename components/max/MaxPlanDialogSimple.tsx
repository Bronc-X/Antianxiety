'use client';

/**
 * MaxPlanDialogSimple - 简化版 Max 计划对话框
 * 直接可靠的实现，不依赖复杂的状态管理
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { X, Loader2, Sparkles, Check, RefreshCw, Edit2, Send } from 'lucide-react';
import { useMaxApi } from '@/hooks/domain/useMaxApi';
import { usePlans } from '@/hooks/domain/usePlans';
import type { ParsedPlan } from '@/lib/plan-parser';

interface Message {
  id: string;
  role: 'max' | 'user';
  content: string;
  options?: { label: string; value: string }[];
}

interface PlanItem {
  id: string;
  title: string;
  action: string;
  category: string;
  difficulty: string;
  rationale: string;
}

interface MaxPlanDialogSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated?: () => void;
}

export default function MaxPlanDialogSimple({ isOpen, onClose, onPlanCreated }: MaxPlanDialogSimpleProps) {
  const { language } = useI18n();
  const { toast } = useToast();
  const { planChat, planReplace } = useMaxApi();
  const { createFromAI } = usePlans();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextAction, setNextAction] = useState<string>('question');
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lang = language === 'en' ? 'en' : 'zh';

  const generatePlan = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const data = await planChat({ action: 'generate', sessionId: sid, language: lang });
      if (data) {
        const newMaxMessages = (data.messages || []).filter((m: Message) => m.role === 'max');
        setMessages(prev => [...prev, ...newMaxMessages]);
        setPlanItems(data.planItems || []);
        setNextAction(data.nextAction || 'review');
      }
    } catch (e) {
      console.error('Generate error:', e);
    } finally {
      setLoading(false);
    }
  }, [planChat, lang]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 打开时初始化
  useEffect(() => {
    if (isOpen && !sessionId) {
      initDialog();
    }
  }, [isOpen, sessionId, initDialog]);

  // 关闭时重置
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSessionId(null);
        setMessages([]);
        setPlanItems([]);
        setNextAction('question');
        setCustomInput('');
        setShowCustomInput(false);
        setEditingItemId(null);
        setReplacingItemId(null);
      }, 300);
    }
  }, [isOpen]);

  const initDialog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await planChat({ action: 'init', language: lang });
      if (data) {
        setSessionId(data.sessionId);
        setMessages(data.messages || []);
        setNextAction(data.nextAction || 'question');
        if (data.nextAction === 'generate') {
          await generatePlan(data.sessionId);
        }
      } else {
        setMessages([{ id: 'error', role: 'max', content: lang === 'zh' ? '初始化失败，请重试' : 'Failed to initialize' }]);
      }
    } catch (e) {
      console.error('Init error:', e);
      setMessages([{ id: 'error', role: 'max', content: lang === 'zh' ? '初始化失败，请重试' : 'Failed to initialize' }]);
    } finally {
      setLoading(false);
    }
  }, [planChat, lang, generatePlan]);

  const handleOptionSelect = async (value: string, questionId?: string) => {
    if (!sessionId) return;
    
    // 添加用户消息
    setMessages(prev => [...prev, { id: `user_${Date.now()}`, role: 'user', content: value }]);
    setLoading(true);
    setShowCustomInput(false);
    setCustomInput('');

    try {
      const data = await planChat({ action: 'respond', sessionId, questionId, message: value, language: lang });
      if (data) {
        const newMaxMessages = (data.messages || []).filter((m: Message) => m.role === 'max');
        setMessages(prev => [...prev, ...newMaxMessages]);
        setNextAction(data.nextAction || 'question');
        if (data.nextAction === 'generate') {
          await generatePlan(sessionId);
        }
      }
    } catch (e) {
      console.error('Respond error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (questionId?: string) => {
    if (!customInput.trim()) return;
    await handleOptionSelect(customInput.trim(), questionId);
  };

  const handleSkip = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await planChat({ action: 'skip', sessionId, language: lang });
      if (data?.nextAction === 'generate') {
        await generatePlan(sessionId);
      }
    } catch (e) {
      console.error('Skip error:', e);
    } finally {
      setLoading(false);
    }
  };

  // 替换计划项
  const handleReplaceItem = async (itemId: string) => {
    if (!sessionId) return;
    setReplacingItemId(itemId);
    
    try {
      const data = await planReplace({ sessionId, itemId, language: lang });
      if (data?.newItem) {
        setPlanItems(prev => prev.map(item => 
          item.id === itemId ? data.newItem : item
        ));
        toast({ message: lang === 'zh' ? '已换一个建议' : 'Replaced with new suggestion', type: 'success' });
      }
    } catch (e) {
      console.error('Replace error:', e);
      toast({ message: lang === 'zh' ? '替换失败' : 'Replace failed', type: 'error' });
    } finally {
      setReplacingItemId(null);
    }
  };

  // 编辑计划项
  const handleEditItem = (item: PlanItem) => {
    setEditingItemId(item.id);
    setEditingText(item.action);
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editingText.trim()) return;
    setPlanItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, action: editingText.trim() } : item
    ));
    setEditingItemId(null);
    setEditingText('');
  };

  const savePlan = async () => {
    if (planItems.length === 0) return;
    setSaving(true);
    try {
      const planPayload: ParsedPlan = {
        title: lang === 'zh' ? 'Max 个性化计划' : 'Max Personalized Plan',
        content: planItems.map(item => item.action).join('\n'),
        items: planItems.map((item, index) => ({
          id: item.id || `item_${Date.now()}_${index}`,
          text: `${item.title}: ${item.action}`,
          status: 'pending',
        })),
      };

      const created = await createFromAI([planPayload]);
      if (created) {
        toast({ message: lang === 'zh' ? '计划已保存！' : 'Plan saved!', type: 'success' });
        onPlanCreated?.();
        onClose();
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      console.error('Save error:', e);
      toast({ message: lang === 'zh' ? '保存失败' : 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 获取最后一条带选项的消息
  const lastMsgWithOptions = messages.filter(m => m.options?.length).pop();

  if (!isOpen) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: '#FAF6EF', 
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid rgba(0,0,0,0.1)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#0B3D2E', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles style={{ width: '20px', height: '20px', color: '#D4AF37' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 600, color: '#1A1A1A' }}>
                {lang === 'zh' ? 'Max 协助制定计划' : 'Create Plan with Max'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>
                {lang === 'zh' ? '个性化健康方案' : 'Personalized health plan'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <X style={{ width: '20px', height: '20px', color: 'rgba(0,0,0,0.5)' }} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ 
              marginBottom: '12px',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{ 
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: msg.role === 'user' ? '#0B3D2E' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#1A1A1A',
                border: msg.role === 'max' ? '1px solid rgba(0,0,0,0.1)' : 'none'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Plan Items with Edit/Replace */}
          {planItems.length > 0 && nextAction === 'review' && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.5)', marginBottom: '12px' }}>
                {lang === 'zh' ? '点击"换一个"获取替代建议，或点击编辑自定义内容' : 'Click "Replace" for alternatives, or edit to customize'}
              </p>
              {planItems.map((item) => (
                <div key={item.id} style={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid rgba(0,0,0,0.1)', 
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{item.title}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditItem(item)}
                        disabled={editingItemId === item.id}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#0B3D2E',
                          opacity: editingItemId === item.id ? 0.5 : 1
                        }}
                        title={lang === 'zh' ? '编辑' : 'Edit'}
                      >
                        <Edit2 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => handleReplaceItem(item.id)}
                        disabled={replacingItemId === item.id}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#D4AF37'
                        }}
                        title={lang === 'zh' ? '换一个' : 'Replace'}
                      >
                        {replacingItemId === item.id ? (
                          <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <RefreshCw style={{ width: '14px', height: '14px' }} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {editingItemId === item.id ? (
                    <div style={{ marginTop: '8px' }}>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #0B3D2E',
                          borderRadius: '6px',
                          fontSize: '14px',
                          minHeight: '60px',
                          resize: 'vertical',
                          color: '#1A1A1A',
                          backgroundColor: '#fff'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#0B3D2E',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {lang === 'zh' ? '保存' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingItemId(null); setEditingText(''); }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            color: '#1A1A1A',
                            border: '1px solid rgba(0,0,0,0.2)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>{item.action}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', marginTop: '4px', fontStyle: 'italic' }}>{item.rationale}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(0,0,0,0.5)', padding: '12px' }}>
              <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              {lang === 'zh' ? 'Max 正在思考...' : 'Max is thinking...'}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Options - 修复按钮样式 */}
        {lastMsgWithOptions && nextAction === 'question' && !loading && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {lastMsgWithOptions.options?.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionSelect(opt.value, lastMsgWithOptions.id)}
                  style={{ 
                    padding: '10px 16px', 
                    border: '1px solid #0B3D2E', 
                    borderRadius: '20px',
                    backgroundColor: '#fff',
                    color: '#0B3D2E',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#0B3D2E';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#0B3D2E';
                  }}
                >
                  {opt.label}
                </button>
              ))}
              {/* 自定义输入按钮 */}
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                style={{ 
                  padding: '10px 16px', 
                  border: '1px dashed #D4AF37', 
                  borderRadius: '20px',
                  backgroundColor: showCustomInput ? '#D4AF37' : '#fff',
                  color: showCustomInput ? '#fff' : '#D4AF37',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {lang === 'zh' ? '其他（自己填写）' : 'Other (custom)'}
              </button>
            </div>
            
            {/* 自定义输入框 */}
            {showCustomInput && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={lang === 'zh' ? '输入你的回答...' : 'Type your answer...'}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1A1A1A',
                    backgroundColor: '#fff'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customInput.trim()) {
                      handleCustomSubmit(lastMsgWithOptions.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleCustomSubmit(lastMsgWithOptions.id)}
                  disabled={!customInput.trim()}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: customInput.trim() ? '#0B3D2E' : 'rgba(0,0,0,0.1)',
                    color: customInput.trim() ? '#fff' : 'rgba(0,0,0,0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: customInput.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Send style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
            
            <button
              onClick={handleSkip}
              style={{ marginTop: '12px', background: 'none', border: 'none', color: 'rgba(0,0,0,0.4)', fontSize: '12px', cursor: 'pointer' }}
            >
              {lang === 'zh' ? '跳过问题，直接生成' : 'Skip and generate'}
            </button>
          </div>
        )}

        {/* Save Button */}
        {planItems.length > 0 && nextAction === 'review' && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <button
              onClick={savePlan}
              disabled={saving}
              style={{ 
                width: '100%',
                padding: '14px',
                backgroundColor: '#0B3D2E',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {saving ? (
                <><Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} /> {lang === 'zh' ? '保存中...' : 'Saving...'}</>
              ) : (
                <><Check style={{ width: '20px', height: '20px' }} /> {lang === 'zh' ? '确认并保存计划' : 'Confirm and Save Plan'}</>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
