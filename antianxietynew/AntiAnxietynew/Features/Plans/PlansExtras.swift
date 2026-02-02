// PlansExtras.swift
// 计划扩展视图（详情/创建/习惯/提醒）

import SwiftUI

struct PlanDetailView: View {
    @ObservedObject var viewModel: PlansViewModel
    @State var plan: PlanData
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .elevated, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(plan.name)
                                .font(.headline)
                                .foregroundColor(.textPrimary)
                            if let description = plan.description {
                                Text(description)
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                            HStack {
                                StatusPill(text: plan.status.rawValue, color: plan.status == .active ? .statusSuccess : .textSecondary)
                                Spacer()
                                Text("进度 \(plan.progress)%")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("计划步骤")
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            ForEach(plan.items) { item in
                                Button {
                                    toggle(item)
                                } label: {
                                    HStack {
                                        Image(systemName: item.completed ? "checkmark.circle.fill" : "circle")
                                            .foregroundColor(item.completed ? .statusSuccess : .textTertiary)
                                        Text(item.text)
                                            .foregroundColor(.textPrimary)
                                        Spacer()
                                    }
                                    .padding(.vertical, 8)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("计划详情")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("执行清单")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("每完成一步即可更新进度")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func toggle(_ item: PlanItemData) {
        guard let index = plan.items.firstIndex(where: { $0.id == item.id }) else { return }
        plan.items[index].completed.toggle()

        let completedCount = plan.items.filter { $0.completed }.count
        let status: PlanCompletionStatus
        if completedCount == plan.items.count {
            status = .completed
        } else if completedCount > 0 {
            status = .partial
        } else {
            status = .skipped
        }

        Task {
            await viewModel.updateItems(planId: plan.id, items: plan.items, status: status)
        }
    }
}

struct PlanCreatorView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: PlansViewModel
    @State private var title = ""
    @State private var description = ""
    @State private var category: PlanCategory = .general
    @State private var items: [String] = [""]
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    LiquidGlassSectionHeader(title: "计划信息", icon: "doc.text.fill")

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(spacing: 16) {
                            LiquidGlassTextField(placeholder: "计划标题", text: $title, icon: "pencil")

                            TextEditor(text: $description)
                                .frame(minHeight: 80)
                                .padding(12)
                                .background(Color.bgSecondary.opacity(0.6))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.1), lineWidth: 1))
                                .foregroundColor(.white)
                                .scrollContentBackground(.hidden)

                            Picker("类型", selection: $category) {
                                ForEach(PlanCategory.allCases, id: \.self) { type in
                                    Text(type.name)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                    }

                    LiquidGlassSectionHeader(title: "执行步骤", icon: "list.number")

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(spacing: 12) {
                            ForEach(items.indices, id: \.self) { index in
                                HStack(spacing: 10) {
                                    Text("\(index + 1)")
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                        .frame(width: 22)

                                    TextField("步骤内容", text: $items[index])
                                        .textFieldStyle(.plain)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(Color.bgSecondary.opacity(0.6))
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                        .foregroundColor(.white)

                                    if items.count > 1 {
                                        Button {
                                            items.remove(at: index)
                                        } label: {
                                            Image(systemName: "minus.circle.fill")
                                                .foregroundColor(.statusError)
                                        }
                                    }
                                }
                            }

                            Button {
                                items.append("")
                            } label: {
                                HStack {
                                    Image(systemName: "plus.circle.fill")
                                    Text("新增步骤")
                                }
                                .foregroundColor(.liquidGlassAccent)
                            }
                        }
                    }

                    Button {
                        save()
                    } label: {
                        Text("创建计划")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("新建计划")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func save() {
        let cleanedItems = items.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        viewModel.addPlan(title, description: description.isEmpty ? nil : description, category: category, items: cleanedItems)
        dismiss()
    }
}

struct HabitsView: View {
    @Environment(\.screenMetrics) private var metrics
    @StateObject private var viewModel = HabitsViewModel()

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(spacing: 12) {
                            ForEach($viewModel.habits) { $habit in
                                Toggle(isOn: $habit.isCompleted) {
                                    Text(habit.title)
                                        .font(.subheadline)
                                        .foregroundColor(.textPrimary)
                                }
                                .toggleStyle(LiquidGlassToggleStyle())
                            }
                        }
                    }

                    Button {
                        viewModel.save()
                    } label: {
                        Text("保存今日习惯")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                    if let savedMessage = viewModel.statusMessage {
                        Text(savedMessage)
                            .font(.caption2)
                            .foregroundColor(.statusSuccess)
                    } else if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.caption2)
                            .foregroundColor(.statusError)
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("习惯追踪")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("记录关键习惯")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("保持每日微调回路")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

}

struct AiRemindersView: View {
    @Environment(\.screenMetrics) private var metrics
    @StateObject private var viewModel = AiRemindersViewModel()

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(spacing: 12) {
                            Toggle("晨间提醒", isOn: $viewModel.morningReminder)
                                .toggleStyle(LiquidGlassToggleStyle())
                            Toggle("晚间复盘", isOn: $viewModel.eveningReminder)
                                .toggleStyle(LiquidGlassToggleStyle())
                            Toggle("呼吸练习", isOn: $viewModel.breathingReminder)
                                .toggleStyle(LiquidGlassToggleStyle())
                        }
                    }

                    Button {
                        viewModel.save()
                    } label: {
                        Text("保存提醒")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                    if let statusMessage = viewModel.statusMessage {
                        Text(statusMessage)
                            .font(.caption2)
                            .foregroundColor(.statusSuccess)
                    } else if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.caption2)
                            .foregroundColor(.statusError)
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("AI 提醒")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("AI 定制提醒")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("确保关键动作按时完成")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

}

@MainActor
final class HabitsViewModel: ObservableObject {
    @Published var habits: [SupabaseManager.HabitStatus] = []
    @Published var statusMessage: String?
    @Published var errorMessage: String?
    @Published var isLoading = false

    private var initialCompletedIds: Set<String> = []
    private let supabase = SupabaseManager.shared

    func load() async {
        isLoading = true
        statusMessage = nil
        errorMessage = nil
        defer { isLoading = false }

        do {
            habits = try await supabase.getHabitsForToday()
            initialCompletedIds = Set(habits.filter { $0.isCompleted }.map { $0.id })
        } catch {
            errorMessage = "加载失败: \(error.localizedDescription)"
        }
    }

    func save() {
        Task { await saveHabits() }
    }

    private func saveHabits() async {
        statusMessage = nil
        errorMessage = nil

        let currentCompleted = Set(habits.filter { $0.isCompleted }.map { $0.id })
        let toAdd = currentCompleted.subtracting(initialCompletedIds)
        let toRemove = initialCompletedIds.subtracting(currentCompleted)

        do {
            for id in toAdd {
                try await supabase.setHabitCompletion(habitId: id, isCompleted: true)
            }
            for id in toRemove {
                try await supabase.setHabitCompletion(habitId: id, isCompleted: false)
            }
            initialCompletedIds = currentCompleted
            statusMessage = "已保存 \(Date().formatted(date: .abbreviated, time: .shortened))"
        } catch {
            errorMessage = "保存失败: \(error.localizedDescription)"
        }
    }
}

@MainActor
final class AiRemindersViewModel: ObservableObject {
    @Published var morningReminder = false
    @Published var eveningReminder = false
    @Published var breathingReminder = false
    @Published var statusMessage: String?
    @Published var errorMessage: String?
    @Published var isLoading = false

    private let supabase = SupabaseManager.shared

    func load() async {
        isLoading = true
        statusMessage = nil
        errorMessage = nil
        defer { isLoading = false }

        do {
            let prefs = try await supabase.getReminderPreferences()
            morningReminder = prefs.morning ?? false
            eveningReminder = prefs.evening ?? false
            breathingReminder = prefs.breathing ?? false
        } catch {
            errorMessage = "加载失败: \(error.localizedDescription)"
        }
    }

    func save() {
        Task { await savePreferences() }
    }

    private func savePreferences() async {
        statusMessage = nil
        errorMessage = nil

        let prefs = ReminderPreferences(
            morning: morningReminder,
            evening: eveningReminder,
            breathing: breathingReminder
        )

        do {
            _ = try await supabase.updateReminderPreferences(prefs)
            statusMessage = "提醒设置已保存"
        } catch {
            errorMessage = "保存失败: \(error.localizedDescription)"
        }
    }
}
