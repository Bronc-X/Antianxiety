// PlansView.swift
// 计划视图 - 对齐 Web 端

import SwiftUI

struct PlansView: View {
  @StateObject private var viewModel = PlansViewModel()
  @State private var showAddPlan = false
  @Environment(\.screenMetrics) private var metrics
  @EnvironmentObject private var appSettings: AppSettings

  var body: some View {
    NavigationStack {
      ZStack {
        AuroraBackground()
            .ignoresSafeArea()

        if viewModel.plans.isEmpty && !viewModel.isLoading {
          ScrollView {
            VStack(spacing: metrics.sectionSpacing) {
              planHero
              journalEntry
              habitsEntry
              remindersEntry
              goalsEntry
              EmptyPlansView(onAdd: { showAddPlan = true })
            }
            .liquidGlassPageWidth()
            .padding(.vertical, metrics.verticalPadding)
          }
        } else {
          ScrollView {
            LazyVStack(spacing: metrics.isCompactHeight ? 12 : 16) {
              planHero
              journalEntry
              habitsEntry
              remindersEntry
              goalsEntry
              ForEach(viewModel.plans) { plan in
                NavigationLink(destination: PlanDetailView(viewModel: viewModel, plan: plan)) {
                  PlanDataCard(
                    plan: plan,
                    onToggleStatus: {
                      Task { await viewModel.togglePlan(planId: plan.id) }
                    },
                    onToggleItem: { item in
                      var updatedItems = plan.items
                      if let index = updatedItems.firstIndex(where: { $0.id == item.id }) {
                        updatedItems[index].completed.toggle()
                      }

                      let completedCount = updatedItems.filter { $0.completed }.count
                      let status: PlanCompletionStatus
                      if completedCount == updatedItems.count {
                        status = .completed
                      } else if completedCount > 0 {
                        status = .partial
                      } else {
                        status = .skipped
                      }

                      Task {
                        await viewModel.updateItems(planId: plan.id, items: updatedItems, status: status)
                      }
                    },
                    onPauseResume: {
                      Task {
                        if plan.status == .paused {
                          await viewModel.resumePlan(planId: plan.id)
                        } else {
                          await viewModel.pausePlan(planId: plan.id)
                        }
                      }
                    },
                    onArchive: {
                      Task { await viewModel.archivePlan(planId: plan.id) }
                    },
                    onDelete: {
                      Task { await viewModel.deletePlan(planId: plan.id) }
                    }
                  )
                }
                .buttonStyle(.plain)
              }
            }
            .liquidGlassPageWidth()
            .padding(.vertical, metrics.verticalPadding)
          }
        }

        if viewModel.isLoading {
          ProgressView()
            .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
        }
      }
      .navigationTitle("计划")
      .toolbar {
        ToolbarItem(placement: .navigationBarTrailing) {
          Button { showAddPlan = true } label: {
            Image(systemName: "plus")
          }
        }
      }
      .sheet(isPresented: $showAddPlan) {
        NavigationStack {
          PlanCreatorView(viewModel: viewModel)
        }
      }
      .refreshable {
        await viewModel.loadPlans()
      }
    }
    .task {
      await viewModel.loadPlans()
    }
  }

  private var journalEntry: some View {
    NavigationLink(destination: ScienceFeedView()) {
      LiquidGlassCard(style: .standard, padding: 16) {
        HStack(spacing: 12) {
          Image(systemName: "books.vertical.fill")
            .font(.system(size: metrics.iconSize))
            .foregroundColor(.liquidGlassAccent)
          VStack(alignment: .leading, spacing: 4) {
            Text("定制科学期刊")
              .font(.headline)
              .foregroundColor(.textPrimary)
            Text("精选研究与证据解读，支持你的计划执行")
              .font(.caption)
              .foregroundColor(.textSecondary)
          }
          Spacer()
          Image(systemName: "chevron.right")
            .font(.system(size: metrics.smallIconSize))
            .foregroundColor(.textTertiary)
        }
      }
    }
    .buttonStyle(.plain)
  }

  private var habitsEntry: some View {
    NavigationLink(destination: HabitsView()) {
      LiquidGlassCard(style: .standard, padding: 16) {
        HStack(spacing: 12) {
          Image(systemName: "checkmark.circle")
            .font(.system(size: metrics.iconSize))
            .foregroundColor(.statusSuccess)
          VStack(alignment: .leading, spacing: 4) {
            Text("习惯追踪")
              .font(.headline)
              .foregroundColor(.textPrimary)
            Text("记录每日关键动作")
              .font(.caption)
              .foregroundColor(.textSecondary)
          }
          Spacer()
          Image(systemName: "chevron.right")
            .font(.system(size: metrics.smallIconSize))
            .foregroundColor(.textTertiary)
        }
      }
    }
    .buttonStyle(.plain)
  }

  private var remindersEntry: some View {
    NavigationLink(destination: AiRemindersView()) {
      LiquidGlassCard(style: .standard, padding: 16) {
        HStack(spacing: 12) {
          Image(systemName: "bell.badge.fill")
            .font(.system(size: metrics.iconSize))
            .foregroundColor(.liquidGlassWarm)
          VStack(alignment: .leading, spacing: 4) {
            Text("AI 提醒")
              .font(.headline)
              .foregroundColor(.textPrimary)
            Text("定制化提醒触达")
              .font(.caption)
              .foregroundColor(.textSecondary)
          }
          Spacer()
          Image(systemName: "chevron.right")
            .font(.system(size: metrics.smallIconSize))
            .foregroundColor(.textTertiary)
        }
      }
    }
    .buttonStyle(.plain)
  }

  private var planHero: some View {
    let activeCount = viewModel.plans.filter { $0.status == .active }.count

    return LiquidGlassCard(style: .elevated, padding: 16) {
      VStack(alignment: .leading, spacing: 12) {
        HStack(spacing: 10) {
          Image(systemName: "sparkles")
            .font(.title3)
            .foregroundColor(.liquidGlassAccent)
          Text("AI 定制化计划")
            .font(.headline)
            .foregroundColor(.textPrimary)
          Spacer()
          if activeCount > 0 {
            StatusPill(text: "活跃 \(activeCount)", color: .statusSuccess)
          }
        }

        Text("让 Max 根据你的数字孪生生成可执行计划")
          .font(.caption)
          .foregroundColor(.textSecondary)

        ViewThatFits(in: .horizontal) {
          HStack(spacing: 10) {
            Button {
              Task {
                await viewModel.generatePersonalizedPlan(language: appSettings.language)
              }
            } label: {
              HStack(spacing: 8) {
                if viewModel.isGeneratingPlan {
                  ProgressView()
                    .tint(.white)
                }
                Text("让 Max 定制")
              }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .disabled(viewModel.isGeneratingPlan)

            Button {
              showAddPlan = true
            } label: {
              Text("手动新增")
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
          }

          VStack(spacing: 10) {
            Button {
              Task {
                await viewModel.generatePersonalizedPlan(language: appSettings.language)
              }
            } label: {
              HStack(spacing: 8) {
                if viewModel.isGeneratingPlan {
                  ProgressView()
                    .tint(.white)
                }
                Text("让 Max 定制")
              }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .disabled(viewModel.isGeneratingPlan)

            Button {
              showAddPlan = true
            } label: {
              Text("手动新增")
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
          }
        }
      }
    }
  }

  private var goalsEntry: some View {
    NavigationLink(destination: GoalsView()) {
      LiquidGlassCard(style: .standard, padding: 16) {
        HStack(spacing: 12) {
          Image(systemName: "target")
            .font(.system(size: metrics.iconSize))
            .foregroundColor(.liquidGlassAccent)
          VStack(alignment: .leading, spacing: 4) {
            Text("目标管理")
              .font(.headline)
              .foregroundColor(.textPrimary)
            Text("设定阶段性目标，保持进展可追溯")
              .font(.caption)
              .foregroundColor(.textSecondary)
          }
          Spacer()
          Image(systemName: "chevron.right")
            .font(.system(size: metrics.smallIconSize))
            .foregroundColor(.textTertiary)
        }
      }
    }
    .buttonStyle(.plain)
  }
}

// MARK: - Plan Data Card

struct PlanDataCard: View {
  let plan: PlanData
  let onToggleStatus: () -> Void
  let onToggleItem: (PlanItemData) -> Void
  let onPauseResume: () -> Void
  let onArchive: () -> Void
  let onDelete: () -> Void

  var isCompleted: Bool {
    plan.status == .completed
  }

  var categoryEnum: PlanCategory {
    PlanCategory(rawValue: plan.category) ?? .general
  }

  var body: some View {
    LiquidGlassCard(padding: 16) {
      VStack(alignment: .leading, spacing: 12) {
        HStack(spacing: 16) {
          Button { onToggleStatus() } label: {
            Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
              .font(.title2)
              .foregroundColor(isCompleted ? .statusSuccess : .textTertiary)
          }

          VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
              Text(plan.name)
                .font(.headline)
                .strikethrough(isCompleted)
                .foregroundColor(isCompleted ? .textSecondary : .textPrimary)

              if let difficulty = plan.difficulty {
                DifficultyBadge(difficulty: difficulty)
              }
            }

            if let desc = plan.description, !desc.isEmpty {
              Text(desc)
                .font(.caption)
                .foregroundColor(.textSecondary)
                .lineLimit(2)
            }

            HStack(spacing: 8) {
              CategoryBadge(category: categoryEnum)
              Text("\(plan.progress)%")
                .font(.caption2)
                .foregroundColor(.textSecondary)
            }
          }

          Spacer()

          Menu {
            Button { onPauseResume() } label: {
              Label(plan.status == .paused ? "继续" : "暂停", systemImage: "pause")
            }

            Button { onArchive() } label: {
              Label("归档", systemImage: "archivebox")
            }

            Button(role: .destructive) { onDelete() } label: {
              Label("删除", systemImage: "trash")
            }
          } label: {
            Image(systemName: "ellipsis")
              .foregroundColor(.textTertiary)
          }
        }

        if !plan.items.isEmpty {
          Divider().opacity(0.2)

          VStack(alignment: .leading, spacing: 8) {
            ForEach(plan.items.prefix(5)) { item in
              PlanItemRow(item: item, onToggle: { onToggleItem(item) })
            }

            if plan.items.count > 5 {
              Text("还有 \(plan.items.count - 5) 项")
                .font(.caption2)
                .foregroundColor(.textSecondary)
            }
          }
        }
      }
    }
  }
}

struct PlanItemRow: View {
  let item: PlanItemData
  let onToggle: () -> Void

  var body: some View {
    Button { onToggle() } label: {
      HStack(spacing: 8) {
        Image(systemName: item.completed ? "checkmark.circle.fill" : "circle")
          .foregroundColor(item.completed ? .statusSuccess : .textTertiary)
        Text(item.text)
          .font(.subheadline)
          .foregroundColor(item.completed ? .textSecondary : .textPrimary)
          .strikethrough(item.completed)
        Spacer()
      }
    }
    .buttonStyle(.plain)
  }
}

// MARK: - Badges

struct DifficultyBadge: View {
  let difficulty: String

  var body: some View {
    Text(label)
      .font(.caption2.bold())
      .padding(.horizontal, 6)
      .padding(.vertical, 2)
      .background(color.opacity(0.2))
      .foregroundColor(color)
      .clipShape(Capsule())
  }

  private var color: Color {
    switch difficulty {
    case "easy": return .statusSuccess
    case "medium": return .liquidGlassWarm
    case "hard": return .statusError
    default: return .textSecondary
    }
  }

  private var label: String {
    switch difficulty {
    case "easy": return "简单"
    case "medium": return "中等"
    case "hard": return "困难"
    default: return difficulty
    }
  }
}

struct CategoryBadge: View {
  let category: PlanCategory

  var body: some View {
    Text(category.name)
      .font(.caption2.bold())
      .padding(.horizontal, 8)
      .padding(.vertical, 4)
      .background(category.color.opacity(0.2))
      .foregroundColor(category.color)
      .clipShape(Capsule())
  }
}

// MARK: - Empty State

struct EmptyPlansView: View {
  let onAdd: () -> Void
  @Environment(\.screenMetrics) private var metrics

  var body: some View {
    let iconSize: CGFloat = metrics.isCompactHeight ? 48 : 60
    return VStack(spacing: metrics.sectionSpacing) {
      Image(systemName: "list.bullet.clipboard")
        .font(.system(size: iconSize))
        .foregroundColor(.textTertiary)

      VStack(spacing: 8) {
        Text("还没有计划")
          .font(.title2.bold())
          .foregroundColor(.textPrimary)
        Text("让 Max 帮你制定个性化的健康计划")
          .font(.subheadline)
          .foregroundColor(.textSecondary)
      }

      Button("添加计划") { onAdd() }
        .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
    }
  }
}

// MARK: - Add Plan Sheet

struct AddPlanSheet: View {
  @Environment(\.dismiss) private var dismiss
  @State private var title = ""
  @State private var description = ""
  @State private var category: PlanCategory = .general
  @State private var items: [String] = [""]
  @Environment(\.screenMetrics) private var metrics

  let onAdd: (String, String?, PlanCategory, [String]) -> Void

  var body: some View {
    NavigationStack {
      ZStack {
        // 深色背景
        Color.bgPrimary.ignoresSafeArea()
        
        ScrollView {
          VStack(spacing: 20) {
            // 计划详情
            VStack(alignment: .leading, spacing: 12) {
              LiquidGlassSectionHeader(title: "计划详情", icon: "doc.text.fill")
              
              LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 16) {
                  LiquidGlassTextField(placeholder: "计划标题", text: $title, icon: "pencil")
                  
                  VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                      Image(systemName: "text.alignleft")
                        .font(.system(size: 14))
                        .foregroundColor(.textSecondary)
                      Text("描述（可选）")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                    }
                    
                    TextEditor(text: $description)
                      .frame(minHeight: 80)
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
            
            // 步骤
            VStack(alignment: .leading, spacing: 12) {
              LiquidGlassSectionHeader(title: "步骤", icon: "list.number")
              
              LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 12) {
                  ForEach(items.indices, id: \.self) { index in
                    HStack(spacing: 12) {
                      ZStack {
                        Circle()
                          .fill(Color.liquidGlassAccent.opacity(0.2))
                          .frame(width: 28, height: 28)
                        Text("\(index + 1)")
                          .font(.caption.bold())
                          .foregroundColor(.liquidGlassAccent)
                      }
                      
                      TextField("步骤内容", text: $items[index])
                        .textFieldStyle(.plain)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.bgSecondary.opacity(0.6))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                          RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                        .foregroundColor(.white)
                      
                      if items.count > 1 {
                        Button {
                          let impact = UIImpactFeedbackGenerator(style: .light)
                          impact.impactOccurred()
                          items.remove(at: index)
                        } label: {
                          Image(systemName: "minus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.statusError.opacity(0.7))
                        }
                      }
                    }
                  }
                  
                  Button {
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                    items.append("")
                  } label: {
                    HStack(spacing: 8) {
                      Image(systemName: "plus.circle.fill")
                        .font(.system(size: 16))
                      Text("添加步骤")
                        .font(.subheadline)
                    }
                    .foregroundColor(.liquidGlassAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.liquidGlassAccent.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                      RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.liquidGlassAccent.opacity(0.3), lineWidth: 1)
                    )
                  }
                }
              }
            }
            
            // 分类
            VStack(alignment: .leading, spacing: 12) {
              LiquidGlassSectionHeader(title: "分类", icon: "tag.fill")
              
              LiquidGlassCard(style: .standard, padding: 16) {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                  ForEach(PlanCategory.allCases, id: \.self) { cat in
                    Button {
                      let impact = UIImpactFeedbackGenerator(style: .light)
                      impact.impactOccurred()
                      category = cat
                    } label: {
                      HStack(spacing: 8) {
                        Circle()
                          .fill(cat.color)
                          .frame(width: 8, height: 8)
                        Text(cat.name)
                          .font(.subheadline)
                      }
                      .foregroundColor(category == cat ? .bgPrimary : .textSecondary)
                      .frame(maxWidth: .infinity)
                      .padding(.vertical, 12)
                      .background(
                        category == cat
                          ? cat.color
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
      .navigationTitle("添加计划")
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
            let cleanedItems = items.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
              .filter { !$0.isEmpty }
            onAdd(title, description.isEmpty ? nil : description, category, cleanedItems)
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
    !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
      items.contains { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
  }
}

// MARK: - Plan Category

enum PlanCategory: String, CaseIterable {
  case general
  case exercise
  case diet
  case sleep
  case mental

  var name: String {
    switch self {
    case .general: return "通用"
    case .exercise: return "运动"
    case .diet: return "饮食"
    case .sleep: return "睡眠"
    case .mental: return "心理"
    }
  }

  var color: Color {
    switch self {
    case .general: return .gray
    case .exercise: return .liquidGlassPrimary
    case .diet: return .liquidGlassWarm
    case .sleep: return .indigo
    case .mental: return .purple
    }
  }
}

// MARK: - Preview

struct PlansView_Previews: PreviewProvider {
  static var previews: some View {
    PlansView()
      .preferredColorScheme(.dark)
      .environmentObject(AppSettings())
  }
}
