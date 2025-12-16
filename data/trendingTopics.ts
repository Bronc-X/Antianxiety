export type TrendingTopic = {
  id: string;
  source: 'Reddit' | 'X';
  title: string;
  summary: string;
  tags: string[];
  community?: string;
  author?: string;
  url: string;
  baseScore: number;
};

export const trendingTopics: TrendingTopic[] = [
  {
    id: 'reddit-metabolic-flexibility',
    source: 'Reddit',
    community: 'r/BioHackers',
    title: '每天 5000 步 vs. 10000 步：对代谢灵活性的真实影响',
    summary:
      '一位 38 岁的创始人在连续 6 周对比步行强度后，发现 10,000 步与低剂量力量训练组合，能在 HRV 和空腹血糖上呈现最稳定的改善曲线。',
    tags: ['体重管理/减肥', '健身策略', '压力水平与皮质醇', '老化与长寿'],
    url: 'https://www.reddit.com/r/BioHackers/',
    baseScore: 4.6,
  },
  {
    id: 'reddit-cortisol-loop',
    source: 'Reddit',
    community: 'r/StressManagement',
    title: '用 3 分钟「体感扫描」打断皮质醇级联反应',
    summary:
      '神经科学家 Huberman 分享的 3 分钟体感扫描，在 14 天实验中让高压高管的晚间皮质醇下降 18%，同时改善睡眠潜伏期。',
    tags: ['压力水平与皮质醇', '人际关系焦虑', '睡眠与昼夜节律'],
    url: 'https://www.reddit.com/r/StressManagement/',
    baseScore: 4.7,
  },
  {
    id: 'x-bayesian-loop',
    source: 'X',
    author: '@bayes_gym',
    title: 'Bayesian Belief Loop：如何让微习惯成为可持续奖励',
    summary:
      '数据科学家分享他如何把锻炼「信念强度」量化为后验概率，并用 90 天的日志证明信念更新曲线比「打卡天数」更能预测坚持度。',
    tags: ['多巴胺/奖励机制', '健身策略', '营养优化'],
    url: 'https://x.com/bayes_gym/status/1234567890',
    baseScore: 4.8,
  },
  {
    id: 'x-hormone-panel',
    source: 'X',
    author: '@endocrine_lab',
    title: '高压人群的激素面板：皮质醇、睾酮与睡眠深度的互相牵引',
    summary:
      '一份 500+ 样本的临床前数据指出：高工作压力+低睡眠人群，皮质醇-睾酮比值偏高；通过减少晚间蓝光暴露 + 20 分钟晚间散步 4 周后指标回落。',
    tags: ['压力水平与皮质醇', '睡眠与昼夜节律', '荷尔蒙与激素平衡'],
    url: 'https://x.com/endocrine_lab/status/987654321',
    baseScore: 4.5,
  },
  {
    id: 'reddit-social-anxiety',
    source: 'Reddit',
    community: 'r/socialanxiety',
    title: '高功能焦虑者的「会议前 6 分钟」策略',
    summary:
      '产品副总裁分享了他如何在大型发布会前，用「预测 -> 感受 -> 行动」的 6 分钟流程清理社交焦虑，并同步监测心率波动。',
    tags: ['人际关系焦虑', '职场压力', '内啡肽/幸福感'],
    url: 'https://www.reddit.com/r/socialanxiety/',
    baseScore: 4.4,
  },
  {
    id: 'x-parenting-cortisol',
    source: 'X',
    author: '@parentinglab',
    title: '「孩子睡不好 = 你压力更大」？家长皮质醇日曲线的真实数据',
    summary:
      '行为科学家分享 120 个家庭的追踪，指出当孩子睡眠质量稳定后，父母的晨间皮质醇下降 12%，焦虑评分下降 22%。',
    tags: ['子女与亲子关系', '睡眠与昼夜节律', '压力水平与皮质醇'],
    url: 'https://x.com/parentinglab/status/567893214',
    baseScore: 4.3,
  },
  {
    id: 'reddit-circadian-rhythm',
    source: 'Reddit',
    community: 'r/BioHackers',
    title: '蓝光阻断与褪黑素：睡前2小时避免屏幕的真实数据',
    summary:
      '一项针对200名知识工作者的研究发现，睡前2小时使用蓝光阻断眼镜，可使褪黑素分泌提前45分钟，睡眠质量提升23%。',
    tags: ['睡眠与昼夜节律', '老化与长寿', '营养优化'],
    url: 'https://www.reddit.com/r/BioHackers/',
    baseScore: 4.6,
  },
  {
    id: 'x-intermittent-fasting',
    source: 'X',
    author: '@metabolic_lab',
    title: '16:8 间歇性断食对代谢灵活性的影响：90天追踪数据',
    summary:
      '代谢专家分享90天追踪数据，显示16:8断食模式在改善胰岛素敏感性的同时，对高压人群的皮质醇水平影响最小。',
    tags: ['体重管理/减肥', '营养优化', '荷尔蒙与激素平衡'],
    url: 'https://x.com/metabolic_lab/status/1111111111',
    baseScore: 4.5,
  },
  {
    id: 'reddit-hrv-training',
    source: 'Reddit',
    community: 'r/BioHackers',
    title: 'HRV引导训练：如何根据心率变异性调整训练强度',
    summary:
      '运动生理学家分享如何用HRV数据指导训练，避免过度训练导致的皮质醇升高和恢复能力下降。',
    tags: ['健身策略', '压力水平与皮质醇', '老化与长寿'],
    url: 'https://www.reddit.com/r/BioHackers/',
    baseScore: 4.7,
  },
  {
    id: 'x-magnesium-deficiency',
    source: 'X',
    author: '@nutrient_science',
    title: '镁缺乏与焦虑：为什么80%的焦虑人群镁水平偏低',
    summary:
      '营养学家分析300个焦虑案例，发现80%存在镁缺乏，补充镁后焦虑评分平均下降35%，睡眠质量提升28%。',
    tags: ['营养优化', '压力水平与皮质醇', '睡眠与昼夜节律'],
    url: 'https://x.com/nutrient_science/status/2222222222',
    baseScore: 4.4,
  },
  {
    id: 'reddit-cold-exposure',
    source: 'Reddit',
    community: 'r/BioHackers',
    title: '冷暴露疗法：2分钟冷水澡对多巴胺和去甲肾上腺素的影响',
    summary:
      '神经科学家分享冷暴露研究，显示2分钟冷水澡可使多巴胺和去甲肾上腺素水平提升250%，效果持续数小时。',
    tags: ['多巴胺/奖励机制', '健身策略', '内啡肽/幸福感'],
    url: 'https://www.reddit.com/r/BioHackers/',
    baseScore: 4.8,
  },
  {
    id: 'x-sleep-debt',
    source: 'X',
    author: '@sleep_research',
    title: '睡眠债的累积效应：连续3晚睡眠不足对认知功能的影响',
    summary:
      '睡眠研究显示，连续3晚睡眠不足6小时，认知功能下降相当于血液酒精浓度0.08%，反应时间延长30%。',
    tags: ['睡眠与昼夜节律', '职场压力', '老化与长寿'],
    url: 'https://x.com/sleep_research/status/3333333333',
    baseScore: 4.5,
  },
  {
    id: 'reddit-meditation-cortisol',
    source: 'Reddit',
    community: 'r/Meditation',
    title: '正念冥想对皮质醇的影响：10分钟 vs 20分钟的效果差异',
    summary:
      '一项随机对照试验显示，10分钟正念冥想可使皮质醇下降15%，20分钟可下降28%，但超过30分钟效果不再显著提升。',
    tags: ['压力水平与皮质醇', '人际关系焦虑', '内啡肽/幸福感'],
    url: 'https://www.reddit.com/r/Meditation/',
    baseScore: 4.6,
  },
  {
    id: 'x-protein-timing',
    source: 'X',
    author: '@protein_science',
    title: '蛋白质摄入时机：早餐30g蛋白质对肌肉合成和饱腹感的影响',
    summary:
      '运动营养学家分享研究，显示早餐摄入30g蛋白质可使肌肉合成率提升25%，同时减少午餐前饥饿感，稳定血糖水平。',
    tags: ['营养优化', '健身策略', '体重管理/减肥'],
    url: 'https://x.com/protein_science/status/4444444444',
    baseScore: 4.4,
  },
  {
    id: 'reddit-social-support',
    source: 'Reddit',
    community: 'r/socialanxiety',
    title: '社交支持网络对焦虑恢复的影响：6个月追踪数据',
    summary:
      '心理学家分享研究，显示拥有3-5个深度社交关系的人，焦虑恢复速度比孤立人群快40%，皮质醇基线低22%。',
    tags: ['人际关系焦虑', '内啡肽/幸福感', '压力水平与皮质醇'],
    url: 'https://www.reddit.com/r/socialanxiety/',
    baseScore: 4.3,
  },
];


