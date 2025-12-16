# 用户画像向量化设置指南

## 📋 概述

用户画像向量化功能会根据用户的所有数据（习惯、完成记录、指标等）生成一个向量表示，用于 RAG 搜索和个性化推荐。

---

## 🔧 功能说明

### 1. 自动生成用户画像文本

系统会汇总以下信息：
- 用户资料（主要关注、活动水平、昼夜节律等）
- 当前习惯列表
- 最近的完成记录（行为模式）
- 近期指标（信念分数、信心分数等）

### 2. 生成向量嵌入

将用户画像文本转换为 1536 维向量，存储到 `profiles.user_persona_embedding` 字段。

### 3. 用于 RAG 搜索

在个性化信息推送功能中，使用用户画像向量来搜索相关的内容。

---

## 🚀 使用方法

### 方法 1: 通过 API 调用

**端点**: `POST /api/user/persona`

**请求**:
```bash
curl -X POST https://your-domain.com/api/user/persona \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "message": "用户画像向量已更新"
}
```

### 方法 2: 在代码中调用

```typescript
import { updateUserPersonaEmbedding } from '@/lib/userPersona';

// 更新用户画像向量
const result = await updateUserPersonaEmbedding(userId);
if (result.success) {
  console.log('用户画像向量已更新');
} else {
  console.error('更新失败:', result.error);
}
```

---

## 📅 何时更新用户画像

建议在以下场景更新用户画像向量：

1. **用户完成 onboarding**：首次创建用户画像
2. **用户更新资料**：资料变化后更新画像
3. **习惯变化**：创建、修改或删除习惯后
4. **定期更新**：每周自动更新一次（通过 cron job）

---

## 🔄 自动更新（推荐）

### 使用 Supabase Edge Function 或 Vercel Cron

创建一个定时任务，定期更新所有活跃用户的画像向量：

```typescript
// 示例：每周更新一次
export async function updateAllUserPersonas() {
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .not('user_persona_embedding', 'is', null); // 只更新已有向量的用户

  for (const user of users || []) {
    await updateUserPersonaEmbedding(user.id);
  }
}
```

---

## ✅ 验证设置

### 检查用户画像向量是否已生成

```sql
SELECT 
  id,
  full_name,
  user_persona_embedding IS NOT NULL as has_embedding
FROM profiles
WHERE id = 'your-user-id';
```

### 查看用户画像文本（调试用）

在 `lib/userPersona.ts` 的 `generateUserPersonaText` 函数中添加日志：

```typescript
console.log('用户画像文本:', personaText);
```

---

## 🐛 故障排除

### 问题 1: 向量生成失败

**可能原因**：
- Embedding API Key 未设置
- 用户数据不足

**解决方案**：
- 检查 `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY` 是否设置
- 确保用户至少有基本资料

### 问题 2: 向量维度不匹配

**可能原因**：
- 使用了不同模型的 embedding

**解决方案**：
- 确保所有 embedding 使用相同的模型（默认：`text-embedding-3-small`，1536 维）

### 问题 3: 更新太慢

**可能原因**：
- 用户数据量大
- API 调用限制

**解决方案**：
- 限制查询的数据量（例如：只取最近 30 条完成记录）
- 使用批量更新，但注意 API 速率限制

---

## 📊 使用场景

### 场景 1: 个性化信息推送

使用用户画像向量在 `content_feed_vectors` 表中搜索相关内容：

```typescript
// 在 /api/feed 中使用
const { data: profile } = await supabase
  .from('profiles')
  .select('user_persona_embedding')
  .eq('id', userId)
  .single();

if (profile?.user_persona_embedding) {
  // 使用向量搜索相关内容
  const { data } = await supabase.rpc('match_content_feed_vectors', {
    query_embedding: profile.user_persona_embedding,
    match_threshold: 0.7,
    match_count: 10,
  });
}
```

---

## 🎯 下一步

完成设置后，可以：
1. 在个性化信息推送功能中使用用户画像向量
2. 实现自动更新机制（cron job）
3. 优化画像文本生成逻辑（根据实际需求调整）

