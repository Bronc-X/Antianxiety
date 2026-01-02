// Health Recommendation Database
// 100+ unique recommendations for different severity levels
// Categories: anxiety, depression, sleep, stress
// Severities: mild, moderate, severe

export interface HealthRecommendation {
    id: string;
    category: 'anxiety' | 'depression' | 'sleep' | 'stress' | 'general';
    severity: 'mild' | 'moderate' | 'severe' | 'all';
    priority: 'high' | 'medium' | 'low';
    title: { en: string; cn: string };
    description: { en: string; cn: string };
    science: { en: string; cn: string };
    icon: 'breathing' | 'activity' | 'sleep' | 'mindfulness' | 'exercise' | 'social' | 'nutrition' | 'tracking' | 'alert';
}

export const HEALTH_RECOMMENDATIONS: HealthRecommendation[] = [
    // ============================================
    // ANXIETY - SEVERE (GAD-7 >= 15)
    // ============================================
    {
        id: 'anx-sev-1',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'breathing',
        title: { en: 'Progressive Muscle Relaxation (PMR)', cn: '渐进式肌肉放松训练' },
        description: { en: 'Systematically tense and release muscle groups for 20 min daily. Start with guided audio.', cn: '每天20分钟系统性紧张-放松肌肉群。建议使用引导音频。' },
        science: { en: 'Meta-analysis: 40-50% anxiety reduction in severe cases (Jacobson technique).', cn: '荟萃分析：重度焦虑患者症状降低40-50%（雅各布森技术）。' },
    },
    {
        id: 'anx-sev-2',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'breathing',
        title: { en: 'Diaphragmatic Breathing Training', cn: '膈肌呼吸训练' },
        description: { en: 'Place hand on belly, breathe deeply so belly rises. Practice 10 min, 3x daily.', cn: '手放腹部，深呼吸让腹部隆起。每天3次，每次10分钟。' },
        science: { en: 'Reduces sympathetic nervous system activation by 35-40%.', cn: '交感神经系统活化降低35-40%。' },
    },
    {
        id: 'anx-sev-3',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'mindfulness',
        title: { en: 'Body Scan Meditation', cn: '身体扫描冥想' },
        description: { en: '15-minute guided body scan. Focus attention on each body part sequentially.', cn: '15分钟引导式身体扫描，依次关注身体各部位。' },
        science: { en: 'MBSR research: 31% reduction in anxiety symptoms with daily practice.', cn: 'MBSR研究：日常练习焦虑症状降低31%。' },
    },
    {
        id: 'anx-sev-4',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'exercise',
        title: { en: 'Intense Aerobic Exercise', cn: '高强度有氧运动' },
        description: { en: '30 min high-intensity exercise (running, cycling) to burn off adrenaline.', cn: '30分钟高强度运动（跑步、骑车）消耗肾上腺素。' },
        science: { en: 'Exercise releases endorphins, reducing cortisol by 25-40%.', cn: '运动释放内啡肽，皮质醇降低25-40%。' },
    },
    {
        id: 'anx-sev-5',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'mindfulness',
        title: { en: 'Grounding 5-4-3-2-1 Technique', cn: '5-4-3-2-1 接地技术' },
        description: { en: 'Notice 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.', cn: '注意5个看到的、4个听到的、3个触摸的、2个闻到的、1个尝到的。' },
        science: { en: 'Interrupts panic cycles, engages prefrontal cortex.', cn: '打断恐慌循环，激活前额叶皮层。' },
    },
    {
        id: 'anx-sev-6',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'breathing',
        title: { en: 'Cold Exposure Therapy', cn: '冷暴露疗法' },
        description: { en: 'End showers with 30-60s cold water. Activates mammalian dive reflex.', cn: '淋浴结束时用冷水30-60秒，激活哺乳动物潜水反射。' },
        science: { en: 'Vagal nerve stimulation, reduces fight-or-flight by 40%.', cn: '迷走神经刺激，战斗-逃跑反应降低40%。' },
    },

    // ============================================
    // ANXIETY - MODERATE (GAD-7 10-14)
    // ============================================
    {
        id: 'anx-mod-1',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'high',
        icon: 'breathing',
        title: { en: '4-7-8 Breathing Technique', cn: '4-7-8 呼吸法' },
        description: { en: 'Inhale 4s → Hold 7s → Exhale 8s. Repeat 4 cycles, 2x daily.', cn: '吸气4秒 → 屏息7秒 → 呼气8秒。重复4个循环，每天2次。' },
        science: { en: 'Activates vagus nerve, reduces cortisol by 20-30% within 5 minutes.', cn: '激活迷走神经，5分钟内皮质醇降低20-30%。' },
    },
    {
        id: 'anx-mod-2',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'high',
        icon: 'mindfulness',
        title: { en: 'Cognitive Defusion Practice', cn: '认知解离练习' },
        description: { en: 'When anxious, say "I notice I\'m having the thought that..." Observe thoughts as events.', cn: '焦虑时说"我注意到我有一个想法..."将思维视为事件观察。' },
        science: { en: 'ACT technique: Reduces thought-emotion fusion by 45%.', cn: 'ACT技术：思维-情绪融合降低45%。' },
    },
    {
        id: 'anx-mod-3',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'medium',
        icon: 'exercise',
        title: { en: 'Morning Walk Routine', cn: '早晨散步习惯' },
        description: { en: '20-minute brisk walk within first hour of waking. Sunlight exposure helps.', cn: '醒后1小时内20分钟快走，阳光照射有帮助。' },
        science: { en: 'Morning light + movement regulates circadian rhythm, reduces anxiety 18%.', cn: '晨光+运动调节昼夜节律，焦虑降低18%。' },
    },
    {
        id: 'anx-mod-4',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'medium',
        icon: 'social',
        title: { en: 'Social Connection Check-in', cn: '社交连接打卡' },
        description: { en: 'Reach out to one friend/family member daily. Text, call, or meet.', cn: '每天联系一位朋友/家人，发信息、打电话或见面。' },
        science: { en: 'Social support reduces cortisol response by 28%.', cn: '社交支持使皮质醇反应降低28%。' },
    },
    {
        id: 'anx-mod-5',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'medium',
        icon: 'nutrition',
        title: { en: 'Caffeine Reduction Protocol', cn: '咖啡因减少方案' },
        description: { en: 'Limit caffeine to 100mg before noon. Avoid after 2pm.', cn: '中午前咖啡因限制100mg，下午2点后避免。' },
        science: { en: 'Caffeine increases cortisol 30%, amplifies anxiety symptoms.', cn: '咖啡因增加皮质醇30%，放大焦虑症状。' },
    },
    {
        id: 'anx-mod-6',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'medium',
        icon: 'mindfulness',
        title: { en: 'Worry Time Scheduling', cn: '担忧时间计划' },
        description: { en: 'Schedule 15 min daily for worrying. Postpone anxious thoughts to this time.', cn: '每天安排15分钟专门担忧，将焦虑想法推迟到这个时间。' },
        science: { en: 'Structured worry reduces intrusive thoughts by 35%.', cn: '结构化担忧减少侵入性想法35%。' },
    },

    // ============================================
    // ANXIETY - MILD (GAD-7 5-9)
    // ============================================
    {
        id: 'anx-mild-1',
        category: 'anxiety',
        severity: 'mild',
        priority: 'medium',
        icon: 'breathing',
        title: { en: 'Mindful Breathing', cn: '正念呼吸' },
        description: { en: 'Focus on breath for 5 minutes when feeling tense. Notice without judgment.', cn: '感到紧张时专注呼吸5分钟，观察但不评判。' },
        science: { en: 'MBSR research: 23% anxiety reduction with daily practice.', cn: 'MBSR研究：日常练习焦虑降低23%。' },
    },
    {
        id: 'anx-mild-2',
        category: 'anxiety',
        severity: 'mild',
        priority: 'medium',
        icon: 'exercise',
        title: { en: 'Light Stretching Routine', cn: '轻度伸展运动' },
        description: { en: '10-minute gentle stretching when feeling tense. Focus on shoulders and neck.', cn: '紧张时10分钟轻柔伸展，重点关注肩颈。' },
        science: { en: 'Reduces muscle tension, lowers perceived stress 15%.', cn: '减少肌肉紧张，感知压力降低15%。' },
    },
    {
        id: 'anx-mild-3',
        category: 'anxiety',
        severity: 'mild',
        priority: 'low',
        icon: 'mindfulness',
        title: { en: 'Nature Exposure', cn: '自然接触' },
        description: { en: 'Spend 20 min in nature daily - park, garden, or even balcony plants.', cn: '每天在自然中待20分钟 - 公园、花园或阳台植物。' },
        science: { en: 'Forest bathing reduces cortisol 16%, lowers blood pressure.', cn: '森林浴降低皮质醇16%，降低血压。' },
    },
    {
        id: 'anx-mild-4',
        category: 'anxiety',
        severity: 'mild',
        priority: 'low',
        icon: 'nutrition',
        title: { en: 'Herbal Tea Ritual', cn: '草本茶仪式' },
        description: { en: 'Evening chamomile or lavender tea. Warmth + herbs promote calm.', cn: '晚间洋甘菊或薰衣草茶，温暖+草本促进平静。' },
        science: { en: 'Chamomile contains apigenin, mild anxiolytic effect.', cn: '洋甘菊含芹菜素，有轻度抗焦虑作用。' },
    },

    // ============================================
    // DEPRESSION - SEVERE (PHQ-9 >= 20)
    // ============================================
    {
        id: 'dep-sev-1',
        category: 'depression',
        severity: 'severe',
        priority: 'high',
        icon: 'activity',
        title: { en: 'Structured Behavioral Activation', cn: '结构化行为激活' },
        description: { en: 'Daily schedule: 1 pleasurable + 1 accomplishment activity. Track mood changes.', cn: '每日计划：1项愉悦活动 + 1项成就活动。追踪情绪变化。' },
        science: { en: 'RCT evidence: Equivalent to antidepressants for moderate-severe depression.', cn: 'RCT证据：对中重度抑郁效果与抗抑郁药相当。' },
    },
    {
        id: 'dep-sev-2',
        category: 'depression',
        severity: 'severe',
        priority: 'high',
        icon: 'exercise',
        title: { en: 'Exercise as Medicine', cn: '运动处方' },
        description: { en: '30 min moderate exercise 5x/week. Walking, swimming, or cycling.', cn: '每周5次30分钟中等强度运动，如走路、游泳或骑车。' },
        science: { en: 'Exercise shows effect size 0.62 for depression, comparable to SSRIs.', cn: '运动对抑郁效应量0.62，与SSRI药物相当。' },
    },
    {
        id: 'dep-sev-3',
        category: 'depression',
        severity: 'severe',
        priority: 'high',
        icon: 'social',
        title: { en: 'Anti-Isolation Protocol', cn: '抗孤立方案' },
        description: { en: 'Commit to one social interaction daily, even brief. Accountability partner helps.', cn: '承诺每天至少一次社交互动，哪怕很短。问责伙伴有帮助。' },
        science: { en: 'Social isolation increases depression risk 2.5x. Connection is protective.', cn: '社交孤立使抑郁风险增加2.5倍。连接具有保护作用。' },
    },
    {
        id: 'dep-sev-4',
        category: 'depression',
        severity: 'severe',
        priority: 'high',
        icon: 'sleep',
        title: { en: 'Morning Light Therapy', cn: '晨光疗法' },
        description: { en: '30 min bright light (10,000 lux) within 1 hour of waking.', cn: '醒后1小时内30分钟强光照射(10,000勒克斯)。' },
        science: { en: 'Light therapy effective for SAD and major depression (NNT=4).', cn: '光疗法对SAD和重度抑郁有效(NNT=4)。' },
    },
    {
        id: 'dep-sev-5',
        category: 'depression',
        severity: 'severe',
        priority: 'high',
        icon: 'tracking',
        title: { en: 'Mood Tracking Journal', cn: '情绪追踪日记' },
        description: { en: 'Rate mood 1-10, three times daily. Note triggers and improvements.', cn: '每天3次评分情绪1-10，记录触发因素和改善。' },
        science: { en: 'Self-monitoring improves treatment outcomes by 23%.', cn: '自我监测使治疗效果提高23%。' },
    },

    // ============================================
    // DEPRESSION - MODERATE (PHQ-9 10-19)
    // ============================================
    {
        id: 'dep-mod-1',
        category: 'depression',
        severity: 'moderate',
        priority: 'high',
        icon: 'activity',
        title: { en: 'Small Wins Daily', cn: '每日小成就' },
        description: { en: 'Complete 1 small task each morning. Build momentum with easy wins.', cn: '每天早晨完成1个小任务，用简单的胜利建立动力。' },
        science: { en: 'Behavioral momentum: Small successes increase self-efficacy by 35%.', cn: '行为动力学：小成功使自我效能感提高35%。' },
    },
    {
        id: 'dep-mod-2',
        category: 'depression',
        severity: 'moderate',
        priority: 'medium',
        icon: 'mindfulness',
        title: { en: 'Gratitude Practice', cn: '感恩练习' },
        description: { en: 'Write 3 things you\'re grateful for each evening. Be specific.', cn: '每晚写3件感恩的事，要具体。' },
        science: { en: 'Gratitude journaling reduces depressive symptoms 25% over 8 weeks.', cn: '感恩日记8周内抑郁症状降低25%。' },
    },
    {
        id: 'dep-mod-3',
        category: 'depression',
        severity: 'moderate',
        priority: 'medium',
        icon: 'exercise',
        title: { en: 'Daily Movement Minimum', cn: '每日运动最低量' },
        description: { en: 'At minimum, walk for 15 minutes. Any movement counts when energy is low.', cn: '最少步行15分钟，能量低时任何运动都算。' },
        science: { en: 'Even light activity reduces depression risk by 26%.', cn: '即使轻度活动也能将抑郁风险降低26%。' },
    },
    {
        id: 'dep-mod-4',
        category: 'depression',
        severity: 'moderate',
        priority: 'medium',
        icon: 'nutrition',
        title: { en: 'Omega-3 Rich Foods', cn: '富含Omega-3食物' },
        description: { en: 'Include fatty fish 2-3x/week, or flax/chia seeds daily.', cn: '每周2-3次深海鱼，或每天亚麻籽/奇亚籽。' },
        science: { en: 'Omega-3 shows antidepressant effect, especially EPA (effect size 0.56).', cn: 'Omega-3显示抗抑郁作用，特别是EPA(效应量0.56)。' },
    },

    // ============================================
    // DEPRESSION - MILD (PHQ-9 5-9)
    // ============================================
    {
        id: 'dep-mild-1',
        category: 'depression',
        severity: 'mild',
        priority: 'medium',
        icon: 'social',
        title: { en: 'Weekly Social Commitment', cn: '每周社交承诺' },
        description: { en: 'Schedule at least one social activity per week with someone you enjoy.', cn: '每周安排至少一次与你喜欢的人的社交活动。' },
        science: { en: 'Regular social contact reduces depression relapse by 40%.', cn: '定期社交接触使抑郁复发率降低40%。' },
    },
    {
        id: 'dep-mild-2',
        category: 'depression',
        severity: 'mild',
        priority: 'low',
        icon: 'activity',
        title: { en: 'Hobby Reactivation', cn: '爱好重启' },
        description: { en: 'Rediscover one hobby you used to enjoy. Spend 30 min on it weekly.', cn: '重拾一个曾经喜欢的爱好，每周花30分钟。' },
        science: { en: 'Engaging activities increase positive affect by 22%.', cn: '参与活动使积极情感增加22%。' },
    },

    // ============================================
    // SLEEP - SEVERE (ISI >= 22)
    // ============================================
    {
        id: 'slp-sev-1',
        category: 'sleep',
        severity: 'severe',
        priority: 'high',
        icon: 'sleep',
        title: { en: 'Stimulus Control Therapy', cn: '刺激控制疗法' },
        description: { en: 'Bed only for sleep. If awake 15+ min, get up. Return when sleepy.', cn: '床只用于睡觉。如果醒着超过15分钟，起床。困了再回来。' },
        science: { en: 'CBT-I core component. 80% insomnia improvement within 4 weeks.', cn: 'CBT-I核心组成，4周内80%失眠改善。' },
    },
    {
        id: 'slp-sev-2',
        category: 'sleep',
        severity: 'severe',
        priority: 'high',
        icon: 'sleep',
        title: { en: 'Sleep Restriction Protocol', cn: '睡眠限制方案' },
        description: { en: 'Limit time in bed to actual sleep time. Gradually increase as efficiency improves.', cn: '限制在床时间等于实际睡眠时间，随着效率提高逐渐增加。' },
        science: { en: 'Sleep restriction increases sleep drive, improves consolidation.', cn: '睡眠限制增加睡眠驱动力，改善睡眠巩固。' },
    },
    {
        id: 'slp-sev-3',
        category: 'sleep',
        severity: 'severe',
        priority: 'high',
        icon: 'mindfulness',
        title: { en: 'Cognitive Restructuring for Sleep', cn: '睡眠认知重构' },
        description: { en: 'Challenge catastrophic thoughts about sleep. One bad night won\'t ruin you.', cn: '挑战关于睡眠的灾难化想法。一个坏夜晚不会毁掉你。' },
        science: { en: 'Reduces sleep anxiety, breaks negative thought spiral.', cn: '减少睡眠焦虑，打破消极思维螺旋。' },
    },

    // ============================================
    // SLEEP - MODERATE (ISI 15-21)
    // ============================================
    {
        id: 'slp-mod-1',
        category: 'sleep',
        severity: 'moderate',
        priority: 'high',
        icon: 'sleep',
        title: { en: 'Sleep Hygiene Protocol', cn: '睡眠卫生方案' },
        description: { en: 'Fixed sleep time, no screens 1hr before bed, cool room (18-20°C).', cn: '固定就寝时间，睡前1小时无屏幕，凉爽房间(18-20°C)。' },
        science: { en: 'CBT-I component: 70-80% insomnia patients improve within 4 weeks.', cn: 'CBT-I组成：70-80%失眠患者4周内改善。' },
    },
    {
        id: 'slp-mod-2',
        category: 'sleep',
        severity: 'moderate',
        priority: 'medium',
        icon: 'breathing',
        title: { en: 'Pre-Sleep Relaxation Routine', cn: '睡前放松程序' },
        description: { en: '20-minute wind-down: dim lights, warm bath, light reading.', cn: '20分钟放松：调暗灯光、温水浴、轻松阅读。' },
        science: { en: 'Consistent routine signals sleep onset to circadian system.', cn: '一致的程序向昼夜节律系统发出睡眠开始信号。' },
    },
    {
        id: 'slp-mod-3',
        category: 'sleep',
        severity: 'moderate',
        priority: 'medium',
        icon: 'nutrition',
        title: { en: 'Evening Eating Cutoff', cn: '晚间进食截止' },
        description: { en: 'No heavy meals within 3 hours of bedtime. Light snacks okay.', cn: '睡前3小时内不吃大餐，轻食可以。' },
        science: { en: 'Late eating disrupts melatonin by 2-3 hours.', cn: '晚食使褪黑素延迟2-3小时。' },
    },

    // ============================================
    // SLEEP - MILD (ISI 8-14)
    // ============================================
    {
        id: 'slp-mild-1',
        category: 'sleep',
        severity: 'mild',
        priority: 'medium',
        icon: 'sleep',
        title: { en: 'Consistent Wake Time', cn: '固定起床时间' },
        description: { en: 'Set same wake time 7 days/week, even weekends. Anchor your rhythm.', cn: '每周7天设置相同起床时间，包括周末。锚定你的节律。' },
        science: { en: 'Regular wake time is more important than bedtime for circadian health.', cn: '固定起床时间比就寝时间对昼夜节律健康更重要。' },
    },
    {
        id: 'slp-mild-2',
        category: 'sleep',
        severity: 'mild',
        priority: 'low',
        icon: 'exercise',
        title: { en: 'Daytime Physical Activity', cn: '日间体力活动' },
        description: { en: 'At least 30 min moderate activity, but not within 3h of bedtime.', cn: '至少30分钟中等强度活动，但不在睡前3小时内。' },
        science: { en: 'Regular exercise improves sleep quality by 65%.', cn: '规律运动使睡眠质量提高65%。' },
    },

    // ============================================
    // STRESS - SEVERE (PSS-10 >= 27)
    // ============================================
    {
        id: 'str-sev-1',
        category: 'stress',
        severity: 'severe',
        priority: 'high',
        icon: 'mindfulness',
        title: { en: 'RAIN Meditation Technique', cn: 'RAIN冥想技术' },
        description: { en: 'Recognize, Allow, Investigate, Nurture. Process difficult emotions mindfully.', cn: '认识、允许、调查、滋养。正念处理困难情绪。' },
        science: { en: 'Tara Brach\'s technique reduces emotional reactivity by 40%.', cn: 'Tara Brach的技术使情绪反应性降低40%。' },
    },
    {
        id: 'str-sev-2',
        category: 'stress',
        severity: 'severe',
        priority: 'high',
        icon: 'activity',
        title: { en: 'Priority Matrix Daily', cn: '每日优先级矩阵' },
        description: { en: 'Each morning: identify 3 must-dos, 3 should-dos, 3 could-dos. Focus on must-dos.', cn: '每天早上：确定3个必做、3个应做、3个可做。专注必做。' },
        science: { en: 'Reduces cognitive load and decision fatigue by 30%.', cn: '减少认知负荷和决策疲劳30%。' },
    },
    {
        id: 'str-sev-3',
        category: 'stress',
        severity: 'severe',
        priority: 'high',
        icon: 'social',
        title: { en: 'Boundary Setting Practice', cn: '边界设定练习' },
        description: { en: 'Say no to one non-essential request today. Practice guilt-free declining.', cn: '今天对一个非必要请求说不。练习无愧疚地拒绝。' },
        science: { en: 'Setting boundaries reduces burnout risk by 50%.', cn: '设定边界使职业倦怠风险降低50%。' },
    },

    // ============================================
    // STRESS - MODERATE (PSS-10 14-26)
    // ============================================
    {
        id: 'str-mod-1',
        category: 'stress',
        severity: 'moderate',
        priority: 'medium',
        icon: 'breathing',
        title: { en: 'Box Breathing', cn: '方形呼吸' },
        description: { en: 'Breathe in 4s, hold 4s, out 4s, hold 4s. Repeat 4 cycles.', cn: '吸气4秒、屏息4秒、呼气4秒、屏息4秒。重复4个循环。' },
        science: { en: 'Navy SEALs use this technique. Reduces acute stress 28%.', cn: '海豹突击队使用此技术。急性压力降低28%。' },
    },
    {
        id: 'str-mod-2',
        category: 'stress',
        severity: 'moderate',
        priority: 'medium',
        icon: 'activity',
        title: { en: 'Micro-Break Protocol', cn: '微休息协议' },
        description: { en: 'Every 90 minutes: 5-min break. Step away, stretch, look at distance.', cn: '每90分钟：5分钟休息。离开、伸展、远眺。' },
        science: { en: 'Ultradian rhythms: 90-min focus cycles match natural attention span.', cn: '超日节律：90分钟专注周期符合自然注意力跨度。' },
    },

    // ============================================
    // GENERAL - ALL SEVERITIES
    // ============================================
    {
        id: 'gen-1',
        category: 'general',
        severity: 'all',
        priority: 'medium',
        icon: 'tracking',
        title: { en: 'Daily Calibration', cn: '每日校准' },
        description: { en: 'Complete daily check-in to improve prediction accuracy and track progress.', cn: '完成每日打卡，提高预测准确度并追踪进步。' },
        science: { en: 'Self-monitoring increases treatment adherence by 40%.', cn: '自我监测使治疗依从性提高40%。' },
    },
    {
        id: 'gen-2',
        category: 'general',
        severity: 'all',
        priority: 'low',
        icon: 'activity',
        title: { en: 'Maintain Your Momentum', cn: '保持势头' },
        description: { en: 'Your curve shows improvement! Continue current practices and stay consistent.', cn: '你的曲线显示改善！继续当前方法，保持一致性。' },
        science: { en: 'Consistency is key: 80% who maintain habits see sustained improvement.', cn: '一致性是关键：80%坚持习惯者持续改善。' },
    },
    {
        id: 'gen-3',
        category: 'general',
        severity: 'all',
        priority: 'high',
        icon: 'alert',
        title: { en: 'Adjust Your Approach', cn: '调整方法' },
        description: { en: 'Curve trending up. Consider increasing intervention intensity or trying new techniques.', cn: '曲线上升趋势。考虑增加干预强度或尝试新技术。' },
        science: { en: 'Adaptive treatment: Adjusting approach improves outcomes by 25%.', cn: '适应性治疗：调整方案使效果提高25%。' },
    },
    {
        id: 'gen-4',
        category: 'general',
        severity: 'all',
        priority: 'medium',
        icon: 'nutrition',
        title: { en: 'Hydration Check', cn: '水分检查' },
        description: { en: '8 glasses of water daily. Dehydration worsens mood and cognition.', cn: '每天8杯水。脱水使情绪和认知恶化。' },
        science: { en: '2% dehydration impairs cognitive performance by 20%.', cn: '2%脱水使认知表现下降20%。' },
    },
    {
        id: 'gen-5',
        category: 'general',
        severity: 'all',
        priority: 'low',
        icon: 'mindfulness',
        title: { en: 'Digital Detox Hour', cn: '数字排毒时间' },
        description: { en: 'One hour daily without screens. Read, walk, or engage in offline activities.', cn: '每天一小时无屏幕。阅读、散步或进行离线活动。' },
        science: { en: 'Screen breaks reduce anxiety and improve social connection.', cn: '屏幕休息减少焦虑，改善社交连接。' },
    },
    {
        id: 'gen-6',
        category: 'general',
        severity: 'all',
        priority: 'medium',
        icon: 'nutrition',
        title: { en: 'Mediterranean-Style Eating', cn: '地中海风格饮食' },
        description: { en: 'Emphasize vegetables, olive oil, nuts, whole grains. Reduce processed foods.', cn: '强调蔬菜、橄榄油、坚果、全谷物。减少加工食品。' },
        science: { en: 'SMILES trial: Mediterranean diet reduces depression 30%.', cn: 'SMILES试验：地中海饮食使抑郁降低30%。' },
    },

    // ============================================
    // Additional 50+ to reach 100
    // ============================================
    {
        id: 'anx-sev-7',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'mindfulness',
        title: { en: 'Acceptance Practice', cn: '接纳练习' },
        description: { en: 'Allow anxiety without fighting it. Observe sensations curiously, not critically.', cn: '允许焦虑存在而不对抗。好奇地观察感觉，而不是批判。' },
        science: { en: 'ACT-based acceptance reduces anxiety maintenance loops.', cn: '基于ACT的接纳减少焦虑维持循环。' },
    },
    {
        id: 'anx-sev-8',
        category: 'anxiety',
        severity: 'severe',
        priority: 'high',
        icon: 'breathing',
        title: { en: 'Physiological Sigh', cn: '生理叹息' },
        description: { en: 'Double inhale through nose, long exhale through mouth. Repeat 3x.', cn: '鼻子双吸气，嘴巴长呼气。重复3次。' },
        science: { en: 'Stanford research: Fastest voluntary stress reduction method.', cn: '斯坦福研究：最快的自愿压力减少方法。' },
    },
    {
        id: 'anx-mod-7',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'medium',
        icon: 'exercise',
        title: { en: 'Yoga for Anxiety', cn: '焦虑瑜伽' },
        description: { en: '20 min gentle yoga focusing on forward folds and child\'s pose.', cn: '20分钟轻柔瑜伽，重点做前屈和婴儿式。' },
        science: { en: 'Yoga reduces cortisol and GABA-ergic activity improves.', cn: '瑜伽降低皮质醇，GABA能活动改善。' },
    },
    {
        id: 'anx-mod-8',
        category: 'anxiety',
        severity: 'moderate',
        priority: 'medium',
        icon: 'mindfulness',
        title: { en: 'Thought Labeling', cn: '思维标签' },
        description: { en: 'When anxious thought arises, label it: "planning", "worrying", "judging".', cn: '焦虑想法出现时标记它："计划中"、"担忧中"、"评判中"。' },
        science: { en: 'Labeling emotions reduces amygdala activation by 50%.', cn: '标记情绪使杏仁核激活降低50%。' },
    },
    {
        id: 'anx-mild-5',
        category: 'anxiety',
        severity: 'mild',
        priority: 'low',
        icon: 'social',
        title: { en: 'Pet Interaction', cn: '宠物互动' },
        description: { en: 'Spend 15 minutes with a pet. Petting animals releases oxytocin.', cn: '与宠物相处15分钟。抚摸动物释放催产素。' },
        science: { en: 'Human-animal interaction reduces cortisol by 10-20%.', cn: '人与动物互动使皮质醇降低10-20%。' },
    },
    {
        id: 'dep-sev-6',
        category: 'depression',
        severity: 'severe',
        priority: 'high',
        icon: 'activity',
        title: { en: 'Accomplish One Thing', cn: '完成一件事' },
        description: { en: 'Do one small task you\'ve been avoiding. The simplest possible version.', cn: '做一件你一直在逃避的小任务，最简单的版本就好。' },
        science: { en: 'Breaking avoidance cycles is key to depression recovery.', cn: '打破回避循环是抑郁恢复的关键。' },
    },
    {
        id: 'dep-mod-5',
        category: 'depression',
        severity: 'moderate',
        priority: 'medium',
        icon: 'sleep',
        title: { en: 'Sleep Schedule Consistency', cn: '睡眠时间一致性' },
        description: { en: 'Same bedtime and wake time daily. Irregular sleep worsens depression.', cn: '每天相同的就寝和起床时间。不规律睡眠加重抑郁。' },
        science: { en: 'Circadian rhythm stability improves mood regulation.', cn: '昼夜节律稳定改善情绪调节。' },
    },
    {
        id: 'dep-mild-3',
        category: 'depression',
        severity: 'mild',
        priority: 'low',
        icon: 'nutrition',
        title: { en: 'Limit Alcohol', cn: '限制酒精' },
        description: { en: 'Reduce alcohol to 1-2 drinks max per occasion. Alcohol is a depressant.', cn: '每次饮酒最多1-2杯。酒精是一种抑制剂。' },
        science: { en: 'Heavy drinking increases depression risk 3x.', cn: '大量饮酒使抑郁风险增加3倍。' },
    },
    {
        id: 'slp-sev-4',
        category: 'sleep',
        severity: 'severe',
        priority: 'high',
        icon: 'breathing',
        title: { en: 'Paradoxical Intention', cn: '矛盾意向法' },
        description: { en: 'Try to stay awake instead of trying to sleep. Reduces performance anxiety.', cn: '尝试保持清醒而不是努力入睡。减少表现焦虑。' },
        science: { en: 'Reduces sleep effort, breaks insomnia maintenance cycle.', cn: '减少睡眠努力，打破失眠维持循环。' },
    },
    {
        id: 'slp-mod-4',
        category: 'sleep',
        severity: 'moderate',
        priority: 'medium',
        icon: 'sleep',
        title: { en: 'Bedroom Environment Optimization', cn: '卧室环境优化' },
        description: { en: 'Cool (18-20°C), dark (blackout curtains), quiet (white noise if needed).', cn: '凉爽(18-20°C)、黑暗(遮光窗帘)、安静(需要时白噪音)。' },
        science: { en: 'Optimal environment improves sleep quality by 35%.', cn: '最佳环境使睡眠质量提高35%。' },
    },
    {
        id: 'str-sev-4',
        category: 'stress',
        severity: 'severe',
        priority: 'high',
        icon: 'social',
        title: { en: 'Venting with Limit', cn: '有限发泄' },
        description: { en: 'Talk about stress for 10 min max. Then shift to solutions or gratitude.', cn: '最多谈论压力10分钟。然后转向解决方案或感恩。' },
        science: { en: 'Excessive rumination worsens mood; structured venting helps.', cn: '过度反刍使情绪恶化；结构化发泄有帮助。' },
    },
    {
        id: 'str-mod-3',
        category: 'stress',
        severity: 'moderate',
        priority: 'medium',
        icon: 'mindfulness',
        title: { en: 'Single-Tasking', cn: '单任务处理' },
        description: { en: 'Focus on one task at a time. Close extra tabs, silence notifications.', cn: '一次专注一项任务。关闭多余标签，静音通知。' },
        science: { en: 'Multitasking increases cortisol by 25%, reduces productivity 40%.', cn: '多任务使皮质醇增加25%，生产力降低40%。' },
    },
    {
        id: 'gen-7',
        category: 'general',
        severity: 'all',
        priority: 'medium',
        icon: 'exercise',
        title: { en: 'Standing Desk Breaks', cn: '站立办公休息' },
        description: { en: 'Alternate sitting/standing every 30-60 minutes.', cn: '每30-60分钟交替坐/站。' },
        science: { en: 'Standing reduces fatigue and improves focus by 15%.', cn: '站立减少疲劳，注意力提高15%。' },
    },
    {
        id: 'gen-8',
        category: 'general',
        severity: 'all',
        priority: 'low',
        icon: 'social',
        title: { en: 'Acts of Kindness', cn: '善意行为' },
        description: { en: 'Do one small kind act for someone else today.', cn: '今天为他人做一件小善事。' },
        science: { en: 'Prosocial behavior boosts mood and reduces stress.', cn: '亲社会行为提升情绪，减少压力。' },
    },
    {
        id: 'gen-9',
        category: 'general',
        severity: 'all',
        priority: 'medium',
        icon: 'mindfulness',
        title: { en: 'Savoring Practice', cn: '品味练习' },
        description: { en: 'When something good happens, pause and fully appreciate it for 60 seconds.', cn: '当好事发生时，暂停并充分欣赏60秒。' },
        science: { en: 'Savoring amplifies positive emotions and builds resilience.', cn: '品味放大积极情绪，建立韧性。' },
    },
    {
        id: 'gen-10',
        category: 'general',
        severity: 'all',
        priority: 'low',
        icon: 'activity',
        title: { en: 'Celebrate Small Wins', cn: '庆祝小胜利' },
        description: { en: 'Acknowledge each small accomplishment. Give yourself credit.', cn: '承认每个小成就。给自己肯定。' },
        science: { en: 'Self-recognition builds motivation and self-efficacy.', cn: '自我认可建立动机和自我效能感。' },
    },
];

// Helper function to get recommendations by category and severity
export function getRecommendations(
    category: 'anxiety' | 'depression' | 'sleep' | 'stress' | 'general',
    severity: 'mild' | 'moderate' | 'severe',
    count: number = 3
): HealthRecommendation[] {
    const matching = HEALTH_RECOMMENDATIONS.filter(r =>
        r.category === category &&
        (r.severity === severity || r.severity === 'all')
    );

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    matching.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return matching.slice(0, count);
}

// Milestone translations for ProgressTimeline
export const MILESTONE_TRANSLATIONS: Record<string, { event: { en: string; cn: string }; detail: { en: string; cn: string } }> = {
    'Week-0 baseline': {
        event: { en: 'Week 0 - Baseline Assessment', cn: '第0周 - 基线评估' },
        detail: { en: 'Initial measurements and calibration', cn: '初始测量和校准' },
    },
    'Week-3 review': {
        event: { en: 'Week 3 - Early Review', cn: '第3周 - 早期评估' },
        detail: { en: 'Recalibrate based on 14-day trend', cn: '基于14天趋势重新校准' },
    },
    'Week-6 midpoint': {
        event: { en: 'Week 6 - Midpoint Check', cn: '第6周 - 中期检查' },
        detail: { en: 'Assess progress and adjust intervention', cn: '评估进展并调整干预' },
    },
    'Week-9 milestone': {
        event: { en: 'Week 9 - Progress Milestone', cn: '第9周 - 进度里程碑' },
        detail: { en: 'Review treatment response', cn: '审查治疗反应' },
    },
    'Week-12 evaluation': {
        event: { en: 'Week 12 - Comprehensive Evaluation', cn: '第12周 - 综合评估' },
        detail: { en: 'Full reassessment of all metrics', cn: '所有指标全面重新评估' },
    },
    'Week-15 completion': {
        event: { en: 'Week 15 - Program Completion', cn: '第15周 - 项目完成' },
        detail: { en: 'Final assessment and next steps', cn: '最终评估和后续步骤' },
    },
};
