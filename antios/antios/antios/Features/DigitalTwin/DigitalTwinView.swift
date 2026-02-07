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
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("数字孪生")
            .navigationBarTitleDisplayMode(.large)
        }
        .onAppear {
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
        // Historical data (last 7 days)
        let calendar = Calendar.current
        historicalData = (0..<7).map { dayOffset in
            DataPoint(
                date: calendar.date(byAdding: .day, value: -6 + dayOffset, to: Date())!,
                value: Double.random(in: 5...8)
            )
        }
        
        // Prediction data (next 7 days)
        predictionData = (1...7).map { dayOffset in
            let baseValue = historicalData.last?.value ?? 6
            let predicted = baseValue + Double.random(in: -1...1.5)
            return DataPoint(
                date: calendar.date(byAdding: .day, value: dayOffset, to: Date())!,
                value: min(10, max(0, predicted)),
                lowerBound: max(0, predicted - 1.5),
                upperBound: min(10, predicted + 1.5)
            )
        }
        
        // AI Explanation
        aiExplanation = """
        根据你过去 7 天的数据分析，我注意到你的情绪状态与睡眠质量呈强相关（r=0.72）。当睡眠时间超过 7 小时时，第二天的情绪评分平均提高 1.2 分。
        
        预测显示，如果保持当前的睡眠习惯，未来一周你的情绪状态将保持在 6.5-7.5 分之间。
        """
        
        recommendation = "建议：本周三和周四压力可能较高，提前安排一些放松活动会有帮助。"
        
        factors = [
            InfluenceFactor(name: "睡眠质量", description: "平均 7.2 小时", icon: "moon.fill", impact: 2),
            InfluenceFactor(name: "运动频率", description: "本周 3 次", icon: "figure.run", impact: 1),
            InfluenceFactor(name: "咖啡因摄入", description: "略高于平均", icon: "cup.and.saucer.fill", impact: -1),
            InfluenceFactor(name: "社交活动", description: "本周较少", icon: "person.2.fill", impact: -1)
        ]
    }
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

