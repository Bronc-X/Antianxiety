import { createServerSupabaseClient } from '@/lib/supabase-server';
import { streamText, generateText } from 'ai';
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
import { aiClient, getChatModePriority, logModelCall, type ChatMode } from '@/lib/ai/model-config';

// 🆕 导入 AI 记忆系统
import {
  generateEmbedding,
  retrieveMemories,
  storeMemory,
  buildContextWithMemories,
} from '@/lib/aiMemory';

// 🆕 导入 Inquiry 上下文系统
import { getInquiryContext, generateInquirySummary } from '@/lib/inquiry-context';

// 🆕 导入 API 工具函数（从合并的 /api/ai/chat）

// 🆕 导入主动问询服务
import {
  generateActiveInquiry,
  type ActivePlan,
  type DailyLog
} from '@/lib/active-inquiry';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  experimental_attachments?: Array<{
    name?: string;
    contentType?: string;
    url?: string;
  }>;
}

interface UserProfile {
  id: string;
  full_name?: string;
  age?: number;
  birth_date?: string | null;
  age_range?: string | null;
  gender?: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  height?: number | null;
  weight?: number | null;
  primary_goal?: string;
  ai_personality?: string;
  current_focus?: string;
  ai_persona_context?: string;
  primary_focus_topics?: string[] | null;
  metabolic_concerns?: string[] | null;
  ai_analysis_result?: Record<string, unknown> | null;
  ai_recommendation_plan?: Record<string, unknown> | null;
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

interface DailyWellnessLog {
  log_date?: string;
  sleep_duration_minutes?: number;
  sleep_quality?: string;
  exercise_duration_minutes?: number;
  exercise_type?: string;
  mood_status?: string;
  stress_level?: number;
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

const FINAL_ANSWER_INSTRUCTION = `
[FINAL ANSWER ONLY]
- 只输出最终回答（中文）
- 不要输出思考过程、推理内容或分析步骤
- 禁止输出 <think> 标签或 reasoning_content
`.trim();

const FINAL_ANSWER_STRICT_INSTRUCTION = `
[FINAL ANSWER STRICT MODE]
- 若无法输出最终回答，请改用更直接、更短的表述
- 必须给出面向用户的最终答复
`.trim();

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

  const honestyLevel = typeof settings.honesty_level === 'number' ? settings.honesty_level : 90;
  const humorLevel = typeof settings.humor_level === 'number' ? settings.humor_level : 65;

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

function stripThoughtBlocks(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '');
}

function cleanAssistantOutput(text: string): string {
  return stripThoughtBlocks(text).trim();
}

function shouldRetryFinalAnswer(raw: string, cleaned: string, userMessage: string): boolean {
  if (!cleaned) return true;
  if (/<think>/i.test(raw)) return true;
  const userLen = userMessage.trim().length;
  if (cleaned.length < 30 && userLen > 20) return true;
  return false;
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
  todayBioData?: DailyWellnessLog | null,
  recentBioData: DailyWellnessLog[] = [],
  questionnaireData?: QuestionnaireData | null,
  activePlan?: ActivePlan | null, // 🆕 Added activePlan
  inquirySummary?: string | null // 🆕 Added inquiry summary
): string {
  if (!profile) return '';

  const parts: string[] = ['[USER PROFILE - 用户档案]'];

  // 基础信息
  if (profile.full_name) parts.push(`姓名: ${profile.full_name}`);
  if (profile.age) parts.push(`年龄: ${profile.age}岁`);
  if (profile.gender) {
    const genderLabel =
      profile.gender === 'male'
        ? '男'
        : profile.gender === 'female'
          ? '女'
          : profile.gender;
    parts.push(`性别: ${genderLabel}`);
  }
  const heightCm = profile.height_cm ?? profile.height ?? null;
  const weightKg = profile.weight_kg ?? profile.weight ?? null;
  if (heightCm && weightKg) {
    const bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
    parts.push(`身高: ${heightCm}cm, 体重: ${weightKg}kg, BMI: ${bmi}`);
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

  if (Array.isArray(profile.primary_focus_topics) && profile.primary_focus_topics.length > 0) {
    parts.push(`重点关注: ${profile.primary_focus_topics.slice(0, 8).join('、')}`);
  }

  if (Array.isArray(profile.metabolic_concerns) && profile.metabolic_concerns.length > 0) {
    parts.push(`代谢困扰: ${profile.metabolic_concerns.slice(0, 8).join('、')}`);
  }

  // 基线方案（用于对话一致性：避免和已生成的微习惯建议打架）
  if (profile.ai_analysis_result || profile.ai_recommendation_plan) {
    parts.push(`\n[AI BASELINE - 既有分析/方案]`);
    const analysis = profile.ai_analysis_result;
    const plan = profile.ai_recommendation_plan as { micro_habits?: Array<{ name?: string }> } | null;
    if (analysis && typeof analysis.confidence_score === 'number') {
      parts.push(`AI 分析置信度: ${analysis.confidence_score}%`);
    }
    if (analysis && Array.isArray((analysis as any).risk_factors) && (analysis as any).risk_factors.length > 0) {
      parts.push(`主要关注点: ${(analysis as any).risk_factors.slice(0, 6).join('、')}`);
    }
    if (plan?.micro_habits && Array.isArray(plan.micro_habits) && plan.micro_habits.length > 0) {
      const habitNames = plan.micro_habits.map((h) => h?.name).filter(Boolean).slice(0, 6);
      if (habitNames.length > 0) {
        parts.push(`已制定微习惯: ${habitNames.join('、')}`);
      }
    }
  }

  // 🚨 当前关注点 - 最重要！（如"腿疼"）
  // 这是 CRITICAL CONTEXT，必须以最高优先级注入
  if (profile.current_focus && profile.current_focus.trim()) {
    parts.push(`\n[CRITICAL HEALTH CONTEXT - 关键健康上下文]`);
    parts.push(`🚨🚨🚨 用户当前健康问题: ${profile.current_focus} 🚨🚨🚨`);
    parts.push(`⚠️ CRITICAL INSTRUCTION: 用户明确告知有"${profile.current_focus}"的问题！`);
    parts.push(`- 这是最高优先级的上下文，必须在每次回答时首先考虑！`);
    parts.push(`- 如果用户询问的活动可能加重这个问题，必须在回复开头优先提醒！`);
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

    const sleepMinutes = todayBioData.sleep_duration_minutes ?? null;
    const sleepHours = sleepMinutes != null ? sleepMinutes / 60 : null;
    if (sleepHours != null) {
      const sleepLevel = sleepHours >= 7 ? '充足' : sleepHours >= 5 ? '一般' : '不足';
      parts.push(`💤 睡眠: ${sleepHours.toFixed(1)}小时 (${sleepLevel})`);
    }

    if (todayBioData.sleep_quality) {
      parts.push(`🌙 睡眠质量: ${todayBioData.sleep_quality}`);
    }

    if (todayBioData.exercise_duration_minutes != null) {
      const exerciseTypeSuffix = todayBioData.exercise_type ? `（${todayBioData.exercise_type}）` : '';
      parts.push(`🏃 运动: ${todayBioData.exercise_duration_minutes}分钟${exerciseTypeSuffix}`);
    }

    if (todayBioData.stress_level !== undefined && todayBioData.stress_level !== null) {
      const stressDesc = todayBioData.stress_level <= 3 ? '低压力' : todayBioData.stress_level <= 6 ? '中等压力' : '高压力';
      parts.push(`😰 压力水平: ${todayBioData.stress_level}/10 (${stressDesc})`);
    }

    if (todayBioData.mood_status) {
      parts.push(`😊 情绪: ${todayBioData.mood_status}`);
    }

    if (todayBioData.notes) {
      parts.push(`📝 用户备注: "${todayBioData.notes}"`);
    }

    // 根据今日数据给出 AI 指导
    parts.push(`\n⚠️ AI 指导：根据今日数据调整回答：`);
    if (sleepHours != null && sleepHours < 6) {
      parts.push(`- 用户睡眠不足，建议避免高强度活动，优先恢复`);
    }
    if (todayBioData.stress_level && todayBioData.stress_level >= 7) {
      parts.push(`- 用户压力较高，建议放松类活动，避免增加认知负荷`);
    }
  } else {
    parts.push(`\n[TODAY'S BIO-VOLTAGE - 今日生物电压校准]`);
    parts.push(`⚠️ 用户今日尚未完成每日状态记录`);
    parts.push(`💡 可以温和地提醒用户完成今日记录，以获得更精准的建议`);
  }

  // ---------------------------------------------------------
  // 🆕 近 7 天生物数据趋势
  // ---------------------------------------------------------
  if (recentBioData && recentBioData.length > 1) {
    parts.push(`\n[WEEKLY TREND - 近期趋势]`);

    // 计算平均值
    const sleepHoursData = recentBioData
      .filter((d) => d.sleep_duration_minutes != null)
      .map((d) => (d.sleep_duration_minutes as number) / 60);
    const avgSleep = sleepHoursData.length > 0 ? sleepHoursData.reduce((sum, hours) => sum + hours, 0) / sleepHoursData.length : NaN;

    const stressData = recentBioData.filter(d => d.stress_level != null);
    const avgStress = stressData.length > 0
      ? stressData.reduce((sum, d) => sum + (d.stress_level || 0), 0) / stressData.length
      : NaN;

    parts.push(`📊 近 ${recentBioData.length} 天数据：`);
    if (!isNaN(avgSleep)) parts.push(`   - 平均睡眠: ${avgSleep.toFixed(1)}小时`);
    if (!isNaN(avgStress)) parts.push(`   - 平均压力: ${avgStress.toFixed(1)}/10`);

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
        parts.push(`📈 趋势提示：近期压力水平上升，建议关注恢复`);
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

  // ---------------------------------------------------------
  // 🆕 当前执行的方案 (PLAN CONTEXT)
  // ---------------------------------------------------------
  if (activePlan) {
    parts.push(`\n[ACTIVE PLAN - 当前执行方案]`);
    parts.push(`方案名称: ${activePlan.title}`);
    parts.push(`开始时间: ${new Date(activePlan.created_at).toLocaleDateString()}`);

    if (activePlan.items && activePlan.items.length > 0) {
      parts.push(`\n具体执行项:`);
      activePlan.items.forEach((item, index) => {
        parts.push(`${index + 1}. ${item.text} [Status: ${item.status || 'pending'}]`);
      });
    } else if (activePlan.content) {
      // 兼容旧数据
      parts.push(`\n方案内容: ${activePlan.content}`);
    }

    parts.push(`\n⚠️ DAILY CHECK-IN RULES (每日问询规则):`);
    parts.push(`1. 必须根据上述[方案详情]进行具体的执行情况问询。`);
    parts.push(`2. 如果用户反馈某项难以坚持，必须提供[平替方案] (Flat Replacement) —— 效果相似但更符合用户习惯的替代项。`);
  }

  // ---------------------------------------------------------
  // 🆕 主动询问上下文 (INQUIRY CONTEXT)
  // ---------------------------------------------------------
  if (inquirySummary) {
    parts.push(`\n[ACTIVE INQUIRY INSIGHTS - 主动询问洞察]`);
    parts.push(inquirySummary);
    parts.push(`\n⚠️ AI 指导：根据用户最近的主动询问回答，调整对话策略和建议内容。`);
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
    const body = await req.json();
    const { messages, stream = true, message, conversationHistory, trigger_checkin, mode = 'fast' } = body; // 🆕 Added trigger_checkin + mode

    // 🆕 兼容旧版 /api/ai/chat 的请求格式（Android 客户端）
    // 旧格式: { message: string, conversationHistory: [] }
    // 新格式: { messages: [] }
    let chatMessages = messages;
    if (!messages && message) {
      // 转换旧格式到新格式
      chatMessages = [
        ...(conversationHistory || []),
        { role: 'user', content: message }
      ];
    }

    // 🆕 处理主动问询触发 (Trigger Check-in)
    // 如果是 trigger_checkin，即使没有 messages 也可以 (会由 AI 生成第一句)
    if (!trigger_checkin && (!chatMessages || chatMessages.length === 0)) {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), { status: 400 });
    }

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
    let todayBioData: DailyWellnessLog | null = null;
    let recentBioData: DailyWellnessLog[] = [];
    let questionnaireData: QuestionnaireData | null = null;
    let activePlan: ActivePlan | null = null; // 🆕 Active plan state

    if (userId !== 'anonymous') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          age,
          birth_date,
          age_range,
          gender,
          height_cm,
          weight_kg,
          height,
          weight,
          primary_goal,
          ai_personality,
          current_focus,
          primary_focus_topics,
          metabolic_concerns,
          ai_analysis_result,
          ai_recommendation_plan,
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
      // 🆕 读取今日状态记录 (daily_wellness_logs)
      // ---------------------------------------------------------
      const today = new Date().toISOString().split('T')[0];
      const { data: todayLog, error: todayLogError } = await supabase
        .from('daily_wellness_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle<DailyWellnessLog>();

      if (todayLogError) {
        console.error('❌ 今日日志读取失败:', todayLogError.message);
      } else if (todayLog) {
        todayBioData = todayLog;
      }

      // ---------------------------------------------------------
      // 🆕 读取近 7 天趋势 (daily_wellness_logs)
      // ---------------------------------------------------------
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: recentLogs, error: recentLogsError } = await supabase
        .from('daily_wellness_logs')
        .select('log_date, sleep_duration_minutes, stress_level, exercise_duration_minutes, mood_status')
        .eq('user_id', userId)
        .gte('log_date', weekAgo)
        .order('log_date', { ascending: false })
        .limit(7)
        .returns<DailyWellnessLog[]>();

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

      // ---------------------------------------------------------
      // 🆕 读取当前活跃计划 (user_plans)
      // ---------------------------------------------------------
      const { data: planData } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData) {
        // Parse items from content if it's JSON, otherwise leave as is
        let parsedItems = [];
        let contentStr = '';

        if (typeof planData.content === 'object' && planData.content !== null) {
          // New format: content is JSONB
          contentStr = planData.content.description || '';
          // Ensure items are parsed correctly
          if (Array.isArray(planData.content.items)) {
            parsedItems = planData.content.items;
          }
        } else {
          // Old format: content is string
          contentStr = planData.content as string;
        }

        activePlan = {
          id: planData.id,
          title: planData.title,
          created_at: planData.created_at,
          content: contentStr,
          items: parsedItems
        };
      }

      const dailyLogForInquiry: DailyLog | null = todayBioData
        ? {
          sleep_hours: todayBioData.sleep_duration_minutes != null
            ? todayBioData.sleep_duration_minutes / 60
            : null,
          hrv: null,
          stress_level: todayBioData.stress_level ?? null,
          exercise_duration_minutes: todayBioData.exercise_duration_minutes ?? null,
          created_at: todayBioData.created_at,
        }
        : null;

      // 🆕 处理主动问询生成 (如果触发)
      if (trigger_checkin) {
        const inquiryContext = {
          dailyLogs: dailyLogForInquiry ? [dailyLogForInquiry] : [],
          profile: userProfile,
          activePlan: activePlan,
          currentTime: new Date()
        };
        const activeInquiry = generateActiveInquiry(inquiryContext);
        console.log('🗣️ 生成主动问询:', activeInquiry.question);
        return new Response(JSON.stringify({
          role: 'assistant',
          content: activeInquiry.questionZh, // Return Chinese version
          metadata: {
            type: activeInquiry.type,
            reviewItems: activeInquiry.reviewItems
          }
        }), { status: 200 });
      }

      if (userProfile) {
        // 🆕 获取 Inquiry 上下文
        let inquirySummary: string | null = null;
        try {
          const inquiryContext = await getInquiryContext(userId);
          inquirySummary = generateInquirySummary(inquiryContext, 'zh');
          console.log('📋 Inquiry 上下文已加载:', inquirySummary);
        } catch (error) {
          console.warn('⚠️ 获取 Inquiry 上下文失败:', error);
        }

        userContext = buildUserContext(userProfile, todayBioData, recentBioData, questionnaireData, activePlan, inquirySummary);
      }
    }

    const normalizedMessages = chatMessages as ChatMessage[];
    const lastMessage = normalizedMessages[normalizedMessages.length - 1]?.content ?? '';

    // ---------------------------------------------------------
    // 🆕 AI 记忆系统：检索相关历史记忆
    // ---------------------------------------------------------
    let relevantMemories: Array<{ content_text: string; role: string; created_at: string }> = [];
    let memoryContext = '';

    if (userId !== 'anonymous') {
      try {
        console.log('🧠 开始检索 AI 记忆...');
        // 生成用户消息的向量嵌入
        const messageEmbedding = await generateEmbedding(lastMessage);

        if (messageEmbedding && messageEmbedding.length > 0) {
          // 从 ai_memory 表中检索相关记忆
          relevantMemories = await retrieveMemories(userId, messageEmbedding, 5);
          console.log(`✅ 检索到 ${relevantMemories.length} 条相关记忆`);

          if (relevantMemories.length > 0) {
            memoryContext = buildContextWithMemories(relevantMemories);
            console.log('📝 记忆上下文已构建');
          }
        } else {
          console.log('⚠️ 无法生成消息向量，跳过记忆检索');
        }
      } catch (error) {
        console.error('❌ 检索 AI 记忆失败:', error);
        // 继续执行，即使记忆检索失败也不影响对话
      }
    }

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
    const conversationState = extractStateFromMessages(normalizedMessages);
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

    // ---------------------------------------------------------
    // 生成 AI 回答 (Vercel AI SDK)
    // ---------------------------------------------------------
    const systemPrompt = `You are ${personalityConfig.name}, an Anti-Anxiety Cognitive Prosthetic.

CORE PHILOSOPHY: "Truth is the comfort after discarding imagination."

${personalityPrompt}

${personaPrompt}

${TRANSLATOR_SYSTEM_PROMPT}

${userContext}

${memoryContext}

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

DATA GROUNDING POLICY (最高优先级):
- 只允许引用系统提供的事实：来自 [USER PROFILE] / [AI BASELINE] / [CRITICAL HEALTH CONTEXT] / [TODAY'S BIO-VOLTAGE] / [WEEKLY TREND] / [DAILY QUESTIONNAIRE] / **历史对话上下文**。
- 如果某个数值/事实不在上下文里：明确说明“当前未知/未提供”，并提出 1 个最关键的澄清问题；绝不猜测或编造。
- 论文引用：如果没有给出论文列表，就不要引用；如果给出了，只能引用列表内的论文，绝不虚构额外来源或编号。
- 若用户已有基线微习惯/方案：优先在其范围内做微调；若提出新动作，必须说明与既有方案的关系（补充/替代/更低强度）。

🚨🚨🚨 CRITICAL: TOPIC BOUNDARY (话题边界 - 最高优先级！) 🚨🚨🚨

你是 AntiAnxiety，一个专注于【认知健康】的 AI 助手。你的专业领域仅限于：
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
- Missing data → "我还缺一项关键输入，系统无法做出高置信度判断。我们先补齐这一项。"
- High stress → "你的生物电系统处于高度警觉模式。这是身体保护机制的激活。"

ACTIVE INQUIRY MODE:
- When user shares data, ask specific Bayesian diagnostic questions
- Reference specific data points in your questions
- Suggest possible triggers to help user identify patterns

PLAN GENERATION FORMAT (重要！):
🚨🚨🚨 CRITICAL: PLAN FORMAT (方案格式 - 必须严格遵守！) 🚨🚨🚨

当用户请求制定计划、方案、建议时，你【必须】按以下步骤回复：

【第一步】先用一句话简短回应用户的需求，表达理解。

【第二步】直接输出JSON代码块（系统会自动渲染成可点击的选择卡片UI，用户可以直接在卡片上选择和保存）：

\`\`\`plan-options
{
  "options": [
    {
      "id": "A",
      "title": "方案的标题（简短有力，如：渐进式早睡法）",
      "description": "一句话描述这个方案的核心理念",
      "difficulty": "⭐⭐⭐",
      "duration": "4周",
      "items": [
        { "id": "1", "text": "具体执行步骤1" },
        { "id": "2", "text": "具体执行步骤2" },
        { "id": "3", "text": "具体执行步骤3" },
        { "id": "4", "text": "具体执行步骤4" },
        { "id": "5", "text": "具体执行步骤5" }
      ]
    },
    {
      "id": "B",
      "title": "第二个方案的标题",
      "description": "一句话描述",
      "difficulty": "⭐⭐",
      "duration": "3周",
      "items": [
        { "id": "1", "text": "具体执行步骤1" },
        { "id": "2", "text": "具体执行步骤2" },
        { "id": "3", "text": "具体执行步骤3" },
        { "id": "4", "text": "具体执行步骤4" },
        { "id": "5", "text": "具体执行步骤5" }
      ]
    }
  ]
}
\`\`\`

⚠️ 格式规则：
1. 【必须】使用 plan-options 作为代码块语言标识符
2. 【必须】提供2个方案供选择
3. 【必须】每个方案包含5个以上具体执行项
4. 【禁止】在JSON代码块之外再写一遍方案内容！UI会自动渲染卡片！
5. difficulty 使用星星表示：⭐⭐（简单）、⭐⭐⭐（中等）、⭐⭐⭐⭐（困难）

🔥🔥🔥 难度要求（极其重要！）🔥🔥🔥
- 【默认使用高难度】：方案A 使用 ⭐⭐⭐⭐（困难），方案B 使用 ⭐⭐⭐（中等）
- 【禁止太简单】：每个步骤必须有具体的量化指标，例如：
  ✅ 正确："每天跑步30分钟，心率保持在140-160"
  ❌ 错误："适当运动"、"多喝水"、"早点睡"
- 【执行项要有挑战性】：
  ✅ 正确："睡前1小时关闭所有电子设备，改为阅读纸质书"
  ❌ 错误："减少手机使用"
- 【时长要合理】：2-4周的计划，不要太短
- 用户可以点击"平替"来降低难度，所以初始方案要有挑战性！

【第三步】在JSON之后，可以补充一句鼓励的话或小提示。

EASTER EGG (彩蛋):
在每次对话中，随机选择一个彩蛋加入回复末尾（概率30%）：
- 🎁 "小彩蛋：今天的你比昨天更健康！"
- 💡 "冷知识：人类一生平均花26年睡觉"
- 🌟 "Max打卡：陪你养生第N天（N=对话轮数）"
- 🎲 "今日幸运数字：${Math.floor(Math.random() * 100)}"

INSTRUCTIONS:
- If scientific context is provided, cite papers naturally using [1], [2] format
- Always use the "Comforting Truth" tone
- Keep responses concise and actionable
- IMPORTANT: Always consider user's health profile and current concerns in your response
- IMPORTANT: Follow the variation instructions above to avoid repetitive responses

${FINAL_ANSWER_INSTRUCTION}`;

    // 🆕 使用聊天模式选择模型（快速 vs 思考）
    const chatMode: ChatMode = mode === 'think' ? 'think' : 'fast';
    const modelCandidates = getChatModePriority(chatMode);
    console.log(`🎯 聊天模式: ${chatMode === 'think' ? '🧠 思考 (深度推理)' : '⚡ 快速 (低延迟)'}`);
    console.log(`📋 模型候选: ${modelCandidates.slice(0, 2).join(', ')}`);
    const modelErrors: { model: string; message: string }[] = [];

    // 🆕 非流式响应模式（兼容 Android 客户端）
    if (!stream) {
      let aiResponse = '';
      let modelUsed = modelCandidates[0];

      for (const candidate of modelCandidates) {
        try {
          logModelCall(candidate, 'chat-non-stream');

          const result = await generateText({
            model: aiClient(candidate),
            messages: (chatMessages as ChatMessage[]).map(m => {
              if (m.experimental_attachments && m.experimental_attachments.length > 0) {
                return {
                  role: m.role,
                  content: [
                    { type: 'text', text: m.content },
                    ...m.experimental_attachments.map(att => {
                      let imageContent: string | Uint8Array = att.url || '';
                      if (typeof imageContent === 'string' && imageContent.startsWith('data:')) {
                        try {
                          // Google provider often prefers raw base64 or Buffer.
                          // "OCR system detected download error" implies it tried to download the Data URI as a link.
                          const base64Data = imageContent.split(',')[1];
                          // Send as Uint8Array (Buffer)
                          if (base64Data) {
                            imageContent = Buffer.from(base64Data, 'base64');
                          }
                        } catch (e) {
                          console.error('Failed to parse data URL', e);
                        }
                      }
                      return {
                        type: 'image' as const,
                        image: imageContent,
                        mimeType: att.contentType, // Explicitly pass MIME type
                      };
                    })
                  ]
                };
              }
              return { role: m.role, content: m.content };
            }),
            system: systemPrompt,
          });

          let rawText = result.text;
          let cleanedText = cleanAssistantOutput(rawText);

          if (shouldRetryFinalAnswer(rawText, cleanedText, lastMessage)) {
            const retry = await generateText({
              model: aiClient(candidate),
              messages: (chatMessages as ChatMessage[]).map(m => {
                if (m.experimental_attachments && m.experimental_attachments.length > 0) {
                  console.log('Attachments (retry):', m.experimental_attachments); // Log attachments
                  return {
                    role: m.role,
                    content: [
                      { type: 'text', text: m.content },
                      ...m.experimental_attachments.map(att => {
                        let imageContent: string | Uint8Array = att.url || '';
                        if (typeof imageContent === 'string' && imageContent.startsWith('data:')) {
                          try {
                            const base64Data = imageContent.split(',')[1];
                            if (base64Data) {
                              imageContent = Buffer.from(base64Data, 'base64');
                            }
                          } catch (e) { console.error('Failed to parse data URL', e); }
                        }
                        return {
                          type: 'image' as const,
                          image: imageContent,
                          mimeType: att.contentType,
                        };
                      })
                    ]
                  };
                }
                return { role: m.role, content: m.content };
              }),
              system: `${systemPrompt}\n\n${FINAL_ANSWER_STRICT_INSTRUCTION}`,
            });
            const retryCleaned = cleanAssistantOutput(retry.text);
            if (retryCleaned) {
              rawText = retry.text;
              cleanedText = retryCleaned;
            }
          }

          const needsSubstantiveAnswer = lastMessage.trim().length > 20;
          if (!cleanedText) {
            throw new Error('Empty response after cleanup');
          }
          if (needsSubstantiveAnswer && cleanedText.length < 30) {
            throw new Error('Response too short after cleanup');
          }

          aiResponse = cleanedText;
          modelUsed = candidate;
          break;
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          modelErrors.push({ model: candidate, message: errMsg });
          console.error('AI 模型调用失败，尝试下一个', { model: candidate, error: errMsg });
        }
      }

      if (!aiResponse) {
        return new Response(
          JSON.stringify({ error: 'AI 服务暂不可用，请稍后重试', modelErrors }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 存储 AI 记忆
      if (userId !== 'anonymous') {
        try {
          const userEmbedding = await generateEmbedding(lastMessage);
          await storeMemory(userId, lastMessage, 'user', userEmbedding);

          const aiEmbedding = await generateEmbedding(aiResponse);
          await storeMemory(userId, aiResponse, 'assistant', aiEmbedding, {
            model: modelUsed,
            papers_count: scientificPapers.length,
            consensus_level: scientificConsensus?.level,
          });

          // 🆕 触发统一画像更新
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/user/profile-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => { });
        } catch (error) {
          console.error('❌ 存储 AI 记忆失败:', error);
        }
      }

      // 返回 JSON 响应（兼容旧版 /api/ai/chat 格式）
      return new Response(
        JSON.stringify({
          response: aiResponse,
          papers: scientificPapers.slice(0, 5),
          consensus: scientificConsensus,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 流式响应模式（默认）
    let streamResult: ReturnType<typeof streamText> | null = null;

    for (const candidate of modelCandidates) {
      const modelForRun = candidate;
      try {
        logModelCall(modelForRun, 'chat');

        streamResult = streamText({
          model: aiClient(modelForRun),
          messages: (chatMessages as ChatMessage[]).map(m => {
            if (m.experimental_attachments && m.experimental_attachments.length > 0) {
              console.log('Attachments (stream):', m.experimental_attachments); // Log attachments
              return {
                role: m.role,
                content: [
                  { type: 'text', text: m.content },
                  ...m.experimental_attachments.map(att => {
                    let imageContent: string | Uint8Array = att.url || '';
                    if (typeof imageContent === 'string' && imageContent.startsWith('data:')) {
                      try {
                        const base64Data = imageContent.split(',')[1];
                        if (base64Data) {
                          imageContent = Buffer.from(base64Data, 'base64');
                        }
                      } catch (e) { console.error('Failed to parse data URL', e); }
                    }
                    return {
                      type: 'image' as const,
                      image: imageContent,
                      mimeType: att.contentType,
                    };
                  })
                ]
              };
            }
            return { role: m.role, content: m.content };
          }),
          system: systemPrompt,
          // 🆕 AI 记忆系统：流完成后存储对话到记忆库
          onFinish: async ({ text }) => {
            if (userId !== 'anonymous' && text) {
              try {
                console.log('🧠 开始存储 AI 记忆...');

                // 存储用户消息
                const userEmbedding = await generateEmbedding(lastMessage);
                await storeMemory(userId, lastMessage, 'user', userEmbedding);
                console.log('✅ 用户消息已存储到记忆库');

                // 存储 AI 回复
                const aiEmbedding = await generateEmbedding(text);
                await storeMemory(userId, text, 'assistant', aiEmbedding, {
                  model: modelForRun,
                  papers_count: scientificPapers.length,
                  consensus_level: scientificConsensus?.level,
                });
                console.log('✅ AI 回复已存储到记忆库');

                // 🆕 触发统一画像更新 (对话可能包含健康相关洞察)
                fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/user/profile-sync`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                }).catch(() => console.log('Profile sync triggered after chat'));
              } catch (error) {
                console.error('❌ 存储 AI 记忆失败:', error);
                // 不影响响应，继续执行
              }
            }
          },
        });
        break;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        modelErrors.push({ model: modelForRun, message: errMsg });
        console.error('AI 模型调用失败，尝试下一个', { model: modelForRun, error: errMsg });
      }
    }

    if (!streamResult) {
      return new Response(
        JSON.stringify({
          error: 'AI 服务暂不可用，请稍后重试',
          modelErrors,
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 返回流式响应
    const response = streamResult.toTextStreamResponse();

    // 🔑 暴露自定义 headers 给浏览器（CORS 要求）
    response.headers.set('Access-Control-Expose-Headers',
      'x-antianxiety-papers, x-antianxiety-consensus, x-antianxiety-search-status');

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
      response.headers.set('x-antianxiety-papers', Buffer.from(papersJson, 'utf-8').toString('base64'));
    }

    if (scientificConsensus) {
      // 使用 Base64 编码避免特殊字符问题
      const consensusJson = JSON.stringify({
        score: scientificConsensus.score,
        level: scientificConsensus.level,
        rationale: scientificConsensus.rationale
      });
      response.headers.set('x-antianxiety-consensus', Buffer.from(consensusJson, 'utf-8').toString('base64'));
    }

    // 传递搜索状态（用于前端显示重试按钮）
    response.headers.set('x-antianxiety-search-status', JSON.stringify({
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
