# Implementation Plan: Max Plan Dialog Fixes

## Overview

修复 Max 计划对话框的五个核心问题：消息重复、层级问题、问题针对性不足、确认按钮设计问题、以及语言混合问题。采用增量修复方式，每个问题独立修复并测试。

## Tasks

- [-] 1. 实现消息去重机制
  - [x] 1.1 创建消息去重工具函数
    - 在 `lib/max/message-deduplicator.ts` 中实现
    - 实现 ID 去重和内容哈希去重
    - 实现 `isDuplicate` 和 `markDisplayed` 方法
    - _Requirements: 1.1, 1.4_
  - [ ] 1.2 编写消息去重属性测试
    - **Property 1: Message Uniqueness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - [x] 1.3 集成去重逻辑到 MaxPlanDialog
    - 修改 `components/max/MaxPlanDialog.tsx`
    - 在 `showMessageWithTyping` 中添加去重检查
    - 在 `handleOptionSelect` 中防止重复用户消息
    - _Requirements: 1.2, 1.3, 1.5_

- [x] 2. 修复对话框层级问题
  - [x] 2.1 更新对话框 z-index 和 Portal
    - 修改 `components/max/MaxPlanDialog.tsx`
    - 将 z-index 从 50 提升到 9999
    - 确保背景遮罩覆盖所有元素
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Checkpoint - 验证去重和层级修复
  - 手动测试消息不再重复
  - 验证对话框在所有元素之上

- [ ] 4. 增强自适应问题生成
  - [ ] 4.1 创建用户数据画像分析器
    - 在 `lib/max/user-profile-analyzer.ts` 中实现
    - 聚合所有用户数据源
    - 识别数据缺口
    - _Requirements: 3.1, 3.2_
  - [ ] 4.2 编写数据感知问题生成属性测试
    - **Property 2: Data-Aware Question Generation**
    - **Validates: Requirements 3.2, 3.3, 3.4**
  - [ ] 4.3 更新问题生成器
    - 修改 `lib/max/question-generator.ts`
    - 集成用户画像分析
    - 避免询问已有数据
    - _Requirements: 3.3, 3.4_
  - [ ] 4.4 编写问题数量边界属性测试
    - **Property 3: Question Count Bounds**
    - **Validates: Requirements 3.5, 3.6**

- [x] 5. 优化确认按钮设计
  - [x] 5.1 更新确认按钮样式和定位
    - 修改 `components/max/MaxPlanDialog.tsx`
    - 使用 sticky 定位固定在底部
    - 设置最小高度 48px
    - 添加适当的内边距
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

- [ ] 6. 实现语言一致性
  - [x] 6.1 创建语言锁定服务
    - 在 `lib/max/language-lock.ts` 中实现
    - 实现会话语言锁定
    - 从 i18n context 获取语言，而非浏览器头
    - _Requirements: 5.5, 5.6_
  - [ ] 6.2 编写语言一致性属性测试
    - **Property 4: Language Consistency**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**
  - [x] 6.3 集成语言锁定到对话框和 API
    - 修改 `components/max/MaxPlanDialog.tsx`
    - 修改 `app/api/max/plan-chat/route.ts`
    - 确保所有消息使用锁定的语言
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Final Checkpoint - 完整功能测试
  - 运行所有属性测试
  - 验证五个问题全部修复
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 修复基于现有代码，保持向后兼容
- 属性测试使用 fast-check 库，最少 100 次迭代
- 遵循 California Calm 设计理念
- 所有 UI 文本需要支持中英文

