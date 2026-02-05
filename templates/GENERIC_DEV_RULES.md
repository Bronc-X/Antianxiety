# 📋 [Project Name] - 开发规则 (Development Rules)

> **版本**: v1.0.0
> **创建日期**: [Date]
> **最后更新**: [Date]

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

### 规则 2：代码质量标准

#### 2.1 模块化Hooks架构

所有React逻辑必须遵循Hooks模块化设计：

```typescript
// ✅ 正确示例：独立的Hook模块
// hooks/[domain]/use[Feature].ts
export function useFeature(id: string) {
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 获取信息
  useEffect(() => {
    fetchData(id).then(setData);
  }, [id]);
  
  return { data, loading };
}
```

```typescript
// ❌ 错误示例：逻辑耦合在组件中
// components/[Feature]Card.tsx
export function FeatureCard({ id }) {
  // 不要在组件中直接写复杂逻辑
  const [data, setData] = useState(null);
  useEffect(() => { /* 复杂逻辑 */ }, []);
  // ...
}
```

#### 2.2 Hooks目录结构
```
src/
├── hooks/
│   ├── [domain_a]/
│   │   ├── use[FeatureA].ts
│   │   └── use[FeatureB].ts
│   ├── [domain_b]/
│   │   ├── use[FeatureC].ts
│   │   └── use[FeatureD].ts
│   └── common/
│       ├── useLocalStorage.ts
│       └── useEncryption.ts
```

#### 2.3 注释规范

**文件头部注释（必须）**：
```typescript
/**
 * @file useFeature.ts
 * @description [Feature]管理Hook，负责[具体功能描述]
 * @author [开发者]
 * @created [Date]
 * @modified [Date]
 */
```

**函数注释（必须）**：
```typescript
/**
 * [函数简述]
 * @param [param] - [参数说明]
 * @returns [返回值说明]
 * @throws [异常说明]
 * @example
 * const result = myFunction(args);
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
- ✅ 即每次agent完成每一次小任务,一个对话conversation里的每一个小task就算一次,而不是一个conversation算一次!

#### 3.3 通知脚本封装
```bash
#!/bin/bash
# scripts/notify_done.sh
# [Project Name] - 任务完成通知脚本

notify_done() {
    local message="${1:-job done}"
    say "$message"
    # 可选：同时发送系统通知
    osascript -e "display notification \"$message\" with title \"[Project Name]\""
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

---

## 📁 附加规则 [Optional]

### 规则 5：Git分支管理
```
main          # 稳定版本
├── develop   # 开发主分支
├── feature/* # 功能分支
├── bugfix/*  # Bug修复分支
└── release/* # 发布分支
```

### 规则 6：文件命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `MyComponent.tsx` |
| Hook | camelCase + use前缀 | `useMyHook.ts` |
| 工具函数 | camelCase | `utils.ts` |
| 类型定义 | PascalCase + .types | `MyType.types.ts` |
| 常量 | UPPER_SNAKE_CASE | `CONSTANTS.ts` |

### 规则 7：错误处理
```typescript
try {
  const result = await action();
} catch (error) {
  console.error('[Module] Action failed:', error);
  // User feedback
  showToast('Operation failed, please try again');
}
```

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

**规则生效日期**: [Date]
