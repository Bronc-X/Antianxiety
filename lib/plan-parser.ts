// AI方案解析工具

export interface ParsedPlan {
  title: string;
  content: string;
  difficulty?: string;
  duration?: string;
}

/**
 * 检测AI回复中是否包含方案
 */
export function containsPlans(message: string): boolean {
  console.log('🔍 检测AI消息是否包含方案...');
  console.log('📝 消息内容预览:', message.substring(0, 200));
  
  // 排除确认消息
  if (message.includes('✅') || message.includes('已确认') || message.includes('已添加到')) {
    console.log('❌ 该消息为确认消息，跳过');
    return false;
  }
  
  // 检测关键词：方案、建议、计划等（必须有编号）
  const planKeywords = [
    /方案\s*[1-9一二三四五]/i,
    /建议\s*[1-9一二三四五]/i,
  ];
  
  const hasPlans = planKeywords.some(regex => regex.test(message));
  console.log(hasPlans ? '✅ 检测到方案关键词' : '❌ 未检测到方案关键词');
  
  return hasPlans;
}

/**
 * 解析AI回复中的方案
 */
export function parsePlans(message: string): ParsedPlan[] {
  const plans: ParsedPlan[] = [];
  
  // 匹配方案块（支持中文数字和阿拉伯数字）
  const planRegex = /(?:方案|建议|计划)\s*([1-9一二三四五])[\s:：]([^\n]+)((?:\n(?!方案|建议|计划)[^\n]+)*)/gi;
  
  let match;
  while ((match = planRegex.exec(message)) !== null) {
    const title = `方案${match[1]}：${match[2].trim()}`;
    const content = match[3]?.trim() || '';
    
    // 提取难度
    const difficultyMatch = content.match(/难度[：:]\s*([⭐★☆]+|[1-5]星)/);
    const difficulty = difficultyMatch ? difficultyMatch[1] : undefined;
    
    // 提取预期时长
    const durationMatch = content.match(/(?:预期|时长|周期)[：:]\s*([^\n]+)/);
    const duration = durationMatch ? durationMatch[1].trim() : undefined;
    
    plans.push({
      title,
      content,
      difficulty,
      duration,
    });
  }
  
  // 如果没有匹配到标准格式，尝试分段匹配
  if (plans.length === 0) {
    const sections = message.split(/\n\n+/);
    sections.forEach((section, index) => {
      if (section.length > 20 && (section.includes('建议') || section.includes('方案'))) {
        const lines = section.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        plans.push({
          title: title || `方案${index + 1}`,
          content,
        });
      }
    });
  }
  
  console.log('🔍 解析到的方案数量:', plans.length);
  console.log('📊 方案详情:', plans);
  
  return plans;
}

/**
 * 格式化方案为存储格式
 */
export function formatPlanForStorage(plan: ParsedPlan) {
  return {
    title: plan.title,
    content: plan.content,
    difficulty: plan.difficulty ? parseDifficulty(plan.difficulty) : undefined,
    expected_duration_days: plan.duration ? parseDuration(plan.duration) : undefined,
  };
}

/**
 * 解析难度星级为数字
 */
function parseDifficulty(difficultyStr: string): number {
  const starCount = (difficultyStr.match(/[⭐★]/g) || []).length;
  if (starCount > 0) return starCount;
  
  const numberMatch = difficultyStr.match(/([1-5])/);
  return numberMatch ? parseInt(numberMatch[1]) : 3;
}

/**
 * 解析时长为天数
 */
function parseDuration(durationStr: string): number {
  const weekMatch = durationStr.match(/(\d+)\s*周/);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;
  
  const dayMatch = durationStr.match(/(\d+)\s*天/);
  if (dayMatch) return parseInt(dayMatch[1]);
  
  const monthMatch = durationStr.match(/(\d+)\s*月/);
  if (monthMatch) return parseInt(monthMatch[1]) * 30;
  
  return 7; // 默认7天
}
