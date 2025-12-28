# Implementation Plan: Max Plan Creation Dialog

## Overview

实现 Max 协助制定计划对话系统，包括对话框组件、API 端点、AI 集成和数据持久化。采用增量开发方式，先实现核心功能，再添加高级特性。

## Tasks

- [x] 1. 创建类型定义和数据模型
  - [x] 1.1 创建 MaxPlanDialog 相关类型定义
    - 在 `types/max-plan.ts` 中定义 ChatMessage, PlanItemDraft, DialogState, PlanSession 接口
    - 定义 API 请求/响应类型
    - _Requirements: 3.2, 7.1_

- [x] 2. 实现数据聚合服务
  - [x] 2.1 创建计划数据聚合函数
    - 在 `lib/max/plan-data-aggregator.ts` 中实现用户数据聚合
    - 聚合 inquiry、calibration、HRV 数据
    - 实现数据新鲜度检查（7天阈值）
    - _Requirements: 1.2, 2.1, 2.2_
  - [x] 2.2 编写数据聚合属性测试
    - **Property 1: Data Isolation**
    - **Validates: Requirements 8.1, 8.2**

- [x] 3. 实现问题生成逻辑
  - [x] 3.1 创建问题生成器
    - 在 `lib/max/question-generator.ts` 中实现
    - 根据缺失数据生成问题
    - 实现 3 个问题上限
    - _Requirements: 1.3, 2.1, 2.2, 2.4_
  - [x] 3.2 编写问题生成属性测试
    - **Property 2: Data-Driven Question Generation**
    - **Validates: Requirements 1.2, 1.3, 2.1, 2.2, 2.4**

- [x] 4. 实现 AI 计划生成服务
  - [x] 4.1 创建 AI 计划生成器
    - 在 `lib/max/plan-generator.ts` 中实现
    - 集成 DeepSeek/Gemini API
    - 实现计划生成 prompt
    - 处理 HRV 数据集成
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.2 编写计划生成属性测试
    - **Property 4: Plan Generation Completeness**
    - **Property 5: HRV Data Integration**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 5. 实现计划项替换服务
  - [x] 5.1 创建替换生成器
    - 在 `lib/max/plan-replacer.ts` 中实现
    - 生成同类别不同内容的替换项
    - _Requirements: 4.1, 4.2_
  - [x] 5.2 编写替换属性测试
    - **Property 6: Replacement Consistency**
    - **Validates: Requirements 4.1, 4.2**

- [x] 6. Checkpoint - 确保核心服务测试通过
  - 运行所有属性测试 ✅ 34/34 通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 7. 实现 API 端点
  - [x] 7.1 创建 /api/max/plan-chat 端点
    - 处理 init、respond、generate 动作
    - 集成数据聚合和计划生成服务
    - 实现会话状态管理
    - _Requirements: 1.1, 1.2, 1.4, 2.3, 3.1_
  - [x] 7.2 创建 /api/max/plan-replace 端点
    - 处理单个计划项替换请求
    - _Requirements: 4.1, 4.2_

- [x] 8. 实现 MaxPlanDialog 组件
  - [x] 8.1 创建对话框基础结构
    - 在 `components/max/MaxPlanDialog.tsx` 中实现
    - 实现打开/关闭动画
    - 实现加载状态
    - _Requirements: 1.1_
  - [x] 8.2 实现聊天消息区域
    - 实现消息列表渲染
    - 实现打字动画效果
    - 实现滚动行为
    - _Requirements: 7.2, 7.3_
  - [x] 8.3 实现计划项展示和替换
    - 实现计划项卡片
    - 实现替换按钮和加载状态
    - 实现替换动画
    - _Requirements: 3.5, 4.3, 4.4, 4.5_
  - [x] 8.4 实现确认和保存功能
    - 实现确认按钮
    - 调用保存 API
    - 处理成功/失败状态
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [x] 9. 集成到 PlanDashboard
  - [x] 9.1 更新 PlanDashboard 组件
    - 替换现有的 showNewPlan 模态框
    - 集成 MaxPlanDialog
    - 实现计划创建后刷新
    - _Requirements: 5.3_

- [x] 10. 实现历史计划功能
  - [x] 10.1 增强历史计划显示
    - 确保历史列表包含所有必要字段
    - 实现正确的排序
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 10.2 编写历史显示属性测试
    - **Property 8: History Display Correctness**
    - **Validates: Requirements 6.2, 6.3**

- [x] 11. 实现多语言支持
  - [x] 11.1 添加中英文文案
    - 在 `lib/i18n-dict.ts` 中添加相关翻译
    - 确保 Max 消息支持双语
    - _Requirements: 7.1_
  - [x] 11.2 编写语言偏好属性测试
    - **Property 9: Language Preference Compliance**
    - **Validates: Requirements 7.1, 7.4**

- [x] 12. 实现数据安全和清理
  - [x] 12.1 实现会话清理逻辑
    - 关闭对话框时清理草稿数据
    - 实现未保存数据不持久化
    - _Requirements: 8.3_
  - [x] 12.2 编写保存完整性属性测试
    - **Property 7: Save Data Integrity**
    - **Validates: Requirements 5.2, 8.3**

- [x] 13. Final Checkpoint - 完整功能测试
  - 运行所有测试 ✅ 60/60 通过 (7 个测试文件)
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 所有任务均为必需，包括属性测试
- 使用 DeepSeek 3.2 或 Gemini 3 Flash 作为 AI 模型
- 遵循 California Calm 设计理念，使用温暖、支持性的语调
- 所有 API 端点需要实现 RLS 数据隔离
- 属性测试使用 fast-check 库，最少 100 次迭代
