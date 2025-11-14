# GitHub Actions 构建错误修复指南

## ❌ 当前错误

```
Error: buildx failed with: ERROR: failed to build: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
```

## 🔍 错误分析

这个错误表示 `npm run build` 在 Docker 构建过程中失败了。可能的原因：

1. **环境变量未正确传递**（最常见）
2. **代码编译错误**（TypeScript/JavaScript 错误）
3. **依赖问题**（npm install 失败或缺少依赖）
4. **内存不足**（构建过程需要更多内存）

## ✅ 解决步骤

### 步骤 1: 检查 GitHub Secrets（最重要）

1. **进入 GitHub 仓库**
   - 访问：`https://github.com/Bronc-X/project-Nomoreanxious`
   - 点击 **Settings** → **Secrets and variables** → **Actions**
   - 确认显示的是 **Repository secrets**（不是 Environment secrets）

2. **确认以下 4 个 Secrets 都已配置**：

   | Secret 名称 | 值 | 状态 |
   |------------|-----|------|
   | `ALIYUN_ACR_USERNAME` | `a15181013617` | ⬜ |
   | `ALIYUN_ACR_PASSWORD` | 你的 ACR 固定密码 | ⬜ |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://hxthvavzdtybkryojudt.supabase.co` | ⬜ |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c` | ⬜ |

3. **如果未配置，立即添加**：
   - 点击 **New repository secret**
   - 输入 Name 和 Value（注意：Secret 名称区分大小写）
   - 点击 **Add secret**

### 步骤 2: 查看详细的构建日志

1. **进入 GitHub Actions**
   - 在仓库页面，点击 **Actions** 标签
   - 点击失败的构建运行（最新的）

2. **查看构建步骤**
   - 点击 **"Verify secrets are set"** 步骤（新增的）
     - 如果显示 ❌，说明 Secrets 未配置
   - 点击 **"Build and push Docker image"** 步骤
     - 展开查看详细输出

3. **查找具体错误**
   - 查找 `npm run build` 的输出
   - 查找 `ERROR`、`Failed`、`Type error` 等关键字
   - 查找具体的错误信息

### 步骤 3: 常见错误和解决方法

#### 错误 1: Secrets 未配置

**错误信息**：
```
❌ ERROR: NEXT_PUBLIC_SUPABASE_URL secret is not set!
```

**解决方法**：
- 确保所有 4 个 Repository secrets 都已配置
- 检查 Secret 名称是否正确（区分大小写）
- 确保使用的是 Repository secrets，不是 Environment secrets

#### 错误 2: 环境变量未传递到 Docker

**错误信息**：
```
❌ ERROR: NEXT_PUBLIC_SUPABASE_URL build arg is not set!
```

**解决方法**：
- 检查 GitHub Secrets 是否已配置
- 检查工作流文件中的 `build-args` 是否正确
- 确保 Secret 名称与工作流中的引用一致

#### 错误 3: Next.js 构建错误

**错误信息**：
```
Error occurred prerendering page "/signup"...
Type error: ...
```

**解决方法**：
- 在本地运行 `npm run build` 测试
- 检查代码是否有 TypeScript 错误
- 查看构建日志中的具体错误信息

#### 错误 4: 依赖问题

**错误信息**：
```
npm ERR! ...
Cannot find module...
```

**解决方法**：
- 检查 `package.json` 是否正确
- 检查 `package-lock.json` 是否存在
- 确保所有依赖都已正确安装

#### 错误 5: 内存不足

**错误信息**：
```
JavaScript heap out of memory
```

**解决方法**：
- 在 Dockerfile 中增加 Node.js 内存限制
- 优化构建过程（减少并发）

## 🔧 已实施的改进

我已经更新了工作流和 Dockerfile，添加了：

1. **验证步骤**：在构建前检查 Secrets 是否已配置
2. **调试输出**：显示环境变量的长度（不显示实际值，保护隐私）
3. **错误提示**：如果环境变量缺失，会显示明确的错误信息

## 📝 下一步操作

### 如果 Secrets 未配置

1. **立即配置所有 4 个 Repository secrets**
2. **重新触发构建**：
   - 进入 Actions
   - 选择工作流
   - 点击 **Run workflow**

### 如果 Secrets 已配置但仍失败

1. **查看详细日志**：
   - 查看 "Verify secrets are set" 步骤的输出
   - 查看 "Build and push Docker image" 步骤的详细输出
   - 找到 `npm run build` 的具体错误信息

2. **告诉我错误信息**：
   - 复制完整的错误信息
   - 特别是 `npm run build` 的输出
   - 我会帮你进一步诊断

### 本地测试

在本地测试构建：

```bash
# 设置环境变量
$env:NEXT_PUBLIC_SUPABASE_URL="https://hxthvavzdtybkryojudt.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c"

# 运行构建
npm run build
```

如果本地构建成功，问题可能是 GitHub Secrets 配置问题。
如果本地构建也失败，问题可能是代码或依赖问题。

## 🆘 需要的信息

请提供以下信息：

1. **GitHub Secrets 状态**：
   - [ ] `ALIYUN_ACR_USERNAME` 已配置
   - [ ] `ALIYUN_ACR_PASSWORD` 已配置
   - [ ] `NEXT_PUBLIC_SUPABASE_URL` 已配置
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已配置

2. **构建日志中的具体错误**：
   - "Verify secrets are set" 步骤的输出
   - "Build and push Docker image" 步骤中 `npm run build` 的完整输出
   - 特别是错误信息部分

3. **本地构建测试**：
   - 在本地运行 `npm run build` 是否成功？

---

**请先检查 GitHub Secrets，然后查看详细的构建日志，告诉我具体的错误信息！**

