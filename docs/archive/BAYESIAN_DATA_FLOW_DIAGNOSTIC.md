# 贝叶斯信念循环数据流诊断报告

生成时间：2025-11-24 09:50

## 🔍 检查项目

### 1. 数据库表结构
- ✅ **user_metrics 表存在** - 用于存储贝叶斯计算结果
- ⚠️ **habit_completions 表查询失败** - 网络连接问题

### 2. 核心组件状态

#### SQL 函数（应该存在）
```sql
-- 贝叶斯计算函数
public.calculate_belief_curve_score(p_user_id UUID, p_date DATE)
public.calculate_confidence_score(p_user_id UUID, p_date DATE)
public.calculate_physical_performance_score(p_user_id UUID, p_date DATE)
```
文件位置：`supabase_bayesian_functions.sql`

#### 触发器（应该存在）
```sql
-- 习惯完成时自动触发
CREATE TRIGGER trigger_update_user_metrics_on_habit_completion
  AFTER INSERT ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_metrics_on_habit_completion();
```
文件位置：`ALL_SQL_SCRIPTS_TO_EXECUTE.sql` (第291-296行)

### 3. 预期数据流

```
用户完成习惯打卡
    ↓
INSERT INTO habit_completions
    ↓
触发器: trigger_update_user_metrics_on_habit_completion
    ↓
调用函数: calculate_belief_curve_score()
    ↓
计算贝叶斯分数 (0.0-1.0)
    ↓
INSERT/UPDATE user_metrics 表
    ↓
前端读取 user_metrics 数据
    ↓
BeliefScoreChart 显示曲线
```

### 4. 当前问题

#### ❌ 问题1：前端使用假数据
**位置**：`components/PersonalizedLandingContent.tsx` (第360-387行)
```typescript
// 硬编码的模拟数据
const mockData = [50, 53, 51, 54, 56, 59].map((score, i) => ({
  period: `${i}周`,
  averageScore: score,
}));
```

**影响**：
- 图表显示的不是真实的贝叶斯计算结果
- 用户看不到自己实际的信念分数变化

#### ❌ 问题2：数据流未验证
**现状**：
- ✅ user_metrics 表存在
- ❌ 无法确认表中是否有数据
- ❌ 无法确认触发器是否正常执行
- ❌ 网络连接问题导致无法读取数据

### 5. 需要验证的内容

#### 在 Supabase Dashboard 手动检查：

1. **检查 user_metrics 表是否有数据**
```sql
SELECT * FROM user_metrics 
ORDER BY date DESC 
LIMIT 10;
```

2. **检查触发器是否存在**
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'habit_completions'
  AND trigger_name LIKE '%user_metrics%';
```

3. **检查函数是否存在**
```sql
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%belief%';
```

4. **手动测试触发器**
```sql
-- 插入一条测试记录（使用真实的用户ID和习惯ID）
INSERT INTO habit_completions (habit_id, user_id, completed_at, belief_score_snapshot)
VALUES (
  (SELECT id FROM habits LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  NOW(),
  7.5
);

-- 立即检查 user_metrics 是否自动更新
SELECT * FROM user_metrics 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC 
LIMIT 5;
```

### 6. 修复方案（如果发现问题）

#### 如果触发器不存在：
```bash
# 在 Supabase SQL Editor 中执行
cat ALL_SQL_SCRIPTS_TO_EXECUTE.sql | psql
```

#### 如果函数不存在：
```bash
# 依次执行：
1. supabase_bayesian_functions.sql
2. supabase_user_metrics.sql
3. ALL_SQL_SCRIPTS_TO_EXECUTE.sql
```

#### 如果前端需要读取真实数据（未来）：
需要修改 `PersonalizedLandingContent.tsx`：
- 创建 API 端点：`/api/metrics/belief-curve`
- 从 user_metrics 表读取数据
- 替换硬编码的 mockData

### 7. 结论

**当前状态**：🟡 部分完成，需要验证

**已完成**：
- ✅ user_metrics 表已创建
- ✅ SQL 函数代码存在
- ✅ 触发器代码存在

**待验证**：
- ⚠️ 触发器是否已在数据库中创建并激活
- ⚠️ 触发器是否能正常执行
- ⚠️ user_metrics 表是否有数据

**待实现**（如果需要）：
- 🔴 前端读取真实数据（当前使用假数据）
- 🔴 创建 API 端点获取 user_metrics
- 🔴 替换 BeliefScoreChart 的数据源

### 8. 下一步行动

1. **立即**：在 Supabase Dashboard 执行上述 SQL 检查语句
2. **验证**：手动插入测试数据，确认触发器工作
3. **决定**：是否需要让前端读取真实数据（当前使用模拟数据）

---

## 📝 手动检查清单

在 Supabase Dashboard SQL Editor 中依次执行：

```sql
-- ✓ 检查1: user_metrics 表结构
\d user_metrics

-- ✓ 检查2: 触发器列表
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'habit_completions';

-- ✓ 检查3: 函数列表
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%belief%';

-- ✓ 检查4: user_metrics 数据
SELECT COUNT(*) as total_records FROM user_metrics;

-- ✓ 检查5: habit_completions 数据
SELECT COUNT(*) as total_records FROM habit_completions;
```

将检查结果更新到此文档。
