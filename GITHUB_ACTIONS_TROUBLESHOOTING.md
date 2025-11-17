# GitHub Actions 构建失败排查指南

## ❌ 当前错误
```
buildx failed with: ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
```

## 🔍 排查步骤

### 步骤 1: 检查 GitHub Secrets（最重要）

1. **进入 GitHub 仓库**
   - 访问：`https://github.com/Bronc-X/project-Nomoreanxious`
   - 点击 **Settings** → **Secrets and variables** → **Actions**

2. **确认以下 4 个 Secrets 都已配置**：

   | Secret 名称 | 值 | 状态 |
   |------------|-----|------|
   | `ALIYUN_ACR_USERNAME` | `a15181013617` | ⬜ 已配置 |
   | `ALIYUN_ACR_PASSWORD` | 你的 ACR 密码 | ⬜ 已配置 |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://hxthvavzdtybkryojudt.supabase.co` | ⬜ 已配置 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c` | ⬜ 已配置 |

3. **如果未配置，立即添加**：
   - 点击 **New repository secret**
   - 输入 Name 和 Value
   - 点击 **Add secret**

### 步骤 2: 查看详细的构建日志

1. **进入 GitHub Actions**
   - 在仓库页面，点击 **Actions** 标签
   - 点击失败的构建运行（最新的）

2. **查看构建步骤**
   - 点击 **"Build and push Docker image"** 步骤
   - 展开查看详细输出

3. **查找错误信息**
   - 查找 `npm run build` 的输出
   - 查找 `ERROR` 或 `Failed` 关键字
   - 查找具体的错误信息（可能是 TypeScript 错误、依赖错误等）

### 步骤 3: 常见错误和解决方法

#### 错误 1: 环境变量未找到

**错误信息**：
```
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables...
```

**解决方法**：
- 确保 GitHub Secrets 已配置
- 检查 Secret 名称是否正确（区分大小写）

#### 错误 2: TypeScript 编译错误

**错误信息**：
```
Type error: ...
```

**解决方法**：
- 检查代码是否有 TypeScript 错误
- 在本地运行 `npm run build` 测试

#### 错误 3: 依赖安装失败

**错误信息**：
```
npm ERR! ...
```

**解决方法**：
- 检查 `package.json` 是否正确
- 检查 `package-lock.json` 是否存在

#### 错误 4: 内存不足

**错误信息**：
```
JavaScript heap out of memory
```

**解决方法**：
- 增加构建内存限制（在 Dockerfile 中）

## 🔧 快速修复

### 如果 Secrets 未配置

1. **立即配置所有 4 个 Secrets**
2. **重新触发构建**：
   - 进入 Actions
   - 选择工作流
   - 点击 **Run workflow**

### 如果 Secrets 已配置但仍失败

1. **查看详细日志**，找到具体错误
2. **告诉我错误信息**，我会帮你进一步诊断

## 📝 需要的信息

请提供以下信息：

1. **GitHub Secrets 状态**：
   - [ ] `ALIYUN_ACR_USERNAME` 已配置
   - [ ] `ALIYUN_ACR_PASSWORD` 已配置
   - [ ] `NEXT_PUBLIC_SUPABASE_URL` 已配置
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置

2. **构建日志中的具体错误**：
   - 复制 `npm run build` 步骤的完整输出
   - 特别是错误信息部分

3. **本地构建测试**：
   - 在本地运行 `npm run build` 是否成功？

## 🆘 下一步

1. **先检查 GitHub Secrets**：确保所有 4 个都已配置
2. **查看构建日志**：找到具体的错误信息
3. **告诉我结果**：我会帮你进一步诊断和修复

---

**请先检查 GitHub Secrets，然后查看详细的构建日志，告诉我具体的错误信息！**

