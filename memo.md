# Native Capabilities Memo (iOS Focus)

Purpose:
- Inventory native capabilities implied by current hooks/services/UI in this repo.
- Map each capability to code touchpoints and note iOS config needs.

Legend:
- Priority: P0 = core value, P1 = important UX, P2 = supporting/ops.
- Status: in-use, stub, missing.

## Inventory

| ID | Capability | Priority | Code touchpoints | Status | iOS config / plugin notes |
| --- | --- | --- | --- | --- | --- |
| 1 | HealthKit read + sync (sleep, HRV, HR, steps, energy) | P0 | `lib/services/wearables/healthkit-bridge.ts`, `lib/services/wearables/client-sync.ts`, `components/settings/WearableConnectionManager.tsx` | in-use (bridge exists) | HealthKit entitlement + `NSHealthShareUsageDescription`; plugin `@followathletics/capacitor-healthkit` |
| 2 | Daily reminders (local notifications) | P0 | `lib/notification-service.ts` | in-use (wired) | Request user permission; plugin `@capacitor/local-notifications` |
| 3 | Speech recognition + microphone input | P1 | `components/assistant-ui/audio-recorder.tsx`, `components/EnhancedDailyCheckIn.tsx`, `components/mobile/views/ViewMax.tsx`, `components/AIAssistantFloatingChat.tsx` | in-use (native plugin + hook) | `NSSpeechRecognitionUsageDescription`, `NSMicrophoneUsageDescription`; build a Capacitor plugin around `SFSpeechRecognizer` + `AVAudioSession` |
| 4 | Haptics feedback | P1 | `hooks/useHaptics.ts`, `lib/haptics.ts`, `components/bayesian/*`, `components/motion/MotionButton.tsx` | in-use | plugin `@capacitor/haptics` |
| 5 | Privacy screen + biometric gate | P1 | `components/auth/BiometricGate.tsx` | in-use (native plugin + gate) | `NSFaceIDUsageDescription`; plugin `@capacitor-community/privacy-screen` |
| 6 | In-app browser for external links / OAuth | P2 | `hooks/useBrowser.ts`, `components/ExternalLink.tsx`, `hooks/domain/useWearables.ts`, `hooks/domain/useAuthProviders.ts` | in-use | plugin `@capacitor/browser` |
| 7 | Deep link handling (OAuth callback) | P2 | `hooks/domain/useWearables.ts`, `app/native/page.tsx` | in-use (custom scheme + native listener) | URL scheme `antianxiety://oauth/wearables` |
| 8 | Network status monitoring | P2 | `hooks/useNetwork.ts`, `hooks/domain/useSettings.ts` | in-use | plugin `@capacitor/network` |
| 9 | Key-value preferences storage | P2 | `hooks/usePreferences.ts` | in-use | plugin `@capacitor/preferences` |
| 10 | Health Connect (Android) | P2 | `lib/services/wearables/health-connect-bridge.ts`, `lib/services/wearables/client-sync.ts` | in-use (Android only) | Not applicable to iOS |
| 11 | Background refresh for health sync | P2 | `lib/services/wearables/client-sync.ts`, `hooks/useHealthKitBackgroundSync.ts` | in-use (HealthKit background delivery + listener) | Requires HealthKit auth; background delivery triggers sync when updates arrive |
| 12 | Push notifications (APNS) | P2 | `lib/push-notifications.ts`, `app/native/page.tsx`, `components/mobile/views/ViewSettings.tsx` | in-use (registration + token capture) | `aps-environment` entitlement; plugin `@capacitor/push-notifications` |

## Notes

- These capabilities are service-layer concerns; UI changes are minimal. Most work lands in hooks/services and native plugins.
- HealthKit is the core P0 dependency for the product data loop; confirm entitlement and permissions early.
