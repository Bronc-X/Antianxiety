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
    
    // 隐藏原生 TabBar 的标记
    init() {
        UITabBar.appearance().isHidden = true
    }
    
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
                    mainInterface(metrics: metrics)
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
    private func mainInterface(metrics: ScreenMetrics) -> some View {
        ZStack(alignment: .bottom) {
            // 1. 全局背景
            AuroraBackground()
                .ignoresSafeArea() // 确保背景填满顶部灵动岛区域
            
            // 2. 内容层 - 使用普通 TabView（不滑动切换）
            TabView(selection: $selectedTab) {
                DashboardView().tag(Tab.dashboard)
                ReportView().tag(Tab.report)
                MaxChatView().tag(Tab.max)
                PlansView().tag(Tab.plans)
                SettingsView().tag(Tab.settings)
            }
            // 为底部导航栏预留空间
            .padding(.bottom, metrics.tabBarHeight + metrics.safeAreaInsets.bottom + 20)
            
            // 3. 悬浮导航坞 - 固定在底部、居中、最上层
            VStack {
                Spacer()
                CustomFloatingTabBar(selectedTab: $selectedTab, language: appSettings.language)
                    .frame(width: metrics.tabBarWidth) // 使用标准 TabBar 宽度
                    .padding(.bottom, max(metrics.safeAreaInsets.bottom, 8))
            }
            .frame(maxWidth: .infinity, alignment: .center) // 显式居中对齐
            .ignoresSafeArea(.container, edges: .bottom)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .preferredColorScheme(.dark)
    }
}

// MARK: - Custom Floating Tab Bar
struct CustomFloatingTabBar: View {
    @Binding var selectedTab: ContentView.Tab
    var language: AppLanguage
    @Namespace private var animationNamespace
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        let tabCount = CGFloat(ContentView.Tab.allCases.count)
        let internalPadding: CGFloat = metrics.isCompactWidth ? 2 : 4
        let availableWidth = max(CGFloat.zero, metrics.tabBarWidth - internalPadding * 2)
        let perTabWidth = availableWidth / max(tabCount, 1)
        let showAllLabels = !metrics.isCompactWidth && perTabWidth >= 64
        let iconSize = showAllLabels ? metrics.iconSize : metrics.smallIconSize

        HStack(spacing: metrics.isCompactWidth ? 4 : 0) {
            ForEach(ContentView.Tab.allCases) { tab in
                Button {
                    let impact = UIImpactFeedbackGenerator(style: .medium)
                    impact.impactOccurred()
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedTab = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        // Icon Layer
                        ZStack {
                            if selectedTab == tab {
                                // Active Glow
                                Circle()
                                    .fill(Color.liquidGlassAccent.opacity(0.2))
                                    .frame(width: metrics.isCompactWidth ? 34 : 40, height: metrics.isCompactWidth ? 34 : 40)
                                    .matchedGeometryEffect(id: "ActiveTabBg", in: animationNamespace)
                                    .blur(radius: 5)
                            }
                            
                            Image(systemName: tab.icon)
                                .font(.system(size: iconSize))
                                .foregroundColor(selectedTab == tab ? .liquidGlassAccent : .textTertiary)
                                .scaleEffect(selectedTab == tab ? 1.2 : 1.0)
                        }
                        .frame(height: metrics.isCompactWidth ? 34 : 40)
                        
                        // Label (Optional - minimal aesthetic might hide labels, but keeping for usability)
                        if showAllLabels || selectedTab == tab {
                            Text(tab.title(language: language))
                                .font(.system(size: metrics.isCompactWidth ? 8 : 9, weight: .bold))
                                .foregroundColor(selectedTab == tab ? .liquidGlassAccent : .textTertiary)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                                .allowsTightening(true)
                                .transition(.move(edge: .bottom).combined(with: .opacity))
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.vertical, metrics.isCompactHeight ? 8 : 12)
        .padding(.horizontal, internalPadding) // 最小化内边距，确保5个图标能放下
        .frame(height: metrics.tabBarHeight)
        .clipShape(Capsule())
        .background {
            // Glass Capsule
            ZStack {
                Capsule()
                    .fill(.ultraThinMaterial)
                
                Capsule()
                    .strokeBorder(
                        LinearGradient(
                            colors: [.white.opacity(0.2), .white.opacity(0.05), .clear, .white.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            }
            .shadow(color: .black.opacity(0.3), radius: 15, x: 0, y: 10)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(SupabaseManager.shared)
            .environmentObject(AppSettings())
    }
}
