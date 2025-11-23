# 🚀 RAG系统部署检查清单

## ✅ 已完成
- [x] AI逻辑规划文档（ai_logic_plan.md）
- [x] Supabase向量数据库Schema（supabase_vector_knowledge_base.sql）
- [x] 知识库向量化脚本（scripts/embed_knowledge_base.ts）
- [x] System Prompt配置（lib/system_prompts.ts）
- [x] RAG核心逻辑（lib/rag.ts）
- [x] 聊天API端点（app/api/chat/route.ts）
- [x] DeepSeek → Claude迁移完成

---

## 📋 待完成步骤

### Step 1: 安装依赖包 ⏳
```bash
npm install openai @anthropic-ai/sdk
```

**状态**: 正在执行...

---

### Step 2: 配置环境变量 ⏸️

#### 2.1 本地开发环境
创建或编辑 `.env.local` 文件：

```bash
# Supabase配置（如已有则保持）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Claude API（主要AI服务）- 必需
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# OpenAI API（用于embedding）- 必需
OPENAI_API_KEY=sk-proj-xxxxx

# GitHub OAuth（如需登录功能）
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

#### 2.2 获取API Keys

**Claude API Key**:
1. 访问：https://console.anthropic.com/
2. 注册/登录账号
3. API Keys → Create Key
4. 复制 `sk-ant-api03-xxxxx`

**OpenAI API Key**:
1. 访问：https://platform.openai.com/api-keys
2. 登录账号
3. Create new secret key
4. 复制 `sk-proj-xxxxx`

**新用户福利**：
- Claude: $5免费额度
- OpenAI: $5免费额度
- 总计: $10（够测试2-3个月）

---

### Step 3: 执行数据库迁移 ⏸️

#### 3.1 登录Supabase
访问：https://supabase.com/dashboard/projects

#### 3.2 打开SQL Editor
1. 选择你的项目
2. 左侧菜单 → SQL Editor
3. 点击 "New Query"

#### 3.3 执行迁移SQL
复制并执行 `supabase_vector_knowledge_base.sql` 的全部内容：

```sql
-- 1. 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建知识库表
CREATE TABLE IF NOT EXISTS public.metabolic_knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  content_en TEXT,
  category TEXT NOT NULL,
  ...
);
-- ... （执行完整文件）
```

#### 3.4 验证
在SQL Editor中运行：
```sql
-- 应该看到5条示例数据
SELECT COUNT(*) FROM metabolic_knowledge_base;

-- 检查向量扩展
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

### Step 4: 导入知识库数据 ⏸️

#### 4.1 准备脚本
确认以下文件存在：
- ✅ `scripts/embed_knowledge_base.ts`
- ✅ `data/metabolic_aging_research_database.json`

#### 4.2 运行向量化脚本
```bash
npx ts-node scripts/embed_knowledge_base.ts
```

#### 4.3 预期输出
```
🚀 Starting knowledge base embedding process...
📖 Reading database from: /data/metabolic_aging_research_database.json
✅ Database loaded successfully

🔍 Extracting knowledge entries...
   - Mechanisms: 15 entries
   - Interventions: 25 entries
   - Research: 10 entries
   - Total: 50 entries

🧮 Generating vector embeddings...
   Progress: 10/50 entries processed
   Progress: 20/50 entries processed
   Progress: 30/50 entries processed
   Progress: 40/50 entries processed
   Progress: 50/50 entries processed
✅ Generated 50 embeddings

💾 Inserting into database...
✅ Embedding complete!
   - Success: 50 entries
   - Failed: 0 entries

🔍 Verifying database...
✅ Total entries in database: 55  (5 samples + 50 new)

🎉 Done! Knowledge base is ready for RAG queries.
```

#### 4.4 可能的错误及解决

**错误1**: `Module not found: openai`
```bash
# 解决：确认Step 1已完成
npm install openai @anthropic-ai/sdk
```

**错误2**: `OPENAI_API_KEY not found`
```bash
# 解决：检查.env.local文件，确认包含：
OPENAI_API_KEY=sk-proj-xxxxx
```

**错误3**: `Connection to Supabase failed`
```bash
# 解决：检查Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

### Step 5: 测试系统 ⏸️

#### 5.1 启动开发服务器
```bash
# 如果服务器在运行，先停止（Ctrl+C）
npm run dev
```

#### 5.2 测试聊天API

**方法A: 使用curl**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "message": "为什么我下午三点老是想睡觉？",
    "language": "zh"
  }'
```

**方法B: 使用前端界面**
1. 打开应用：http://localhost:3000
2. 登录账号
3. 进入AI助手聊天
4. 输入测试问题

#### 5.3 测试问题示例

| 测试场景 | 测试问题 | 预期回复特点 |
|---------|---------|------------|
| 易疲劳 | "为什么我总是感觉累？" | 提到"线粒体"、"发电厂"比喻 |
| 腹部长肉 | "肚子越来越大怎么办？" | 提到"IL-17/TNF炎症"、"16:8禁食" |
| 餐后困倦 | "为什么午饭后就困？" | 提到"血糖波动"、"开合跳" |
| 紧急症状 | "我刚才跑步时胸口很疼" | 立即返回紧急回复，建议就医 |

#### 5.4 回复质量检查
- [ ] 像朋友说话（不是医学术语）
- [ ] 用比喻解释（如"线粒体=发电厂"）
- [ ] 具体可执行（如"做20个开合跳"）
- [ ] 包含emoji（1-2个）
- [ ] 引用研究（如"Shen et al. 2024"）
- [ ] 200字以内

---

### Step 6: 监控和优化 ⏸️

#### 6.1 成本监控
**Anthropic Console**: https://console.anthropic.com/settings/usage
**OpenAI Dashboard**: https://platform.openai.com/usage

#### 6.2 性能优化
- 检查向量检索速度
- 监控API响应时间
- 优化相似度阈值（默认0.7）

#### 6.3 知识库更新
```bash
# 更新JSON数据库后重新导入
npx ts-node scripts/embed_knowledge_base.ts
```

---

## 🎯 快速验证命令

### 一键检查所有依赖
```bash
# 检查Node包
npm list openai @anthropic-ai/sdk

# 检查环境变量
node -e "console.log({
  ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,
  OPENAI: !!process.env.OPENAI_API_KEY,
  SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
})"
```

### 一键测试向量检索
在Supabase SQL Editor中：
```sql
-- 测试向量相似度搜索
SELECT 
  id, 
  category, 
  LEFT(content, 50) as preview,
  tags
FROM metabolic_knowledge_base
WHERE category = 'mechanism'
LIMIT 5;
```

---

## 📊 部署进度

| 步骤 | 状态 | 预计时间 |
|------|------|---------|
| 1. 安装依赖 | ⏳ 进行中 | 2分钟 |
| 2. 配置环境变量 | ⏸️ 待开始 | 5分钟 |
| 3. 数据库迁移 | ⏸️ 待开始 | 3分钟 |
| 4. 导入知识库 | ⏸️ 待开始 | 5-10分钟 |
| 5. 测试系统 | ⏸️ 待开始 | 5分钟 |
| **总计** | - | **20-25分钟** |

---

## 🆘 需要帮助？

### 常见问题文档
- **Claude配置**: `QUICK_SETUP_CLAUDE.md`
- **迁移详情**: `CLAUDE_MIGRATION_COMPLETE.md`
- **完整实施**: `RAG_IMPLEMENTATION_COMPLETE.md`

### 紧急联系
如遇到问题，提供以下信息：
1. 错误截图
2. 控制台日志
3. 执行的命令
4. 环境变量配置（隐藏敏感信息）

---

**当前任务**: 等待Step 1完成（npm install）
**下一步**: 配置.env.local环境变量

**准备好继续了吗？** 👍
