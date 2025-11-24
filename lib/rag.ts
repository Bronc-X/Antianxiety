/**
 * RAG (检索增强生成) 核心逻辑
 * 负责向量检索、上下文组装、API调用
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { generateSystemPrompt, containsEmergencyKeywords, EMERGENCY_RESPONSE, UserContext } from './system_prompts';

// ==================== 配置 ====================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_BASE = process.env.ANTHROPIC_API_BASE;

// Claude配置常量
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const CLAUDE_MAX_TOKENS = 2000;
const CLAUDE_TEMPERATURE = 0.7;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ 
  apiKey: ANTHROPIC_API_KEY,
  baseURL: ANTHROPIC_API_BASE ? ANTHROPIC_API_BASE.replace(/\/v1\/?$/, '') : 'https://api.anthropic.com'
}) : null;

console.log('🔧 RAG系统配置:', {
  hasAnthropicKey: !!ANTHROPIC_API_KEY,
  anthropicBaseURL: ANTHROPIC_API_BASE || 'default',
  hasOpenAIKey: !!OPENAI_API_KEY
});

// ==================== 类型定义 ====================

export interface KnowledgeMatch {
  id: number;
  content: string;
  content_en: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  metadata: Record<string, any>;
  similarity: number;
  priority: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  userId: string;
  sessionId?: string;
  userQuestion: string;
  conversationHistory?: ChatMessage[];
  userContext?: UserContext;
  language?: 'zh' | 'en';
}

export interface ChatResponse {
  answer: string;
  knowledgeUsed: KnowledgeMatch[];
  sessionId: string;
  metadata: {
    model: string;
    tokensUsed?: number;
    retrievalTime: number;
    generationTime: number;
  };
}

// ==================== 核心函数 ====================

/**
 * 从问题中提取关键词（简化版RAG）
 */
function extractKeywordsFromQuestion(question: string): string[] {
  const keywords: string[] = [];
  
  // 健康相关关键词映射
  const keywordPatterns: { [key: string]: string[] } = {
    '疲劳|累|乏力|没精神|困': ['疲劳', '能量', '线粒体', 'ATP'],
    '脂肪|肥胖|体重|瘦不下来|肚子': ['脂肪', '肥胖', '代谢', 'IL-17', '炎症'],
    '睡眠|失眠|睡不着|睡不好': ['睡眠', '睡眠质量', '昼夜节律'],
    '压力|焦虑|紧张|烦躁': ['压力', '皮质醇', '应激'],
    '运动|锻炼|健身': ['运动', '有氧', '抗阻', 'Zone 2'],
    '饮食|吃|营养|禁食': ['饮食', '营养', '禁食', '间歇性禁食', '16:8'],
    '炎症|发炎': ['炎症', 'IL-17', 'TNF'],
    '代谢|新陈代谢': ['代谢', '能量消耗', '基础代谢'],
    '激素|胰岛素': ['激素', '胰岛素', '胰岛素抵抗'],
    '肌肉|肌少症': ['肌肉', '肌少症', '蛋白质', '亮氨酸'],
  };
  
  // 匹配关键词
  for (const [pattern, related] of Object.entries(keywordPatterns)) {
    const regex = new RegExp(pattern);
    if (regex.test(question)) {
      keywords.push(...related);
    }
  }
  
  // 如果没有匹配到，返回问题中的常用词
  if (keywords.length === 0) {
    const commonWords = question.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    keywords.push(...commonWords.slice(0, 5));
  }
  
  return Array.from(new Set(keywords)); // 去重
}

/**
 * 使用关键词匹配检索相关知识（简化版RAG）
 */
async function retrieveRelevantKnowledge(
  keywords: string[],
  limit: number = 5,
  filterCategories?: string[]
): Promise<KnowledgeMatch[]> {
  try {
    console.log('🔍 Searching keywords:', keywords);
    
    // 构建查询：匹配content或tags包含关键词
    let query = supabase
      .from('metabolic_knowledge_base')
      .select('*');
    
    // 关键词匹配：使用OR逻辑
    if (keywords.length > 0) {
      const searchConditions = keywords.map(kw => 
        `content.ilike.%${kw}%,tags.cs.{${kw}}`
      ).join(',');
      
      // Supabase的text search
      query = query.or(searchConditions);
    }
    
    // 分类过滤
    if (filterCategories && filterCategories.length > 0) {
      query = query.in('category', filterCategories);
    }
    
    // 按优先级排序，限制数量
    const { data, error} = await query.order('priority', { ascending: false }).limit(limit);
    
    if (error) {
      console.error('❌ Error retrieving knowledge:', error);
      
      // 降级方案：使用简单的文本匹配
      const fallbackQuery = supabase
        .from('metabolic_knowledge_base')
        .select('*')
        .order('priority', { ascending: false })
        .limit(limit);
      
      const fallbackResult = await fallbackQuery;
      
      if (fallbackResult.error) {
        console.error('❌ Fallback query also failed:', fallbackResult.error);
        return [];
      }
      
      // 手动过滤匹配的条目
      const filtered = (fallbackResult.data || []).filter(item => {
        const contentLower = item.content.toLowerCase();
        const tagsLower = (item.tags || []).map((t: string) => t.toLowerCase());
        
        return keywords.some(kw => {
          const kwLower = kw.toLowerCase();
          return contentLower.includes(kwLower) || tagsLower.includes(kwLower);
        });
      });
      
      console.log(`✅ Fallback found ${filtered.length} matches`);
      return filtered.slice(0, limit).map((item, index) => ({
        ...item,
        similarity: 1 - (index * 0.1), // 模拟相似度
      }));
    }
    
    console.log(`✅ Found ${data?.length || 0} knowledge matches`);
    return (data || []).map((item: any, index: number) => ({
      ...item,
      similarity: 1 - (index * 0.1), // 模拟相似度评分
    }));
  } catch (error) {
    console.error('❌ Error in retrieveRelevantKnowledge:', error);
    return [];
  }
}

/**
 * 组装上下文数据（将检索到的知识整合成文本）
 */
function assembleContextData(matches: KnowledgeMatch[], language: 'zh' | 'en' = 'zh'): string {
  if (matches.length === 0) {
    return '（未找到相关知识库内容）';
  }
  
  const contextParts = matches.map((match, index) => {
    const content = language === 'zh' ? match.content : (match.content_en || match.content);
    const metadata = match.metadata;
    
    let contextStr = `[知识${index + 1}] ${content}`;
    
    // 添加研究引用
    if (metadata.research) {
      contextStr += `\n   研究来源：${metadata.research}`;
    }
    
    // 添加数据
    if (metadata.timeline) {
      contextStr += `\n   时间线：${metadata.timeline}`;
    }
    if (metadata.expected_improvement) {
      contextStr += `\n   预期效果：${metadata.expected_improvement}`;
    }
    if (metadata.dosage) {
      contextStr += `\n   建议剂量：${metadata.dosage}`;
    }
    
    return contextStr;
  });
  
  return contextParts.join('\n\n');
}

/**
 * 调用Claude API生成回复
 */
async function generateResponseWithClaude(
  systemPrompt: string,
  userQuestion: string,
  contextData: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ answer: string; tokensUsed: number }> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }
  
  try {
    // 组装消息历史
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: `【相关知识库内容】
${contextData}

【用户问题】
${userQuestion}`
      }
    ];
    
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      temperature: CLAUDE_TEMPERATURE,
      system: systemPrompt,
      messages: messages
    });
    
    const answer = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    
    return { answer, tokensUsed };
  } catch (error: any) {
    console.error('❌ Claude API调用失败:', {
      message: error.message,
      status: error.status,
      type: error.type,
      model: CLAUDE_MODEL,
      baseURL: ANTHROPIC_API_BASE,
      error: error
    });
    throw error; // 抛出原始错误
  }
}

/**
 * 调用OpenAI GPT API生成回复（备选）
 */
async function generateResponseWithGPT(
  systemPrompt: string,
  userQuestion: string,
  contextData: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ answer: string; tokensUsed: number }> {
  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: `【相关知识库内容】
${contextData}

【用户问题】
${userQuestion}`
      }
    ];
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });
    
    const answer = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    
    return { answer, tokensUsed };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate response with GPT');
  }
}

/**
 * 保存对话到数据库
 */
async function saveConversation(
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        role,
        content,
        metadata
      });
    
    if (error) {
      console.warn('⚠️ 无法保存对话（RLS限制），但AI回复仍正常返回:', error.code);
      // 不抛出错误，让AI回复正常返回
    }
  } catch (error) {
    console.warn('⚠️ 保存对话失败，但不影响AI回复');
    // 静默处理，不影响主流程
  }
}

/**
 * 更新知识使用统计
 */
async function updateKnowledgeUsageStats(knowledgeIds: number[]): Promise<void> {
  try {
    for (const id of knowledgeIds) {
      await supabase.rpc('increment_knowledge_usage', {
        knowledge_id: id,
        is_helpful: null
      });
    }
  } catch (error) {
    console.error('Error updating knowledge usage stats:', error);
  }
}

/**
 * 创建或获取会话ID
 */
async function getOrCreateSession(userId: string, sessionId?: string): Promise<string> {
  if (sessionId) {
    return sessionId;
  }
  
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: '新对话',
        message_count: 0
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating session:', error);
    // 如果是RLS错误，生成临时sessionId并继续
    console.log('⚠️ 使用临时会话ID，跳过数据库保存');
    return `temp_${userId}_${Date.now()}`;
  }
}

// ==================== 主函数 ====================

/**
 * RAG聊天主函数
 */
export async function chatWithRAG(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();
  
  // 1. 紧急情况检测
  if (containsEmergencyKeywords(request.userQuestion)) {
    const sessionId = await getOrCreateSession(request.userId, request.sessionId);
    
    // 保存用户问题和紧急回复
    await saveConversation(request.userId, sessionId, 'user', request.userQuestion);
    await saveConversation(request.userId, sessionId, 'assistant', EMERGENCY_RESPONSE);
    
    return {
      answer: EMERGENCY_RESPONSE,
      knowledgeUsed: [],
      sessionId,
      metadata: {
        model: 'emergency_response',
        retrievalTime: 0,
        generationTime: Date.now() - startTime
      }
    };
  }
  
  // 2. 提取问题关键词（简化版RAG，不需要embedding）
  const retrievalStart = Date.now();
  const keywords = extractKeywordsFromQuestion(request.userQuestion);
  console.log('🔍 提取的关键词:', keywords);
  
  // 3. 检索相关知识（使用关键词匹配）
  const knowledgeMatches = await retrieveRelevantKnowledge(
    keywords,
    5     // 返回top 5
  );
  console.log(`📚 检索到 ${knowledgeMatches.length} 条知识`);
  const retrievalTime = Date.now() - retrievalStart;
  
  // 4. 组装上下文
  const contextData = assembleContextData(knowledgeMatches, request.language || 'zh');
  
  console.log('\n🧠 生成System Prompt...');
  const systemPrompt = generateSystemPrompt(request.userContext);
  
  // 🚨 关键检查：System Prompt中是否包含CRITICAL CONTEXT
  if (request.userContext?.current_focus) {
    const hasCriticalContext = systemPrompt.includes('CRITICAL CONTEXT');
    console.log('🚨 CRITICAL CONTEXT注入检查:', hasCriticalContext ? '✅ 已注入' : '❌ 未注入');
    console.log('📝 current_focus内容:', request.userContext.current_focus);
    
    // 显示System Prompt的关键部分（前500字符）
    const promptPreview = systemPrompt.substring(0, 500);
    if (promptPreview.includes(request.userContext.current_focus)) {
      console.log('✅ 确认: current_focus已出现在System Prompt中');
    } else {
      console.warn('⚠️ WARNING: current_focus未出现在System Prompt预览中！');
    }
  } else {
    console.warn('⚠️ WARNING: userContext.current_focus为空，无法注入CRITICAL CONTEXT');
  }
  
  // 5. 生成回复
  const generationStart = Date.now();
  let answer: string;
  let tokensUsed = 0;
  let model = 'gpt-4o';
  
  try {
    if (anthropic) {
      console.log('🤖 使用Claude生成回复...');
      // 优先使用Claude
      const result = await generateResponseWithClaude(
        systemPrompt,
        request.userQuestion,
        contextData,
        request.conversationHistory || []
      );
      answer = result.answer;
      tokensUsed = result.tokensUsed;
      model = 'claude-3.5-sonnet';
      console.log('✅ Claude回复成功');
    } else {
      console.log('🤖 使用GPT生成回复...');
      // 备选GPT
      const result = await generateResponseWithGPT(
        systemPrompt,
        request.userQuestion,
        contextData,
        request.conversationHistory || []
      );
      answer = result.answer;
      tokensUsed = result.tokensUsed;
      console.log('✅ GPT回复成功');
    }
  } catch (error: any) {
    console.error('❌ AI回复生成失败:', {
      message: error.message,
      status: error.status,
      response: error.response,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    throw error; // 抛出原始错误以便上层捕获详细信息
  }
  
  const generationTime = Date.now() - generationStart;
  
  // 6. 保存对话
  const sessionId = await getOrCreateSession(request.userId, request.sessionId);
  await saveConversation(
    request.userId,
    sessionId,
    'user',
    request.userQuestion
  );
  await saveConversation(
    request.userId,
    sessionId,
    'assistant',
    answer,
    {
      model,
      knowledge_ids: knowledgeMatches.map(k => k.id),
      tokens_used: tokensUsed
    }
  );
  
  // 7. 更新知识使用统计
  if (knowledgeMatches.length > 0) {
    await updateKnowledgeUsageStats(knowledgeMatches.map(k => k.id));
  }
  
  return {
    answer,
    knowledgeUsed: knowledgeMatches,
    sessionId,
    metadata: {
      model,
      tokensUsed,
      retrievalTime,
      generationTime
    }
  };
}

/**
 * 获取用户对话历史
 */
export async function getChatHistory(
  userId: string,
  sessionId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('role, content')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // 反转顺序（最新的在最后）
    return (data || []).reverse();
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

/**
 * 提交用户反馈
 */
export async function submitFeedback(
  conversationId: number,
  feedback: 'helpful' | 'not_helpful',
  comment?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .update({
        user_feedback: feedback,
        feedback_comment: comment
      })
      .eq('id', conversationId);
    
    if (error) throw error;
    
    // 如果是positive反馈，更新知识库的helpful_count
    if (feedback === 'helpful') {
      const { data } = await supabase
        .from('chat_conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();
      
      if (data?.metadata?.knowledge_ids) {
        const knowledgeIds = data.metadata.knowledge_ids as number[];
        for (const id of knowledgeIds) {
          await supabase.rpc('increment_knowledge_usage', {
            knowledge_id: id,
            is_helpful: true
          });
        }
      }
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback');
  }
}
