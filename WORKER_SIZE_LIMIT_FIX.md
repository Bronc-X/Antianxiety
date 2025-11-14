# Cloudflare Worker 大小限制问题解决方案

## 问题

构建成功，但部署失败：
```
Error: Your Worker exceeded the size limit of 3 MiB. 
Please upgrade to a paid plan to deploy Workers up to 10 MiB.
```

## 解决方案

### 方案 1: 启用 nodejs_compat 兼容标志（已添加）

已在 `wrangler.toml` 中添加 `compatibility_flags = ["nodejs_compat"]`，这可能会帮助优化。

### 方案 2: 优化 Next.js 配置（已添加）

已在 `next.config.ts` 中添加：
- `output: 'standalone'` - 优化输出
- `optimizePackageImports` - 优化包导入，减少 bundle 大小

### 方案 3: 升级到付费计划

如果优化后仍然超过限制，可以：
1. 升级到 Cloudflare 付费计划（$5/月起）
2. 获得 10 MiB 的 Worker 大小限制

### 方案 4: 代码分割和优化

可以考虑：
1. 使用动态导入（dynamic imports）延迟加载大型组件
2. 移除未使用的依赖
3. 优化图片和静态资源

## 当前状态

- ✅ 构建成功
- ✅ 所有页面生成成功
- ❌ Worker 大小超过 3 MiB 限制

## 下一步

1. **推送最新更改**（包含 nodejs_compat 和优化配置）
2. **重新部署**，看看是否能够减少大小
3. **如果仍然超过限制**，考虑升级到付费计划或进一步优化代码

## 重要提示

Cloudflare Pages 的 Worker 大小限制：
- **免费计划**: 3 MiB
- **付费计划**: 10 MiB

当前 Worker 大小约为 12.8 MiB（从日志看），超过了免费计划限制。

