# GitHub Secrets 配置说明

## ✅ 正确答案：使用 Repository secrets

对于 GitHub Actions 工作流，应该使用 **Repository secrets**（仓库级别），而不是 Environment secrets。

## 📍 配置位置

### Repository secrets（推荐）

1. **进入 GitHub 仓库**
   - 访问：`https://github.com/Bronc-X/project-Nomoreanxious`

2. **进入 Secrets 设置**
   - 点击 **Settings**（设置）
   - 点击左侧菜单 **Secrets and variables** → **Actions**
   - 默认显示的就是 **Repository secrets**（仓库级别）

3. **添加 Secrets**
   - 点击 **New repository secret** 按钮
   - 输入 Name 和 Value
   - 点击 **Add secret**

### Environment secrets（不推荐用于此场景）

- Environment secrets 用于特定环境的部署（如 Production、Staging）
- 需要先创建 Environment，然后配置 Environment secrets
- 对于简单的仓库级别工作流，不需要使用 Environment secrets

## 🔑 需要配置的 Repository Secrets

在 **Repository secrets** 中添加以下 4 个 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `ALIYUN_ACR_USERNAME` | `a15181013617` | ACR 登录用户名 |
| `ALIYUN_ACR_PASSWORD` | 你的 ACR 固定密码 | ACR 登录密码 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hxthvavzdtybkryojudt.supabase.co` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c` | Supabase 匿名密钥 |

## 📝 配置步骤

### 步骤 1: 进入 Repository secrets

1. 仓库页面 → **Settings**
2. 左侧菜单 → **Secrets and variables** → **Actions**
3. 应该看到 **Repository secrets** 部分（默认显示）

### 步骤 2: 添加每个 Secret

1. 点击 **New repository secret**
2. 输入：
   - **Name**: `ALIYUN_ACR_USERNAME`
   - **Secret**: `a15181013617`
3. 点击 **Add secret**
4. 重复添加其他 3 个 Secrets

### 步骤 3: 验证配置

添加完成后，应该能看到 4 个 Repository secrets：
- ✅ `ALIYUN_ACR_USERNAME`
- ✅ `ALIYUN_ACR_PASSWORD`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ⚠️ 重要提示

1. **使用 Repository secrets**：工作流会自动使用 Repository secrets
2. **不要使用 Environment secrets**：除非你创建了 Environment 并在工作流中指定
3. **Secret 名称区分大小写**：确保名称完全一致
4. **Secret 值不会显示**：添加后只能看到名称，看不到值（这是正常的）

## 🔍 如何确认使用的是 Repository secrets

在工作流文件中，使用 `${{ secrets.SECRET_NAME }}` 会自动从 Repository secrets 中读取。

如果使用 Environment secrets，需要在工作流中指定：
```yaml
environment: production  # 需要先创建 Environment
```

我们的工作流没有指定 environment，所以使用的是 Repository secrets。

## ✅ 完成后的下一步

1. ✅ 配置所有 4 个 Repository secrets
2. ⏳ 重新触发 GitHub Actions 构建
3. ⏳ 查看构建结果

---

**现在请配置 Repository secrets，然后重新触发构建！**

