# 个性化健康参数设置模块

## 概述
全新重写的健康参数设置页面，简洁、直观，无 RLS 策略问题。

## 功能模块

### 模块一：核心基础指标
用于计算基础代谢率 (BMR) 和每日总能量消耗 (TDEE)

1. **性别**（必填）
   - 选项：男 / 女 / 暂不透露
   - 用途：BMR 计算必需

2. **出生日期**（必填）
   - 格式：年-月-日选择器
   - 用途：年龄计算，不同年龄段健康建议不同

3. **身高**（必填）
   - 单位：厘米
   - 用途：BMI、BMR、体脂率计算

4. **当前体重**（必填）
   - 单位：公斤
   - 用途：BMI、BMR 计算，监控变化趋势

5. **日常活动量**（必填）
   - 久坐型：大部分时间坐着（办公室职员、程序员）
   - 轻度活跃：少量站立和行走（教师、客服）
   - 中度活跃：需经常站立和行走（服务员、快递员）
   - 高度活跃：大量体力劳动（建筑工人、健身教练）
   - 用途：估算 TDEE，影响饮食和运动建议

6. **体脂率**（可选）
   - 单位：百分比
   - 用途：比 BMI 更准确反映身体状况
   - 提示：如有智能体脂秤可输入

### 模块二：目标设定
决定 AI 辅助的方向和习惯调整重点

1. **主要健康目标**（必填）
   - 减轻体重
   - 保持健康 / 改善精力
   - 增加肌肉
   - 改善特定指标（睡眠、压力等）

2. **目标体重**（条件必填）
   - 当选择"减轻体重"或"增加肌肉"时必填
   - 单位：公斤
   - 用途：AI 规划卡路里缺口或盈余

3. **每周目标速率**（可选）
   - **减重速率：**
     - 轻松（约 0.25 kg/周）
     - 推荐（约 0.5 kg/周）
     - 进取（约 1 kg/周）
   - **增肌速率：**
     - 缓慢（约 0.1 kg/周）
     - 推荐（约 0.2 kg/周）
   - 用途：AI 调整建议的松紧度

## 技术实现

### 关键特性
1. **两步式表单**：先填基础指标，再设定目标
2. **实时验证**：每步验证必填项，防止提交无效数据
3. **RLS 友好**：使用 `upsert` 操作，避免行级安全策略冲突
4. **自动跳转**：保存成功后 1 秒自动返回主页

### 数据库操作
```typescript
const { error } = await supabase
  .from('profiles')
  .upsert(payload, { 
    onConflict: 'id', 
    ignoreDuplicates: false 
  });
```

### 保存的字段
- `gender`: 性别
- `birth_date`: 出生日期
- `height_cm`: 身高（厘米）
- `weight_kg`: 体重（公斤）
- `activity_level`: 活动水平
- `body_fat_percentage`: 体脂率
- `primary_goal`: 主要目标
- `target_weight_kg`: 目标体重
- `weekly_goal_rate`: 每周速率
- `ai_profile_completed`: 标记为已完成

## 使用说明

### 访问页面
登录后访问：`/assistant`

### 用户流程
1. 填写核心基础指标（5个必填 + 1个可选）
2. 点击"下一步：目标设定"
3. 选择主要健康目标
4. 根据目标填写相关参数
5. 点击"保存设置"
6. 自动返回主页

### 隐私保护
- 页面顶部显示隐私提示
- 所有数据严格保密
- 仅用于 AI 个性化建议

## 文件结构
- `components/HealthProfileForm.tsx` - 主表单组件
- `app/assistant/page.tsx` - 设置页面入口
- `lib/supabase-client.ts` - 数据库客户端

## 已删除的旧组件
- ✅ `components/SettingsPanel.tsx`
- ✅ `components/AIAssistantProfileForm.tsx`
- ✅ `components/ProfileSettingsPanel.tsx`
- ✅ `components/settings/BasicInfoPanel.tsx`
- ✅ `components/ReminderPreferencesPanel.tsx`
- ✅ `app/api/auth/web3/route.ts`（Web3 登录功能）

## 问题已解决
- ✅ RLS 策略冲突 - 使用 upsert 替代 insert/update
- ✅ Cookie 解析错误 - 移除手动配置
- ✅ 复杂设置流程 - 简化为两步式表单
- ✅ 保存失败 - 统一使用 upsert 操作
- ✅ 无法跳转 - 成功后自动返回主页
