// GoalsView.swift
// 目标视图 - Liquid Glass 风格

import SwiftUI

struct GoalsView: View {
    @StateObject private var viewModel = GoalsViewModel()
    @State private var showAddGoal = false
    @State private var showCompletedGoals = false
    @State private var digitalTwin: DigitalTwinAnalysis?
    @State private var isLoadingTwin = false
    @State private var twinError: String?
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 深渊背景
                AbyssBackground()
                
                ScrollView {
                    VStack(spacing: metrics.sectionSpacing) {
                        // ==========================================
                        // 目标统计卡片
                        // ==========================================
                        goalStatsCard
                        
                        // ==========================================
                        // 活跃目标
                        // ==========================================
                        digitalTwinGoalsSection
                        
                        if viewModel.activeGoals.isEmpty && !viewModel.isLoading {
                            emptyGoalsView
                        } else {
                            activeGoalsSection
                        }
                        
                        // ==========================================
                        // 已完成目标
                        // ==========================================
                        if !viewModel.completedGoals.isEmpty {
                            completedGoalsSection
                        }
                    }
                    .liquidGlassPageWidth()
                    .padding(.vertical, metrics.verticalPadding)
                }
                
                // 加载指示器
                if viewModel.isLoading && viewModel.goals.isEmpty {
                    ProgressView()
                        .scaleEffect(1.2)
                        .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
                }
            }
            .navigationTitle("目标")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        let impact = UIImpactFeedbackGenerator(style: .light)
                        impact.impactOccurred()
                        showAddGoal = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundColor(.liquidGlassAccent)
                    }
                }
            }
            .sheet(isPresented: $showAddGoal) {
                AddGoalSheet { input in
                    Task { await viewModel.create(input) }
                }
            }
            .refreshable {
                await viewModel.refresh()
                await loadDigitalTwin()
            }
        }
        .task {
            await viewModel.loadGoals()
            await loadDigitalTwin()
        }
    }
    
    // MARK: - 目标统计卡片
    
    private var goalStatsCard: some View {
        let statFontSize: CGFloat = metrics.isCompactWidth ? 22 : 28
        let dividerHeight: CGFloat = metrics.isCompactHeight ? 28 : 36
        return LiquidGlassCard(style: .elevated, padding: 16) {
            HStack(spacing: 8) {
                // 活跃目标
                VStack(spacing: 4) {
                    Text("\(viewModel.activeGoals.count)")
                        .font(.system(size: statFontSize, weight: .bold, design: .rounded))
                        .foregroundColor(.liquidGlassAccent)
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    Text("进行中")
                        .font(.caption2)
                        .foregroundColor(.textSecondary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity)
                
                Divider()
                    .background(Color.white.opacity(0.1))
                    .frame(height: dividerHeight)
                
                // 已完成目标
                VStack(spacing: 4) {
                    Text("\(viewModel.completedGoals.count)")
                        .font(.system(size: statFontSize, weight: .bold, design: .rounded))
                        .foregroundColor(.statusSuccess)
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    Text("已完成")
                        .font(.caption2)
                        .foregroundColor(.textSecondary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity)
                
                Divider()
                    .background(Color.white.opacity(0.1))
                    .frame(height: dividerHeight)
                
                // 完成率
                VStack(spacing: 4) {
                    let total = viewModel.goals.count
                    let completed = viewModel.completedGoals.count
                    let rate = total > 0 ? Int((Double(completed) / Double(total)) * 100) : 0
                    
                    Text("\(rate)%")
                        .font(.system(size: statFontSize, weight: .bold, design: .rounded))
                        .foregroundColor(.liquidGlassPurple)
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    Text("完成率")
                        .font(.caption2)
                        .foregroundColor(.textSecondary)
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity)
            }
        }
    }
    
    // MARK: - 空状态
    
    private var emptyGoalsView: some View {
        let iconSize: CGFloat = metrics.isCompactHeight ? 48 : 60
        return VStack(spacing: metrics.sectionSpacing) {
            Image(systemName: "target")
                .font(.system(size: iconSize))
                .foregroundColor(.textTertiary)
            
            VStack(spacing: 8) {
                Text("还没有目标")
                    .font(.title3.bold())
                    .foregroundColor(.white)
                
                Text("设定一个小目标，开始你的改变之旅")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            Button {
                showAddGoal = true
            } label: {
                Text("添加第一个目标")
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
        }
        .padding(.vertical, 40)
    }
    
    // MARK: - 活跃目标列表
    
    private var activeGoalsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "进行中", icon: "flame.fill")
            
            ForEach(viewModel.activeGoals) { goal in
                GoalCard(
                    goal: goal,
                    onToggle: {
                        Task { _ = await viewModel.toggle(goal.id) }
                    },
                    onDelete: {
                        Task { _ = await viewModel.remove(goal.id) }
                    }
                )
            }
        }
    }

    // MARK: - 数字孪生动态目标

    private var digitalTwinGoalsSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "brain.head.profile")
                        .foregroundColor(.liquidGlassAccent)
                    Text("AI 动态目标")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    if isLoadingTwin {
                        ProgressView()
                            .tint(.liquidGlassAccent)
                    }
                }

                if let error = twinError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                } else if let plan = digitalTwin?.adaptivePlan {
                    if let focus = plan.dailyFocus.first {
                        Text("今日重点：\(focus.action)")
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                    }

                    let focusItems = plan.dailyFocus.map { $0.action }
                    let activityItems = plan.activitySuggestions.map { $0.activity }
                    let sleepItems = plan.sleepRecommendations.map { $0.recommendation }
                    let combined = Array((focusItems + activityItems + sleepItems).prefix(3))

                    if !combined.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(combined, id: \.self) { goal in
                                HStack(spacing: 8) {
                                    Circle()
                                        .fill(Color.liquidGlassAccent)
                                        .frame(width: 6, height: 6)
                                    Text(goal)
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                }
                            }
                        }
                    } else {
                        Text("尚无动态目标，先完成一次评估或校准。")
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                    }
                } else {
                    Text("尚未生成数字孪生目标。")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }

                HStack {
                    Text(digitalTwinTimestampText)
                        .font(.caption2)
                        .foregroundColor(.textTertiary)
                    Spacer()
                    NavigationLink(destination: DigitalTwinView()) {
                        Text("查看数字孪生")
                            .font(.caption.bold())
                            .foregroundColor(.liquidGlassAccent)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.liquidGlassAccent.opacity(0.15))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var digitalTwinTimestampText: String {
        if let timestamp = digitalTwin?.createdAt {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let date = isoFormatter.date(from: timestamp) ?? ISO8601DateFormatter().date(from: timestamp)
            if let date {
                let formatter = DateFormatter()
                formatter.dateFormat = "MM/dd HH:mm"
                return "最近更新 \(formatter.string(from: date))"
            }
        }
        return "数字孪生未更新"
    }

    @MainActor
    private func loadDigitalTwin() async {
        isLoadingTwin = true
        twinError = nil
        defer { isLoadingTwin = false }

        do {
            digitalTwin = try await SupabaseManager.shared.getDigitalTwinAnalysis()
        } catch {
            twinError = error.localizedDescription
        }
    }
    
    // MARK: - 已完成目标列表
    
    private var completedGoalsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                withAnimation(.spring(response: 0.3)) {
                    showCompletedGoals.toggle()
                }
            } label: {
                HStack {
                    LiquidGlassSectionHeader(title: "已完成 (\(viewModel.completedGoals.count))", icon: "checkmark.circle.fill")
                    
                    Spacer()
                    
                    Image(systemName: showCompletedGoals ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }
            }
            .buttonStyle(.plain)
            
            if showCompletedGoals {
                ForEach(viewModel.completedGoals) { goal in
                    GoalCard(
                        goal: goal,
                        onToggle: {
                            Task { _ = await viewModel.toggle(goal.id) }
                        },
                        onDelete: {
                            Task { _ = await viewModel.remove(goal.id) }
                        }
                    )
                    .opacity(0.7)
                }
            }
        }
    }
}

// MARK: - Goal Card

struct GoalCard: View {
    let goal: PhaseGoal
    let onToggle: () -> Void
    let onDelete: () -> Void
    
    var categoryColor: Color {
        switch goal.category {
        case "health": return .statusSuccess
        case "mental": return .liquidGlassPurple
        case "social": return .liquidGlassAccent
        case "work": return .liquidGlassWarm
        default: return .textSecondary
        }
    }
    
    var categoryName: String {
        switch goal.category {
        case "health": return "健康"
        case "mental": return "心理"
        case "social": return "社交"
        case "work": return "工作"
        default: return "通用"
        }
    }
    
    var body: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            HStack(spacing: 14) {
                // 完成按钮
                Button(action: {
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                    onToggle()
                }) {
                    ZStack {
                        Circle()
                            .stroke(goal.isCompleted ? Color.statusSuccess : Color.white.opacity(0.3), lineWidth: 2)
                            .frame(width: 28, height: 28)
                        
                        if goal.isCompleted {
                            Circle()
                                .fill(Color.statusSuccess)
                                .frame(width: 28, height: 28)
                            
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                }
                
                // 目标内容
                VStack(alignment: .leading, spacing: 6) {
                    Text(goal.title)
                        .font(.subheadline.bold())
                        .foregroundColor(goal.isCompleted ? .textSecondary : .white)
                        .strikethrough(goal.isCompleted)
                    
                    if let description = goal.description, !description.isEmpty {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                            .lineLimit(2)
                    }
                    
                    HStack(spacing: 8) {
                        // 分类标签
                        Text(categoryName)
                            .font(.caption2.bold())
                            .foregroundColor(categoryColor)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(categoryColor.opacity(0.2))
                            .clipShape(Capsule())
                        
                        // 进度
                        if goal.progress > 0 && goal.progress < 100 {
                            Text("\(goal.progress)%")
                                .font(.caption2)
                                .foregroundColor(.textTertiary)
                        }
                    }
                }
                
                Spacer()
                
                // 删除按钮
                Button(action: {
                    let impact = UIImpactFeedbackGenerator(style: .medium)
                    impact.impactOccurred()
                    onDelete()
                }) {
                    Image(systemName: "trash")
                        .font(.system(size: 14))
                        .foregroundColor(.statusError.opacity(0.6))
                }
            }
        }
    }
}

// MARK: - Add Goal Sheet

struct AddGoalSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var description = ""
    @State private var category = "general"
    @Environment(\.screenMetrics) private var metrics
    
    let onAdd: (CreateGoalInput) -> Void
    
    let categories = [
        ("general", "通用", Color.textSecondary),
        ("health", "健康", Color.statusSuccess),
        ("mental", "心理", Color.liquidGlassPurple),
        ("social", "社交", Color.liquidGlassAccent),
        ("work", "工作", Color.liquidGlassWarm)
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.bgPrimary.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // 目标标题
                        VStack(alignment: .leading, spacing: 12) {
                            LiquidGlassSectionHeader(title: "目标内容", icon: "target")
                            
                            LiquidGlassCard(style: .standard, padding: 16) {
                                VStack(spacing: 16) {
                                    LiquidGlassTextField(placeholder: "我想要...", text: $title, icon: "star.fill")
                                    
                                    VStack(alignment: .leading, spacing: 8) {
                                        HStack(spacing: 8) {
                                            Image(systemName: "text.alignleft")
                                                .font(.system(size: 14))
                                                .foregroundColor(.textSecondary)
                                            Text("详细描述（可选）")
                                                .font(.caption)
                                                .foregroundColor(.textSecondary)
                                        }
                                        
                                        TextEditor(text: $description)
                                            .frame(minHeight: 60)
                                            .padding(12)
                                            .background(Color.bgSecondary.opacity(0.6))
                                            .clipShape(RoundedRectangle(cornerRadius: 14))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 14)
                                                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                            )
                                            .foregroundColor(.white)
                                            .scrollContentBackground(.hidden)
                                    }
                                }
                            }
                        }
                        
                        // 分类
                        VStack(alignment: .leading, spacing: 12) {
                            LiquidGlassSectionHeader(title: "分类", icon: "tag.fill")
                            
                            LiquidGlassCard(style: .standard, padding: 16) {
                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                    ForEach(categories, id: \.0) { cat in
                                        Button {
                                            let impact = UIImpactFeedbackGenerator(style: .light)
                                            impact.impactOccurred()
                                            category = cat.0
                                        } label: {
                                            HStack(spacing: 8) {
                                                Circle()
                                                    .fill(cat.2)
                                                    .frame(width: 8, height: 8)
                                                Text(cat.1)
                                                    .font(.subheadline)
                                            }
                                            .foregroundColor(category == cat.0 ? .bgPrimary : .textSecondary)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, 12)
                                            .background(
                                                category == cat.0
                                                    ? cat.2
                                                    : Color.white.opacity(0.05)
                                            )
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .liquidGlassPageWidth()
                    .padding(.vertical, metrics.verticalPadding)
                }
            }
            .navigationTitle("添加目标")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                    .foregroundColor(.liquidGlassAccent)
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("添加") {
                        let impact = UIImpactFeedbackGenerator(style: .medium)
                        impact.impactOccurred()
                        
                        let input = CreateGoalInput(
                            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                            description: description.isEmpty ? nil : description,
                            category: category,
                            target_date: nil
                        )
                        onAdd(input)
                        dismiss()
                    }
                    .font(.headline)
                    .foregroundColor(isFormValid ? .liquidGlassAccent : .textTertiary)
                    .disabled(!isFormValid)
                }
            }
            .toolbarBackground(Color.bgPrimary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }
    
    private var isFormValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

// MARK: - Preview

struct GoalsView_Previews: PreviewProvider {
    static var previews: some View {
        GoalsView()
            .preferredColorScheme(.dark)
    }
}
