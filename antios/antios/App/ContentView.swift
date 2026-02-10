//
//  ContentView.swift
//  antios
//
//  Main shell migrated to antianxietynew Liquid Glass style.
//  Business pages still come from antios feature modules.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var selectedTab: Tab = .dashboard
    @State private var isBooting = true
    @State private var isCalibrationPresented = false
    @State private var isBreathingPresented = false
    @State private var breathingDurationMinutes = 5
    @AppStorage("antios_onboarding_complete") private var isOnboardingComplete = false
    @AppStorage("antios_clinical_complete") private var isClinicalComplete = false

    enum Tab: CaseIterable, Identifiable {
        case dashboard, report, max, plans, settings

        var id: Self { self }

        var icon: String {
            switch self {
            case .dashboard: return "house.fill"
            case .report: return "doc.text.magnifyingglass"
            case .max: return "bubble.left.and.bubble.right.fill"
            case .plans: return "list.bullet.clipboard.fill"
            case .settings: return "gearshape.fill"
            }
        }

        var title: String {
            switch self {
            case .dashboard: return "首页"
            case .report: return "报告"
            case .max: return "Max"
            case .plans: return "计划"
            case .settings: return "设置"
            }
        }
    }

    var body: some View {
        GeometryReader { proxy in
            let metrics = ScreenMetrics(size: proxy.size, safeAreaInsets: proxy.safeAreaInsets)

            Group {
                if isBooting {
                    launchView
                } else if !authManager.isAuthenticated {
                    AuthView()
                } else if !isClinicalComplete {
                    ClinicalOnboardingView(isComplete: $isClinicalComplete)
                } else if !isOnboardingComplete {
                    OnboardingFlowView(isComplete: $isOnboardingComplete)
                } else {
                    mainInterface
                }
            }
            .environment(\.screenMetrics, metrics)
            .animation(.easeInOut, value: isBooting)
            .animation(.easeInOut, value: authManager.isAuthenticated)
            .animation(.easeInOut, value: isClinicalComplete)
            .animation(.easeInOut, value: isOnboardingComplete)
            .onReceive(NotificationCenter.default.publisher(for: .openDashboard)) { _ in
                selectedTab = .dashboard
            }
            .onReceive(NotificationCenter.default.publisher(for: .openMaxChat)) { _ in
                selectedTab = .max
            }
            .onReceive(NotificationCenter.default.publisher(for: .startCalibration)) { _ in
                isCalibrationPresented = true
            }
            .onReceive(NotificationCenter.default.publisher(for: .startBreathing)) { notification in
                if let duration = notification.userInfo?["duration"] as? Int {
                    breathingDurationMinutes = max(1, duration)
                }
                isBreathingPresented = true
            }
            .fullScreenCover(isPresented: $isCalibrationPresented) {
                DailyCalibrationView()
            }
            .fullScreenCover(isPresented: $isBreathingPresented) {
                BreathingSessionView(durationMinutes: breathingDurationMinutes)
            }
            .task {
                if isBooting {
                    try? await Task.sleep(nanoseconds: 550_000_000)
                    isBooting = false
                }
            }
        }
        .ignoresSafeArea()
    }

    private var launchView: some View {
        ZStack {
            AuroraBackground()
            VStack(spacing: 20) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 58, weight: .semibold))
                    .foregroundColor(.liquidGlassAccent)
                ProgressView()
                    .tint(.white)
            }
        }
        .transition(.opacity)
    }

    private var mainInterface: some View {
        ZStack {
            AuroraBackground()
                .ignoresSafeArea()

            TabView(selection: $selectedTab) {
                DashboardView()
                    .tag(Tab.dashboard)
                    .tabItem {
                        Label(Tab.dashboard.title, systemImage: Tab.dashboard.icon)
                    }
                ReportView()
                    .tag(Tab.report)
                    .tabItem {
                        Label(Tab.report.title, systemImage: Tab.report.icon)
                    }
                MaxChatView()
                    .tag(Tab.max)
                    .tabItem {
                        Label(Tab.max.title, systemImage: Tab.max.icon)
                    }
                PlansView()
                    .tag(Tab.plans)
                    .tabItem {
                        Label(Tab.plans.title, systemImage: Tab.plans.icon)
                    }
                SettingsView()
                    .tag(Tab.settings)
                    .tabItem {
                        Label(Tab.settings.title, systemImage: Tab.settings.icon)
                    }
            }
            .toolbar(.hidden, for: .tabBar)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if selectedTab != .max {
                    CustomTabBar(tabs: Tab.allCases, selection: $selectedTab)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .transition(.opacity)
    }
}

private struct DashboardView: View {
    var body: some View { HomeView() }
}

private struct ReportView: View {
    var body: some View { ReportHubView() }
}

private struct MaxChatView: View {
    var body: some View { ChatView() }
}

private struct PlansView: View {
    var body: some View { PlanView() }
}

private struct SettingsView: View {
    var body: some View { ProfileView() }
}

private struct CustomTabBar: View {
    @Environment(\.screenMetrics) private var metrics
    let tabs: [ContentView.Tab]
    @Binding var selection: ContentView.Tab

    var body: some View {
        let itemHeight: CGFloat = metrics.isCompactHeight ? 52 : 58
        let topPadding: CGFloat = metrics.isCompactHeight ? 6 : 8
        let bottomPadding = max(10, metrics.safeAreaInsets.bottom)
        let sidePadding = metrics.tabBarHorizontalPadding
        let barWidth = metrics.tabBarWidth
        let totalHeight = itemHeight + topPadding + bottomPadding

        ZStack {
            Rectangle()
                .fill(.ultraThinMaterial)
                .overlay(
                    Rectangle()
                        .fill(Color.black.opacity(0.12))
                        .frame(height: 0.5),
                    alignment: .top
                )
                .background(Color.bgPrimary.opacity(0.95))
                .frame(width: barWidth, height: totalHeight)

            VStack(spacing: 0) {
                Color.clear.frame(height: topPadding)
                HStack(spacing: 0) {
                    ForEach(tabs, id: \.self) { tab in
                        tabButton(tab, itemHeight: itemHeight)
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.horizontal, sidePadding)
                .frame(width: barWidth, height: itemHeight)
                Color.clear.frame(height: bottomPadding)
            }
            .frame(width: barWidth, height: totalHeight)
        }
        .frame(width: metrics.fixedScreenWidth, height: totalHeight)
    }

    @ViewBuilder
    private func tabButton(_ tab: ContentView.Tab, itemHeight: CGFloat) -> some View {
        let isSelected = selection == tab

        Button {
            selection = tab
        } label: {
            VStack(spacing: 3) {
                Image(systemName: tab.icon)
                    .font(.system(size: 18, weight: .semibold))
                Text(tab.title)
                    .font(.system(size: 11, weight: isSelected ? .bold : .semibold))
            }
            .foregroundColor(isSelected ? .liquidGlassAccent : .textTertiary)
            .frame(maxWidth: .infinity, minHeight: itemHeight)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

private struct ReportHubView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.md) {
                    NavigationLink {
                        ClinicalScalesView()
                    } label: {
                        reportCard(
                            title: "临床评估",
                            subtitle: "量表评估与结果解读",
                            icon: "checklist",
                            color: .liquidGlassAccent
                        )
                    }

                    NavigationLink {
                        DigitalTwinView()
                    } label: {
                        reportCard(
                            title: "数字孪生",
                            subtitle: "未来趋势预测与影响因素",
                            icon: "waveform.path.ecg.rectangle",
                            color: .liquidGlassSecondary
                        )
                    }

                    NavigationLink {
                        WearablesView()
                    } label: {
                        reportCard(
                            title: "健康设备",
                            subtitle: "HealthKit 与穿戴数据同步",
                            icon: "applewatch",
                            color: .liquidGlassWarm
                        )
                    }

                    NavigationLink {
                        CuratedFeedView()
                    } label: {
                        reportCard(
                            title: "科学期刊",
                            subtitle: "个性化研究内容推荐",
                            icon: "book.closed.fill",
                            color: .statusSuccess
                        )
                    }
                }
                .padding(AppTheme.Spacing.md)
                .padding(.bottom, 24)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle("报告")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    private func reportCard(title: String, subtitle: String, icon: String, color: Color) -> some View {
        HStack(spacing: AppTheme.Spacing.md) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.2))
                .cornerRadius(AppTheme.CornerRadius.md)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                Text(subtitle)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textSecondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(AppTheme.Colors.textTertiary)
        }
        .cardStyle()
    }
}

private struct ClinicalOnboardingView: View {
    @Binding var isComplete: Bool
    @State private var selectedGoals: Set<String> = []
    @State private var sleepHours: Double = 7
    @State private var stressLevel: Double = 5

    private let goals = ["改善睡眠", "减轻焦虑", "提升精力", "稳定情绪"]

    var body: some View {
        ZStack {
            AuroraBackground().ignoresSafeArea()

            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    VStack(spacing: AppTheme.Spacing.sm) {
                        Image(systemName: "cross.case.fill")
                            .font(.system(size: 50, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.primaryGradient)
                        Text("临床信息采集")
                            .font(AppTheme.Typography.title2)
                            .foregroundColor(AppTheme.Colors.textPrimary)
                        Text("这将帮助我们生成更精准的健康建议")
                            .font(AppTheme.Typography.subheadline)
                            .foregroundColor(AppTheme.Colors.textSecondary)
                    }
                    .padding(.top, AppTheme.Spacing.xl)

                    VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                        Text("你最希望改善什么？")
                            .font(AppTheme.Typography.headline)
                            .foregroundColor(AppTheme.Colors.textPrimary)

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppTheme.Spacing.sm) {
                            ForEach(goals, id: \.self) { goal in
                                Button {
                                    if selectedGoals.contains(goal) {
                                        selectedGoals.remove(goal)
                                    } else {
                                        selectedGoals.insert(goal)
                                    }
                                } label: {
                                    Text(goal)
                                        .font(AppTheme.Typography.subheadline)
                                        .foregroundColor(selectedGoals.contains(goal) ? .white : AppTheme.Colors.textPrimary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(selectedGoals.contains(goal) ? AppTheme.Colors.primary : AppTheme.Colors.backgroundElevated)
                                        .cornerRadius(AppTheme.CornerRadius.md)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .cardStyle()

                    VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                        sliderRow(
                            title: "近期平均睡眠时长",
                            valueText: String(format: "%.1f 小时", sleepHours),
                            range: 3...11,
                            value: $sleepHours
                        )
                        sliderRow(
                            title: "当前压力水平",
                            valueText: "\(Int(stressLevel)) / 10",
                            range: 1...10,
                            value: $stressLevel
                        )
                    }
                    .cardStyle()

                    Button {
                        UserDefaults.standard.set(Array(selectedGoals), forKey: "antios_clinical_goals")
                        UserDefaults.standard.set(sleepHours, forKey: "antios_clinical_sleep_hours")
                        UserDefaults.standard.set(Int(stressLevel), forKey: "antios_clinical_stress_level")
                        isComplete = true
                    } label: {
                        Text("完成临床引导")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(selectedGoals.isEmpty)
                }
                .padding(AppTheme.Spacing.md)
                .padding(.bottom, AppTheme.Spacing.xl)
            }
        }
    }

    private func sliderRow(
        title: String,
        valueText: String,
        range: ClosedRange<Double>,
        value: Binding<Double>
    ) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
            HStack {
                Text(title)
                    .font(AppTheme.Typography.subheadline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                Spacer()
                Text(valueText)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textSecondary)
            }
            Slider(value: value, in: range, step: 0.5)
                .tint(AppTheme.Colors.primary)
        }
    }
}

private struct OnboardingFlowView: View {
    @Binding var isComplete: Bool
    @State private var currentStep = 0

    private let steps: [OnboardingStep] = [
        OnboardingStep(
            icon: "waveform.path.ecg",
            title: "每天 2 分钟校准",
            subtitle: "记录睡眠、压力和能量，建立你的个人健康基线。"
        ),
        OnboardingStep(
            icon: "brain.head.profile",
            title: "和 Max 对话",
            subtitle: "通过对话获取解释、建议和个性化行动方案。"
        ),
        OnboardingStep(
            icon: "chart.xyaxis.line",
            title: "观察趋势",
            subtitle: "查看数字孪生和科学期刊推荐，持续优化你的生活方式。"
        )
    ]

    var body: some View {
        ZStack {
            AuroraBackground().ignoresSafeArea()

            VStack(spacing: AppTheme.Spacing.xl) {
                Spacer(minLength: 24)

                TabView(selection: $currentStep) {
                    ForEach(steps.indices, id: \.self) { index in
                        VStack(spacing: AppTheme.Spacing.lg) {
                            Image(systemName: steps[index].icon)
                                .font(.system(size: 62, weight: .semibold))
                                .foregroundStyle(AppTheme.Colors.primaryGradient)
                                .shadow(color: AppTheme.Colors.primary.opacity(0.35), radius: 14)

                            VStack(spacing: AppTheme.Spacing.sm) {
                                Text(steps[index].title)
                                    .font(AppTheme.Typography.title2)
                                    .foregroundColor(AppTheme.Colors.textPrimary)
                                Text(steps[index].subtitle)
                                    .font(AppTheme.Typography.body)
                                    .foregroundColor(AppTheme.Colors.textSecondary)
                                    .multilineTextAlignment(.center)
                            }
                            .padding(.horizontal, AppTheme.Spacing.lg)
                        }
                        .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(height: 320)

                HStack(spacing: 8) {
                    ForEach(steps.indices, id: \.self) { index in
                        Capsule()
                            .fill(index == currentStep ? AppTheme.Colors.primary : AppTheme.Colors.textTertiary.opacity(0.4))
                            .frame(width: index == currentStep ? 22 : 8, height: 8)
                    }
                }

                VStack(spacing: AppTheme.Spacing.sm) {
                    Button {
                        if currentStep == steps.count - 1 {
                            isComplete = true
                        } else {
                            withAnimation(.spring()) {
                                currentStep += 1
                            }
                        }
                    } label: {
                        Text(currentStep == steps.count - 1 ? "开始使用" : "下一步")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())

                    Button {
                        isComplete = true
                    } label: {
                        Text("跳过引导")
                            .font(AppTheme.Typography.caption)
                            .foregroundColor(AppTheme.Colors.textTertiary)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, AppTheme.Spacing.lg)

                Spacer(minLength: 30)
            }
        }
    }
}

private struct BreathingSessionView: View {
    let durationMinutes: Int

    @Environment(\.dismiss) private var dismiss
    @State private var phase: BreathingPhase = .inhale
    @State private var secondsElapsed = 0
    @State private var isRunning = true
    @State private var phaseProgress: Double = 0

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var totalSeconds: Int { max(60, durationMinutes * 60) }
    private var remainingSeconds: Int { max(0, totalSeconds - secondsElapsed) }
    private var completion: Double { min(1, Double(secondsElapsed) / Double(totalSeconds)) }

    var body: some View {
        ZStack {
            AuroraBackground().ignoresSafeArea()

            VStack(spacing: AppTheme.Spacing.xl) {
                HStack {
                    Spacer()
                    Button("结束") { dismiss() }
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }

                Spacer()

                ZStack {
                    Circle()
                        .stroke(AppTheme.Colors.backgroundCard, lineWidth: 16)
                        .frame(width: 230, height: 230)
                    Circle()
                        .trim(from: 0, to: completion)
                        .stroke(AppTheme.Colors.primaryGradient, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 230, height: 230)

                    VStack(spacing: AppTheme.Spacing.sm) {
                        Text(phase.title)
                            .font(AppTheme.Typography.title3)
                            .foregroundColor(AppTheme.Colors.textPrimary)
                        Text(timeText(remainingSeconds))
                            .font(.system(size: 42, weight: .bold, design: .rounded))
                            .foregroundColor(AppTheme.Colors.textPrimary)
                        Text("4-4-6 呼吸节奏")
                            .font(AppTheme.Typography.caption)
                            .foregroundColor(AppTheme.Colors.textTertiary)
                    }
                }
                .scaleEffect(0.94 + (phaseProgress * 0.08))
                .animation(.easeInOut(duration: 1), value: phaseProgress)

                Button {
                    isRunning.toggle()
                } label: {
                    Text(isRunning ? "暂停" : "继续")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, AppTheme.Spacing.lg)

                Spacer()
            }
            .padding(AppTheme.Spacing.md)
        }
        .onReceive(timer) { _ in
            guard isRunning else { return }
            guard secondsElapsed < totalSeconds else {
                isRunning = false
                return
            }

            secondsElapsed += 1
            let cycleSecond = secondsElapsed % 14

            switch cycleSecond {
            case 0..<4:
                phase = .inhale
                phaseProgress = Double(cycleSecond) / 4
            case 4..<8:
                phase = .hold
                phaseProgress = Double(cycleSecond - 4) / 4
            default:
                phase = .exhale
                phaseProgress = Double(cycleSecond - 8) / 6
            }
        }
    }

    private func timeText(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}

private struct OnboardingStep {
    let icon: String
    let title: String
    let subtitle: String
}

private enum BreathingPhase {
    case inhale
    case hold
    case exhale

    var title: String {
        switch self {
        case .inhale: return "吸气"
        case .hold: return "屏息"
        case .exhale: return "呼气"
        }
    }
}

struct ContentView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    ContentView()
        .environmentObject(AuthManager())
    }
}

extension Notification.Name {
    static let openDashboard = Notification.Name("antios.openDashboard")
    static let openMaxChat = Notification.Name("antios.openMaxChat")
    static let startCalibration = Notification.Name("antios.startCalibration")
    static let startBreathing = Notification.Name("antios.startBreathing")
}
