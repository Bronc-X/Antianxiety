//
//  HomeView.swift
//  antios
//
//  首页视图
//

import SwiftUI

struct HomeView: View {
    @ObservedObject private var supabase = SupabaseManager.shared
    @State private var dailySummary = HomeDailySummary()
    @State private var activePlanRows: [PlanItemRowModel] = []
    @State private var nudges: [BayesianAnalyticsService.BehavioralNudge] = []
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // 问候
                    greetingSection
                    
                    // 今日状态
                    todayStatusSection
                    
                    // 快速操作
                    quickActionsSection
                    
                    // 活跃方案
                    activePlanSection

                    if !nudges.isEmpty {
                        nudgeSection
                    }
                }
                .padding(AppTheme.Spacing.md)
                .padding(.bottom, 24)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle("首页")
            .navigationBarTitleDisplayMode(.large)
        }
        .onAppear {
            reloadDashboard()
        }
        .onReceive(NotificationCenter.default.publisher(for: .calibrationDidUpdate)) { _ in
            reloadDashboard()
        }
    }
    
    // MARK: - Greeting
    
    private var greetingSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                Text(greeting)
                    .font(AppTheme.Typography.title2)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Text(supabase.currentUser?.name ?? "用户")
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.primaryGradient)
            }
            
            Spacer()
            
            Image(systemName: "person.circle.fill")
                .font(.system(size: 44))
                .foregroundColor(AppTheme.Colors.primary)
        }
    }
    
    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "早上好"
        case 12..<18: return "下午好"
        default: return "晚上好"
        }
    }
    
    // MARK: - Today Status
    
    private var todayStatusSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("今日状态")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            HStack(spacing: AppTheme.Spacing.md) {
                StatusCard(icon: "moon.fill", title: "睡眠", value: dailySummary.sleepText, color: .blue)
                StatusCard(icon: "bolt.fill", title: "能量", value: dailySummary.energyText, color: .orange)
                StatusCard(icon: "heart.fill", title: "压力", value: dailySummary.stressText, color: .red)
            }
        }
    }
    
    // MARK: - Quick Actions
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("快速操作")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppTheme.Spacing.md) {
                NavigationLink {
                    DailyCalibrationView()
                } label: {
                    QuickActionCard(icon: "waveform.path.ecg", title: "每日校准", color: AppTheme.Colors.primary)
                }
                .buttonStyle(.plain)

                NavigationLink {
                    ChatView()
                } label: {
                    QuickActionCard(icon: "bubble.left.and.bubble.right.fill", title: "和 Max 聊聊", color: AppTheme.Colors.secondary)
                }
                .buttonStyle(.plain)

                NavigationLink {
                    ClinicalScalesView()
                } label: {
                    QuickActionCard(icon: "list.clipboard", title: "临床评估", color: AppTheme.Colors.info)
                }
                .buttonStyle(.plain)

                NavigationLink {
                    CuratedFeedView()
                } label: {
                    QuickActionCard(icon: "book.fill", title: "科学期刊", color: .green)
                }
                .buttonStyle(.plain)
            }
        }
    }
    
    // MARK: - Active Plan
    
    private var activePlanSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            HStack {
                Text("活跃方案")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Spacer()
                
                Text("查看全部")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.primary)
            }
            
            VStack(spacing: AppTheme.Spacing.sm) {
                if activePlanRows.isEmpty {
                    Text("暂无活跃方案，点击「快速生成方案」开始。")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                } else {
                    ForEach(activePlanRows.prefix(3)) { plan in
                        PlanItemRow(title: plan.title, isCompleted: plan.isCompleted)
                    }
                }
            }
            .cardStyle()
        }
    }

    private var nudgeSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("今日提醒")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)

            ForEach(nudges.prefix(2), id: \.id) { nudge in
                HStack(alignment: .top, spacing: AppTheme.Spacing.sm) {
                    Image(systemName: "lightbulb.fill")
                        .foregroundColor(AppTheme.Colors.warning)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(nudge.title)
                            .font(AppTheme.Typography.subheadline)
                            .foregroundColor(AppTheme.Colors.textPrimary)
                        Text(nudge.message)
                            .font(AppTheme.Typography.caption)
                            .foregroundColor(AppTheme.Colors.textSecondary)
                    }
                }
                .cardStyle()
            }
        }
    }

    private func reloadDashboard() {
        let snapshots = loadCalibrationHistory()
        let latest = snapshots.last
        let activeItems = loadActivePlans()
        activePlanRows = activeItems.map { PlanItemRowModel(title: $0.title, isCompleted: $0.isCompleted) }

        let sleepHours = latest?.sleepHours ?? 0
        let stressLevel = latest?.stressLevel ?? 5
        let energyLevel = latest?.energyLevel ?? "一般"
        dailySummary = HomeDailySummary(
            sleepText: sleepHours > 0 ? "\(sleepHours)h" : "--",
            energyText: energyLevel,
            stressText: "\(stressLevel)/10"
        )

        let completion = activeItems.isEmpty
            ? nil
            : Double(activeItems.filter(\.isCompleted).count) / Double(activeItems.count)

        nudges = BayesianAnalyticsService.shared.generateNudges(
            sleepData: latest.map {
                SleepData(
                    date: $0.date,
                    totalHours: Double($0.sleepHours ?? 0),
                    deepSleepHours: 0,
                    remSleepHours: 0
                )
            },
            stressLevel: latest?.stressLevel,
            lastCalibration: latest?.date,
            planCompletion: completion
        )

        if let completion {
            UserDefaults.standard.set(completion, forKey: "antios_plan_completion_cache")
        }
    }

    private func loadActivePlans() -> [PlanItem] {
        guard let data = UserDefaults.standard.data(forKey: "antios_plan_active_items") else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return (try? decoder.decode([PlanItem].self, from: data)) ?? []
    }

    private func loadCalibrationHistory() -> [CalibrationHistoryRecord] {
        guard let data = UserDefaults.standard.data(forKey: "antios_calibration_history") else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return (try? decoder.decode([CalibrationHistoryRecord].self, from: data)) ?? []
    }
}

// MARK: - Status Card

struct StatusCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            Text(title)
                .font(AppTheme.Typography.caption)
                .foregroundColor(AppTheme.Colors.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.md)
        .background(AppTheme.Colors.backgroundCard)
        .cornerRadius(AppTheme.CornerRadius.md)
    }
}

// MARK: - Quick Action Card

struct QuickActionCard: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(color)
            
            Text(title)
                .font(AppTheme.Typography.subheadline)
                .foregroundColor(AppTheme.Colors.textPrimary)
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.lg)
        .background(AppTheme.Colors.backgroundCard)
        .cornerRadius(AppTheme.CornerRadius.lg)
    }
}

// MARK: - Plan Item Row

struct PlanItemRow: View {
    let title: String
    let isCompleted: Bool
    
    var body: some View {
        HStack {
            Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundColor(isCompleted ? AppTheme.Colors.success : AppTheme.Colors.textTertiary)
            
            Text(title)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textPrimary)
                .strikethrough(isCompleted)
            
            Spacer()
        }
    }
}

struct HomeView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    HomeView()
    }
}

private struct HomeDailySummary {
    var sleepText: String = "--"
    var energyText: String = "--"
    var stressText: String = "--"
}

private struct PlanItemRowModel: Identifiable {
    let id = UUID()
    let title: String
    let isCompleted: Bool
}
