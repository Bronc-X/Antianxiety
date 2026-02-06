// CoreHubView.swift
// 核心功能中枢与关键模块视图

import SwiftUI

// MARK: - 核心功能中枢

struct CoreHubView: View {
    @Environment(\.screenMetrics) private var metrics

    private let modules: [CoreHubModule] = [
        CoreHubModule(
            id: "daily-questionnaire",
            title: "每日问询",
            subtitle: "快速校准 + 生理状态刷新",
            icon: "clipboard.fill",
            accent: .liquidGlassAccent,
            destination: AnyView(CalibrationView())
        ),
        CoreHubModule(
            id: "bayesian-loop",
            title: "贝叶斯循环",
            subtitle: "信念修正 + 证据堆栈",
            icon: "brain.head.profile",
            accent: .liquidGlassWarm,
            destination: AnyView(BayesianLoopView())
        ),
        CoreHubModule(
            id: "inquiry-center",
            title: "问询中心",
            subtitle: "待答问询 + 主动追问",
            icon: "bubble.left.and.bubble.right.fill",
            accent: .liquidGlassSecondary,
            destination: AnyView(InquiryCenterView())
        ),
        CoreHubModule(
            id: "clinical-assessment",
            title: "临床评估",
            subtitle: "GAD-7 / PHQ-9 / ISI",
            icon: "stethoscope",
            accent: .liquidGlassSecondary,
            destination: AnyView(AssessmentView())
        ),
        CoreHubModule(
            id: "wearables",
            title: "穿戴设备",
            subtitle: "HRV / 心率 / 睡眠同步",
            icon: "applewatch",
            accent: .liquidGlassAccent,
            destination: AnyView(WearableConnectView(viewModel: WearableConnectViewModel()))
        ),
        CoreHubModule(
            id: "voice-analysis",
            title: "语音分析",
            subtitle: "语音状态解析 + 压力线索",
            icon: "mic.fill",
            accent: .liquidGlassPrimary,
            destination: AnyView(VoiceAnalysisView())
        ),
        CoreHubModule(
            id: "max-labs",
            title: "Max Labs",
            subtitle: "Max API 调试与工具",
            icon: "sparkles",
            accent: .liquidGlassPurple,
            destination: AnyView(MaxLabsView())
        ),
        CoreHubModule(
            id: "adaptive-onboarding",
            title: "自适应引导",
            subtitle: "目标推荐 + 阶段调整",
            icon: "person.badge.shield.checkmark",
            accent: .statusSuccess,
            destination: AnyView(AdaptiveOnboardingView())
        ),
        CoreHubModule(
            id: "core-insight",
            title: "洞察引擎",
            subtitle: "洞察生成 + 深度推演",
            icon: "layers.fill",
            accent: .liquidGlassAccent,
            destination: AnyView(InsightEngineView())
        ),
        CoreHubModule(
            id: "curated-feed",
            title: "科学期刊",
            subtitle: "可信内容流 + 反馈回路",
            icon: "book.closed.fill",
            accent: .liquidGlassWarm,
            destination: AnyView(ScienceFeedView())
        ),
        CoreHubModule(
            id: "debug-session",
            title: "调试会话",
            subtitle: "诊断信息 + 环境快照",
            icon: "ladybug.fill",
            accent: .textSecondary,
            destination: AnyView(DebugSessionView())
        )
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                AuroraBackground()

                ScrollView {
                    VStack(spacing: metrics.sectionSpacing) {
                        header

                        ForEach(modules) { module in
                            NavigationLink(destination: module.destination) {
                                CoreHubModuleCard(module: module)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .liquidGlassPageWidth()
                    .padding(.vertical, metrics.verticalPadding)
                }
            }
            .navigationTitle("核心功能")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Core Hub")
                .font(GlassTypography.display(26, weight: .bold))
                .foregroundColor(.textPrimary)
            Text("连接全部关键模块，保持功能完整对齐")
                .font(GlassTypography.caption(13))
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }
}

private struct CoreHubModule: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let icon: String
    let accent: Color
    let destination: AnyView
}

private struct CoreHubModuleCard: View {
    let module: CoreHubModule

    var body: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(module.accent.opacity(0.18))
                        .frame(width: 48, height: 48)
                    Image(systemName: module.icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(module.accent)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(module.title)
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Text(module.subtitle)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }

                Spacer()

                StatusPill(text: "Ready", color: module.accent)
            }
        }
    }
}

// MARK: - Bayesian Loop

struct BayesianLoopView: View {
    @StateObject private var viewModel = BayesianLoopViewModel()
    @Environment(\.screenMetrics) private var metrics
    @State private var ritualContext: BeliefContext = .metabolicCrash
    @State private var priorScore: Double = 60
    @State private var customQuery: String = ""

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header
                    rangePicker

                    if let summary = viewModel.summary {
                        summaryCard(summary)
                    }

                    historySection
                    evidenceSection
                    nudgeSection
                    ritualSection
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("贝叶斯循环")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadHistory()
        }
        .onChange(of: viewModel.range) { _ in
            Task { await viewModel.loadHistory() }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("信念更新与证据堆栈")
                .font(GlassTypography.title(20, weight: .semibold))
                .foregroundColor(.textPrimary)
            Text("追踪 Prior → Posterior 变化，展示证据来源")
                .font(GlassTypography.caption(12))
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var rangePicker: some View {
        Picker("范围", selection: $viewModel.range) {
            ForEach(BayesianHistoryRange.allCases) { range in
                Text(range.displayName).tag(range)
            }
        }
        .pickerStyle(.segmented)
    }

    private func summaryCard(_ summary: BayesianHistorySummary) -> some View {
        LiquidGlassCard(style: .elevated, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("趋势概览")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                    StatusPill(text: summary.trendLabel, color: summary.trendColor)
                }

                HStack(spacing: 12) {
                    SummaryMetric(title: "平均 Prior", value: summary.averagePriorText)
                    SummaryMetric(title: "平均 Posterior", value: summary.averagePosteriorText)
                    SummaryMetric(title: "平均下降", value: summary.averageReductionText)
                }

                Text("累计记录：\(summary.totalEntries) 条")
                    .font(.caption)
                    .foregroundColor(.textSecondary)
            }
        }
    }

    private var historySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "最近记录", icon: "clock.fill")

            if let error = viewModel.error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.statusError)
            }

            if viewModel.points.isEmpty {
                LiquidGlassCard(style: .standard, padding: 16) {
                    Text("暂无历史记录，请先完成认知校准")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            } else {
                VStack(spacing: 12) {
                    ForEach(viewModel.points.suffix(8)) { point in
                        Button {
                            viewModel.select(point)
                        } label: {
                            LiquidGlassCard(style: .standard, padding: 14) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(point.beliefContextText)
                                            .font(.subheadline)
                                            .foregroundColor(.textPrimary)
                                        Text(point.dateDisplay)
                                            .font(.caption2)
                                            .foregroundColor(.textTertiary)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text("\(point.priorScore) → \(point.posteriorScore)")
                                            .font(.headline)
                                            .foregroundColor(.textPrimary)
                                        Text("夸大倍数 \(point.exaggerationText)")
                                            .font(.caption2)
                                            .foregroundColor(.textSecondary)
                                    }
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var evidenceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "证据堆栈", icon: "tray.full.fill")

            if let selected = viewModel.selectedPoint,
               let evidence = selected.evidenceStack,
               !evidence.isEmpty {
                LiquidGlassCard(style: .standard, padding: 16) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("\(selected.beliefContextText) · 共 \(evidence.count) 条")
                            .font(.caption)
                            .foregroundColor(.textSecondary)

                        ForEach(evidence.prefix(6)) { item in
                            EvidenceRow(item: item)
                        }
                    }
                }
            } else {
                LiquidGlassCard(style: .standard, padding: 16) {
                    Text("选择一条记录查看证据明细")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        }
    }

    private var nudgeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "微调动作", icon: "sparkles")

            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("完成一次行为即可触发微调")
                        .font(.caption)
                        .foregroundColor(.textSecondary)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(BayesianNudgeAction.allCases) { action in
                            Button {
                                Task { await viewModel.triggerNudge(action: action) }
                            } label: {
                                Text(action.label)
                                    .font(.caption.bold())
                                    .foregroundColor(.textPrimary)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.surfaceGlass(for: .dark))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if let message = viewModel.nudgeMessage {
                        Text(message)
                            .font(.caption)
                            .foregroundColor(.statusSuccess)
                    }
                }
            }
        }
    }

    private var ritualSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "主动认知校准", icon: "waveform.path.ecg")

            LiquidGlassCard(style: .elevated, padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("选择场景并给出主观恐惧值")
                        .font(.caption)
                        .foregroundColor(.textSecondary)

                    Picker("场景", selection: $ritualContext) {
                        ForEach(BeliefContext.allCases) { context in
                            Text(context.displayName).tag(context)
                        }
                    }
                    .pickerStyle(.segmented)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("当前恐惧值：\(Int(priorScore))")
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                        Slider(value: $priorScore, in: 0...100, step: 1)
                            .tint(.liquidGlassAccent)
                    }

                    if ritualContext == .custom {
                        TextField("自定义问题（可选）", text: $customQuery)
                            .textFieldStyle(.plain)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Color.surfaceGlass(for: .dark))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .foregroundColor(.textPrimary)
                    }

                    Button {
                        Task { await viewModel.runRitual(context: ritualContext, prior: Int(priorScore), customQuery: customQuery) }
                    } label: {
                        Text(viewModel.isRitualLoading ? "分析中..." : "开始校准")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                    .disabled(viewModel.isRitualLoading)

                    if let ritual = viewModel.ritualResult {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("校准结果：\(ritual.posteriorScore) / 100")
                                .font(.headline)
                                .foregroundColor(.textPrimary)
                            Text(ritual.message)
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }
                    }

                    if let ritualError = viewModel.ritualError {
                        Text(ritualError)
                            .font(.caption2)
                            .foregroundColor(.statusError)
                    }
                }
            }
        }
    }
}

private struct SummaryMetric: View {
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

private struct EvidenceRow: View {
    let item: EvidenceItem

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(item.type.color)
                .frame(width: 6, height: 6)
                .padding(.top, 6)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.value)
                    .font(.caption)
                    .foregroundColor(.textPrimary)
                if let weight = item.weight {
                    Text("权重 \(String(format: "%.2f", weight))")
                        .font(.caption2)
                        .foregroundColor(.textTertiary)
                }
            }
            Spacer()
        }
    }
}

// MARK: - Inquiry Center

struct InquiryCenterView: View {
    @StateObject private var viewModel = InquiryCenterViewModel()
    @Environment(\.screenMetrics) private var metrics
    @EnvironmentObject private var appSettings: AppSettings
    @State private var pendingAnswer = ""
    @State private var proactiveAnswer = ""

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header
                    pendingSection
                    proactiveSection
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("问询中心")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadPending(language: appSettings.language.rawValue)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("主动问询与数据补全")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("确保你的记录完整、可追溯")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var pendingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "待答问询", icon: "bubble.left")

            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    if let inquiry = viewModel.pendingInquiry {
                        Text(inquiry.questionText)
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)

                        if let options = inquiry.options, !options.isEmpty {
                            ForEach(options, id: \.value) { option in
                                Button {
                                    Task { await viewModel.respondPending(option: option, language: appSettings.language.rawValue) }
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
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        HStack(spacing: 8) {
                            TextField("补充你的回答", text: $pendingAnswer)
                                .textFieldStyle(.plain)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(Color.surfaceGlass(for: .dark))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .foregroundColor(.textPrimary)

                            Button {
                                Task {
                                    await viewModel.respondPendingText(pendingAnswer, language: appSettings.language.rawValue)
                                    pendingAnswer = ""
                                }
                            } label: {
                                Image(systemName: "paperplane.fill")
                                    .foregroundColor(.textPrimary)
                            }
                            .padding(10)
                            .background(Color.brandDeepGreen.opacity(0.3))
                            .clipShape(Circle())
                        }
                    } else {
                        Text("暂无待答问询")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }

                    if let error = viewModel.pendingError {
                        Text(error)
                            .font(.caption2)
                            .foregroundColor(.statusError)
                    }
                }
            }
        }
    }

    private var proactiveSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "主动问询", icon: "sparkles")

            LiquidGlassCard(style: .elevated, padding: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("让 Max 主动补充你的关键数据")
                        .font(.caption)
                        .foregroundColor(.textSecondary)

                    Button {
                        Task { await viewModel.generateProactive(language: appSettings.language.rawValue) }
                    } label: {
                        Text(viewModel.isGenerating ? "生成中..." : "生成问询")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                    .disabled(viewModel.isGenerating)

                    if let proactive = viewModel.proactiveInquiry {
                        Text(proactive.questionText)
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)

                        if let options = proactive.options, !options.isEmpty {
                            ForEach(options, id: \.value) { option in
                                Button {
                                    viewModel.captureProactiveAnswer(option.label)
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
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        HStack(spacing: 8) {
                            TextField("补充你的回答", text: $proactiveAnswer)
                                .textFieldStyle(.plain)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(Color.surfaceGlass(for: .dark))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .foregroundColor(.textPrimary)

                            Button {
                                viewModel.captureProactiveAnswer(proactiveAnswer)
                                proactiveAnswer = ""
                            } label: {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.textPrimary)
                            }
                            .padding(10)
                            .background(Color.brandDeepGreen.opacity(0.3))
                            .clipShape(Circle())
                        }
                    }

                    if let note = viewModel.proactiveNote {
                        Text(note)
                            .font(.caption2)
                            .foregroundColor(.statusSuccess)
                    }
                }
            }
        }
    }
}

// MARK: - Voice Analysis

struct VoiceAnalysisView: View {
    @StateObject private var viewModel = VoiceAnalysisViewModel()
    @Environment(\.screenMetrics) private var metrics
    @State private var showRecorder = false

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header
                    transcriptSection
                    formSection
                    resultSection
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isProcessing {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("语音分析")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showRecorder) {
            VoiceRecorderView { transcript in
                viewModel.transcript = transcript
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("语音解析与状态提取")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("将语音转写并生成状态摘要")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var transcriptSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("语音文本")
                        .font(.subheadline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                    Button {
                        showRecorder = true
                    } label: {
                        Text("语音录入")
                            .font(.caption)
                            .foregroundColor(.liquidGlassAccent)
                    }
                }

                TextEditor(text: $viewModel.transcript)
                    .frame(minHeight: 120)
                    .padding(8)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.textPrimary)

                Button {
                    Task { await viewModel.analyze() }
                } label: {
                    Text("开始解析")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                .disabled(viewModel.transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private var formSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("基础状态补充")
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)

                ForEach(VoiceAnalysisField.allCases) { field in
                    TextField(field.placeholder, text: viewModel.binding(for: field))
                        .textFieldStyle(.plain)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.surfaceGlass(for: .dark))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .foregroundColor(.textPrimary)
                }
            }
        }
    }

    private var resultSection: some View {
        LiquidGlassCard(style: .concave, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("解析结果")
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)

                if let summary = viewModel.summary {
                    Text(summary)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                } else {
                    Text("提交语音后将展示解析摘要")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }

                if let updates = viewModel.formUpdates, !updates.isEmpty {
                    ForEach(updates.keys.sorted(), id: \.self) { key in
                        if let value = updates[key] {
                            HStack {
                                Text(key)
                                    .font(.caption2)
                                    .foregroundColor(.textTertiary)
                                Spacer()
                                Text(value)
                                    .font(.caption)
                                    .foregroundColor(.textPrimary)
                            }
                        }
                    }
                }

                if let error = viewModel.error {
                    Text(error)
                        .font(.caption2)
                        .foregroundColor(.statusError)
                }
            }
        }
    }
}

// MARK: - Insight Engine

struct InsightEngineView: View {
    @StateObject private var viewModel = InsightEngineViewModel()
    @StateObject private var understandingViewModel = UnderstandingScoreViewModel()
    @Environment(\.screenMetrics) private var metrics
    @EnvironmentObject private var appSettings: AppSettings

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header
                    insightSection
                    deepInferenceSection
                    understandingSection
                    askMaxSection
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("洞察引擎")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await understandingViewModel.load()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("洞察与解释引擎")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("聚合数据、生成可解释结论")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var insightSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("洞察生成")
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)

                HStack(spacing: 12) {
                    InsightField(title: "睡眠(h)", value: $viewModel.sleepHours)
                    InsightField(title: "HRV", value: $viewModel.hrv)
                }
                HStack(spacing: 12) {
                    InsightField(title: "压力(1-10)", value: $viewModel.stressLevel)
                    InsightField(title: "运动(min)", value: $viewModel.exerciseMinutes)
                }

                HStack(spacing: 10) {
                    Button {
                        Task { await viewModel.generateInsight() }
                    } label: {
                        Text("生成洞察")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                    Button {
                        Task { await viewModel.fetchInsightSummary() }
                    } label: {
                        Text("获取今日洞察")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                }

                if let insight = viewModel.insightText {
                    Text(insight)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }

                if let error = viewModel.insightError {
                    Text(error)
                        .font(.caption2)
                        .foregroundColor(.statusError)
                }
            }
        }
    }

    private var deepInferenceSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("深度推演")
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)

                TextEditor(text: $viewModel.analysisJson)
                    .frame(minHeight: 120)
                    .padding(8)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.textPrimary)

                TextEditor(text: $viewModel.logsJson)
                    .frame(minHeight: 120)
                    .padding(8)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.textPrimary)

                HStack(spacing: 10) {
                    Button {
                        Task { await viewModel.prefillDeepInference() }
                    } label: {
                        Text("使用当前数据")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: false))

                    Button {
                        Task { await viewModel.runDeepInference() }
                    } label: {
                        Text("执行推演")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                }

                if let result = viewModel.inferenceResult {
                    Text(result)
                        .font(.caption2)
                        .foregroundColor(.textSecondary)
                        .lineLimit(6)
                }

                if let error = viewModel.inferenceError {
                    Text(error)
                        .font(.caption2)
                        .foregroundColor(.statusError)
                }
            }
        }
    }

    private var understandingSection: some View {
        LiquidGlassCard(style: .concave, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("理解度评分")
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)

                HStack(alignment: .center, spacing: 12) {
                    Text("\(Int(understandingViewModel.score?.current ?? 0))%")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.textPrimary)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(understandingViewModel.score?.isDeepUnderstanding == true ? "深度理解已达成" : "理解度持续提升")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                        Text(latestDeltaDescription)
                            .font(.caption2)
                            .foregroundColor(.textTertiary)
                    }
                    Spacer()
                }
            }
        }
    }

    private var latestDeltaDescription: String {
        guard let delta = understandingViewModel.latestDelta else {
            return "暂无最近变化"
        }
        return String(format: "最近变化 %+.1f%%", delta)
    }

    private var askMaxSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Max 解释器")
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)

                TextField("推荐 ID", text: $viewModel.recommendationId)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .foregroundColor(.textPrimary)

                TextField("标题", text: $viewModel.recommendationTitle)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .foregroundColor(.textPrimary)

                TextEditor(text: $viewModel.recommendationDescription)
                    .frame(minHeight: 90)
                    .padding(8)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.textPrimary)

                TextEditor(text: $viewModel.recommendationScience)
                    .frame(minHeight: 90)
                    .padding(8)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.textPrimary)

                Button {
                    Task { await viewModel.askMax(language: appSettings.language.rawValue) }
                } label: {
                    Text(viewModel.isAskMaxLoading ? "解释中..." : "让 Max 解释")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                if let explanation = viewModel.maxExplanation {
                    Text(explanation)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .task {
            await viewModel.prefillRecommendationFromDigitalTwin()
        }
    }
}

private struct InsightField: View {
    let title: String
    @Binding var value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.textTertiary)
            TextField("", text: $value)
                .textFieldStyle(.plain)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Color.surfaceGlass(for: .dark))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .foregroundColor(.textPrimary)
        }
    }
}

// MARK: - Max Labs

struct MaxLabsView: View {
    @StateObject private var viewModel = MaxLabsViewModel()
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header
                    payloadSection
                    responseSection
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }

            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .liquidGlassAccent))
            }
        }
        .navigationTitle("Max Labs")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Max API 调试控制台")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("用于验证对话与计划引擎的响应")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var payloadSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Picker("接口", selection: $viewModel.endpoint) {
                    ForEach(MaxLabsEndpoint.allCases) { endpoint in
                        Text(endpoint.displayName).tag(endpoint)
                    }
                }
                .pickerStyle(.segmented)

                TextEditor(text: $viewModel.payload)
                    .frame(minHeight: 140)
                    .padding(8)
                    .background(Color.surfaceGlass(for: .dark))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.textPrimary)

                Button {
                    Task { await viewModel.send() }
                } label: {
                    Text(viewModel.isLoading ? "发送中..." : "发送请求")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            }
        }
    }

    private var responseSection: some View {
        LiquidGlassCard(style: .concave, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Text("响应输出")
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)

                if let response = viewModel.response {
                    Text(response)
                        .font(.caption2)
                        .foregroundColor(.textSecondary)
                } else {
                    Text("请求返回内容会显示在这里")
                        .font(.caption2)
                        .foregroundColor(.textTertiary)
                }

                if let error = viewModel.error {
                    Text(error)
                        .font(.caption2)
                        .foregroundColor(.statusError)
                }
            }
        }
    }
}

// MARK: - Adaptive Onboarding

struct AdaptiveOnboardingView: View {
    @Environment(\.screenMetrics) private var metrics
    @State private var selectedGoal: AdaptiveGoal = .sleep
    @State private var focusIntensity: Double = 0.6
    @State private var timeWindow: String = "08:30"
    @State private var notes: String = ""
    @State private var savedMessage: String?

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("当前目标")
                                .font(.subheadline)
                                .foregroundColor(.textPrimary)

                            Picker("目标", selection: $selectedGoal) {
                                ForEach(AdaptiveGoal.allCases) { goal in
                                    Text(goal.title).tag(goal)
                                }
                            }
                            .pickerStyle(.segmented)

                            VStack(alignment: .leading, spacing: 6) {
                                Text("目标强度：\(Int(focusIntensity * 100))%")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                                Slider(value: $focusIntensity, in: 0.2...1, step: 0.05)
                                    .tint(.liquidGlassAccent)
                            }

                            TextField("每日提醒时间", text: $timeWindow)
                                .textFieldStyle(.plain)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(Color.surfaceGlass(for: .dark))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .foregroundColor(.textPrimary)

                            TextEditor(text: $notes)
                                .frame(minHeight: 80)
                                .padding(8)
                                .background(Color.surfaceGlass(for: .dark))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .foregroundColor(.textPrimary)

                            Button {
                                saveSettings()
                            } label: {
                                Text("保存设置")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                            if let savedMessage {
                                Text(savedMessage)
                                    .font(.caption2)
                                    .foregroundColor(.statusSuccess)
                            }
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("自适应引导")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Max 将根据你的目标自动调整计划")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("此设置会影响每日问询与推荐")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func saveSettings() {
        let defaults = UserDefaults.standard
        defaults.set(selectedGoal.rawValue, forKey: "adaptive_goal")
        defaults.set(focusIntensity, forKey: "adaptive_goal_intensity")
        defaults.set(timeWindow, forKey: "adaptive_goal_time")
        defaults.set(notes, forKey: "adaptive_goal_notes")
        savedMessage = "设置已保存"
    }
}

enum AdaptiveGoal: String, CaseIterable, Identifiable {
    case sleep
    case stress
    case metabolism
    case resilience

    var id: String { rawValue }

    var title: String {
        switch self {
        case .sleep: return "睡眠"
        case .stress: return "压力"
        case .metabolism: return "代谢"
        case .resilience: return "恢复力"
        }
    }
}

// MARK: - Debug Session

struct DebugSessionView: View {
    @StateObject private var viewModel = DebugSessionViewModel()
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header
                    infoSection
                    actionsSection
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("调试会话")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.refresh()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("环境诊断与调试")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text("用于排查 API 与设备状态")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var infoSection: some View {
        LiquidGlassCard(style: .standard, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                DebugRow(title: "当前用户", value: viewModel.userId ?? "未登录")
                DebugRow(title: "App API", value: viewModel.appApiBase ?? "未配置")
                DebugRow(title: "版本", value: viewModel.appVersion)
            }
        }
    }

    private var actionsSection: some View {
        LiquidGlassCard(style: .concave, padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                Button {
                    Task { await viewModel.refresh() }
                } label: {
                    Text("刷新诊断")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                Button {
                    Task { await viewModel.refreshAppAPI() }
                } label: {
                    Text("重新探测 API")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: false))

                if let note = viewModel.statusMessage {
                    Text(note)
                        .font(.caption2)
                        .foregroundColor(.statusSuccess)
                }
            }
        }
    }
}

private struct DebugRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.textSecondary)
            Spacer()
            Text(value)
                .font(.caption)
                .foregroundColor(.textPrimary)
        }
    }
}

// MARK: - View Models & Helpers

@MainActor
final class BayesianLoopViewModel: ObservableObject {
    @Published var range: BayesianHistoryRange = .days30
    @Published var points: [BayesianHistoryPoint] = []
    @Published var summary: BayesianHistorySummary?
    @Published var selectedPoint: BayesianHistoryPoint?
    @Published var isLoading = false
    @Published var error: String?
    @Published var nudgeMessage: String?
    @Published var ritualResult: BayesianRitualResult?
    @Published var ritualError: String?
    @Published var isRitualLoading = false

    private let supabase = SupabaseManager.shared

    func loadHistory() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let response = try await supabase.getBayesianHistory(range: range)
            if response.success, let data = response.data {
                points = data.points
                summary = data.summary
                selectedPoint = points.last
            } else {
                error = response.error ?? "获取历史数据失败"
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func select(_ point: BayesianHistoryPoint) {
        selectedPoint = point
    }

    func triggerNudge(action: BayesianNudgeAction) async {
        nudgeMessage = nil
        do {
            let response = try await supabase.triggerBayesianNudge(actionType: action.apiValue, durationMinutes: 10)
            if response.success, let data = response.data {
                nudgeMessage = data.message
                await loadHistory()
            } else {
                nudgeMessage = response.error ?? "微调失败"
            }
        } catch {
            nudgeMessage = error.localizedDescription
        }
    }

    func runRitual(context: BeliefContext, prior: Int, customQuery: String) async {
        ritualError = nil
        isRitualLoading = true
        defer { isRitualLoading = false }

        do {
            let response = try await supabase.runBayesianRitual(
                context: context.rawValue,
                priorScore: prior,
                customQuery: customQuery.isEmpty ? nil : customQuery
            )
            if response.success, let data = response.data {
                ritualResult = BayesianRitualResult(from: data)
                await loadHistory()
            } else {
                ritualError = response.error ?? "校准失败"
            }
        } catch {
            ritualError = error.localizedDescription
        }
    }
}

@MainActor
final class InquiryCenterViewModel: ObservableObject {
    @Published var pendingInquiry: InquiryQuestion?
    @Published var proactiveInquiry: InquiryQuestion?
    @Published var isLoading = false
    @Published var isGenerating = false
    @Published var pendingError: String?
    @Published var proactiveNote: String?

    private let supabase = SupabaseManager.shared

    func loadPending(language: String) async {
        isLoading = true
        pendingError = nil
        defer { isLoading = false }

        do {
            let response = try await supabase.getPendingInquiry(language: language)
            pendingInquiry = response.hasInquiry ? response.inquiry : nil
        } catch {
            pendingError = error.localizedDescription
        }
    }

    func respondPending(option: InquiryOption, language: String) async {
        await respondPendingText(option.value, language: language)
    }

    func respondPendingText(_ text: String, language: String) async {
        guard let inquiry = pendingInquiry else { return }
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        do {
            _ = try await supabase.respondInquiry(inquiryId: inquiry.id, response: text)
            pendingInquiry = nil
            await loadPending(language: language)
        } catch {
            pendingError = error.localizedDescription
        }
    }

    func generateProactive(language: String) async {
        isGenerating = true
        proactiveNote = nil
        defer { isGenerating = false }

        do {
            proactiveInquiry = try await supabase.generateProactiveInquiry(language: language)
        } catch {
            proactiveNote = error.localizedDescription
        }
    }

    func captureProactiveAnswer(_ answer: String) {
        guard !answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        proactiveNote = "已记录：\(answer)"
    }
}

@MainActor
final class VoiceAnalysisViewModel: ObservableObject {
    @Published var transcript: String = ""
    @Published var formState = VoiceAnalysisFormState()
    @Published var formUpdates: [String: String]?
    @Published var summary: String?
    @Published var error: String?
    @Published var isProcessing = false

    private let supabase = SupabaseManager.shared

    func binding(for field: VoiceAnalysisField) -> Binding<String> {
        switch field {
        case .sleepDuration:
            return Binding(
                get: { self.formState.sleepDuration },
                set: { self.formState.sleepDuration = $0 }
            )
        case .sleepQuality:
            return Binding(
                get: { self.formState.sleepQuality },
                set: { self.formState.sleepQuality = $0 }
            )
        case .exerciseDuration:
            return Binding(
                get: { self.formState.exerciseDuration },
                set: { self.formState.exerciseDuration = $0 }
            )
        case .moodStatus:
            return Binding(
                get: { self.formState.moodStatus },
                set: { self.formState.moodStatus = $0 }
            )
        case .stressLevel:
            return Binding(
                get: { self.formState.stressLevel },
                set: { self.formState.stressLevel = $0 }
            )
        case .notes:
            return Binding(
                get: { self.formState.notes },
                set: { self.formState.notes = $0 }
            )
        }
    }

    func analyze() async {
        error = nil
        isProcessing = true
        defer { isProcessing = false }

        do {
            let response = try await supabase.analyzeVoiceInput(
                VoiceAnalysisInput(transcript: transcript, currentFormState: formState)
            )
            summary = response.summary
            formUpdates = response.formUpdates
        } catch {
            self.error = error.localizedDescription
        }
    }
}

@MainActor
final class InsightEngineViewModel: ObservableObject {
    @Published var sleepHours: String = "7"
    @Published var hrv: String = "55"
    @Published var stressLevel: String = "5"
    @Published var exerciseMinutes: String = "20"

    @Published var insightText: String?
    @Published var insightError: String?

    @Published var analysisJson: String = "{}"
    @Published var logsJson: String = "[]"
    @Published var inferenceResult: String?
    @Published var inferenceError: String?

    @Published var recommendationId: String = "rec-demo"
    @Published var recommendationTitle: String = "睡眠一致性"
    @Published var recommendationDescription: String = "将入睡时间稳定在同一小时区间。"
    @Published var recommendationScience: String = "昼夜节律稳定性与压力恢复有关。"
    @Published var maxExplanation: String?
    @Published var isAskMaxLoading = false
    @Published var isLoading = false

    private var didPrefillRecommendation = false

    private let supabase = SupabaseManager.shared

    func generateInsight() async {
        insightError = nil
        insightText = nil
        isLoading = true
        defer { isLoading = false }

        guard let payload = InsightGenerateInput(
            sleepHours: Double(sleepHours) ?? 0,
            hrv: Double(hrv) ?? 0,
            stressLevel: Double(stressLevel) ?? 0,
            exerciseMinutes: Double(exerciseMinutes)
        ) else {
            insightError = "请输入有效数值"
            return
        }

        do {
            insightText = try await supabase.generateInsight(payload)
        } catch {
            insightError = error.localizedDescription
        }
    }

    func fetchInsightSummary() async {
        insightError = nil
        insightText = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let response = try await supabase.fetchInsightSummary()
            insightText = response.insight
        } catch {
            insightError = error.localizedDescription
        }
    }

    func prefillDeepInference() async {
        do {
            let analysis = try await supabase.getDigitalTwinAnalysis()
            let logs = try await supabase.getWeeklyWellnessLogs()

            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

            if let analysisData = try? encoder.encode(analysis),
               let analysisString = String(data: analysisData, encoding: .utf8) {
                analysisJson = analysisString
            }

            if let logsData = try? encoder.encode(logs),
               let logsString = String(data: logsData, encoding: .utf8) {
                logsJson = logsString
            }
        } catch {
            inferenceError = error.localizedDescription
        }
    }

    func runDeepInference() async {
        inferenceError = nil
        inferenceResult = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let analysisObject = try JSONSerialization.jsonObject(with: Data(analysisJson.utf8))
            let logsObject = try JSONSerialization.jsonObject(with: Data(logsJson.utf8))

            let analysisResult = analysisObject as? [String: Any] ?? [:]
            let recentLogs = logsObject as? [[String: Any]] ?? []

            inferenceResult = try await supabase.getDeepInference(analysisResult: analysisResult, recentLogs: recentLogs)
        } catch {
            inferenceError = error.localizedDescription
        }
    }

    func askMax(language: String) async {
        isAskMaxLoading = true
        defer { isAskMaxLoading = false }

        do {
            maxExplanation = try await supabase.explainRecommendation(
                recommendationId: recommendationId,
                title: recommendationTitle,
                description: recommendationDescription,
                science: recommendationScience,
                language: language
            )
        } catch {
            maxExplanation = error.localizedDescription
        }
    }

    func prefillRecommendationFromDigitalTwin() async {
        guard !didPrefillRecommendation else { return }
        guard recommendationId == "rec-demo" else { return }

        do {
            let payload = try await supabase.getDigitalTwinDashboard()
            guard let plan = payload.adaptivePlan else { return }

            if let focus = plan.dailyFocus.first {
                recommendationId = "focus-\(focus.area)"
                recommendationTitle = focus.action
                recommendationDescription = focus.rationale
                recommendationScience = focus.scientificBasis ?? ""
                didPrefillRecommendation = true
                return
            }

            if let sleep = plan.sleepRecommendations.first {
                recommendationId = "sleep-\(sleep.recommendation)"
                recommendationTitle = sleep.recommendation
                recommendationDescription = sleep.reason
                recommendationScience = sleep.expectedImpact
                didPrefillRecommendation = true
                return
            }

            if let activity = plan.activitySuggestions.first {
                recommendationId = "activity-\(activity.activity)"
                recommendationTitle = activity.activity
                recommendationDescription = "\(activity.frequency) · \(activity.duration)"
                recommendationScience = activity.benefit
                didPrefillRecommendation = true
            }
        } catch {
            // Keep defaults if API unavailable
        }
    }
}

@MainActor
final class MaxLabsViewModel: ObservableObject {
    @Published var endpoint: MaxLabsEndpoint = .chat
    @Published var payload: String = "{\n  \"message\": \"hello\"\n}"
    @Published var response: String?
    @Published var error: String?
    @Published var isLoading = false

    private let supabase = SupabaseManager.shared

    func send() async {
        error = nil
        response = nil
        isLoading = true
        defer { isLoading = false }

        do {
            response = try await supabase.sendDebugPayload(path: endpoint.path, payload: payload)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

@MainActor
final class DebugSessionViewModel: ObservableObject {
    @Published var userId: String?
    @Published var appApiBase: String?
    @Published var appVersion: String = "-"
    @Published var statusMessage: String?

    private let supabase = SupabaseManager.shared

    func refresh() async {
        userId = supabase.currentUser?.id
        appApiBase = supabase.currentAppAPIBaseURLString()
        appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "-"
        statusMessage = "已刷新 \(Date().formatted(date: .abbreviated, time: .shortened))"
    }

    func refreshAppAPI() async {
        await supabase.refreshAppAPIBaseURL()
        await refresh()
    }
}

// MARK: - Supporting Types

enum BayesianHistoryRange: String, CaseIterable, Identifiable {
    case days7 = "7d"
    case days30 = "30d"
    case days90 = "90d"
    case all = "all"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .days7: return "7D"
        case .days30: return "30D"
        case .days90: return "90D"
        case .all: return "ALL"
        }
    }
}

enum BayesianNudgeAction: String, CaseIterable, Identifiable {
    case breathing
    case meditation
    case exercise
    case sleep
    case hydration
    case journaling
    case stretching

    var id: String { rawValue }

    var label: String {
        switch self {
        case .breathing: return "呼吸"
        case .meditation: return "冥想"
        case .exercise: return "运动"
        case .sleep: return "睡眠"
        case .hydration: return "补水"
        case .journaling: return "记录"
        case .stretching: return "拉伸"
        }
    }

    var apiValue: String {
        switch self {
        case .breathing: return "breathing_exercise"
        case .meditation: return "meditation"
        case .exercise: return "exercise"
        case .sleep: return "sleep_improvement"
        case .hydration: return "hydration"
        case .journaling: return "journaling"
        case .stretching: return "stretching"
        }
    }
}

enum BeliefContext: String, CaseIterable, Identifiable {
    case metabolicCrash = "metabolic_crash"
    case cardiacEvent = "cardiac_event"
    case socialRejection = "social_rejection"
    case custom = "custom"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .metabolicCrash: return "代谢"
        case .cardiacEvent: return "心脏"
        case .socialRejection: return "社交"
        case .custom: return "自定义"
        }
    }
}

enum VoiceAnalysisField: String, CaseIterable, Identifiable {
    case sleepDuration
    case sleepQuality
    case exerciseDuration
    case moodStatus
    case stressLevel
    case notes

    var id: String { rawValue }

    var placeholder: String {
        switch self {
        case .sleepDuration: return "睡眠时长 (分钟)"
        case .sleepQuality: return "睡眠质量"
        case .exerciseDuration: return "运动时长 (分钟)"
        case .moodStatus: return "情绪状态"
        case .stressLevel: return "压力等级"
        case .notes: return "补充说明"
        }
    }
}

enum MaxLabsEndpoint: String, CaseIterable, Identifiable {
    case chat
    case planChat
    case bayesianRitual

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .chat: return "Chat"
        case .planChat: return "Plan Chat"
        case .bayesianRitual: return "Ritual"
        }
    }

    var path: String {
        switch self {
        case .chat: return "api/chat"
        case .planChat: return "api/max/plan-chat"
        case .bayesianRitual: return "api/bayesian/ritual"
        }
    }
}

struct VoiceAnalysisFormState: Codable {
    var sleepDuration: String = ""
    var sleepQuality: String = ""
    var exerciseDuration: String = ""
    var moodStatus: String = ""
    var stressLevel: String = ""
    var notes: String = ""
}

struct VoiceAnalysisInput: Codable {
    let transcript: String
    let currentFormState: VoiceAnalysisFormState

    enum CodingKeys: String, CodingKey {
        case transcript
        case currentFormState = "currentFormState"
    }
}

struct VoiceAnalysisResponse: Codable {
    let formUpdates: [String: String]
    let summary: String
    let confidence: Double
}

struct InsightGenerateInput: Codable {
    let sleepHours: Double
    let hrv: Double
    let stressLevel: Double
    let exerciseMinutes: Double?

    enum CodingKeys: String, CodingKey {
        case sleepHours = "sleep_hours"
        case hrv
        case stressLevel = "stress_level"
        case exerciseMinutes = "exercise_minutes"
    }

    init?(sleepHours: Double, hrv: Double, stressLevel: Double, exerciseMinutes: Double?) {
        guard sleepHours >= 0, hrv >= 0, stressLevel >= 0 else { return nil }
        self.sleepHours = sleepHours
        self.hrv = hrv
        self.stressLevel = stressLevel
        self.exerciseMinutes = exerciseMinutes
    }
}

struct InsightSummaryResponse: Codable {
    let insight: String
}

struct BayesianHistoryResponse: Codable {
    let success: Bool
    let data: BayesianHistoryData?
    let error: String?
}

struct BayesianHistoryData: Codable {
    let points: [BayesianHistoryPoint]
    let summary: BayesianHistorySummary
}

struct BayesianHistoryPoint: Codable, Identifiable {
    let id: String
    let date: String
    let beliefContext: String?
    let priorScore: Double
    let posteriorScore: Double
    let evidenceStack: [EvidenceItem]?
    let exaggerationFactor: Double?

    enum CodingKeys: String, CodingKey {
        case id
        case date
        case beliefContext = "belief_context"
        case priorScore = "prior_score"
        case posteriorScore = "posterior_score"
        case evidenceStack = "evidence_stack"
        case exaggerationFactor = "exaggeration_factor"
    }

    var beliefContextText: String {
        switch beliefContext {
        case "metabolic_crash": return "代谢崩溃"
        case "cardiac_event": return "心脏事件"
        case "social_rejection": return "社交被拒"
        case "custom": return "自定义"
        default: return beliefContext ?? "未知场景"
        }
    }

    var dateDisplay: String {
        date.replacingOccurrences(of: "T", with: " ").prefix(16).description
    }

    var exaggerationText: String {
        guard let value = exaggerationFactor else { return "-" }
        return String(format: "%.1fx", value)
    }
}

struct BayesianHistorySummary: Codable {
    let totalEntries: Int
    let averagePrior: Double
    let averagePosterior: Double
    let averageReduction: Double
    let trend: String

    enum CodingKeys: String, CodingKey {
        case totalEntries = "total_entries"
        case averagePrior = "average_prior"
        case averagePosterior = "average_posterior"
        case averageReduction = "average_reduction"
        case trend
    }

    var trendLabel: String {
        switch trend {
        case "improving": return "改善"
        case "worsening": return "恶化"
        default: return "稳定"
        }
    }

    var trendColor: Color {
        switch trend {
        case "improving": return .statusSuccess
        case "worsening": return .statusError
        default: return .liquidGlassWarm
        }
    }

    var averagePriorText: String { String(format: "%.1f", averagePrior) }
    var averagePosteriorText: String { String(format: "%.1f", averagePosterior) }
    var averageReductionText: String { String(format: "%.1f", averageReduction) }
}

struct BayesianNudgeResponse: Codable {
    let success: Bool
    let data: BayesianNudgeData?
    let error: String?
}

struct BayesianNudgeData: Codable {
    let correction: Double
    let newPosterior: Double
    let message: String

    enum CodingKeys: String, CodingKey {
        case correction
        case newPosterior = "new_posterior"
        case message
    }
}

struct BayesianRitualResponse: Codable {
    let success: Bool
    let data: BayesianRitualData?
    let error: String?
}

struct BayesianRitualData: Codable {
    let id: String
    let priorScore: Double
    let posteriorScore: Double
    let evidenceStack: [EvidenceItem]
    let exaggerationFactor: Double
    let message: String

    enum CodingKeys: String, CodingKey {
        case id
        case priorScore = "prior_score"
        case posteriorScore = "posterior_score"
        case evidenceStack = "evidence_stack"
        case exaggerationFactor = "exaggeration_factor"
        case message
    }
}

struct BayesianRitualResult {
    let posteriorScore: Int
    let message: String

    init(from data: BayesianRitualData) {
        posteriorScore = Int(data.posteriorScore)
        message = data.message
    }
}

extension EvidenceType {
    var color: Color {
        switch self {
        case .bio: return .liquidGlassAccent
        case .science: return .liquidGlassWarm
        case .action: return .statusSuccess
        }
    }
}

struct ProactiveInquiryResponse: Codable {
    let question: InquiryQuestion?
}
