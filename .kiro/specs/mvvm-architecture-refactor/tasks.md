# Implementation Plan: MVVM Architecture Refactor

## Overview

本任务清单将 No More Anxious 应用重构为 MVVM 三层分离架构。以 Dashboard 功能为示范模块，建立可复用的架构模式。

## Tasks

- [x] 1. 建立基础架构和类型定义
  - [x] 1.1 创建 `types/architecture.ts` 定义核心类型接口
    - 定义 `ActionResult<T>` 通用返回类型
    - 定义 `DomainHookReturn<T>` 基础接口
    - _Requirements: 1.4, 7.1, 7.2_

  - [x] 1.2 创建 `hooks/domain/` 目录结构
    - 创建 `hooks/domain/index.ts` barrel export
    - _Requirements: 2.1_

  - [x] 1.3 创建 `components/desktop/` 和 `components/mobile/` 目录结构
    - 创建各目录的 `index.ts` barrel export
    - _Requirements: 3.1_

  - [x] 1.4 创建 `lib/device-detection.ts` 设备检测工具
    - 实现 `isMobileUserAgent(userAgent: string | null): boolean` 函数
    - 实现 `isCapacitorMobile(headers: Headers): boolean` 检测 Capacitor 平台
    - _Requirements: 4.1, 4.7_

  - [x] 1.5 创建 `lib/dto-utils.ts` DTO 转换工具
    - 实现 `toSerializable<T>(obj: T): T` 确保对象可序列化
    - 实现 `dateToISO(date: Date | string): string` 日期转换
    - _Requirements: 7.6, 7.7_

- [x] 2. 实现 Dashboard Server Actions (The Brain)
  - [x] 2.1 创建 `app/actions/dashboard.ts`
    - 实现 `getDashboardData()` 获取 profile、weeklyLogs、hardwareData
    - 实现 `syncProfile()` 触发 profile 聚合
    - 所有函数返回 `ActionResult<T>` 格式
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2_

  - [ ]* 2.2 编写 Server Action 属性测试
    - **Property 2: ActionResult Format Consistency**
    - **Validates: Requirements 1.4**

  - [ ]* 2.3 编写序列化边界属性测试
    - **Property 9: Serialization Boundary Compliance**
    - **Validates: Requirements 7.6, 7.7**

- [x] 3. 实现 Dashboard Domain Hook (The Bridge)
  - [x] 3.1 创建 `hooks/domain/useDashboard.ts`
    - 使用 SWR 调用 `getDashboardData` Server Action
    - 管理 `isLoading`, `isSyncing`, `isOffline`, `error` 状态
    - 实现 `sync()` 和 `refresh()` 方法
    - 导出 `UseDashboardReturn` 类型接口
    - _Requirements: 2.2, 2.3, 2.4, 5.3, 5.4_

  - [ ]* 3.2 编写 Domain Hook 属性测试
    - **Property 3: Domain Hook Interface Pattern**
    - **Validates: Requirements 2.3, 2.4, 5.3, 5.4**

  - [ ]* 3.3 编写离线缓存属性测试
    - **Property 4: Offline Caching Behavior**
    - **Validates: Requirements 2.5, 6.2**

- [x] 4. 实现 Dashboard Presentational Components (The Skin)
  - [x] 4.1 创建 `components/desktop/Dashboard.tsx`
    - 接收 `UseDashboardReturn` 作为 props
    - 使用 Shadcn UI 组件，grid 布局
    - 实现 loading skeleton、error state、data display
    - _Requirements: 3.2, 3.3, 3.4, 5.5_

  - [x] 4.2 创建 `components/mobile/Dashboard.tsx`
    - 接收 `UseDashboardReturn` 作为 props
    - 使用 Framer Motion 动画和 haptic feedback
    - 实现 Lottie loading、offline banner、card animations
    - _Requirements: 3.2, 3.3, 3.5, 5.6, 6.3_

  - [ ]* 4.3 编写组件隔离属性测试
    - **Property 5: Presentational Component Isolation**
    - **Validates: Requirements 3.2, 3.3**

- [x] 5. 实现 Page Router 分流
  - [x] 5.1 重构 `app/dashboard/page.tsx` 为 Server Component
    - 添加 `export const dynamic = 'force-dynamic'` 防止缓存
    - 使用 `headers()` 获取 User-Agent 和 X-Capacitor-Platform
    - 优先使用 Capacitor header，fallback 到 User-Agent 检测
    - 传递 `isMobile` prop 给 Client Component
    - _Requirements: 4.1, 4.5, 4.6, 4.7_

  - [x] 5.2 创建 `app/dashboard/DashboardClient.tsx`
    - 调用 `useDashboard()` hook
    - 根据 `isMobile` 渲染 Desktop 或 Mobile 组件
    - _Requirements: 4.2, 4.3_

  - [ ]* 5.3 编写设备路由属性测试
    - **Property 6: Device-Based Routing**
    - **Validates: Requirements 4.1, 4.2, 4.4**

  - [ ]* 5.4 编写缓存绕过属性测试
    - **Property 10: Cache Bypass for Device Detection**
    - **Validates: Requirements 4.6**

- [ ] 6. Checkpoint - 验证 Dashboard 重构
  - Ensure all tests pass, ask the user if questions arise.
  - 手动测试 Desktop 和 Mobile 视图
  - 验证数据加载、同步、离线功能

- [ ] 7. 实现层隔离验证
  - [ ]* 7.1 编写层隔离属性测试
    - **Property 1: Layer Isolation - No UI Imports in Logic Layers**
    - **Validates: Requirements 1.2, 2.6**

  - [ ]* 7.2 编写同步状态管理属性测试
    - **Property 7: Sync State Management**
    - **Validates: Requirements 5.7**

  - [ ]* 7.3 编写错误传播属性测试
    - **Property 8: Error Propagation Chain**
    - **Validates: Requirements 7.4**

  - [ ]* 7.4 编写乐观更新回滚属性测试
    - **Property 11: Optimistic Update Rollback**
    - **Validates: Requirements 8.4**

- [ ] 8. Final Checkpoint - 完成架构重构
  - Ensure all tests pass, ask the user if questions arise.
  - 验证所有 11 个正确性属性测试通过
  - 确认 Dashboard 功能在 Desktop 和 Mobile 上正常工作

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 本任务清单以 Dashboard 为示范模块，完成后可复制模式到其他功能
- 每个 Property Test 对应设计文档中的一个正确性属性
- 建议按顺序执行，确保每层完成后再进入下一层
