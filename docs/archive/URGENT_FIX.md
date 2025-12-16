# 🚨 紧急修复：Profiles表缺少列

## 问题
```
保存失败：Could not find the 'ai_persona_context' column of 'profiles' in the schema cache
```

## 原因
Supabase的`profiles`表缺少必需的列

---

## ✅ 立即修复方案（2步）

### 步骤1: 执行SQL Migration（必须）

**文件**: `supabase/migrations/20251124_add_missing_columns.sql`

**操作**:
```bash
1. 登录 Supabase Dashboard
   https://app.supabase.com/project/YOUR_PROJECT_ID

2. 进入 SQL Editor（左侧菜单）

3. 打开本地文件：
   supabase/migrations/20251124_add_missing_columns.sql

4. 复制全部内容

5. 粘贴到 SQL Editor

6. 点击 Run（执行）

7. 查看输出：应该显示
   "✅ Profiles表结构正确，包含 X 个必需列"
```

---

### 步骤2: 测试问卷流程

```bash
# 1. 代码已临时修改，只保存metabolic_profile
#    现在就可以测试，不会报错

# 2. 打开浏览器无痕模式
http://localhost:3000/signup

# 3. 注册新用户 → 填写问卷 → 提交
```

**预期结果**:
- ✅ 提交成功（不再报错）
- ✅ 跳转到升级页面
- ✅ metabolic_profile已保存

---

## 📊 Migration做了什么

### 添加的列
```sql
- ai_persona_context       TEXT            -- AI人格上下文
- metabolic_profile        JSONB           -- 代谢档案（核心）
- onboarding_completed_at  TIMESTAMPTZ     -- 完成时间
- primary_concern          TEXT            -- 主要关注点
- ai_profile_completed     BOOLEAN         -- AI资料完成标记
- full_name                TEXT            -- 全名
- avatar_url               TEXT            -- 头像URL
- created_at               TIMESTAMPTZ     -- 创建时间
- updated_at               TIMESTAMPTZ     -- 更新时间
```

### 创建的触发器
```sql
- handle_updated_at()      -- 自动更新updated_at时间戳
- set_profiles_updated_at  -- 更新触发器
```

### 创建的索引
```sql
- idx_profiles_metabolic_profile    -- JSONB索引（提高查询性能）
- idx_profiles_onboarding_completed -- 时间戳索引
```

---

## 🔄 完整的Migration执行顺序

**推荐顺序**:
```
1. 20251124_add_missing_columns.sql       ✅ 先执行（添加列）
2. 20251124_fix_profiles_trigger_v2.sql   ✅ 再执行（创建触发器）
```

---

## 🎯 代码临时修改说明

**文件**: `app/onboarding/OnboardingFlowClient.tsx`

**修改前**（会报错）:
```typescript
.upsert({
  id: userId,
  metabolic_profile: metabolicProfile,
  ai_persona_context: personaContext,        // ❌ 列不存在
  onboarding_completed_at: new Date(),       // ❌ 列不存在
  created_at: new Date(),
  updated_at: new Date(),
})
```

**修改后**（不报错）:
```typescript
.upsert({
  id: userId,
  metabolic_profile: metabolicProfile,       // ✅ 只保存这个
})
```

**说明**:
- 现在只保存最小必需字段（`id` 和 `metabolic_profile`）
- 执行migration后，可以添加回其他字段
- 这样即使列不存在，问卷也能正常工作

---

## ✅ 验证清单

### SQL Migration
- [ ] 在Supabase执行`20251124_add_missing_columns.sql`
- [ ] 看到"✅ Profiles表结构正确"消息
- [ ] 执行`20251124_fix_profiles_trigger_v2.sql`
- [ ] 看到"✅ 触发器创建成功"消息

### 功能测试
- [ ] 注册新用户成功
- [ ] 自动跳转到问卷
- [ ] 填写问卷不报错
- [ ] 提交问卷成功保存
- [ ] 跳转到升级页面

### 数据验证
```sql
-- 在Supabase SQL Editor执行
SELECT 
  id, 
  metabolic_profile,
  ai_persona_context,
  onboarding_completed_at,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🚀 立即行动

1. **立即**: 执行SQL migration（`20251124_add_missing_columns.sql`）
2. **然后**: 测试注册和问卷流程
3. **验证**: 检查Supabase中的数据

---

## 📝 执行后的完整流程

```
1. 用户注册
   ↓
2. 触发器创建profile（只有id）
   ↓
3. 自动跳转到问卷
   ↓
4. 用户填写问卷
   ↓
5. 点击提交
   ↓
6. upsert保存metabolic_profile ✅
   ↓
7. 跳转到升级页面 ✅
   ↓
8. 再次登录，直接进入landing ✅
```

---

**所有代码已临时修复，可以立即测试！但仍需执行SQL migration以获得完整功能。** 🚀
