# 沉浸式问卷系统完整集成文档

**日期**: 2025-11-24  
**目标**: 创建"直击灵魂"的代谢焦虑问卷，并深度集成到AI助理、分析报告和健康逻辑中

---

## 🎯 系统概览

### 核心理念

**不是问卷，是共鸣引擎**

- ❌ 传统问卷：医学术语 + 量表评分 + 冷冰冰的表格
- ✅ 我们的问卷："你是否在凌晨3-4点醒来，脑子像放电影一样过工作的事？"

**目标用户**: 30-45岁，感受到代谢下降但不知如何应对的人群

---

## 📁 创建的文件

### 1. `/lib/questions.ts` - 问卷数据结构

**内容**:
- 5个核心问题（基于代谢焦虑症状）
- 数据映射函数 `mapAnswersToProfile()`
- AI人格上下文生成 `generatePersonaContext()`

**5个问题**:
1. **能量崩溃** - "下午2-4点断崖式能量跌落"
2. **睡眠维持** - "凌晨3-4点醒来，再也睡不着"
3. **身体成分** - "腰腹肉松松垮垮，怎么练都紧致不起来"
4. **压力耐受** - "以前能轻松应对的琐事，现在容易心跳加速"
5. **之前失败** - "试过少吃碳水/强迫运动但失败了"

**数据映射逻辑**:
```typescript
答案 → MetabolicProfile {
  energy_pattern: 'crash_afternoon' | 'stable' | 'variable',
  sleep_pattern: 'cortisol_imbalance' | 'normal' | 'occasional_issue',
  body_pattern: 'metabolic_slowdown' | 'slight_change' | 'healthy',
  stress_pattern: 'low_tolerance' | 'medium_tolerance' | 'high_tolerance',
  psychology: 'frustrated' | 'curious' | 'successful',
  overall_score: 5-15,
  severity: 'high' | 'medium' | 'low'
}
```

---

### 2. `/components/OnboardingFlow.tsx` - 沉浸式UI组件

**设计特点**:
- ✅ 全屏沉浸式（一次只显示1个问题）
- ✅ Framer Motion 平滑过渡动画
- ✅ 顶部细进度条（绿色 `#0B3D2E`）
- ✅ 大号卡片式选项（悬停放大效果）
- ✅ 自动前进（单选题选择后自动跳转）

**分析阶段动画**:
```
最后一题完成后 →
  "AI 正在分析你的代谢指纹..." (1秒)
  "正在构建皮质醇模型..." (1秒)
  "生成个性化方案..." (1秒)
→ 跳转到主页
```

**视觉元素**:
- 脉动圆形（绿色渐变）
- 进度点指示器
- 米白色背景 `#FFFBF0`

---

### 3. `/app/onboarding/page.tsx` - 服务端页面

**功能**:
- 验证用户登录状态
- 检查是否已完成问卷（`metabolic_profile` 不为空 → 重定向）
- 渲染 `OnboardingFlowClient`

---

### 4. `/app/onboarding/OnboardingFlowClient.tsx` - 客户端逻辑

**职责**:
1. 接收问卷答案
2. 调用 `mapAnswersToProfile()` 映射为代谢档案
3. 调用 `generatePersonaContext()` 生成AI上下文
4. 保存到 Supabase `profiles` 表
5. 跳转到 `/landing`

**数据保存**:
```typescript
supabase.from('profiles').update({
  metabolic_profile: {...},        // JSONB
  ai_persona_context: "...",       // TEXT
  onboarding_completed_at: "..."   // TIMESTAMPTZ
})
```

---

## 🗄️ 数据库集成

### 新增字段（`profiles` 表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `metabolic_profile` | JSONB | 结构化代谢档案 |
| `ai_persona_context` | TEXT | AI生成的人格上下文 |
| `onboarding_completed_at` | TIMESTAMPTZ | 问卷完成时间 |

### SQL Migration

**文件**: `/supabase_metabolic_profile.sql`

```sql
ALTER TABLE profiles 
ADD COLUMN metabolic_profile JSONB DEFAULT NULL;

ALTER TABLE profiles 
ADD COLUMN ai_persona_context TEXT DEFAULT NULL;

ALTER TABLE profiles 
ADD COLUMN onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_profiles_metabolic_profile 
ON profiles USING GIN (metabolic_profile);
```

**执行方式**:
```bash
# 在 Supabase Dashboard → SQL Editor 中执行
# 或使用 Supabase CLI
supabase db push
```

---

## 🤖 AI上下文注入

### 修改文件: `/app/api/ai/chat/route.ts`

**更新接口**:
```typescript
interface MetabolicProfile {
  energy_pattern?: string;
  sleep_pattern?: string;
  body_pattern?: string;
  stress_pattern?: string;
  psychology?: string;
  overall_score?: number;
  severity?: string;
}

interface UserProfileData {
  // ...existing fields
  metabolic_profile?: MetabolicProfile | null;
  ai_persona_context?: string | null;
}
```

**系统提示注入逻辑** (Line 352-369):
```typescript
// 优先使用 metabolic_profile + ai_persona_context（新问卷系统）
if (userProfile.metabolic_profile || userProfile.ai_persona_context) {
  prompt += `**用户代谢档案（来自问卷诊断）：**\n`;
  
  if (userProfile.ai_persona_context) {
    // 直接注入AI生成的人格上下文
    prompt += userProfile.ai_persona_context + '\n\n';
  } else if (userProfile.metabolic_profile) {
    // 手动构建
    const mp = userProfile.metabolic_profile;
    prompt += `- 症状严重程度：${mp.severity}\n`;
    prompt += `- 能量模式：${mp.energy_pattern}\n`;
    // ... 其他字段
  }
}
```

**效果示例**:

AI助理将收到类似这样的上下文：
```
用户代谢档案（来自问卷诊断）:
- 症状严重程度: 高
- 主要症状: 下午能量断崖式跌落、凌晨3-4点醒来且难以再次入睡（皮质醇失衡）
- 心理状态: 曾多次尝试节食或强制运动但失败，感到挫败

指导原则:
1. 用共情但科学的语气回应（避免空洞的"加油"）
2. 优先解释"为什么"（生理机制）而非直接给建议
3. 推荐"最低有效剂量"的干预（如5分钟步行而非1小时跑步）
4. 认可用户之前的努力，强调"不是你的错，是方法不对"
```

---

## 🧠 健康逻辑更新

### 修改文件: `/lib/health-logic.ts`

**新增导出**:
```typescript
export interface MetabolicProfile {
  energy_pattern?: 'crash_afternoon' | 'stable' | 'variable';
  sleep_pattern?: 'cortisol_imbalance' | 'normal' | 'occasional_issue';
  body_pattern?: 'metabolic_slowdown' | 'slight_change' | 'healthy';
  stress_pattern?: 'low_tolerance' | 'medium_tolerance' | 'high_tolerance';
  psychology?: 'frustrated' | 'curious' | 'successful';
  overall_score?: number;
  severity?: 'high' | 'medium' | 'low';
}
```

**更新函数签名**:
```typescript
export function getRecommendedTask(
  mode: UserMode, 
  userConcern: PrimaryConcern,
  metabolicProfile?: MetabolicProfile | null  // 新增参数
): RecommendedTask
```

**Fallback 逻辑** (Line 87-91):
```typescript
// 新用户 Fallback: 基于问卷的初始推荐
// 如果 mode 是默认状态（无日志数据）且有代谢档案，使用问卷结果
if (mode === 'BALANCED' && metabolicProfile) {
  return getRecommendationFromProfile(metabolicProfile);
}
```

**新增函数**: `getRecommendationFromProfile()`

**映射逻辑**:
```
皮质醇失衡 → 早晨户外阳光暴露（10分钟）
  理由：重置生物钟，帮助皮质醇在正确时间达到峰值

能量崩溃 → 餐后5分钟步行
  理由：缓冲血糖尖峰，避免下午崩溃

压力耐受低 → Box Breathing（5分钟）
  理由：激活迷走神经，降低交感神经活跃度

代谢减缓 → Zone 2快走（15分钟）
  理由：燃脂最佳强度，不消耗能量储备

之前挫败 → 睡前3分钟呼吸
  理由：最小阻力，几乎不可能失败，重建信念强度
```

---

## 🔗 Landing Page 集成

### 修改文件: `/app/landing/page.tsx`

**查询更新** (Line 64):
```typescript
supabase
  .from('profiles')
  .select('full_name, primary_concern, metabolic_profile, ai_persona_context')
  // 新增查询 metabolic_profile 和 ai_persona_context
```

**传递参数** (Line 106-108):
```typescript
const primaryConcern = profile ? profile.primary_concern : null;
const metabolicProfile = profile ? profile.metabolic_profile : null;
const recommendedTask = getRecommendedTask(userState.mode, primaryConcern, metabolicProfile);
```

---

## 🎨 用户体验流程

### 新用户完整旅程

```
1. 注册/登录
   ↓
2. 访问 /onboarding（自动跳转）
   ↓
3. 沉浸式问卷
   ├─ 问题 1/5: 能量崩溃？
   ├─ 问题 2/5: 睡眠维持？
   ├─ 问题 3/5: 身体成分？
   ├─ 问题 4/5: 压力耐受？
   └─ 问题 5/5: 之前失败？
   ↓
4. 分析阶段（3秒动画）
   ├─ "AI 正在分析你的代谢指纹..."
   ├─ "正在构建皮质醇模型..."
   └─ "生成个性化方案..."
   ↓
5. 保存到数据库
   ├─ metabolic_profile (JSONB)
   ├─ ai_persona_context (TEXT)
   └─ onboarding_completed_at (TIMESTAMPTZ)
   ↓
6. 跳转到 /landing
   ├─ 显示基于问卷的推荐任务
   ├─ 例如："早晨户外阳光暴露 10分钟"
   └─ 理由："你的问卷显示凌晨3-4点醒来..."
   ↓
7. 访问 /assistant（AI助理）
   └─ AI 已加载用户代谢档案上下文
       "我注意到你凌晨3-4点经常醒来，这通常意味着皮质醇节律紊乱..."
```

### 老用户体验

```
已完成问卷（metabolic_profile 不为空）
   ↓
访问 /onboarding → 自动重定向到 /landing
   ↓
正常使用（AI助理已注入上下文）
```

---

## 🔬 技术细节

### 1. TypeScript 类型安全

所有接口都定义在:
- `/lib/questions.ts` (问卷数据)
- `/lib/health-logic.ts` (健康逻辑)
- `/app/api/ai/chat/route.ts` (AI接口)

### 2. 数据流图

```
Onboarding UI (Client)
  ↓ answers
OnboardingFlowClient
  ↓ mapAnswersToProfile()
  ↓ generatePersonaContext()
Supabase profiles table
  ├─ metabolic_profile (JSONB)
  ├─ ai_persona_context (TEXT)
  └─ onboarding_completed_at (TIMESTAMPTZ)
  ↓ query
Landing Page (Server)
  ├─ getRecommendedTask(mode, concern, metabolic_profile)
  └─ Display task
  ↓ user clicks "AI 助理"
AI Chat API
  ├─ buildSystemPrompt(userProfile)
  └─ Inject ai_persona_context
  ↓ Claude/GPT-4
AI Response (empathetic + science-based)
```

### 3. 性能优化

**查询优化**:
```typescript
// Landing page 只查询需要的字段
.select('full_name, primary_concern, metabolic_profile, ai_persona_context')

// 使用 JSONB 索引加速查询
CREATE INDEX idx_profiles_metabolic_profile 
ON profiles USING GIN (metabolic_profile);
```

**缓存策略**:
- Server Component（Landing Page）自动缓存
- Profile 数据缓存在 session 中

---

## 📊 数据示例

### MetabolicProfile JSON 结构

```json
{
  "energy_pattern": "crash_afternoon",
  "sleep_pattern": "cortisol_imbalance",
  "body_pattern": "metabolic_slowdown",
  "stress_pattern": "low_tolerance",
  "psychology": "frustrated",
  "overall_score": 13,
  "severity": "high"
}
```

### AI Persona Context 示例

```
用户代谢档案（Metabolic Profile）:
- 症状严重程度: 高
- 主要症状: 下午能量断崖式跌落、凌晨3-4点醒来且难以再次入睡（皮质醇失衡）、腰腹脂肪堆积且难以减少（代谢减缓）、压力耐受阈值明显降低
- 心理状态: 曾多次尝试节食或强制运动但失败，感到挫败

指导原则:
1. 用共情但科学的语气回应（避免空洞的"加油"）
2. 优先解释"为什么"（生理机制）而非直接给建议
3. 推荐"最低有效剂量"的干预（如5分钟步行而非1小时跑步）
4. 认可用户之前的努力，强调"不是你的错，是方法不对"
```

---

## 🧪 测试清单

### 新用户流程
- [ ] 注册后自动跳转到 /onboarding
- [ ] 问卷显示5个问题
- [ ] 选择答案后自动前进
- [ ] 最后一题后显示分析动画
- [ ] 3秒后跳转到 /landing
- [ ] Landing page 显示基于问卷的推荐任务
- [ ] 推荐理由包含"你的问卷显示..."

### AI助理集成
- [ ] 访问 /assistant
- [ ] 发送第一条消息
- [ ] AI回复包含对问卷结果的引用
- [ ] 语气符合"共情但科学"

### 老用户防护
- [ ] 已完成问卷的用户访问 /onboarding → 重定向
- [ ] Landing page 正常显示推荐任务
- [ ] AI助理正常加载上下文

### 数据库
- [ ] metabolic_profile 正确保存为 JSONB
- [ ] ai_persona_context 正确保存为 TEXT
- [ ] onboarding_completed_at 正确记录时间戳
- [ ] JSONB 查询正常工作

---

## 🚀 部署步骤

### 1. 数据库迁移

```bash
# 在 Supabase Dashboard → SQL Editor 执行
# 文件: supabase_metabolic_profile.sql
```

### 2. 环境变量

确保以下环境变量已配置:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

### 3. 构建和部署

```bash
npm run build
npm run start
```

---

## 🔍 问题排查

### 问题1: "找不到模块 ./OnboardingFlowClient"

**原因**: TypeScript 索引未更新  
**解决**: 重启 IDE 或运行 `npm run dev`

### 问题2: 问卷完成后未跳转

**检查**:
1. `onComplete` 回调是否被调用
2. Supabase 更新是否成功（查看控制台）
3. `router.push('/landing')` 是否执行

### 问题3: AI助理未加载上下文

**检查**:
1. `/app/api/ai/chat/route.ts` 是否查询 `metabolic_profile`
2. `buildSystemPrompt` 是否正确注入
3. 查看 API 请求日志

---

## 📚 参考资料

### 科学依据

问卷设计基于以下研究：

1. **能量崩溃** → 血糖波动 + 皮质醇节律
   - Shen et al. 2024 (Chinese Medicine)
   - 呼吸交换率(RER)升高，代谢重编程

2. **睡眠维持** → 皮质醇失衡
   - Cortisol awakening response
   - HPA轴功能紊乱

3. **身体成分** → 代谢减缓
   - IL-17/TNF炎症通路
   - 内脏脂肪积累

4. **压力耐受** → 交感神经过度激活
   - 迷走神经张力下降
   - 神经内分泌失调

5. **心理挫败** → 信念强度理论
   - Bayesian belief updating
   - Habit formation barriers

---

## 🎯 未来优化

### 短期
- [ ] 添加问卷结果可视化（雷达图）
- [ ] 支持重新填写问卷（更新档案）
- [ ] 问卷结果邮件报告

### 中期
- [ ] 基于问卷生成初始习惯计划
- [ ] 问卷数据分析仪表板（Admin）
- [ ] A/B测试不同问题措辞

### 长期
- [ ] 动态问卷（根据答案调整后续问题）
- [ ] 多语言支持
- [ ] 问卷数据用于ML模型训练

---

**状态**: ✅ 完整集成完成  
**文件**: 9个新增/修改  
**测试**: 待用户验证  
**影响**: 新用户立即感受到"被理解"

---

## 📝 关键要点

### 为什么这个问卷系统很重要？

1. **首次接触印象** - 新用户的第一印象决定留存
2. **数据驱动个性化** - AI不再是通用聊天机器人
3. **降低流失率** - 用户感到"被理解"而非"被说教"
4. **冷启动问题** - 即使没有日志数据也能给出精准建议
5. **心理共鸣** - "你也凌晨3点醒来吗？"比任何广告都有效

### 技术亮点

- ✅ 沉浸式UI（类似 Stripe Onboarding）
- ✅ JSONB 灵活存储（易扩展）
- ✅ AI上下文注入（智能但不侵入）
- ✅ Health Logic Fallback（无缝集成）
- ✅ Type-safe 全栈实现

---

**维护者**: Cascade AI  
**最后更新**: 2025-11-24  
**版本**: 1.0.0
