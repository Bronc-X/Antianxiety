//
//  PlanView.swift
//  antios
//
//  E1-E4: 行动方案视图
//

import SwiftUI

struct PlanView: View {
    @StateObject private var viewModel = PlanViewModel()
    @State private var showMaxChat = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // 生成方案
                    generateSection
                    
                    // 活跃方案
                    if !viewModel.activePlans.isEmpty {
                        activePlanSection
                    }
                    
                    // 历史方案
                    if !viewModel.historyPlans.isEmpty {
                        historySection
                    }
                }
                .padding(AppTheme.Spacing.md)
                .padding(.bottom, 24)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle("行动方案")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showMaxChat) {
                MaxPlanChatView { generatedItems in
                    viewModel.applyGeneratedPlan(generatedItems)
                    showMaxChat = false
                }
            }
        }
        .onAppear {
            viewModel.loadPlans()
        }
    }
    
    // MARK: - Generate Section
    
    private var generateSection: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            Button {
                Task {
                    await viewModel.generateQuickPlan()
                }
            } label: {
                HStack {
                    Image(systemName: "bolt.fill")
                    Text("快速生成方案")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(PrimaryButtonStyle())
            .disabled(viewModel.isGenerating)
            
            Button {
                showMaxChat = true
            } label: {
                HStack {
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                    Text("和 Max 一起制定")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
    }
    
    // MARK: - Active Plan Section
    
    private var activePlanSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            HStack {
                Text("当前方案")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Spacer()
                
                Text("\(viewModel.completionRate)%")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.success)
            }
            
            ForEach(viewModel.activePlans) { item in
                PlanItemCard(item: item) {
                    viewModel.toggleItemCompletion(item)
                } onReplace: {
                    Task {
                        await viewModel.replaceItem(item)
                    }
                }
            }
        }
    }
    
    // MARK: - History Section
    
    private var historySection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("历史方案")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            ForEach(viewModel.historyPlans) { plan in
                HistoryPlanCard(plan: plan)
            }
        }
    }
}

// MARK: - Plan Item Card

struct PlanItemCard: View {
    let item: PlanItem
    let onToggle: () -> Void
    let onReplace: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            HStack {
                Button(action: onToggle) {
                    Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(item.isCompleted ? AppTheme.Colors.success : AppTheme.Colors.textTertiary)
                        .font(.title2)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(AppTheme.Typography.headline)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                        .strikethrough(item.isCompleted)
                    
                    Text(item.action)
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
                
                Spacer()
                
                // Difficulty
                HStack(spacing: 2) {
                    ForEach(0..<3) { i in
                        Image(systemName: "star.fill")
                            .font(.caption2)
                            .foregroundColor(i < item.difficulty ? AppTheme.Colors.warning : AppTheme.Colors.textTertiary.opacity(0.3))
                    }
                }
            }
            
            // Science
            HStack {
                Image(systemName: "lightbulb.fill")
                    .font(.caption)
                    .foregroundColor(AppTheme.Colors.info)
                
                Text(item.science)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            
            // Replace button (E3)
            if !item.isCompleted {
                Button {
                    onReplace()
                } label: {
                    HStack {
                        Image(systemName: "arrow.triangle.2.circlepath")
                        Text("换一个")
                    }
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.primary)
                }
            }
        }
        .cardStyle()
    }
}

// MARK: - History Plan Card

struct HistoryPlanCard: View {
    let plan: HistoryPlan
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(plan.date.formatted(date: .abbreviated, time: .omitted))
                    .font(AppTheme.Typography.subheadline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Text("\(plan.itemCount) 个项目")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            
            Spacer()
            
            Text("\(plan.completionRate)%")
                .font(AppTheme.Typography.headline)
                .foregroundColor(plan.completionRate >= 70 ? AppTheme.Colors.success : AppTheme.Colors.warning)
        }
        .cardStyle()
    }
}

// MARK: - View Model

@MainActor
class PlanViewModel: ObservableObject {
    @Published var activePlans: [PlanItem] = []
    @Published var historyPlans: [HistoryPlan] = []
    @Published var isGenerating = false
    @Published var errorMessage: String?

    private let activeStoreKey = "antios_plan_active_items"
    private let historyStoreKey = "antios_plan_history_items"
    private let lastGeneratedStoreKey = "antios_plan_last_generated_at"
    private let activePlanIdKey = "antios_active_plan_id"
    
    var completionRate: Int {
        guard !activePlans.isEmpty else { return 0 }
        let completed = activePlans.filter { $0.isCompleted }.count
        return Int(Double(completed) / Double(activePlans.count) * 100)
    }
    
    func loadPlans() {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        if let activeData = UserDefaults.standard.data(forKey: activeStoreKey),
           let savedActive = try? decoder.decode([PlanItem].self, from: activeData) {
            activePlans = savedActive
        }

        if let historyData = UserDefaults.standard.data(forKey: historyStoreKey),
           let savedHistory = try? decoder.decode([HistoryPlan].self, from: historyData) {
            historyPlans = savedHistory
        }

        if !activePlans.isEmpty && UserDefaults.standard.string(forKey: activePlanIdKey) == nil {
            UserDefaults.standard.set(defaultActivePlanId(), forKey: activePlanIdKey)
        }

        if activePlans.isEmpty {
            activePlans = buildQuickPlanCandidates()
            UserDefaults.standard.set(defaultActivePlanId(), forKey: activePlanIdKey)
            persist()
        }
    }
    
    func generateQuickPlan() async {
        isGenerating = true

        if !activePlans.isEmpty {
            archiveCurrentPlanSnapshot()
        }
        activePlans = buildQuickPlanCandidates()
        UserDefaults.standard.set(defaultActivePlanId(), forKey: activePlanIdKey)
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: lastGeneratedStoreKey)
        persist()
        isGenerating = false
    }
    
    func toggleItemCompletion(_ item: PlanItem) {
        if let index = activePlans.firstIndex(where: { $0.id == item.id }) {
            activePlans[index].isCompleted.toggle()
            persist()
            Task {
                await syncCompletionState()
            }
        }
    }
    
    func replaceItem(_ item: PlanItem) async {
        let service = PlanReplaceService.shared
        do {
            let newItem = try await service.replaceItem(item, userPreferences: clinicalGoals())
            if let index = activePlans.firstIndex(where: { $0.id == item.id }) {
                activePlans[index] = newItem
            }
            persist()
        } catch {
            let localItem = service.localReplace(item)
            if let index = activePlans.firstIndex(where: { $0.id == item.id }) {
                activePlans[index] = localItem
            }
            persist()
            errorMessage = error.localizedDescription
        }
    }

    func applyGeneratedPlan(_ items: [PlanItem]) {
        guard !items.isEmpty else { return }
        if !activePlans.isEmpty {
            archiveCurrentPlanSnapshot()
        }
        activePlans = items
        UserDefaults.standard.set(defaultActivePlanId(), forKey: activePlanIdKey)
        persist()
    }

    private func archiveCurrentPlanSnapshot() {
        guard !activePlans.isEmpty else { return }
        let completedCount = activePlans.filter(\.isCompleted).count
        let rate = Int((Double(completedCount) / Double(activePlans.count) * 100).rounded())
        historyPlans.insert(
            HistoryPlan(
                id: "history-\(Int(Date().timeIntervalSince1970))",
                date: Date(),
                itemCount: activePlans.count,
                completionRate: rate
            ),
            at: 0
        )
        if historyPlans.count > 20 {
            historyPlans = Array(historyPlans.prefix(20))
        }
    }

    private func buildQuickPlanCandidates() -> [PlanItem] {
        let goals = clinicalGoals()
        let sleepHours = UserDefaults.standard.double(forKey: "antios_clinical_sleep_hours")
        let stress = UserDefaults.standard.integer(forKey: "antios_clinical_stress_level")

        var pool: [PlanItem] = []

        if sleepHours > 0 && sleepHours < 7 || goals.contains("改善睡眠") {
            pool.append(
                PlanItem(
                    id: UUID().uuidString,
                    title: "固定睡前仪式",
                    action: "睡前 30 分钟关闭屏幕并进行 8 分钟呼吸放松",
                    science: "睡前减光和呼吸训练可缩短入睡潜伏期",
                    difficulty: 1,
                    category: "sleep",
                    isCompleted: false
                )
            )
        }

        if stress >= 6 || goals.contains("减轻焦虑") {
            pool.append(
                PlanItem(
                    id: UUID().uuidString,
                    title: "4-7-8 呼吸",
                    action: "上午和下午各 1 组，持续 3 分钟",
                    science: "通过延长呼气激活副交感神经，降低生理唤醒",
                    difficulty: 1,
                    category: "stress",
                    isCompleted: false
                )
            )
        }

        if goals.contains("提升精力") {
            pool.append(
                PlanItem(
                    id: UUID().uuidString,
                    title: "午后 15 分钟快走",
                    action: "14:00-17:00 任意时段完成一次中等强度快走",
                    science: "短时有氧可改善下午认知表现与主观能量",
                    difficulty: 1,
                    category: "exercise",
                    isCompleted: false
                )
            )
        }

        if goals.contains("稳定情绪") {
            pool.append(
                PlanItem(
                    id: UUID().uuidString,
                    title: "情绪标签记录",
                    action: "晚间记录 3 次情绪波动触发点和应对方式",
                    science: "情绪标记可降低杏仁核活动并提升调节能力",
                    difficulty: 2,
                    category: "mental",
                    isCompleted: false
                )
            )
        }

        let fallback = [
            PlanItem(
                id: UUID().uuidString,
                title: "减少晚间咖啡因",
                action: "14:00 后不饮用含咖啡因饮料",
                science: "咖啡因半衰期会影响夜间睡眠深度",
                difficulty: 2,
                category: "diet",
                isCompleted: false
            ),
            PlanItem(
                id: UUID().uuidString,
                title: "晨间日照 10 分钟",
                action: "起床后尽快接触自然光并做轻度拉伸",
                science: "晨光有助于稳定昼夜节律并改善夜间入睡",
                difficulty: 1,
                category: "sleep",
                isCompleted: false
            ),
            PlanItem(
                id: UUID().uuidString,
                title: "睡前冥想 8 分钟",
                action: "睡前使用正念引导音频完成一次冥想",
                science: "正念练习可降低焦虑相关反刍思维",
                difficulty: 1,
                category: "stress",
                isCompleted: false
            )
        ]

        let merged = (pool + fallback)
        let unique = Dictionary(grouping: merged, by: { $0.title }).compactMap { $0.value.first }
        return Array(unique.prefix(3))
    }

    private func clinicalGoals() -> [String] {
        (UserDefaults.standard.array(forKey: "antios_clinical_goals") as? [String]) ?? []
    }

    private func persist() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let activeData = try? encoder.encode(activePlans) {
            UserDefaults.standard.set(activeData, forKey: activeStoreKey)
        }
        if let historyData = try? encoder.encode(historyPlans) {
            UserDefaults.standard.set(historyData, forKey: historyStoreKey)
        }
    }

    private func syncCompletionState() async {
        struct CompleteItem: Encodable {
            let id: String
            let completed: Bool
            let text: String
        }

        struct CompleteRequest: Encodable {
            let planId: String
            let status: String
            let completedItems: [CompleteItem]
        }

        guard let planId = UserDefaults.standard.string(forKey: activePlanIdKey) else { return }
        let items = activePlans.map { CompleteItem(id: $0.id, completed: $0.isCompleted, text: $0.title) }
        let completedRate = completionRate
        let status = completedRate >= 100 ? "completed" : "partial"
        let request = CompleteRequest(planId: planId, status: status, completedItems: items)

        do {
            let _: EmptyResponse = try await APIClient.shared.request(
                endpoint: "plans/complete",
                method: .post,
                body: request
            )
        } catch {
            // Keep local state authoritative; backend sync is best-effort.
        }
    }

    private func defaultActivePlanId() -> String {
        "ios-plan-\(Int(Date().timeIntervalSince1970))"
    }
}

// MARK: - Models

struct PlanItem: Identifiable, Codable, Hashable {
    let id: String
    var title: String
    var action: String
    var science: String
    var difficulty: Int
    var category: String
    var isCompleted: Bool
}

struct PlanItemResponse: Decodable {
    let id: String
    let title: String
    let action: String
    let science: String
    let difficulty: Int
    let category: String
}

struct HistoryPlan: Identifiable, Codable {
    let id: String
    let date: Date
    let itemCount: Int
    let completionRate: Int
}

struct PlanView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    PlanView()
    }
}
