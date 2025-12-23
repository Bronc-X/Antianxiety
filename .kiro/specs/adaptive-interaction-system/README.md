# Adaptive Interaction System Specification
# 自适应交互系统规范文档

## 文档概览 | Document Overview

本目录包含 AntiAnxiety 应用的自适应交互系统的完整规范文档。

This directory contains the complete specification for the Adaptive Interaction System of the AntiAnxiety application.

---

## 文档列表 | Document List

### 📋 requirements.md
**系统需求文档 | System Requirements**

定义了自适应交互系统的6个核心需求：
1. 自适应注册问卷
2. 阶段性目标推荐
3. 自适应每日校准
4. AI主动问询系统 ⭐
5. AI驱动的内容推荐
6. 后端内容策展工作流

Defines 6 core requirements for the adaptive interaction system.

---

### 🏗️ design.md
**系统设计文档 | System Design**

包含：
- 系统架构图
- 组件接口定义
- 数据模型设计
- 正确性属性（16个）
- 错误处理策略
- 测试策略

Contains architecture, interfaces, data models, and 16 correctness properties.

---

### ✅ tasks.md
**实现任务清单 | Implementation Task List**

详细的开发任务列表，包括：
- 前端组件开发
- API路由实现
- 业务逻辑开发
- 数据库迁移
- 测试任务

Detailed development task list for implementation.

---

### 📖 INQUIRY_SYSTEM_LOGIC.md ⭐ NEW
**问询系统完整逻辑说明 | Inquiry System Complete Logic**

**这是最新添加的核心文档！**

包含13个章节的详细说明：
1. 问题生成逻辑
2. 数据同步流程
3. AI对话集成
4. 内容推荐影响
5. 界面交互设计
6. 记忆系统集成
7. 完整系统架构图
8. 数据流时序图
9. 关键代码位置索引
10. 测试验证清单
11. 未来优化方向
12. 常见问题解答
13. 总结

**适用人群**:
- 👨‍💻 开发人员 - 理解实现细节
- 🧪 测试人员 - 使用测试清单
- 📊 产品经理 - 了解业务价值
- 📚 新成员 - 快速上手

---

### 📝 UPDATE_SUMMARY.md
**文档更新总结 | Documentation Update Summary**

说明了最新的文档更新内容：
- 更新日期和类型
- 文档结构概览
- 文档特点
- 与现有文档的关系
- 更新影响范围
- 后续行动建议

---

## 阅读顺序建议 | Recommended Reading Order

### 新成员 | New Team Members
1. README.md（本文件）
2. requirements.md - 了解系统需求
3. INQUIRY_SYSTEM_LOGIC.md - 深入理解问询系统
4. design.md - 学习整体设计
5. tasks.md - 查看实现任务

### 开发人员 | Developers
1. INQUIRY_SYSTEM_LOGIC.md - 实现细节
2. design.md - 接口定义
3. tasks.md - 开发任务
4. requirements.md - 需求验证

### 测试人员 | Testers
1. INQUIRY_SYSTEM_LOGIC.md 第10章 - 测试清单
2. design.md - 正确性属性
3. requirements.md - 验收标准

### 产品经理 | Product Managers
1. requirements.md - 功能需求
2. INQUIRY_SYSTEM_LOGIC.md 第13章 - 业务价值
3. INQUIRY_SYSTEM_LOGIC.md 第11章 - 未来规划

---

## 快速链接 | Quick Links

### 核心概念
- **数据缺口 (Data Gap)**: 缺失或过期的健康数据维度
- **问询引擎 (Inquiry Engine)**: 智能生成问询问题的核心模块
- **问询上下文 (Inquiry Context)**: 从问询历史提取的健康洞察
- **闭环连接 (Closed Loop)**: 问询数据同步到多个系统的机制

### 关键文件
- `lib/inquiry-engine.ts` - 问询引擎实现
- `lib/inquiry-context.ts` - 问询上下文提取
- `components/ActiveInquiryBanner.tsx` - Banner组件
- `app/api/inquiry/pending/route.ts` - 获取问题API
- `app/api/inquiry/respond/route.ts` - 提交回答API

### 数据库表
- `inquiry_history` - 问询历史记录
- `daily_calibrations` - 每日校准数据
- `user_activity_patterns` - 用户活跃模式

---

## 贡献指南 | Contribution Guidelines

### 更新文档
1. 修改相应的 .md 文件
2. 更新 UPDATE_SUMMARY.md 记录变更
3. 提交 PR 并请求审核

### 报告问题
- 通过 GitHub Issues 提交
- 标签: `documentation`
- 说明具体的文档位置和问题

### 建议改进
- 在团队会议中讨论
- 提交改进建议的 PR
- 更新相关文档

---

## 版本历史 | Version History

### v1.0 (2024-12-23)
- ✅ 创建完整的规范文档结构
- ✅ 新增 INQUIRY_SYSTEM_LOGIC.md
- ✅ 新增 UPDATE_SUMMARY.md
- ✅ 新增 README.md

---

## 联系方式 | Contact

**文档维护者**: AntiAnxiety Development Team  
**技术负责人**: [待填写]  
**反馈渠道**: GitHub Issues

---

**最后更新**: 2024-12-23  
**文档版本**: v1.0
