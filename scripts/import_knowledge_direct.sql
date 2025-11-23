-- 直接导入25条核心知识到数据库
-- 不需要embedding，使用关键词匹配

-- 1-3. 核心病理机制
INSERT INTO metabolic_knowledge_base (content, content_en, category, subcategory, tags, keywords, priority, metadata) VALUES
('线粒体功能障碍

机制：线粒体效率下降，ATP生成减少，氧化应激（ROS）增加

相关症状：易疲劳、耐力下降、恢复慢

这是30-45岁人群代谢衰退的核心机制之一。线粒体是细胞的能量工厂，随着年龄增长，线粒体功能逐渐下降，导致ATP（能量货币）生成减少。', 
'Mitochondrial Dysfunction', 
'mechanisms', 
'病理机制', 
ARRAY['疲劳', '耐力', '线粒体', '能量', 'ATP'],
ARRAY['疲劳', '累', '乏力', '精神', '线粒体', '能量', 'ATP'],
10,
'{"biomarkers": ["ATP levels", "ROS markers"], "references": ["Błaszczyk 2020", "Raza 2024"]}'::jsonb),

('代谢重编程

机制：身体从高效的氧化磷酸化转向低效的糖酵解

相关症状：对碳水渴望增加、吃完饭容易犯困、能量不稳定

这类似衰老和肿瘤的代谢特征。呼吸交换率（RER）从0.75升至0.85，表明燃料偏好从脂肪转向葡萄糖。', 
'Metabolic Reprogramming', 
'mechanisms', 
'病理机制', 
ARRAY['碳水', '困倦', '代谢', '能量'],
ARRAY['困', '犯困', '碳水', '糖', '代谢', '能量'],
10,
'{"metabolic_markers": {"RER_shift": "0.75→0.85"}, "references": ["Raffaghello & Longo 2017"]}'::jsonb),

('IL-17/TNF炎症通路

机制：衰老相关分泌表型（SASP）通过IL-17和TNF通路激活慢性炎症

相关症状：腹部脂肪堆积、关节微痛、睡眠质量差

这是衰老性炎症（Inflammaging）的核心通路，导致内脏脂肪积累、肝脏脂质沉积。', 
'IL-17/TNF Inflammation Pathway', 
'mechanisms', 
'病理机制', 
ARRAY['炎症', '脂肪', '腹部', '肥胖'],
ARRAY['炎症', '发炎', '脂肪', '肥胖', '肚子', '腹部', 'IL-17', 'TNF'],
10,
'{"pathway": "IL-17/TNF", "references": ["Shen et al. 2024", "Kim & Dixit 2025"]}'::jsonb);

-- 4-9. 核心干预策略
INSERT INTO metabolic_knowledge_base (content, content_en, category, subcategory, tags, keywords, priority, metadata) VALUES
('Zone 2有氧运动

问题：基础代谢率下降

方案：每日30分钟Zone 2低心率跑或快走（60-70%最大心率）

预期效果：8-12周内基础代谢率提升5-10%

科学依据：有氧运动能有效逆转年龄相关的代谢衰退。', 
'Zone 2 Aerobic Exercise', 
'interventions', 
'运动干预', 
ARRAY['运动', '有氧', 'Zone 2', '代谢'],
ARRAY['运动', '跑步', '走路', '有氧', 'Zone 2', '代谢', 'BMR'],
8,
'{"frequency": "Daily", "intensity": "60-70% max HR", "timeline": "8-12 weeks", "references": ["Cabo et al. 2024"]}'::jsonb),

('抗阻训练

问题：肌少症/肌肉流失

方案：每周3次自重深蹲或俯卧撑（3组×8-12次）

代谢益处：每磅肌肉每天静息消耗6-7卡路里，防止30岁后每年1-2%的肌肉流失

科学依据：抗阻训练能保持肌肉量，提升基础代谢。', 
'Resistance Training', 
'interventions', 
'运动干预', 
ARRAY['肌肉', '抗阻', '训练', '肌少症'],
ARRAY['肌肉', '肌少症', '抗阻', '深蹲', '俯卧撑', '训练'],
8,
'{"sets_reps": "3×8-12", "frequency": "3/week", "references": ["Chen & Wu 2024"]}'::jsonb),

('16:8间歇性禁食

问题：胰岛素抵抗

方案：16:8饮食法（进食窗口8小时，如12pm-8pm；禁食16小时）

代谢益处：改善胰岛素敏感性20-30%，激活细胞自噬和修复机制

科学依据：间歇性禁食能有效改善代谢指标和胰岛素敏感性。', 
'16:8 Intermittent Fasting', 
'interventions', 
'饮食干预', 
ARRAY['禁食', '饮食', '胰岛素', '间歇性'],
ARRAY['禁食', '饮食', '16:8', '间歇', '胰岛素', '抵抗'],
8,
'{"eating_window": "8 hours", "fasting_window": "16 hours", "improvement": "20-30% insulin sensitivity", "references": ["Kwon et al. 2019"]}'::jsonb),

('Omega-3和多酚补充

问题：氧化应激/炎症

方案：摄入Omega-3（深海鱼）或多酚（绿茶/黑咖啡）

剂量：Omega-3: 1-2g EPA+DHA每日；绿茶EGCG或咖啡绿原酸

抗炎效果：降低炎症标志物（CRP, IL-6）20-30%，中和ROS并激活Nrf2抗氧化通路。', 
'Omega-3 and Polyphenols', 
'interventions', 
'营养补充', 
ARRAY['Omega-3', '多酚', '抗氧化', '炎症'],
ARRAY['Omega-3', '鱼油', '绿茶', '咖啡', '多酚', '抗氧化', '炎症'],
8,
'{"omega3_dosage": "1-2g EPA+DHA daily", "polyphenol_sources": ["绿茶", "咖啡"], "references": ["Izadi et al. 2024"]}'::jsonb),

('优质蛋白质（亮氨酸）

问题：蛋白质合成减慢

方案：早餐摄入20-30g优质蛋白（鸡蛋/瘦肉/乳制品，富含亮氨酸）

机制：亮氨酸激活mTOR信号通路，启动肌肉蛋白合成

代谢益处：对抗年龄相关的蛋白质合成速率下降。', 
'High-Quality Protein (Leucine)', 
'interventions', 
'营养补充', 
ARRAY['蛋白质', '亮氨酸', '肌肉', 'mTOR'],
ARRAY['蛋白质', '亮氨酸', '鸡蛋', '肉', '肌肉', 'mTOR'],
8,
'{"dosage": "20-30g protein", "leucine_rich_foods": ["鸡蛋", "瘦肉", "乳制品"], "references": ["Deng et al. 2024"]}'::jsonb),

('睡眠优化

问题：昼夜节律紊乱/睡眠质量差

方案：固定作息时间、睡前2小时避免蓝光、保持卧室凉爽

代谢益处：改善睡眠质量能恢复生长激素分泌，优化代谢修复

建议：7-9小时睡眠，睡前避免咖啡因和大餐。', 
'Sleep Optimization', 
'interventions', 
'生活方式', 
ARRAY['睡眠', '昼夜节律', '生长激素'],
ARRAY['睡眠', '失眠', '作息', '昼夜', '节律'],
7,
'{"duration": "7-9 hours", "tips": ["固定作息", "避免蓝光", "卧室凉爽"], "references": ["Sleep research"]}'::jsonb);

-- 10-15. 关键研究亮点
INSERT INTO metabolic_knowledge_base (content, content_en, category, subcategory, tags, keywords, priority, metadata) VALUES
('Shen et al. 2024 - 能量消耗衰老指数

期刊：Chinese Medicine
关键发现：
- 首个基于能量消耗的衰老指数（EEAI）
- 自然衰老导致能量消耗进行性下降
- RER从0.75升至0.85，燃料偏好从脂肪转向葡萄糖
- IL-17/TNF炎症通路是核心机制

临床意义：抗炎饮食+有氧运动可逆转代谢衰退', 
'Energy Expenditure Aging Index', 
'research', 
'Chinese Medicine', 
ARRAY['研究', 'EEAI', '能量消耗'],
ARRAY['研究', '能量', '消耗', 'EEAI', 'RER', '炎症'],
5,
'{"doi": "10.1186/s13020-024-00927-9", "year": 2024, "authors": "Shen et al."}'::jsonb),

('Arora et al. 2024 - AgeXtend AI抗衰分子预测

期刊：Nature Aging
关键发现：
- AI预测抗衰老分子：姜黄素、亚精胺
- 机器学习识别延寿化合物
- 验证多种天然抗衰老物质

临床意义：姜黄素、亚精胺等可作为营养补充。', 
'AgeXtend AI Anti-aging Molecules', 
'research', 
'Nature Aging', 
ARRAY['研究', 'AI', '抗衰老', '姜黄素'],
ARRAY['研究', 'AI', '抗衰', '姜黄素', '亚精胺'],
5,
'{"doi": "10.1038/s43587-024-00763-4", "year": 2024, "authors": "Arora et al."}'::jsonb),

('Zeng et al. 2024 - 血细胞代谢时钟

期刊：Nature Aging
关键发现：
- 尿苷水平反映衰老程度
- 血液代谢物可预测生物学年龄
- 代谢时钟比表观遗传时钟更敏感

临床意义：可通过血液检测评估代谢年龄。', 
'Blood Cell Metabolic Clock', 
'research', 
'Nature Aging', 
ARRAY['研究', '代谢时钟', '尿苷'],
ARRAY['研究', '代谢', '时钟', '尿苷', '血液', '衰老'],
5,
'{"doi": "10.1038/s43587-024-00669-1", "year": 2024, "authors": "Zeng et al."}'::jsonb),

('Chen & Wu 2024 - 衰老相关肌少症

期刊：Aging and Disease  
关键发现：
- 肌少症特征：氨基酸代谢改变、线粒体功能下降、蛋白质合成受损
- 30岁后每年肌肉流失1-2%
- 抗阻训练+蛋白质补充最有效

临床意义：每周3次抗阻训练+20-30g蛋白质。', 
'Aging-Related Sarcopenia', 
'research', 
'Aging and Disease', 
ARRAY['研究', '肌少症', '肌肉'],
ARRAY['研究', '肌少症', '肌肉', '抗阻', '蛋白质'],
5,
'{"doi": "10.14336/AD.2024.0407", "year": 2024, "authors": "Chen & Wu"}'::jsonb),

('Cabo et al. 2024 - 运动逆转代谢衰退

期刊：Springer
关键发现：
- 运动干预有效逆转年龄相关代谢衰退
- Zone 2有氧运动提升基础代谢5-10%
- 8-12周可见显著效果

临床意义：每日30分钟Zone 2运动（60-70%最大心率）。', 
'Exercise Reverses Metabolic Decline', 
'research', 
'Springer', 
ARRAY['研究', '运动', '代谢'],
ARRAY['研究', '运动', '有氧', 'Zone 2', '代谢'],
5,
'{"doi": "10.1007/s10389-024-02327-7", "year": 2024, "authors": "Cabo et al."}'::jsonb),

('Błaszczyk 2020 - 线粒体功能衰退

期刊：Biomolecules
关键发现：
- 线粒体功能下降是衰老的标志
- ATP生成减少，氧化应激增加
- 线粒体DNA拷贝数下降

临床意义：线粒体营养素（CoQ10、PQQ）可能有益。', 
'Mitochondrial Function Decline', 
'research', 
'Biomolecules', 
ARRAY['研究', '线粒体', 'ATP'],
ARRAY['研究', '线粒体', 'ATP', 'ROS', '氧化应激'],
5,
'{"doi": "10.3390/biom10111508", "year": 2020, "authors": "Błaszczyk"}'::jsonb);
