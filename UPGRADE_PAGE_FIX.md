# 升级页面返回逻辑修复

## 问题描述
登录状态下，点击"升级"按钮进入升级页面，关闭（X）后错误地跳转到"完善健康资料"（`/onboarding/profile`），而不是返回 Landing 页。

## 根本原因
`/onboarding/upgrade/page.tsx` 的 `handleSkip()` 函数硬编码了返回路径为 `/onboarding/profile`，未区分用户来源（新用户 onboarding 流程 vs 已登录用户查看升级）。

## 解决方案

### 1. 升级页面逻辑更新
**文件:** `app/onboarding/upgrade/page.tsx`

**更改:**
- 添加 `useSearchParams` 和 `useEffect` 检测来源
- 根据 URL 参数 `from` 或 `returnTo` 决定返回路径
- 默认保持 `/onboarding/profile`（onboarding 流程）
- 如果 `from=landing` 或 `from=menu`，返回 `/landing`

**逻辑:**
```typescript
const [returnPath, setReturnPath] = useState('/onboarding/profile');

useEffect(() => {
  const from = searchParams.get('from');
  const returnTo = searchParams.get('returnTo');
  
  if (returnTo) {
    setReturnPath(returnTo);
  } else if (from === 'landing' || from === 'menu') {
    setReturnPath('/landing');
  }
}, [searchParams]);
```

### 2. 导航栏升级链接
**文件:** `components/MarketingNav.tsx`

**更改:**
```diff
- href="/onboarding/upgrade"
+ href="/onboarding/upgrade?from=landing"
```

### 3. 用户菜单升级链接
**文件:** `components/UserProfileMenu.tsx`

**更改:**
```diff
- href="/pricing"
+ href="/onboarding/upgrade?from=menu"
```

## 使用场景

### 场景 1: Onboarding 流程（新用户）
```
用户完成问卷 
  → /onboarding/upgrade (无参数)
  → 点击"X"关闭
  → 返回 /onboarding/profile ✅
```

### 场景 2: Landing 页导航栏
```
已登录用户在 Landing 页
  → 点击"升级"
  → /onboarding/upgrade?from=landing
  → 点击"X"关闭
  → 返回 /landing ✅
```

### 场景 3: 用户菜单
```
已登录用户点击头像
  → 选择"🚀 升级订阅"
  → /onboarding/upgrade?from=menu
  → 点击"X"关闭
  → 返回 /landing ✅
```

### 场景 4: 自定义返回路径
```
任意页面链接：
  href="/onboarding/upgrade?returnTo=/assistant"
  → 点击"X"关闭
  → 返回 /assistant ✅
```

## 测试验证

### 手动测试步骤

1. **测试已登录用户 - 导航栏**
   - 登录账号
   - 在 Landing 页点击"升级"
   - 点击"X"关闭
   - ✅ 应返回 Landing 页

2. **测试已登录用户 - 用户菜单**
   - 登录账号
   - 点击头像菜单
   - 选择"🚀 升级订阅"
   - 点击"X"关闭
   - ✅ 应返回 Landing 页

3. **测试新用户 - Onboarding 流程**
   - 完成问卷
   - 自动跳转到升级页（无参数）
   - 点击"X"或"跳过"
   - ✅ 应继续到个人资料页

## 文件变更清单

- ✅ `app/onboarding/upgrade/page.tsx` - 添加智能返回逻辑
- ✅ `components/MarketingNav.tsx` - 升级链接添加 `?from=landing`
- ✅ `components/UserProfileMenu.tsx` - 升级链接添加 `?from=menu`

## 兼容性

- ✅ 向后兼容：无参数时保持原有行为（返回 `/onboarding/profile`）
- ✅ 新流程：带参数时根据来源智能返回
- ✅ 可扩展：支持 `returnTo` 参数自定义返回路径

---

**状态:** ✅ 已修复
**测试:** 待用户验证
**影响范围:** 升级页面用户体验优化
