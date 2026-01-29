// ReportView.swift
// 报告页（数字孪生 + AI 身体分析）

import SwiftUI

struct ReportView: View {
    @StateObject private var dashboardViewModel = DashboardViewModel()
    @StateObject private var understandingViewModel = UnderstandingScoreViewModel()
    @StateObject private var wearableViewModel = WearableConnectViewModel()
    @State private var isAssessmentPresented = false
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        NavigationStack {
            ZStack {
                AuroraBackground()
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: metrics.sectionSpacing) {
                        headerSection
                        digitalTwinCard
                        aiAnalysisCard
                        hrvSummaryCard
                        feedbackLoopCard
                        analysisHistoryEntry
                        bayesianLoopEntry
                        insightEngineEntry
                        wearableCard
                        assessmentCard
                    }
                    .liquidGlassPageWidth()
                    .padding(.top, metrics.verticalPadding)
                    .padding(.bottom, metrics.bottomContentInset)
                }

                if dashboardViewModel.isLoading || understandingViewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.2)
                        .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
                }
            }
            .navigationBarHidden(true)
            .task {
                await loadData()
            }
            .refreshable {
                await refreshData()
            }
        }
        .fullScreenCover(isPresented: $isAssessmentPresented) {
            AssessmentView()
        }
    }

    private func loadData() async {
        await dashboardViewModel.loadData()
        await dashboardViewModel.loadDigitalTwin()
        await understandingViewModel.load()
        wearableViewModel.refreshStatus()
    }

    private func refreshData() async {
        await dashboardViewModel.refresh()
        await understandingViewModel.load()
        wearableViewModel.refreshStatus()
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("报告")
                .font(GlassTypography.display(28, weight: .bold))
                .foregroundColor(.textPrimary)
            Text("数字孪生 · AI 身体分析")
                .font(GlassTypography.caption(13))
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, metrics.isCompactHeight ? 8 : 16)
    }

    private var digitalTwinCard: some View {
        let score = dashboardViewModel.overallScore
        return LiquidGlassCard(style: .elevated, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "waveform.path.ecg")
                        .font(.title3)
                        .foregroundColor(.liquidGlassAccent)
                    Text("数字孪生详细")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                    if dashboardViewModel.loadingDigitalTwin {
                        ProgressView().tint(.liquidGlassAccent)
                    }
                }

                HStack(alignment: .lastTextBaseline, spacing: 6) {
                    Text(score.map(String.init) ?? "—")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundColor(.textPrimary)
                    Text("/ 100")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                    Spacer()
                    ProgressRingView(
                        progress: Double(score ?? 0) / 100,
                        lineWidth: 8,
                        color: .liquidGlassAccent
                    )
                    .frame(width: 62, height: 62)
                }

                StatusPill(text: dashboardViewModel.scoreStatus, color: dashboardViewModel.scoreColor)
                Text(dashboardViewModel.digitalTwinStatusMessage)
                    .font(.caption)
                    .foregroundColor(.textSecondary)

                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 10) {
                        NavigationLink(destination: DigitalTwinView()) {
                            Text("查看详情")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                        Button {
                            Task { _ = await dashboardViewModel.analyzeDigitalTwin() }
                        } label: {
                            Text("触发分析")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                        .disabled(dashboardViewModel.loadingDigitalTwin)
                    }

                    VStack(spacing: 10) {
                        NavigationLink(destination: DigitalTwinView()) {
                            Text("查看详情")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                        Button {
                            Task { _ = await dashboardViewModel.analyzeDigitalTwin() }
                        } label: {
                            Text("触发分析")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                        .disabled(dashboardViewModel.loadingDigitalTwin)
                    }
                }
            }
        }
    }

    private var aiAnalysisCard: some View {
        let dashboard = dashboardViewModel.digitalTwinDashboard
        let summary = dashboard?.dashboardData.summaryStats
        let vitals = dashboard?.dashboardData.baselineData.vitals ?? []

        return LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "brain.head.profile")
                        .foregroundColor(.liquidGlassWarm)
                    Text("AI 身体分析")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                }

                if let summary {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("整体改善：\(summary.overallImprovement)")
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                        Text("一致性：\(summary.consistencyScore)")
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                        Text("首次见效：\(summary.daysToFirstResult) 天")
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                    }
                } else {
                    Text(dashboardViewModel.digitalTwinStatusMessage)
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)
                }

                if !vitals.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(vitals.prefix(2)) { vital in
                            HStack(alignment: .top, spacing: 6) {
                                Text("•")
                                    .foregroundColor(.liquidGlassAccent)
                                Text("\(vital.name)：\(vital.value)")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }
                }

                NavigationLink(destination: BodyAnalysisView(analysis: dashboardViewModel.digitalTwinDashboard)) {
                    HStack(spacing: 6) {
                        Text("查看分析详情")
                        Image(systemName: "chevron.right")
                    }
                    .font(.caption)
                    .foregroundColor(.liquidGlassAccent)
                }
            }
        }
    }

    private var hrvSummaryCard: some View {
        let hardware = dashboardViewModel.hardwareData
        return LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.statusSuccess)
                    Text("HRV 与生物指标")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                }

                HStack(spacing: 12) {
                    ReportMetricView(title: "HRV", value: formatValue(hardware?.hrv?.value, suffix: "ms"))
                    ReportMetricView(title: "静息心率", value: formatValue(hardware?.resting_heart_rate?.value, suffix: "bpm"))
                    ReportMetricView(title: "步数", value: formatValue(hardware?.steps?.value, suffix: "步"))
                }

                HStack(spacing: 12) {
                    ReportMetricView(title: "睡眠", value: formatValue(dashboardViewModel.averageSleepHours, suffix: "h"))
                    Spacer()
                }

                NavigationLink(destination: HRVDashboardView()) {
                    HStack(spacing: 6) {
                        Text("进入指标看板")
                        Image(systemName: "chevron.right")
                    }
                    .font(.caption)
                    .foregroundColor(.liquidGlassAccent)
                }
            }
        }
    }

    private var feedbackLoopCard: some View {
        let scoreValue = Int(understandingViewModel.score?.current ?? 0)
        let delta = understandingViewModel.latestDelta

        return LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "sparkles")
                        .foregroundColor(.liquidGlassAccent)
                    Text("AI 学习反馈")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                }

                HStack(alignment: .lastTextBaseline, spacing: 6) {
                    Text("\(scoreValue)%")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundColor(.textPrimary)
                    if let delta {
                        Text(String(format: "%+.1f%%", delta))
                            .font(.caption)
                            .foregroundColor(delta >= 0 ? .statusSuccess : .statusError)
                    }
                }

                Text(understandingViewModel.score?.isDeepUnderstanding == true ? "深度理解已达成" : "理解度持续提升中")
                    .font(.caption)
                    .foregroundColor(.textSecondary)

                NavigationLink(destination: FeedbackLoopDetailView(viewModel: understandingViewModel)) {
                    HStack(spacing: 6) {
                        Text("查看学习详情")
                        Image(systemName: "chevron.right")
                    }
                    .font(.caption)
                    .foregroundColor(.liquidGlassAccent)
                }
            }
        }
    }

    private var analysisHistoryEntry: some View {
        NavigationLink(destination: AnalysisHistoryView()) {
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack(spacing: 12) {
                    Image(systemName: "chart.xyaxis.line")
                        .foregroundColor(.liquidGlassAccent)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("分析历史")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("查看历史趋势与置信度")
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

    private var bayesianLoopEntry: some View {
        NavigationLink(destination: BayesianLoopView()) {
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack(spacing: 12) {
                    Image(systemName: "brain")
                        .foregroundColor(.liquidGlassWarm)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("贝叶斯信念循环")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("证据堆栈与信念更新")
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

    private var insightEngineEntry: some View {
        NavigationLink(destination: InsightEngineView()) {
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack(spacing: 12) {
                    Image(systemName: "sparkles")
                        .foregroundColor(.liquidGlassAccent)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("洞察引擎")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("洞察生成与深度推演")
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

    private var wearableCard: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "applewatch")
                        .foregroundColor(.liquidGlassAccent)
                    Text("穿戴设备连接")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                    Text(wearableViewModel.isAuthorized ? "已连接" : "未连接")
                        .font(.caption)
                        .foregroundColor(wearableViewModel.isAuthorized ? .statusSuccess : .textTertiary)
                }

                if let lastSync = wearableViewModel.lastSync {
                    Text("上次同步：\(lastSync.formatted(date: .abbreviated, time: .shortened))")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                } else {
                    Text("连接后可同步 HRV、睡眠、心率等数据")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }

                NavigationLink(destination: WearableConnectView(viewModel: wearableViewModel)) {
                    HStack(spacing: 6) {
                        Text("管理连接")
                        Image(systemName: "chevron.right")
                    }
                    .font(.caption)
                    .foregroundColor(.liquidGlassAccent)
                }
            }
        }
    }

    private var assessmentCard: some View {
        Button {
            isAssessmentPresented = true
        } label: {
            LiquidGlassCard(style: .standard, padding: 16) {
                HStack(spacing: 12) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .foregroundColor(.liquidGlassAccent)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("临床评估报告")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("完成评估后生成可追溯的分析报告")
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

    private func formatValue(_ value: Double?, suffix: String) -> String {
        guard let value, value > 0 else { return "—" }
        let display = value >= 100 ? String(format: "%.0f", value) : String(format: "%.1f", value)
        return "\(display)\(suffix)"
    }
}

struct ReportMetricView: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.textTertiary)
            Text(value)
                .font(.headline)
                .foregroundColor(.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.surfaceGlass(for: .dark))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct BodyAnalysisView: View {
    let analysis: DigitalTwinDashboardResponse?
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header
                    baselineVitals
                    baselineAssessments
                    adaptivePlan
                }
                .padding(.horizontal, metrics.horizontalPadding)
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("AI 身体分析")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("分析摘要")
                .font(.headline)
                .foregroundColor(.textPrimary)
            if let summary = analysis?.dashboardData.summaryStats {
                Text("整体改善：\(summary.overallImprovement)")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
                Text("一致性：\(summary.consistencyScore)")
                    .font(.caption)
                    .foregroundColor(.textTertiary)
            } else {
                Text("暂无趋势摘要，请先完成评估与校准。")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
            }
        }
    }

    private var baselineVitals: some View {
        let vitals = analysis?.dashboardData.baselineData.vitals ?? []
        return LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("生理指标")
                    .font(.headline)
                    .foregroundColor(.textPrimary)

                if vitals.isEmpty {
                    Text("暂无指标数据")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                } else {
                    ForEach(vitals.prefix(4)) { vital in
                        HStack(alignment: .top, spacing: 6) {
                            Text("•")
                                .foregroundColor(.liquidGlassAccent)
                            Text("\(vital.name)：\(vital.value)")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }
                    }
                }
            }
        }
    }

    private var baselineAssessments: some View {
        let assessments = analysis?.dashboardData.baselineData.assessments ?? []
        return LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("基线量表")
                    .font(.headline)
                    .foregroundColor(.textPrimary)

                if assessments.isEmpty {
                    Text("暂无量表数据")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                } else {
                    ForEach(assessments.prefix(4)) { item in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.name)
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                            Text("\(item.value) · \(item.interpretation)")
                                .font(.caption2)
                                .foregroundColor(.textTertiary)
                        }
                    }
                }
            }
        }
    }

    private var adaptivePlan: some View {
        let plan = analysis?.adaptivePlan
        return LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("AI 计划建议")
                    .font(.headline)
                    .foregroundColor(.textPrimary)

                if let focus = plan?.dailyFocus.first {
                    Text("今日重点：\(focus.action)")
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)
                } else {
                    Text("暂无今日重点")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }

                if let rec = plan?.sleepRecommendations.first {
                    Text("睡眠建议：\(rec.recommendation)")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }

                if let exercise = plan?.breathingExercises.first {
                    Text("呼吸练习：\(exercise.name) · \(exercise.duration)")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        }
    }

    private func formatValue(_ value: Int?, suffix: String) -> String {
        guard let value else { return "—" }
        return "\(value)\(suffix)"
    }
}

struct HRVDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("HRV 指标看板")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("实时同步你的 HRV、心率、步数与睡眠")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("今日核心指标")
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            HStack(spacing: 12) {
                                ReportMetricView(title: "HRV", value: formatValue(viewModel.hardwareData?.hrv?.value, suffix: "ms"))
                                ReportMetricView(title: "静息心率", value: formatValue(viewModel.hardwareData?.resting_heart_rate?.value, suffix: "bpm"))
                            }
                            HStack(spacing: 12) {
                                ReportMetricView(title: "步数", value: formatValue(viewModel.hardwareData?.steps?.value, suffix: "步"))
                                ReportMetricView(title: "睡眠", value: formatValue(viewModel.averageSleepHours, suffix: "h"))
                            }
                        }
                    }

                if let source = viewModel.hardwareData?.hrv?.source {
                    Text("数据来源：\(source)")
                        .font(.caption2)
                        .foregroundColor(.textTertiary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, metrics.horizontalPadding)
            .padding(.top, metrics.verticalPadding)
            .padding(.bottom, metrics.bottomContentInset)
        }
        }
        .navigationTitle("HRV 看板")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadData()
        }
    }

    private func formatValue(_ value: Double?, suffix: String) -> String {
        guard let value, value > 0 else { return "—" }
        let display = value >= 100 ? String(format: "%.0f", value) : String(format: "%.1f", value)
        return "\(display)\(suffix)"
    }
}

struct WearableConnectView: View {
    @ObservedObject var viewModel: WearableConnectViewModel
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("HealthKit 连接")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("同步 HRV、睡眠、心率等数据")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("连接状态")
                                    .font(.subheadline)
                                    .foregroundColor(.textSecondary)
                                Spacer()
                                Text(viewModel.isAuthorized ? "已连接" : "未连接")
                                    .font(.headline)
                                    .foregroundColor(viewModel.isAuthorized ? .statusSuccess : .textTertiary)
                            }

                            if let lastSync = viewModel.lastSync {
                                Text("上次同步：\(lastSync.formatted(date: .abbreviated, time: .shortened))")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }

                            if let error = viewModel.errorMessage {
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(.statusError)
                            }

                            HStack(spacing: 10) {
                                Button {
                                    Task { await viewModel.connect() }
                                } label: {
                                    Text(viewModel.isAuthorized ? "重新授权" : "授权 HealthKit")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                                Button {
                                    Task { await viewModel.syncNow() }
                                } label: {
                                    Text(viewModel.isSyncing ? "同步中..." : "立即同步")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                                .disabled(viewModel.isSyncing)
                            }
                        }
                    }

                    LiquidGlassCard(style: .concave, padding: 16) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("最新数据")
                                .font(.headline)
                                .foregroundColor(.textPrimary)
                            HStack(spacing: 12) {
                                ReportMetricView(title: "HRV", value: formatValue(viewModel.hrv, suffix: "ms"))
                                ReportMetricView(title: "心率", value: formatValue(viewModel.restingHeartRate, suffix: "bpm"))
                            }
                            HStack(spacing: 12) {
                                ReportMetricView(title: "步数", value: formatValue(viewModel.steps, suffix: "步"))
                                ReportMetricView(title: "睡眠", value: formatValue(viewModel.sleepHours, suffix: "h"))
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, metrics.horizontalPadding)
                .padding(.top, metrics.verticalPadding)
                .padding(.bottom, metrics.bottomContentInset)
            }
        }
        .navigationTitle("穿戴设备")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.refreshStatus()
        }
    }

    private func formatValue(_ value: Double?, suffix: String) -> String {
        guard let value, value > 0 else { return "—" }
        let display = value >= 100 ? String(format: "%.0f", value) : String(format: "%.1f", value)
        return "\(display)\(suffix)"
    }
}

struct FeedbackLoopDetailView: View {
    @ObservedObject var viewModel: UnderstandingScoreViewModel
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("AI 学习指标")
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            ScoreMetricRow(
                                title: "理解度评分",
                                value: viewModel.score?.current
                            )
                            ScoreMetricRow(
                                title: "预测准确率",
                                value: viewModel.score?.breakdown?.completionPredictionAccuracy
                            )
                            ScoreMetricRow(
                                title: "干预成功率",
                                value: viewModel.score?.breakdown?.replacementAcceptanceRate
                            )
                        }
                    }

                    LiquidGlassCard(style: .concave, padding: 16) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("最近更新")
                                .font(.headline)
                                .foregroundColor(.textPrimary)
                            if viewModel.history.isEmpty {
                                Text("暂无学习记录")
                                    .font(.caption)
                                    .foregroundColor(.textTertiary)
                            } else {
                                ForEach(viewModel.history.prefix(5)) { item in
                                    HStack {
                                        Text(item.date)
                                            .font(.caption2)
                                            .foregroundColor(.textTertiary)
                                        Spacer()
                                        Text("\(Int(item.score))%")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                    }
                                }
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, metrics.horizontalPadding)
                .padding(.top, metrics.verticalPadding)
                .padding(.bottom, metrics.bottomContentInset)
            }
        }
        .navigationTitle("学习反馈")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if viewModel.score == nil {
                await viewModel.load()
            }
        }
    }
}

struct ScoreMetricRow: View {
    let title: String
    let value: Double?

    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.textSecondary)
            Spacer()
            Text(valueText)
                .font(.subheadline)
                .foregroundColor(.textPrimary)
        }
        .padding(.vertical, 6)
    }

    private var valueText: String {
        guard let value else { return "—" }
        return "\(Int(value))%"
    }
}
