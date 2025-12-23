# Inquiry Persistence Fix

## Problem
User responses to inquiry questions were not persisting properly. After submitting an answer and refreshing the page, the same question would reappear.

## Root Cause Analysis

### Issue 1: Time Window Too Restrictive
The `/api/inquiry/pending` endpoint was checking for unanswered inquiries **only within the last 1 hour**:

```typescript
// OLD CODE - PROBLEMATIC
const oneHourAgo = new Date();
oneHourAgo.setHours(oneHourAgo.getHours() - 1);

const { data: recentInquiry } = await supabase
  .from('inquiry_history')
  .select('*')
  .eq('user_id', user.id)
  .is('user_response', null)
  .gte('created_at', oneHourAgo.toISOString()) // ❌ Too restrictive
```

**Problem**: If no unanswered inquiry exists in the last hour, the system would immediately generate a NEW inquiry for the same data gap, even if the user just answered it.

### Issue 2: No Daily Deduplication
The system didn't track which data gaps were already answered today, so it could ask the same question multiple times per day.

## Solution

### Fix 1: Remove Time Window for Pending Inquiries
Check for **any** unanswered inquiry, not just recent ones:

```typescript
// NEW CODE - FIXED
const { data: recentInquiry } = await supabase
  .from('inquiry_history')
  .select('*')
  .eq('user_id', user.id)
  .is('user_response', null) // ✅ Any unanswered inquiry
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### Fix 2: Filter Out Already-Answered Data Gaps
Before generating a new inquiry, check which data gaps were answered today:

```typescript
// NEW CODE - ADDED
const today = new Date().toISOString().split('T')[0];
const { data: todayResponses } = await supabase
  .from('inquiry_history')
  .select('data_gaps_addressed')
  .eq('user_id', user.id)
  .not('user_response', 'is', null)
  .gte('responded_at', `${today}T00:00:00Z`);

const answeredGapsToday = new Set<string>();
if (todayResponses) {
  todayResponses.forEach(r => {
    if (r.data_gaps_addressed) {
      r.data_gaps_addressed.forEach((gap: string) => answeredGapsToday.add(gap));
    }
  });
}

// Filter out gaps already answered today
const allGaps = identifyDataGaps(recentData);
const gaps = allGaps.filter(gap => !answeredGapsToday.has(gap.field));
```

### Fix 3: Enhanced Logging
Added console logs to track the inquiry lifecycle:

- `✅ [Inquiry] Response recorded:` - When user submits response
- `📋 [Inquiry] Data gaps answered today:` - Which gaps are filtered out
- `📋 [Inquiry] No new data gaps to ask about` - When all gaps are answered

## Expected Behavior After Fix

1. **User submits response** → `responded_at` timestamp is set in database
2. **User refreshes page** → System checks for unanswered inquiries
3. **No unanswered inquiry found** → System checks for new data gaps
4. **Data gap already answered today** → Filtered out, no new inquiry shown
5. **Result**: User doesn't see the same question again until tomorrow

## Testing Steps

1. Open the app and see an inquiry question
2. Select an option and click "Submit"
3. Wait for success message
4. Refresh the page (Ctrl+Shift+R for hard refresh)
5. **Expected**: No inquiry banner appears (or a different question if other gaps exist)
6. Check browser console for logs:
   - `✅ [Inquiry] Response recorded:`
   - `📋 [Inquiry] Data gaps answered today:`

## Files Modified

- `Antianxiety-main/app/api/inquiry/pending/route.ts` - Fixed query logic and added deduplication
- `Antianxiety-main/app/api/inquiry/respond/route.ts` - Enhanced logging

## Database Schema (No Changes Required)

The `inquiry_history` table already has the correct structure:
- `user_response TEXT` - Stores the user's answer
- `responded_at TIMESTAMPTZ` - Timestamp when answered
- `data_gaps_addressed TEXT[]` - Which data gaps this inquiry addresses

Index exists for efficient querying:
```sql
CREATE INDEX idx_inquiry_history_pending 
ON inquiry_history(user_id, responded_at) 
WHERE responded_at IS NULL;
```

## Future Improvements

1. **Rate Limiting**: Limit inquiries to once per day per data gap type
2. **Smart Timing**: Use `user_activity_patterns` to show inquiries at optimal times
3. **Priority Queue**: Show high-priority gaps first, then medium, then low
4. **Multi-Gap Questions**: Combine related data gaps into single inquiry
