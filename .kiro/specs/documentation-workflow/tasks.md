# Implementation Plan

- [x] 1. 创建核心文件和数据结构



  - [x] 1.1 创建 MARKETING_ASSETS.md 营销素材日志文件

    - 创建文件结构，包含 TODO 和 DONE 两个区块
    - 添加示例条目作为模板参考
    - _Requirements: 4.1, 5.1, 5.2_
  - [x] 1.2 创建 lib/doc-workflow.ts 工具函数


    - 实现 MarketingAsset 接口和类型定义
    - 实现 parseMarketingAssets() 解析函数
    - 实现 generateAssetEntry() 生成函数
    - 实现 checkOverdueAssets() 逾期检测函数
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 1.3 编写属性测试 Property 2: Asset Entry Completeness
    - **Property 2: Asset Entry Completeness**
    - **Validates: Requirements 4.1, 4.4, 5.1, 5.2**
  - [ ]* 1.4 编写属性测试 Property 3: Overdue Detection Accuracy
    - **Property 3: Overdue Detection Accuracy**
    - **Validates: Requirements 5.4, 6.4**
  - [ ]* 1.5 编写属性测试 Property 5: Asset Categorization Validity
    - **Property 5: Asset Categorization Validity**
    - **Validates: Requirements 5.3**

- [x] 2. 创建 Steering 规则


  - [x] 2.1 创建 .kiro/steering/daily-workflow.md


    - 定义每日开工检查清单（读 Constitution、检查 Diary、查看待处理素材）
    - 定义每日结束检查清单（更新 Diary、检查 README、记录素材）
    - 设置为 always-included 规则
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  - [x] 2.2 创建 .kiro/steering/marketing-capture.md


    - 定义 UI 组件完成时的素材收集规则
    - 定义动画/交互功能的录屏提醒规则
    - 定义无法自动截图时的手动指令
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 2.3 编写属性测试 Property 1: Template Structure Completeness
    - **Property 1: Template Structure Completeness**
    - **Validates: Requirements 1.1, 2.1, 2.2**





- [ ] 3. 创建 Kiro Hook 自动化
  - [ ] 3.1 创建 .kiro/hooks/doc-reminder.json
    - 配置 on-agent-complete 触发器
    - 实现待处理素材检查逻辑
    - 生成提醒消息模板
    - _Requirements: 4.5, 6.1, 6.2_
  - [ ]* 3.2 编写属性测试 Property 4: Reminder Trigger Consistency
    - **Property 4: Reminder Trigger Consistency**




    - **Validates: Requirements 4.5, 6.1, 6.2**
  - [ ]* 3.3 编写属性测试 Property 6: Fallback Instruction Presence
    - **Property 6: Fallback Instruction Presence**

    - **Validates: Requirements 4.3, 6.3**


- [-] 4. 更新 PROJECT_CONSTITUTION.md


  - [ ] 4.1 添加文档管理规则到 Constitution
    - 添加 Section VIII: Documentation Workflow Rules
    - 定义重大更新时必须更新的文件列表
    - 定义营销素材收集的触发条件


    - _Requirements: 1.2, 2.3, 3.1, 3.2, 3.3_



- [ ] 5. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. 初始化营销素材记录
  - [ ] 6.1 回顾现有功能，创建初始素材 TODO 列表
    - 贝叶斯信念循环相关截图/录屏
    - 每日校准弹窗截图
    - AI 助手对话截图
    - 主仪表盘截图
    - _Requirements: 4.1, 5.1_
  - [ ] 6.2 更新 DEVELOPMENT_DIARY.md 添加今日记录
    - 记录本次文档工作流实现
    - 添加营销素材收集提醒
    - _Requirements: 2.1, 2.2_

- [ ] 7. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
