import Foundation

@MainActor
struct AppServices {
    let healthKit: HealthKitServicing
    let supabase: SupabaseManaging
    let ai: AIManaging
    let liveActivity: LiveActivityManaging

    init(
        healthKit: HealthKitServicing = HealthKitService.shared,
        supabase: SupabaseManaging = SupabaseManager.shared,
        ai: AIManaging = AIManager.shared,
        liveActivity: LiveActivityManaging = LiveActivityManager.shared
    ) {
        self.healthKit = healthKit
        self.supabase = supabase
        self.ai = ai
        self.liveActivity = liveActivity
    }

    static let shared = AppServices()
}
