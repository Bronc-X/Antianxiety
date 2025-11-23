# 🔄 AI方案闭环系统（核心数据流）⚠️ 非常重要

这是项目的**核心价值链**，从AI生成方案到用户执行再到数据反馈的完整闭环。

---

## 1️⃣ AI助理生成方案

### 交互流程
- AI助理分析用户问题（疲劳、肥胖、压力等）
- 给出**2个方案**（基础方案 + 进阶方案）
- 每个方案包含：
  - 适合场景
  - 具体做法（运动、饮食、睡眠等）
  - 预期效果
  - 难度评级

### UI组件示例
```tsx
方案1：轻度调整（基础方案）
- 适合：工作忙，时间少
- 做法：16:8禁食 + 每天20分钟快走
- 效果：2-3周改善
- 难度：⭐⭐☆☆☆

[修改] [确认]
```

---

## 2️⃣ 用户交互按键

### 修改按键
- 用户可以选择：
  - ✅ 保留哪些建议
  - ❌ 删除哪些建议
  - ➕ 是否需要AI一键增加更多细节
- 用途：个性化调整方案，符合用户实际情况

### 确认按键
- 用户确认后，方案**立即同步到主页**
- 形成**个人计划表**（参考iOS日程表格式）
- 数据存储：
  - 表：`user_plans` 或 `ai_generated_plans`
  - 字段：user_id, plan_type, content, status, created_at

---

## 3️⃣ 主页计划表同步

### 计划表格式（iOS日程表风格）

```
今日计划 - 2025年11月23日

早上 7:00
✅ 空腹20个深蹲（AI方案1）

中午 12:00  
⏸️ 16:8禁食窗口期（AI方案1）

晚上 19:00
☐ 20分钟Zone 2快走（AI方案1）

晚上 22:00
☐ 睡前冥想10分钟（AI方案1）
```

### 技术实现
- 组件：`DashboardPlans.tsx`（新建）
- 展示当日所有AI方案项
- 支持勾选完成/未完成
- 实时同步到Supabase

---

## 4️⃣ 记录今日状态集成

### 原有记录项
- 体重、睡眠时长、压力水平等

### 新增：AI方案执行记录
用户每天在"记录今日状态"中，**必须看到计划表内容**

记录执行情况：
- ✅ 已完成
- ⏸️ 部分完成
- ❌ 未完成
- 💬 添加备注（例如：太忙了，改为明天）

### 数据表结构

```sql
CREATE TABLE user_plan_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  plan_id UUID REFERENCES user_plans(id),
  completion_date DATE NOT NULL,
  status TEXT NOT NULL, -- 'completed', 'partial', 'skipped'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plan_completions_user_date 
ON user_plan_completions(user_id, completion_date);
```

---

## 5️⃣ 数据采集与AI学习（最重要）⚠️

### 采集的数据

1. **执行率**
   - 用户完成了多少次方案中的行动
   - 跳过了多少次
   - 部分完成的频率

2. **时间模式**
   - 用户更倾向早上还是晚上运动
   - 禁食窗口是否适合用户作息

3. **效果反馈**
   - 执行方案后，体重/睡眠/压力的变化
   - 用户主观感受（备注中的情绪词）

4. **放弃原因**
   - 哪些建议用户从不执行
   - 是难度问题？时间问题？还是效果不明显？

### 数据用途

#### AI助理对话
- 用户问："我最近怎么样"
- AI答："你坚持16:8禁食3周了，体重下降1.2kg"

- 用户问："为什么我还是累"
- AI答："你的Zone 2运动执行率只有40%，建议..."

#### AI分析报告
- 每周/每月生成个性化报告
- 基于**真实执行数据**，而不是泛泛的建议

#### 制定新方案
AI学习用户偏好：
- "你更喜欢早上运动，新方案将优先安排7-8点"
- "你从不跳过饮食建议，但运动执行率低，新方案降低运动难度"
- 动态调整难度和类型

### 数据流示意图

```
用户 → AI助理 → 生成方案 → 确认 → 主页计划表
  ↓                                    ↓
记录执行 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
  ↓
Supabase（user_plan_completions）
  ↓
AI分析引擎（读取历史数据）
  ↓
优化后的新方案 → 用户
```

---

## 6️⃣ 技术实现要点

### 前端组件

**AIAssistantFloatingChat.tsx**
- 识别AI回复中的方案格式
- 渲染 [修改] [确认] 按钮
- 调用API创建计划

**DashboardPlans.tsx**（新建）
- 展示iOS风格的计划表
- 当日计划列表
- 勾选完成状态

**DailyRecord.tsx**（修改）
- 集成计划表执行记录
- 显示AI方案项
- 记录完成度+备注

### 后端API

**/api/plans/create**
- 确认方案后创建计划
- 解析AI方案结构
- 存入 `user_plans` 表

**/api/plans/complete**
- 记录执行情况
- 存入 `user_plan_completions` 表

**/api/ai/chat**（修改）
- 查询用户历史执行数据
- 生成个性化回复
- Context包含：执行率、时间偏好、效果数据

### 数据库表

**user_plans**
```sql
CREATE TABLE user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  source TEXT NOT NULL, -- 'ai_assistant'
  plan_type TEXT NOT NULL, -- 'exercise', 'diet', 'sleep', 'comprehensive'
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- 方案详细内容
  difficulty INTEGER, -- 1-5
  status TEXT DEFAULT 'active', -- 'active', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**user_plan_completions**
- 见上方SQL

**user_metrics**（关联）
- 关联贝叶斯信念曲线
- 分析方案执行对用户指标的影响

---

## 7️⃣ 为什么这个闭环如此重要

### 传统健康App的问题
- 给出通用建议
- 用户做不做，App不知道
- 无法个性化优化

### 本项目的优势
✅ **AI生成** → 基于用户真实问题
✅ **用户确认** → 只执行适合自己的
✅ **数据采集** → 记录真实执行情况
✅ **AI学习** → 优化下一个方案
✅ **闭环优化** → 越用越准确

**这是真正的"AI辅助健康管理"，而不是"AI聊天机器人"。**

---

## 8️⃣ 开发优先级

### 阶段1：基础闭环（MVP）
- [ ] AI方案识别+按钮渲染
- [ ] 确认后创建计划（user_plans表）
- [ ] 主页显示计划表
- [ ] 记录执行状态（user_plan_completions表）

### 阶段2：数据分析
- [ ] AI助理读取执行数据
- [ ] 生成周报/月报
- [ ] 执行率统计

### 阶段3：智能优化
- [ ] AI根据执行数据调整方案难度
- [ ] 学习用户时间偏好
- [ ] 预测用户可能放弃的建议

---

**这是项目的灵魂功能，必须优先实现。**
