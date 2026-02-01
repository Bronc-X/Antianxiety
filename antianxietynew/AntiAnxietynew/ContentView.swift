// ContentView.swift
// 主内容视图 - iOS 26 悬浮导航
//
// 审美: Neuro-Glass 界面

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var supabase: SupabaseManager
    @EnvironmentObject var appSettings: AppSettings
    @State private var selectedTab: Tab = .dashboard
    @AppStorage("isOnboardingComplete") private var isOnboardingComplete = false
    @State private var isCalibrationPresented = false
    @State private var isBreathingPresented = false
    @State private var breathingDurationMinutes = 5
    
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
        
        func title(language: AppLanguage) -> String {
            switch self {
            case .dashboard: return L10n.text("首页", "Home", language: language)
            case .report: return L10n.text("报告", "Report", language: language)
            case .max: return "Max"
            case .plans: return L10n.text("计划", "Plans", language: language)
            case .settings: return L10n.text("设置", "Settings", language: language)
            }
        }
    }
    
    var body: some View {
        GeometryReader { proxy in
            let metrics = ScreenMetrics(size: proxy.size, safeAreaInsets: proxy.safeAreaInsets)

            Group {
            Group {
                if !supabase.isSessionRestored {
                    // 启动加载页
                    ZStack {
                        AuroraBackground().ignoresSafeArea()
                        VStack(spacing: 20) {
                            Image(systemName: "brain.head.profile")
                                .font(.system(size: 60))
                                .foregroundColor(.liquidGlassAccent)
                            ProgressView()
                                .tint(.white)
                        }
                    }
                    .transition(.opacity)
                        .transition(.opacity)
                } else if !supabase.isAuthenticated {
                    AuthView()
                        .transition(.opacity)
                } else if !supabase.isClinicalComplete {
                    ClinicalOnboardingView(isComplete: $supabase.isClinicalComplete)
                        .transition(.opacity)
                } else if !isOnboardingComplete {
                    OnboardingView(isComplete: $isOnboardingComplete)
                        .transition(.opacity)
                } else {
                    mainInterface()
                        .transition(.opacity)
                }
            }
            }
            .environment(\.screenMetrics, metrics)
            .animation(.easeInOut, value: supabase.isAuthenticated)
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
            .onReceive(NotificationCenter.default.publisher(for: .askMax)) { notification in
                if notification.userInfo?["forwarded"] as? Bool == true {
                    return
                }
                if let question = notification.userInfo?["question"] as? String,
                   !question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    selectedTab = .max
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                        NotificationCenter.default.post(
                            name: .askMax,
                            object: nil,
                            userInfo: ["question": question, "forwarded": true]
                        )
                    }
                }
            }
            .fullScreenCover(isPresented: $isCalibrationPresented) {
                CalibrationView(autoStart: true)
            }
            .fullScreenCover(isPresented: $isBreathingPresented) {
                BreathingSessionView(durationMinutes: breathingDurationMinutes)
            }
        }
        .ignoresSafeArea()
    }
    
    // MARK: - 主界面
    private func mainInterface() -> some View {
        ZStack {
            // 1. 全局背景
            AuroraBackground()
                .ignoresSafeArea() // 确保背景填满顶部灵动岛区域
            
            // 2. 原生 TabView
            TabView(selection: $selectedTab) {
                DashboardView()
                    .tag(Tab.dashboard)
                    .tabItem {
                        Label(Tab.dashboard.title(language: appSettings.language), systemImage: Tab.dashboard.icon)
                    }
                ReportView()
                    .tag(Tab.report)
                    .tabItem {
                        Label(Tab.report.title(language: appSettings.language), systemImage: Tab.report.icon)
                    }
                MaxChatView()
                    .tag(Tab.max)
                    .tabItem {
                        Label(Tab.max.title(language: appSettings.language), systemImage: Tab.max.icon)
                    }
                PlansView()
                    .tag(Tab.plans)
                    .tabItem {
                        Label(Tab.plans.title(language: appSettings.language), systemImage: Tab.plans.icon)
                    }
                SettingsView()
                    .tag(Tab.settings)
                    .tabItem {
                        Label(Tab.settings.title(language: appSettings.language), systemImage: Tab.settings.icon)
                    }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .preferredColorScheme(.dark)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(SupabaseManager.shared)
            .environmentObject(AppSettings())
    }
}
