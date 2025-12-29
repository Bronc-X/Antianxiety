# Requirements Document

## Introduction

本项目旨在重构 No More Anxious 应用的架构，采用 MVVM（Model-View-ViewModel）三层分离模式，解决 Next.js App Router + Capacitor 组合中 Server/Client Component 混乱导致的"功能丢失"问题。

核心目标是将业务逻辑（The Brain）、状态管理（The Bridge）和 UI 展示（The Skin）完全分离，使得：
1. PC 端和移动端可以共享同一套业务逻辑
2. 移动端可以自由使用 Framer Motion、Lottie 等酷炫动画而不影响核心功能
3. 功能代码可以被单元测试覆盖，确保"功能永不丢失"

## Glossary

- **Server_Action**: Next.js 的服务端函数，使用 `'use server'` 标记，负责与 Supabase、AI API 等后端服务交互
- **Domain_Hook**: 领域层的 Custom Hook，封装业务逻辑和状态管理，调用 Server Actions
- **Presentational_Component**: 纯展示组件，只负责渲染 UI，通过 props 接收数据和回调函数
- **The_Brain**: 第一层架构，包含所有 Server Actions 和 Services，无 UI 代码
- **The_Bridge**: 第二层架构，包含 Domain Hooks，连接 Brain 和 Skin
- **The_Skin**: 第三层架构，包含 Desktop 和 Mobile 两套 Presentational Components
- **Feature_Module**: 一个完整的功能模块，包含 action、hook、desktop component、mobile component 四个文件

## Requirements

### Requirement 1: Server Actions 层（The Brain）

**User Story:** As a developer, I want all backend interactions encapsulated in Server Actions, so that business logic is testable and reusable across platforms.

#### Acceptance Criteria

1. THE Server_Action layer SHALL be located in `app/actions/` directory with feature-based file naming (e.g., `dashboard.ts`, `calibration.ts`)
2. WHEN a Server_Action is created, THE Server_Action SHALL use `'use server'` directive and contain zero UI-related imports
3. THE Server_Action SHALL handle all Supabase queries, AI API calls, and external service interactions
4. WHEN a Server_Action encounters an error, THE Server_Action SHALL return a typed result object with `{ success: boolean; data?: T; error?: string }` format
5. THE Server_Action SHALL be pure functions that can be unit tested without browser environment

### Requirement 2: Domain Hooks 层（The Bridge）

**User Story:** As a developer, I want shared hooks that manage state and call Server Actions, so that both desktop and mobile UIs can use the same business logic.

#### Acceptance Criteria

1. THE Domain_Hook layer SHALL be located in `hooks/domain/` directory with feature-based file naming (e.g., `useDashboard.ts`, `useCalibration.ts`)
2. WHEN a Domain_Hook is created, THE Domain_Hook SHALL import and call Server_Actions for data operations
3. THE Domain_Hook SHALL manage loading states, error states, and data caching using React state or SWR/TanStack Query
4. THE Domain_Hook SHALL expose a typed interface including `{ data, isLoading, error, actions }` pattern
5. WHEN network is unavailable, THE Domain_Hook SHALL provide cached data if available and indicate offline status
6. THE Domain_Hook SHALL NOT contain any UI-specific code (no JSX, no styling, no platform-specific logic)

### Requirement 3: Presentational Components 层（The Skin）

**User Story:** As a developer, I want separate desktop and mobile UI components that only handle presentation, so that I can freely customize each platform's look and feel.

#### Acceptance Criteria

1. THE Presentational_Component layer SHALL be organized in `components/desktop/` and `components/mobile/` directories
2. WHEN a Presentational_Component is created, THE Presentational_Component SHALL receive all data and callbacks via props
3. THE Presentational_Component SHALL NOT directly call Server_Actions or Supabase
4. THE Desktop Presentational_Component SHALL use Shadcn UI components for consistent styling
5. THE Mobile Presentational_Component SHALL use Framer Motion and Lottie for animations with haptic feedback
6. WHEN rendering, THE Presentational_Component SHALL handle only visual concerns (layout, styling, animations)

### Requirement 4: Page-Level 路由分流

**User Story:** As a user, I want to see the appropriate UI for my device, so that I get the best experience on both desktop and mobile.

#### Acceptance Criteria

1. WHEN a page is loaded, THE Page_Component SHALL detect device type using User-Agent header on server side
2. THE Page_Component SHALL render Desktop or Mobile Presentational_Component based on device detection
3. THE Page_Component SHALL pass the same Domain_Hook instance to both Desktop and Mobile components
4. IF device detection fails, THEN THE Page_Component SHALL default to desktop view
5. THE Page_Component SHALL be a Server Component when possible, delegating client interactivity to child components
6. THE Page_Component SHALL use `export const dynamic = 'force-dynamic'` to prevent Vercel edge caching of device-specific HTML
7. WHEN running in Capacitor, THE Page_Component SHALL detect Capacitor via custom header `X-Capacitor-Platform` as authoritative mobile indicator

### Requirement 5: Dashboard 功能模块重构（示范模块）

**User Story:** As a user, I want to view my health profile dashboard with smooth animations on mobile and efficient layout on desktop, so that I have a great experience on any device.

#### Acceptance Criteria

1. THE Dashboard_Action SHALL fetch unified profile, weekly logs, and hardware data from Supabase
2. THE Dashboard_Action SHALL trigger profile sync when requested
3. THE useDashboard Hook SHALL manage profile data, loading states, and sync operations
4. THE useDashboard Hook SHALL provide `{ profile, weeklyLogs, hardwareData, isLoading, isSyncing, sync, refresh }` interface
5. THE Desktop Dashboard_Component SHALL display health metrics in a grid layout with minimal animations
6. THE Mobile Dashboard_Component SHALL display health metrics with Framer Motion card animations and haptic feedback
7. WHEN sync is triggered, THE Dashboard SHALL show loading indicator and refresh data upon completion

### Requirement 6: 离线支持与缓存

**User Story:** As a mobile user, I want the app to work even when my network is unstable, so that I don't see blank screens.

#### Acceptance Criteria

1. THE Domain_Hook SHALL implement data caching using SWR or TanStack Query with stale-while-revalidate strategy
2. WHEN network is unavailable, THE Domain_Hook SHALL return cached data with `isOffline: true` flag
3. THE Presentational_Component SHALL display offline indicator when `isOffline` is true
4. WHEN network is restored, THE Domain_Hook SHALL automatically revalidate and update data

### Requirement 7: 类型安全与错误处理

**User Story:** As a developer, I want type-safe interfaces between layers, so that I catch errors at compile time rather than runtime.

#### Acceptance Criteria

1. THE Server_Action SHALL define TypeScript interfaces for all input parameters and return types
2. THE Domain_Hook SHALL export TypeScript interfaces for its return value
3. THE Presentational_Component SHALL define TypeScript props interface
4. WHEN an error occurs in Server_Action, THE error SHALL be typed and propagated through Domain_Hook to Presentational_Component
5. THE Presentational_Component SHALL display user-friendly error messages following "California Calm" design principles (no alarmist language)
6. THE Server_Action SHALL return only JSON-serializable data (no Date objects, class instances, Set, Map, or functions)
7. THE Server_Action SHALL transform complex objects to DTOs (Data Transfer Objects) before returning

### Requirement 8: 乐观更新支持 (Optimistic UI)

**User Story:** As a mobile user, I want instant visual feedback when I interact with the app, so that the experience feels native and responsive.

#### Acceptance Criteria

1. THE Domain_Hook SHALL support optimistic state updates for user-initiated actions
2. WHEN a user triggers an action, THE Domain_Hook SHALL update UI state immediately before Server_Action completes
3. THE Domain_Hook SHALL expose both `data` (server-confirmed) and `optimisticData` (UI-priority) fields where applicable
4. IF Server_Action fails after optimistic update, THEN THE Domain_Hook SHALL rollback to previous state and set error
5. THE Domain_Hook SHALL provide a `mutate` function for manual optimistic updates when needed
