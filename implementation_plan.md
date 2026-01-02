# Mobile Hook Integration Plan

## Goal
Connect the 7 remaining mobile views to their respective Domain Hooks to achieve full functionality.

## 1. Dashboard Integration
- **Target**: `components/mobile/views/ViewDashboard.tsx`
- **Hook**: `useDashboard`
- **Changes**:
    - Replace static "Good Morning" with dynamic time-based greeting.
    - Connect `profile` data for user name/avatar.
    - Connect `hardwareData` (HR, Sleep) to `HealthMetricCard`.
    - Connect `digitalTwin` data to `MoodWaveChart` (pass curve data).

## 2. Plans Integration
- **Target**: `components/mobile/views/ViewPlan.tsx`
- **Hook**: `usePlans`
- **Changes**:
    - Replace local `plans` state with `usePlans`.
    - Implement `togglePlan` using `complete` / `resume` / `pause`.
    - Implement `create` plan functionality.

## 3. Profile Integration
- **Target**: `components/mobile/views/ViewProfile.tsx`
- **Hook**: `useProfile`
- **Changes**:
    - Bind Name, Avatar, Join Date to `profile` data.
    - Bind stats (Level, Streak, etc.) if available in `profile.stats` (or `useDashboard` summary).

## 4. Digital Twin View [NEW]
- **Target**: `components/mobile/views/ViewDigitalTwin.tsx`
- **Hook**: `useDigitalTwinCurve`
- **Features**:
    - Chart visualization of predicted mood/anxiety.
    - "Generate Projection" button.

## 5. Wearables View [NEW]
- **Target**: `components/mobile/views/ViewWearables.tsx`
- **Hook**: `useWearables`
- **Features**:
    - List providers (Oura, Apple, etc.) with connection status.
    - Connect/Disconnect buttons.
    - Sync status indicator.

## 6. Goals View [NEW]
- **Target**: `components/mobile/views/ViewGoals.tsx`
- **Hook**: `useGoals`
- **Features**:
    - List of active goals.
    - Add Goal form.
    - Checkbox to complete goals.

## 7. Onboarding View [NEW]
- **Target**: `components/mobile/views/ViewOnboarding.tsx`
- **Hook**: `useClinicalOnboarding`
- **Features**:
    - Multi-step wizard (GAD7 -> PHQ9 -> ISI).
    - Progress bar.
    - Result summary screen.

## Shared Updates
- **File**: `components/mobile/MobileViews.tsx` (Export new views)
- **File**: `app/mobile/page.tsx` (Add routing/state for new views)
