-- Healthline Knowledge Base Setup
-- 用于存储 Healthline 文章的知识库表
-- 注意：使用 metabolic_knowledge_base 表（不是 knowledge_base）

-- 确保 metabolic_knowledge_base 表支持 Healthline 来源
-- 如果表已存在，添加 source 字段（如果没有的话）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'source'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN source text DEFAULT 'semantic_scholar';
  END IF;
  
  -- 添加 paper_id 字段（用于 Healthline 文章唯一标识）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'paper_id'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN paper_id text UNIQUE;
  END IF;
  
  -- 添加 title 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'title'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN title text;
  END IF;
  
  -- 添加 summary_zh 字段（中文摘要）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'summary_zh'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN summary_zh text;
  END IF;
  
  -- 添加 abstract 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'abstract'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN abstract text;
  END IF;
  
  -- 添加 url 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'url'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN url text;
  END IF;
  
  -- 添加 year 字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'year'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN year integer;
  END IF;
  
  -- 添加 keywords 字段（如果 tags 不够用）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metabolic_knowledge_base' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE metabolic_knowledge_base ADD COLUMN keywords text[];
  END IF;
END $$;

-- 创建索引以加速 Healthline 查询
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_source ON metabolic_knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_url ON metabolic_knowledge_base(url);
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_paper_id ON metabolic_knowledge_base(paper_id);

-- 插入 Healthline 种子数据
-- 使用 content 字段存储主要内容，summary_zh 存储中文摘要

INSERT INTO metabolic_knowledge_base (
  paper_id, title, content, content_en, summary_zh, abstract, url, year, source, 
  category, subcategory, tags, keywords, priority
)
VALUES 
  (
    'healthline_sleep_hrv',
    'How Sleep Affects Heart Rate Variability (HRV)',
    '睡眠质量直接影响心率变异性(HRV)。研究表明，深度睡眠阶段HRV最高，而睡眠不足会导致HRV下降，增加心血管风险。建议保持7-9小时睡眠，避免睡前使用电子设备。',
    'Sleep quality directly impacts heart rate variability. Deep sleep stages show highest HRV, while sleep deprivation leads to decreased HRV and increased cardiovascular risk.',
    '睡眠质量直接影响心率变异性(HRV)。研究表明，深度睡眠阶段HRV最高，而睡眠不足会导致HRV下降，增加心血管风险。建议保持7-9小时睡眠，避免睡前使用电子设备。',
    'Sleep quality directly impacts heart rate variability. Deep sleep stages show highest HRV, while sleep deprivation leads to decreased HRV and increased cardiovascular risk.',
    'https://www.healthline.com/health/heart-rate-variability',
    2024,
    'healthline',
    'mechanism',
    'sleep',
    ARRAY['sleep', 'hrv', 'heart rate variability', 'cardiovascular', 'deep sleep'],
    ARRAY['sleep', 'hrv', 'heart rate variability', 'cardiovascular', 'deep sleep'],
    4
  ),
  (
    'healthline_cortisol_stress',
    'Cortisol: What It Does and How to Regulate It',
    '皮质醇是主要的压力激素。长期高皮质醇会导致焦虑、体重增加、免疫力下降。降低皮质醇的方法包括：规律运动、充足睡眠、冥想、减少咖啡因摄入。',
    'Cortisol is the primary stress hormone. Chronic high cortisol leads to anxiety, weight gain, and weakened immunity. Methods to lower cortisol include regular exercise, adequate sleep, meditation, and reducing caffeine.',
    '皮质醇是主要的压力激素。长期高皮质醇会导致焦虑、体重增加、免疫力下降。降低皮质醇的方法包括：规律运动、充足睡眠、冥想、减少咖啡因摄入。',
    'Cortisol is the primary stress hormone. Chronic high cortisol leads to anxiety, weight gain, and weakened immunity. Methods to lower cortisol include regular exercise, adequate sleep, meditation, and reducing caffeine.',
    'https://www.healthline.com/health/cortisol-and-stress',
    2024,
    'healthline',
    'mechanism',
    'stress',
    ARRAY['cortisol', 'stress', 'anxiety', 'hormone', 'meditation'],
    ARRAY['cortisol', 'stress', 'anxiety', 'hormone', 'meditation'],
    4
  ),
  (
    'healthline_afternoon_fatigue',
    'Why You Feel Tired in the Afternoon and What to Do About It',
    '下午疲劳（午后低谷）是正常的昼夜节律现象。血糖波动、午餐后消化、皮质醇下降都是原因。建议：避免高碳水午餐、短暂午休（15-20分钟）、户外散步、保持水分。',
    'Afternoon fatigue (post-lunch dip) is a normal circadian phenomenon. Blood sugar fluctuations, post-meal digestion, and cortisol decline are contributing factors.',
    '下午疲劳（午后低谷）是正常的昼夜节律现象。血糖波动、午餐后消化、皮质醇下降都是原因。建议：避免高碳水午餐、短暂午休（15-20分钟）、户外散步、保持水分。',
    'Afternoon fatigue (post-lunch dip) is a normal circadian phenomenon. Blood sugar fluctuations, post-meal digestion, and cortisol decline are contributing factors.',
    'https://www.healthline.com/health/afternoon-slump',
    2024,
    'healthline',
    'symptom',
    'fatigue',
    ARRAY['fatigue', 'afternoon', 'circadian rhythm', 'energy', 'blood sugar'],
    ARRAY['fatigue', 'afternoon', 'circadian rhythm', 'energy', 'blood sugar'],
    4
  ),
  (
    'healthline_anxiety_physical',
    'Physical Symptoms of Anxiety: What Your Body Is Telling You',
    '焦虑不仅是心理问题，还会引发身体症状：心跳加速、呼吸急促、肌肉紧张、消化问题、头痛。这些是交感神经系统激活的结果。深呼吸、渐进式肌肉放松可以帮助缓解。',
    'Anxiety manifests physically: rapid heartbeat, shortness of breath, muscle tension, digestive issues, headaches. These result from sympathetic nervous system activation.',
    '焦虑不仅是心理问题，还会引发身体症状：心跳加速、呼吸急促、肌肉紧张、消化问题、头痛。这些是交感神经系统激活的结果。深呼吸、渐进式肌肉放松可以帮助缓解。',
    'Anxiety manifests physically: rapid heartbeat, shortness of breath, muscle tension, digestive issues, headaches. These result from sympathetic nervous system activation.',
    'https://www.healthline.com/health/anxiety/physical-symptoms',
    2024,
    'healthline',
    'symptom',
    'anxiety',
    ARRAY['anxiety', 'physical symptoms', 'nervous system', 'stress response', 'relaxation'],
    ARRAY['anxiety', 'physical symptoms', 'nervous system', 'stress response', 'relaxation'],
    5
  ),
  (
    'healthline_metabolism_age',
    'How Your Metabolism Changes as You Age',
    '代谢随年龄变化是正常的。30岁后肌肉量每10年减少3-5%，基础代谢率下降。但这不是不可逆的：力量训练可以维持肌肉量，蛋白质摄入和睡眠质量也很重要。',
    'Metabolic changes with age are normal. After 30, muscle mass decreases 3-5% per decade, lowering basal metabolic rate. However, strength training can maintain muscle mass.',
    '代谢随年龄变化是正常的。30岁后肌肉量每10年减少3-5%，基础代谢率下降。但这不是不可逆的：力量训练可以维持肌肉量，蛋白质摄入和睡眠质量也很重要。',
    'Metabolic changes with age are normal. After 30, muscle mass decreases 3-5% per decade, lowering basal metabolic rate. However, strength training can maintain muscle mass.',
    'https://www.healthline.com/nutrition/metabolism-and-age',
    2024,
    'healthline',
    'mechanism',
    'metabolism',
    ARRAY['metabolism', 'aging', 'muscle mass', 'strength training', 'protein'],
    ARRAY['metabolism', 'aging', 'muscle mass', 'strength training', 'protein'],
    5
  ),
  (
    'healthline_cholesterol_low',
    'Can Your Cholesterol Be Too Low?',
    '胆固醇过低也可能有风险。研究显示极低胆固醇与抑郁、焦虑、认知问题相关。胆固醇是细胞膜和激素合成的必需物质。建议保持健康范围而非追求最低值。',
    'Very low cholesterol may also pose risks. Studies link extremely low cholesterol to depression, anxiety, and cognitive issues. Cholesterol is essential for cell membranes and hormone synthesis.',
    '胆固醇过低也可能有风险。研究显示极低胆固醇与抑郁、焦虑、认知问题相关。胆固醇是细胞膜和激素合成的必需物质。建议保持健康范围而非追求最低值。',
    'Very low cholesterol may also pose risks. Studies link extremely low cholesterol to depression, anxiety, and cognitive issues. Cholesterol is essential for cell membranes and hormone synthesis.',
    'https://www.healthline.com/health/cholesterol-can-it-be-too-low',
    2024,
    'healthline',
    'mechanism',
    'cholesterol',
    ARRAY['cholesterol', 'mental health', 'depression', 'hormones', 'brain health'],
    ARRAY['cholesterol', 'mental health', 'depression', 'hormones', 'brain health'],
    4
  )
ON CONFLICT (paper_id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  content_en = EXCLUDED.content_en,
  summary_zh = EXCLUDED.summary_zh,
  abstract = EXCLUDED.abstract,
  url = EXCLUDED.url,
  year = EXCLUDED.year,
  source = EXCLUDED.source,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  tags = EXCLUDED.tags,
  keywords = EXCLUDED.keywords,
  priority = EXCLUDED.priority,
  updated_at = now();

-- 验证插入
SELECT paper_id, title, source, category FROM metabolic_knowledge_base WHERE source = 'healthline';
