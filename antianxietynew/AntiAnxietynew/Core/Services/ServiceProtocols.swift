import Foundation

@MainActor
protocol HealthKitServicing: AnyObject {
    var isAuthorized: Bool { get }
    var lastBackgroundUpdate: Date? { get }
    var isAvailable: Bool { get }
    func requestAuthorization() async throws
    func queryLatestHRV() async throws -> Double
    func queryRestingHeartRate(from startDate: Date, to endDate: Date) async throws -> Double
    func querySteps(from startDate: Date, to endDate: Date) async throws -> Double
    func querySleepDuration(from startDate: Date, to endDate: Date) async throws -> Double
}

@MainActor
protocol AIManaging: AnyObject {
    func chatCompletion(messages: [ChatMessage], model: AIModel) async throws -> String
}

@MainActor
protocol LiveActivityManaging: AnyObject {
    var isActivityActive: Bool { get }
    func startBreathingSession(name: String, durationMinutes: Int) async
    func startMeditationSession(name: String, durationMinutes: Int) async
    func startCalibrationSession() async
    func updateActivity(
        hrv: Double,
        anxietyScore: Int,
        minutesRemaining: Int,
        progressPercent: Double
    ) async
    func endCurrentActivity() async
    func endAllActivities() async
}

@MainActor
protocol SupabaseManaging: AnyObject {
    var currentUser: AuthUser? { get }
    var isAuthenticated: Bool { get }

    func signUp(email: String, password: String) async throws
    func signIn(email: String, password: String) async throws
    func signOut() async
    func checkSession() async
    func refreshSession() async throws

    func request<T: Decodable>(
        _ endpoint: String,
        method: String,
        body: Encodable?,
        prefer: String?
    ) async throws -> T
    func requestVoid(
        _ endpoint: String,
        method: String,
        body: Encodable?,
        prefer: String?
    ) async throws

    func getConversations() async throws -> [Conversation]
    func createConversation(title: String) async throws -> Conversation
    func getChatHistory(conversationId: String) async throws -> [ChatMessageDTO]
    func appendMessage(conversationId: String, role: String, content: String) async throws -> ChatMessageDTO
    func deleteConversation(conversationId: String) async throws

    func getWeeklyWellnessLogs() async throws -> [WellnessLog]
    func getDigitalTwinAnalysis() async throws -> DigitalTwinAnalysis?
    func getDigitalTwinDashboard() async throws -> DigitalTwinDashboardPayload
    func getUnifiedProfile() async throws -> UnifiedProfile?
    func getHardwareData() async throws -> HardwareData?
    func getDashboardData() async throws -> DashboardData

    func getProfileSettings() async throws -> ProfileSettings?
    func updateProfileSettings(_ update: ProfileSettingsUpdate) async throws -> ProfileSettings?
    func uploadAvatar(imageData: Data, contentType: String, fileExtension: String) async throws -> String

    func refreshAppAPIBaseURL() async
    func appAPIURL(path: String, queryItems: [URLQueryItem]) -> URL?

    func chatWithMax(messages: [ChatRequestMessage], mode: String) async throws -> String
    func triggerDigitalTwinAnalysis(forceRefresh: Bool) async -> DigitalTwinTriggerResult
    func getDigitalTwinCurve(devMode: Bool) async throws -> DigitalTwinCurveResponse
    func generateDigitalTwinCurve(conversationTrend: String?) async throws -> DigitalTwinCurveResponse

    func savePlan(_ plan: PlanOption) async throws
    func getStarterQuestions() async throws -> [String]
    func getScienceFeed(language: String) async throws -> ScienceFeedResponse
    func submitFeedFeedback(_ feedback: FeedFeedbackInput) async throws
}
