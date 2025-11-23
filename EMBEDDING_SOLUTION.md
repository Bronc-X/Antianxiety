# 🔧 Embedding模型权限问题解决方案

## 问题诊断

错误信息：
```
403 该令牌无权访问模型 text-embedding-3-small
```

**原因**：您的中转站key只开通了聊天模型（GPT/Gemini/Claude），未开通Embedding模型。

---

## 解决方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| A. 中转站开通Embedding | ✅ 最简单<br>✅ 成本极低 | 需要联系中转站 | ⭐⭐⭐⭐⭐ |
| B. 使用免费Embedding服务 | ✅ 免费 | 需要额外注册 | ⭐⭐⭐⭐ |
| C. 简化为关键词匹配 | ✅ 无需API | ❌ RAG效果差80% | ⭐⭐ |

---

## 方案A：中转站开通Embedding（推荐）

### 步骤：

1. **登录AICanAPI**
   - 访问：https://aicanapi.com
   - 进入控制台

2. **找到Key配置**
   - 我的密钥 → 选择您的key
   - 模型权限 / 渠道配置

3. **开通Embedding模型**
   需要开通以下任一模型：
   - ✅ `text-embedding-3-small` (推荐，最新)
   - ✅ `text-embedding-ada-002` (经典)
   - ✅ `text-embedding-3-large` (精度更高，成本稍高)

4. **保存并测试**
   ```bash
   # 重新运行脚本
   npx ts-node scripts/embed_knowledge_base.ts
   ```

### 成本估算：
- Embedding成本：$0.02/百万tokens
- 25条知识（约5000字）：< $0.001（不到1分钱）
- 100次对话查询：< $0.01（1分钱）

**结论**：几乎免费 💰

---

## 方案B：使用免费Embedding服务

### 选项1：Voyage AI（免费额度）
- 官网：https://www.voyageai.com/
- 免费：25M tokens/月
- 质量：与OpenAI相当

### 选项2：Jina AI Embeddings（完全免费）
- 官网：https://jina.ai/embeddings/
- 免费：100% 免费
- API：`https://api.jina.ai/v1/embeddings`

### 如何切换：

修改 `.env.local`：
```bash
# 使用Jina AI（免费）
OPENAI_API_KEY=jina_xxxxx  # 从Jina获取
OPENAI_API_BASE=https://api.jina.ai/v1
```

---

## 方案C：临时跳过向量化（不推荐）

如果急需测试系统，可以暂时跳过向量化，使用关键词匹配。

**警告**：这会导致RAG效果下降80%，AI回复质量大幅降低。

### 临时方案：使用现有示例数据

数据库中已经有5条示例数据（SQL脚本插入的），可以先测试聊天功能：

```bash
# 跳过embedding，直接测试
npm run dev
```

然后访问AI聊天界面测试。虽然知识库只有5条，但可以验证系统运行。

---

## 我的建议

### 🎯 最佳选择：方案A

**理由**：
1. ✅ 您已经在用中转站，统一管理最方便
2. ✅ Embedding成本几乎可忽略（< ¥0.1/月）
3. ✅ 无需额外配置

**操作**：
1. 联系AICanAPI客服
2. 说明需要开通embedding模型
3. 通常5分钟内搞定

### 🥈 备选方案：方案B（Jina AI）

如果中转站不支持Embedding：
1. 注册Jina AI（免费）
2. 获取API Key
3. 修改 `.env.local` 中的配置
4. 重新运行脚本

---

## 快速验证embedding是否可用

运行以下测试命令：

```bash
curl https://aicanapi.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "测试文本"
  }'
```

**如果返回200**：✅ 可以使用
**如果返回403**：❌ 需要开通权限

---

## 联系中转站模板

您可以复制以下内容联系AICanAPI客服：

```
您好，

我需要使用OpenAI的Embedding模型进行RAG系统开发。
请帮我的API Key开通以下模型的访问权限：

- text-embedding-3-small

我的Key ID：xxxxx

谢谢！
```

---

**您倾向于哪个方案？告诉我，我帮您继续！** 💪
