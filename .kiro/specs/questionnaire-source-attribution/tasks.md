# Implementation Plan: Questionnaire Source Attribution

## Overview

本实现计划将为问卷系统添加权威出处信息，包括扩展类型定义、添加量表出处数据、创建 UI 组件，以及编写测试用例。

## Tasks

- [x] 1. 扩展类型定义和数据结构
  - [x] 1.1 在 `lib/clinical-scales/types.ts` 中添加 `Citation` 和 `ScaleSourceAttribution` 接口
    - 添加 Citation 接口（authors, year, title, journal, volume, doi, pmid）
    - 添加 ScaleSourceAttribution 接口（originalCitation, developingInstitution, copyrightStatus 等）
    - 扩展 ScaleDefinition 接口添加可选的 sourceAttribution 字段
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 编写属性测试：数据完整性验证
    - **Property 1: Source Attribution Data Completeness**
    - **Validates: Requirements 1.1, 1.3, 5.1**

- [x] 2. 创建量表出处数据文件
  - [x] 2.1 创建 `lib/clinical-scales/source-attributions.ts` 文件
    - 添加 GAD7_SOURCE 出处数据
    - 添加 PHQ9_SOURCE 出处数据
    - 添加 ISI_SOURCE 出处数据
    - 添加 PSS10_SOURCE 出处数据
    - 添加 SHSQ25_SOURCE 出处数据
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.2 更新现有量表文件，关联出处数据
    - 更新 `gad.ts` 添加 sourceAttribution
    - 更新 `phq.ts` 添加 sourceAttribution
    - 更新 `isi.ts` 添加 sourceAttribution
    - 更新 `pss.ts` 添加 sourceAttribution
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 2.3 编写属性测试：引用格式有效性
    - **Property 3: Citation Format Validity**
    - **Validates: Requirements 1.2, 1.4**

- [x] 3. 添加疲劳量表
  - [x] 3.1 创建 `lib/clinical-scales/fatigue.ts` 文件
    - 添加 CFS11_SOURCE 出处数据
    - 添加 CFS11 量表定义（11个问题，4点量表）
    - 添加评分解释函数
    - _Requirements: 4.1, 4.4_

  - [x] 3.2 更新 `lib/clinical-scales/index.ts` 导出疲劳量表
    - 导出 CFS11 和相关函数
    - _Requirements: 4.1_

  - [ ]* 3.3 编写属性测试：疲劳量表结构
    - **Property 7: Fatigue Scale Structure**
    - **Validates: Requirements 4.3, 4.4**

- [x] 4. Checkpoint - 确保数据层完成
  - 确保所有量表数据正确定义
  - 确保类型检查通过
  - 如有问题请询问用户

- [x] 5. 创建工具函数
  - [x] 5.1 创建 `lib/clinical-scales/source-utils.ts` 文件
    - 实现 `formatBriefCitation(citation: Citation): string` 函数
    - 实现 `getLocalizedAttribution(attr: ScaleSourceAttribution, locale: 'zh' | 'en')` 函数
    - 实现 `validateSourceAttribution(attr: ScaleSourceAttribution): boolean` 函数
    - _Requirements: 2.2, 5.2, 6.4_

  - [ ]* 5.2 编写属性测试：简短引用格式
    - **Property 6: Brief Citation Format**
    - **Validates: Requirements 2.2**

  - [ ]* 5.3 编写属性测试：本地化检索
    - **Property 5: Localized Attribution Retrieval**
    - **Validates: Requirements 2.5, 5.2**

  - [ ]* 5.4 编写属性测试：序列化往返
    - **Property 4: Serialization Round-Trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 6. 创建 UI 组件
  - [x] 6.1 创建 `components/assessment/SourceAttributionCard.tsx`
    - 实现紧凑模式显示简短引用
    - 实现点击展开详情功能
    - 支持中英文切换
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 6.2 创建 `components/assessment/SourceAttributionModal.tsx`
    - 显示完整引用信息
    - 显示开发机构
    - 显示中文验证研究（如有）
    - 显示版权和使用许可
    - 可点击 DOI/PMID 链接
    - _Requirements: 2.3, 5.3_

  - [ ]* 6.3 编写组件单元测试
    - 测试 SourceAttributionCard 渲染
    - 测试 SourceAttributionModal 内容显示
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7. 集成到问卷界面
  - [x] 7.1 更新问卷组件集成出处显示
    - 在问卷头部添加 SourceAttributionCard
    - 确保不影响问卷填写体验
    - _Requirements: 2.4_

- [ ] 8. Final Checkpoint - 确保所有测试通过
  - 运行所有单元测试
  - 运行所有属性测试
  - 如有问题请询问用户

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check library for TypeScript
- UI components use existing design system (shadcn/ui)
