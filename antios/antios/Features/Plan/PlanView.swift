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
            }
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("行动方案")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showMaxChat) {
                MaxPlanChatView()
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
    
    var completionRate: Int {
        guard !activePlans.isEmpty else { return 0 }
        let completed = activePlans.filter { $0.isCompleted }.count
        return Int(Double(completed) / Double(activePlans.count) * 100)
    }
    
    func loadPlans() {
        activePlans = [
            PlanItem(id: "1", title: "睡前冥想", action: "每晚睡前进行 10 分钟正念冥想", science: "冥想可降低皮质醇水平，促进入睡", difficulty: 1, category: "sleep", isCompleted: false),
            PlanItem(id: "2", title: "户外散步", action: "每天至少户外步行 20 分钟", science: "自然光照有助于调节褪黑素分泌", difficulty: 1, category: "exercise", isCompleted: true),
            PlanItem(id: "3", title: "限制咖啡因", action: "下午 2 点后避免咖啡因摄入", science: "咖啡因半衰期约 5-6 小时", difficulty: 2, category: "diet", isCompleted: false)
        ]
        
        historyPlans = [
            HistoryPlan(id: "h1", date: Date().addingTimeInterval(-86400 * 7), itemCount: 4, completionRate: 75),
            HistoryPlan(id: "h2", date: Date().addingTimeInterval(-86400 * 14), itemCount: 5, completionRate: 60)
        ]
    }
    
    func generateQuickPlan() async {
        isGenerating = true
        
        try? await Task.sleep(nanoseconds: 1_500_000_000)
        
        activePlans = [
            PlanItem(id: UUID().uuidString, title: "4-7-8 呼吸法", action: "吸气 4 秒，屏息 7 秒，呼气 8 秒", science: "激活副交感神经，快速镇静", difficulty: 1, category: "stress", isCompleted: false),
            PlanItem(id: UUID().uuidString, title: "睡眠日记", action: "每天记录入睡和起床时间", science: "自我监测有助于发现睡眠问题模式", difficulty: 1, category: "sleep", isCompleted: false),
            PlanItem(id: UUID().uuidString, title: "减少屏幕时间", action: "睡前 1 小时关闭电子设备", science: "蓝光抑制褪黑素分泌", difficulty: 2, category: "sleep", isCompleted: false)
        ]
        
        isGenerating = false
    }
    
    func toggleItemCompletion(_ item: PlanItem) {
        if let index = activePlans.firstIndex(where: { $0.id == item.id }) {
            activePlans[index].isCompleted.toggle()
        }
    }
    
    func replaceItem(_ item: PlanItem) async {
        let service = PlanReplaceService.shared
        let newItem = service.localReplace(item)
        
        if let index = activePlans.firstIndex(where: { $0.id == item.id }) {
            activePlans[index] = newItem
        }
    }
}

// MARK: - Models

struct PlanItem: Identifiable, Encodable {
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

struct HistoryPlan: Identifiable {
    let id: String
    let date: Date
    let itemCount: Int
    let completionRate: Int
}

#Preview {
    PlanView()
}
