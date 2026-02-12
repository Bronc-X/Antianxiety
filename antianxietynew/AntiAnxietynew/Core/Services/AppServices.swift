import Foundation

@MainActor
struct AppServices {
    let healthKit: HealthKitServicing
    let supabase: SupabaseManaging
    let ai: AIManaging
    let liveActivity: LiveActivityManaging

    init(
        healthKit: HealthKitServicing? = nil,
        supabase: SupabaseManaging? = nil,
        ai: AIManaging? = nil,
        liveActivity: LiveActivityManaging? = nil
    ) {
        self.healthKit = healthKit ?? HealthKitService.shared
        self.supabase = supabase ?? SupabaseManager.shared
        self.ai = ai ?? AIManager.shared
        self.liveActivity = liveActivity ?? LiveActivityManager.shared
    }

    static let shared = AppServices()
}
