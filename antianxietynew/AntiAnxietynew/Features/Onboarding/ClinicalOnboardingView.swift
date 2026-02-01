// ClinicalOnboardingView.swift
// 临床量表引导 - GAD-7 / PHQ-9 / ISI

import SwiftUI

// MARK: - Models

struct ClinicalScaleQuestion: Identifiable {
    let id = UUID()
    let text: String
    let options: [String]
    let values: [Int]
}

struct ScaleInfo {
    let name: String
    let fullName: String
    let description: String
}

let scaleInfoDict: [String: ScaleInfo] = [
    "GAD7": ScaleInfo(name: "GAD-7", fullName: "广泛性焦虑障碍量表-7", description: "焦虑筛查工具"),
    "PHQ9": ScaleInfo(name: "PHQ-9", fullName: "患者健康问卷-9", description: "抑郁筛查工具"),
    "ISI": ScaleInfo(name: "ISI", fullName: "失眠严重程度指数", description: "失眠评估工具")
]

enum ClinicalPhase {
    case welcome, questions, encouragement, safety, complete
}

// MARK: - 矢量呼吸 Logo

struct BreathingLogo: View {
    @State private var breathe = false
    var size: CGFloat = 100
    var color: Color = .liquidGlassAccent
    
    var body: some View {
        ZStack {
            // 外圈脉动
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .stroke(color.opacity(0.15 - Double(i) * 0.04), lineWidth: 1.5)
                    .frame(width: size + CGFloat(i) * 30, height: size + CGFloat(i) * 30)
                    .scaleEffect(breathe ? 1.1 : 0.95)
                    .opacity(breathe ? 0.3 : 0.6)
                    .animation(
                        .easeInOut(duration: 2.5 + Double(i) * 0.3)
                        .repeatForever(autoreverses: true)
                        .delay(Double(i) * 0.2),
                        value: breathe
                    )
            }
            
            // 中心光晕
            Circle()
                .fill(
                    RadialGradient(
                        colors: [color.opacity(0.3), color.opacity(0.05), .clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: size * 0.6
                    )
                )
                .frame(width: size, height: size)
                .scaleEffect(breathe ? 1.15 : 0.9)
                .animation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true), value: breathe)
            
            // 核心圆
            Circle()
                .fill(color.opacity(0.25))
                .frame(width: size * 0.4, height: size * 0.4)
                .blur(radius: 8)
                .scaleEffect(breathe ? 1.1 : 0.85)
                .animation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true), value: breathe)
            
            // 最内圈
            Circle()
                .fill(color)
                .frame(width: size * 0.15, height: size * 0.15)
                .shadow(color: color.opacity(0.5), radius: 10)
        }
        .onAppear { breathe = true }
    }
}

// MARK: - ViewModel

@MainActor
class ClinicalOnboardingViewModel: ObservableObject {
    @Published var phase: ClinicalPhase = .welcome
    @Published var currentPage: Int = 0
    @Published var isLoading = false
    @Published var error: String?
    @Published var answers: [UUID: Int] = [:]
    @Published var safetyTriggered = false
    @Published var showScaleInfo = false
    
    let questionsPerPage = 4
    let encouragementPages: Set<Int> = [1, 3]
    
    var allQuestions: [ClinicalScaleQuestion] { gad7Questions + phq9Questions + isiQuestions }
    var totalPages: Int { Int(ceil(Double(allQuestions.count) / Double(questionsPerPage))) }
    
    var currentPageQuestions: [ClinicalScaleQuestion] {
        let start = currentPage * questionsPerPage
        let end = min(start + questionsPerPage, allQuestions.count)
        return start < allQuestions.count ? Array(allQuestions[start..<end]) : []
    }
    
    var currentOptionLabels: [String] { currentPageQuestions.first?.options ?? [] }
    var isPageComplete: Bool { currentPageQuestions.allSatisfy { answers[$0.id] != nil } }
    var progressPercent: Double { (Double(answers.count) / Double(allQuestions.count)) * 100 }
    
    var currentScaleId: String {
        let idx = currentPage * questionsPerPage
        if idx < 7 { return "GAD7" }
        else if idx < 16 { return "PHQ9" }
        else { return "ISI" }
    }
    
    var currentScaleInfo: ScaleInfo? { scaleInfoDict[currentScaleId] }
    
    let gad7Questions = ["感觉紧张、焦虑或急切", "不能停止或控制担忧", "对各种各样的事情担忧过多", "很难放松下来", "由于坐立不安而无法静坐", "变得容易烦恼或急躁", "感到似乎将有可怕的事情发生"].map { ClinicalScaleQuestion(text: $0, options: ["完全不会", "好几天", "一半以上", "几乎每天"], values: [0, 1, 2, 3]) }
    
    let phq9Questions = ["做事时提不起劲或没有兴趣", "感到心情低落、沮丧或绝望", "入睡困难、睡不安稳或睡眠过多", "感到疲倦或没有活力", "胃口不好或吃得太多", "对自己感到不满，觉得自己是失败者", "专注力难以集中", "行动或说话速度变化明显", "有不如死掉或伤害自己的念头"].map { ClinicalScaleQuestion(text: $0, options: ["完全不会", "好几天", "一半以上", "几乎每天"], values: [0, 1, 2, 3]) }
    
    let isiQuestions = ["入睡困难的严重程度", "维持睡眠困难的严重程度", "早醒的严重程度", "对当前睡眠模式的满意度", "睡眠问题对日间功能的影响", "他人注意到您的睡眠问题", "对自己睡眠问题的担忧程度"].map { ClinicalScaleQuestion(text: $0, options: ["无", "轻微", "中度", "重度", "极重"], values: [0, 1, 2, 3, 4]) }
    
    func start() { withAnimation { phase = .questions } }
    
    func answer(questionId: UUID, value: Int, globalIndex: Int) {
        withAnimation { answers[questionId] = value }
        if globalIndex == 15 && value >= 1 {
            safetyTriggered = true
            withAnimation { phase = .safety }
        }
    }
    
    func continueFromSafety() { withAnimation { phase = .questions } }
    func goBackFromSafety() { withAnimation { phase = .questions } }
    
    func nextPage() {
        guard isPageComplete else { return }
        if currentPage >= totalPages - 1 { submitResults(); return }
        if encouragementPages.contains(currentPage) { withAnimation { phase = .encouragement }; return }
        withAnimation { currentPage += 1 }
    }
    
    func prevPage() { guard currentPage > 0 else { return }; withAnimation { currentPage -= 1 } }
    func continueFromEncouragement() { withAnimation { currentPage += 1; phase = .questions } }
    func goBackFromEncouragement() { withAnimation { phase = .questions } }
    
    private func submitResults() {
        isLoading = true
        let gad7 = gad7Questions.compactMap { answers[$0.id] }.reduce(0, +)
        let phq9 = phq9Questions.compactMap { answers[$0.id] }.reduce(0, +)
        let isi = isiQuestions.compactMap { answers[$0.id] }.reduce(0, +)
        let scores = ["gad7": gad7, "phq9": phq9, "isi": isi, "pss10": 0]
        
        print("[ClinicalOnboarding] 准备保存分数: \(scores)")
        
        Task {
            do {
                guard let user = SupabaseManager.shared.currentUser else {
                    print("[ClinicalOnboarding] ❌ 无用户，跳过保存")
                    await MainActor.run { isLoading = false; phase = .complete }
                    return
                }
                print("[ClinicalOnboarding] 用户 ID: \(user.id)")
                try await SupabaseManager.shared.upsertClinicalScores(scores)
                print("[ClinicalOnboarding] ✅ 分数已保存到 Supabase")
                print("[ClinicalOnboarding] ✅ isClinicalComplete 已设置为 true")
                await MainActor.run { isLoading = false; phase = .complete }
            } catch {
                print("[ClinicalOnboarding] ❌ 保存失败: \(error)")
                await MainActor.run { self.error = error.localizedDescription; isLoading = false; phase = .complete }
            }
        }
    }
}

// MARK: - Main View

struct ClinicalOnboardingView: View {
    @StateObject private var viewModel = ClinicalOnboardingViewModel()
    @Binding var isComplete: Bool
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        GeometryReader { geo in
            ZStack {
                AbyssBackground()
                mainContent(geo: geo)
                if viewModel.isLoading { loadingView }
            }
            .ignoresSafeArea(.container, edges: .top)
        }
        .animation(.easeInOut, value: viewModel.phase)
        .sheet(isPresented: $viewModel.showScaleInfo) { scaleInfoSheet }
    }
    
    @ViewBuilder
    private func mainContent(geo: GeometryProxy) -> some View {
        switch viewModel.phase {
        case .welcome: welcomeView(geo: geo)
        case .questions: questionsView(geo: geo)
        case .encouragement: encouragementView(geo: geo)
        case .safety: safetyView(geo: geo)
        case .complete: completeView(geo: geo)
        }
    }
    
    // MARK: - Welcome
    
    private func welcomeView(geo: GeometryProxy) -> some View {
        VStack(spacing: 24) {
            Spacer()
            
            BreathingLogo(size: 140, color: .liquidGlassAccent)
                .frame(height: 180)
            
            Text("基础健康评估")
                .font(.largeTitle.bold())
                .foregroundColor(.white)
            
            Text("为了为您构建最准确的数字孪生模型，\n我们需要了解您当前的基础状态。")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.textSecondary)
                .padding(.horizontal, 32)
            
            VStack(spacing: 12) {
                scaleRow("GAD-7", "焦虑评估", 7)
                scaleRow("PHQ-9", "情绪评估", 9)
                scaleRow("ISI", "睡眠评估", 7)
            }
            .padding(.horizontal, 40)
            
            Spacer()
            
            Button(action: { viewModel.start() }) {
                Text("开始评估")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .padding(.horizontal, 24)
            .padding(.bottom, metrics.safeAreaInsets.bottom + 24)
        }
    }
    

    private func scaleRow(_ name: String, _ desc: String, _ count: Int) -> some View {
        HStack {
            Text(name)
                .font(.system(size: 14, weight: .bold, design: .monospaced))
                .foregroundColor(.liquidGlassAccent)
                .frame(width: 60, alignment: .leading)
            Text(desc)
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.8))
            Spacer()
            Text("\(count)题")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 16)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.05)))
    }
    
    // MARK: - Questions (全屏铺满，动态宽度)
    
    private func questionsView(geo: GeometryProxy) -> some View {
        let screenWidth = metrics.safeWidth
        let horizontalPadding: CGFloat = metrics.isCompactWidth ? 14 : 16
        let contentWidth = max(0, screenWidth - horizontalPadding * 2)
        let rowHorizontalInset: CGFloat = 12
        let availableWidth = max(0, contentWidth - rowHorizontalInset * 2)
        let optionCount = max(viewModel.currentOptionLabels.count, viewModel.currentPageQuestions.map(\.values.count).max() ?? 4)
        let optionSpacing: CGFloat = 8
        let minOptionWidth: CGFloat = metrics.isCompactWidth ? 22 : 26
        let spacingTotal = CGFloat(optionCount) * optionSpacing
        let minOptionsTotal = CGFloat(optionCount) * minOptionWidth
        let maxQuestionWidth = max(80, availableWidth - minOptionsTotal - spacingTotal)
        let questionWidth = min(availableWidth * 0.55, maxQuestionWidth)
        let optionWidth = max(minOptionWidth, (availableWidth - questionWidth - spacingTotal) / CGFloat(optionCount))
        
        return VStack(spacing: 0) {
            // 顶部安全区占位
            Color.clear.frame(height: metrics.safeAreaInsets.top)
            
            // 头部：科学依据 + 页码
            HStack {
                Button(action: { viewModel.showScaleInfo = true }) {
                    HStack(spacing: 6) {
                        Image(systemName: "info.circle.fill")
                        Text(viewModel.currentScaleInfo?.name ?? "")
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.liquidGlassAccent)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(Color.liquidGlassAccent.opacity(0.15)))
                }
                Spacer()
                Text("第 \(viewModel.currentPage + 1) / \(viewModel.totalPages) 页")
                    .font(.caption)
                    .foregroundColor(.textSecondary)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 8)
            
            // 选项标签行
            optionLabelsRow(
                questionWidth: questionWidth,
                optionWidth: optionWidth,
                optionSpacing: optionSpacing,
                rowHorizontalInset: rowHorizontalInset
            )
                .padding(.horizontal, horizontalPadding)
            
            // 问题列表
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(Array(viewModel.currentPageQuestions.enumerated()), id: \.element.id) { idx, q in
                        questionRow(
                            q,
                            globalIndex: viewModel.currentPage * viewModel.questionsPerPage + idx,
                            questionWidth: questionWidth,
                            optionWidth: optionWidth,
                            optionSpacing: optionSpacing,
                            rowHorizontalInset: rowHorizontalInset
                        )
                    }
                }
                .padding(.horizontal, horizontalPadding)
                .padding(.vertical, 16)
            }
            
            // 底部导航按钮
            navigationButtons(geo: geo)
        }
    }
    
    private func optionLabelsRow(
        questionWidth: CGFloat,
        optionWidth: CGFloat,
        optionSpacing: CGFloat,
        rowHorizontalInset: CGFloat
    ) -> some View {
        HStack(spacing: optionSpacing) {
            Text("")
                .frame(width: questionWidth, alignment: .leading)
            ForEach(viewModel.currentOptionLabels, id: \.self) { label in
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.textSecondary)
                    .frame(width: optionWidth)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.horizontal, rowHorizontalInset)
        .padding(.vertical, 8)
    }
    
    private func questionRow(
        _ question: ClinicalScaleQuestion,
        globalIndex: Int,
        questionWidth: CGFloat,
        optionWidth: CGFloat,
        optionSpacing: CGFloat,
        rowHorizontalInset: CGFloat
    ) -> some View {
        HStack(spacing: optionSpacing) {
            // 题号 + 题目（动态宽度）
            HStack(spacing: 4) {
                Text("\(globalIndex + 1).")
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundColor(.textSecondary.opacity(0.6))
                Text(question.text)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(width: questionWidth, alignment: .leading)
            
            // 选项圆圈
            let optionSize = min(28, optionWidth)
            ForEach(Array(question.values.enumerated()), id: \.offset) { _, value in
                Button(action: { viewModel.answer(questionId: question.id, value: value, globalIndex: globalIndex) }) {
                    ZStack {
                        Circle()
                            .stroke(viewModel.answers[question.id] == value ? Color.liquidGlassAccent : Color.white.opacity(0.3), lineWidth: 2)
                            .frame(width: optionSize, height: optionSize)
                        if viewModel.answers[question.id] == value {
                            Circle()
                                .fill(Color.liquidGlassAccent)
                                .frame(width: optionSize * 0.5, height: optionSize * 0.5)
                        }
                    }
                }
                .buttonStyle(.plain)
                .frame(width: optionWidth)
            }
        }
        .padding(.vertical, 16)
        .padding(.horizontal, rowHorizontalInset)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(viewModel.answers[question.id] != nil ? Color.liquidGlassAccent.opacity(0.1) : Color.white.opacity(0.04))
        )
    }
    
    private func navigationButtons(geo: GeometryProxy) -> some View {
        HStack(spacing: 16) {
            if viewModel.currentPage > 0 {
                Button(action: { viewModel.prevPage() }) {
                    Label("上一页", systemImage: "chevron.left")
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
            }
            Button(action: { viewModel.nextPage() }) {
                Text(viewModel.currentPage >= viewModel.totalPages - 1 ? "完成" : "下一页")
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .disabled(!viewModel.isPageComplete)
            .opacity(viewModel.isPageComplete ? 1 : 0.5)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, metrics.safeAreaInsets.bottom + 16)
        .background(
            LinearGradient(
                colors: [Color.bgPrimary.opacity(0), Color.bgPrimary.opacity(0.95)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 100)
            .offset(y: -40)
        )
    }
    
    // MARK: - Encouragement
    
    private func encouragementView(geo: GeometryProxy) -> some View {
        VStack(spacing: 24) {
            Spacer()
            
            HStack {
                Image(systemName: "sparkles")
                Text("已完成 \(Int(viewModel.progressPercent))%")
            }
            .font(.subheadline.weight(.medium))
            .foregroundColor(.liquidGlassAccent)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(Capsule().fill(Color.liquidGlassAccent.opacity(0.15)))
            
            BreathingLogo(size: 120, color: .liquidGlassAccent)
                .frame(height: 150)
            
            Text("进展顺利！")
                .font(.title.bold())
                .foregroundColor(.white)
            
            Text("你做得很棒。感谢你的耐心和真诚，\n这将帮助 Max 更好地了解你。")
                .font(.body)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            
            VStack(spacing: 8) {
                Text("💡 小贴士")
                    .font(.caption.weight(.bold))
                    .foregroundColor(.liquidGlassAccent)
                Text("焦虑往往来源于交感神经系统的反应，\n与你正在经历的事情没有直接关系。\n不要责怪自己。")
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.06)))
            .padding(.horizontal, 32)
            
            Spacer()
            
        HStack(spacing: 16) {
                Button(action: { viewModel.goBackFromEncouragement() }) {
                    Label("返回", systemImage: "chevron.left")
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                
                Button(action: { viewModel.continueFromEncouragement() }) {
                    Label("继续", systemImage: "chevron.right")
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
        }
        .padding(.horizontal, 24)
        .padding(.bottom, metrics.safeAreaInsets.bottom + 24)
    }
    }
    
    // MARK: - Safety
    
    private func safetyView(geo: GeometryProxy) -> some View {
        let bottomPad = metrics.safeAreaInsets.bottom + 24
        
        return ScrollView {
            VStack(spacing: 24) {
                Spacer(minLength: 60)
                
                Image(systemName: "heart.circle.fill")
                    .font(.system(size: 70))
                    .foregroundStyle(LinearGradient(colors: [.pink, .orange], startPoint: .topLeading, endPoint: .bottomTrailing))
                
                Text("我们关心你")
                    .font(.title.bold())
                    .foregroundColor(.white)
                
                VStack(spacing: 12) {
                    Text("我注意到你最近可能有些困扰。")
                    Text("如果你正在经历困难，请记住你并不孤单。")
                }
                .font(.body)
                .foregroundColor(.white.opacity(0.9))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                
                VStack(spacing: 16) {
                    HStack {
                        Image(systemName: "phone.fill").foregroundColor(.pink)
                        Text("24小时危机热线").font(.headline.weight(.bold)).foregroundColor(.white)
                    }
                    VStack(spacing: 12) {
                        crisisRow("全国心理援助热线", "400-161-9995")
                        crisisRow("北京心理危机中心", "010-82951332")
                        crisisRow("生命热线", "400-821-1215")
                    }
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.08)).overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.pink.opacity(0.3), lineWidth: 1)))
                .padding(.horizontal, 24)
                
                Text("如果你愿意，可以随时和我们聊聊你的感受。")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                
                Spacer(minLength: 40)
                
                HStack(spacing: 16) {
                    Button(action: { viewModel.goBackFromSafety() }) {
                        Label("返回", systemImage: "chevron.left")
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                    
                    Button(action: { viewModel.continueFromSafety() }) {
                        Label("继续", systemImage: "chevron.right")
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, bottomPad)
            }
        }
    }
    
    private func crisisRow(_ name: String, _ phone: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.subheadline.weight(.medium)).foregroundColor(.white)
                Text(phone).font(.subheadline).foregroundColor(.pink)
            }
            Spacer()
            Button(action: {
                if let url = URL(string: "tel://\(phone.replacingOccurrences(of: "-", with: ""))") {
                    UIApplication.shared.open(url)
                }
            }) {
                Image(systemName: "phone.arrow.up.right.fill")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Circle().fill(Color.pink.opacity(0.8)))
            }
        }
        .padding(.horizontal, 4)
    }
    
    // MARK: - Complete
    
    private func completeView(geo: GeometryProxy) -> some View {
        VStack(spacing: 24) {
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.statusSuccess)
            
            Text("评估完成")
                .font(.largeTitle.bold())
                .foregroundColor(.white)
            
            Text("您的基线数据已建立。\n数字孪生模型现在可以使用了。")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.textSecondary)
                .padding(.horizontal, 32)
            
            Spacer()
            
            Button(action: { isComplete = true }) {
                Text("继续设置个人资料")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .padding(.horizontal, 24)
            .padding(.bottom, metrics.safeAreaInsets.bottom + 24)
        }
    }
    
    // MARK: - Loading & Sheet
    
    private var loadingView: some View {
        ZStack {
            Color.black.opacity(0.7).ignoresSafeArea()
            VStack(spacing: 20) {
                BreathingLogo(size: 100, color: .liquidGlassAccent)
                    .frame(height: 120)
                Text("正在分析你的回答...")
                    .font(.subheadline)
                    .foregroundColor(.white)
            }
        }
    }
    
    private var scaleInfoSheet: some View {
        ZStack {
            Color.black.opacity(0.95).ignoresSafeArea()
            
            VStack(spacing: 24) {
                HStack {
                    Spacer()
                    Button(action: { viewModel.showScaleInfo = false }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.textSecondary)
                    }
                }
                .padding(.horizontal)
                
                if let info = viewModel.currentScaleInfo {
                    VStack(spacing: 20) {
                        Text(info.name)
                            .font(.system(size: 32, weight: .bold, design: .monospaced))
                            .foregroundColor(.liquidGlassAccent)
                        Text(info.fullName)
                            .font(.headline)
                            .foregroundColor(.white)
                        Divider().background(Color.white.opacity(0.2))
                        Text(info.description)
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                }
                
                Spacer()
                
                Button(action: { viewModel.showScaleInfo = false }) {
                    Text("我知道了")
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
    }
}
