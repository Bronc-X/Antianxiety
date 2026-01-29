// DigitalTwinDetailView.swift
// 单指标数字孪生详情视图

import SwiftUI
import Charts

struct DigitalTwinDetailView: View {
    let curveData: DigitalTwinCurveOutput
    let metricKey: DigitalTwinMetricKey

    @Environment(\.dismiss) private var dismiss
    @Environment(\.screenMetrics) private var metrics

    private var points: [DigitalTwinMetricPoint] {
        curveData.predictedLongitudinalOutcomes.timepoints.map { point in
            let metric = metricKey.prediction(in: point.metrics)
            let delta = confidenceDelta(metric.confidence)
            let upper = min(100, metric.value + delta)
            let lower = max(0, metric.value - delta)
            return DigitalTwinMetricPoint(
                week: point.week,
                value: metric.value,
                upper: upper,
                lower: lower
            )
        }
    }

    private var currentWeek: Int {
        curveData.meta.currentWeek ?? 0
    }

    private var currentPoint: DigitalTwinMetricPoint {
        let targetWeek = (currentWeek / 3) * 3
        return points.first { $0.week == targetWeek } ?? points.first ?? DigitalTwinMetricPoint(week: 0, value: 0, upper: 0, lower: 0)
    }

    private var week0: DigitalTwinMetricPoint {
        points.first ?? DigitalTwinMetricPoint(week: 0, value: 0, upper: 0, lower: 0)
    }

    private var week15: DigitalTwinMetricPoint {
        points.last ?? DigitalTwinMetricPoint(week: 15, value: 0, upper: 0, lower: 0)
    }

    private var improvement: Double {
        metricKey.isNegative ? (week0.value - week15.value) : (week15.value - week0.value)
    }

    private var improvementPercent: Double {
        guard week0.value > 0 else { return 0 }
        return abs(improvement / week0.value * 100)
    }

    var body: some View {
        ZStack {
            FluidBackground()

            ScrollView {
                VStack(spacing: 16) {
                    header

                    currentValueCard

                    chartCard

                    statsGrid

                    weekByWeekList
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
                .padding(.bottom, metrics.isCompactHeight ? 16 : 24)
            }
        }
        .navigationBarHidden(true)
    }

    private var header: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(Color.white.opacity(0.1))
                    .clipShape(Circle())
            }

            HStack(spacing: 12) {
                Image(systemName: metricKey.systemImage)
                    .foregroundColor(metricKey.color)
                    .frame(width: 36, height: 36)
                    .background(metricKey.color.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 2) {
                    Text(metricKey.label)
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(metricKey.labelEn)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }

            Spacer()
        }
    }

    private var currentValueCard: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("当前预测值")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                        HStack(alignment: .lastTextBaseline, spacing: 6) {
                            Text(String(format: "%.1f", currentPoint.value))
                                .font(.system(size: 36, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("/ 100")
                                .font(.caption)
                                .foregroundColor(.textTertiary)
                        }
                    }

                    Spacer()

                    VStack(spacing: 4) {
                        Image(systemName: improvement >= 0 ? "arrow.up" : "arrow.down")
                            .foregroundColor(improvement >= 0 ? .statusSuccess : .statusWarning)
                        Text(String(format: "%+.1f", improvement))
                            .font(.headline)
                            .foregroundColor(improvement >= 0 ? .statusSuccess : .statusWarning)
                    }
                    .padding(8)
                    .background((improvement >= 0 ? Color.statusSuccess : Color.statusWarning).opacity(0.15))
                    .cornerRadius(12)
                }

                HStack(spacing: 6) {
                    Image(systemName: "info.circle")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                    Text(metricKey.description)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        }
    }

    private var chartCard: some View {
        LiquidGlassCard(style: .standard, padding: 12) {
            VStack(alignment: .leading, spacing: 12) {
                Text("15 周预测曲线")
                    .font(.headline)
                    .foregroundColor(.white)

                Chart {
                    ForEach(points) { point in
                        AreaMark(
                            x: .value("Week", point.week),
                            yStart: .value("Lower", point.lower),
                            yEnd: .value("Upper", point.upper)
                        )
                        .foregroundStyle(metricKey.color.opacity(0.2))
                        .interpolationMethod(.catmullRom)

                        LineMark(
                            x: .value("Week", point.week),
                            y: .value("Value", point.value)
                        )
                        .foregroundStyle(metricKey.color)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        .interpolationMethod(.catmullRom)
                    }

                    if currentWeek > 0 {
                        RuleMark(x: .value("CurrentWeek", (currentWeek / 3) * 3))
                            .foregroundStyle(Color.white.opacity(0.3))
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 3]))
                    }
                }
                .chartYScale(domain: 0...100)
                .chartXAxis {
                    AxisMarks(values: points.map { $0.week }) { value in
                        AxisGridLine().foregroundStyle(Color.white.opacity(0.1))
                        AxisValueLabel {
                            if let week = value.as(Int.self) {
                                Text("W\(week)")
                                    .font(.caption2)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisGridLine().foregroundStyle(Color.white.opacity(0.1))
                        AxisValueLabel {
                            if let val = value.as(Int.self) {
                                Text("\(val)")
                                    .font(.caption2)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }
                }
                .frame(height: 220)
            }
        }
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(title: "基线 (Week 0)", value: week0.value, color: .textPrimary)
            statCard(title: "目标 (Week 15)", value: week15.value, color: metricKey.color)
            statCard(title: "预期改善", value: improvementPercent, color: .statusSuccess, suffix: "%")
            statCard(title: "当前周数", value: Double(currentWeek), color: .liquidGlassAccent, suffix: "W", isInteger: true)
        }
    }

    private func statCard(title: String, value: Double, color: Color, suffix: String = "", isInteger: Bool = false) -> some View {
        LiquidGlassCard(style: .concave, padding: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.caption2)
                    .foregroundColor(.textSecondary)
                let formatted = isInteger ? "\(Int(value))" : String(format: "%.1f", value)
                Text("\(formatted)\(suffix)")
                    .font(.headline)
                    .foregroundColor(color)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var weekByWeekList: some View {
        LiquidGlassCard(style: .standard, padding: 12) {
            VStack(alignment: .leading, spacing: 12) {
                Text("各周预测详情")
                    .font(.headline)
                    .foregroundColor(.white)

                ForEach(points) { point in
                    HStack {
                        HStack(spacing: 8) {
                            Text("W\(point.week)")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                                .frame(width: 36, height: 24)
                                .background(point.week <= currentWeek ? Color.statusSuccess.opacity(0.2) : Color.white.opacity(0.1))
                                .cornerRadius(8)
                            Text(String(format: "%.1f", point.value))
                                .font(.subheadline)
                                .foregroundColor(.white)
                        }
                        Spacer()
                        Text(String(format: "%.1f - %.1f", point.lower, point.upper))
                            .font(.caption2)
                            .foregroundColor(.textTertiary)
                    }
                    if point.id != points.last?.id {
                        Divider().background(Color.white.opacity(0.1))
                    }
                }
            }
        }
    }

    private func confidenceDelta(_ confidence: String) -> Double {
        let parts = confidence.components(separatedBy: "±")
        if let last = parts.last, let value = Double(last.trimmingCharacters(in: .whitespaces)) {
            return value
        }
        return 8.0
    }
}

struct DigitalTwinMetricPoint: Identifiable {
    let week: Int
    let value: Double
    let upper: Double
    let lower: Double

    var id: Int { week }
}

extension DigitalTwinMetricKey {
    var color: Color {
        switch self {
        case .anxietyScore: return Color(red: 0.94, green: 0.35, blue: 0.35)
        case .sleepQuality: return Color(red: 0.54, green: 0.38, blue: 0.95)
        case .stressResilience: return Color(red: 0.96, green: 0.64, blue: 0.18)
        case .moodStability: return Color(red: 0.16, green: 0.76, blue: 0.47)
        case .energyLevel: return Color(red: 0.23, green: 0.51, blue: 0.96)
        case .hrvScore: return Color(red: 0.92, green: 0.28, blue: 0.62)
        }
    }

    var labelEn: String {
        switch self {
        case .anxietyScore: return "Anxiety Score"
        case .sleepQuality: return "Sleep Quality"
        case .stressResilience: return "Stress Resilience"
        case .moodStability: return "Mood Stability"
        case .energyLevel: return "Energy Level"
        case .hrvScore: return "HRV Proxy"
        }
    }

    var description: String {
        switch self {
        case .anxietyScore: return "基于 GAD-7 量表推导，越低越好"
        case .sleepQuality: return "综合睡眠时长和睡眠质量评分"
        case .stressResilience: return "基于 PSS-10 和每日压力校准"
        case .moodStability: return "基于 PHQ-9 和每日情绪波动"
        case .energyLevel: return "综合睡眠、情绪和每日校准"
        case .hrvScore: return "推断值，接入穿戴设备后更准确"
        }
    }
}
