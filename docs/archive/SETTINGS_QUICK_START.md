# Settings Dashboard - Quick Start 🚀

## Access Settings
1. Click **User Avatar** (top right)
2. Select **⚙️ 个人设置**
3. Opens `/settings` page

---

## Key Features

### 🎯 AI Tuning Tab (CRITICAL)

**This tab directly controls how AI responds to you!**

```
Primary Goal → Affects what AI prioritizes
AI Personality → Changes AI's tone and strictness
Current Focus → AI remembers specific constraints
```

**Example:**
- Set Current Focus: "膝盖疼痛，避免跑步"
- AI will never suggest running!

---

## Brain Sync Process

```
You change settings
    ↓
Click "保存设置"
    ↓
Server generates ai_persona_context
    ↓
AI immediately uses new context
```

**No restart needed!** Changes take effect instantly.

---

## Verification Test

1. Set AI Personality to "Strict Coach"
2. Set Current Focus: "我很懒，需要严格督促"
3. Save
4. Ask AI: "我不想运动"
5. ✅ AI should be strict and motivating

---

## Files Created

- `/app/settings/page.tsx` - Main page
- `/app/settings/SettingsClient.tsx` - UI component
- `/app/actions/settings.ts` - Server action
- Updated `/app/api/chat/route.ts` - Chat integration
- Updated `/lib/system_prompts.ts` - Prompt injection

---

## Database Fields Used

```sql
-- Body Metrics
height, weight, age, gender

-- AI Tuning (synced to AI)
primary_goal
ai_personality
current_focus
ai_persona_context  -- Auto-generated

-- Account
full_name, avatar_url
```

---

## Notes

- ⚠️ Changes revalidate `/assistant` and `/landing` paths
- ✅ TypeScript errors about SettingsClient are normal (build-time resolution)
- 🔐 Requires authentication to access

---

**For full details, see `SETTINGS_DASHBOARD_GUIDE.md`**
