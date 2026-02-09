//
//  ResultInterpretationView.swift
//  antios
//
//  B2: 评估结果解读视图
//

import SwiftUI

struct ResultInterpretationView: View {
    let result: AssessmentResult
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // 分数展示
                    scoreSection
                    
                    // 解读
                    interpretationSection
                    
                    // 建议
                    suggestionsSection
                    
                    // 操作
                    actionsSection
                }
                .padding(AppTheme.Spacing.md)
            }
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("评估结果")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(AppTheme.Colors.textTertiary)
                    }
                }
            }
        }
    }
    
    // MARK: - Score Section
    
    private var scoreSection: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            ZStack {
                Circle()
                    .stroke(AppTheme.Colors.backgroundCard, lineWidth: 12)
                    .frame(width: 150, height: 150)
                
                Circle()
                    .trim(from: 0, to: CGFloat(result.score) / CGFloat(result.maxScore))
                    .stroke(severityColor, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .frame(width: 150, height: 150)
                    .rotationEffect(.degrees(-90))
                
                VStack {
                    Text("\(result.score)")
                        .font(.system(size: 44, weight: .bold))
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Text("/ \(result.maxScore)")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textTertiary)
                }
            }
            
            Text(result.severity)
                .font(AppTheme.Typography.title2)
                .foregroundColor(severityColor)
            
            Text(result.scale.name)
                .font(AppTheme.Typography.subheadline)
                .foregroundColor(AppTheme.Colors.textSecondary)
        }
        .cardStyle()
    }
    
    private var severityColor: Color {
        switch result.severity {
        case "正常": return .green
        case "轻度": return .yellow
        case "中度": return .orange
        default: return .red
        }
    }
    
    // MARK: - Interpretation
    
    private var interpretationSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("专业解读")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            Text(interpretation)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textSecondary)
        }
        .cardStyle()
    }
    
    private var interpretation: String {
        switch result.scale {
        case .gad7:
            switch result.severity {
            case "正常": return "您的焦虑水平在正常范围内，继续保持良好的心理状态。"
            case "轻度": return "您可能存在轻度焦虑，建议关注压力管理和放松技巧。"
            case "中度": return "您的焦虑水平中等，建议寻求专业心理咨询支持。"
            default: return "您的焦虑水平较高，强烈建议尽快寻求专业帮助。"
            }
        case .phq9:
            switch result.severity {
            case "正常": return "您的情绪状态良好，没有明显的抑郁倾向。"
            case "轻度": return "您可能存在轻度情绪低落，建议增加社交活动和户外运动。"
            default: return "您的情绪状态需要关注，建议寻求专业心理咨询。"
            }
        case .isi:
            switch result.severity {
            case "正常": return "您的睡眠质量良好，继续保持健康的作息习惯。"
            case "轻度": return "您可能存在轻度睡眠问题，建议改善睡眠卫生。"
            default: return "您的睡眠问题需要重视，建议咨询睡眠专科医生。"
            }
        }
    }
    
    // MARK: - Suggestions
    
    private var suggestionsSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("改善建议")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            ForEach(suggestions, id: \.self) { suggestion in
                HStack(alignment: .top, spacing: AppTheme.Spacing.sm) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(AppTheme.Colors.success)
                    
                    Text(suggestion)
                        .font(AppTheme.Typography.body)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
            }
        }
        .cardStyle()
    }
    
    private var suggestions: [String] {
        switch result.scale {
        case .gad7:
            return [
                "每天进行 10-15 分钟的深呼吸或冥想练习",
                "保持规律的有氧运动，每周至少 3 次",
                "减少咖啡因和酒精摄入",
                "学习识别和挑战焦虑思维"
            ]
        case .phq9:
            return [
                "增加社交活动，与朋友和家人保持联系",
                "每天至少进行 30 分钟户外活动",
                "建立规律的作息时间表",
                "尝试培养新的兴趣爱好"
            ]
        case .isi:
            return [
                "每天固定时间上床和起床",
                "睡前 1 小时避免使用电子设备",
                "保持卧室凉爽、安静、黑暗",
                "睡前进行放松活动，如阅读或泡澡"
            ]
        }
    }
    
    // MARK: - Actions
    
    private var actionsSection: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            Button {
                // Export PDF
            } label: {
                Label("导出 PDF 报告", systemImage: "doc.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            
            Button {
                // Share
            } label: {
                Label("分享给医生", systemImage: "square.and.arrow.up")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
    }
}

struct ResultInterpretationView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    ResultInterpretationView(
        result: AssessmentResult(
            id: "1",
            scale: .gad7,
            score: 12,
            maxScore: 21,
            severity: "中度",
            date: Date()
        )
    )
    }
}
