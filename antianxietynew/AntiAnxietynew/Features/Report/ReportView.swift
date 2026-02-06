// ReportView.swift
// 报告页（数字孪生 + AI 身体分析）

import SwiftUI

struct ReportView: View {
    @StateObject private var dashboardViewModel = DashboardViewModel()
    @StateObject private var understandingViewModel = UnderstandingScoreViewModel()
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
                        analysisInsightRow
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
    }

    private func loadData() async {
        await dashboardViewModel.loadData()
        await dashboardViewModel.loadDigitalTwin()
        await understandingViewModel.load()
    }

    private func refreshData() async {
        await dashboardViewModel.refresh()
        await understandingViewModel.load()
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
                if let trend = dashboardViewModel.overallTrendText {
                    Text(trend)
                        .font(.caption2)
                        .foregroundColor(.textSecondary)
                }

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
        let highlights = buildBodyAnalysisHighlights()
        let actions = buildBodyAnalysisActions()

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
                }

                if !highlights.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(highlights, id: \.self) { item in
                            HStack(alignment: .top, spacing: 6) {
                                Text("•")
                                    .foregroundColor(.liquidGlassAccent)
                                Text(item)
                                    .font(.subheadline)
                                    .foregroundColor(.textSecondary)
                            }
                        }
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

                if !actions.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("建议执行")
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                        ForEach(actions, id: \.self) { action in
                            Text("• \(action)")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
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

    private func buildBodyAnalysisHighlights() -> [String] {
        var highlights: [String] = []
        if let score = dashboardViewModel.overallScore {
            if score >= 80 {
                highlights.append("整体状态稳健，恢复节奏良好，可继续保持当前节律。")
            } else if score >= 60 {
                highlights.append("整体状态稳定，但仍有提升空间，建议把注意力放在一两个关键指标上。")
            } else {
                highlights.append("整体状态偏弱，建议优先修复睡眠与压力管理。")
            }
        }

        let sleepHours = dashboardViewModel.averageSleepHours
        if sleepHours > 0 {
            if sleepHours < 6.5 {
                highlights.append("近期睡眠时长偏短，可能影响情绪稳定与能量恢复。")
            } else if sleepHours >= 7.5 {
                highlights.append("睡眠时长较理想，是稳定情绪的关键支撑。")
            }
        }

        let stress = dashboardViewModel.averageStress
        if stress > 0 {
            if stress >= 7 {
                highlights.append("压力感受偏高，短时放松练习会更有效。")
            } else if stress <= 4 {
                highlights.append("压力水平处于可控区间，保持即可。")
            }
        }

        return highlights
    }

    private func buildBodyAnalysisActions() -> [String] {
        var actions: [String] = []
        let sleepHours = dashboardViewModel.averageSleepHours
        let stress = dashboardViewModel.averageStress

        if sleepHours > 0 && sleepHours < 6.5 {
            actions.append("固定入睡时间，睡前 60 分钟减少屏幕刺激。")
        }
        if stress >= 7 {
            actions.append("午后安排 5-8 分钟慢呼吸或短时冥想。")
        }
        if actions.isEmpty {
            actions.append("继续保持规律作息与轻度活动，巩固当前稳定趋势。")
        }
        return actions
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

    private var analysisInsightRow: some View {
        HStack(spacing: 12) {
            NavigationLink(destination: AnalysisHistoryView()) {
                compactEntryCard(
                    icon: "chart.xyaxis.line",
                    title: "分析历史",
                    subtitle: "历史趋势与置信度",
                    accent: .liquidGlassAccent
                )
            }
            .buttonStyle(.plain)

            NavigationLink(destination: InsightEngineView()) {
                compactEntryCard(
                    icon: "sparkles",
                    title: "洞察引擎",
                    subtitle: "洞察生成与推演",
                    accent: .liquidGlassAccent
                )
            }
            .buttonStyle(.plain)
        }
    }

    private func compactEntryCard(icon: String, title: String, subtitle: String, accent: Color) -> some View {
        LiquidGlassCard(style: .standard, padding: 14) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: icon)
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
            }
        }
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
                    analysisSummaryCard
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

    private var analysisSummaryCard: some View {
        let insights = bodyAnalysisInsights
        let actions = bodyAnalysisActions

        return LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("AI 身体分析建议")
                    .font(.headline)
                    .foregroundColor(.textPrimary)

                if insights.isEmpty {
                    Text("当前数据不足以生成深入分析，请先完成评估与每日校准。")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                } else {
                    ForEach(insights, id: \.self) { item in
                        Text("• \(item)")
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                    }
                }

                if !actions.isEmpty {
                    Divider().opacity(0.3)
                    Text("你可以这样做")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                    ForEach(actions, id: \.self) { action in
                        Text("• \(action)")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                }
            }
        }
    }

    private var bodyAnalysisInsights: [String] {
        var insights: [String] = []
        if let summary = analysis?.dashboardData.summaryStats {
            insights.append("整体改善趋势：\(summary.overallImprovement)，说明恢复方向正在建立。")
            insights.append("一致性：\(summary.consistencyScore)，规律性是当前最关键的增长点。")
        }

        let assessments = analysis?.dashboardData.baselineData.assessments ?? []
        for item in assessments {
            if item.name.contains("GAD") || item.name.contains("PHQ") || item.name.contains("ISI") {
                insights.append("\(item.name)：\(item.interpretation)，建议重点关注情绪与睡眠节律。")
                break
            }
        }

        return insights
    }

    private var bodyAnalysisActions: [String] {
        var actions: [String] = []
        if let summary = analysis?.dashboardData.summaryStats {
            if summary.daysToFirstResult > 0 {
                actions.append("连续记录与校准 7 天以上，提升模型准确度。")
            }
        }
        if actions.isEmpty {
            actions.append("每天固定 1 个可执行小动作（如 10 分钟慢呼吸或短时步行）。")
        }
        actions.append("睡前 1 小时减少屏幕刺激，稳定入睡时间。")
        return actions
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
