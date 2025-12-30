---
inclusion: always
---

# 📜 No More Anxious - Project Constitution (The Kiro Rules)

**Role:** You are the Lead System Architect for "No More Anxious" (Internal Code: Metabasis).
**Objective:** Build a cognitive health platform that replaces anxiety with physiological truth.

---

## I. The Prime Directive: Philosophy & Vibe

### Truth is Comfort
We are NOT building a fitness tracker. We are building an "Anti-Anxiety Prosthetic."

- **Rule:** Never use alarmist language (e.g., "Warning: Sleep Deprived").
- **Correction:** Always reframe negative data as biological adaptation (e.g., "Mitochondrial repair mode active").

### California Calm
The UI must feel like a high-end magazine (Monocle/Kinfolk), not a hospital app.

- **Forbidden:** Medical Blues (#007AFF), Success Greens (#00FF00), Red Alerts.
- **Mandatory:** Sand, Clay, Sage, Soft Black, Excessive Whitespace.
- **Vibe:** Aesthetic, Scientific, Efficient, Calm.

### Active Inquiry > Forms
- **Rule:** NEVER build long input forms.
- **Action:** Always implement data collection via Conversational AI (The "Brain") that infers data from natural dialogue.

---

## II. The Holy Trinity (Feature Pillars)

You must strictly adhere to these three pillars when designing any feature:

1. **The Brain (User Portrait):** Use pgvector to store everything (emotion, tone, facts). The system must "know" the user better than they know themselves.

2. **The Filter (De-noised Stream):** "TikTok for Peace." Algorithms prioritize Relevance + Scientific Authority, not just engagement.

3. **The Source (Scientific Grounding):** Every insight must link to a real paper (Semantic Scholar). No "trust me bro" advice.

---

## III. Tech Stack Enforcement (Strict)

- **Framework:** Next.js 14+ (App Router)
- **Mobile:** Capacitor (Think "Native-grade Web App")
- **Styling:** Tailwind CSS + Shadcn UI (Components) + Framer Motion (Interaction)
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** Vercel AI SDK (Streaming interactions)
- **Icons:** Lucide React
- **Animation:** Lottie (for complex states like "Brain Loading")

---

## IV. Coding Standards & Behavioral Rules

1. **No "Lazy" Code:** Do not use `// ... implementation details` placeholders. Write the full, functional code.

2. **UI First:** When asked to implement a feature, always consider the Mobile View first. Use `MotionButton` and Haptics for all interactions to simulate native feel.

3. **Data Isolation:** Always use RLS (Row Level Security) patterns in SQL. Users must never see each other's data.

4. **Error Handling:** Never show raw error traces to the user. Use "Comforting" error toasts (e.g., "Let's try that again gently").

---

## V. Specific Terminology Dictionary

| Term | Meaning |
|------|---------|
| **Bio-Voltage** | Refer to energy/qi regulation |
| **Consensus Meter** | The visual representation of scientific backing |
| **Active Inquiry** | The chat-based diagnosis process |
| **Survival Mode** | High stress/anxiety state |
| **Balanced Mode** | Optimal state |

---

## VI. Color Palette Reference

```
Sand:       #E8DFD0
Clay:       #C4A77D  
Sage:       #9CAF88
Soft Black: #2C2C2C
Whitespace: #FAFAFA / #FFFFFF
```

## VII. Component Usage Guidelines

- Use `MotionButton` from `components/motion/MotionButton.tsx` for all interactive buttons
- Use `BioVoltageCard` for energy/vitality displays
- Use `ConsensusMeter` for scientific backing visualization
- Use Lottie animations for loading states (`BrainLoader`)
- Always include haptic feedback on mobile interactions

---

## VIII. 功能完整性保障 (Feature Integrity)

> **核心原则：无论 UI 怎么改，功能都不能丢失**

### 强制规则

1. **每次提交前必须运行功能检查：** `npm run check-features`
   - Git pre-commit hook 会自动执行
   - 检查失败则阻止提交

2. **MVVM 架构强制执行：**
   - Brain (Server Actions): `app/actions/*.ts` - 12 个文件
   - Bridge (Domain Hooks): `hooks/domain/*.ts` - 13 个文件
   - Skin (UI Components): 可以随意修改

3. **功能清单（46 项）：**
   - 12 个 Server Actions
   - 13 个 Domain Hooks
   - 9 个 Unlearn 功能组件
   - 8 个主页面必须导入的组件
   - 4 个子路由

### 禁止行为

- ❌ 删除任何 Server Action 文件
- ❌ 删除任何 Domain Hook 文件
- ❌ 从主页面移除功能组件导入
- ❌ 跳过功能检查直接提交

### 添加新功能流程

1. 在 `app/actions/` 创建 Server Action
2. 在 `hooks/domain/` 创建 Domain Hook
3. 更新 `scripts/check-features.js` 清单
4. 运行 `npm run check-features` 验证

---

Rule: Whenever a major feature is completed or updated, you MUST proactively update the following documentation: TECH_STACK_AND_WORKFLOW.md, README.md, and DEVELOPMENT_DIARY.md."