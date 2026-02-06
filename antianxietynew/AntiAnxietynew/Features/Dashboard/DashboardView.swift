// DashboardView.swift
// 仪表盘视图 - 对齐 Web 端 Dashboard 布局

import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @State private var isAssessmentPresented = false
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.screenMetrics) private var metrics
    @EnvironmentObject private var appSettings: AppSettings
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 1. Bioluminescent 深渊背景
                AbyssBackground()
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: metrics.sectionSpacing) {
                        Group {
                            // ==========================================
                            // 2. 欢迎区域 (问候语 + 用户名)
                            // ==========================================
                            welcomeSection
                            
                            // ==========================================
                            // 3. 每日校准快捷入口
                            // ==========================================
                            calibrationQuickEntry

                            // ==========================================
                            // 3.3 核心功能中枢入口
                            // ==========================================
                            coreHubEntry

                            // ==========================================
                            // 3.5 AI 主动问询
                            // ==========================================
                            aiInquiryCard
                            
                            // ==========================================
                            // 4. 核心状态卡片 (对应 Digital Twin 概览)
                            // ==========================================
                            coreStatusCard
                            
                            // ==========================================
                            // 4.2 快捷入口（两排两行）
                            // ==========================================
                            quickActionsGrid
                        }

                        Group {
                            // ==========================================
                            // 5. 健康指标网格
                            // ==========================================
                            healthMetricsGrid
                        }
                        
                        // ==========================================
                        // 6. AI 建议卡片（后台异步）
                        // ==========================================
                        aiRecommendationsSection
                        
                        // ==========================================
                        // 7. 关键洞察
                        // ==========================================
                        if !viewModel.keyInsights.isEmpty {
                            keyInsightsSection
                        }
                        
                        // ==========================================
                        // 8. 今日日志状态
                        // ==========================================
                        if let todayLog = viewModel.todayLog {
                            todayLogCard(todayLog)
                        }
                    }
                    .liquidGlassPageWidth()
                    .padding(.top, metrics.verticalPadding)
                    .padding(.bottom, metrics.bottomContentInset)
                }
                
                // 加载指示器
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.2)
                        .progressViewStyle(CircularProgressViewStyle(tint: .bioGlow(for: colorScheme)))
                }
            }
            .navigationBarHidden(true)
            .task {
                await viewModel.loadData()
                await viewModel.loadDigitalTwin()
                await viewModel.loadInquiry(language: appSettings.language.rawValue, force: false)
                await viewModel.loadDailyRecommendations(language: appSettings.language.rawValue, force: false)
            }
            .onReceive(NotificationCenter.default.publisher(for: .calibrationCompleted)) { _ in
                Task { await viewModel.refresh() }
            }
            .refreshable {
                await viewModel.refresh()
                await viewModel.loadInquiry(language: appSettings.language.rawValue, force: true)
                await viewModel.loadDailyRecommendations(language: appSettings.language.rawValue, force: true)
            }
            .alert(
                "错误",
                isPresented: Binding(
                    get: { viewModel.error != nil },
                    set: { newValue in
                        if !newValue { viewModel.error = nil }
                    }
                )
            ) {
                Button("确定") { viewModel.error = nil }
            } message: {
                Text(viewModel.error ?? "")
            }
        }
        .fullScreenCover(isPresented: $isAssessmentPresented) {
            AssessmentView()
                .edgeSwipeBack()
        }
    }
    
    // MARK: - UI Sections
    
    /// 欢迎区域
    private var welcomeSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(viewModel.greeting)
                    .font(.system(.title3, design: .rounded))
                    .foregroundColor(.liquidGlassAccent)
                Text(viewModel.userName)
                    .font(.system(.largeTitle, design: .serif).bold())
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
            }
            Spacer()
            
            // 离线指示器
            if viewModel.isOffline {
                Image(systemName: "wifi.slash")
                    .font(.title2)
                    .foregroundColor(.statusWarning)
            } else {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 40))
                    .foregroundColor(.liquidGlassPurple)
                    .shadow(color: .liquidGlassPurple.opacity(0.5), radius: 10)
            }
        }
        .padding(.top, metrics.isCompactHeight ? 12 : 20)
    }

    /// AI 主动问询
    @ViewBuilder
    private var aiInquiryCard: some View {
        if viewModel.isInquiryLoading {
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack(spacing: 12) {
                    ProgressView()
                        .tint(.liquidGlassAccent)
                    Text("AI 问询加载中...")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        } else if let inquiry = viewModel.inquiry {
            LiquidGlassCard(style: .elevated, padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "sparkles")
                            .foregroundColor(.liquidGlassAccent)
                        Text("Max 主动问询")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Spacer()
                        Button {
                            viewModel.dismissInquiry()
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.textTertiary)
                        }
                        .buttonStyle(.plain)
                    }

                    Text(inquiry.questionText)
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)

                    if let feed = inquiry.feedContent {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(feed.title)
                                .font(.subheadline)
                                .foregroundColor(.textPrimary)
                            if let summary = feed.summary, !summary.isEmpty {
                                Text(summary)
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                            Text(feed.source)
                                .font(.caption2)
                                .foregroundColor(.textTertiary)
                        }
                        .padding(12)
                        .background(Color.surfaceGlass(for: .dark))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(spacing: 8) {
                        ForEach(resolvedInquiryOptions(inquiry), id: \.value) { option in
                            Button {
                                Task { await viewModel.respondInquiry(option: option) }
                            } label: {
                                HStack {
                                    Text(option.label)
                                        .foregroundColor(.textPrimary)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(.textTertiary)
                                }
                                .padding(.vertical, 10)
                                .padding(.horizontal, 12)
                                .background(Color.surfaceGlass(for: .dark))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if let error = viewModel.inquiryError {
                        Text(error)
                            .font(.caption2)
                            .foregroundColor(.statusError)
                    }
                }
            }
        }
    }

    private func resolvedInquiryOptions(_ inquiry: InquiryQuestion) -> [InquiryOption] {
        inquiry.options ?? [
            InquiryOption(label: "是", value: "yes"),
            InquiryOption(label: "否", value: "no")
        ]
    }
    
    /// 每日校准快捷入口
    private var calibrationQuickEntry: some View {
        NavigationLink(destination: DailyQuestionnaireView(log: viewModel.todayLog).edgeSwipeBack()) {
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack {
                    Image(systemName: "sparkles")
                        .font(.title2)
                        .foregroundColor(.liquidGlassWarm)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("每日校准")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text(viewModel.todayLog == nil ? "记录今天的身心状态" : "今日已完成")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                    Spacer()
                    if viewModel.todayLog == nil {
                        Image(systemName: "chevron.right")
                            .foregroundColor(.textTertiary)
                    } else {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.statusSuccess)
                    }
                }
            }
        }
    }

    /// 核心功能中枢入口
    private var coreHubEntry: some View {
        NavigationLink(destination: CoreHubView().edgeSwipeBack()) {
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack(spacing: 12) {
                    Image(systemName: "square.grid.2x2.fill")
                        .font(.title3)
                        .foregroundColor(.liquidGlassAccent)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("核心功能中枢")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("快速进入贝叶斯、问询、语音分析等模块")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }
            }
        }
        .buttonStyle(.plain)
    }
    
    /// 核心状态卡片
    private var coreStatusCard: some View {
        let ringSize: CGFloat = metrics.isCompactWidth ? 64 : 80
        let score = viewModel.overallScore
        return LiquidGlassCard(style: .elevated) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("整体状态")
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                        
                        if viewModel.hasDigitalTwin {
                            Text("· Digital Twin")
                                .font(.caption2)
                                .foregroundColor(.liquidGlassAccent)
                        }
                    }
                    
                    HStack(alignment: .lastTextBaseline, spacing: 4) {
                        Text(score.map(String.init) ?? "—")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundColor(.textPrimary)
                        Text("/ 100")
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                    }
                    
                    StatusPill(text: viewModel.scoreStatus, color: viewModel.scoreColor)

                    if let trend = viewModel.overallTrendText {
                        Text(trend)
                            .font(.caption2)
                            .foregroundColor(.textSecondary)
                    }
                }
                
                Spacer()
                
                GlowingProgressRing(progress: Double(score ?? 0) / 100.0, showChromatic: (score ?? 0) >= 80)
                    .frame(width: ringSize, height: ringSize)
            }
        }
    }

    /// 快捷入口（两排两行）
    private var quickActionsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            NavigationLink(destination: DigitalTwinView().edgeSwipeBack()) {
                QuickActionCard(
                    icon: "brain.head.profile",
                    title: "数字孪生曲线",
                    subtitle: digitalTwinStatusText,
                    accent: .liquidGlassAccent
                )
            }
            .buttonStyle(.plain)

            Button {
                isAssessmentPresented = true
            } label: {
                QuickActionCard(
                    icon: "stethoscope",
                    title: "健康评估",
                    subtitle: "深入的身心健康检查",
                    accent: .liquidGlassSecondary
                )
            }
            .buttonStyle(.plain)

            NavigationLink(destination: PlansView().edgeSwipeBack()) {
                QuickActionCard(
                    icon: "list.bullet.clipboard.fill",
                    title: "计划中心",
                    subtitle: "AI 计划与执行进度",
                    accent: .liquidGlassAccent
                )
            }
            .buttonStyle(.plain)

            NavigationLink(destination: ScienceFeedView().edgeSwipeBack()) {
                QuickActionCard(
                    icon: "books.vertical.fill",
                    title: "科学期刊",
                    subtitle: "与你状态匹配的研究",
                    accent: .liquidGlassWarm
                )
            }
            .buttonStyle(.plain)
        }
    }

    private struct QuickActionCard: View {
        let icon: String
        let title: String
        let subtitle: String
        let accent: Color

        var body: some View {
            LiquidGlassCard(style: .standard, padding: 14) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Image(systemName: icon)
                            .font(.title3)
                            .foregroundColor(accent)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                    }
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(.textSecondary)
                        .lineLimit(2)
                }
            }
        }
    }
    
    /// 健康指标网格
    private var healthMetricsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            MetricCard(
                title: "HRV (SDNN)",
                value: formatHRV(viewModel.hardwareData?.hrv?.value),
                icon: "waveform.path.ecg",
                color: .liquidGlassAccent
            )
            
            MetricCard(
                title: "静息心率",
                value: formatHeartRate(viewModel.hardwareData?.resting_heart_rate?.value),
                icon: "heart.fill",
                color: .liquidGlassSecondary
            )
            
            MetricCard(
                title: "平均睡眠",
                value: String(format: "%.1f h", viewModel.averageSleepHours),
                icon: "moon.zzz.fill",
                color: .liquidGlassPurple
            )
            
            MetricCard(
                title: "压力水平",
                value: formatStressLevel(viewModel.averageStress),
                icon: "brain",
                color: .liquidGlassWarm
            )
        }
    }
    
    /// AI 建议卡片（后台异步）
    private var aiRecommendationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("AI 建议")
                .font(.headline)
                .foregroundColor(.textPrimary)

            LiquidGlassCard(style: .standard) {
                if !viewModel.aiRecommendations.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(viewModel.aiRecommendations.prefix(4)) { item in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(item.title)
                                    .font(.subheadline.bold())
                                    .foregroundColor(.textPrimary)
                                Text(item.summary)
                                    .font(.subheadline)
                                    .foregroundColor(.textSecondary)
                                Text("行动：\(item.action)")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                                if let reason = item.reason, !reason.isEmpty {
                                    Text("原因：\(reason)")
                                        .font(.caption2)
                                        .foregroundColor(.textTertiary)
                                }
                            }
                            if item.id != viewModel.aiRecommendations.prefix(4).last?.id {
                                Divider().opacity(0.3)
                            }
                        }
                    }
                } else {
                    Text("今日建议准备中，稍后自动更新。")
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)
                }
            }
        }
    }
    
    /// 关键洞察
    private var keyInsightsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("关键洞察")
                .font(.headline)
                .foregroundColor(.textPrimary)
            
            ForEach(viewModel.keyInsights.prefix(3), id: \.self) { insight in
                LiquidGlassCard(style: .concave, padding: 12) {
                    HStack {
                        Image(systemName: "lightbulb.fill")
                            .foregroundColor(.liquidGlassWarm)
                        Text(insight)
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                        Spacer()
                    }
                }
            }
        }
    }
    
    /// 今日日志卡片
    private func todayLogCard(_ log: WellnessLog) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("今日记录")
                .font(.headline)
                .foregroundColor(.textPrimary)
            
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack(spacing: 20) {
                    // 心情
                    VStack(spacing: 4) {
                        Text(log.moodEmoji)
                            .font(.title)
                        Text("心情")
                            .font(.caption2)
                            .foregroundColor(.textSecondary)
                    }
                    
                    Divider()
                        .frame(height: 40)
                    
                    // 睡眠
                    VStack(spacing: 4) {
                        Text(String(format: "%.1f", log.sleepHours))
                            .font(.title2.bold())
                            .foregroundColor(.textPrimary)
                        Text("睡眠(h)")
                            .font(.caption2)
                            .foregroundColor(.textSecondary)
                    }
                    
                    Divider()
                        .frame(height: 40)
                    
                    // 压力
                    VStack(spacing: 4) {
                        Text("\(log.stress_level ?? 0)")
                            .font(.title2.bold())
                            .foregroundColor(.textPrimary)
                        Text("压力")
                            .font(.caption2)
                            .foregroundColor(.textSecondary)
                    }
                    
                    Spacer()
                }
            }
        }
    }
    
    
    // MARK: - Formatters
    
    private func formatHRV(_ value: Double?) -> String {
        guard let v = value, v > 0 else { return "-- ms" }
        return String(format: "%.0f ms", v)
    }
    
    private func formatHeartRate(_ value: Double?) -> String {
        guard let v = value, v > 0 else { return "-- bpm" }
        return String(format: "%.0f bpm", v)
    }
    
    private func formatStressLevel(_ value: Double) -> String {
        guard value > 0 else { return "--" }
        return String(format: "%.1f / 10", value)
    }

    private var digitalTwinStatusText: String {
        if let timestamp = viewModel.digitalTwinDashboard?.lastAnalyzed {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let date = isoFormatter.date(from: timestamp) ?? ISO8601DateFormatter().date(from: timestamp)
            if let date {
                let formatter = DateFormatter()
                formatter.dateFormat = "MM/dd HH:mm"
                return "最近分析 \(formatter.string(from: date))"
            }
        }
        if viewModel.digitalTwinStatus == "collecting_data",
           let progress = viewModel.digitalTwinCollectionStatus?.progress {
            return "数据收集中 \(Int(progress))%"
        }
        return viewModel.digitalTwinStatusMessage
    }
}

// MARK: - MetricCard (保留)

struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        LiquidGlassCard(style: .concave, padding: 12) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: metrics.isCompactWidth ? 16 : 18))
                        .foregroundColor(color)
                    Spacer()
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(value)
                        .font(.system(size: metrics.isCompactWidth ? 18 : 20, weight: .bold, design: .rounded))
                        .foregroundColor(.textPrimary)
                        .minimumScaleFactor(0.8)
                    
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        }
    }
}

// MARK: - Local Models (will be moved to Shared/Models)

struct PlanItem: Identifiable {
    let id: UUID
    let title: String
    var isCompleted: Bool
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
            .preferredColorScheme(.dark)
            .environmentObject(AppSettings())
    }
}
