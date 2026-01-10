---
description: Project Constitution - Core Rules
---

# 项目宪法 / Project Constitution

## 🔔 第一条 / Rule #1: Voice Notification

**每个任务完成时，必须播放声音提示：**

```bash
say -v Samantha "Master, job done"
```

This is a **MANDATORY** rule. Execute this command when:
- A task is completed
- Before calling `notify_user` to inform the user of completion
- When interrupted by user and switching tasks

**DO NOT** adjust system volume. Just play the notification.

## 👁️ 第二条 / Rule #2: Context Awareness

**每次任务前必须读取已打开工作区的文件**

**Before starting any task, you MUST read the files currently open in the active workspace to understand the user's focus.**
