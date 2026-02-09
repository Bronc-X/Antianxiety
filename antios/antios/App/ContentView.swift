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
                } else if authManager.isAuthenticated {
                    mainInterface
                } else {
                    AuthView()
                }
            }
            .environment(\.screenMetrics, metrics)
            .animation(.easeInOut, value: isBooting)
            .animation(.easeInOut, value: authManager.isAuthenticated)
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
                HomeView()
                    .tag(Tab.dashboard)
                    .tabItem {
                        Label(Tab.dashboard.title, systemImage: Tab.dashboard.icon)
                    }
                ReportHubView()
                    .tag(Tab.report)
                    .tabItem {
                        Label(Tab.report.title, systemImage: Tab.report.icon)
                    }
                ChatView()
                    .tag(Tab.max)
                    .tabItem {
                        Label(Tab.max.title, systemImage: Tab.max.icon)
                    }
                PlanView()
                    .tag(Tab.plans)
                    .tabItem {
                        Label(Tab.plans.title, systemImage: Tab.plans.icon)
                    }
                ProfileView()
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
        .preferredColorScheme(.dark)
        .transition(.opacity)
    }
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

struct ContentView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    ContentView()
        .environmentObject(AuthManager())
    }
}
