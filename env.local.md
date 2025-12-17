# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://hxthvavzdtybkryojudt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dGh2YXZ6ZHR5YmtyeW9qdWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTM4MzIsImV4cCI6MjA3ODMyOTgzMn0.1ENxAvyXikDLGJnk5m6GVE7pXJXzMmJwMaHgWnrX0e8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dGh2YXZ6ZHR5YmtyeW9qdWR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc1MzgzMiwiZXhwIjoyMDc4MzI5ODMyfQ.a7YyGp7P2xYAhhgT2V5JB3GaTWxpzioVaoemcsMA8Zg

# ============================================
# 第三方中转站配置（AICanAPI）
# ============================================
# 支持的模型（Gemini 现有可用）:
#   - gemini-3-pro-preview-thinking
#   - gemini-3-pro-preview-11-2025-thinking
#   - gemini-3-pro-preview
#   - gemini-3-pro-preview-11-2025
#   - text-embedding-3-small (Embedding)

# OpenAI 兼容 API (中转站)
OPENAI_API_KEY=sk-WyvlFFo5QAVpDLFTzU7ul6NhVndZTPewwduYb8Teskl8nm5u
OPENAI_API_BASE=https://aicanapi.com/v1

# 模型配置（代码内已固定优先级为上述 Gemini 顺序，无需在环境变量指定）
# Embedding: text-embedding-3-small
# AI_MODEL=
# AI_MODEL_FALLBACK=
EMBEDDING_MODEL=text-embedding-3-small

# ============================================
# GitHub OAuth（如需登录功能）
# ============================================
GITHUB_CLIENT_ID=Ov23li7WxESxCSWWcVPe
GITHUB_CLIENT_SECRET=Ov23li7WxESxCSWWcVPe

# ============================================
# 其他配置
# ============================================
SEMANTIC_SCHOLAR_API_KEY=

# Cron 任务安全密钥（用于手动触发内容策展）
CRON_SECRET=nma_cron_2024_secret
