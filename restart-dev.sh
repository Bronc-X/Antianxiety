#!/usr/bin/env bash
set -euo pipefail

echo "🔄 正在清理开发环境..."

ports=(3000 3001)

if ! command -v lsof >/dev/null 2>&1; then
  echo "❌ 未找到 lsof，无法自动清理占用端口的进程。"
  echo "   你可以手动删除锁文件后再启动：rm -f .next/dev/lock"
  exit 1
fi

for port in "${ports[@]}"; do
  pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "  ⏹ 终止端口 ${port} 上的进程 PID: ${pids}"
    kill ${pids} 2>/dev/null || true
    sleep 0.3
    for pid in ${pids}; do
      if kill -0 "${pid}" 2>/dev/null; then
        kill -9 "${pid}" 2>/dev/null || true
      fi
    done
  fi
done

lockFile=".next/dev/lock"
if [[ -f "${lockFile}" ]]; then
  rm -f "${lockFile}"
  echo "  🗑 已删除锁文件: ${lockFile}"
fi

sleep 0.5

echo "✅ 清理完成，正在启动开发服务器..."
echo ""

npm run dev

