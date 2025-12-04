---
inclusion: fileMatch
fileMatchPattern: "components/**/*.tsx,app/**/*.tsx"
---

# Marketing Asset Capture Rules

> 营销素材收集规则 - 当修改 UI 组件或页面时自动提醒

---

## 🎯 触发条件

当你完成以下类型的工作时，需要收集营销素材：

### 必须截图 📷
- 新增页面 (`app/**/page.tsx`)
- 新增 UI 组件 (`components/**/*.tsx`)
- 修改主要界面布局
- 新增表单或交互元素
- 修改颜色/主题/品牌元素

### 必须录屏 🎬
- 新增动画效果 (Framer Motion)
- 新增交互反馈 (Haptics)
- 新增加载状态 (Lottie)
- 新增过渡效果 (AnimatePresence)
- 新增手势交互 (拖拽、滑动)

### 建议记录 📝
- 新增 API 端点的使用示例
- 新增数据可视化图表
- 新增错误处理界面

---

## 📋 素材收集流程

### 1. 功能完成后立即执行

```
功能开发完成
    ↓
判断是否需要素材
    ↓
├── 需要截图 → 打开浏览器 → 截图 → 保存到 public/marketing/
├── 需要录屏 → 打开录屏工具 → 录制 → 保存到 public/marketing/
└── 无法立即执行 → 添加 TODO 到 MARKETING_ASSETS.md
    ↓
更新 MARKETING_ASSETS.md 状态
```

### 2. 无法自动截图时的手动指令

如果当前环境无法截图（如 SSH 远程开发），请执行以下步骤：

1. **添加 TODO 条目**
   ```markdown
   ### YYYY-MM-DD 功能名称
   - **类型**: 📷 screenshot
   - **区域**: [bayesian/dashboard/ai-assistant/onboarding/settings/analysis/other]
   - **描述**: 简短描述这个素材展示什么
   - **状态**: 🔴 TODO
   - **截止**: YYYY-MM-DD (3天后)
   - **路径**: `public/marketing/[area]/[feature]-[date].png`
   ```

2. **设置提醒**
   - 在下次本地开发时优先处理
   - 逾期超过3天会在每次会话开始时提醒

---

## 🗂️ 素材分类

| 区域 | 说明 | 示例 |
|------|------|------|
| `bayesian` | 贝叶斯信念循环相关 | 认知天平、证据雨、焦虑曲线 |
| `dashboard` | 主仪表盘相关 | 能量卡片、任务列表、每日校准 |
| `ai-assistant` | AI 助手相关 | 对话界面、方案生成、记忆系统 |
| `onboarding` | 引导流程相关 | 登录、注册、问卷、升级 |
| `settings` | 设置页面相关 | 个人信息、AI 调优、社交绑定 |
| `analysis` | 分析报告相关 | 健康报告、趋势图、洞察 |
| `other` | 其他 | 路演、营销页面 |

---

## 📁 文件命名规范

### 截图
```
public/marketing/[area]/[feature-name]-[date].png
```
示例: `public/marketing/bayesian/fear-input-slider-2025-12-02.png`

### 录屏
```
public/marketing/[area]/[feature-name]-[date].mp4
```
示例: `public/marketing/bayesian/evidence-rain-animation-2025-12-02.mp4`

### GIF 动画
```
public/marketing/[area]/[feature-name]-[date].gif
```
示例: `public/marketing/dashboard/breathing-exercise-2025-12-02.gif`

---

## ⚠️ 重要提醒

### 完成 UI 任务后必须检查

当你完成一个涉及 UI 的 spec 任务后，请回答以下问题：

1. **这个功能有新的界面吗？** → 需要截图
2. **这个功能有动画效果吗？** → 需要录屏
3. **这个功能是用户可见的亮点吗？** → 需要营销描述

如果任何一个答案是"是"，请立即：
- 截图/录屏并保存
- 或添加 TODO 到 `MARKETING_ASSETS.md`

### 不要拖延！

素材收集的最佳时机是功能刚完成时：
- 开发环境还在运行
- 测试数据还在
- 记忆最清晰

拖延会导致：
- 忘记功能细节
- 需要重新设置测试数据
- 素材质量下降
