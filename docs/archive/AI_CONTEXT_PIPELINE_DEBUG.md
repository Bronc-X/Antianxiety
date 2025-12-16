# AI Context Pipeline - 调试指南

## 🎯 Sequential Execution Pipeline

我已经重构了Chat API，实现严格的序列化执行流程，确保AI在生成回复前已经加载了所有用户上下文。

---

## 📊 执行流程

```
STEP 0: 认证检查
   ↓
STEP 1: FETCH "THE MEMORY" (User Profile)
   - 从 profiles 表获取所有字段
   - 包括 current_focus, ai_personality, primary_goal
   ↓
STEP 2: 获取对话历史
   ↓
STEP 3: 组装用户上下文 (THE BRAIN INPUT)
   - 将profile数据转换为userContext
   ↓
STEP 4: 调用RAG系统
   - 检索知识库
   - 生成System Prompt（注入CRITICAL CONTEXT）
   - 调用Claude/GPT生成回复
   ↓
返回响应
```

---

## 🔍 关键日志输出

每次聊天请求都会在Console中输出详细日志：

### 成功案例日志：

```
================================================================================
📨 AI 聊天请求开始 - Sequential Execution Pipeline
================================================================================
✅ STEP 0: 认证成功 - abc123...
📝 用户问题: 能跑步吗？

🧠 STEP 1: 获取用户档案 (THE MEMORY)...
✅ STEP 1 完成: User Profile loaded
  📋 基础信息: { full_name: '张三', age: 35, gender: 'male' }
  🎯 AI调优设置 (CRITICAL):
    - current_focus: 腿断了
    - ai_personality: gentle_friend
    - primary_goal: maintain_energy
    - ai_persona_context: ✅ 已生成

💬 STEP 2: 获取对话历史...
✅ STEP 2 完成: 对话历史条数: 3

🔧 STEP 3: 组装用户上下文...
✅ STEP 3 完成: UserContext assembled
  🚨 CRITICAL FIELDS:
    - current_focus: 腿断了
    - ai_personality: gentle_friend

🚀 STEP 4: 调用RAG系统...
🔍 提取的关键词: ['跑步', '运动']
📚 检索到 2 条知识

🧠 生成System Prompt...
🚨 CRITICAL CONTEXT注入检查: ✅ 已注入
📝 current_focus内容: 腿断了
✅ 确认: current_focus已出现在System Prompt中

🤖 使用Claude生成回复...
✅ STEP 4 完成: RAG响应成功
================================================================================
```

### 问题案例日志（数据库字段缺失）：

```
================================================================================
📨 AI 聊天请求开始 - Sequential Execution Pipeline
================================================================================
✅ STEP 0: 认证成功 - abc123...
📝 用户问题: 能跑步吗？

🧠 STEP 1: 获取用户档案 (THE MEMORY)...
✅ STEP 1 完成: User Profile loaded
  📋 基础信息: { full_name: '张三', age: 35, gender: 'male' }
  🎯 AI调优设置 (CRITICAL):
    - current_focus: ❌ NULL
    - ai_personality: ❌ NULL
    - primary_goal: ❌ NULL
    - ai_persona_context: ❌ NULL

⚠️ WARNING: current_focus is NULL - AI将无法知道用户的特殊健康状况！
⚠️ 请检查：1) 数据库字段是否存在 2) 用户是否在设置中填写了内容

🔧 STEP 3: 组装用户上下文...
✅ STEP 3 完成: UserContext assembled
  🚨 CRITICAL FIELDS:
    - current_focus: ❌ MISSING
    - ai_personality: ❌ MISSING

🚀 STEP 4: 调用RAG系统...
⚠️ WARNING: userContext.current_focus为空，无法注入CRITICAL CONTEXT
```

---

## 🐛 调试步骤

### 1. 检查数据库字段

在Supabase Dashboard → SQL Editor执行：

```sql
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN (
    'ai_personality', 
    'current_focus', 
    'primary_goal', 
    'ai_persona_context'
  );
```

**期望结果：** 4行记录，全部为 `text` 类型

如果返回空或少于4行，执行迁移：
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_personality TEXT DEFAULT 'gentle_friend',
ADD COLUMN IF NOT EXISTS current_focus TEXT,
ADD COLUMN IF NOT EXISTS primary_goal TEXT,
ADD COLUMN IF NOT EXISTS ai_persona_context TEXT;
```

---

### 2. 检查用户数据

在Supabase Dashboard查看 `profiles` 表，找到当前用户的行：

```sql
SELECT 
  id,
  full_name,
  current_focus,
  ai_personality,
  primary_goal,
  ai_persona_context
FROM profiles
WHERE id = '你的用户ID';
```

**期望结果：**
- `current_focus` = "腿断了"（或其他内容）
- `ai_personality` = "gentle_friend" / "strict_coach" / "science_nerd"
- `primary_goal` = "lose_weight" / "improve_sleep" 等

如果这些字段为 `null`：
1. 访问 `/settings` → AI调优
2. 填写"当前关注点"
3. 选择AI性格
4. 点击"保存设置"
5. 刷新页面查看数据库

---

### 3. 查看实时日志

**方法1: 浏览器Console**
- 打开开发者工具 → Console
- 发送聊天消息
- 查看日志输出

**方法2: 服务器Terminal**
```bash
npm run dev
```
- 在运行 `npm run dev` 的终端查看日志
- 日志会显示完整的执行流程

---

## 🚨 常见问题排查

### 问题1: current_focus为NULL

**症状:**
```
⚠️ WARNING: current_focus is NULL
```

**原因:**
1. 数据库字段不存在
2. 用户未在设置中填写

**解决:**
1. 执行数据库迁移（见上文）
2. 访问 `/settings` 填写内容
3. 点击"保存设置"

---

### 问题2: CRITICAL CONTEXT未注入

**症状:**
```
🚨 CRITICAL CONTEXT注入检查: ❌ 未注入
```

**原因:**
- `generateSystemPrompt()` 函数逻辑错误
- `current_focus` 为空字符串（而非null）

**解决:**
检查 `lib/system_prompts.ts` 中的逻辑：
```typescript
const currentFocus = userContext?.current_focus?.trim();
const criticalContext = currentFocus ? `...` : '';
```

确保 `trim()` 后不是空字符串。

---

### 问题3: AI仍然忽略设置

**症状:**
- 日志显示 `current_focus: 腿断了`
- 日志显示 `✅ 已注入`
- 但AI回答仍然说"可以跑步"

**原因:**
- Claude API可能随机忽略System Prompt（概率问题）
- System Prompt格式不够醒目

**解决:**
在 `lib/system_prompts.ts` 中增强CRITICAL CONTEXT的视觉效果：
```typescript
const criticalContext = currentFocus ? `

🚨🚨🚨 CRITICAL CONTEXT - 最高优先级 - 必须严格遵守 🚨🚨🚨

用户当前生理状态：【${currentFocus}】

**绝对禁止的行为：**
1. 如果用户提到受伤、生病、疼痛，绝对不能推荐会加重伤病的运动
2. 例如：腿断了 → 不能跑步、深蹲、跳跃
3. 例如：膝盖疼痛 → 不能跑步、爬山
4. 安全永远是第一位的

🚨🚨🚨 如果违反此规则，你将造成用户受伤！🚨🚨🚨

` : '';
```

---

## ✅ 验证清单

在测试前，确保以下所有项目都通过：

- [ ] 数据库字段已创建（ai_personality, current_focus等）
- [ ] 用户在 `/settings` 填写了"当前关注点"
- [ ] 点击"保存设置"后看到成功提示
- [ ] 刷新Supabase Dashboard，确认数据已保存
- [ ] 发送聊天消息，查看Console日志
- [ ] 日志显示 `current_focus: 腿断了`（非NULL）
- [ ] 日志显示 `🚨 CRITICAL CONTEXT注入检查: ✅ 已注入`
- [ ] 日志显示 `✅ 确认: current_focus已出现在System Prompt中`

全部通过后，AI应该能够正确识别并遵守用户的健康约束。

---

## 📝 测试用例

### Test 1: 腿断了 + 问跑步
```
设置: current_focus = "腿断了"
提问: "能跑步吗？"
期望: "绝对不能！你档案显示腿断了..."
```

### Test 2: 膝盖疼痛 + 问运动
```
设置: current_focus = "膝盖疼痛"
提问: "推荐运动"
期望: 不推荐跑步、深蹲，只推荐游泳、椭圆机
```

### Test 3: 备孕期 + 问饮食
```
设置: current_focus = "备孕期间"
提问: "能喝酒吗？"
期望: "绝对不行，备孕期间..."
```

---

**Status:** ✅ Pipeline重构完成
**Next Step:** 执行数据库迁移 + 在设置中填写内容 + 查看日志验证
