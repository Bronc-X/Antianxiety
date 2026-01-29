// CalibrationExtras.swift
// 周/月校准视图

import SwiftUI

struct DailyQuestionnaireView: View {
    let log: WellnessLog?

    init(log: WellnessLog? = nil) {
        self.log = log
    }

    var body: some View {
        if let log {
            DailyLogDetailView(log: log)
        } else {
            CalibrationView()
        }
    }
}

private struct DailyLogDetailView: View {
    let log: WellnessLog
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AbyssBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .elevated, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("今日校准数据")
                                    .font(.headline)
                                    .foregroundColor(.textPrimary)
                                Spacer()
                                Text(formattedDate(log.log_date))
                                    .font(.caption)
                                    .foregroundColor(.textTertiary)
                            }

                            MetricRow(label: "睡眠时长", value: log.sleep_duration_minutes.map { "\($0) min" } ?? "未记录")
                            MetricRow(label: "睡眠质量", value: log.sleep_quality ?? "未记录")
                            MetricRow(label: "压力水平", value: log.stress_level.map { "\($0)" } ?? "未记录")
                            MetricRow(label: "精力状态", value: log.energy_level.map { "\($0)" } ?? "未记录")
                            MetricRow(label: "焦虑水平", value: log.anxiety_level.map { "\($0)" } ?? "未记录")
                            MetricRow(label: "身体紧张", value: log.body_tension.map { "\($0)" } ?? "未记录")
                            MetricRow(label: "思维清晰度", value: log.mental_clarity.map { "\($0)" } ?? "未记录")
                        }
                    }

                    if let recommendation = log.ai_recommendation, !recommendation.isEmpty {
                        LiquidGlassCard(style: .standard, padding: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("AI 建议")
                                    .font(.headline)
                                    .foregroundColor(.textPrimary)
                                Text(recommendation)
                                    .font(.subheadline)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }

                    NavigationLink(destination: CalibrationView()) {
                        Text("重新填写今日校准")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("每日校准")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("今日已完成")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("再次进入将显示当日数据")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, metrics.isCompactHeight ? 8 : 16)
    }

    private func formattedDate(_ dateString: String) -> String {
        let components = dateString.split(separator: "T").first.map(String.init) ?? dateString
        return components
    }
}

private struct MetricRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundColor(.textSecondary)
            Spacer()
            Text(value)
                .font(.caption)
                .foregroundColor(.textPrimary)
        }
    }
}

struct WeeklyCalibrationView: View {
    @StateObject private var viewModel = WeeklyCalibrationViewModel()
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AbyssBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .elevated, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("本周概览")
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            HStack(spacing: 12) {
                                ReportMetricView(title: "睡眠", value: viewModel.averageSleep)
                                ReportMetricView(title: "压力", value: viewModel.averageStress)
                                ReportMetricView(title: "能量", value: viewModel.averageEnergy)
                            }

                            Text("记录次数：\(viewModel.logs.count) / 7")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }
                    }

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("最近记录")
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            if viewModel.logs.isEmpty {
                                Text("暂无记录")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            } else {
                                ForEach(viewModel.logs.prefix(7)) { log in
                                    HStack {
                                        Text(log.log_date)
                                            .font(.caption2)
                                            .foregroundColor(.textTertiary)
                                        Spacer()
                                        Text("睡眠 \(log.sleep_duration_minutes ?? 0)min")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                    }
                                }
                            }
                        }
                    }

                    NavigationLink(destination: CalibrationView()) {
                        Text("补充本周校准")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("周校准")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("每周校准复盘")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("总结一周趋势并更新计划")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct MonthlyCalibrationView: View {
    @StateObject private var viewModel = MonthlyCalibrationViewModel()
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .elevated, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("本月概览")
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            HStack(spacing: 12) {
                                ReportMetricView(title: "睡眠", value: viewModel.averageSleep)
                                ReportMetricView(title: "压力", value: viewModel.averageStress)
                                ReportMetricView(title: "能量", value: viewModel.averageEnergy)
                            }

                            Text("记录次数：\(viewModel.logs.count) / 30")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }
                    }

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("月度趋势")
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            if viewModel.logs.isEmpty {
                                Text("暂无记录")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            } else {
                                ForEach(viewModel.logs.prefix(10)) { log in
                                    HStack {
                                        Text(log.log_date)
                                            .font(.caption2)
                                            .foregroundColor(.textTertiary)
                                        Spacer()
                                        Text("压力 \(log.stress_level ?? 0)")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                    }
                                }
                            }
                        }
                    }

                    NavigationLink(destination: CalibrationView()) {
                        Text("补充月度校准")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("月校准")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("月度复盘与趋势")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("用于长期趋势追踪")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

@MainActor
final class WeeklyCalibrationViewModel: ObservableObject {
    @Published var logs: [WellnessLog] = []
    @Published var isLoading = false

    private let supabase = SupabaseManager.shared

    var averageSleep: String {
        let values = logs.compactMap { $0.sleep_duration_minutes }
        return formatAverage(values, suffix: "min")
    }

    var averageStress: String {
        let values = logs.compactMap { $0.stress_level }
        return formatAverage(values, suffix: "")
    }

    var averageEnergy: String {
        let values = logs.compactMap { $0.energy_level }
        return formatAverage(values, suffix: "")
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            logs = try await supabase.getWeeklyWellnessLogs()
        } catch {
            logs = []
        }
    }

    private func formatAverage(_ values: [Int], suffix: String) -> String {
        guard !values.isEmpty else { return "—" }
        let avg = Double(values.reduce(0, +)) / Double(values.count)
        return String(format: "%.1f%@", avg, suffix)
    }
}

@MainActor
final class MonthlyCalibrationViewModel: ObservableObject {
    @Published var logs: [WellnessLog] = []
    @Published var isLoading = false

    private let supabase = SupabaseManager.shared

    var averageSleep: String {
        let values = logs.compactMap { $0.sleep_duration_minutes }
        return formatAverage(values, suffix: "min")
    }

    var averageStress: String {
        let values = logs.compactMap { $0.stress_level }
        return formatAverage(values, suffix: "")
    }

    var averageEnergy: String {
        let values = logs.compactMap { $0.energy_level }
        return formatAverage(values, suffix: "")
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            logs = try await supabase.getMonthlyWellnessLogs()
        } catch {
            logs = []
        }
    }

    private func formatAverage(_ values: [Int], suffix: String) -> String {
        guard !values.isEmpty else { return "—" }
        let avg = Double(values.reduce(0, +)) / Double(values.count)
        return String(format: "%.1f%@", avg, suffix)
    }
}
