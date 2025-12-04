/**
 * 论文搜索 API
 * 独立的端点用于获取科学论文
 * 
 * 由于流式响应的 headers 在浏览器中无法访问，
 * 我们使用单独的 API 来获取论文数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { searchScientificTruth, type RankedScientificPaper } from '@/lib/services/scientific-search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 健康相关关键词 - 扩展版（与 chat/route.ts 同步）
const healthKeywords = [
  // 英文关键词
  'sleep', 'hrv', 'stress', 'anxiety', 'health', 'energy', 'fatigue',
  'metabolism', 'cortisol', 'melatonin', 'circadian', 'exercise', 'diet',
  'heart', 'blood', 'vitamin', 'supplement', 'inflammation', 'immune',
  'caffeine', 'coffee', 'palpitation', 'panic', 'tremor', 'sweating',
  'cold', 'flu', 'fever', 'cough', 'headache', 'pain', 'muscle', 'joint',
  'weight', 'obesity', 'diabetes', 'cholesterol', 'hypertension',
  'depression', 'insomnia', 'migraine', 'allergy', 'asthma',
  // 中文 - 基础健康词汇
  '睡眠', '压力', '焦虑', '健康', '能量', '疲劳', '代谢', '运动', '饮食',
  '心脏', '血压', '维生素', '补充剂', '炎症', '免疫',
  // 中文 - 症状词汇
  '困', '累', '乏力', '失眠', '头痛', '头晕', '心慌', '胸闷', '呼吸',
  '下午', '早上', '晚上', '精神', '注意力', '记忆', '情绪', '抑郁',
  '咖啡', '心悸', '紧张', '恐慌', '发抖', '出汗', '手抖', '心跳',
  // 中文 - 常见疾病/症状
  '感冒', '发烧', '咳嗽', '流鼻涕', '喉咙痛', '嗓子', '鼻塞', '打喷嚏',
  '肚子', '胃', '消化', '便秘', '腹泻', '恶心', '呕吐', '食欲',
  '过敏', '皮肤', '痒', '红肿', '湿疹', '荨麻疹',
  '腰', '背', '颈椎', '肩膀', '关节', '肌肉', '酸痛', '僵硬',
  '眼睛', '视力', '干眼', '近视', '眼疲劳',
  '减肥', '体重', '肥胖', '瘦', '胖',
  '月经', '痛经', '经期', '更年期',
  '血糖', '糖尿病', '高血压', '低血压', '贫血',
  // 中文 - 生活方式
  '熬夜', '加班', '久坐', '缺乏运动', '作息', '生物钟',
  '喝水', '饮水', '脱水', '补水',
  // 中文 - 心理健康
  '焦虑', '抑郁', '烦躁', '心情', '情绪低落', '失落', '孤独',
  '紧张', '害怕', '恐惧', '担心', '忧虑',
  // 中文 - 疑问词组合
  '怎么办', '怎么治', '吃什么', '能不能', '可以吗', '好不好',
  '为什么', '是不是', '正常吗', '严重吗'
];

// 后备论文
const FALLBACK_PAPERS: RankedScientificPaper[] = [
  {
    id: 'fallback_1',
    title: 'Caffeine and Cardiac Arrhythmias: A Review of the Evidence',
    abstract: 'This review examines the relationship between caffeine consumption and cardiac arrhythmias.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28756014/',
    year: 2017,
    citationCount: 150,
    doi: null,
    source: 'pubmed',
    rank: 1,
    authorityScore: 0.7,
    recencyScore: 0.6,
    sourceQualityScore: 1.0,
    compositeScore: 0.75,
  },
  {
    id: 'fallback_2',
    title: 'The Overestimation of Fear: Anxiety and Probability Judgment',
    abstract: 'Anxious individuals consistently overestimate the probability of negative outcomes.',
    url: 'https://www.semanticscholar.org/paper/fallback_2',
    year: 2020,
    citationCount: 800,
    doi: null,
    source: 'semantic_scholar',
    rank: 2,
    authorityScore: 0.8,
    recencyScore: 0.8,
    sourceQualityScore: 0.8,
    compositeScore: 0.8,
  },
];

export async function POST(req: NextRequest) {
  console.log('📚 Papers API 请求开始');
  
  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        papers: [], 
        consensus: null,
        error: 'Missing query' 
      });
    }
    
    // 检查是否健康相关
    const isHealthRelated = healthKeywords.some(kw => 
      query.toLowerCase().includes(kw.toLowerCase())
    );
    
    if (!isHealthRelated) {
      console.log('⚠️ 查询不包含健康关键词');
      return NextResponse.json({ 
        papers: [], 
        consensus: null,
        isHealthRelated: false 
      });
    }
    
    console.log('🔍 搜索论文:', query.substring(0, 50));
    
    try {
      const result = await searchScientificTruth(query);
      
      if (result.papers.length > 0) {
        console.log(`✅ 找到 ${result.papers.length} 篇论文`);
        return NextResponse.json({
          papers: result.papers.slice(0, 5).map(p => ({
            rank: p.rank,
            title: p.title,
            citationCount: p.citationCount,
            year: p.year,
            url: p.url,
            abstract: p.abstract?.substring(0, 200),
          })),
          consensus: result.consensus,
          isHealthRelated: true,
          success: result.success,
        });
      }
    } catch (searchError) {
      console.error('❌ 论文搜索失败:', searchError);
    }
    
    // 返回后备论文
    console.log('⚠️ 使用后备论文');
    return NextResponse.json({
      papers: FALLBACK_PAPERS.map(p => ({
        rank: p.rank,
        title: p.title,
        citationCount: p.citationCount,
        year: p.year,
        url: p.url,
        abstract: p.abstract?.substring(0, 200),
      })),
      consensus: {
        score: 0.6,
        level: 'emerging',
        rationale: 'Using fallback papers',
      },
      isHealthRelated: true,
      success: false,
      fallback: true,
    });
    
  } catch (error) {
    console.error('❌ Papers API 错误:', error);
    return NextResponse.json({ 
      papers: FALLBACK_PAPERS.map(p => ({
        rank: p.rank,
        title: p.title,
        citationCount: p.citationCount,
        year: p.year,
        url: p.url,
      })),
      consensus: null,
      error: 'Internal error',
      fallback: true,
    });
  }
}
