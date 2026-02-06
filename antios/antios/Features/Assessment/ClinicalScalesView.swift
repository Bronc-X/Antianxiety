//
//  ClinicalScalesView.swift
//  antios
//
//  B1: 临床量表选择视图
//

import SwiftUI

struct ClinicalScalesView: View {
    @State private var selectedScale: ClinicalScale?
    @State private var showAssessment = false
    @State private var assessmentHistory: [AssessmentResult] = []
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // 量表选择
                    scaleSelectionSection
                    
                    // 历史记录
                    if !assessmentHistory.isEmpty {
                        historySection
                    }
                }
                .padding(AppTheme.Spacing.md)
            }
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("临床评估")
            .navigationBarTitleDisplayMode(.large)
            .sheet(item: $selectedScale) { scale in
                ScaleAssessmentView(scale: scale) { result in
                    assessmentHistory.insert(result, at: 0)
                    selectedScale = nil
                }
            }
        }
        .onAppear {
            loadHistory()
        }
    }
    
    // MARK: - Scale Selection
    
    private var scaleSelectionSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("选择评估量表")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            ForEach(ClinicalScale.allCases) { scale in
                ScaleCard(scale: scale) {
                    selectedScale = scale
                }
            }
        }
    }
    
    // MARK: - History
    
    private var historySection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("评估历史")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            ForEach(assessmentHistory) { result in
                HistoryCard(result: result)
            }
        }
    }
    
    private func loadHistory() {
        // Mock data
        assessmentHistory = [
            AssessmentResult(id: "1", scale: .gad7, score: 8, maxScore: 21, severity: "轻度", date: Date().addingTimeInterval(-86400 * 7)),
            AssessmentResult(id: "2", scale: .phq9, score: 12, maxScore: 27, severity: "中度", date: Date().addingTimeInterval(-86400 * 14))
        ]
    }
}

// MARK: - Scale Card

struct ScaleCard: View {
    let scale: ClinicalScale
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: AppTheme.Spacing.md) {
                Image(systemName: scale.icon)
                    .font(.title2)
                    .foregroundColor(scale.color)
                    .frame(width: 44, height: 44)
                    .background(scale.color.opacity(0.2))
                    .cornerRadius(AppTheme.CornerRadius.md)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(scale.name)
                        .font(AppTheme.Typography.headline)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Text(scale.description)
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                    
                    Text("\(scale.questionCount) 题 · 约 \(scale.estimatedMinutes) 分钟")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textTertiary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            .cardStyle()
        }
    }
}

// MARK: - History Card

struct HistoryCard: View {
    let result: AssessmentResult
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(result.scale.name)
                    .font(AppTheme.Typography.subheadline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Text(result.date.formatted(date: .abbreviated, time: .omitted))
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(result.score)/\(result.maxScore)")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Text(result.severity)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(severityColor(result.severity))
            }
        }
        .cardStyle()
    }
    
    private func severityColor(_ severity: String) -> Color {
        switch severity {
        case "正常", "轻度": return .green
        case "中度": return .orange
        default: return .red
        }
    }
}

// MARK: - Models

enum ClinicalScale: String, CaseIterable, Identifiable {
    case gad7 = "GAD-7"
    case phq9 = "PHQ-9"
    case isi = "ISI"
    
    var id: String { rawValue }
    
    var name: String { rawValue }
    
    var description: String {
        switch self {
        case .gad7: return "广泛性焦虑障碍量表"
        case .phq9: return "患者健康问卷抑郁量表"
        case .isi: return "失眠严重程度指数"
        }
    }
    
    var icon: String {
        switch self {
        case .gad7: return "brain"
        case .phq9: return "heart"
        case .isi: return "moon.zzz"
        }
    }
    
    var color: Color {
        switch self {
        case .gad7: return .purple
        case .phq9: return .blue
        case .isi: return .indigo
        }
    }
    
    var questionCount: Int {
        switch self {
        case .gad7: return 7
        case .phq9: return 9
        case .isi: return 7
        }
    }
    
    var estimatedMinutes: Int {
        switch self {
        case .gad7: return 2
        case .phq9: return 3
        case .isi: return 2
        }
    }
    
    var questions: [ScaleQuestion] {
        switch self {
        case .gad7:
            return [
                ScaleQuestion(text: "感到紧张、焦虑或急切"),
                ScaleQuestion(text: "不能停止或控制担忧"),
                ScaleQuestion(text: "对各种各样的事情担忧过多"),
                ScaleQuestion(text: "很难放松下来"),
                ScaleQuestion(text: "由于不安而无法静坐"),
                ScaleQuestion(text: "变得容易烦恼或急躁"),
                ScaleQuestion(text: "感到似乎将有可怕的事情发生而害怕")
            ]
        case .phq9:
            return [
                ScaleQuestion(text: "做事时提不起劲或没有兴趣"),
                ScaleQuestion(text: "感到心情低落、沮丧或绝望"),
                ScaleQuestion(text: "入睡困难、睡不安稳或睡眠过多"),
                ScaleQuestion(text: "感觉疲倦或没有活力"),
                ScaleQuestion(text: "食欲不振或吃太多"),
                ScaleQuestion(text: "觉得自己很糟或觉得自己很失败"),
                ScaleQuestion(text: "注意力难以集中"),
                ScaleQuestion(text: "动作或说话速度变慢/烦躁不安"),
                ScaleQuestion(text: "有不如死掉或用某种方式伤害自己的念头")
            ]
        case .isi:
            return [
                ScaleQuestion(text: "入睡困难"),
                ScaleQuestion(text: "睡眠维持困难"),
                ScaleQuestion(text: "早醒"),
                ScaleQuestion(text: "对目前睡眠状况满意度"),
                ScaleQuestion(text: "失眠影响日间功能的程度"),
                ScaleQuestion(text: "失眠对生活质量的影响"),
                ScaleQuestion(text: "对失眠的担忧程度")
            ]
        }
    }
}

struct ScaleQuestion: Identifiable {
    let id = UUID()
    let text: String
}

struct AssessmentResult: Identifiable {
    let id: String
    let scale: ClinicalScale
    let score: Int
    let maxScore: Int
    let severity: String
    let date: Date
}

#Preview {
    ClinicalScalesView()
}
