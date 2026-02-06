// DashboardViewModel.swift
// 仪表盘视图模型 - 对齐 Web 端 useDashboard Hook
//
// 功能对照:
// - Web: hooks/domain/useDashboard.ts
// - iOS: 本文件
//
// 数据源:
// - Supabase: daily_wellness_logs, unified_user_profiles
// - Next API: /api/digital-twin/dashboard
// - HealthKit: 作为备用本地数据源

import SwiftUI
import WidgetKit

@MainActor
class DashboardViewModel: ObservableObject {
    
    // MARK: - Published State (对应 useDashboard 返回值)
    
    /// 用户画像
    @Published var profile: UnifiedProfile?
    
    /// 最近 7 天健康日志
    @Published var weeklyLogs: [WellnessLog] = []
    
    /// 穿戴设备数据
    @Published var hardwareData: HardwareData?
    
    /// 数字孪生 Dashboard 数据
    @Published var digitalTwin: DigitalTwinDashboardPayload?

    /// AI 主动问询
    @Published var inquiry: InquiryQuestion?
    @Published var isInquiryLoading = false
    @Published var inquiryError: String?

    /// AI 建议（每日 3-4 条，后台生成）
    @Published var aiRecommendations: [DailyAIRecommendationItem] = []
    @Published var isRecommendationsLoading = false
    @Published var recommendationsError: String?
    
    /// 加载状态
    @Published var isLoading = false
    
    /// 数字孪生加载状态
    @Published var loadingDigitalTwin = false
    
    /// 同步状态
    @Published var isSyncing = false
    
    /// 离线状态
    @Published var isOffline = false
    
    /// 错误信息
    @Published var error: String?
    
    // MARK: - Derived Properties (对应 useMemo / computed)
    
    /// 用户显示名称
    var userName: String {
        if let email = supabase.currentUser?.email {
            return email.components(separatedBy: "@").first ?? "探索者"
        }
        return "探索者"
    }
    
    /// 时间问候语
    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "早上好"
        case 12..<18: return "下午好"
        default: return "晚上好"
        }
    }
    
    /// 今日日志
    var todayLog: WellnessLog? {
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
        return weeklyLogs.first { $0.log_date.hasPrefix(String(today)) }
    }
    
    /// 数字孪生 Dashboard 数据（已就绪）
    var digitalTwinDashboard: DigitalTwinDashboardResponse? {
        guard let payload = digitalTwin,
              let dashboardData = payload.dashboardData,
              let adaptivePlan = payload.adaptivePlan,
              let lastAnalyzed = payload.lastAnalyzed else {
            return nil
        }
        return DigitalTwinDashboardResponse(
            dashboardData: dashboardData,
            adaptivePlan: adaptivePlan,
            isStale: payload.isStale ?? false,
            lastAnalyzed: lastAnalyzed
        )
    }

    /// 整体状态分数（严格基于真实日志/后端字段）
    var overallScore: Int? {
        if let readiness = todayLog?.overall_readiness {
            return readiness
        }
        if let score = calculateOverallScoreFromLogs(weeklyLogs) {
            return score
        }
        return calculateOverallScoreFromDigitalTwin(digitalTwinDashboard)
    }
    
    /// 状态标签
    var scoreStatus: String {
        guard let score = overallScore else { return "暂无数据" }
        switch score {
        case 80...100: return "优秀"
        case 60..<80: return "良好"
        case 40..<60: return "一般"
        default: return "需关注"
        }
    }
    
    /// 状态颜色
    var scoreColor: Color {
        guard let score = overallScore else { return .textTertiary }
        switch score {
        case 80...100: return .statusSuccess
        case 60..<80: return .liquidGlassAccent
        case 40..<60: return .statusWarning
        default: return .statusError
        }
    }

    /// 整体趋势（来自数字孪生曲线）
    var overallTrendText: String? {
        guard let trend = calculateOverallTrendFromDigitalTwin(digitalTwinDashboard) else { return nil }
        switch trend {
        case .improving: return "趋势：上升"
        case .declining: return "趋势：下降"
        case .stable: return "趋势：稳定"
        }
    }
    
    /// 平均睡眠时长（小时）
    var averageSleepHours: Double {
        let validLogs = weeklyLogs.compactMap { $0.sleep_duration_minutes }
        guard !validLogs.isEmpty else { return 0 }
        return Double(validLogs.reduce(0, +)) / Double(validLogs.count) / 60.0
    }
    
    /// 平均压力水平
    var averageStress: Double {
        let validLogs = weeklyLogs.compactMap { $0.stress_level }
        guard !validLogs.isEmpty else { return 0 }
        return Double(validLogs.reduce(0, +)) / Double(validLogs.count)
    }
    
    /// Digital Twin 是否可用
    var hasDigitalTwin: Bool {
        digitalTwinDashboard != nil
    }
    
    /// 关键洞察（来自数字孪生汇总）
    var keyInsights: [String] {
        guard let dashboard = digitalTwinDashboard else { return [] }
        var insights: [String] = []
        let summary = dashboard.dashboardData.summaryStats
        if !summary.overallImprovement.isEmpty {
            insights.append("整体改善：\(summary.overallImprovement)")
        }
        if !summary.consistencyScore.isEmpty {
            insights.append("一致性：\(summary.consistencyScore)")
        }
        if let baseline = dashboard.dashboardData.baselineData.assessments.first {
            insights.append("\(baseline.name)：\(baseline.value)")
        }
        return insights
    }
    
    /// 今日 AI 建议
    var aiRecommendation: String? {
        nil
    }

    /// Digital Twin 状态
    var digitalTwinStatus: String? {
        digitalTwin?.status
    }

    var digitalTwinStatusMessage: String {
        if let message = digitalTwin?.message, !message.isEmpty {
            return message
        }
        if digitalTwinDashboard != nil {
            return "预测数据已就绪"
        }
        return "暂无数据"
    }

    var digitalTwinCollectionStatus: DataCollectionStatus? {
        digitalTwin?.collectionStatus
    }
    
    // MARK: - Dependencies
    
    private let supabase = SupabaseManager.shared
    private let healthKit = HealthKitService.shared
    
    // MARK: - Cache (对应 Web 端的 in-memory cache)
    
    private static var cachedData: DashboardData?
    private static var lastFetchTime: Date?
    private static var cachedTwin: DigitalTwinDashboardPayload?
    private static var lastTwinFetchTime: Date?
    private static let staleTime: TimeInterval = 30 // 30 秒
    private static var lastInquiryUserId: String?
    private static var lastInquiryToken: String?

    private let recommendationsCacheKey = "daily_ai_recommendations_cache"
    private let recommendationsTriggerKeyPrefix = "daily_ai_recommendations_trigger_"
    
    private var isCacheStale: Bool {
        guard let lastFetch = Self.lastFetchTime else { return true }
        return Date().timeIntervalSince(lastFetch) > Self.staleTime
    }

    private var isTwinCacheStale: Bool {
        guard let lastFetch = Self.lastTwinFetchTime else { return true }
        return Date().timeIntervalSince(lastFetch) > Self.staleTime
    }
    
    // MARK: - Initialization
    
    init() {
        // 从缓存恢复数据
        if let cached = Self.cachedData {
            self.profile = cached.profile
            self.weeklyLogs = cached.weeklyLogs
            self.hardwareData = cached.hardwareData
        }
        if let cachedTwin = Self.cachedTwin {
            self.digitalTwin = cachedTwin
        }
    }
    
    // MARK: - Data Fetching (对应 fetchData)
    
    /// 加载所有 Dashboard 数据
    func loadData(force: Bool = false) async {
        guard !isLoading || force else { return }
        if !force && !isCacheStale && Self.cachedData != nil { return }

        isLoading = Self.cachedData == nil
        error = nil

        do {
            let data = try await supabase.getDashboardData()
            let hardware: HardwareData?
            if let cachedHardware = data.hardwareData {
                hardware = cachedHardware
            } else {
                hardware = await loadHardwareData()
            }

            self.profile = data.profile
            self.weeklyLogs = data.weeklyLogs
            self.hardwareData = hardware

            Self.cachedData = DashboardData(
                profile: data.profile,
                weeklyLogs: data.weeklyLogs,
                hardwareData: hardware
            )
            Self.lastFetchTime = Date()

            syncToWidget()
        } catch {
            self.error = error.localizedDescription
            print("[Dashboard] Load error: \(error)")
        }

        isLoading = false
    }
    
    /// 加载穿戴设备/HealthKit 数据
    private func loadHardwareData() async -> HardwareData? {
        // 优先从 Supabase 获取
        let supabaseData = try? await supabase.getHardwareData()
        if let data = supabaseData, data.hrv != nil || data.resting_heart_rate != nil {
            return data
        }
        
        // 备用：从 HealthKit 获取
        return await loadFromHealthKit()
    }
    
    /// 从 HealthKit 加载数据
    private func loadFromHealthKit() async -> HardwareData? {
        guard healthKit.isAvailable else { return nil }
        
        do {
            try await healthKit.requestAuthorization()
        } catch {
            print("[Dashboard] HealthKit auth error: \(error)")
            return nil
        }
        
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        
        async let hrvValue = healthKit.queryLatestHRV()
        async let rhrValue = healthKit.queryRestingHeartRate(from: startOfDay, to: now)
        async let stepsValue = healthKit.querySteps(from: startOfDay, to: now)
        
        let hrv = (try? await hrvValue) ?? 0
        let rhr = (try? await rhrValue) ?? 0
        let steps = (try? await stepsValue) ?? 0
        
        var hardware = HardwareData()
        
        if hrv > 0 {
            hardware.hrv = HardwareDataPoint(value: hrv, source: "HealthKit", recorded_at: ISO8601DateFormatter().string(from: now))
        }
        
        if rhr > 0 {
            hardware.resting_heart_rate = HardwareDataPoint(value: rhr, source: "HealthKit", recorded_at: ISO8601DateFormatter().string(from: now))
        }

        if steps > 0 {
            hardware.steps = HardwareDataPoint(value: steps, source: "HealthKit", recorded_at: ISO8601DateFormatter().string(from: now))
        }
        
        return hardware
    }
    
    // MARK: - Digital Twin (对应 loadDigitalTwin, analyzeDigitalTwin)
    
    /// 加载数字孪生数据
    func loadDigitalTwin(force: Bool = false) async {
        guard !loadingDigitalTwin else { return }
        if !force && !isTwinCacheStale, let cached = Self.cachedTwin {
            self.digitalTwin = cached
            return
        }

        loadingDigitalTwin = true
        defer { loadingDigitalTwin = false }

        do {
            let payload = try await supabase.getDigitalTwinDashboard()
            self.digitalTwin = payload
            Self.cachedTwin = payload
            Self.lastTwinFetchTime = Date()
        } catch {
            print("[Dashboard] Digital Twin load error: \(error)")
        }
    }
    
    /// 触发数字孪生分析（调用 API）
    func analyzeDigitalTwin(forceRefresh: Bool = true) async -> Bool {
        loadingDigitalTwin = true
        error = nil
        
        defer { loadingDigitalTwin = false }

        let result = await supabase.triggerDigitalTwinAnalysis(forceRefresh: forceRefresh)
        if result.triggered {
            await loadDigitalTwin(force: true)
            return digitalTwinDashboard != nil
        }

        error = result.reason
        return false
    }

    // MARK: - AI Inquiry (主动问询)

    func loadInquiry(language: String, force: Bool = false) async {
        guard shouldRefreshInquiry(force: force) else { return }
        isInquiryLoading = true
        inquiryError = nil
        do {
            let response = try await supabase.getPendingInquiry(language: language)
            inquiry = response.hasInquiry ? response.inquiry : nil
        } catch {
            inquiry = nil
            inquiryError = error.localizedDescription
        }
        isInquiryLoading = false
    }

    private func shouldRefreshInquiry(force: Bool) -> Bool {
        if force { return true }
        guard let userId = supabase.currentUser?.id else { return false }
        let token = UserDefaults.standard.string(forKey: "supabase_access_token") ?? ""
        if Self.lastInquiryUserId != userId || Self.lastInquiryToken != token {
            Self.lastInquiryUserId = userId
            Self.lastInquiryToken = token
            return true
        }
        return inquiry == nil
    }

    func respondInquiry(option: InquiryOption) async {
        guard let inquiry else { return }
        isInquiryLoading = true
        inquiryError = nil
        do {
            _ = try await supabase.respondInquiry(inquiryId: inquiry.id, response: option.value)
            self.inquiry = nil
            await loadData(force: true)
        } catch {
            inquiryError = error.localizedDescription
        }
        isInquiryLoading = false
    }

    func dismissInquiry() {
        inquiry = nil
    }

    // MARK: - AI Recommendations (每日 3-4 条，后台生成)

    func loadDailyRecommendations(language: String, force: Bool = false) async {
        if aiRecommendations.isEmpty {
            isRecommendationsLoading = true
        }
        recommendationsError = nil
        let now = Date()

        do {
            let items = try await supabase.getDailyRecommendations(date: now)
            if !items.isEmpty {
                aiRecommendations = items
                saveRecommendationsCache(items, date: now)
            } else if let cached = loadRecommendationsCache(for: now) {
                aiRecommendations = cached
            }

            if items.isEmpty && shouldTriggerRecommendations(for: now, force: force) {
                Task.detached { [language] in
                    await SupabaseManager.shared.triggerDailyRecommendations(force: force, language: language)
                }
            }
        } catch {
            recommendationsError = error.localizedDescription
            if let cached = loadRecommendationsCache(for: now) {
                aiRecommendations = cached
            }
        }

        isRecommendationsLoading = false
    }

    private func loadRecommendationsCache(for date: Date) -> [DailyAIRecommendationItem]? {
        guard let data = UserDefaults.standard.data(forKey: recommendationsCacheKey),
              let cache = try? JSONDecoder().decode(DailyAIRecommendationCache.self, from: data) else {
            return nil
        }
        let dayString = cache.date
        if dayString == DailyAIRecommendationCache.dateString(from: date) {
            return cache.items
        }
        return nil
    }

    private func saveRecommendationsCache(_ items: [DailyAIRecommendationItem], date: Date) {
        let cache = DailyAIRecommendationCache(date: DailyAIRecommendationCache.dateString(from: date), items: items)
        if let data = try? JSONEncoder().encode(cache) {
            UserDefaults.standard.set(data, forKey: recommendationsCacheKey)
        }
    }

    private func shouldTriggerRecommendations(for date: Date, force: Bool) -> Bool {
        if force { return true }
        let dayString = DailyAIRecommendationCache.dateString(from: date)
        let key = "\(recommendationsTriggerKeyPrefix)\(dayString)"
        if UserDefaults.standard.bool(forKey: key) {
            return false
        }
        UserDefaults.standard.set(true, forKey: key)
        return true
    }
    
    // MARK: - Sync (对应 sync)
    
    /// 同步用户画像
    func sync() async {
        guard !isSyncing else { return }
        
        isSyncing = true
        error = nil
        
        defer { isSyncing = false }
        
        // 刷新所有数据
        await loadData(force: true)
        
        // 如果有数字孪生，也刷新
        if digitalTwin != nil {
            await loadDigitalTwin()
        }
    }
    
    // MARK: - Refresh (对应 refresh)
    
    /// 刷新数据（用于下拉刷新）
    func refresh() async {
        await loadData(force: true)
        await loadDigitalTwin()
    }
    
    // MARK: - Widget Sync
    
    private func syncToWidget() {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.youngtony") else {
            return
        }

        if let score = overallScore {
            sharedDefaults.set(score, forKey: "widget_anxietyScore")
        } else {
            sharedDefaults.removeObject(forKey: "widget_anxietyScore")
        }
        sharedDefaults.set(hardwareData?.hrv?.value ?? 0, forKey: "widget_hrv")
        sharedDefaults.set(hardwareData?.resting_heart_rate?.value ?? 0, forKey: "widget_restingHeartRate")
        sharedDefaults.set(averageSleepHours, forKey: "widget_sleepDuration")
        sharedDefaults.set(averageSleepHours, forKey: "widget_sleepHours")
        sharedDefaults.set(hardwareData?.steps?.value ?? 0, forKey: "widget_steps")
        sharedDefaults.set(Date(), forKey: "widget_lastUpdate")
        
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    // MARK: - Strict Score Mapping (对齐 Web data-mapping)

    private func calculateOverallScoreFromLogs(_ logs: [WellnessLog]) -> Int? {
        let minLogCount = 3
        guard logs.count >= minLogCount else { return nil }

        var sleepSum = 0.0
        var sleepCount = 0
        var stressSum = 0.0
        var stressCount = 0
        var energySum = 0.0
        var energyCount = 0
        var exerciseSum = 0.0
        var exerciseCount = 0
        let hydrationSum = 0.0
        let hydrationCount = 0

        for log in logs {
            if let minutes = log.sleep_duration_minutes {
                let hours = Double(minutes) / 60.0
                var score: Double
                if hours >= 7 && hours <= 9 {
                    score = 100
                } else if hours >= 6 && hours < 7 {
                    score = 75
                } else if hours > 9 && hours <= 10 {
                    score = 75
                } else if hours >= 5 && hours < 6 {
                    score = 50
                } else {
                    score = 25
                }

                if let quality = sleepQualityFactor(log.sleep_quality) {
                    score = score * quality
                }

                sleepSum += score
                sleepCount += 1
            }

            if let stressValue = log.stress_level {
                let normalized = normalizeStressLevel(stressValue)
                let stressScore = Double(6 - normalized) * 20.0
                stressSum += stressScore
                stressCount += 1
            }

            if let energyValue = log.morning_energy ?? log.energy_level {
                let energyScore = Double(energyValue) * 20.0
                energySum += energyScore
                energyCount += 1
            }

            if let minutes = log.exercise_duration_minutes {
                let score: Double
                if minutes >= 30 {
                    score = min(100, (Double(minutes) / 60.0) * 100)
                } else {
                    score = (Double(minutes) / 30.0) * 60
                }
                exerciseSum += score
                exerciseCount += 1
            }

        }

        let sleepScore = sleepCount > 0 ? sleepSum / Double(sleepCount) : 0
        let stressScore = stressCount > 0 ? stressSum / Double(stressCount) : 0
        let energyScore = energyCount > 0 ? energySum / Double(energyCount) : 0
        let exerciseScore = exerciseCount > 0 ? exerciseSum / Double(exerciseCount) : 0
        let hydrationScore = hydrationCount > 0 ? hydrationSum / Double(hydrationCount) : 0

        let totalFields = 5.0
        let filledFields = Double([sleepCount, stressCount, energyCount, exerciseCount, hydrationCount].filter { $0 > 0 }.count)
        let dataQuality = filledFields / totalFields
        guard dataQuality >= 0.5 else { return nil }

        let overallScore = (sleepScore + stressScore + energyScore + exerciseScore + hydrationScore) / totalFields
        return Int(round(overallScore))
    }

    private func calculateOverallScoreFromDigitalTwin(_ dashboard: DigitalTwinDashboardResponse?) -> Int? {
        guard let charts = dashboard?.dashboardData.charts else { return nil }
        let anxiety = charts.anxietyTrend.last.map { 100 - $0 }
        let sleep = charts.sleepTrend.last
        let energy = charts.energyTrend.last
        let hrv = charts.hrvTrend.last

        let values = [anxiety, sleep, energy, hrv].compactMap { $0 }
        guard !values.isEmpty else { return nil }
        let avg = values.reduce(0, +) / Double(values.count)
        return Int(avg.rounded())
    }

    private enum OverallTrend {
        case improving
        case stable
        case declining
    }

    private func calculateOverallTrendFromDigitalTwin(_ dashboard: DigitalTwinDashboardResponse?) -> OverallTrend? {
        guard let charts = dashboard?.dashboardData.charts else { return nil }
        let count = charts.anxietyTrend.count
        guard count >= 2 else { return nil }

        let current = averageDigitalTwinScore(
            anxiety: charts.anxietyTrend.last,
            sleep: charts.sleepTrend.last,
            energy: charts.energyTrend.last,
            hrv: charts.hrvTrend.last
        )
        let previous = averageDigitalTwinScore(
            anxiety: charts.anxietyTrend.dropLast().last,
            sleep: charts.sleepTrend.dropLast().last,
            energy: charts.energyTrend.dropLast().last,
            hrv: charts.hrvTrend.dropLast().last
        )

        guard let curr = current, let prev = previous else { return nil }
        let delta = curr - prev
        if delta > 2 { return .improving }
        if delta < -2 { return .declining }
        return .stable
    }

    private func averageDigitalTwinScore(
        anxiety: Double?,
        sleep: Double?,
        energy: Double?,
        hrv: Double?
    ) -> Double? {
        let transformedAnxiety = anxiety.map { 100 - $0 }
        let values = [transformedAnxiety, sleep, energy, hrv].compactMap { $0 }
        guard !values.isEmpty else { return nil }
        return values.reduce(0, +) / Double(values.count)
    }

    private func sleepQualityFactor(_ value: String?) -> Double? {
        guard let value else { return nil }
        if let numeric = Double(value) {
            return max(0.0, min(1.0, numeric / 5.0))
        }
        switch value.lowercased() {
        case "excellent": return 1.0
        case "good": return 0.9
        case "average": return 0.7
        case "poor": return 0.4
        default: return nil
        }
    }

    private func normalizeStressLevel(_ value: Int) -> Int {
        if value <= 5 { return max(1, value) }
        let normalized = Int(round(Double(value) / 2.0))
        return min(5, max(1, normalized))
    }
}

private struct DailyAIRecommendationCache: Codable {
    let date: String
    let items: [DailyAIRecommendationItem]

    static func dateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}
