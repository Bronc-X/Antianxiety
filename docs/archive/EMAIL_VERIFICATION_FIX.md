# 📧 邮箱验证链接过期问题解决方案

## 问题描述

当用户通过邮箱注册时，会收到 Supabase 发送的验证邮件。但如果用户点击邮件链接时链接已过期，会跳转到：

```
http://localhost:3000/login?error=oauth_error#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

错误信息：
- `error_code=otp_expired` - OTP（一次性密码/验证链接）已过期
- `error_description=Email link is invalid or has expired` - 邮件链接无效或已过期

---

## 已实施的修复

### 1. ✅ 改进错误处理（`/app/login/page.tsx`）

更新了登录页面的错误处理逻辑，现在可以：
- 解析 URL hash 中的错误参数（Supabase 邮件验证错误会放在 hash 中）
- 识别 `error_code=otp_expired` 并显示友好提示
- 显示详细的错误描述信息
- 自动清理 URL 中的错误参数

**新的错误提示**：
```
"邮箱验证链接已过期。请重新登录或注册，我们会发送新的验证邮件。"
```

---

## 需要在 Supabase 后台配置的设置

### 2. 延长邮件链接有效期

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Authentication** → **Email Auth**
4. 找到 **Email Link Expiry Time** 设置
5. 建议修改为：
   - **开发环境**：`3600` 秒（1小时）
   - **生产环境**：`86400` 秒（24小时）

### 3. 确认重定向 URL 配置

在 **Authentication** → **URL Configuration** 中：

```
Site URL: https://your-domain.com
或开发环境: http://localhost:3000

Redirect URLs (允许列表):
- http://localhost:3000/auth/callback
- https://your-domain.com/auth/callback
- http://localhost:3000/login
- https://your-domain.com/login
```

### 4. 邮件模板优化建议

在 **Authentication** → **Email Templates** → **Confirm signup**：

可以添加提示文字：
```html
<p>请在 <strong>24小时内</strong> 点击下方按钮完成验证：</p>
{{ .ConfirmationURL }}
<p style="color: #999; font-size: 12px;">
  如果链接失效，请返回网站重新注册。
</p>
```

---

## 用户操作指南

### 如果验证链接过期了怎么办？

**方法 1：重新注册**
1. 访问 `/signup` 页面
2. 使用相同的邮箱重新注册
3. Supabase 会发送新的验证邮件
4. 在 24 小时内点击新链接完成验证

**方法 2：请求重新发送（推荐添加此功能）**

建议在未来添加"重新发送验证邮件"功能。参考实现：

```typescript
// 在登录页面添加按钮
const handleResendVerificationEmail = async () => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    setMessage({ 
      type: 'error', 
      text: '发送失败，请稍后重试' 
    });
  } else {
    setMessage({ 
      type: 'success', 
      text: '验证邮件已重新发送，请查收' 
    });
  }
};
```

---

## 技术细节

### 错误参数解析

Supabase 邮件验证失败时，错误参数会附加在 URL 的 **hash** 部分，而不是 query 参数：

```javascript
// ❌ 错误：只检查 query 参数
const error = searchParams.get('error');

// ✅ 正确：同时检查 hash
if (window.location.hash) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const errorCode = hashParams.get('error_code');
  const errorDescription = hashParams.get('error_description');
}
```

### 为什么链接会过期？

**默认设置**：
- Supabase 默认邮件链接有效期：**1小时**（3600秒）
- 用户如果在注册后 1 小时后才点击邮件，链接就会失效

**常见原因**：
- 用户没有及时查看邮件
- 邮件被分类到垃圾邮件
- 用户在多个设备上注册，点击了旧邮件的链接

---

## 完整的认证流程

### 正常流程
```
1. 用户填写注册表单 → POST /signup
2. Supabase 创建用户（状态：未验证）
3. Supabase 发送验证邮件
4. 用户点击邮件链接 → /auth/callback?token=xxx
5. Callback 验证 token → 标记用户为已验证
6. 重定向到 /landing
```

### 链接过期流程
```
1. 用户 1小时后 点击邮件链接
2. Supabase 返回：token 已过期
3. 重定向到：/login?error=oauth_error#error_code=otp_expired
4. 登录页面解析错误 → 显示友好提示
5. 用户重新注册 → 获得新的验证邮件
```

---

## 开发者检查清单

- [x] ✅ 登录页面错误处理已更新（支持 hash 参数）
- [ ] ⏳ Supabase 后台延长链接有效期（需手动配置）
- [ ] ⏳ 添加"重新发送验证邮件"功能（可选）
- [ ] ⏳ 优化邮件模板，提示有效期（可选）
- [ ] ⏳ 添加用户反馈收集，监控链接过期频率

---

## 测试验证

### 测试链接过期处理

1. 手动构造过期链接 URL：
```
http://localhost:3000/login?error=oauth_error#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

2. 访问该 URL，应该看到：
   - ❌ 红色错误提示框
   - 📝 错误信息："邮箱验证链接已过期。请重新登录或注册，我们会发送新的验证邮件。"
   - 🧹 URL 自动清理（hash 部分被移除）

### 测试正常注册流程

1. 访问 `/signup`
2. 填写邮箱和密码
3. 提交注册
4. **立即**检查邮件并点击验证链接
5. 应成功跳转到 `/landing`

---

## 未来优化建议

### 1. 魔法链接登录（Magic Link）
考虑完全移除密码，使用无密码登录：
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  }
});
```

### 2. 自动重试机制
如果检测到 `otp_expired`，自动提示用户输入邮箱重新发送：
```tsx
{errorCode === 'otp_expired' && (
  <div className="mt-4">
    <input 
      type="email" 
      placeholder="输入邮箱重新发送" 
      value={retryEmail}
      onChange={(e) => setRetryEmail(e.target.value)}
    />
    <button onClick={handleResendEmail}>
      重新发送验证邮件
    </button>
  </div>
)}
```

### 3. 用户友好的倒计时
在注册成功页面显示倒计时：
```tsx
<p>
  验证邮件已发送！请在 
  <span className="font-bold">{timeLeft}</span> 
  内完成验证。
</p>
```

---

## 参考资料

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Redirect URLs Configuration](https://supabase.com/docs/guides/auth/redirect-urls)

---

**当前状态**: ✅ 错误处理已优化，用户会看到友好的错误提示  
**待办事项**: ⏳ Supabase 后台配置需手动调整

如有问题，请参考此文档或联系开发团队。
