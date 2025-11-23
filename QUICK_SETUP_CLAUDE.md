# ⚡ Claude配置快速指南

## 🎯 3步完成配置

### Step 1: 获取API Keys

#### 1.1 获取Claude API Key
1. 访问：https://console.anthropic.com/
2. 登录或注册账号
3. 进入 API Keys 页面
4. 点击 "Create Key"
5. 复制生成的 API Key（格式：`sk-ant-api03-xxxxx`）

#### 1.2 获取OpenAI API Key
1. 访问：https://platform.openai.com/api-keys
2. 登录OpenAI账号
3. 点击 "Create new secret key"
4. 复制生成的 API Key（格式：`sk-proj-xxxxx`）

---

### Step 2: 配置本地环境变量

#### 创建 `.env.local` 文件
在项目根目录创建 `.env.local` 文件（如已存在则编辑）：

```bash
# Supabase配置（保持不变，如果已有）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Claude API（新增）
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# OpenAI API（新增）
OPENAI_API_KEY=sk-proj-xxxxx

# OAuth配置（保持不变，如果已有）
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

**重要**：
- ✅ 文件名必须是 `.env.local`（不是`.env`）
- ✅ 将上面的`xxxxx`替换为你的真实API Key
- ✅ 不要把 `.env.local` 提交到Git

---

### Step 3: 重启并测试

#### 3.1 重启开发服务器
```bash
# 如果服务器正在运行，先停止（Ctrl+C）
# 然后重新启动
npm run dev
```

#### 3.2 测试AI对话
1. 打开浏览器访问应用
2. 进入AI助手聊天界面
3. 输入测试问题：
   ```
   我最近每天下午3点就困得不行，而且肚子也越来越大
   ```

#### 3.3 验证回复质量
AI应该返回类似这样的回复（符合以下特点）：
- ✅ 像朋友说话，不用专业术语
- ✅ 用比喻（如"线粒体=发电厂"）
- ✅ 具体动作（如"做20个开合跳"）
- ✅ 有emoji（1-2个）
- ✅ 引用研究（如"Shen et al. 2024"）
- ✅ 200字以内

---

## ❌ 常见问题

### Q1: 找不到 `.env.local` 文件
**解决**：
```bash
# Mac/Linux
touch .env.local

# Windows（在项目根目录运行）
echo. > .env.local
```

### Q2: 启动时报错 "ANTHROPIC_API_KEY 未设置"
**检查**：
1. 确认 `.env.local` 文件在项目根目录（不在子文件夹）
2. 确认环境变量名称是 `ANTHROPIC_API_KEY`（不是`CLAUDE_API_KEY`）
3. 确认API Key前后没有空格或引号
4. 重启开发服务器

### Q3: AI回复还是很学术，不像朋友
**可能原因**：
- System Prompt未正确加载
- 使用了旧的API端点

**检查**：
查看 `lib/system_prompts.ts` 文件是否存在，内容是否正确

### Q4: 成本会很高吗？
**放心**：
- 100个用户/月，约$4-5（¥30-40）
- Claude有免费额度
- OpenAI embedding成本极低（$0.01/月）

---

## 🎁 Claude免费额度

### 新用户福利
- Anthropic提供 **$5免费额度**
- OpenAI提供 **$5免费额度**
- 总计：**$10免费额度**

### 够用多久？
- 个人开发测试：可用2-3个月
- 100用户运营：可用2-3个月
- 1000用户运营：需要充值

---

## 📊 成本监控

### Anthropic Console
访问：https://console.anthropic.com/settings/usage
- 查看实时使用情况
- 设置预算提醒
- 查看详细账单

### OpenAI Dashboard
访问：https://platform.openai.com/usage
- 查看embedding调用次数
- 监控成本

---

## ✅ 配置完成检查清单

- [ ] 已获取Claude API Key
- [ ] 已获取OpenAI API Key
- [ ] 已创建 `.env.local` 文件
- [ ] 已填入正确的API Keys
- [ ] 已重启开发服务器
- [ ] AI对话测试通过
- [ ] 回复质量符合要求

**全部勾选 → 配置完成！🎉**

---

## 🚀 下一步

配置完成后，您可以：
1. 继续RAG系统部署（查看`RAG_IMPLEMENTATION_COMPLETE.md`）
2. 导入知识库（运行`npx ts-node scripts/embed_knowledge_base.ts`）
3. 测试Pro版功能（AI甄选抗衰食材）

---

**需要帮助？**
- 详细迁移报告：`CLAUDE_MIGRATION_COMPLETE.md`
- RAG系统文档：`RAG_IMPLEMENTATION_COMPLETE.md`
- AI逻辑规划：`ai_logic_plan.md`
