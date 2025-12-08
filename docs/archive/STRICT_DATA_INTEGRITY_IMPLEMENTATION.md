# 🔒 严格数据完整性实施文档

## 概述

本文档记录了"严格数据完整性"架构的实施细节，确保系统不伪造任何用户数据。

---

## ✅ Phase 1: 新营销漏斗（已完成）

### 流程图

```
问卷 → 升级页面 → 个人资料设置 → 仪表板
  ↓         ↓            ↓            ↓
保存      Pro推销      保存生理数据   解锁功能
metabolic_            height/weight
profile               age/gender
```

### 实施的文件

1. **/app/onboarding/OnboardingFlowClient.tsx**
   - ✅ 修改跳转逻辑：`/landing` → `/onboarding/upgrade`
   - ✅ 保存问卷答案到 `metabolic_profile`

2. **/app/onboarding/upgrade/page.tsx** ⭐ 新建
   - ✅ Pro 升级页面（3天免费试用）
   - ✅ 大 CTA 按钮："开始试用"
   - ✅ 小跳过按钮（右上角 X 图标）
   - ✅ 两个按钮都跳转到 `/onboarding/profile`

3. **/app/onboarding/profile/page.tsx** ⭐ 新建
   - ✅ 收集静态数据：身高、体重、年龄、性别
   - ✅ 保存到 `profiles` 表
   - ✅ 完成后跳转到 `/landing`

### 数据库字段要求

确保 `profiles` 表包含以下字段：

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;
```

---

## ✅ Phase 2: 严格数据映射（已完成）

### 核心原则

**❌ 禁止行为**：
- 不使用问卷答案伪造睡眠时长
- 不估算压力水平
- 不用默认值填充缺失数据

**✅ 正确行为**：
- 检查 `dailyLogs` 是否足够（至少3条）
- 计算真实平均值
- 数据不足时，返回 `{ hasData: false }`

### 实施的文件

1. **/lib/data-mapping.ts** ⭐ 新建
   - ✅ `getRadarChartData(dailyLogs)` - 严格检查数据
   - ✅ `calculateMetrics()` - 基于真实日志计算
   - ✅ `getLatestLog()` - 获取最新日志
   - ✅ `hasLoggedToday()` - 检查今天是否已记录
   - ✅ `getDataQualityMessage()` - 数据质量提示

2. **/components/EmptyRadarChart.tsx** ⭐ 新建
   - ✅ 灰色雷达图轮廓
   - ✅ 锁定图标 + 提示文字
   - ✅ 进度条（已记录 X / 3 天）
   - ✅ "开始记录"按钮
   - ✅ 数据完整性说明卡片

### 数据流程

```typescript
// 1. 获取用户日志
const dailyLogs = await supabase
  .from('daily_logs')
  .select('*')
  .eq('user_id', userId)
  .order('log_date', { ascending: false })
  .limit(30);

// 2. 严格映射数据
const radarData = getRadarChartData(dailyLogs.data);

// 3. 检查数据完整性
if (!radarData.hasData) {
  return <EmptyRadarChart {...radarData} />;
}

// 4. 渲染真实图表
return <RadarChart data={radarData.data} />;
```

---

## ⏳ Phase 3: 诚实 AI（待实施）

### 要求

1. **系统提示更新** (`/app/api/ai/chat/route.ts`)
   ```typescript
   const systemPrompt = `
   你是 No More Anxious 的健康代理。
   
   **关键规则：数据完整性**
   - 你有用户的"代谢档案"（问卷结果）和"每日日志"（真实数据）。
   - 如果用户今天没有记录日志，不要编造睡眠时长或压力水平。
   - 明确告诉用户："我需要你今天的数据才能分析。请先完成健康日记。"
   - 不要说"根据你的数据，你昨晚睡了7小时"（如果用户没记录）。
   
   ${userHasLoggedToday ? 
     `今日数据：睡眠${log.sleep_hours}小时，压力${log.stress_level}/5` : 
     '⚠️ 用户今天尚未记录数据，避免假设具体数值。'
   }
   `;
   ```

2. **推荐任务诚实性** (`/lib/health-logic.ts`)
   ```typescript
   export function getRecommendedTask(
     userMode: string,
     latestLog: DailyLog | null,
     metabolicProfile: MetabolicProfile
   ): RecommendedTask {
     if (!latestLog) {
       return {
         title: "呼吸练习 5 分钟",
         reason: "等待今日数据以生成个性化方案",
         category: "baseline",
         isBaseline: true  // 标记为基线任务
       };
     }
     
     // ... 正常推荐逻辑
   }
   ```

---

## 📊 用户体验流程

### 新用户首次登录

```
1. 完成问卷 ✅
2. 看到 Pro 推销 → 跳过
3. 填写身高体重 ✅
4. 进入主页
   ├─ 雷达图：显示"锁定"状态 🔒
   ├─ AI 助手：
   │   "欢迎！我知道你的代谢档案，但请先记录今天的睡眠和压力，
   │    我才能给出个性化分析。"
   └─ 推荐任务：
       "呼吸练习 5 分钟"
       理由："等待今日数据以生成个性化方案"
```

### 记录 3 天后

```
1. 完成第 3 天的日志 ✅
2. 刷新主页
   ├─ 雷达图：解锁 🎉
   │   └─ 显示真实的 6 维指标
   ├─ AI 助手：
   │   "根据你过去 3 天的数据，我发现你的睡眠质量偏低（平均 6.2 小时），
   │    压力水平较高（4/5）。建议今晚提前 30 分钟入睡。"
   └─ 推荐任务：
       "睡前冥想 10 分钟"
       理由："改善睡眠质量（当前 6.2h/天）"
```

---

## 🧪 测试清单

### Phase 1 测试

- [ ] 完成问卷后跳转到 `/onboarding/upgrade` ✅
- [ ] 点击"开始试用"跳转到 `/onboarding/profile` ✅
- [ ] 点击右上角 X 跳转到 `/onboarding/profile` ✅
- [ ] 填写个人资料后跳转到 `/landing` ✅
- [ ] 数据正确保存到 `profiles` 表 ⏳

### Phase 2 测试

- [ ] 无日志用户看到空状态组件 ⏳
- [ ] 有 1-2 条日志看到"还需 X 天"提示 ⏳
- [ ] 有 3+ 条日志解锁雷达图 ⏳
- [ ] 雷达图数据与日志匹配（不是估算值）⏳
- [ ] "开始记录"按钮打开日志模态框 ⏳

### Phase 3 测试

- [ ] AI 不编造未记录的数据 ⏳
- [ ] 无日志时，AI 明确要求用户记录 ⏳
- [ ] 有日志时，AI 引用真实数值 ⏳
- [ ] 基线任务标记 `isBaseline: true` ⏳

---

## 🚀 部署检查

### 环境变量

确保以下环境变量已配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 数据库迁移

运行以下 SQL（如果尚未执行）：

```sql
-- 添加个人资料字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- 创建 daily_logs 表（如果不存在）
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  sleep_hours NUMERIC,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  exercise_minutes INTEGER,
  water_intake_ml INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date 
  ON daily_logs(user_id, log_date DESC);
```

---

## 📚 参考资料

### 关键文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `/app/onboarding/OnboardingFlowClient.tsx` | ✅ 已更新 | 修改跳转逻辑 |
| `/app/onboarding/upgrade/page.tsx` | ✅ 新建 | Pro 升级页面 |
| `/app/onboarding/profile/page.tsx` | ✅ 新建 | 个人资料设置 |
| `/lib/data-mapping.ts` | ✅ 新建 | 严格数据映射 |
| `/components/EmptyRadarChart.tsx` | ✅ 新建 | 空状态组件 |
| `/app/api/ai/chat/route.ts` | ⏳ 待更新 | AI 诚实性 |
| `/lib/health-logic.ts` | ⏳ 待更新 | 推荐任务诚实性 |

### 设计原则

1. **数据完整性优先**：宁可显示空状态，也不伪造数据
2. **用户教育**：明确告知为什么需要真实数据
3. **渐进式解锁**：3 天解锁图表，7 天解锁趋势，30 天解锁长期分析
4. **诚实 AI**：AI 承认数据缺失，引导用户记录

---

## 🎯 下一步行动

1. ✅ 完成 Phase 1 和 Phase 2 实施
2. ⏳ 测试新用户流程
3. ⏳ 实施 Phase 3（AI 诚实性）
4. ⏳ 添加日志记录模态框集成
5. ⏳ 监控数据质量指标

---

**当前状态**: Phase 1 和 Phase 2 已完成 ✅  
**待办**: Phase 3 和全面测试 ⏳

**问题反馈**: 如发现数据伪造或AI编造数据，请立即报告并回滚。
