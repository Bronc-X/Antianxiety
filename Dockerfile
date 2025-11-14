# 多阶段构建，优化镜像大小
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置环境变量（构建时需要的）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# 验证环境变量是否设置
RUN if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then \
      echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL build arg is not set!"; \
      exit 1; \
    fi && \
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then \
      echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY build arg is not set!"; \
      exit 1; \
    fi && \
    echo "✅ Build args are set" && \
    echo "NEXT_PUBLIC_SUPABASE_URL length: $(echo -n "$NEXT_PUBLIC_SUPABASE_URL" | wc -c)" && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY length: $(echo -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | wc -c)"

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# 构建应用
RUN echo "🚀 Starting Next.js build..." && \
    npm run build && \
    echo "✅ Build completed successfully"

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
