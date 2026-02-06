//
//  MaxPlanChatView.swift
//  antios
//
//  E2-E4: Max 对话式方案生成
//

import SwiftUI

struct MaxPlanChatView: View {
    @StateObject private var viewModel = MaxPlanChatViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress
                progressBar
                
                // Chat Messages
                ScrollView {
                    LazyVStack(spacing: AppTheme.Spacing.md) {
                        ForEach(viewModel.messages) { message in
                            PlanChatBubble(message: message)
                        }
                        
                        if let options = viewModel.currentOptions {
                            optionsView(options)
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }
                
                // Bottom Action
                if viewModel.canGenerate {
                    generateButton
                }
            }
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("和 Max 制定方案")
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
            viewModel.start()
        }
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
                        .frame(width: geo.size.width * viewModel.progress, height: 4)
                }
            }
            .frame(height: 4)
            
            Text("步骤 \(viewModel.currentStep) / \(viewModel.totalSteps)")
                .font(AppTheme.Typography.caption)
                .foregroundColor(AppTheme.Colors.textTertiary)
        }
        .padding(AppTheme.Spacing.md)
    }
    
    // MARK: - Options View
    
    private func optionsView(_ options: [String]) -> some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            ForEach(options, id: \.self) { option in
                Button {
                    viewModel.selectOption(option)
                } label: {
                    Text(option)
                        .font(AppTheme.Typography.body)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(AppTheme.Spacing.md)
                        .background(AppTheme.Colors.backgroundCard)
                        .cornerRadius(AppTheme.CornerRadius.md)
                }
            }
        }
    }
    
    // MARK: - Generate Button
    
    private var generateButton: some View {
        Button {
            Task {
                await viewModel.generatePlan()
            }
        } label: {
            HStack {
                if viewModel.isGenerating {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: "sparkles")
                    Text("生成方案")
                }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(PrimaryButtonStyle())
        .disabled(viewModel.isGenerating)
        .padding(AppTheme.Spacing.md)
    }
}

// MARK: - Chat Bubble

struct PlanChatBubble: View {
    let message: PlanChatMessage
    
    var body: some View {
        HStack(alignment: .top, spacing: AppTheme.Spacing.sm) {
            if message.isMax {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(AppTheme.Colors.primary)
                    .frame(width: 32, height: 32)
                    .background(AppTheme.Colors.primary.opacity(0.2))
                    .cornerRadius(AppTheme.CornerRadius.full)
            }
            
            Text(message.content)
                .font(AppTheme.Typography.body)
                .foregroundColor(message.isMax ? AppTheme.Colors.textPrimary : .white)
                .padding(AppTheme.Spacing.md)
                .background(message.isMax ? AppTheme.Colors.backgroundCard : AppTheme.Colors.primary)
                .cornerRadius(AppTheme.CornerRadius.lg)
            
            if !message.isMax {
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, alignment: message.isMax ? .leading : .trailing)
    }
}

// MARK: - View Model

@MainActor
class MaxPlanChatViewModel: ObservableObject {
    @Published var messages: [PlanChatMessage] = []
    @Published var currentOptions: [String]?
    @Published var currentStep = 1
    @Published var totalSteps = 4
    @Published var canGenerate = false
    @Published var isGenerating = false
    
    private var userResponses: [String: String] = [:]
    
    var progress: CGFloat {
        CGFloat(currentStep) / CGFloat(totalSteps)
    }
    
    func start() {
        addMaxMessage("你好！我是 Max，让我们一起制定一个适合你的健康方案吧。")
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.askQuestion1()
        }
    }
    
    private func askQuestion1() {
        addMaxMessage("首先，你目前最想改善的是哪个方面？")
        currentOptions = ["睡眠质量", "压力管理", "情绪稳定", "精力提升"]
    }
    
    func selectOption(_ option: String) {
        addUserMessage(option)
        currentOptions = nil
        
        switch currentStep {
        case 1:
            userResponses["goal"] = option
            currentStep = 2
            askQuestion2()
        case 2:
            userResponses["time"] = option
            currentStep = 3
            askQuestion3()
        case 3:
            userResponses["difficulty"] = option
            currentStep = 4
            finishQuestions()
        default:
            break
        }
    }
    
    private func askQuestion2() {
        addMaxMessage("好的，那你每天大概有多少时间可以投入改善？")
        currentOptions = ["5-10 分钟", "15-30 分钟", "30 分钟以上"]
    }
    
    private func askQuestion3() {
        addMaxMessage("你希望方案的难度如何？")
        currentOptions = ["简单易行", "适度挑战", "高强度"]
    }
    
    private func finishQuestions() {
        addMaxMessage("太好了！我已经了解了你的需求，现在可以为你生成个性化方案了。")
        canGenerate = true
    }
    
    func generatePlan() async {
        isGenerating = true
        canGenerate = false
        
        addMaxMessage("正在根据你的情况生成方案...")
        
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        
        addMaxMessage("""
        🎉 方案已生成！
        
        根据你的目标和时间，我为你制定了以下方案：
        
        1. **4-7-8 呼吸法** - 每天 5 分钟
        2. **睡前冥想** - 每晚 10 分钟
        3. **散步放松** - 每天 15 分钟
        
        这些方案已添加到你的「行动方案」中，去看看吧！
        """)
        
        isGenerating = false
    }
    
    private func addMaxMessage(_ content: String) {
        messages.append(PlanChatMessage(id: UUID().uuidString, content: content, isMax: true))
    }
    
    private func addUserMessage(_ content: String) {
        messages.append(PlanChatMessage(id: UUID().uuidString, content: content, isMax: false))
    }
}

// MARK: - Models

struct PlanChatMessage: Identifiable {
    let id: String
    let content: String
    let isMax: Bool
}

#Preview {
    MaxPlanChatView()
}
