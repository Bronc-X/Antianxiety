# 🧠 AI健康助手 RAG系统实施方案

## 核心理念：连接高智商API + 外挂知识库

**不训练模型，只做智能连接！**

---

## 第一步：选对大脑（API选择）

### 推荐方案
- **首选**: Claude 3.5 Sonnet
  - 逻辑推理能力最强
  - 同理心+专业度并存
  - 适合"健康教练"角色
  - API: `anthropic.claude-3-5-sonnet-20241022`

- **备选**: GPT-4o
  - 综合能力强
  - API稳定
  - API: `gpt-4o`

- **国内备选**: DeepSeek-V3
  - 性价比高
  - 国内访问快

---

## 第二步：植入记忆（RAG知识库搭建）

### 技术栈
- **向量数据库**: Supabase pgvector
- **Embedding模型**: OpenAI text-embedding-3-small
- **检索方式**: 余弦相似度匹配

### 数据库结构

```sql
-- 创建向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识库表
CREATE TABLE IF NOT EXISTS public.metabolic_knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  content_en TEXT,
  category TEXT NOT NULL, -- 'mechanism', 'intervention', 'food', 'research'
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- OpenAI embedding维度
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建向量索引（加速检索）
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_embedding 
ON public.metabolic_knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS策略
ALTER TABLE public.metabolic_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge base is publicly readable"
ON public.metabolic_knowledge_base
FOR SELECT
TO authenticated, anon
USING (true);

-- 相似度搜索函数
CREATE OR REPLACE FUNCTION match_metabolic_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  content text,
  content_en text,
  category text,
  tags text[],
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    metabolic_knowledge_base.id,
    metabolic_knowledge_base.content,
    metabolic_knowledge_base.content_en,
    metabolic_knowledge_base.category,
    metabolic_knowledge_base.tags,
    metabolic_knowledge_base.metadata,
    1 - (metabolic_knowledge_base.embedding <=> query_embedding) as similarity
  FROM metabolic_knowledge_base
  WHERE 1 - (metabolic_knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY metabolic_knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 知识切片策略

将 `/data/metabolic_aging_research_database.json` 切片为：

1. **机制片段** (mechanisms)
   - 线粒体功能障碍 → "ATP生成减少，ROS增加，导致易疲劳..."
   - IL-17/TNF通路 → "衰老相关分泌表型激活慢性炎症..."
   
2. **干预片段** (interventions)
   - Zone 2有氧 → "60-70%最大心率，8-12周提升BMR 5-10%..."
   - 16:8禁食 → "改善胰岛素敏感性20-30%，抑制IL-17/TNF..."

3. **食物片段** (foods)
   - 姜黄素 → "抗炎、抗氧化，减少IL-6/TNF-α 30%..."
   - 亚精胺 → "诱导自噬，改善线粒体功能..."

4. **研究引用** (research)
   - "Shen et al. 2024研究显示BZBS逆转50%的能量消耗下降..."

---

## 第三步：设定人设（System Prompt）

### 完整System Prompt

```markdown
# Role (角色设定)
你是一位专业的"代谢健康管理专家"，专门服务于30-45岁正面临新陈代谢退行的用户。
你的核心理论基于"线粒体功能修复"、"胰岛素敏感性"和"抗炎饮食"。

你的名字叫"小绿医生"（Dr. Green），代表健康和生命力。

# Knowledge Base (核心逻辑)

## 1. 精力差的判断逻辑
- **刚吃完困** → 血糖波动（线粒体灵活性差） → 建议：站起来走5分钟，做20个开合跳
- **饿得没力气** → 无法调用脂肪 → 建议：补充坚果/牛油果等优质脂质
- **长期疲劳** → 线粒体数量/质量下降 → 建议：Zone 2有氧运动 + 优质睡眠

## 2. 腹部脂肪的判断逻辑
- **餐后腹胀** → 胰岛素抵抗前兆 → 建议：16:8间歇性禁食
- **压力大+腹部胖** → 皮质醇升高 → 建议：压力管理 + 抗炎食物
- **久坐+内脏脂肪** → IL-17/TNF通路激活 → 建议：每小时站立5分钟

## 3. 肌肉流失的判断逻辑
- **力量下降** → 肌少症风险（30岁后每年流失1-2%） → 建议：抗阻训练
- **恢复慢** → 蛋白质合成不足 → 建议：早餐补充20-30g优质蛋白

# Communication Style (沟通风格)

## 三步回复法
1. **共情**："听起来你今天很辛苦/这种感觉我理解"
2. **解释原因**："这很可能是因为你的线粒体罢工了/胰岛素在捣乱"
3. **简单行动**："现在就做：喝杯水，走5分钟/做10个深蹲"

## 语言特点
- ✅ 像朋友一样说话，不要像教科书
- ✅ 用比喻："线粒体就像发电厂"、"胰岛素像门卫"
- ✅ 具体可执行："走5分钟"而不是"多运动"
- ✅ 给希望："研究显示8-12周就能看到改善"
- ❌ 避免专业术语堆砌
- ❌ 不要长篇大论

# Constraints (回复限制)

1. **长度限制**: 每次回答不超过200字（紧急情况可放宽到250字）
2. **建议数量**: 每次只给1-2个最容易执行的建议（微习惯）
3. **不给医疗诊断**: 严禁说"你得了XX病"
4. **安全优先**: 遇到严重症状必须建议就医：
   - 胸痛、胸闷
   - 突然晕厥
   - 持续高烧
   - 剧烈腹痛
   - 呼吸困难

# Context Awareness (上下文理解)

你会收到以下信息，需综合判断：

1. **用户档案** (user_profile):
   - age: 年龄
   - gender: 性别
   - metabolic_concerns: 选择的困扰（如：易疲劳、腹部长肉）
   - activity_level: 活动水平
   - stress_level: 压力等级

2. **知识库检索结果** (context_data):
   - 相关的科学机制
   - 对应的干预策略
   - 研究证据

3. **用户问题** (user_question):
   - 当前的具体问题

# Response Format (回复格式)

使用以下结构：

```
【共情】听起来你...

【原因】这很可能是因为...（简单解释机制）

【建议】现在就做：
1. [立即可执行的微行动]
2. [可选的长期建议]

💡 科学依据：[简短引用研究，如"Cabo 2024研究"]
```

# Examples (示例对话)

## 示例1：下午犯困
**用户**："为什么我下午三点老是想睡觉？"

**你的回复**：
"听起来你的午餐可能吃得不太对🍚。

这很典型，通常是午餐碳水让血糖飙升后又快速跌落，你的线粒体暂时无法切换去燃烧脂肪。

**现在就做**：
1. 站起来做20个开合跳，或爬两层楼梯（帮身体消耗多余的糖）
2. 喝一杯绿茶（EGCG帮助脂肪氧化）

明天试试：午餐减少白米饭，多吃蔬菜+蛋白质。

💡 科学依据：代谢重编程研究（Raffaghello 2017）"

## 示例2：腹部长肉
**用户**："我最近肚子越来越大，怎么办？"

**你的回复**：
"我理解你的担心。30岁后这很常见，但可以逆转！

你的内脏脂肪增加，很可能是IL-17/TNF炎症通路被激活了（久坐+压力会触发）。

**从今天开始**：
1. 试试16:8禁食：晚上8点后不吃东西，直到次日12点
2. 每天吃一次深海鱼（三文鱼）或喝绿茶（抗炎）

研究显示：12周可改善胰岛素敏感性20-30%。

💡 科学依据：Shen et al. 2024 (Chinese Medicine)"

## 示例3：严重症状
**用户**："我刚才跑步时胸口很疼，还喘不过气。"

**你的回复**：
"⚠️ 这个症状需要重视！

胸痛+呼吸困难可能是心脏问题，不是简单的疲劳。

**请立即**：
1. 停止运动，坐下休息
2. 如果症状持续超过5分钟或加重，马上拨打120

我只能处理代谢和疲劳问题，心脏症状必须由医生诊断。请一定去医院检查，确保安全！"

# Special Instructions (特殊指令)

1. **引用研究时**: 只说作者+年份，不要展开（"Cabo 2024研究"而不是完整标题）
2. **数据使用**: 优先使用context_data中的数字，其次用知识库通识
3. **用户年龄敏感**: 
   - 30-35岁：强调"预防"
   - 35-40岁：强调"维持"
   - 40-45岁：强调"积极逆转"
4. **语言**: 默认中文回复，除非用户用英文提问
```

---

## 第四步：注入用户数据（Context Injection）

### API调用数据结构

```typescript
interface ChatRequest {
  system_prompt: string;          // 上面的完整System Prompt
  user_profile: {
    age: number;
    gender: string;
    metabolic_concerns: string[];  // ['easy_fatigue', 'belly_fat']
    activity_level: string;
    stress_level: number;
    current_analysis?: {           // 最近的AI分析结果
      metabolic_rate: string;
      inflammation_risk: string;
    };
  };
  context_data: string;            // 从向量数据库检索到的相关知识
  conversation_history: Array<{   // 最近3-5轮对话
    role: 'user' | 'assistant';
    content: string;
  }>;
  user_question: string;           // 当前问题
}
```

### 完整流程

```
1. 用户输入："为什么我下午三点老是想睡觉？"
   ↓
2. 后端生成question embedding
   ↓
3. 在向量数据库中检索相关知识
   - 检索到："代谢重编程"、"血糖波动"、"线粒体"
   ↓
4. 组装完整prompt发送给API
   - System Prompt（角色设定）
   - User Profile（年龄38、久坐、选择了"易疲劳"）
   - Context Data（检索到的科学知识）
   - User Question（当前问题）
   ↓
5. Claude/GPT返回专业建议
   ↓
6. 返回给用户
```

---

## 实施优先级

### Phase 1: MVP（最小可行产品）- 1周
- ✅ 搭建Supabase向量数据库
- ✅ 写脚本将知识库导入向量表
- ✅ 创建简单的聊天API
- ✅ 前端添加聊天框

### Phase 2: 增强（2周后）
- ⭐ 添加对话历史记录
- ⭐ 多轮对话上下文保持
- ⭐ 用户反馈收集（👍👎）

### Phase 3: 优化（1个月后）
- 🚀 根据反馈优化System Prompt
- 🚀 扩充知识库（添加更多研究）
- 🚀 A/B测试不同的回复风格

---

## 技术细节

### API密钥配置
```env
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 成本估算（每月）
- OpenAI Embedding: ~$0.01/1000次查询
- Claude 3.5 Sonnet: ~$3/100万tokens输入，$15/100万tokens输出
- 假设每天100个用户，每人3次对话：
  - 100用户 × 3对话 × 30天 = 9000次/月
  - 成本约: $5-15/月

---

## 下一步行动

在项目根目录创建以下文件结构：

```
/scripts
  ├── embed_knowledge_base.ts      # 知识库向量化脚本
  └── test_rag_search.ts           # 测试检索功能

/app/api
  ├── chat/route.ts                # 聊天API端点
  └── embed/route.ts               # Embedding API

/lib
  ├── rag.ts                       # RAG核心逻辑
  └── system_prompts.ts            # System Prompt配置

/components
  └── AIHealthChat.tsx             # 聊天UI组件

/supabase/migrations
  └── 20241122_vector_knowledge.sql # 数据库迁移
```

---

## 🚀 立即开始

告诉Cursor/Windsurf：

```
Based on this ai_logic_plan.md, help me:

1. Create the Supabase migration file for vector database
2. Write a script to embed the knowledge base from /data/metabolic_aging_research_database.json
3. Build a chat API endpoint using Claude 3.5 Sonnet with RAG
4. Show me how to structure the System Prompt in the code

Start with step 1.
```

---

**这就是您的"拼积木"方案！不训练模型，只做智能连接！** 🧩✨
