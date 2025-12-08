# 实现计划

- [x] 1. 扩展翻译字典
  - [x] 1.1 添加分析页面翻译键
    - 添加 analysis.loading.text, analysis.header.decoder, analysis.status.recovery 等
    - _需求: 6.1, 6.2_
  - [x] 1.2 添加贝叶斯页面翻译键
    - 添加 bayesian.anxiety.label, bayesian.fear, bayesian.truth, bayesian.calibration.start 等
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 1.3 添加计划页面翻译键
    - 添加 plans.header.title, plans.header.subtitle 等
    - _需求: 8.1, 8.2, 8.3_
  - [x] 1.4 添加设置页面翻译键
    - 添加 settings.tabs, settings.body, settings.ai, settings.account 相关键
    - _需求: 10.1, 10.2, 10.3, 10.4_
  - [x] 1.5 添加升级页面翻译键
    - 添加 upgrade.title, upgrade.features, upgrade.pricing, upgrade.cta 等
    - _需求: 9.1, 9.2, 9.3_

- [x] 2. 修复组件 - 分析页面
  - [x] 2.1 修复 AnalysisClientView 组件
    - 替换硬编码中文为 t() 调用
    - 修复用户名显示（从 profile 获取而非硬编码）
    - _需求: 6.1, 6.2, 6.3_

- [x] 3. 修复组件 - 贝叶斯页面
  - [x] 3.1 修复 BayesianDashboardPage 组件
    - 替换所有硬编码中文为 t() 调用或条件渲染
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. 修复组件 - 计划页面
  - [x] 4.1 修复 PlansPage 组件
    - 替换硬编码中文为 t() 调用
    - _需求: 8.1, 8.2, 8.3_

- [x] 5. 修复组件 - 设置页面
  - [x] 5.1 修复 SettingsClient 组件
    - 替换所有硬编码中文为 t() 调用
    - _需求: 10.1, 10.2, 10.3, 10.4_

- [x] 6. 修复组件 - 升级页面
  - [x] 6.1 修复 UpgradePage 组件
    - 替换所有硬编码中文为条件渲染
    - _需求: 9.1, 9.2, 9.3_

- [x] 7. 修复组件 - 其他页面
  - [x] 7.1 修复 Loading 组件
    - 添加 i18n 支持
    - _需求: 1.4_
  - [x] 7.2 修复 AssistantPage 组件
    - 替换硬编码中文
    - _需求: 5.1, 5.2, 5.3, 5.4_

- [x] 8. 最终检查点

  - 确保所有测试通过，如有问题询问用户
