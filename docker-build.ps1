# Aliyun Docker Image Build and Push Script (PowerShell)

# Configuration variables (modify according to your actual situation)
# Note: Personal Edition ACR has different login address format
$REGISTRY = "crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com"  # Personal Edition ACR address
$NAMESPACE = "nomoreanxious"  # Your namespace
$IMAGE_NAME = "nomoreanxious"  # Your repository name
$VERSION = "latest"

# Full image address
$FULL_IMAGE_NAME = "${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

# Build arguments (required for Next.js build)
# ⚠️ 安全提示：请从环境变量读取，不要硬编码敏感信息
# 建议使用：$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
#          $SUPABASE_ANON_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY) {
    Write-Host "错误：请先设置环境变量 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Docker image build..." -ForegroundColor Green
Write-Host "Build arguments:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_SUPABASE_URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY: [hidden]" -ForegroundColor Gray

docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" `
  -t "${IMAGE_NAME}:${VERSION}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

Write-Host "Tagging image..." -ForegroundColor Yellow
docker tag "${IMAGE_NAME}:${VERSION}" $FULL_IMAGE_NAME

Write-Host "Pushing image to Aliyun ACR..." -ForegroundColor Yellow
docker push $FULL_IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed! Please check:" -ForegroundColor Red
    Write-Host "   1. Have you logged in to ACR: docker login $REGISTRY" -ForegroundColor Yellow
    Write-Host "   2. Is the namespace correct: $NAMESPACE" -ForegroundColor Yellow
    exit 1
}

Write-Host "Push successful!" -ForegroundColor Green
Write-Host "Image address: $FULL_IMAGE_NAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create application in SAE console"
Write-Host "2. Use image address: $FULL_IMAGE_NAME"
Write-Host "3. Configure environment variables"
Write-Host "4. Deploy application"
