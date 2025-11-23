-- ========================================
-- 简化版RAG知识库导入脚本
-- 在Supabase SQL Editor中运行此脚本
-- ========================================

-- 插入15条核心知识（不需要embedding向量）

INSERT INTO public.metabolic_knowledge_base 
(content, content_en, category, subcategory, tags, priority, metadata, created_at, updated_at)
VALUES
-- 1. 线粒体功能障碍
('线粒体功能障碍

机制：线粒体效率下降，ATP生成减少，氧化应激（ROS）增加

相关症状：易疲劳、耐力下降、恢复慢',
'Mitochondrial Dysfunction',
'mechanisms',
'病理机制',
ARRAY['疲劳', '累', '乏力', '线粒体', '能量', 'ATP'],
10,
'{"references": ["Błaszczyk 2020"]}'::jsonb,
now(),
now()),

-- 2. 代谢重编程
('代谢重编程

机制：从氧化磷酸化转向糖酵解

相关症状：对碳水渴望增加、餐后困倦、能量不稳定',
'Metabolic Reprogramming',
'mechanisms',
'病理机制',
ARRAY['困', '犯困', '碳水', '糖', '代谢'],
10,
'{"RER_shift": "0.75→0.85"}'::jsonb,
now(),
now()),

-- 3. IL-17/TNF炎症
('IL-17/TNF炎症通路

机制：慢性炎症激活

相关症状：腹部脂肪堆积、关节痛、睡眠质量差',
'IL-17/TNF Inflammation',
'mechanisms',
'病理机制',
ARRAY['炎症', '脂肪', '肥胖', '肚子', '腹部'],
10,
'{"pathway": "IL-17/TNF"}'::jsonb,
now(),
now()),

-- 4. Zone 2有氧运动
('Zone 2有氧运动

方案：每日30分钟低心率跑或快走（60-70%最大心率）

效果：8-12周内基础代谢率提升5-10%',
'Zone 2 Aerobic Exercise',
'interventions',
'运动干预',
ARRAY['运动', '跑步', '走路', '有氧', 'Zone 2'],
8,
'{"frequency": "Daily", "intensity": "60-70% max HR"}'::jsonb,
now(),
now()),

-- 5. 抗阻训练
('抗阻训练

方案：每周3次自重深蹲或俯卧撑（3组×8-12次）

效果：保持肌肉量，提升基础代谢',
'Resistance Training',
'interventions',
'运动干预',
ARRAY['肌肉', '深蹲', '俯卧撑', '抗阻', '训练'],
8,
'{"sets_reps": "3×8-12", "frequency": "3/week"}'::jsonb,
now(),
now()),

-- 6. 16:8间歇性禁食
('16:8间歇性禁食

方案：进食窗口8小时（如12pm-8pm）

效果：改善胰岛素敏感性20-30%',
'16:8 Intermittent Fasting',
'interventions',
'饮食干预',
ARRAY['禁食', '饮食', '16:8', '间歇', '胰岛素'],
8,
'{"eating_window": "8 hours"}'::jsonb,
now(),
now()),

-- 7. Omega-3和多酚
('Omega-3和多酚

方案：深海鱼或绿茶/咖啡

剂量：Omega-3 1-2g/天

效果：降低炎症标志物20-30%',
'Omega-3 and Polyphenols',
'interventions',
'营养补充',
ARRAY['Omega-3', '鱼油', '绿茶', '咖啡', '多酚', '抗氧化'],
8,
'{"dosage": "1-2g EPA+DHA daily"}'::jsonb,
now(),
now()),

-- 8. 优质蛋白质
('优质蛋白质（亮氨酸）

方案：早餐20-30g蛋白（鸡蛋/瘦肉）

机制：激活mTOR，启动肌肉蛋白合成',
'High-Quality Protein',
'interventions',
'营养补充',
ARRAY['蛋白质', '鸡蛋', '肉', '亮氨酸', '肌肉'],
8,
'{"dosage": "20-30g protein"}'::jsonb,
now(),
now()),

-- 9. 睡眠优化
('睡眠优化

方案：7-9小时睡眠，固定作息，避免蓝光

效果：恢复生长激素分泌，优化代谢修复',
'Sleep Optimization',
'interventions',
'生活方式',
ARRAY['睡眠', '失眠', '作息', '昼夜节律'],
7,
'{"duration": "7-9 hours"}'::jsonb,
now(),
now()),

-- 10-15. 研究亮点
('Shen et al. 2024 - 能量消耗衰老指数

关键发现：首个基于能量消耗的衰老指数，RER从0.75升至0.85',
'Energy Expenditure Aging Index',
'research',
'Chinese Medicine',
ARRAY['研究', '能量', 'EEAI'],
5,
'{"doi": "10.1186/s13020-024-00927-9", "year": 2024}'::jsonb,
now(),
now()),

('Arora et al. 2024 - AI抗衰分子预测

关键发现：AI预测姜黄素、亚精胺等抗衰老分子',
'AgeXtend AI',
'research',
'Nature Aging',
ARRAY['研究', 'AI', '姜黄素'],
5,
'{"doi": "10.1038/s43587-024-00763-4", "year": 2024}'::jsonb,
now(),
now()),

('Chen & Wu 2024 - 肌少症

关键发现：30岁后每年肌肉流失1-2%，抗阻训练+蛋白质最有效',
'Sarcopenia Research',
'research',
'Aging and Disease',
ARRAY['研究', '肌少症', '肌肉'],
5,
'{"doi": "10.14336/AD.2024.0407", "year": 2024}'::jsonb,
now(),
now()),

('Cabo et al. 2024 - 运动逆转代谢衰退

关键发现：Zone 2有氧运动8-12周可提升BMR 5-10%',
'Exercise Reverses Decline',
'research',
'Springer',
ARRAY['研究', '运动', 'Zone 2'],
5,
'{"doi": "10.1007/s10389-024-02327-7", "year": 2024}'::jsonb,
now(),
now()),

('Błaszczyk 2020 - 线粒体衰退

关键发现：线粒体功能下降是衰老的标志，ATP生成减少',
'Mitochondrial Decline',
'research',
'Biomolecules',
ARRAY['研究', '线粒体', 'ATP'],
5,
'{"doi": "10.3390/biom10111508", "year": 2020}'::jsonb,
now(),
now()),

('Zeng et al. 2024 - 血细胞代谢时钟

关键发现：尿苷水平反映衰老程度，代谢时钟预测生物学年龄',
'Metabolic Clock',
'research',
'Nature Aging',
ARRAY['研究', '代谢', '时钟'],
5,
'{"doi": "10.1038/s43587-024-00669-1", "year": 2024}'::jsonb,
now(),
now());

-- 验证导入
SELECT 
  category,
  COUNT(*) as count
FROM public.metabolic_knowledge_base
GROUP BY category
ORDER BY category;

-- 应该显示：
-- mechanisms: 3
-- interventions: 6
-- research: 6
-- 总计: 15条知识
