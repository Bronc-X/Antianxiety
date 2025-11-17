#!/bin/bash

# 阿里云 Docker 镜像构建和推送脚本

# 配置变量（请根据实际情况修改）
REGISTRY="registry.cn-hangzhou.aliyuncs.com"  # 根据你的地域修改
NAMESPACE="your-namespace"  # 替换为你的命名空间
IMAGE_NAME="nomoreanxious"
VERSION="latest"

# 完整的镜像地址
FULL_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

echo "🚀 开始构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo "✅ 构建成功！"

echo "🏷️  标记镜像..."
docker tag ${IMAGE_NAME}:${VERSION} ${FULL_IMAGE_NAME}

echo "📤 推送镜像到阿里云 ACR..."
docker push ${FULL_IMAGE_NAME}

if [ $? -ne 0 ]; then
    echo "❌ 推送失败！请检查："
    echo "   1. 是否已登录 ACR: docker login ${REGISTRY}"
    echo "   2. 命名空间是否正确: ${NAMESPACE}"
    exit 1
fi

echo "✅ 推送成功！"
echo "📦 镜像地址: ${FULL_IMAGE_NAME}"
echo ""
echo "下一步："
echo "1. 在 SAE 控制台创建应用"
echo "2. 使用镜像地址: ${FULL_IMAGE_NAME}"
echo "3. 配置环境变量"
echo "4. 部署应用"

