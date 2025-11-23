# 📊 Supabase数据库迁移指南

## 🎯 目标
在Supabase中创建向量数据库表，用于存储和检索代谢健康知识库。

---

## 📋 Step-by-Step操作步骤

### Step 1: 打开Supabase Dashboard
1. 访问：https://supabase.com/dashboard/projects
2. 登录您的账号
3. 选择您的项目（应该已经创建好了）

---

### Step 2: 打开SQL Editor
1. 在左侧菜单找到并点击 **"SQL Editor"**
2. 点击右上角的 **"New Query"** 按钮
3. 会打开一个空白的SQL编辑器

---

### Step 3: 复制SQL脚本
1. 打开项目中的文件：`supabase_vector_knowledge_base.sql`
2. **全选所有内容**（约230行）
3. 复制到剪贴板

---

### Step 4: 执行SQL
1. 将复制的SQL粘贴到Supabase SQL Editor中
2. 点击右下角的 **"Run"** 按钮（或按 `Cmd/Ctrl + Enter`）
3. 等待执行完成（约5-10秒）

---

### Step 5: 验证结果

#### 方法A：在SQL Editor中执行验证查询
粘贴并运行以下SQL：

```sql
-- 1. 检查向量扩展是否启用
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'vector';
-- 应该返回1行：vector | 0.x.x

-- 2. 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('metabolic_knowledge_base', 'chat_conversations', 'chat_sessions');
-- 应该返回3行

-- 3. 检查示例数据
SELECT COUNT(*) as sample_count 
FROM metabolic_knowledge_base;
-- 应该返回5（5条示例数据）

-- 4. 检查函数是否创建
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'match_metabolic%';
-- 应该返回2个函数
```

#### 方法B：查看Table Editor
1. 左侧菜单点击 **"Table Editor"**
2. 应该能看到以下表：
   - ✅ `metabolic_knowledge_base`
   - ✅ `chat_conversations`
   - ✅ `chat_sessions`

---

## 🎉 成功标志

如果看到以下结果，说明迁移成功：

- ✅ `vector` 扩展已启用
- ✅ 3个表已创建
- ✅ 5条示例数据存在
- ✅ 2个检索函数已创建

---

## ❌ 常见问题

### 问题1：执行时报错 "extension vector does not exist"
**原因**：Supabase项目没有启用vector扩展

**解决**：
1. 左侧菜单 → **Database** → **Extensions**
2. 搜索 "vector"
3. 点击启用（Enable）
4. 重新执行SQL脚本

---

### 问题2：报错 "permission denied"
**原因**：权限不足

**解决**：
- 确认您是项目的Owner
- 或者请项目Owner执行此SQL

---

### 问题3：表已存在错误
**原因**：之前已经执行过脚本

**解决**：
- 可以忽略（使用了`IF NOT EXISTS`，不会重复创建）
- 或者先删除旧表：
  ```sql
  DROP TABLE IF EXISTS chat_conversations CASCADE;
  DROP TABLE IF EXISTS chat_sessions CASCADE;
  DROP TABLE IF EXISTS metabolic_knowledge_base CASCADE;
  ```
  然后重新执行完整脚本

---

## 📊 表结构说明

### `metabolic_knowledge_base` - 知识库主表
- **id**: 主键
- **content**: 中文内容
- **content_en**: 英文内容
- **category**: 分类（mechanism/intervention/research等）
- **embedding**: 向量嵌入（1536维）
- **tags**: 标签数组
- **priority**: 优先级
- **usage_count**: 使用次数统计

### `chat_conversations` - 对话历史
- **id**: 主键
- **user_id**: 用户ID（关联profiles表）
- **session_id**: 会话ID（关联chat_sessions表）
- **role**: 角色（user/assistant/system）
- **content**: 对话内容
- **user_feedback**: 用户反馈（helpful/not_helpful）

### `chat_sessions` - 会话管理
- **id**: 会话UUID
- **user_id**: 用户ID
- **title**: 会话标题
- **message_count**: 消息数量
- **last_message_at**: 最后消息时间

---

## 🔐 安全说明

### Row Level Security (RLS)
所有表都启用了RLS策略：

- ✅ 用户只能访问自己的对话记录
- ✅ 知识库对所有认证用户可读
- ✅ 服务端使用SERVICE_ROLE_KEY可绕过RLS

---

## ✅ 完成后

执行成功后，进入下一步：
**Step 4: 导入知识库数据**

运行命令：
```bash
npx ts-node scripts/embed_knowledge_base.ts
```

---

**准备好了吗？告诉我"已执行"继续下一步！** 🚀
