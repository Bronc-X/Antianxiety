// DigitalTwinViewModel.swift
// 数字孪生曲线视图模型

import SwiftUI

@MainActor
final class DigitalTwinViewModel: ObservableObject {
    @Published var curveData: DigitalTwinCurveOutput?
    @Published var isLoading = false
    @Published var error: String?
    @Published var needsBaseline = false

    private let supabase = SupabaseManager.shared

    func generateCurve(conversationTrend: DigitalTwinConversationTrend? = nil) async {
        isLoading = true
        error = nil
        needsBaseline = false
        defer { isLoading = false }

        do {
            let response = try await supabase.generateDigitalTwinCurve(conversationTrend: conversationTrend?.rawValue)
            guard response.success == true, let data = response.data else {
                let message = response.error ?? "生成曲线失败"
                // 检测是否缺少基线数据
                if message.contains("基线") || message.contains("评估") || response.status == "no_baseline" {
                    needsBaseline = true
                }
                throw DigitalTwinCurveError(message: message)
            }
            curveData = data
            needsBaseline = false
        } catch {
            self.error = error.localizedDescription
        }
    }

    func refreshCurve(devMode: Bool = false) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let response = try await supabase.getDigitalTwinCurve(devMode: devMode)
            guard response.success == true, let data = response.data else {
                let message = response.error ?? "获取曲线失败"
                throw DigitalTwinCurveError(message: message)
            }
            curveData = data
        } catch {
            self.error = error.localizedDescription
        }
    }

    func clear() {
        curveData = nil
        error = nil
    }
}

enum DigitalTwinConversationTrend: String {
    case improving
    case stable
    case declining
}

struct DigitalTwinCurveError: LocalizedError {
    let message: String

    var errorDescription: String? { message }
}

// MARK: - 辅助函数（对齐 Web useDigitalTwinCurve）

extension DigitalTwinViewModel {
    
    /// 获取当前周索引（0-5）
    func getCurrentWeekIndex() -> Int {
        guard let data = curveData,
              let currentWeek = data.meta.currentWeek else { return 0 }
        
        let weeks = [0, 3, 6, 9, 12, 15]
        for i in stride(from: weeks.count - 1, through: 0, by: -1) {
            if currentWeek >= weeks[i] { return i }
        }
        return 0
    }
    
    /// 获取指定指标的所有预测值
    func getMetricPredictions(for metricKey: DigitalTwinMetricKey) -> [(week: Int, value: Double, confidence: String)] {
        guard let data = curveData else { return [] }
        
        return data.predictedLongitudinalOutcomes.timepoints.map { tp in
            let prediction = metricKey.prediction(in: tp.metrics)
            return (week: tp.week, value: prediction.value, confidence: prediction.confidence)
        }
    }
    
    /// 获取当前里程碑
    func getCurrentMilestone() -> DigitalTwinTimelineMilestone? {
        guard let data = curveData else { return nil }
        return data.timeSinceBaselineVisit.milestones.first { $0.status == .current }
    }
    
    /// 获取下一个里程碑
    func getNextMilestone() -> DigitalTwinTimelineMilestone? {
        guard let data = curveData else { return nil }
        let milestones = data.timeSinceBaselineVisit.milestones
        
        if let currentIndex = milestones.firstIndex(where: { $0.status == .current }),
           currentIndex + 1 < milestones.count {
            return milestones[currentIndex + 1]
        }
        return milestones.first { $0.status == .upcoming }
    }
    
    /// 检查数据质量
    func getDataQualityStatus() -> (isGood: Bool, warnings: [String]) {
        guard let data = curveData else { return (false, ["无曲线数据"]) }
        return data.dataQualityStatus()
    }
}

