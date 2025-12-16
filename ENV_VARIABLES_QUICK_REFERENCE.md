# 环境变量快速参考

## 需要在 Cloudflare Pages 中配置的变量

复制以下内容到 Cloudflare Pages 的环境变量配置中：

### 变量 1: DeepSeek API Key

```
变量名: DEEPSEEK_API_KEY
值: sk-df1dcd335c3f43ef94621d654e645088
环境: Production, Preview, Development (全选)
```

### 变量 2: Supabase URL

```
变量名: NEXT_PUBLIC_SUPABASE_URL
值: https://hxthvavzdtybkryojudt.supabase.co
环境: Production, Preview, Development (全选)
```

### 变量 3: Supabase Anon Key

```
变量名: NEXT_PUBLIC_SUPABASE_ANON_KEY
值: sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c
环境: Production, Preview, Development (全选)
```

## 找不到环境变量配置？

### 检查清单：

- [ ] 是否已创建 Cloudflare Pages 项目？
- [ ] 是否进入了项目详情页（点击了项目名称）？
- [ ] 是否点击了顶部的 **Settings** 标签？
- [ ] 是否在 Settings 页面中向下滚动查找？

### 如果还是找不到：

1. **确认项目已创建**：
   - 如果项目还在创建中，可能需要等待创建完成
   - 首次部署失败后，项目仍然存在，可以配置环境变量

2. **检查权限**：
   - 确保你有项目的编辑权限
   - 如果是团队账户，确保你有正确的角色

3. **尝试直接链接**：
   - 项目设置页面的 URL 格式通常是：
   - `https://dash.cloudflare.com/[账户ID]/pages/[项目名称]/settings`

4. **联系支持**：
   - 如果以上方法都不行，可能是账户类型或界面版本的问题
   - 可以联系 Cloudflare 支持

## 配置后的验证

配置环境变量后：

1. **重新部署**：
   - 在 Deployments 页面，点击最新的部署
   - 点击 "Retry deployment" 或 "Redeploy"

2. **检查构建日志**：
   - 查看构建日志，确认没有环境变量相关的错误
   - 如果看到 "DEEPSEEK_API_KEY 未设置" 等错误，说明环境变量未正确配置

3. **测试功能**：
   - 部署成功后，访问网站
   - 测试 AI 聊天功能（访问 `/assistant` 页面）
   - 如果 AI 功能正常，说明环境变量配置成功

