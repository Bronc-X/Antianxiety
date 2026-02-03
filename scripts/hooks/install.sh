#!/usr/bin/env bash
set -euo pipefail

git config core.hooksPath .githooks

echo "✅ 已启用 .githooks (core.hooksPath)"
