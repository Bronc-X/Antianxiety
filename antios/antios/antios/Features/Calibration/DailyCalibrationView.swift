//
//  DailyCalibrationView.swift
//  antios
//
//  C1-C3: 每日校准视图 - 锚定问题 + 自适应 + 7日进化
//

import SwiftUI

struct DailyCalibrationView: View {
    @StateObject private var viewModel = DailyCalibrationViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.Colors.backgroundDark.ignoresSafeArea()
                
                if viewModel.isComplete {
                    completionView
                } else {
                    calibrationContent
                }
            }
            .navigationTitle("每日校准")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if !viewModel.isComplete {
                        Button("取消") {
                            dismiss()
                        }
                    }
                }
            }
        }
        .onAppear {
            viewModel.loadQuestions()
        }
    }
    
    // MARK: - Calibration Content
    
    private var calibrationContent: some View {
        VStack(spacing: 0) {
            // Progress
            progressSection
            
            // Question
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    if let question = viewModel.currentQuestion {
                        questionCard(question)
                    }
                }
                .padding(AppTheme.Spacing.md)
            }
            
            // Navigation
            navigationButtons
        }
    }
    
    // MARK: - Progress Section
    
    private var progressSection: some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            HStack {
                ForEach(0..<viewModel.totalQuestions, id: \.self) { index in
                    Circle()
                        .fill(index < viewModel.currentIndex ? AppTheme.Colors.success :
                              index == viewModel.currentIndex ? AppTheme.Colors.primary :
                              AppTheme.Colors.backgroundCard)
                        .frame(width: 10, height: 10)
                }
            }
            
            if viewModel.evolutionLevel > 0 {
                HStack {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                    
                    Text("进化等级 \(viewModel.evolutionLevel)")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
            }
        }
        .padding(AppTheme.Spacing.md)
    }
    
    // MARK: - Question Card
    
    private func questionCard(_ question: CalibrationQuestion) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.lg) {
            // Question Type Badge
            HStack {
                Text(question.type.displayName)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(question.type.color)
                    .cornerRadius(AppTheme.CornerRadius.sm)
                
                Spacer()
            }
            
            // Question Text
            Text(question.text)
                .font(AppTheme.Typography.title3)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            // Options or Slider
            if question.type == .numeric {
                numericInput(for: question)
            } else {
                optionsInput(for: question)
            }
        }
        .cardStyle()
    }
    
    private func numericInput(for question: CalibrationQuestion) -> some View {
        VStack(spacing: AppTheme.Spacing.md) {
            HStack {
                Text(question.minLabel ?? "0")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
                
                Slider(
                    value: Binding(
                        get: { Double(viewModel.answers[question.id] ?? 5) },
                        set: { viewModel.answers[question.id] = Int($0) }
                    ),
                    in: Double(question.minValue ?? 0)...Double(question.maxValue ?? 10),
                    step: 1
                )
                .tint(AppTheme.Colors.primary)
                
                Text(question.maxLabel ?? "10")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            
            Text("\(viewModel.answers[question.id] ?? 5)")
                .font(AppTheme.Typography.title)
                .foregroundColor(AppTheme.Colors.primary)
        }
    }
    
    private func optionsInput(for question: CalibrationQuestion) -> some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            ForEach(question.options ?? [], id: \.self) { option in
                Button {
                    viewModel.answers[question.id] = question.options?.firstIndex(of: option) ?? 0
                } label: {
                    HStack {
                        Text(option)
                            .font(AppTheme.Typography.body)
                            .foregroundColor(AppTheme.Colors.textPrimary)
                        
                        Spacer()
                        
                        if viewModel.answers[question.id] == question.options?.firstIndex(of: option) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(AppTheme.Colors.success)
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                    .background(
                        viewModel.answers[question.id] == question.options?.firstIndex(of: option)
                            ? AppTheme.Colors.primary.opacity(0.2)
                            : AppTheme.Colors.backgroundElevated
                    )
                    .cornerRadius(AppTheme.CornerRadius.md)
                }
            }
        }
    }
    
    // MARK: - Navigation
    
    private var navigationButtons: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            if viewModel.currentIndex > 0 {
                Button {
                    viewModel.previousQuestion()
                } label: {
                    Text("上一题")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
            
            Button {
                if viewModel.currentIndex == viewModel.totalQuestions - 1 {
                    viewModel.submit()
                } else {
                    viewModel.nextQuestion()
                }
            } label: {
                Text(viewModel.currentIndex == viewModel.totalQuestions - 1 ? "完成" : "下一题")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(!viewModel.canProceed)
        }
        .padding(AppTheme.Spacing.md)
        .background(AppTheme.Colors.backgroundCard)
    }
    
    // MARK: - Completion View
    
    private var completionView: some View {
        VStack(spacing: AppTheme.Spacing.xl) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(AppTheme.Colors.success)
            
            Text("今日校准完成！")
                .font(AppTheme.Typography.title)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            if viewModel.consecutiveDays >= 7 {
                Text("🎉 连续打卡 \(viewModel.consecutiveDays) 天！")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.warning)
            }
            
            // Summary
            VStack(spacing: AppTheme.Spacing.md) {
                SummaryRow(icon: "moon.fill", title: "睡眠", value: "\(viewModel.summaryData.sleepHours ?? 7) 小时")
                SummaryRow(icon: "bolt.fill", title: "能量", value: viewModel.summaryData.energyLevel ?? "中等")
                SummaryRow(icon: "heart.fill", title: "压力", value: "\(viewModel.summaryData.stressLevel ?? 5) / 10")
            }
            .cardStyle()
            
            Button {
                dismiss()
            } label: {
                Text("返回首页")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(AppTheme.Spacing.lg)
    }
}

// MARK: - Summary Row

struct SummaryRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(AppTheme.Colors.primary)
            
            Text(title)
                .foregroundColor(AppTheme.Colors.textSecondary)
            
            Spacer()
            
            Text(value)
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
        }
    }
}

// MARK: - View Model

@MainActor
class DailyCalibrationViewModel: ObservableObject {
    @Published var questions: [CalibrationQuestion] = []
    @Published var currentIndex = 0
    @Published var answers: [String: Int] = [:]
    @Published var isComplete = false
    @Published var evolutionLevel = 0
    @Published var consecutiveDays = 0
    @Published var summaryData = CalibrationSummary()
    
    var currentQuestion: CalibrationQuestion? {
        guard currentIndex < questions.count else { return nil }
        return questions[currentIndex]
    }
    
    var totalQuestions: Int { questions.count }
    
    var canProceed: Bool {
        guard let question = currentQuestion else { return false }
        return answers[question.id] != nil
    }
    
    func loadQuestions() {
        consecutiveDays = UserDefaults.standard.integer(forKey: "consecutiveDays")
        evolutionLevel = calculateEvolutionLevel(days: consecutiveDays)
        
        // 锚定问题 (C1)
        var allQuestions: [CalibrationQuestion] = [
            CalibrationQuestion(id: "sleep", text: "昨晚睡了多少小时？", type: .numeric, minValue: 0, maxValue: 12, minLabel: "0h", maxLabel: "12h"),
            CalibrationQuestion(id: "quality", text: "睡眠质量如何？", type: .choice, options: ["很差", "较差", "一般", "良好", "很好"]),
            CalibrationQuestion(id: "stress", text: "当前压力水平", type: .numeric, minValue: 0, maxValue: 10, minLabel: "无压力", maxLabel: "极高")
        ]
        
        // 自适应问题 (C2)
        allQuestions.append(contentsOf: [
            CalibrationQuestion(id: "energy", text: "今天的能量水平", type: .choice, options: ["疲惫", "低落", "一般", "充沛", "爆棚"]),
            CalibrationQuestion(id: "mood", text: "整体心情如何？", type: .numeric, minValue: 1, maxValue: 10, minLabel: "😢", maxLabel: "😊")
        ])
        
        // 进化问题 (C3)
        if evolutionLevel > 0 {
            allQuestions.append(
                CalibrationQuestion(id: "evolution", text: "这周你有什么新的发现或成长？", type: .choice, options: ["建立了新习惯", "克服了一个挑战", "有了新的自我认知", "感觉更平静了", "其他"])
            )
        }
        
        questions = allQuestions
    }
    
    func nextQuestion() {
        if currentIndex < questions.count - 1 {
            currentIndex += 1
        }
    }
    
    func previousQuestion() {
        if currentIndex > 0 {
            currentIndex -= 1
        }
    }
    
    func submit() {
        summaryData = CalibrationSummary(
            sleepHours: answers["sleep"],
            stressLevel: answers["stress"],
            energyLevel: ["疲惫", "低落", "一般", "充沛", "爆棚"][safe: answers["energy"] ?? 2]
        )
        
        consecutiveDays += 1
        UserDefaults.standard.set(consecutiveDays, forKey: "consecutiveDays")
        
        isComplete = true
    }
    
    private func calculateEvolutionLevel(days: Int) -> Int {
        switch days {
        case 0..<7: return 0
        case 7..<14: return 1
        case 14..<21: return 2
        default: return 3
        }
    }
}

// MARK: - Models

struct CalibrationQuestion: Identifiable {
    let id: String
    let text: String
    let type: QuestionType
    var options: [String]?
    var minValue: Int?
    var maxValue: Int?
    var minLabel: String?
    var maxLabel: String?
}

enum QuestionType {
    case numeric
    case choice
    
    var displayName: String {
        switch self {
        case .numeric: return "滑块"
        case .choice: return "选择"
        }
    }
    
    var color: Color {
        switch self {
        case .numeric: return AppTheme.Colors.info
        case .choice: return AppTheme.Colors.secondary
        }
    }
}

struct CalibrationSummary {
    var sleepHours: Int?
    var stressLevel: Int?
    var energyLevel: String?
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

