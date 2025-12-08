# 升级界面跳转和Onboarding流程修复

## 问题描述
用户反映点击升级界面右上角关闭按钮后，会跳转到 `/onboarding/profile` 页面，且该页面会重复出现，而用户希望该流程只需要完成一次。

## 问题分析

### 1. 升级页面跳转逻辑问题
- 从设置页面(`/settings`)进入升级页面时，`from=settings`
- 但原有逻辑没有处理 `settings` 来源，导致默认跳转到 `/onboarding/profile`
- 用户期望从设置页面进入应该跳转回设置页面

### 2. Onboarding流程重复显示问题
- `/onboarding/profile` 页面没有检查用户是否已完成设置
- 导致已完成用户仍会看到个人资料设置表单

## 修复方案

### 1. 升级页面跳转逻辑修复 (`/app/onboarding/upgrade/page.tsx`)

```typescript
// 修复前
useEffect(() => {
  const from = searchParams.get('from');
  if (from === 'landing' || from === 'menu') {
    setReturnPath('/landing');
  }
  // 没有处理 settings 来源
}, [searchParams]);

// 修复后
useEffect(() => {
  const from = searchParams.get('from');
  if (from === 'landing' || from === 'menu') {
    setReturnPath('/landing');
  } else if (from === 'settings') {
    // 从设置页面进入，返回设置页面
    setReturnPath('/settings');
  }
}, [searchParams]);
```

### 2. Onboarding Profile页面完成检查 (`/app/onboarding/profile/page.tsx`)

```typescript
// 新增：检查用户是否已完成个人资料设置
useEffect(() => {
  const checkUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/login');
      return;
    }
    
    setUserId(user.id);
    
    // 检查用户是否已完成个人资料设置
    const { data: profile } = await supabase
      .from('profiles')
      .select('height, weight, age')
      .eq('id', user.id)
      .single();
    
    // 如果用户已完成设置，直接跳转到主页
    if (profile && profile.height && profile.weight && profile.age) {
      console.log('用户已完成个人资料设置，跳转到主页');
      router.push('/landing');
      return;
    }
  };
  checkUser();
}, [supabase, router]);
```

## 修复后的用户流程

### 从设置页面升级的用户：
1. 点击设置页面"升级到Pro" → 进入升级页面 (`?from=settings`)
2. 点击右上角关闭按钮 → 返回设置页面 (`/settings`) ✅

### 已完成设置的用户：
1. 访问 `/onboarding/profile` → 自动检查是否已完成设置
2. 如果已完成 → 直接跳转到主页 (`/landing`) ✅
3. 如果未完成 → 显示设置表单

### 新用户onboarding流程：
1. 注册 → 升级页面 → 跳过/完成 → `/onboarding/profile`
2. 填写个人资料 → 保存 → `/landing`
3. 后续不再显示onboarding页面 ✅

## 测试步骤

1. **测试设置页面升级跳转**：
   - 访问 `/settings` → 点击"升级到Pro"
   - 在升级页面点击右上角X按钮
   - 验证是否跳转回 `/settings`

2. **测试已完成用户访问onboarding**：
   - 确保用户已填写身高、体重、年龄
   - 直接访问 `/onboarding/profile`
   - 验证是否自动跳转到 `/landing`

3. **测试新用户流程**：
   - 清空用户profile数据
   - 访问 `/onboarding/profile`
   - 验证显示设置表单而不是跳转
