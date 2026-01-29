// ReportViewModels.swift
// 报告模块视图模型

import Foundation
import HealthKit

@MainActor
final class UnderstandingScoreViewModel: ObservableObject {
    @Published var score: UnderstandingScore?
    @Published var history: [UnderstandingScoreHistory] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let supabase = SupabaseManager.shared

    func load(includeHistory: Bool = true, days: Int = 14) async {
        isLoading = true
        errorMessage = nil
        do {
            let response = try await supabase.getUnderstandingScore(includeHistory: includeHistory, days: days)
            score = response.score
            history = response.history ?? []
        } catch {
            errorMessage = error.localizedDescription
            score = nil
            history = []
        }
        isLoading = false
    }

    var latestDelta: Double? {
        let sorted = history.sorted { $0.date > $1.date }
        guard sorted.count >= 2 else { return nil }
        return sorted[0].score - sorted[1].score
    }
}

@MainActor
final class WearableConnectViewModel: ObservableObject {
    @Published var isAvailable = false
    @Published var isAuthorized = false
    @Published var isSyncing = false
    @Published var lastSync: Date?
    @Published var errorMessage: String?
    @Published var hrv: Double?
    @Published var restingHeartRate: Double?
    @Published var steps: Double?
    @Published var sleepHours: Double?

    private let healthKit = HealthKitService.shared

    func refreshStatus() {
        isAvailable = healthKit.isAvailable
        isAuthorized = healthKit.isAuthorizedForRead()
    }

    func connect() async {
        errorMessage = nil
        do {
            try await healthKit.requestAuthorization()
            refreshStatus()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func syncNow() async {
        guard isAvailable else {
            errorMessage = "当前设备不支持 HealthKit"
            return
        }
        errorMessage = nil
        isSyncing = true
        do {
            if !healthKit.isAuthorizedForRead() {
                try await healthKit.requestAuthorization()
            }

            let now = Date()
            let startOfDay = Calendar.current.startOfDay(for: now)

            async let hrvValue = healthKit.queryLatestHRV()
            async let rhrValue = healthKit.queryRestingHeartRate(from: startOfDay, to: now)
            async let stepsValue = healthKit.querySteps(from: startOfDay, to: now)
            async let sleepValue = healthKit.querySleepDuration(from: startOfDay, to: now)

            hrv = try? await hrvValue
            restingHeartRate = try? await rhrValue
            steps = try? await stepsValue
            sleepHours = try? await sleepValue

            lastSync = Date()
            refreshStatus()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSyncing = false
    }
}
