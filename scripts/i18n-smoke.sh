#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3467}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

PORT="$PORT" npm run start >/tmp/next-start.log 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 60); do
  if curl -fsS "http://localhost:${PORT}/_not-found" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

fetch() {
  local lang="$1"
  local url="$2"
  curl -fsSL -H "Cookie: app_language=${lang}" "http://localhost:${PORT}${url}"
}

assert_contains() {
  local name="$1"
  local hay="$2"
  local needle="$3"
  if ! grep -Fq "$needle" <<<"$hay"; then
    echo "FAIL: ${name} expected to contain: ${needle}" >&2
    exit 1
  fi
  echo "OK: ${name}"
}

INS_ZH="$(fetch zh /insights)"
INS_TW="$(fetch zh-TW /insights)"
INS_EN="$(fetch en /insights)"
assert_contains "/insights zh" "$INS_ZH" "健康产业是"
assert_contains "/insights zh-TW" "$INS_TW" "健康產業是"
assert_contains "/insights en" "$INS_EN" "The health industry"

METH_ZH="$(fetch zh /methodology)"
METH_TW="$(fetch zh-TW /methodology)"
METH_EN="$(fetch en /methodology)"
assert_contains "/methodology zh" "$METH_ZH" "解决思路"
assert_contains "/methodology zh-TW" "$METH_TW" "解決思路"
assert_contains "/methodology en" "$METH_EN" "Methodology"

ABOUT_ZH="$(fetch zh /about)"
ABOUT_TW="$(fetch zh-TW /about)"
ABOUT_EN="$(fetch en /about)"
assert_contains "/about zh" "$ABOUT_ZH" "关于我们"
assert_contains "/about zh-TW" "$ABOUT_TW" "關於我們"
assert_contains "/about en" "$ABOUT_EN" "About Us"

PRICING_ZH="$(fetch zh /pricing)"
PRICING_TW="$(fetch zh-TW /pricing)"
PRICING_EN="$(fetch en /pricing)"
assert_contains "/pricing zh" "$PRICING_ZH" "科学对抗焦虑"
assert_contains "/pricing zh-TW" "$PRICING_TW" "科學對抗焦慮"
assert_contains "/pricing en" "$PRICING_EN" "Fight Anxiety with Science"

echo "SMOKE_OK"
