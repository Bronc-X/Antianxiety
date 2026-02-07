# Development Diary

## 2026-02-07
- Root cause: `WearableConnectViewModel()` is `@MainActor` and was instantiated in a nonisolated context in `CoreHubView` modules; `MaxPlanQuestionGenerator.swift` was missing from Xcode target membership.
- Fix: Marked `CoreHubView` as `@MainActor` and added `MaxPlanQuestionGenerator.swift` to the Xcode project file references and build phases.
- Result: `xcodebuild` (iostest) succeeded.
- Root cause: `InsightBox` gained a required `language` parameter, but `ArticleReaderView` still called it without the argument.
- Fix: Injected `AppSettings` into `ArticleReaderView`, derived `language`, and passed it to both `InsightBox` usages.
- Result: `xcodebuild` (iostest) succeeded.
- Root cause: Simulator networking hit SSL/TLS handshake failures and App API health checks timed out, compounded by strict single-source App API selection and `www` canonicalization.
- Fix: Added a debug-only `NetworkSession` with optional insecure TLS on simulator, increased App API health timeout, removed forced `www` -> bare domain rewrite, and allowed fallback App API selection when the fixed base is unreachable.
- Result: `xcodebuild` (iostest) succeeded.
- Root cause: Per-screen center tweaks were ineffective because global container bias (`CustomTabBar` hardcoded `offset(x: -24)`) and inconsistent header centering structure caused perceived right drift.
- Fix: Removed global horizontal bias in `ContentView`, switched key headers to symmetric side-slot centering (`ScienceFeed`, `DigitalTwin`, `Max`), centered loading blocks structurally, and increased `ScreenMetrics.centerAxisOffset` to `-8` for regular-width devices.
- Result: `xcodebuild` (iostest) succeeded.
