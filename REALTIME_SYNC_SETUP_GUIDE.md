# 跨设备实时同步设置指南

## 📋 概述

使用 Supabase Realtime 实现跨设备数据同步，当用户在 iOS 或 Web 端进行任何操作时，其他设备会自动收到更新。

---

## 🔧 步骤 1: 在 Supabase 中启用 Realtime

### 方法：通过 SQL 命令启用

Supabase Realtime 需要通过 SQL 将表添加到 `supabase_realtime` 发布中。

### 操作步骤

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**（左侧菜单中的 SQL 编辑器图标）
3. 执行以下 SQL 脚本：

**文件位置**: `supabase_enable_realtime.sql`

```sql
-- 启用 habits 表的 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;

-- 启用 habit_completions 表的 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_completions;

-- 启用 user_metrics 表的 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_metrics;

-- 启用 profiles 表的 Realtime（可选）
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

4. 点击 **Run** 执行 SQL

### 验证是否启用成功

执行以下 SQL 查看已启用 Realtime 的表：

```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

你应该能看到以下表：
- `habits`
- `habit_completions`
- `user_metrics`
- `profiles`（如果已添加）

### 注意

- **不是通过 UI 开关**：Supabase 的 Realtime 不是通过 Dashboard 中的开关启用的
- **需要 SQL 命令**：必须通过 `ALTER PUBLICATION` 命令将表添加到发布中
- **一次性设置**：执行一次后，表就会持续启用 Realtime，除非手动移除

---

## ✅ 验证设置

### 测试 1: 检查 Realtime 是否启用

在 Supabase Dashboard 中：
1. 进入 **Database** → **Replication**
2. 确认上述表的状态为 **Enabled**

### 测试 2: 跨设备测试

1. **设备 A（iOS）**：
   - 创建一个新习惯
   - 完成一个习惯打卡

2. **设备 B（Web）**：
   - 打开习惯列表页面
   - 应该自动看到新创建的习惯
   - 应该自动看到完成的打卡记录

3. **设备 B（Web）**：
   - 修改一个习惯
   - 删除一个习惯

4. **设备 A（iOS）**：
   - 应该自动看到修改和删除的变化

---

## 📊 实现细节

### iOS 端实现

**文件**: `src/hooks/useHabits.ts`

已实现以下 Realtime 订阅：
- `habits` 表：监听 INSERT、UPDATE、DELETE 事件
- `habit_completions` 表：监听 INSERT、UPDATE、DELETE 事件
- `user_metrics` 表：监听 INSERT、UPDATE 事件

### Web 端实现

Web 端需要在相应的组件或 hooks 中添加类似的 Realtime 订阅。

---

## 🐛 故障排除

### 问题 1: 数据没有实时同步

**可能原因**：
- Realtime 未在 Supabase Dashboard 中启用
- 网络连接问题
- RLS 策略阻止了订阅

**解决方案**：
1. 检查 Supabase Dashboard 中的 Realtime 设置
2. 检查浏览器/设备网络连接
3. 确保 RLS 策略允许用户访问自己的数据

### 问题 2: 收到重复的更新

**可能原因**：
- 订阅了多个频道
- 清理函数未正确执行

**解决方案**：
- 确保在组件卸载时正确取消订阅
- 检查是否有多个组件同时订阅了同一个表

### 问题 3: 性能问题

**可能原因**：
- 订阅了太多表
- 更新频率过高

**解决方案**：
- 只订阅必要的表
- 考虑使用防抖（debounce）来减少更新频率
- 优化查询，只获取必要的数据

---

## 🎯 使用场景

### 场景 1: 用户在 iOS 端完成习惯打卡

1. 用户在 iOS 端点击"完成"按钮
2. 数据插入到 `habit_completions` 表
3. Realtime 触发，Web 端自动收到更新
4. Web 端自动刷新习惯列表和完成记录

### 场景 2: 用户在 Web 端创建新习惯

1. 用户在 Web 端创建新习惯
2. 数据插入到 `habits` 表
3. Realtime 触发，iOS 端自动收到更新
4. iOS 端自动刷新习惯列表

### 场景 3: 贝叶斯函数自动更新指标

1. 用户完成习惯打卡
2. 数据库触发器自动计算指标
3. `user_metrics` 表更新
4. Realtime 触发，所有设备自动更新图表

---

## 📝 注意事项

1. **RLS 策略**：确保所有启用了 Realtime 的表都有正确的 RLS 策略，否则用户可能无法订阅。

2. **性能优化**：
   - 只订阅用户自己的数据（使用 `filter`）
   - 避免订阅不必要的事件类型
   - 在组件卸载时正确清理订阅

3. **错误处理**：
   - 监听订阅错误
   - 在连接断开时自动重连
   - 提供降级方案（轮询）

4. **测试**：
   - 在不同设备上测试同步
   - 测试网络断开和重连的情况
   - 测试并发更新

---

## 🚀 下一步

完成设置后，可以：
1. 测试跨设备同步功能
2. 优化性能（如果需要）
3. 添加错误处理和重连逻辑
4. 考虑添加离线支持

