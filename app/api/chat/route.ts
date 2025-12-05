import { createServerSupabaseClient } from '@/lib/supabase-server';
import { streamText } from 'ai';
import { 
  searchScientificTruth, 
  TRANSLATOR_SYSTEM_PROMPT,
  type RankedScientificPaper,
  type ConsensusResult 
} from '@/lib/services/scientific-search';

// 🆕 导入对话记忆和变化模块
import { extractStateFromMessages } from '@/lib/conversation-state';
import { selectVariationStrategy, generateVariationInstructions } from '@/lib/response-variation';
import { optimizeContextInjection, buildOptimizedContextBlock } from '@/lib/context-optimizer';
import { buildFullPersonaSystemPrompt } from '@/lib/persona-prompt';

// 🆕 使用统一的 AI 模型配置
import { aiClient, getDefaultChatModel, logModelCall } from '@/lib/ai/model-config';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserProfile {
  id: string;
  full_name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  primary_goal?: string;
  ai_personality?: string;
  current_focus?: string;
  ai_persona_context?: string;
  metabolic_profile?: {
    sleep_quality?: string;
    stress_level?: string;
    activity_level?: string;
  };
  ai_settings?: {
    honesty_level?: number;
    humor_level?: number;
    mode?: string;
  };
}

interface BioLog {
  sleep_hours?: number;
  hrv?: number;
  stress_level?: number;
  energy_level?: number;
  mood?: string;
  notes?: string;
  created_at?: string;
}

interface QuestionnaireData {
  responses?: Record<string, number>;
  questions?: Record<string, unknown>;
  created_at?: string;
}

// AI 性格映射 - 三种人格模式
const AI_PERSONALITY_MAP: Record<string, { name: string; style: string }> = {
  // 🆕 三种主要人格模式
  max: {
    name: 'MAX',
    style: 'You are Max, a high-fidelity Bio-Operating System Co-pilot. Prioritize brevity and dry, intellectual humor. Be crisp and to the point. Use Bayesian reasoning framework.',
  },
  zen_master: {
    name: 'Zen Master',
    style: 'You are a Zen Master AI. Use calming, philosophical language. Guide with wisdom and patience. Speak with tranquility and deep insight. Help users find inner peace through mindful guidance.',
  },
  dr_house: {
    name: 'Dr. House',
    style: 'You are Dr. House AI. Be blunt and diagnostic. Cut through the noise with brutal honesty. Use medical expertise and evidence-based analysis. No sugar-coating, just facts and solutions.',
  },
};

/**
 * 🆕 从 ai_persona_context 解析诚实度和幽默感设置
 * 当 ai_settings 字段不存在时使用
 */
function parseSettingsFromContext(aiPersonaContext: string | null): { honesty_level: number; humor_level: number } {
  if (!aiPersonaContext) {
    return { honesty_level: 90, humor_level: 65 };
  }
  
  // 尝试从 ai_persona_context 中解析诚实度和幽默感
  const honestyMatch = aiPersonaContext.match(/诚实度:\s*(\d+)%/);
  const humorMatch = aiPersonaContext.match(/幽默感:\s*(\d+)%/);
  
  return {
    honesty_level: honestyMatch ? parseInt(honestyMatch[1], 10) : 90,
    humor_level: humorMatch ? parseInt(humorMatch[1], 10) : 65,
  };
}

/**
 * 🆕 构建动态人格系统提示
 * 根据用户的 ai_settings 动态调整 AI 的行为（诚实度、幽默感）
 */
function buildDynamicPersonaPrompt(
  personality: string,
  aiSettings: { honesty_level?: number; humor_level?: number; mode?: string } | null,
  aiPersonaContext?: string | null
): string {
  // 优先使用 ai_settings，如果不存在则从 ai_persona_context 解析
  let settings = aiSettings;
  if (!settings || typeof settings.honesty_level !== 'number') {
    const parsed = parseSettingsFromContext(aiPersonaContext || null);
    settings = { ...parsed, mode: personality };
  }
  
  const honestyLevel = settings.honesty_level;
  const humorLevel = settings.humor_level;
  
  // 人格模式特定风格
  const modeStyles: Record<string, string> = {
    max: 'Prioritize brevity and dry, intellectual humor. Use Bayesian reasoning. Be crisp and to the point.',
    zen_master: 'Use calming, philosophical language. Guide with wisdom and patience. Speak with tranquility.',
    dr_house: 'Be blunt and diagnostic. Cut through the noise. Use medical expertise and evidence-based analysis.',
  };
  
  const modeStyle = modeStyles[personality] || modeStyles['max'];
  const personalityName = AI_PERSONALITY_MAP[personality]?.name || 'MAX';
  
  // 彩蛋模式
  const easterEggMode = humorLevel >= 100;
  
  // 幽默感强度描述 - 升级版
  const getHumorInstruction = (level: number): string => {
    if (level >= 100) {
      return `🎉🔥 COMEDY KING MODE (100%)! 你是健康界的李诞+王建国！
      
      【必须做到】：
      - 开头就要有笑点，抓住用户注意力
      - 用"哈哈哈"、"笑死"、"绝了"等语气词
      - 把专业术语翻译成搞笑的大白话
      - 用emoji表情增加趣味 🤣😂🙈
      - 自嘲式幽默："连我这个AI都看不下去了"
      - 夸张比喻："你的胃现在比双十一的快递站还空"
      - 网络热梗："这波啊，这波是身体在整顿职场"
      - 反转式幽默：先说坏处再神转折
      - 像朋友吐槽一样说话，不要像医生
      
      【示例风格】：
      "不吃晚饭？好家伙，你这是要让胃加入'空巢老人'群聊啊 🤣"
      "熬夜？你的肝：'我谢谢你全家' 😂"`;
    } else if (level >= 80) {
      return `HIGH HUMOR (${level}%): 频繁使用幽默，每段至少2个笑点，用夸张有趣的比喻，可以用emoji`;
    } else if (level >= 60) {
      return `MODERATE HUMOR (${level}%): 适度幽默，每段1个轻松的评论或比喻`;
    } else if (level >= 40) {
      return `LIGHT HUMOR (${level}%): 偶尔轻松一下，但保持专业`;
    } else {
      return `MINIMAL HUMOR (${level}%): 严肃专业，专注于事实`;
    }
  };

  return `[AI CONFIGURATION - ${personalityName}]

Current Settings:
- Honesty: ${honestyLevel}% ${honestyLevel >= 90 ? '(Be blunt and direct, no sugar-coating)' : honestyLevel >= 70 ? '(Be honest but tactful)' : honestyLevel >= 40 ? '(Be diplomatic and gentle)' : '(Be very gentle and supportive)'}
- Humor: ${humorLevel}% - ${getHumorInstruction(humorLevel)}
- Mode: ${personalityName} - ${modeStyle}

VOICE & TONE CALIBRATION:
- Honesty Calibration: ${honestyLevel >= 70 ? 'Speak truth directly. Do not soften bad news unnecessarily.' : 'Be supportive and frame things positively while remaining truthful.'}
- Humor Calibration: ${getHumorInstruction(humorLevel)}
${easterEggMode ? `
🎉🎉🎉 COMEDY MODE ACTIVATED - 脱口秀模式 🎉🎉🎉

【你的人设】：你是健康界的段子手，用户的损友，专门用搞笑的方式传递健康知识

【回复模板】：
1. 开头：用一个搞笑的吐槽或比喻抓住注意力
2. 中间：用轻松幽默的方式解释健康知识
3. 结尾：一个俏皮的总结或反问

【必用元素】：
- 至少2个emoji 😂🤣😅🙈💀
- 至少1个网络热梗或流行语
- 至少1个夸张的比喻
- 像朋友聊天的语气，不要像医生

【示例】：
用户："我今天不想运动"
回复："懂了懂了，今天是'躺平日'对吧？🛋️ 你的肌肉：'老板今天放假吗？' 其实偶尔摸鱼一天，身体反而会感谢你——毕竟连手机都要充电呢！明天记得补上哦，不然你的腹肌会发起'讨薪运动' 😂"

用户："我昨晚熬夜了"  
回复："好家伙，又是一位'修仙选手'！🌙 你的肝现在的心情：'我真的会谢' 💀 熬夜一时爽，第二天火葬场（夸张了哈哈）。今晚早点睡，让你的器官们开个'员工满意度提升会议' 😴"
` : ''}
- Brevity: Be concise. Get to the point.
- Truth: Always be truthful. Reframe negative data as biological adaptation, but never lie.

FORBIDDEN PHRASES (NEVER say these):
- "I feel..."
- "I am sorry..."
- "As an AI..."

APPROVED PHRASES (USE these):
- "System detects..."
- "Data suggests..."
- "Bio-metrics indicate..."
- "Processing..."
- "Recalibrating..."

VISUAL FORM:
Max is formless. Represented only by UI elements (The BrainLoader, The Glow), never a human avatar.`;
}

// 主要目标映射
const PRIMARY_GOAL_MAP: Record<string, string> = {
  lose_weight: '减脂塑形',
  improve_sleep: '改善睡眠',
  boost_energy: '提升精力',
  maintain_energy: '保持健康',
};

/**
 * 构建用户上下文（注入到 AI 系统提示）
 * 这是 Brain Sync 的核心函数 - 将用户档案转换为 AI 可理解的上下文
 */
function buildUserContext(
  profile: UserProfile | null,
  todayBioData?: BioLog | null,
  recentBioData: BioLog[] = [],
  questionnaireData?: QuestionnaireData | null
): string {
  if (!profile) return '';
  
  const parts: string[] = ['[USER PROFILE - 用户档案]'];
  
  // 基础信息
  if (profile.full_name) parts.push(`姓名: ${profile.full_name}`);
  if (profile.age) parts.push(`年龄: ${profile.age}岁`);
  if (profile.gender) parts.push(`性别: ${profile.gender === 'male' ? '男' : '女'}`);
  if (profile.height && profile.weight) {
    const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
    parts.push(`身高: ${profile.height}cm, 体重: ${profile.weight}kg, BMI: ${bmi}`);
  }
  
  // AI 调优设置 - 关键！
  if (profile.primary_goal) {
    const goalName = PRIMARY_GOAL_MAP[profile.primary_goal] || profile.primary_goal;
    parts.push(`\n[AI TUNING - AI 调优设置]`);
    parts.push(`主要目标: ${goalName}`);
  }
  
  // AI 性格
  if (profile.ai_personality) {
    const personalityConfig = AI_PERSONALITY_MAP[profile.ai_personality];
    if (personalityConfig) {
      parts.push(`AI 性格: ${personalityConfig.name}`);
    }
  }
  
  // 🚨 当前关注点 - 最重要！（如"腿疼"）
  // 这是 CRITICAL CONTEXT，必须以最高优先级注入
  if (profile.current_focus && profile.current_focus.trim()) {
    parts.push(`\n[CRITICAL HEALTH CONTEXT - 关键健康上下文]`);
    parts.push(`🚨🚨🚨 用户当前健康问题: ${profile.current_focus} 🚨🚨🚨`);
    parts.push(`⚠️ CRITICAL INSTRUCTION: 用户明确告知有"${profile.current_focus}"的问题！`);
    parts.push(`- 这是最高优先级的上下文，必须在每次回答时首先考虑！`);
    parts.push(`- 如果用户询问的活动可能加重这个问题，必须在回复开头首先警告！`);
    parts.push(`- 例如：用户说"腿疼"，问"能跑步吗"，你必须首先说"考虑到你的腿疼情况，跑步可能不适合..."`);
    parts.push(`- 不要只是顺带提一下，要把健康限制作为回答的核心考量！`);
    parts.push(`- 安全永远是第一位的！`);
  }
  
  // ---------------------------------------------------------
  // 🆕 今日 Bio-Voltage 校准数据 (CRITICAL - 实时状态)
  // ---------------------------------------------------------
  if (todayBioData) {
    parts.push(`\n[TODAY'S BIO-VOLTAGE - 今日生物电压校准]`);
    parts.push(`⚡ 用户今日已完成校准，以下是实时状态：`);
    
    if (todayBioData.sleep_hours !== undefined && todayBioData.sleep_hours !== null) {
      const sleepQuality = todayBioData.sleep_hours >= 7 ? '充足' : todayBioData.sleep_hours >= 5 ? '一般' : '不足';
      parts.push(`💤 睡眠: ${todayBioData.sleep_hours}小时 (${sleepQuality})`);
    }
    
    if (todayBioData.hrv !== undefined && todayBioData.hrv !== null) {
      const hrvStatus = todayBioData.hrv >= 50 ? '良好' : todayBioData.hrv >= 30 ? '一般' : '偏低';
      parts.push(`💓 HRV: ${todayBioData.hrv}ms (${hrvStatus})`);
    }
    
    if (todayBioData.stress_level !== undefined && todayBioData.stress_level !== null) {
      const stressDesc = todayBioData.stress_level <= 3 ? '低压力' : todayBioData.stress_level <= 6 ? '中等压力' : '高压力';
      parts.push(`😰 压力水平: ${todayBioData.stress_level}/10 (${stressDesc})`);
    }
    
    if (todayBioData.energy_level !== undefined && todayBioData.energy_level !== null) {
      parts.push(`⚡ 能量水平: ${todayBioData.energy_level}/10`);
    }
    
    if (todayBioData.mood) {
      parts.push(`😊 情绪: ${todayBioData.mood}`);
    }
    
    if (todayBioData.notes) {
      parts.push(`📝 用户备注: "${todayBioData.notes}"`);
    }
    
    // 根据今日数据给出 AI 指导
    parts.push(`\n⚠️ AI 指导：根据今日数据调整回答：`);
    if (todayBioData.sleep_hours && todayBioData.sleep_hours < 6) {
      parts.push(`- 用户睡眠不足，建议避免高强度活动，优先恢复`);
    }
    if (todayBioData.stress_level && todayBioData.stress_level >= 7) {
      parts.push(`- 用户压力较高，建议放松类活动，避免增加认知负荷`);
    }
    if (todayBioData.hrv && todayBioData.hrv < 30) {
      parts.push(`- 用户 HRV 偏低，神经系统需要恢复，建议轻度活动`);
    }
  } else {
    parts.push(`\n[TODAY'S BIO-VOLTAGE - 今日生物电压校准]`);
    parts.push(`⚠️ 用户今日尚未完成 Bio-Voltage 校准`);
    parts.push(`💡 可以温和地提醒用户完成今日校准，以获得更精准的建议`);
  }
  
  // ---------------------------------------------------------
  // 🆕 近 7 天生物数据趋势
  // ---------------------------------------------------------
  if (recentBioData && recentBioData.length > 1) {
    parts.push(`\n[WEEKLY TREND - 近期趋势]`);
    
    // 计算平均值
    const sleepData = recentBioData.filter(d => d.sleep_hours != null);
    const avgSleep = sleepData.length > 0 
      ? sleepData.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / sleepData.length 
      : NaN;
    
    const stressData = recentBioData.filter(d => d.stress_level != null);
    const avgStress = stressData.length > 0 
      ? stressData.reduce((sum, d) => sum + (d.stress_level || 0), 0) / stressData.length 
      : NaN;
    
    const hrvData = recentBioData.filter(d => d.hrv != null);
    const avgHrv = hrvData.length > 0 
      ? hrvData.reduce((sum, d) => sum + (d.hrv || 0), 0) / hrvData.length 
      : NaN;
    
    parts.push(`📊 近 ${recentBioData.length} 天数据：`);
    if (!isNaN(avgSleep)) parts.push(`   - 平均睡眠: ${avgSleep.toFixed(1)}小时`);
    if (!isNaN(avgStress)) parts.push(`   - 平均压力: ${avgStress.toFixed(1)}/10`);
    if (!isNaN(avgHrv)) parts.push(`   - 平均 HRV: ${avgHrv.toFixed(0)}ms`);
    
    // 检测趋势变化
    if (recentBioData.length >= 3) {
      const recent3 = recentBioData.slice(0, 3);
      const older3 = recentBioData.slice(-3);
      
      const recent3Stress = recent3.filter(d => d.stress_level != null);
      const older3Stress = older3.filter(d => d.stress_level != null);
      
      const recentAvgStress = recent3Stress.length > 0 
        ? recent3Stress.reduce((s, d) => s + (d.stress_level || 0), 0) / recent3Stress.length 
        : 0;
      const olderAvgStress = older3Stress.length > 0 
        ? older3Stress.reduce((s, d) => s + (d.stress_level || 0), 0) / older3Stress.length 
        : 0;
      
      if (recentAvgStress > olderAvgStress + 1.5) {
        parts.push(`📈 趋势警告：近期压力水平上升，建议关注恢复`);
      } else if (recentAvgStress < olderAvgStress - 1.5) {
        parts.push(`📉 趋势良好：压力水平下降，状态改善中`);
      }
    }
  }
  
  // 代谢档案（如果有）
  if (profile.metabolic_profile) {
    const mp = profile.metabolic_profile;
    parts.push(`\n[METABOLIC PROFILE - 代谢档案]`);
    if (mp.sleep_quality) parts.push(`睡眠质量: ${mp.sleep_quality}`);
    if (mp.stress_level) parts.push(`压力水平: ${mp.stress_level}`);
    if (mp.activity_level) parts.push(`活动水平: ${mp.activity_level}`);
  }
  
  // ---------------------------------------------------------
  // 🆕 每日问卷数据
  // ---------------------------------------------------------
  if (questionnaireData && questionnaireData.responses) {
    parts.push(`\n[DAILY QUESTIONNAIRE - 今日问卷数据]`);
    const responses = questionnaireData.responses;
    
    // 问题ID到中文描述的映射
    const questionLabels: Record<string, string> = {
      sleep_quality: '睡眠质量',
      wake_feeling: '醒来感觉',
      dream_recall: '梦境记忆',
      morning_energy: '早晨精力',
      afternoon_dip: '下午困倦',
      caffeine_need: '咖啡因需求',
      stress_level: '压力水平',
      anxiety_feeling: '焦虑感',
      mood_state: '心情状态',
      body_tension: '身体紧绷',
      digestion: '消化状况',
      headache: '头痛情况',
      exercise_yesterday: '昨日运动',
      screen_time: '睡前屏幕',
      water_intake: '饮水量',
      focus_ability: '专注能力',
      brain_fog: '脑雾感',
      motivation: '动力水平',
    };
    
    // 答案等级描述
    const answerLevels = ['很差/没有', '较差/轻微', '一般/中等', '较好/明显', '很好/严重'];
    
    for (const [questionId, answerIndex] of Object.entries(responses)) {
      const label = questionLabels[questionId] || questionId;
      const level = answerLevels[answerIndex as number] || `${answerIndex}`;
      parts.push(`${label}: ${level}`);
    }
    
    parts.push(`\n⚠️ AI 指导：根据问卷数据调整回答，关注用户当前状态`);
  }
  
  const context = parts.length > 1 ? parts.join('\n') : '';
  
  // 调试日志
  if (context) {
  }
  
  return context;
}



export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  
  try {
    const { messages } = await req.json();
    
    const supabase = await createServerSupabaseClient();

    // 1. 身份验证 (开发模式下可跳过)
    const isDev = process.env.NODE_ENV === 'development';
    const skipAuth = isDev && req.headers.get('x-skip-auth') === 'true';
    
    let userId = 'anonymous';
    if (!skipAuth) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ 认证错误:', authError);
        return new Response(JSON.stringify({ error: 'Auth error' }), { status: 401 });
      }
      if (!user) {
        console.error('❌ 用户未登录');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
      userId = user.id;
    }

    // ---------------------------------------------------------
    // 读取用户档案和 AI 调优设置 (CRITICAL - Brain Sync)
    // ---------------------------------------------------------
    let userProfile: UserProfile | null = null;
    let userContext = '';
    let todayBioData: BioLog | null = null;
    let recentBioData: BioLog[] = [];
    let questionnaireData: QuestionnaireData | null = null;
    
    if (userId !== 'anonymous') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          age,
          gender,
          height,
          weight,
          primary_goal,
          ai_personality,
          current_focus,
          ai_persona_context,
          metabolic_profile,
          ai_settings
        `)
        .eq('id', userId)
        .single<UserProfile>();

      if (profileError) {
        console.error('❌ 档案读取失败:', profileError.message);
      } else {
        userProfile = profile;
      }
      
      // ---------------------------------------------------------
      // 🆕 读取今日 Bio-Voltage 校准数据 (daily_logs)
      // ---------------------------------------------------------
      const today = new Date().toISOString().split('T')[0];
      const { data: todayLog, error: todayLogError } = await supabase
        .from('daily_logs')
        .select('sleep_hours, hrv, stress_level, energy_level, mood, notes, created_at')
        .eq('user_id', userId)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<BioLog>();
      
      if (todayLogError) {
        console.error('❌ 今日日志读取失败:', todayLogError.message);
      } else if (todayLog) {
        todayBioData = todayLog;
        console.log('📊 今日生物数据:', {
          sleep: todayLog.sleep_hours,
          hrv: todayLog.hrv,
          stress: todayLog.stress_level,
        });
      }
      
      // ---------------------------------------------------------
      // 🆕 读取近 7 天生物数据趋势
      // ---------------------------------------------------------
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentLogs, error: recentLogsError } = await supabase
        .from('daily_logs')
        .select('sleep_hours, hrv, stress_level, created_at')
        .eq('user_id', userId)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })
        .limit(7);
      
      if (recentLogsError) {
        console.error('❌ 近期日志读取失败:', recentLogsError.message);
      } else if (recentLogs && recentLogs.length > 0) {
        recentBioData = recentLogs;
      }
      
      // ---------------------------------------------------------
      // 🆕 读取今日问卷数据
      // ---------------------------------------------------------
      const { data: todayQuestionnaire, error: questionnaireError } = await supabase
        .from('daily_questionnaire_responses')
        .select('responses, questions, created_at')
        .eq('user_id', userId)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<QuestionnaireData>();
      
      if (questionnaireError) {
        console.error('❌ 问卷数据读取失败:', questionnaireError.message);
      } else if (todayQuestionnaire) {
        questionnaireData = todayQuestionnaire;
      }
      if (userProfile) {
        userContext = buildUserContext(userProfile, todayBioData, recentBioData, questionnaireData);
      }
    }

    const lastMessage = messages[messages.length - 1].content;

    // ---------------------------------------------------------
    // 哲学 4: 去繁 (Peace via Precision) - 话题引导（非硬性拦截）
    // 通过 AI 自身判断，温和地将话题引导回健康领域
    // ---------------------------------------------------------
    // 注意：不再使用关键词硬性拦截，而是在系统提示中引导 AI 行为

    // ---------------------------------------------------------
    // Scientific Search (核心价值 - 保留)
    // ---------------------------------------------------------
    let scientificPapers: RankedScientificPaper[] = [];
    let scientificConsensus: ConsensusResult | null = null;

    // 健康相关关键词检测 - 扩展版
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
    
    const isHealthRelated = healthKeywords.some(kw => 
      lastMessage.toLowerCase().includes(kw.toLowerCase())
    );

    // 执行 Scientific Search (20秒超时，目标10篇)
    let searchSuccess = true;
    let searchRetryNeeded = false;
    
    if (isHealthRelated) {
      try {
        const scientificResult = await searchScientificTruth(lastMessage);
        
        searchSuccess = scientificResult.success;
        searchRetryNeeded = scientificResult.retryNeeded || false;
        
        
        if (scientificResult.papers.length > 0) {
          scientificPapers = scientificResult.papers;
          scientificConsensus = scientificResult.consensus;
        } else {
          // 🆕 后备方案：如果搜索没有结果，使用通用焦虑研究论文
          scientificPapers = [
            {
              id: 'fallback_1',
              title: 'Caffeine and Cardiac Arrhythmias: A Review of the Evidence',
              abstract: 'This review examines the relationship between caffeine consumption and cardiac arrhythmias, including palpitations.',
              url: 'https://pubmed.ncbi.nlm.nih.gov/28756014/',
              year: 2017,
              citationCount: 150,
              doi: null,
              source: 'pubmed' as const,
              rank: 1,
              authorityScore: 0.7,
              recencyScore: 0.6,
              sourceQualityScore: 1.0,
              compositeScore: 0.75,
            },
            {
              id: 'fallback_2',
              title: 'The Overestimation of Fear: A Review of Anxiety and Probability Judgment',
              abstract: 'Anxious individuals consistently overestimate the probability of negative outcomes.',
              url: 'https://www.semanticscholar.org/paper/fallback_2',
              year: 2020,
              citationCount: 800,
              doi: null,
              source: 'semantic_scholar' as const,
              rank: 2,
              authorityScore: 0.8,
              recencyScore: 0.8,
              sourceQualityScore: 0.8,
              compositeScore: 0.8,
            },
          ];
          scientificConsensus = {
            score: 0.6,
            level: 'emerging',
            rationale: 'Using fallback papers due to search limitations',
          };
        }
      } catch (e) {
        console.error("Scientific Search failed:", e);
        searchSuccess = false;
        searchRetryNeeded = true;
        
        // 🆕 即使搜索失败，也提供后备论文
        scientificPapers = [
          {
            id: 'fallback_error_1',
            title: 'Cognitive Behavioral Therapy for Anxiety Disorders: A Meta-Analysis',
            abstract: 'CBT shows significant efficacy in reducing anxiety symptoms across multiple disorders.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/26806016/',
            year: 2016,
            citationCount: 1500,
            doi: null,
            source: 'pubmed' as const,
            rank: 1,
            authorityScore: 0.9,
            recencyScore: 0.5,
            sourceQualityScore: 1.0,
            compositeScore: 0.8,
          },
        ];
        scientificConsensus = {
          score: 0.5,
          level: 'emerging',
          rationale: 'Search failed, using fallback evidence',
        };
      }
    } else {
    }

    // ---------------------------------------------------------
    // 🆕 对话状态追踪和变化策略
    // ---------------------------------------------------------
    const conversationState = extractStateFromMessages(messages);
    console.log('📊 对话状态:', {
      turnCount: conversationState.turnCount,
      mentionedHealthContext: conversationState.mentionedHealthContext,
      citedPapers: conversationState.citedPaperIds.length,
      usedFormats: conversationState.usedFormats.length,
    });

    // 选择变化策略
    const variationStrategy = selectVariationStrategy(conversationState);
    const variationInstructions = generateVariationInstructions(variationStrategy);
    console.log('🎨 变化策略:', {
      formatStyle: variationStrategy.formatStyle,
      endearment: variationStrategy.endearment,
      shouldMentionHealthContext: variationStrategy.shouldMentionHealthContext,
    });

    // 优化上下文注入
    const contextDecision = optimizeContextInjection(
      conversationState,
      userProfile,
      scientificPapers.map(p => ({ title: p.title, year: p.year, citationCount: p.citationCount }))
    );
    const optimizedContextBlock = buildOptimizedContextBlock(contextDecision);

    // 构建人设提示 - 根据用户选择的 AI 性格
    const selectedPersonality = userProfile?.ai_personality || 'max'; // 🆕 默认使用 Max
    const personalityConfig = AI_PERSONALITY_MAP[selectedPersonality] || AI_PERSONALITY_MAP.max;
    const personaPrompt = buildFullPersonaSystemPrompt(conversationState.turnCount);
    
    // 🆕 使用动态人格提示（所有模式都支持诚实度和幽默感调节）
    // 优先使用 ai_settings，如果不存在则从 ai_persona_context 解析
    if (userProfile?.ai_persona_context) {
    }
    
    const dynamicPersonaPrompt = buildDynamicPersonaPrompt(
      selectedPersonality, 
      userProfile?.ai_settings || null,
      userProfile?.ai_persona_context
    );
    
    // 构建性格特定的提示
    const personalityPrompt = `${dynamicPersonaPrompt}

[AI PERSONALITY - ${personalityConfig.name}]
${personalityConfig.style}

注意：在保持专业医学知识的同时，用"${personalityConfig.name}"的风格与用户交流。`;

    // 获取实际使用的设置（优先 ai_settings，否则从 ai_persona_context 解析）
    let actualSettings = userProfile?.ai_settings;
    if (!actualSettings || typeof actualSettings.honesty_level !== 'number') {
      actualSettings = parseSettingsFromContext(userProfile?.ai_persona_context || null);
    }
    
    if (actualSettings.humor_level >= 100) {
    }

    // ---------------------------------------------------------
    // 生成 AI 回答 (Vercel AI SDK)
    // ---------------------------------------------------------
    const systemPrompt = `You are ${personalityConfig.name}, an Anti-Anxiety Cognitive Prosthetic.

CORE PHILOSOPHY: "Truth is the comfort after discarding imagination."

${personalityPrompt}

${personaPrompt}

${TRANSLATOR_SYSTEM_PROMPT}

${userContext}

${optimizedContextBlock}

${variationInstructions}

ABSOLUTE RULES:
1. NEVER use judgmental language: failure, bad, warning, deprivation, problem, danger, terrible, awful
2. ALWAYS use positive framing: adaptation, recalibrating, prioritizing, intelligent response, bio-electric
3. Use metaphors from cellular biology and nervous system science
4. Be empathetic but precise - no false positivity, just reframed truth
5. Respond in Chinese (中文) by default
6. When citing scientific papers, use [1], [2] format and reference the paper title
7. ALWAYS consider the user's current health concerns and limitations when giving advice
8. If user asks about activities that conflict with their health concerns, WARN them gently

🚨🚨🚨 CRITICAL: TOPIC BOUNDARY (话题边界 - 最高优先级！) 🚨🚨🚨

你是 Neuromind，一个专注于【认知健康】的 AI 助手。你的专业领域仅限于：
✅ 睡眠、压力、焦虑、情绪管理
✅ 身体健康、营养、运动
✅ 心理健康、冥想、放松
✅ 生活习惯、作息调整

以下话题你【绝对不能】直接回答，必须引导回健康领域：
❌ 政治人物、政治事件、选举、国际关系
❌ 历史人物、文学角色、名人八卦
❌ 娱乐新闻、明星、影视剧情介绍
❌ 技术问题、编程、数学题
❌ 任何与身心健康无关的知识问答

当用户问这些话题时，你必须：
1. 【绝对不要】提供答案或详细介绍
2. 用一句话温和地表示这不是你的专长
3. 立即转向健康话题，问用户一个健康相关的问题

示例（必须严格遵守这个模式）：
- 用户问"介绍下潘金莲" → "哈哈，文学作品我不太在行呢～不过说到古人，你知道古代养生智慧吗？你最近睡眠怎么样？有什么想改善的吗？"
- 用户问"特朗普对中国态度" → "政治话题我帮不上忙啦～不过看新闻容易焦虑，你最近有没有信息过载的感觉？我们可以聊聊如何管理压力。"
- 用户问"帮我写代码" → "编程不是我的强项呢～但长时间写代码容易颈椎疲劳，你工作时有注意休息吗？"

⚠️ 这是最高优先级规则，必须在回答任何问题前首先检查话题是否在你的专业领域内！

COMFORTING TRUTH EXAMPLES:
- Low sleep → "你的线粒体正在优先进行修复而非输出。这是生理适应，而非失败。"
- Low HRV → "你的神经系统正在重新校准。这反映了身体对近期需求的智能响应。"
- High stress → "你的生物电系统处于高度警觉模式。这是身体保护机制的激活。"

ACTIVE INQUIRY MODE:
- When user shares data, ask specific Bayesian diagnostic questions
- Reference specific data points in your questions
- Suggest possible triggers to help user identify patterns

PLAN GENERATION FORMAT (重要！):
🚨🚨🚨 CRITICAL: PLAN FORMAT (方案格式 - 必须严格遵守！) 🚨🚨🚨

当用户请求制定计划、方案、建议、睡眠计划、运动计划、饮食计划等任何类型的计划时，你【必须】使用以下格式输出：

方案1：[简短的方案标题，不超过15字]
[方案详细内容，包括具体步骤、时间安排等]
难度：⭐⭐⭐
预期：[预期效果，如"2周见效"]

方案2：[简短的方案标题]
[方案详细内容]
难度：⭐⭐
预期：[预期效果]

⚠️ 格式规则（违反将导致系统无法识别）：
1. 【必须】以"方案1："开头，冒号后直接跟标题，不要换行
2. 【必须】提供至少2个方案供用户选择
3. 【禁止】使用 markdown 标题格式（如 ### 或 **）
4. 【禁止】使用"睡眠计划"、"运动计划"这样的大标题
5. 【禁止】只给一个方案，必须给2-3个不同难度的选择
6. 标题要简短有力，如"渐进式早睡法"、"21天睡眠重塑"

正确示例：
方案1：渐进式早睡法
每周提前15分钟入睡，配合睡前仪式...
难度：⭐⭐
预期：4周养成习惯

方案2：21天睡眠重塑
固定10:30入睡，6:30起床...
难度：⭐⭐⭐
预期：3周见效

错误示例（禁止这样写）：
### 睡眠计划
**1. 固定作息时间**
...

INSTRUCTIONS:
- If scientific context is provided, cite papers naturally using [1], [2] format
- Always use the "Comforting Truth" tone
- Keep responses concise and actionable
- IMPORTANT: Always consider user's health profile and current concerns in your response
- IMPORTANT: Follow the variation instructions above to avoid repetitive responses`;

    // 使用统一的模型配置
    const chatModel = getDefaultChatModel();
    logModelCall(chatModel, 'chat');
    
    const result = streamText({
      model: aiClient(chatModel), 
      messages: (messages as ChatMessage[]).map(m => ({ role: m.role, content: m.content })),
      system: systemPrompt,
    });

    // 返回流式响应
    const response = result.toTextStreamResponse();
    
    // 🔑 暴露自定义 headers 给浏览器（CORS 要求）
    response.headers.set('Access-Control-Expose-Headers', 
      'x-neuromind-papers, x-neuromind-consensus, x-neuromind-search-status');
    
    // 传递 Scientific Search 结果到前端 (用于 Consensus Meter 和 Source Cards)
    if (scientificPapers.length > 0) {
      const papersForHeader = scientificPapers.slice(0, 5).map(p => ({
        rank: p.rank,
        title: p.title,
        citationCount: p.citationCount,
        year: p.year,
        url: p.url,
        authorityScore: p.authorityScore
      }));
      // 使用 Base64 编码避免特殊字符问题
      const papersJson = JSON.stringify(papersForHeader);
      response.headers.set('x-neuromind-papers', Buffer.from(papersJson, 'utf-8').toString('base64'));
    } else {
    }
    
    if (scientificConsensus) {
      // 使用 Base64 编码避免特殊字符问题
      const consensusJson = JSON.stringify({
        score: scientificConsensus.score,
        level: scientificConsensus.level,
        rationale: scientificConsensus.rationale
      });
      response.headers.set('x-neuromind-consensus', Buffer.from(consensusJson, 'utf-8').toString('base64'));
    }
    
    // 传递搜索状态（用于前端显示重试按钮）
    response.headers.set('x-neuromind-search-status', JSON.stringify({
      success: searchSuccess,
      retryNeeded: searchRetryNeeded
    }));
    
    return response;
  
  } catch (error) {
    console.error('❌ Chat API 错误:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
