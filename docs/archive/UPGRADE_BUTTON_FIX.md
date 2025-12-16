# 升级Pro按钮修复

## 问题
在 `/settings` 页面的"账号与会员"Tab中，"升级到Pro"按钮点击无跳转。

## 原因
按钮缺少 `onClick` 事件处理函数：
```jsx
// 修复前 - 没有onClick事件
<button className="...">
  <CreditCard className="w-4 h-4" />
  升级到 Pro
</button>
```

## 修复
添加 `onClick` 事件处理函数，跳转到升级页面：
```jsx
// 修复后 - 添加onClick事件
<button 
  onClick={() => router.push('/onboarding/upgrade?from=settings')}
  className="..."
>
  <CreditCard className="w-4 h-4" />
  升级到 Pro
</button>
```

## 跳转目标
- **页面**: `/onboarding/upgrade`
- **来源参数**: `?from=settings`
- **功能**: 显示Pro订阅选项和价格

## 其他升级入口检查
✅ **导航栏升级链接**: `/onboarding/upgrade?from=landing` - 正常
✅ **用户菜单升级订阅**: `/onboarding/upgrade?from=menu` - 正常  
✅ **设置页面升级Pro**: `/onboarding/upgrade?from=settings` - 已修复

## 测试步骤
1. 访问 `http://localhost:3000/settings`
2. 切换到"账号与会员"Tab
3. 点击"升级到Pro"按钮
4. 验证是否跳转到升级页面

## 预期结果
点击按钮后应该跳转到 `/onboarding/upgrade?from=settings` 页面，显示Pro订阅选项。
