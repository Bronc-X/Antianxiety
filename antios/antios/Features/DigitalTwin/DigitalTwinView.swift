//
//  DigitalTwinView.swift
//  antios
//
//  I1-I2: 数字孪生视图
//

import SwiftUI
import Charts

struct DigitalTwinView: View {
    @StateObject private var viewModel = DigitalTwinViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // 预测曲线 (I1)
                    predictionSection
                    
                    // AI 解读 (I2)
                    aiExplanationSection
                    
                    // 因素分析
                    factorsSection
                }
                .padding(AppTheme.Spacing.md)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle("数字孪生")
            .navigationBarTitleDisplayMode(.large)
        }
        .onAppear {
            viewModel.loadData()
        }
        .onChange(of: viewModel.selectedMetric) { _ in
            viewModel.loadData()
        }
    }
    
    // MARK: - Prediction Section (I1)
    
    private var predictionSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            HStack {
                Text("未来 7 天预测")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Spacer()
                
                Picker("指标", selection: $viewModel.selectedMetric) {
                    Text("情绪").tag(PredictionMetric.mood)
                    Text("压力").tag(PredictionMetric.stress)
                    Text("睡眠").tag(PredictionMetric.sleep)
                }
                .pickerStyle(.segmented)
                .frame(width: 180)
            }
            
            // Chart
            Chart {
                ForEach(viewModel.historicalData) { point in
                    LineMark(
                        x: .value("日期", point.date),
                        y: .value("值", point.value)
                    )
                    .foregroundStyle(AppTheme.Colors.primary)
                    
                    PointMark(
                        x: .value("日期", point.date),
                        y: .value("值", point.value)
                    )
                    .foregroundStyle(AppTheme.Colors.primary)
                }
                
                ForEach(viewModel.predictionData) { point in
                    LineMark(
                        x: .value("日期", point.date),
                        y: .value("值", point.value)
                    )
                    .foregroundStyle(AppTheme.Colors.secondary)
                    .lineStyle(StrokeStyle(dash: [5, 3]))
                    
                    AreaMark(
                        x: .value("日期", point.date),
                        yStart: .value("下限", point.lowerBound ?? point.value),
                        yEnd: .value("上限", point.upperBound ?? point.value)
                    )
                    .foregroundStyle(AppTheme.Colors.secondary.opacity(0.2))
                }
            }
            .frame(height: 200)
            .chartYScale(domain: 0...10)
            
            // Legend
            HStack(spacing: AppTheme.Spacing.lg) {
                HStack(spacing: AppTheme.Spacing.xs) {
                    Circle()
                        .fill(AppTheme.Colors.primary)
                        .frame(width: 8, height: 8)
                    Text("历史数据")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textTertiary)
                }
                
                HStack(spacing: AppTheme.Spacing.xs) {
                    Circle()
                        .fill(AppTheme.Colors.secondary)
                        .frame(width: 8, height: 8)
                    Text("预测值")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textTertiary)
                }
            }
        }
        .cardStyle()
    }
    
    // MARK: - AI Explanation Section (I2)
    
    private var aiExplanationSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(AppTheme.Colors.primary)
                
                Text("Max 的解读")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
            }
            
            Text(viewModel.aiExplanation)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textSecondary)
            
            if let recommendation = viewModel.recommendation {
                HStack(alignment: .top, spacing: AppTheme.Spacing.sm) {
                    Image(systemName: "lightbulb.fill")
                        .foregroundColor(AppTheme.Colors.warning)
                    
                    Text(recommendation)
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                }
                .padding(AppTheme.Spacing.md)
                .background(AppTheme.Colors.warning.opacity(0.1))
                .cornerRadius(AppTheme.CornerRadius.md)
            }
        }
        .cardStyle()
    }
    
    // MARK: - Factors Section
    
    private var factorsSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("影响因素")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            ForEach(viewModel.factors) { factor in
                FactorRow(factor: factor)
            }
        }
    }
}

// MARK: - Factor Row

struct FactorRow: View {
    let factor: InfluenceFactor
    
    var body: some View {
        HStack {
            Image(systemName: factor.icon)
                .foregroundColor(factor.impact > 0 ? .green : factor.impact < 0 ? .red : .gray)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(factor.name)
                    .font(AppTheme.Typography.subheadline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Text(factor.description)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            
            Spacer()
            
            Text(factor.impact > 0 ? "+\(factor.impact)" : "\(factor.impact)")
                .font(AppTheme.Typography.headline)
                .foregroundColor(factor.impact > 0 ? .green : factor.impact < 0 ? .red : .gray)
        }
        .cardStyle()
    }
}

// MARK: - View Model

@MainActor
class DigitalTwinViewModel: ObservableObject {
    @Published var selectedMetric: PredictionMetric = .mood
    @Published var historicalData: [DataPoint] = []
    @Published var predictionData: [DataPoint] = []
    @Published var aiExplanation = ""
    @Published var recommendation: String?
    @Published var factors: [InfluenceFactor] = []
    
    func loadData() {
        let snapshots = loadCalibrationSnapshots()
        let historicalValues = metricValues(from: snapshots)
        historicalData = historicalValues

        let slope = trendSlope(for: historicalValues)
        let lastValue = historicalValues.last?.value ?? 6.0
        let calendar = Calendar.current

        predictionData = (1...7).map { dayOffset in
            let value = clamp(lastValue + slope * Double(dayOffset) + projectedAdjustment(dayOffset: dayOffset))
            let width = 0.6 + Double(dayOffset) * 0.12
            return DataPoint(
                date: calendar.date(byAdding: .day, value: dayOffset, to: Date())!,
                value: value,
                lowerBound: clamp(value - width),
                upperBound: clamp(value + width)
            )
        }

        let sleepSeries = snapshots.compactMap { $0.sleepHours.map(Double.init) }
        let moodSeries = snapshots.compactMap { $0.moodScore.map(Double.init) }
        let stressSeries = snapshots.compactMap { $0.stressLevel }
        let confidence = BayesianAnalyticsService.shared.calculateConfidence(
            sleepData: snapshots.map {
                SleepData(
                    date: $0.date,
                    totalHours: Double($0.sleepHours ?? 0),
                    deepSleepHours: 0,
                    remSleepHours: 0
                )
            },
            moodScores: moodSeries.map { Int($0) },
            stressLevels: stressSeries
        )

        let summary = confidence.map { "\($0.factor) \(Int($0.confidence * 100))%" }.joined(separator: "，")
        let forecast = predictionData.prefix(3).map { String(format: "%.1f", $0.value) }.joined(separator: " / ")
        aiExplanation = summary.isEmpty
            ? "目前数据样本较少，系统已根据最近校准记录建立初步趋势模型。"
            : "过去 7 天趋势：\(summary)。未来 3 天预计值：\(forecast)。"

        let nudges = BayesianAnalyticsService.shared.generateNudges(
            sleepData: snapshots.last.map {
                SleepData(date: $0.date, totalHours: Double($0.sleepHours ?? 0), deepSleepHours: 0, remSleepHours: 0)
            },
            stressLevel: snapshots.last?.stressLevel,
            lastCalibration: snapshots.last?.date,
            planCompletion: UserDefaults.standard.double(forKey: "antios_plan_completion_cache")
        )
        recommendation = nudges.first?.message ?? "建议维持当前节律，优先保证稳定睡眠窗口。"

        let avgSleep = sleepSeries.isEmpty ? 0 : sleepSeries.reduce(0, +) / Double(sleepSeries.count)
        let avgStress = stressSeries.isEmpty ? 0 : Double(stressSeries.reduce(0, +)) / Double(stressSeries.count)
        let avgMood = moodSeries.isEmpty ? 0 : moodSeries.reduce(0, +) / Double(moodSeries.count)
        let lastExercise = UserDefaults.standard.integer(forKey: "antios_activity_minutes_today")

        factors = [
            InfluenceFactor(name: "睡眠时长", description: String(format: "均值 %.1f 小时", avgSleep), icon: "moon.fill", impact: impactFromSleep(avgSleep)),
            InfluenceFactor(name: "压力水平", description: String(format: "均值 %.1f / 10", avgStress), icon: "bolt.fill", impact: -impactFromStress(avgStress)),
            InfluenceFactor(name: "情绪评分", description: String(format: "均值 %.1f / 10", avgMood), icon: "face.smiling.fill", impact: impactFromMood(avgMood)),
            InfluenceFactor(name: "活动量", description: "\(lastExercise) 分钟", icon: "figure.run", impact: lastExercise >= 20 ? 1 : 0)
        ]
    }

    private func loadCalibrationSnapshots() -> [CalibrationSnapshot] {
        let key = "antios_calibration_history"
        guard let data = UserDefaults.standard.data(forKey: key) else {
            return syntheticSnapshots()
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let snapshots = (try? decoder.decode([CalibrationSnapshot].self, from: data)) ?? []
        return snapshots.isEmpty ? syntheticSnapshots() : Array(snapshots.suffix(7))
    }

    private func syntheticSnapshots() -> [CalibrationSnapshot] {
        let calendar = Calendar.current
        let stress = UserDefaults.standard.integer(forKey: "antios_clinical_stress_level")
        let sleepHours = UserDefaults.standard.double(forKey: "antios_clinical_sleep_hours")
        let baseSleep = sleepHours > 0 ? sleepHours : 7
        let baseStress = stress > 0 ? stress : 5
        return (0..<7).map { offset in
            let date = calendar.date(byAdding: .day, value: -6 + offset, to: Date())!
            let sleepValue = Int((baseSleep + Double((offset % 3) - 1)).rounded())
            let stressValue = max(1, min(10, baseStress + ((offset % 4) - 2)))
            let moodValue = max(1, min(10, 10 - stressValue + (sleepValue >= 7 ? 1 : 0)))
            return CalibrationSnapshot(
                date: date,
                sleepHours: sleepValue,
                stressLevel: stressValue,
                moodScore: moodValue
            )
        }
    }

    private func metricValues(from snapshots: [CalibrationSnapshot]) -> [DataPoint] {
        snapshots.map { snapshot in
            let value: Double
            switch selectedMetric {
            case .mood:
                value = Double(snapshot.moodScore ?? 6)
            case .stress:
                value = Double(snapshot.stressLevel ?? 5)
            case .sleep:
                value = Double(snapshot.sleepHours ?? 7)
            }
            return DataPoint(date: snapshot.date, value: clamp(value))
        }
    }

    private func projectedAdjustment(dayOffset: Int) -> Double {
        switch selectedMetric {
        case .mood: return 0.06 * Double(dayOffset)
        case .stress: return -0.04 * Double(dayOffset)
        case .sleep: return 0.03 * Double(dayOffset)
        }
    }

    private func trendSlope(for points: [DataPoint]) -> Double {
        guard points.count >= 2 else { return 0 }
        let first = points.first!.value
        let last = points.last!.value
        return (last - first) / Double(points.count - 1)
    }

    private func clamp(_ value: Double) -> Double {
        min(10, max(0, value))
    }

    private func impactFromSleep(_ hours: Double) -> Int {
        if hours >= 7 { return 2 }
        if hours >= 6 { return 1 }
        return -1
    }

    private func impactFromStress(_ stress: Double) -> Int {
        if stress >= 7 { return 2 }
        if stress >= 5 { return 1 }
        return 0
    }

    private func impactFromMood(_ mood: Double) -> Int {
        if mood >= 7 { return 2 }
        if mood >= 5 { return 1 }
        return -1
    }
}

private struct CalibrationSnapshot: Codable {
    let date: Date
    let sleepHours: Int?
    let stressLevel: Int?
    let moodScore: Int?
}

// MARK: - Models

enum PredictionMetric: String {
    case mood
    case stress
    case sleep
}

struct DataPoint: Identifiable {
    let id = UUID()
    let date: Date
    let value: Double
    var lowerBound: Double?
    var upperBound: Double?
}

struct InfluenceFactor: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    let icon: String
    let impact: Int
}

struct DigitalTwinView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    DigitalTwinView()
    }
}
