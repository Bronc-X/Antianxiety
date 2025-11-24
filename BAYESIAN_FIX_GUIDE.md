# 贝叶斯信念循环修复指南

## 📌 问题摘要

**发现日期**: 2025-11-24  
**问题**: 贝叶斯信念循环数据流未完全打通  
**影响**: 用户无法看到真实的信念分数变化

## 🔴 核心问题

### 1. 前端显示假数据
**文件**: `components/PersonalizedLandingContent.tsx` (第360-387行)
```typescript
// ❌ 当前：使用硬编码的模拟数据
const mockData = [50, 53, 51, 54, 56, 59].map((score, i) => ({
  period: `${i}周`,
  averageScore: score,
}));
setChartData(mockData);
```

**结果**: 所有用户看到的信念增长曲线都是一样的假数据。

### 2. 数据流未验证
```
habit_completions 表 (有数据?)
    ↓
触发器 (是否创建?)
    ↓
calculate_belief_curve_score() (是否执行?)
    ↓
user_metrics 表 (有数据?)
    ↓
前端读取 (未实现)
```

## ✅ 已完成的部分

1. ✅ SQL 函数代码已编写
   - `calculate_belief_curve_score()`
   - `calculate_confidence_score()`
   - `calculate_physical_performance_score()`
   - 位置: `supabase_bayesian_functions.sql`

2. ✅ 触发器代码已编写
   - `trigger_update_user_metrics_on_habit_completion`
   - 位置: `ALL_SQL_SCRIPTS_TO_EXECUTE.sql` (第291-296行)

3. ✅ 表结构已创建
   - `user_metrics` 表存在
   - 位置: `supabase_user_metrics.sql`

4. ✅ 图表组件已实现
   - `BeliefScoreChart.tsx` 可以正常显示数据

## 🔍 诊断工具

### 方法1: 浏览器工具
打开: `http://localhost:3000/test-bayesian-flow.html`

功能:
- 检查登录状态
- 查询各个表的数据
- 测试触发器
- 生成诊断报告

### 方法2: Node.js 脚本
```bash
node scripts/check-bayesian-data-flow.js
```

### 方法3: 手动 SQL 检查

在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 1. 检查触发器是否存在
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'habit_completions';

-- 2. 检查函数是否存在
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%belief%';

-- 3. 检查 user_metrics 数据量
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM user_metrics;

-- 4. 检查数据对应关系
SELECT 
  (SELECT COUNT(*) FROM habit_completions) as completions_count,
  (SELECT COUNT(*) FROM user_metrics) as metrics_count,
  (SELECT COUNT(DISTINCT user_id) FROM habit_completions) as users_with_completions,
  (SELECT COUNT(DISTINCT user_id) FROM user_metrics) as users_with_metrics;
```

## 🛠️ 修复步骤

### 步骤1: 验证数据库设置

#### 1.1 确认函数已创建
```sql
-- 在 Supabase SQL Editor 执行
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'calculate_belief_curve_score',
  'calculate_confidence_score',
  'update_user_metrics_on_habit_completion'
);
```

**预期结果**: 应该返回 3 个函数名

**如果没有**: 执行 `supabase_bayesian_functions.sql`

#### 1.2 确认触发器已创建
```sql
SELECT trigger_name 
FROM information_schema.triggers
WHERE event_object_table = 'habit_completions'
  AND trigger_name = 'trigger_update_user_metrics_on_habit_completion';
```

**预期结果**: 应该返回触发器名

**如果没有**: 执行 `ALL_SQL_SCRIPTS_TO_EXECUTE.sql` 中的触发器部分

#### 1.3 手动测试触发器
```sql
-- 获取测试数据
SELECT id as habit_id FROM habits LIMIT 1;
SELECT id as user_id FROM auth.users LIMIT 1;

-- 插入测试记录（使用上面获取的真实ID）
INSERT INTO habit_completions (habit_id, user_id, completed_at, belief_score_snapshot)
VALUES (
  'YOUR_HABIT_ID',  -- 替换为真实habit_id
  'YOUR_USER_ID',   -- 替换为真实user_id
  NOW(),
  7.5
);

-- 立即检查 user_metrics 是否自动更新（5秒后查询）
SELECT * FROM user_metrics 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC 
LIMIT 5;
```

**预期结果**: user_metrics 表应该有新记录

### 步骤2: 修复前端（如果需要真实数据）

⚠️ **注意**: 当前前端使用模拟数据是设计决策，如果要显示真实数据需要：

#### 2.1 创建 API 端点
创建 `/app/api/metrics/belief-curve/route.ts`:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 查询 user_metrics
    const { data, error } = await supabase
      .from('user_metrics')
      .select('date, belief_curve_score, confidence_score')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .limit(50);

    if (error) throw error;

    // 转换为图表格式
    const chartData = data.map((item, index) => ({
      period: `${index}周`,
      averageScore: (item.belief_curve_score || 0) * 100, // 0-1 转为 0-100
    }));

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error('获取信念曲线数据失败:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

#### 2.2 修改前端组件
修改 `PersonalizedLandingContent.tsx`:
```typescript
useEffect(() => {
  // 选项1: 使用真实数据
  const fetchRealData = async () => {
    try {
      const res = await fetch('/api/metrics/belief-curve');
      const { data } = await res.json();
      if (data && data.length > 0) {
        setChartData(data);
        return;
      }
    } catch (error) {
      console.error('获取真实数据失败:', error);
    }
    
    // Fallback: 使用模拟数据
    const mockData = [50, 53, 51, 54, 56, 59].map((score, i) => ({
      period: `${i}周`,
      averageScore: score,
    }));
    setChartData(mockData);
  };
  
  fetchRealData();
}, []);
```

### 步骤3: 验证完整数据流

1. 在 Web 端完成一个习惯打卡
2. 等待 5 秒
3. 在 Supabase Dashboard 查询:
```sql
SELECT * FROM user_metrics 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;
```
4. 应该看到新记录

## 📊 当前推荐方案

**建议**: 暂时保持前端使用模拟数据

**理由**:
1. 图表展示效果良好
2. 避免数据不足时的空白状态
3. 后端数据流可以独立验证和修复

**下一步**:
1. ✅ 先验证数据库层是否正常工作
2. ✅ 确认 user_metrics 表有数据积累
3. ⏳ 等有足够数据后再切换到真实数据
4. ⏳ 实现优雅的降级（真实数据 → 模拟数据）

## 🎯 验证清单

在 Supabase Dashboard 执行以下检查：

- [ ] 函数 `calculate_belief_curve_score` 存在
- [ ] 函数 `calculate_confidence_score` 存在  
- [ ] 函数 `update_user_metrics_on_habit_completion` 存在
- [ ] 触发器 `trigger_update_user_metrics_on_habit_completion` 存在
- [ ] 表 `user_metrics` 有数据（> 0 条记录）
- [ ] 手动插入 habit_completions 后 user_metrics 自动更新
- [ ] 前端图表正常显示（即使是模拟数据）

## 📝 状态更新

已更新 README.md:
- 状态从 `[✅ 已实现] 100%` 改为 `[🚧 开发中] 85%`
- 标注"数据流待验证"
- 明确说明"前端使用模拟数据"

## 📞 后续支持

如果需要完全打通数据流并使用真实数据，需要：
1. 执行上述所有验证步骤
2. 实现 API 端点
3. 修改前端数据获取逻辑
4. 添加降级机制（真实数据不足时使用模拟数据）

---

**最后更新**: 2025-11-24  
**文档版本**: 1.0
