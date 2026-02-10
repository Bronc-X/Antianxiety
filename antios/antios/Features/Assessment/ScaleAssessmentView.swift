//
//  ScaleAssessmentView.swift
//  antios
//
//  量表评估交互视图 - 矩阵布局
//

import SwiftUI

struct ScaleAssessmentView: View {
    let scale: ClinicalScale
    let onComplete: (AssessmentResult) -> Void
    
    @State private var answers: [Int] = []
    @State private var currentPage = 0
    @Environment(\.dismiss) private var dismiss
    
    private let questionsPerPage = 4
    private let options = ["从不", "偶尔", "经常", "总是"]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // 进度条
                progressBar
                
                // 问题区域
                ScrollView {
                    VStack(spacing: AppTheme.Spacing.lg) {
                        ForEach(currentQuestions.indices, id: \.self) { index in
                            questionRow(for: currentPage * questionsPerPage + index)
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
                
                // 底部按钮
                bottomButtons
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle(scale.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            answers = Array(repeating: -1, count: scale.questions.count)
        }
    }
    
    private var currentQuestions: [ScaleQuestion] {
        let start = currentPage * questionsPerPage
        let end = min(start + questionsPerPage, scale.questions.count)
        return Array(scale.questions[start..<end])
    }
    
    private var totalPages: Int {
        (scale.questions.count + questionsPerPage - 1) / questionsPerPage
    }
    
    // MARK: - Progress Bar
    
    private var progressBar: some View {
        VStack(spacing: AppTheme.Spacing.xs) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(AppTheme.Colors.backgroundCard)
                        .frame(height: 4)
                    
                    Rectangle()
                        .fill(AppTheme.Colors.primaryGradient)
                        .frame(width: geo.size.width * progress, height: 4)
                }
            }
            .frame(height: 4)
            
            Text("第 \(currentPage + 1) / \(totalPages) 页")
                .font(AppTheme.Typography.caption)
                .foregroundColor(AppTheme.Colors.textTertiary)
        }
        .padding(AppTheme.Spacing.md)
    }
    
    private var progress: CGFloat {
        let answeredCount = answers.filter { $0 >= 0 }.count
        return CGFloat(answeredCount) / CGFloat(scale.questions.count)
    }
    
    // MARK: - Question Row (Matrix Layout)
    
    private func questionRow(for index: Int) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            Text("\(index + 1). \(scale.questions[index].text)")
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            HStack(spacing: AppTheme.Spacing.sm) {
                ForEach(0..<options.count, id: \.self) { optionIndex in
                    OptionButton(
                        title: options[optionIndex],
                        isSelected: answers[index] == optionIndex
                    ) {
                        answers[index] = optionIndex
                    }
                }
            }
        }
        .cardStyle()
    }
    
    // MARK: - Bottom Buttons
    
    private var bottomButtons: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            if currentPage > 0 {
                Button {
                    withAnimation {
                        currentPage -= 1
                    }
                } label: {
                    Text("上一页")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
            
            if currentPage < totalPages - 1 {
                Button {
                    withAnimation {
                        currentPage += 1
                    }
                } label: {
                    Text("下一页")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(!isCurrentPageComplete)
            } else {
                Button {
                    submitAssessment()
                } label: {
                    Text("提交")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(!isComplete)
            }
        }
        .padding(AppTheme.Spacing.md)
        .background(AppTheme.Colors.backgroundCard)
    }
    
    private var isCurrentPageComplete: Bool {
        let start = currentPage * questionsPerPage
        let end = min(start + questionsPerPage, scale.questions.count)
        return answers[start..<end].allSatisfy { $0 >= 0 }
    }
    
    private var isComplete: Bool {
        answers.allSatisfy { $0 >= 0 }
    }
    
    private func submitAssessment() {
        let score = answers.reduce(0, +)
        let maxScore = scale.questions.count * 3
        let severity = calculateSeverity(score: score, scale: scale)
        
        let result = AssessmentResult(
            id: UUID().uuidString,
            scale: scale,
            score: score,
            maxScore: maxScore,
            severity: severity,
            date: Date()
        )
        
        onComplete(result)
    }
    
    private func calculateSeverity(score: Int, scale: ClinicalScale) -> String {
        switch scale {
        case .gad7:
            switch score {
            case 0...4: return "正常"
            case 5...9: return "轻度"
            case 10...14: return "中度"
            default: return "重度"
            }
        case .phq9:
            switch score {
            case 0...4: return "正常"
            case 5...9: return "轻度"
            case 10...14: return "中度"
            case 15...19: return "中重度"
            default: return "重度"
            }
        case .isi:
            switch score {
            case 0...7: return "正常"
            case 8...14: return "轻度"
            case 15...21: return "中度"
            default: return "重度"
            }
        }
    }
}

// MARK: - Option Button

struct OptionButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Circle()
                    .stroke(isSelected ? AppTheme.Colors.primary : AppTheme.Colors.textTertiary, lineWidth: 2)
                    .background(
                        Circle()
                            .fill(isSelected ? AppTheme.Colors.primary : Color.clear)
                    )
                    .frame(width: 24, height: 24)
                
                Text(title)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(isSelected ? AppTheme.Colors.primary : AppTheme.Colors.textSecondary)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

struct ScaleAssessmentView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    ScaleAssessmentView(scale: .gad7) { _ in }
    }
}
