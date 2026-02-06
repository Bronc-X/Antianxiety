# 📋 AntiAnxiety - 开发规则 (Development Rules)

> **版本**: v1.0.0
> **创建日期**: 2026-02-05
> **最后更新**: 2026-02-05

---

## 🚨 核心规则

### 规则 1：禁止破坏性删除

> [!CAUTION]
> 此规则为红线规则，违反将导致严重后果

#### 1.1 禁止行为
- ❌ 直接删除任何源代码文件
- ❌ 删除配置文件
- ❌ 删除用户数据
- ❌ 批量重命名导致文件丢失
- ❌ 覆盖写入重要文件而不备份

#### 1.2 正确做法
- ✅ 废弃文件先移动到 `.deprecated/` 目录
- ✅ 重要修改前先创建备份
- ✅ 使用版本控制(Git)管理所有变更
- ✅ 删除前必须确认并说明原因

#### 1.3 废弃流程
```
需要删除的文件 → 移动到 .deprecated/[日期]/ → 保留7天 → 确认后删除
```

---

### 规则 2：代码质量标准 (Cognitive Health Stack)

#### 2.1 模块化Hooks架构

所有React逻辑必须遵循Hooks模块化设计，特别是核心的生物数据处理：

```typescript
// ✅ 正确示例：独立的Hook模块
// hooks/bio/useBioVoltage.ts
export function useBioVoltage(userId: string) {
  const [voltage, setVoltage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 获取生物电压信息
  useEffect(() => {
    fetchBioVoltage(userId).then(setVoltage);
  }, [userId]);
  
  return { voltage, loading };
}
```

```typescript
// ❌ 错误示例：逻辑耦合在组件中
// components/BioVoltageCard.tsx
export function BioVoltageCard({ id }) {
  // 不要在组件中直接写复杂逻辑
  const [data, setData] = useState(null);
  useEffect(() => { /* 复杂逻辑 */ }, []);
  // ...
}
```

#### 2.2 Hooks目录结构 (AntiAnxiety Specific)
```
src/
├── hooks/
│   ├── bio/
│   │   ├── useBioVoltage.ts       # 生物电压与能量计算
│   │   ├── useHeartRate.ts        # HRV 数据流
│   │   └── useSleepPatterns.ts    # 睡眠节律分析
│   ├── max/
│   │   ├── useMaxPersona.ts       # Max 人格交互
│   │   ├── useActiveInquiry.ts    # 主动问询逻辑
│   │   └── useDialogueContext.ts  # 对话上下文管理
│   ├── scientific/
│   │   ├── useConsensus.ts        # 科学共识计算
│   │   └── usePaperSource.ts      # 论文引用检索
│   └── common/
│       ├── useLocalStorage.ts     # 本地存储
│       └── useHaptics.ts          # 触觉反馈 (California Calm Vibez)
```

#### 2.3 注释规范

**文件头部注释（必须）**：
```typescript
/**
 * @file useBioVoltage.ts
 * @description 管理用户的生物能量值(BioVoltage)，整合睡眠、HRV和压力数据
 * @author [开发者]
 * @created 2026-02-05
 * @modified 2026-02-05
 */
```

**函数注释（必须）**：
```typescript
/**
 * 计算当前的能量储备状态
 * @param hrv - 心率变异性
 * @param sleepQuality - 睡眠质量评分
 * @returns 能量等级 (Survival/Balanced/Optimal)
 * @example
 * const state = calculateVoltageState(hrv, sleep);
 */
```

#### 2.4 代码可读性检查清单
- [ ] 变量命名是否清晰表达其用途？
- [ ] 函数是否遵循单一职责原则？
- [ ] 复杂逻辑是否有注释说明？
- [ ] 是否避免了魔法数字/字符串？
- [ ] 是否使用了TypeScript类型定义？

---

### 规则 3：任务完成通知

#### 3.1 语音通知机制
完成每个小任务后，必须调用macOS终端发送语音通知：

```bash
# 任务完成时执行
say "job done"
```

#### 3.2 通知触发时机
- ✅ 每次 agent 完成一个小 task 时触发。

#### 3.3 通知脚本封装
```bash
#!/bin/bash
# scripts/notify_done.sh
# AntiAnxiety - 任务完成通知脚本

notify_done() {
    local message="${1:-job done}"
    say "$message"
    # 可选：同时发送系统通知
    osascript -e "display notification \"$message\" with title \"AntiAnxiety\""
}

notify_done "$1"
```

---

### 规则 4：全程中文沟通

#### 4.1 沟通范围
- ✅ 代码注释：中文
- ✅ 文档撰写：中文（必要处可中英对照）
- ✅ 开发日志：中文
- ✅ 团队交流：中文

#### 4.2 例外情况
- 代码变量名、函数名：英文（遵循编程规范）
- 第三方库/框架术语：保持原文
- 技术标准术语：可使用英文

#### 4.3 Git提交信息规范
```
类型: 简短描述（中文）

详细描述（中文，可选）

类型包括：
- 功能: 新增功能
- 修复: Bug修复
- 优化: 代码优化
- 文档: 文档更新
- 测试: 测试相关
- 配置: 配置变更
```

示例：
```
功能: 优化 Max 主动问询触发逻辑

- 引入 20 分钟冷却机制
- 修复重复弹窗的问题
- 增加回复后的淡出动画
```

---

## 📁 附加规则

### 规则 5：UI/UX 规范 (California Calm)
- **色调**: 严禁使用警报色(Medical Blue/Red)，坚持使用 Sand/Clay/Sage。
- **反馈**: 所有交互必须包含各类触觉反馈 (`Haptics.impact`).
- **文案**: `Truth is Comfort`。不要说 "Warning"，要说 "System Recalibrating"。

### 规则 6：文件命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `BioVoltageCard.tsx` |
| Hook | camelCase + use前缀 | `useMaxPersona.ts` |
| 工具函数 | camelCase | `calculateStress.ts` |
| 类型定义 | PascalCase + .types | `UserMetrics.types.ts` |
| 常量 | UPPER_SNAKE_CASE | `MAX_CONFIG.ts` |

### 规则 7：错误处理
```typescript
// 错误提示必须温和
try {
  await syncData();
} catch (error) {
  // Comforting Error Toast
  toast("Let's try that again gently."); 
}
```

### 规则 8：测试与验收

> [!NOTE]
> 详细的模块验收标准 (DOD) 请参阅 `docs/project/PROJECT_CONSTITUTION.md` 第 X 章

#### 8.1 测试覆盖要求
- 核心算法 (BioVoltage, Consensus) 覆盖率 ≥ 90%
- 每个 Max 对话逻辑必须有测试用例
- API 集成测试必须模拟真实场景

#### 8.2 验收前置条件
- [ ] 代码成功编译 (无 TypeScript/ESLint 错误)
- [ ] iOS 模拟器运行通过 (pre-push hook)
- [ ] 核心用户流程可完整走通
- [ ] 无阻塞性 Bug

#### 8.3 阻塞原则
- 当前模块未通过验收前，**禁止**开始下一模块开发
- 发现阻塞性问题必须**立即修复**

---

## ✅ 规则检查清单

在每次提交前，请确认：

### 代码层面
- [ ] 无破坏性删除操作
- [ ] 遵循模块化Hooks架构
- [ ] 注释完整清晰
- [ ] TypeScript类型完整

### 沟通层面
- [ ] 注释使用中文
- [ ] 提交信息使用中文
- [ ] 文档使用中文

### 流程层面
- [ ] 通过本地测试
- [ ] 模拟器运行正常
- [ ] 任务完成后发送语音通知

---

**规则生效日期**: 2026年02月05日
