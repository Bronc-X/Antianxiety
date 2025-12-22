// AI方案解析工具

export interface PlanItem {
  id?: string;
  text: string;
  status?: 'pending' | 'completed' | 'skipped';
}

export interface ParsedPlan {
  title: string;
  content: string;
  difficulty?: string;
  duration?: string;
  items?: PlanItem[];
}

/**
 * 检测AI回复中是否包含方案
 */
export function containsPlans(message: string): boolean {
  console.log('🔍 检测AI消息是否包含方案...');
  console.log('📝 消息内容预览:', message.substring(0, 300));

  // 排除确认消息
  if (message.includes('✅ **保存成功') || message.includes('已确认') || message.includes('已添加到您的健康方案')) {
    console.log('❌ 该消息为确认消息，跳过');
    return false;
  }

  // 检测关键词：方案、建议、计划等（必须有编号）
  const planKeywords = [
    /方案\s*[1-9一二三四五][\s:：]/i,
    /建议\s*[1-9一二三四五][\s:：]/i,
    /计划\s*[1-9一二三四五][\s:：]/i,
    /选项\s*[1-9一二三四五][\s:：]/i,
    /\*\*方案\s*[1-9一二三四五]/i,
    /\*\*建议\s*[1-9一二三四五]/i,
  ];

  const hasPlans = planKeywords.some(regex => regex.test(message));
  console.log(hasPlans ? '✅ 检测到方案关键词' : '❌ 未检测到方案关键词');

  // 额外检查：是否有多个编号的内容块
  const numberedBlocks = message.match(/(?:方案|建议|计划|选项)\s*[1-9一二三四五]/gi);
  if (numberedBlocks && numberedBlocks.length >= 2) {
    console.log(`✅ 检测到 ${numberedBlocks.length} 个编号方案块`);
    return true;
  }

  return hasPlans;
}

/**
 * 解析AI回复中的方案
 */
export function parsePlans(message: string): ParsedPlan[] {
  const plans: ParsedPlan[] = [];

  // 方法1：匹配标准格式 "方案1：标题" 或 "**方案1：标题**"
  const planRegex = /\*{0,2}(?:方案|建议|计划|选项)\s*([1-9一二三四五])[\s:：]+\*{0,2}([^\n*]+)\*{0,2}((?:\n(?!\*{0,2}(?:方案|建议|计划|选项)\s*[1-9一二三四五])[^\n]*)*)/gi;

  let match;
  while ((match = planRegex.exec(message)) !== null) {
    const num = match[1];
    const titleText = match[2].trim().replace(/\*+/g, '');
    const title = `方案${num}：${titleText}`;
    let content = match[3]?.trim() || '';

    // 清理内容中的 markdown 格式
    content = content.replace(/^\s*[-•]\s*/gm, '• ');

    // 提取难度
    const difficultyMatch = content.match(/难度[：:]\s*([⭐★☆]+|[1-5]星?)/);
    const difficulty = difficultyMatch ? difficultyMatch[1] : undefined;

    // 提取预期时长
    const durationMatch = content.match(/(?:预期|时长|周期)[：:]\s*([^\n]+)/);
    const duration = durationMatch ? durationMatch[1].trim() : undefined;

    // 提取条目 (bullet points or numbered lists within the content)
    const items: PlanItem[] = [];
    // Match line starting with "1." or "-" or "•" followed by text
    // Exclude "Action:", "Science:" lines if possible, or include them as part of the item text
    const itemRegex = /(?:^|\n)\s*(?:[1-9]\.|[-•])\s+([^\n]+)/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      let itemText = itemMatch[1].trim();
      // 如果item text太短或者是元数据，跳过
      if (itemText.startsWith('难度') || itemText.startsWith('时长') || itemText.length < 2) continue;
      items.push({ text: itemText, status: 'pending' });
    }

    // 从内容中移除难度和预期行，保持内容干净
    content = content
      .replace(/难度[：:]\s*[⭐★☆1-5星]+\n?/g, '')
      .replace(/(?:预期|时长|周期)[：:]\s*[^\n]+\n?/g, '')
      .trim();

    plans.push({
      title,
      content,
      difficulty,
      duration,
      items
    });
  }

  // 方法2：如果没有匹配到，尝试更宽松的匹配
  if (plans.length === 0) {
    // 尝试匹配 "1. 方案名称" 或 "1、方案名称" 格式
    const altRegex = /([1-9])[.、]\s*\*{0,2}([^:\n]+)[:\s]*\*{0,2}\n((?:(?![1-9][.、])[^\n]*\n?)*)/gi;

    while ((match = altRegex.exec(message)) !== null) {
      const num = match[1];
      const titleText = match[2].trim().replace(/\*+/g, '');
      const content = match[3]?.trim() || '';

      const items: PlanItem[] = [];
      const itemRegex = /(?:^|\n)\s*(?:-|•)\s+([^\n]+)/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(content)) !== null) {
        let itemText = itemMatch[1].trim();
        items.push({ text: itemText, status: 'pending' });
      }

      // 只有当标题看起来像方案时才添加
      if (titleText.length > 2 && titleText.length < 50) {
        plans.push({
          title: `方案${num}：${titleText}`,
          content,
          items
        });
      }
    }
  }

  // 方法3：如果还是没有，尝试分段匹配
  if (plans.length === 0) {
    const sections = message.split(/\n\n+/);
    let planIndex = 0;

    sections.forEach((section) => {
      if (section.length > 30 &&
        (section.includes('建议') || section.includes('方案') || section.includes('计划')) &&
        !section.includes('✅')) {
        const lines = section.split('\n');
        const title = lines[0].trim().replace(/\*+/g, '');
        const content = lines.slice(1).join('\n').trim();

        const items: PlanItem[] = [];
        const itemRegex = /(?:^|\n)\s*(?:[1-9]\.|-|•)\s+([^\n]+)/g;
        let itemMatch;
        while ((itemMatch = itemRegex.exec(content)) !== null) {
          let itemText = itemMatch[1].trim();
          items.push({ text: itemText, status: 'pending' });
        }

        if (title && content) {
          planIndex++;
          plans.push({
            title: title.includes('方案') || title.includes('建议') ? title : `方案${planIndex}：${title}`,
            content,
            items
          });
        }
      }
    });
  }

  console.log('🔍 解析到的方案数量:', plans.length);
  if (plans.length > 0) {
    console.log('📊 方案详情:', plans.map(p => ({ title: p.title, items: p.items?.length || 0 })));
  }

  return plans;
}

/**
 * 格式化方案为存储格式
 */
export function formatPlanForStorage(plan: ParsedPlan) {
  return {
    title: plan.title,
    content: plan.content,
    items: plan.items || [], // Save items
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
