# 贝叶斯信念循环函数设置指南

## 📋 概述

贝叶斯信念循环是项目的核心创新点，通过 PostgreSQL 函数在数据库内部直接计算用户的信念分数、信心增强分数和身体机能表现分数。

---

## 🔧 步骤 1: 执行 SQL 函数

在 Supabase SQL Editor 中执行以下 SQL：

**文件位置**: `supabase_bayesian_functions.sql`

### 重要提示

1. **确保表已创建**：在执行函数之前，确保以下表已存在：
   - `habits` - 习惯定义表
   - `habit_completions` - 习惯打卡表
   - `user_metrics` - 用户指标表（真相表）

2. **表名检查**：函数使用的是 `public.habits` 表，不是 `user_habits`。

3. **执行顺序**：
   - 先执行 `SQL_TO_EXECUTE_FIXED.sql` 创建基础表结构
   - 再执行 `supabase_bayesian_functions.sql` 创建函数和触发器

---

## 📊 函数说明

### 1. `calculate_belief_curve_score(p_user_id, p_date)`

**功能**：计算用户的信念曲线分数（基于贝叶斯定理）

**公式**：
```
belief_score = (completion_rate * 0.6 + avg_belief_score * 0.4)
```

**输入**：
- `p_user_id`: 用户 UUID
- `p_date`: 日期（默认：当前日期）

**输出**：0.00 - 1.00 的分数

**逻辑**：
- 计算当天习惯完成率
- 结合平均信念分数（先验）
- 使用贝叶斯更新公式计算最终分数

---

### 2. `calculate_confidence_score(p_user_id, p_date)`

**功能**：计算用户的信心增强分数

**公式**：
```
confidence = (streak_days/7 * 0.4 + consistency * 0.3 + completion_rate * 0.3)
```

**输入**：
- `p_user_id`: 用户 UUID
- `p_date`: 日期（默认：当前日期）

**输出**：0.00 - 1.00 的分数

**逻辑**：
- 计算最近7天的连续完成天数
- 计算一致性分数（有完成记录的天数 / 7）
- 计算最近完成率
- 加权平均得到信心分数

---

### 3. `calculate_physical_performance_score(p_user_id, p_date)`

**功能**：计算用户的身体机能表现分数

**公式**：
```
performance = (sleep * 0.3 + exercise * 0.3 + stress * 0.2 + energy * 0.2)
```

**输入**：
- `p_user_id`: 用户 UUID
- `p_date`: 日期（默认：当前日期）

**输出**：0.00 - 1.00 的分数

**逻辑**：
- 从 `daily_wellness_logs` 表获取当天的健康数据
- 如果没有记录，从 `profiles` 表获取默认值
- 计算睡眠、运动、压力、精力各项分数
- 加权平均得到身体机能分数

---

### 4. `update_user_metrics_on_habit_completion()`

**功能**：触发器函数，当 `habit_completions` 表插入新记录时自动调用

**逻辑**：
1. 获取用户ID和完成日期
2. 调用上述三个函数计算分数
3. 插入或更新 `user_metrics` 表

---

## ✅ 验证设置

### 测试 1: 手动调用函数

```sql
-- 替换为你的用户ID
SELECT 
  public.calculate_belief_curve_score('your-user-id'::uuid, CURRENT_DATE) as belief_score,
  public.calculate_confidence_score('your-user-id'::uuid, CURRENT_DATE) as confidence_score,
  public.calculate_physical_performance_score('your-user-id'::uuid, CURRENT_DATE) as performance_score;
```

### 测试 2: 测试触发器

```sql
-- 插入一条习惯完成记录
INSERT INTO public.habit_completions (habit_id, user_id, completed_at)
VALUES (
  (SELECT id FROM public.habits WHERE user_id = 'your-user-id' LIMIT 1),
  'your-user-id'::uuid,
  NOW()
);

-- 检查 user_metrics 表是否自动更新
SELECT * FROM public.user_metrics 
WHERE user_id = 'your-user-id'::uuid 
ORDER BY date DESC 
LIMIT 1;
```

---

## 🐛 故障排除

### 问题 1: "relation 'public.habits' does not exist"

**解决方案**：确保已执行 `SQL_TO_EXECUTE_FIXED.sql` 创建基础表

### 问题 2: "column 'belief_score' does not exist"

**解决方案**：`habits` 表可能没有 `belief_score` 字段。函数会使用默认值 0.5，这是正常的。

### 问题 3: 触发器没有自动执行

**解决方案**：
1. 检查触发器是否存在：
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_user_metrics_on_habit_completion';
   ```
2. 如果不存在，重新执行 `supabase_bayesian_functions.sql` 的最后部分

### 问题 4: 函数返回 NULL

**可能原因**：
- 用户没有习惯
- 用户没有完成记录
- 日期范围内没有数据

**解决方案**：函数会返回默认值（0.5 或 0.0），这是正常的。

---

## 📈 使用场景

### 场景 1: 用户完成习惯打卡

1. 前端调用 API 插入 `habit_completions` 记录
2. 数据库触发器自动执行
3. 自动计算并更新 `user_metrics` 表
4. 前端读取 `user_metrics` 数据绘制图表

### 场景 2: 查看历史趋势

```sql
-- 获取用户最近30天的指标
SELECT 
  date,
  belief_curve_score,
  confidence_score,
  physical_performance_score
FROM public.user_metrics
WHERE user_id = 'your-user-id'::uuid
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

---

## 🎯 下一步

完成设置后，可以：
1. 在前端图表中显示这些分数
2. 使用这些分数进行个性化推荐
3. 结合 AI 助手提供基于数据的建议

---

## 📝 注意事项

1. **性能优化**：函数会在每次插入 `habit_completions` 时执行，如果数据量很大，可能需要优化。

2. **数据一致性**：确保 `habits` 和 `habit_completions` 表的数据一致。

3. **默认值处理**：函数会处理各种边界情况（无数据、NULL值等），返回合理的默认值。

4. **时区问题**：函数使用 `DATE()` 函数提取日期，确保数据库时区设置正确。

