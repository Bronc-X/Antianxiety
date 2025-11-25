import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface VoiceAnalysisRequest {
  transcript: string;
  currentFormState: {
    sleepDuration: string;
    sleepQuality: string;
    exerciseDuration: string;
    moodStatus: string;
    stressLevel: string;
    notes: string;
  };
}

interface VoiceAnalysisResponse {
  formUpdates: Partial<VoiceAnalysisRequest['currentFormState']>;
  summary: string;
  confidence: number;
}

/**
 * 解析语音内容并提取健康数据
 */
const parseHealthDataFromTranscript = (transcript: string): Partial<VoiceAnalysisRequest['currentFormState']> => {
  const formUpdates: Partial<VoiceAnalysisRequest['currentFormState']> = {};
  
  // 睡眠时长解析
  const sleepPatterns = [
    /睡了?\s*([1-9](?:\.\d)?)\s*(?:个?小时|h|小时)/i,
    /([1-9](?:\.\d)?)\s*(?:点|小时)\s*睡眠/i,
    /睡眠\s*([1-9](?:\.\d)?)\s*(?:小时|h)/i,
  ];
  
  for (const pattern of sleepPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      const hours = parseFloat(match[1]);
      if (hours >= 3 && hours <= 12) {
        formUpdates.sleepDuration = (hours * 60).toString();
        break;
      }
    }
  }
  
  // 睡眠质量解析
  const sleepQualityMap: Record<string, string> = {
    '恢复极佳|恢复很好|睡得很香|深度睡眠|优质': 'excellent',
    '恢复良好|睡得不错|还可以|比较好': 'good', 
    '一般|凑合|普通|中等': 'average',
    '浅睡|多梦|不太好|睡得不好': 'poor',
    '失眠|断续|很差|糟糕|没睡好': 'very_poor'
  };
  
  for (const [keywords, value] of Object.entries(sleepQualityMap)) {
    if (new RegExp(keywords, 'i').test(transcript)) {
      formUpdates.sleepQuality = value;
      break;
    }
  }
  
  // 运动时长解析
  const exercisePatterns = [
    /(?:运动|锻炼|健身)(?:了?)?\s*([1-9]\d?)\s*(?:分钟|min)/i,
    /([1-9]\d?)\s*(?:分钟|min)\s*(?:运动|锻炼|健身)/i,
    /跑步\s*([1-9]\d?)\s*(?:分钟|min)/i,
    /没有?运动|未运动|没锻炼/i,
  ];
  
  for (const pattern of exercisePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      if (match[0].includes('没') || match[0].includes('未')) {
        formUpdates.exerciseDuration = '0';
      } else if (match[1]) {
        const minutes = parseInt(match[1]);
        if (minutes >= 0 && minutes <= 300) {
          formUpdates.exerciseDuration = minutes.toString();
        }
      }
      break;
    }
  }
  
  // 心情状态解析
  const moodMap: Record<string, string> = {
    '专注|平静|平稳|清晰|集中': '专注平稳',
    '轻松|愉悦|开心|高兴|舒畅|积极': '轻松愉悦',
    '疲惫|累|疲劳|困倦': '略感疲惫',
    '焦虑|紧张|担心|不安|忐忑': '焦虑紧绷',
    '低落|沮丧|郁闷|心情不好|难过': '情绪低落',
    '亢奋|激动|兴奋|躁动': '亢奋躁动'
  };
  
  for (const [keywords, mood] of Object.entries(moodMap)) {
    if (new RegExp(keywords, 'i').test(transcript)) {
      formUpdates.moodStatus = mood;
      break;
    }
  }
  
  // 压力水平解析
  const stressPatterns = [
    /压力\s*([1-9]|10)(?:分|级|档)?/i,
    /压力(?:很?大|高|重|严重)/i,
    /压力(?:很?小|低|轻|不大)/i,
    /压力(?:一般|中等|正常)/i,
    /没什么压力|无压力|很轻松/i,
  ];
  
  for (const pattern of stressPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      if (match[1]) {
        formUpdates.stressLevel = match[1];
      } else if (match[0].includes('大') || match[0].includes('高') || match[0].includes('重')) {
        formUpdates.stressLevel = '7';
      } else if (match[0].includes('小') || match[0].includes('低') || match[0].includes('轻') || match[0].includes('无')) {
        formUpdates.stressLevel = '2';
      } else if (match[0].includes('一般') || match[0].includes('中等') || match[0].includes('正常')) {
        formUpdates.stressLevel = '5';
      }
      break;
    }
  }
  
  return formUpdates;
};

/**
 * 生成AI分析总结
 */
const generateAnalysisSummary = (transcript: string, formUpdates: Partial<VoiceAnalysisRequest['currentFormState']>): string => {
  const extractedItems: string[] = [];
  
  if (formUpdates.sleepDuration) {
    const hours = (parseFloat(formUpdates.sleepDuration) / 60).toFixed(1);
    extractedItems.push(`睡眠时长: ${hours}小时`);
  }
  
  if (formUpdates.sleepQuality) {
    const qualityLabels: Record<string, string> = {
      'excellent': '恢复极佳',
      'good': '恢复良好', 
      'average': '一般',
      'poor': '浅睡多梦',
      'very_poor': '断续失眠'
    };
    extractedItems.push(`睡眠质量: ${qualityLabels[formUpdates.sleepQuality]}`);
  }
  
  if (formUpdates.exerciseDuration) {
    const minutes = formUpdates.exerciseDuration;
    extractedItems.push(`运动时长: ${minutes}分钟`);
  }
  
  if (formUpdates.moodStatus) {
    extractedItems.push(`心情状态: ${formUpdates.moodStatus}`);
  }
  
  if (formUpdates.stressLevel) {
    extractedItems.push(`压力等级: ${formUpdates.stressLevel}/10`);
  }
  
  if (extractedItems.length === 0) {
    return '未能从语音中识别到明确的健康数据，请手动填写或重新描述。';
  }
  
  return `AI已从您的描述中提取: ${extractedItems.join('、')}。数据已自动填入表单，请确认后保存。`;
};

export async function POST(request: NextRequest) {
  try {
    const { transcript, currentFormState }: VoiceAnalysisRequest = await request.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: '语音内容为空' },
        { status: 400 }
      );
    }
    
    // 解析语音内容
    const formUpdates = parseHealthDataFromTranscript(transcript);
    
    // 生成AI总结
    const summary = generateAnalysisSummary(transcript, formUpdates);
    
    // 计算解析置信度
    const confidence = Object.keys(formUpdates).length / 5; // 最多5个字段
    
    const response: VoiceAnalysisResponse = {
      formUpdates,
      summary,
      confidence
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('AI语音分析失败:', error);
    return NextResponse.json(
      { error: 'AI分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
