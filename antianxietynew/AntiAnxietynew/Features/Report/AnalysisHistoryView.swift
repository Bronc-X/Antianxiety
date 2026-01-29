// AnalysisHistoryView.swift
// 分析历史与趋势

import SwiftUI

struct AnalysisHistoryView: View {
    @StateObject private var viewModel = AnalysisHistoryViewModel()
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    if let latest = viewModel.records.first {
                        summaryCard(latest)
                    }

                    historyList
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("分析记录")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("健康分析历史")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("追踪长期趋势与置信度")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func summaryCard(_ record: AnalysisHistoryRecord) -> some View {
        LiquidGlassCard(style: .elevated, padding: 16) {
            HStack(spacing: 16) {
                ProgressRingView(progress: (record.anxietyScore ?? 0) / 100, lineWidth: 8, color: .liquidGlassAccent)
                    .frame(width: 72, height: 72)

                VStack(alignment: .leading, spacing: 6) {
                    Text("最新分析")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Text(record.createdAt)
                        .font(.caption)
                        .foregroundColor(.textSecondary)

                    HStack(spacing: 8) {
                        StatusPill(text: record.statusText, color: record.statusColor)
                        Text("置信度 \(record.confidenceText)")
                            .font(.caption2)
                            .foregroundColor(.textTertiary)
                    }
                }

                Spacer()
            }
        }
    }

    private var historyList: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("历史记录")
                    .font(.headline)
                    .foregroundColor(.textPrimary)

                if viewModel.records.isEmpty {
                    Text("暂无历史记录")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                } else {
                    ForEach(viewModel.records) { record in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(record.createdAt)
                                    .font(.caption2)
                                    .foregroundColor(.textTertiary)
                                Spacer()
                                StatusPill(text: record.statusText, color: record.statusColor)
                            }

                            HStack(spacing: 10) {
                                ReportMetricView(title: "焦虑", value: record.metricText(record.anxietyScore))
                                ReportMetricView(title: "睡眠", value: record.metricText(record.sleepQuality))
                                ReportMetricView(title: "恢复", value: record.metricText(record.recovery))
                            }
                        }
                        .padding(.vertical, 8)

                        if record.id != viewModel.records.last?.id {
                            Divider().background(Color.white.opacity(0.1))
                        }
                    }
                }
            }
        }
    }
}

@MainActor
final class AnalysisHistoryViewModel: ObservableObject {
    @Published var records: [AnalysisHistoryRecord] = []
    @Published var isLoading = false

    private let supabase = SupabaseManager.shared

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            records = try await supabase.getAnalysisHistory(limit: 10)
        } catch {
            records = []
        }
    }
}

struct AnalysisHistoryRecord: Codable, Identifiable {
    let id: String
    let anxietyScore: Double?
    let sleepQuality: Double?
    let stressResilience: Double?
    let moodStability: Double?
    let energyLevel: Double?
    let hrvEstimate: Double?
    let overallStatus: String?
    let confidenceScore: Double?
    let createdAtRaw: String

    enum CodingKeys: String, CodingKey {
        case id
        case anxietyScore = "anxiety_score"
        case sleepQuality = "sleep_quality"
        case stressResilience = "stress_resilience"
        case moodStability = "mood_stability"
        case energyLevel = "energy_level"
        case hrvEstimate = "hrv_estimate"
        case overallStatus = "overall_status"
        case confidenceScore = "confidence_score"
        case createdAtRaw = "created_at"
    }

    var createdAt: String {
        String(createdAtRaw.replacingOccurrences(of: "T", with: " ").prefix(16))
    }

    var statusText: String {
        switch overallStatus {
        case "improving": return "改善"
        case "needs_attention": return "注意"
        default: return "稳定"
        }
    }

    var statusColor: Color {
        switch overallStatus {
        case "improving": return .statusSuccess
        case "needs_attention": return .statusWarning
        default: return .liquidGlassWarm
        }
    }

    var confidenceText: String {
        guard let confidenceScore else { return "—" }
        return String(format: "%.0f%%", confidenceScore * 100)
    }

    var recovery: Double? { stressResilience }

    func metricText(_ value: Double?) -> String {
        guard let value else { return "—" }
        return String(format: "%.0f", value)
    }
}
