# Design Document: Documentation Workflow

## Overview

本设计定义了 No More Anxious 项目的文档管理自动化工作流。核心目标是通过 Kiro Hooks 和 Steering 规则实现文档更新的自动化提醒和素材收集，确保开发过程中的每一个亮点都能被记录。

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Documentation Workflow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Kiro Hooks   │───►│ Doc Checker  │───►│ Asset Logger │       │
│  │ (Triggers)   │    │ (Validation) │    │ (Recording)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   Markdown Files                      │       │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────┐    │       │
│  │  │ README.md  │ │ DIARY.md   │ │ MARKETING.md   │    │       │
│  │  └────────────┘ └────────────┘ └────────────────┘    │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Steering Rule: Daily Workflow

**文件**: `.kiro/steering/daily-workflow.md`

定义每日开工和结束的检查清单，作为 always-included 规则注入到所有对话中。

```typescript
interface DailyChecklist {
  startup: {
    readConstitution: boolean;
    checkRecentDiary: boolean;
    reviewPendingAssets: boolean;
  };
  shutdown: {
    updateDiary: boolean;
    checkReadmeNeeded: boolean;
    recordAssets: boolean;
  };
}
```

### 2. Marketing Assets Logger

**文件**: `MARKETING_ASSETS.md`

记录所有待收集和已收集的营销素材。

```typescript
interface MarketingAsset {
  id: string;                    // 唯一标识
  date: string;                  // 记录日期 YYYY-MM-DD
  featureName: string;           // 功能名称
  featureArea: FeatureArea;      // 功能区域
  assetType: AssetType;          // 素材类型
  status: 'TODO' | 'DONE';       // 状态
  description: string;           // 营销描述
  filePath?: string;             // 素材文件路径
  dueDate?: string;              // 截止日期
  isOverdue?: boolean;           // 是否逾期
}

type FeatureArea = 
  | 'bayesian'      // 贝叶斯信念循环
  | 'dashboard'     // 主仪表盘
  | 'ai-assistant'  // AI 助手
  | 'onboarding'    // 引导流程
  | 'settings'      // 设置
  | 'analysis'      // 分析报告
  | 'other';        // 其他

type AssetType = 
  | 'screenshot'    // 截图
  | 'screencast'    // 录屏
  | 'animation'     // 动画 GIF
  | 'description';  // 文字描述
```

### 3. Kiro Hook: Task Completion

**文件**: `.kiro/hooks/doc-reminder.json`

在任务完成时触发文档检查。

```typescript
interface DocReminderHook {
  trigger: 'on-agent-complete';
  action: 'send-message';
  message: string;  // 提醒消息模板
}
```

## Data Models

### Marketing Assets File Structure

```markdown
# 📸 Marketing Assets Log

## 待收集素材 (TODO)

### [日期] 功能名称
- **类型**: screenshot/screencast/animation
- **区域**: bayesian/dashboard/ai-assistant/...
- **描述**: 简短的营销描述
- **状态**: 🔴 TODO
- **截止**: YYYY-MM-DD
- **路径**: (待填写)

## 已收集素材 (DONE)

### [日期] 功能名称
- **类型**: screenshot
- **区域**: bayesian
- **描述**: 贝叶斯信念循环的认知天平动画
- **状态**: ✅ DONE
- **路径**: `public/marketing/bayesian-scale-2025-12-02.png`
```

### Diary Entry Template

```markdown
## YYYY-MM-DD - 标题

### 🎯 核心更新

#### 1. 功能名称
- ✅ 完成项 1
- ✅ 完成项 2

### 📊 代码统计
- **文件变更**: X 个文件
- **新增代码**: X 行
- **删除代码**: X 行

### 🚀 下一步计划
- [ ] 待办 1
- [ ] 待办 2

### 📸 营销素材
- [ ] 截图: 功能名称
- [ ] 录屏: 动画效果
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Template Structure Completeness
*For any* generated template (startup checklist, diary entry, or asset entry), the template SHALL contain all required sections as defined in the data model.
**Validates: Requirements 1.1, 2.1, 2.2**

### Property 2: Asset Entry Completeness
*For any* marketing asset entry, the entry SHALL contain date, featureName, assetType, status, and description fields, all non-empty.
**Validates: Requirements 4.1, 4.4, 5.1, 5.2**

### Property 3: Overdue Detection Accuracy
*For any* asset with status TODO and creation date more than 3 days ago, the asset SHALL be marked as overdue.
**Validates: Requirements 5.4, 6.4**

### Property 4: Reminder Trigger Consistency
*For any* task completion event, if pending TODO assets exist, a reminder message SHALL be generated.
**Validates: Requirements 4.5, 6.1, 6.2**

### Property 5: Asset Categorization Validity
*For any* stored asset, the featureArea and assetType SHALL be valid enum values from the defined types.
**Validates: Requirements 5.3**

### Property 6: Fallback Instruction Presence
*For any* scenario where automatic capture is not possible, manual instructions SHALL be provided in the reminder.
**Validates: Requirements 4.3, 6.3**

## Error Handling

### 无法自动截图时
1. 显示醒目提醒: "⚠️ 请手动截图: [功能名称]"
2. 提供截图路径建议: `public/marketing/[feature]-[date].png`
3. 在 MARKETING_ASSETS.md 中添加 TODO 条目

### 文件写入失败时
1. 在控制台输出错误信息
2. 提示用户手动更新文件
3. 保存待写入内容到剪贴板

### 素材逾期时
1. 在每次会话开始时显示逾期提醒
2. 逾期超过 7 天时升级为 🔴 紧急提醒
3. 在 Diary 中记录逾期状态

## Testing Strategy

### Property-Based Testing

使用 fast-check 库进行属性测试，验证核心逻辑的正确性。

**测试文件**: `lib/__tests__/doc-workflow.property.test.ts`

**测试配置**:
- 每个属性测试运行 100 次迭代
- 使用 `fc.assert` 进行断言
- 每个测试标注对应的 Property 编号

### Unit Testing

**测试范围**:
- 模板生成函数
- 日期计算函数
- 状态转换逻辑
- 文件路径生成

### Integration Testing

**测试场景**:
- 任务完成 → 素材条目创建
- 素材逾期 → 提醒升级
- 手动标记完成 → 状态更新
