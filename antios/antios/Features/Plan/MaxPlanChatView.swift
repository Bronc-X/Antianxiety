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

    var onApplyPlan: ([PlanItem]) -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                progressBar

                ScrollView {
                    LazyVStack(spacing: AppTheme.Spacing.md) {
                        ForEach(viewModel.messages) { message in
                            PlanChatBubble(message: message)
                        }

                        if let options = viewModel.currentOptions {
                            optionsView(options)
                        }

                        if !viewModel.generatedPlanItems.isEmpty {
                            generatedPlanSection
                        }
                    }
                    .padding(AppTheme.Spacing.md)
                }

                if viewModel.canGenerate {
                    generateButton
                }
            }
            .background(AuroraBackground().ignoresSafeArea())
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

    private var generatedPlanSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("生成结果")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)

            ForEach(viewModel.generatedPlanItems) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    Text(item.action)
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
                .cardStyle()
            }

            Button {
                onApplyPlan(viewModel.generatedPlanItems)
                dismiss()
            } label: {
                Label("应用到行动方案", systemImage: "checkmark.seal.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(.top, AppTheme.Spacing.sm)
    }
}

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

@MainActor
class MaxPlanChatViewModel: ObservableObject {
    @Published var messages: [PlanChatMessage] = []
    @Published var currentOptions: [String]?
    @Published var currentStep = 1
    @Published var totalSteps = 4
    @Published var canGenerate = false
    @Published var isGenerating = false
    @Published var generatedPlanItems: [PlanItem] = []

    private var userResponses: [String: String] = [:]
    private var optionValueMap: [String: String] = [:]
    private var sessionId: String?
    private var usingServerFlow = false

    var progress: CGFloat {
        CGFloat(currentStep) / CGFloat(totalSteps)
    }

    func start() {
        Task {
            await startConversation()
        }
    }

    private func startConversation() async {
        do {
            let response = try await requestServer(
                action: "init",
                message: nil,
                sessionId: nil,
                questionId: nil
            )
            if response.messages?.isEmpty ?? true {
                usingServerFlow = false
                startLocalConversation()
                return
            }
            usingServerFlow = true
            sessionId = response.sessionId
            appendServerMessages(response.messages ?? [])
            if let options = response.messages?.last?.options {
                currentOptions = options.map(\.label)
                optionValueMap = Dictionary(uniqueKeysWithValues: options.map { ($0.label, $0.value) })
            }
            canGenerate = response.nextAction == "generate"
            return
        } catch {
            usingServerFlow = false
            startLocalConversation()
        }
    }

    private func startLocalConversation() {
        addMaxMessage("你好！我是 Max，让我们一起制定一个适合你的健康方案吧。")
        addMaxMessage("首先，你目前最想改善的是哪个方面？")
        currentOptions = ["睡眠质量", "压力管理", "情绪稳定", "精力提升"]
        optionValueMap = [:]
    }

    func selectOption(_ option: String) {
        addUserMessage(option)
        currentOptions = nil

        if usingServerFlow {
            Task {
                await respondServer(option)
            }
            return
        }
        respondLocal(option)
    }

    private func respondLocal(_ option: String) {
        switch currentStep {
        case 1:
            userResponses["goal"] = option
            currentStep = 2
            addMaxMessage("好的，那你每天大概有多少时间可以投入改善？")
            currentOptions = ["5-10 分钟", "15-30 分钟", "30 分钟以上"]
        case 2:
            userResponses["time"] = option
            currentStep = 3
            addMaxMessage("你希望方案的难度如何？")
            currentOptions = ["简单易行", "适度挑战", "高强度"]
        case 3:
            userResponses["difficulty"] = option
            currentStep = 4
            canGenerate = true
            addMaxMessage("太好了！我已经了解了你的需求，现在可以为你生成个性化方案了。")
        default:
            break
        }
    }

    private func respondServer(_ option: String) async {
        do {
            let response = try await requestServer(
                action: "respond",
                message: optionValueMap[option] ?? option,
                sessionId: sessionId,
                questionId: nil
            )
            appendServerMessages(response.messages ?? [])
            currentStep = min(totalSteps, currentStep + 1)
            canGenerate = response.nextAction == "generate"
            if let options = response.messages?.last?.options {
                currentOptions = options.map(\.label)
                optionValueMap = Dictionary(uniqueKeysWithValues: options.map { ($0.label, $0.value) })
            }
        } catch {
            usingServerFlow = false
            respondLocal(option)
        }
    }

    func generatePlan() async {
        isGenerating = true
        canGenerate = false

        if usingServerFlow {
            do {
                let response = try await requestServer(
                    action: "generate",
                    message: nil,
                    sessionId: sessionId,
                    questionId: nil
                )
                appendServerMessages(response.messages ?? [])
                generatedPlanItems = mapServerPlanItems(response.planItems ?? [])
                if generatedPlanItems.isEmpty {
                    generatedPlanItems = buildLocalPlanItems()
                }
                isGenerating = false
                return
            } catch {
                usingServerFlow = false
            }
        }

        addMaxMessage("正在根据你的情况生成方案...")
        try? await Task.sleep(nanoseconds: 600_000_000)
        generatedPlanItems = buildLocalPlanItems()
        addMaxMessage("方案已生成，确认后即可应用到行动方案。")
        isGenerating = false
    }

    private func buildLocalPlanItems() -> [PlanItem] {
        let goal = userResponses["goal"] ?? "压力管理"
        let time = userResponses["time"] ?? "15-30 分钟"
        let difficulty = userResponses["difficulty"] ?? "适度挑战"

        let baseDifficulty: Int
        switch difficulty {
        case "简单易行": baseDifficulty = 1
        case "高强度": baseDifficulty = 3
        default: baseDifficulty = 2
        }

        let durationHint = time.replacingOccurrences(of: " 分钟", with: "分钟")
        let pool: [PlanItem]
        switch goal {
        case "睡眠质量":
            pool = [
                PlanItem(id: UUID().uuidString, title: "睡前呼吸训练", action: "每晚执行 \(durationHint) 的呼吸放松", science: "降低睡前生理唤醒，改善入睡效率", difficulty: baseDifficulty, category: "sleep", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "固定上床时间", action: "连续 7 天固定同一上床时间", science: "稳定昼夜节律，提高深睡比例", difficulty: max(1, baseDifficulty - 1), category: "sleep", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "晚间减蓝光", action: "睡前 1 小时减少屏幕刺激", science: "减少褪黑素抑制，缩短入睡延迟", difficulty: baseDifficulty, category: "sleep", isCompleted: false)
            ]
        case "精力提升":
            pool = [
                PlanItem(id: UUID().uuidString, title: "午后快走", action: "下午完成 15 分钟快走", science: "短时中等强度活动可提升清醒度", difficulty: baseDifficulty, category: "exercise", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "晨间日照", action: "起床后 10 分钟自然光暴露", science: "提升白天觉醒与夜间睡眠质量", difficulty: 1, category: "sleep", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "补水提醒", action: "每天 6-8 次小剂量补水", science: "轻度脱水会降低认知和情绪稳定性", difficulty: 1, category: "diet", isCompleted: false)
            ]
        default:
            pool = [
                PlanItem(id: UUID().uuidString, title: "4-7-8 呼吸", action: "每天两次，每次 3 分钟", science: "通过呼吸节律快速降低交感激活", difficulty: 1, category: "stress", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "情绪触发记录", action: "记录 3 个触发点并写下应对策略", science: "提高觉察可降低反刍和回避行为", difficulty: baseDifficulty, category: "mental", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "晚间放松窗口", action: "睡前留出 20 分钟无干扰时间", science: "减少认知负荷，有助于自主神经恢复", difficulty: baseDifficulty, category: "stress", isCompleted: false)
            ]
        }
        return Array(pool.prefix(3))
    }

    private func mapServerPlanItems(_ serverItems: [ServerPlanItem]) -> [PlanItem] {
        serverItems.map { item in
            PlanItem(
                id: item.id ?? UUID().uuidString,
                title: item.title,
                action: item.action,
                science: item.rationale ?? "根据你的数据生成",
                difficulty: mapDifficulty(item.difficulty),
                category: mapCategory(item.category),
                isCompleted: false
            )
        }
    }

    private func mapDifficulty(_ value: String?) -> Int {
        switch value?.lowercased() {
        case "easy": return 1
        case "hard": return 3
        default: return 2
        }
    }

    private func mapCategory(_ value: String?) -> String {
        switch value?.lowercased() {
        case "fitness": return "exercise"
        case "nutrition": return "diet"
        case "mental": return "mental"
        case "habits": return "habits"
        case "sleep": return "sleep"
        default: return "stress"
        }
    }

    private func addMaxMessage(_ content: String) {
        messages.append(PlanChatMessage(id: UUID().uuidString, content: content, isMax: true))
    }

    private func addUserMessage(_ content: String) {
        messages.append(PlanChatMessage(id: UUID().uuidString, content: content, isMax: false))
    }

    private func appendServerMessages(_ serverMessages: [ServerMessage]) {
        serverMessages.forEach { message in
            addMaxMessage(message.content)
        }
    }

    private func requestServer(
        action: String,
        message: String?,
        sessionId: String?,
        questionId: String?
    ) async throws -> PlanChatResponse {
        try await APIClient.shared.request(
            endpoint: "max/plan-chat",
            method: .post,
            body: PlanChatRequest(
                action: action,
                message: message,
                sessionId: sessionId,
                questionId: questionId,
                language: Locale.current.language.languageCode?.identifier == "en" ? "en" : "zh"
            )
        )
    }
}

private struct PlanChatRequest: Encodable {
    let action: String
    let message: String?
    let sessionId: String?
    let questionId: String?
    let language: String?
}

private struct PlanChatResponse: Decodable {
    let success: Bool?
    let sessionId: String?
    let messages: [ServerMessage]?
    let planItems: [ServerPlanItem]?
    let nextAction: String?
}

private struct ServerMessage: Decodable {
    let id: String?
    let role: String?
    let content: String
    let options: [ServerOption]?
}

private struct ServerOption: Decodable {
    let label: String
    let value: String
}

private struct ServerPlanItem: Decodable {
    let id: String?
    let title: String
    let action: String
    let rationale: String?
    let difficulty: String?
    let category: String?
}

struct PlanChatMessage: Identifiable {
    let id: String
    let content: String
    let isMax: Bool
}

struct MaxPlanChatView_PreviewProvider: PreviewProvider {
    static var previews: some View {
        MaxPlanChatView { _ in }
    }
}
