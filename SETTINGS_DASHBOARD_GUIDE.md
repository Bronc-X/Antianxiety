# Settings Dashboard - Complete Implementation Guide

## 🎯 System Overview

The Settings Dashboard is a modular control center that directly impacts AI behavior and analysis reports through a "Brain Sync" mechanism. Every change made in Settings immediately updates the AI's persona context.

---

## 📁 Architecture

### Part 1: Frontend UI (`/app/settings/`)

**Files:**
- `page.tsx` - Server component that fetches user profile
- `SettingsClient.tsx` - Client component with tabbed interface

**Tab Structure:**

1. **身体档案 (Body Metrics)**
   - Inputs: Height, Weight, Age, Gender
   - Impact: Updates BMI/BMR calculations in Analysis Report
   - Auto-calculates BMI preview

2. **AI 调优 (AI Tuning)** - ⚠️ CRITICAL
   - Primary Goal: Weight Loss / Sleep / Energy / Maintenance
   - AI Personality: Strict Coach / Gentle Friend / Science Nerd
   - Current Focus: Free text (e.g., "knee pain, avoid running")
   - Impact: Directly modifies System Prompt in chat

3. **账号与会员 (Account)**
   - Display Name, Email (read-only)
   - Subscription Status (Free/Pro)

---

### Part 2: Server Action (`/app/actions/settings.ts`)

**Function:** `updateSettings(userId, data)`

**Flow:**
```typescript
1. Prepare update payload (parse numbers, clean data)
2. BRAIN SYNC: Regenerate ai_persona_context string:
   - Map goal to Chinese description
   - Map personality to behavior instructions
   - Include user's current focus
   - Construct context string
3. Update profiles table in database
4. Revalidate paths (/assistant, /landing, /settings)
```

**Example AI Context Generated:**
```
用户主要目标：改善睡眠质量

AI性格设定：温和朋友模式：鼓励为主，理解用户的困难

用户当前关注点：膝盖疼痛，请避免推荐跑步类运动

重要提示：
- 基于用户的主要目标调整建议优先级
- 遵循设定的性格风格进行对话
- 始终考虑用户的特殊关注点，避免不适合的建议
```

---

### Part 3: Consumers

#### A. Chat API (`/app/api/chat/route.ts`)

**Changes:**
1. Extended profile query to include:
   - `ai_persona_context`
   - `primary_goal`
   - `ai_personality`
   - `current_focus`

2. Passes these fields to RAG system's `userContext`

**Impact:**
```typescript
// Before: Generic AI responses
"建议你多运动"

// After (with "knee pain" in current_focus):
"考虑到你的膝盖状况，建议选择低冲击运动如游泳或椭圆机"
```

#### B. System Prompts (`/lib/system_prompts.ts`)

**Changes:**
1. Extended `UserContext` interface with:
   ```typescript
   ai_persona_context?: string | null;
   primary_goal?: string | null;
   ai_personality?: string | null;
   current_focus?: string | null;
   ```

2. Injected `ai_persona_context` into System Prompt:
   ```typescript
   const personaContext = userContext?.ai_persona_context 
     ? `\n\n## 🎯 用户个性化设置（来自设置中心）\n${userContext.ai_persona_context}\n`
     : '';
   ```

**Impact:** AI immediately knows user preferences without repetition

---

## 🔄 Data Flow Diagram

```
┌──────────────────┐
│  User Changes    │
│  Settings in UI  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  updateSettings() Action │
│  - Updates DB            │
│  - Regenerates Context   │
│  - Revalidates Paths     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  profiles.ai_persona_    │
│  context column updated  │
└────────┬─────────────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────────┐
│  Chat API    │   │  Analysis Report │
│  (RAG)       │   │  (Future)        │
│              │   │                  │
│  Injects     │   │  Highlights      │
│  context →   │   │  primary_goal    │
│  System      │   │  in radar chart  │
│  Prompt      │   │                  │
└──────────────┘   └──────────────────┘
```

---

## 🧪 Testing Verification

### Test 1: AI Personality Change
1. Go to `/settings`
2. Set AI Personality to "Strict Coach"
3. Set Current Focus: "我很懒，需要严格督促"
4. Save settings
5. Go to `/assistant` (or chat)
6. Ask: "我最近不想运动"
7. **Expected:** AI gives strict, no-nonsense response

### Test 2: Current Focus Injection
1. Set Current Focus: "膝盖疼痛，避免跑步"
2. Save settings
3. Ask AI: "推荐我一些运动"
4. **Expected:** AI avoids recommending running, suggests low-impact alternatives

### Test 3: Primary Goal Priority
1. Set Primary Goal: "改善睡眠"
2. Save settings
3. Ask AI: "如何改善健康"
4. **Expected:** AI prioritizes sleep-related advice over other topics

---

## 📊 Database Schema

### Required Columns in `profiles` table:

```sql
-- Basic metrics
height NUMERIC,
weight NUMERIC,
age INTEGER,
gender TEXT,

-- AI Tuning (CRITICAL)
primary_goal TEXT,
primary_concern TEXT,  -- Alias for backward compatibility
ai_personality TEXT,
current_focus TEXT,
ai_persona_context TEXT,  -- Generated by updateSettings()

-- Account
full_name TEXT,
avatar_url TEXT
```

---

## 🚨 Critical Points

1. **Revalidation is Essential**
   - Always call `revalidatePath()` after updating settings
   - Ensures cached pages update immediately

2. **Type Safety**
   - `UserContext` interface must match fields passed from Chat API
   - Any new Settings fields must be added to interface

3. **Null Handling**
   - All AI Tuning fields are nullable
   - System Prompt injection checks for existence before adding

4. **Security**
   - Settings page requires authentication (`requireAuth()`)
   - Server action validates user ID matches session

---

## 🎨 UI/UX Highlights

- **Save Button:** Sticky header with clear save status
- **Tab Navigation:** Clean Material Design tabs
- **AI Tuning Badge:** Orange "关键" badge on AI tab to draw attention
- **Inline Previews:** BMI calculation shown immediately
- **Success/Error Messages:** Clear feedback after save

---

## 🔮 Future Enhancements

### Part 4: Assistant Page Updates (Not Yet Implemented)

**Dynamic Radar Chart Highlighting:**
```typescript
if (primary_goal === 'improve_sleep') {
  // Add visual highlight to "睡眠恢复" axis
  // Show badge: "您的重点关注领域"
}
```

**Strategy Filter:**
```typescript
const strategies = allStrategies.filter(s => {
  if (primary_goal === 'improve_sleep') {
    return s.category === 'sleep' || s.priority === 'high';
  }
  return true;
});
```

---

## 📝 Notes

- Settings page path: `/settings`
- Access from: User Profile Menu (top right)
- Server action path: `/app/actions/settings.ts`
- All changes are real-time via `revalidatePath()`

---

## ✅ Deliverables Completed

- ✅ Clean, professional `/settings` page with 3 tabs
- ✅ Functional `updateSettings` server action
- ✅ Chat API integration with `ai_persona_context`
- ✅ System Prompt injection mechanism
- ✅ User Profile Menu link to Settings
- ⏳ Assistant page dynamic highlighting (future enhancement)

---

**Last Updated:** 2024-11-24
**Status:** Production Ready 🚀
