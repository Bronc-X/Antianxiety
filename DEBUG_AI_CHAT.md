# 🔍 AI助理调试指南

## 问题：AI 服务暂时不可用

### 快速诊断步骤

#### Step 1: 查看浏览器Network面板

1. **打开浏览器开发者工具**
   - Mac: `Cmd + Option + I`
   - 或右键 → 检查

2. **切换到 Network 标签**

3. **重新发送消息**，查找 `/api/ai/chat` 请求

4. **点击该请求**，查看：
   - **Status Code**（状态码）：应该是多少？
   - **Response** 标签：具体错误信息是什么？
   - **Headers** → Request Headers：检查是否有Authorization

---

#### Step 2: 查看终端日志

在运行 `npm run dev` 的终端窗口，应该能看到错误信息。

**常见错误**：

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `ANTHROPIC_API_KEY 未设置` | 环境变量未加载 | 重启服务器 |
| `401 Unauthorized` | API Key无效 | 检查.env.local中的key |
| `403 Forbidden` | 模型权限问题 | 检查中转站配置 |
| `Cannot read properties of undefined` | Supabase配置问题 | 检查Supabase环境变量 |

---

#### Step 3: 手动测试API

在终端运行：

```bash
# 测试Claude中转站是否可用
curl https://aicanapi.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**替换 `YOUR_API_KEY_HERE` 为您的实际key**

---

### 可能的问题和解决方案

#### 问题1: 环境变量未加载

**检查命令**：
```bash
# 在项目根目录运行
cat .env.local | grep ANTHROPIC
```

**应该看到**：
```
ANTHROPIC_API_KEY=sk-xxxxx
ANTHROPIC_API_BASE=https://aicanapi.com/v1
```

**如果看不到**：
1. 确认 `.env.local` 文件在项目根目录
2. 确认文件内容正确
3. 重启服务器：
   ```bash
   # 终止进程
   lsof -ti:3000 | xargs kill -9
   # 重新启动
   npm run dev
   ```

---

#### 问题2: API Key无效

**测试命令**（在终端运行）：
```bash
# 获取您的API key
grep ANTHROPIC_API_KEY .env.local

# 测试key是否有效（替换下面的YOUR_KEY）
curl https://aicanapi.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}'
```

**如果返回200**：✅ Key有效
**如果返回401/403**：❌ Key无效或权限不足

---

#### 问题3: Supabase认证问题

**检查用户是否登录**：
1. 在浏览器Console（控制台）运行：
   ```javascript
   const supabase = window.supabase;
   supabase.auth.getUser().then(console.log);
   ```

2. 应该看到用户信息，如果看到 `user: null`，说明未登录

**解决**：重新登录应用

---

#### 问题4: Runtime不兼容

如果看到 `edge runtime` 相关错误，需要修改API路由。

**检查**：
```bash
grep "export const runtime" app/api/ai/chat/route.ts
```

**如果看到 `edge`**，这可能导致问题。

**修复**：将 `route.ts` 中的：
```typescript
export const runtime = 'edge';
```
改为：
```typescript
export const runtime = 'nodejs';
```

---

### 完整环境变量检查清单

#### .env.local 应该包含：

```bash
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Claude API（必需）
ANTHROPIC_API_KEY=sk-xxxxx
ANTHROPIC_API_BASE=https://aicanapi.com/v1

# OpenAI API（用于embedding，当前可选）
OPENAI_API_KEY=sk-xxxxx
OPENAI_API_BASE=https://aicanapi.com/v1

# GitHub OAuth（如需登录）
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

---

### 快速验证脚本

创建文件 `test-api.sh`：

```bash
#!/bin/bash

echo "🔍 检查环境变量..."
if [ ! -f .env.local ]; then
  echo "❌ .env.local 文件不存在"
  exit 1
fi

echo "✅ .env.local 存在"

echo ""
echo "📋 检查必需的环境变量..."

check_env() {
  local var_name=$1
  local value=$(grep "^$var_name=" .env.local | cut -d'=' -f2)
  
  if [ -z "$value" ]; then
    echo "❌ $var_name 未设置"
    return 1
  else
    echo "✅ $var_name 已设置"
    return 0
  fi
}

check_env "ANTHROPIC_API_KEY"
check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "🚀 测试完成！"
```

**运行**：
```bash
chmod +x test-api.sh
./test-api.sh
```

---

### 实时调试

**在代码中添加日志**：

编辑 `app/api/ai/chat/route.ts`，在第95行附近添加：

```typescript
// 检查 Claude API Key
const claudeApiKey = process.env.ANTHROPIC_API_KEY;
const claudeBaseUrl = process.env.ANTHROPIC_API_BASE;

// 添加调试日志
console.log('🔍 Debug Info:');
console.log('- API Key exists:', !!claudeApiKey);
console.log('- API Key prefix:', claudeApiKey?.substring(0, 10));
console.log('- Base URL:', claudeBaseUrl);

if (!claudeApiKey) {
  console.error('❌ ANTHROPIC_API_KEY 未设置');
  return NextResponse.json(
    { error: 'AI 服务未配置，请联系管理员' },
    { status: 500 }
  );
}
```

**重启服务器后**，终端会显示这些调试信息。

---

## 常见解决方案总结

1. **重启服务器**（80%的问题都能解决）
   ```bash
   lsof -ti:3000 | xargs kill -9
   npm run dev
   ```

2. **检查.env.local**
   - 文件位置：项目根目录
   - 包含所有必需的环境变量
   - 没有拼写错误

3. **验证API Key**
   - 登录中转站查看key状态
   - 测试key是否有效
   - 确认开通了Claude模型

4. **清除缓存**
   ```bash
   rm -rf .next
   npm run dev
   ```

---

**需要更多帮助？** 告诉我：
1. 浏览器Network面板的错误信息
2. 终端的错误日志
3. .env.local的配置（隐藏敏感信息）
