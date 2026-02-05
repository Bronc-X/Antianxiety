#!/bin/bash
# scripts/notify_done.sh
# AntiAnxiety - 任务完成通知脚本

notify_done() {
    local message="${1:-job done}"
    say "$message"
    # 可选：同时发送系统通知
    osascript -e "display notification \"$message\" with title \"AntiAnxiety\""
}

notify_done "$1"
