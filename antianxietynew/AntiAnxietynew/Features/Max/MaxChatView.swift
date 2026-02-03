// MaxChatView.swift
// Max AI 对话视图 - 支持 P1 功能

import SwiftUI

struct MaxChatView: View {
    @StateObject private var viewModel = MaxChatViewModel()
    @FocusState private var isInputFocused: Bool
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.screenMetrics) private var metrics
    @Environment(\.dismiss) private var dismiss
    @Environment(\.presentationMode) private var presentationMode
    @State private var isHistoryOpen = false
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .leading) {
                immersiveBackground

                // Error Banner
                if let error = viewModel.error {
                    VStack {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                            Text(error)
                                .font(.caption)
                            Spacer()
                            Button {
                                viewModel.error = nil
                            } label: {
                                Image(systemName: "xmark")
                            }
                        }
                        .padding()
                        .background(Color.red.opacity(0.8))
                        .foregroundColor(.white)
                        .cornerRadius(8)
                        .padding(.horizontal)
                        .padding(.top, metrics.safeAreaInsets.top + 20)
                        Spacer()
                    }
                    .zIndex(100)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                VStack(spacing: 0) {
                    chatHeader

                    ScrollViewReader { proxy in
                        ScrollView {
                            LazyVStack(alignment: .leading, spacing: metrics.sectionSpacing) {
                                if viewModel.messages.isEmpty {
                                    ImmersiveStarterView(questions: viewModel.starterQuestions) { question in
                                        viewModel.inputText = question
                                        viewModel.sendMessage()
                                    }
                                    .padding(.top, metrics.isCompactHeight ? 12 : 24)
                                }

                                ForEach(viewModel.messages) { message in
                                    MessageBubble(message: message) { selectedPlan in
                                        viewModel.savePlan(selectedPlan)
                                    }
                                    .id(message.id)
                                }
                                if viewModel.isTyping { TypingIndicator() }
                            }
                            .liquidGlassPageWidth(alignment: .leading)
                            .padding(.vertical, metrics.verticalPadding)
                        }
                        .onChange(of: viewModel.messages.count) { _ in
                            if let lastMessage = viewModel.messages.last {
                                withAnimation { proxy.scrollTo(lastMessage.id, anchor: .bottom) }
                            }
                        }
                    }

                    InputBarV2(
                        text: $viewModel.inputText,
                        isFocused: $isInputFocused,
                        isTyping: viewModel.isTyping,
                        modelMode: viewModel.modelMode,
                        onOpenHistory: {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                                isHistoryOpen = true
                            }
                        },
                        onSend: { viewModel.sendMessage() },
                        onToggleMode: { viewModel.toggleModelMode() },
                        onStop: { viewModel.stopGeneration() }
                    )
                }

                if isHistoryOpen {
                    Color.black.opacity(0.35)
                        .ignoresSafeArea()
                        .onTapGesture {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                                isHistoryOpen = false
                            }
                        }
                }

                HistoryDrawer(
                    conversations: viewModel.conversations,
                    currentConversationId: viewModel.currentConversationId,
                    onSelect: { conversation in
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                            isHistoryOpen = false
                        }
                        Task {
                            await viewModel.switchConversation(conversation.id)
                        }
                    },
                    onNew: {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                            isHistoryOpen = false
                        }
                        viewModel.startNewConversation()
                    },
                    onDelete: { conversation in
                        Task {
                            _ = await viewModel.deleteConversation(conversation.id)
                        }
                    }
                )
                .frame(width: historyDrawerWidth)
                .offset(x: isHistoryOpen ? 0 : -historyDrawerWidth - 12)
                .shadow(color: Color.black.opacity(0.45), radius: 20, x: 8, y: 0)
                .animation(.spring(response: 0.35, dampingFraction: 0.85), value: isHistoryOpen)
            }
            .toolbar(.hidden, for: .navigationBar)
            .onReceive(NotificationCenter.default.publisher(for: .askMax)) { notification in
                guard let question = notification.userInfo?["question"] as? String,
                      !question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                    return
                }
                viewModel.inputText = question
                viewModel.sendMessage()
            }
            .simultaneousGesture(historyEdgeGesture)
        }
    }

    private var immersiveBackground: some View {
        ZStack {
            LinearGradient.magazineWash.ignoresSafeArea()
            LinearGradient.mossVeil.ignoresSafeArea()
        }
    }

    private var chatHeader: some View {
        let sidePadding = metrics.horizontalPadding
        return ZStack {
            HStack {
                Button(action: handleBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.textPrimary)
                        .frame(width: 36, height: 36)
                        .background(Color.surfaceGlass(for: colorScheme))
                        .clipShape(Circle())
                }
                Spacer()
            }

            Text("Max")
                .font(.headline)
                .foregroundColor(.textPrimary)

            HStack {
                Spacer()
                Color.clear
                    .frame(width: 36, height: 36)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, sidePadding)
        .padding(.top, metrics.safeAreaInsets.top + 12)
        .padding(.bottom, 12)
    }

    private var historyDrawerWidth: CGFloat {
        min(metrics.safeWidth * 0.78, 320)
    }

    private var historyEdgeGesture: some Gesture {
        DragGesture(minimumDistance: 20, coordinateSpace: .global)
            .onEnded { value in
                let isEdgeSwipe = value.startLocation.x < 28
                if isEdgeSwipe && value.translation.width > 60 {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                        isHistoryOpen = true
                    }
                } else if isHistoryOpen && value.translation.width < -60 {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                        isHistoryOpen = false
                    }
                }
            }
    }

    private func handleBack() {
        if presentationMode.wrappedValue.isPresented {
            dismiss()
        } else {
            NotificationCenter.default.post(name: .openDashboard, object: nil)
        }
    }
}

// MARK: - Message Bubble (🆕 支持 Markdown)
struct MessageBubble: View {
    let message: ChatMessage
    var onPlanConfirm: ((PlanOption) -> Void)? = nil
    
    // 检测是否包含 plan-options JSON
    private var planOptions: [PlanOption]? {
        guard message.role == .assistant else { return nil }
        return parsePlanOptions(from: message.content)
    }
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if message.role == .assistant {
                // AI 头像 - 带光晕
                ZStack {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 30, height: 30)
                        
                    Image(systemName: "triangle.fill") // Vercel-like logo? Or just existing
                        .font(.system(size: 14))
                        .foregroundColor(.black)
                }
            } else {
                Spacer()
            }
            
            // 消息气泡 - 根据内容类型选择渲染方式
            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                if let options = planOptions, options.count >= 2 {
                    // 显示计划选择器
                    PlanSelectorView(options: options) { selectedPlan in
                        onPlanConfirm?(selectedPlan)
                    }
                } else {
                    // 🆕 使用 Markdown 渲染 AI 消息
                    Group {
                        if message.role == .assistant {
                            MarkdownText(content: message.content)
                        } else {
                            Text(message.content)
                        }
                    }
                    .font(.body)
                    .foregroundColor(.textPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(message.role == .user
                                  ? Color.liquidGlassAccent.opacity(0.22)
                                  : Color.white.opacity(0.08))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                            )
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    // 🆕 P2 长按复制
                    .contextMenu {
                        Button {
                            UIPasteboard.general.string = message.content
                            let notification = UINotificationFeedbackGenerator()
                            notification.notificationOccurred(.success)
                        } label: {
                            Label("复制消息", systemImage: "doc.on.doc")
                        }
                    }
                }
                
                Text(formatTime(message.timestamp))
                    .font(.caption2)
                    .foregroundColor(.textTertiary)
                    .padding(.horizontal, 4)
            }
            
            if message.role == .user {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 36))
                    .foregroundColor(.liquidGlassSecondary)
            } else {
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)
    }
    
    func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - 🆕 P3 思考过程动画
struct TypingIndicator: View {
    @State private var dotOffset = 0.0
    @State private var pulseScale = 1.0
    @State private var rotation = 0.0
    @State private var thinkingPhase = 0
    
    // 思考阶段文字
    private let thinkingTexts = [
        "正在理解你的问题...",
        "分析健康数据中...",
        "查阅证据库...",
        "整合分析结果...",
        "生成个性化建议..."
    ]
    
    private let timer = Timer.publish(every: 2.5, on: .main, in: .common).autoconnect()
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // AI 头像 - 带脉冲光晕和旋转
            ZStack {
                // 脉冲光圈
                Circle()
                    .fill(Color.liquidGlassAccent.opacity(0.15))
                    .frame(width: 50, height: 50)
                    .scaleEffect(pulseScale)
                    .animation(
                        .easeInOut(duration: 1.2).repeatForever(autoreverses: true),
                        value: pulseScale
                    )
                
                Circle()
                    .fill(Color.liquidGlassAccent.opacity(0.25))
                    .frame(width: 40, height: 40)
                    .scaleEffect(pulseScale * 0.9)
                    .animation(
                        .easeInOut(duration: 1.0).repeatForever(autoreverses: true).delay(0.2),
                        value: pulseScale
                    )
                
                // 大脑图标 - 轻微旋转
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.liquidGlassAccent.opacity(0.5), lineWidth: 1.5))
                    .rotationEffect(.degrees(rotation))
                    .animation(
                        .easeInOut(duration: 2.0).repeatForever(autoreverses: true),
                        value: rotation
                    )
            }
            
            VStack(alignment: .leading, spacing: 8) {
                // 思考阶段文字
                Text(thinkingTexts[thinkingPhase % thinkingTexts.count])
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.85))
                    .animation(.easeInOut(duration: 0.3), value: thinkingPhase)
                
                // 三点跳动动画
                HStack(spacing: 6) {
                    ForEach(0..<3) { i in
                        Circle()
                            .fill(Color.liquidGlassAccent)
                            .frame(width: 8, height: 8)
                            .offset(y: dotOffset)
                            .animation(
                                .easeInOut(duration: 0.6).repeatForever().delay(Double(i) * 0.15),
                                value: dotOffset
                            )
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background {
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.liquidGlassAccent.opacity(0.3), lineWidth: 1)
                    )
            }
            
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear {
            dotOffset = -6
            pulseScale = 1.2
            rotation = 5
        }
        .onReceive(timer) { _ in
            withAnimation {
                thinkingPhase += 1
            }
        }
    }
}

// MARK: - Immersive Starter View
struct ImmersiveStarterView: View {
    let questions: [String]
    let onSelect: (String) -> Void
    @Environment(\.screenMetrics) private var metrics
    @Environment(\.colorScheme) private var colorScheme

    private let icons = [
        "photo.on.rectangle",
        "video",
        "square.and.pencil",
        "book",
        "sparkles"
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text("你好")
                    .font(.system(size: metrics.isCompactWidth ? 20 : 22, weight: .semibold))
                    .foregroundColor(Color.textSecondary(for: colorScheme))
                Text("需要我为你做些什么？")
                    .font(.system(size: metrics.isCompactWidth ? 30 : 34, weight: .bold))
                    .foregroundColor(Color.textPrimary(for: colorScheme))
            }

            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(questions.prefix(5).enumerated()), id: \.offset) { index, question in
                    Button {
                        let impact = UIImpactFeedbackGenerator(style: .light)
                        impact.impactOccurred()
                        onSelect(question)
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: icons[index % icons.count])
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(Color.textPrimary(for: colorScheme))
                            Text(question)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(Color.textPrimary(for: colorScheme))
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            Capsule()
                                .fill(Color.surfaceGlass(for: colorScheme))
                                .overlay(
                                    Capsule()
                                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.vertical, 12)
    }
}

// MARK: - History Drawer
struct HistoryDrawer: View {
    let conversations: [Conversation]
    let currentConversationId: String?
    let onSelect: (Conversation) -> Void
    let onNew: () -> Void
    let onDelete: (Conversation) -> Void
    @Environment(\.screenMetrics) private var metrics
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            headerView
            contentView

            Spacer()
        }
        .padding(.top, metrics.safeAreaInsets.top + 12)
        .padding(.horizontal, metrics.horizontalPadding)
        .padding(.bottom, 24)
        .frame(maxHeight: .infinity, alignment: .top)
        .background(drawerBackground)
    }

    private var headerView: some View {
        HStack(spacing: 12) {
            Text("历史记录")
                .font(.headline)
                .foregroundColor(Color.textPrimary(for: colorScheme))
            Spacer()
            Button(action: onNew) {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color.textPrimary(for: colorScheme))
                    .frame(width: 28, height: 28)
                    .background(Color.surfaceGlass(for: colorScheme))
                    .clipShape(Circle())
            }
        }
    }

    @ViewBuilder
    private var contentView: some View {
        if conversations.isEmpty {
            Text("还没有对话记录")
                .font(.subheadline)
                .foregroundColor(Color.textSecondary(for: colorScheme))
                .padding(.top, 12)
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(conversations) { conversation in
                        conversationRow(conversation)
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }

    private func conversationRow(_ conversation: Conversation) -> some View {
        Button {
            onSelect(conversation)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(conversation.displayTitle)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(Color.textPrimary(for: colorScheme))
                        .lineLimit(1)
                    Text(conversationDateLabel(conversation))
                        .font(.caption2)
                        .foregroundColor(Color.textTertiary(for: colorScheme))
                }
                Spacer()
                if conversation.id == currentConversationId {
                    Circle()
                        .fill(Color.liquidGlassAccent)
                        .frame(width: 8, height: 8)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(conversation.id == currentConversationId
                          ? Color.liquidGlassAccent.opacity(0.18)
                          : Color.surfaceGlass(for: colorScheme))
            )
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button(role: .destructive) {
                onDelete(conversation)
            } label: {
                Label("删除对话", systemImage: "trash")
            }
        }
    }

    private var drawerBackground: some View {
        ZStack {
            LinearGradient.magazineWash
            LinearGradient.mossVeil
        }
        .ignoresSafeArea()
    }

    private func conversationDateLabel(_ conversation: Conversation) -> String {
        guard let date = conversation.lastMessageDate else { return "刚刚" }
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "zh-CN")
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - 🆕 Input Bar V3 (支持图片上传和语音输入)
struct InputBarV2: View {
    @Binding var text: String
    var isFocused: FocusState<Bool>.Binding
    let isTyping: Bool
    let modelMode: ModelMode
    let onOpenHistory: () -> Void
    let onSend: () -> Void
    let onToggleMode: () -> Void
    let onStop: () -> Void
    var onImageSelected: ((UIImage) -> Void)? = nil
    var onVoiceInput: ((String) -> Void)? = nil
    
    @State private var showImagePicker = false
    @State private var showVoiceRecorder = false
    @State private var isRecording = false
    @Environment(\.screenMetrics) private var metrics
    @Environment(\.colorScheme) private var colorScheme
    
    private var controlSize: CGFloat { metrics.isCompactWidth ? 32 : 36 }
    private var iconSize: CGFloat { metrics.isCompactWidth ? 16 : 18 }
    private var sendSize: CGFloat { metrics.isCompactWidth ? 26 : 28 }
    private var fieldHorizontalPadding: CGFloat { metrics.isCompactWidth ? 12 : 14 }
    private var fieldVerticalPadding: CGFloat { metrics.isCompactHeight ? 10 : 12 }
    private var barCornerRadius: CGFloat { metrics.isCompactWidth ? 22 : 26 }

    var body: some View {
        let sidePadding = metrics.horizontalPadding
        return ViewThatFits(in: .horizontal) {
            barContainer(content: barRow(showMode: true), sidePadding: sidePadding)
            barContainer(content: barRow(showMode: false), sidePadding: sidePadding)
        }
        // 🆕 图片选择器 Sheet
        .sheet(isPresented: $showImagePicker) {
            ImagePickerView { image in
                onImageSelected?(image)
            }
        }
        // 🆕 语音录入 Sheet
        .sheet(isPresented: $showVoiceRecorder) {
            VoiceRecorderView { transcribedText in
                text = transcribedText
            }
        }
    }

    private func barContainer(content: some View, sidePadding: CGFloat) -> some View {
        content
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: barCornerRadius)
                    .fill(Color.surfaceGlass(for: colorScheme))
                    .overlay(
                        RoundedRectangle(cornerRadius: barCornerRadius)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
            )
            .padding(.horizontal, sidePadding)
            .padding(.top, 8)
            .padding(.bottom, max(12, metrics.safeAreaInsets.bottom + 6))
    }

    @ViewBuilder
    private func barRow(showMode: Bool) -> some View {
        HStack(alignment: .bottom, spacing: 10) {
            historyButton
            plusButton
            inputField
            if showMode {
                modePill
            }
            micButton
        }
    }

    private var historyButton: some View {
        Button(action: {
            lightImpact()
            onOpenHistory()
        }) {
            Image(systemName: "line.3.horizontal")
                .font(.system(size: iconSize, weight: .semibold))
                .foregroundColor(.textPrimary)
                .frame(width: controlSize, height: controlSize)
                .background(Color.surfaceGlass(for: colorScheme))
                .clipShape(Circle())
                .overlay(
                    Circle().stroke(Color.white.opacity(0.12), lineWidth: 1)
                )
        }
    }

    private var plusButton: some View {
        Button(action: {
            lightImpact()
            showImagePicker = true
        }) {
            Image(systemName: "plus")
                .font(.system(size: iconSize, weight: .semibold))
                .foregroundColor(.textPrimary)
                .frame(width: controlSize, height: controlSize)
                .background(Color.surfaceGlass(for: colorScheme))
                .clipShape(Circle())
                .overlay(
                    Circle().stroke(Color.white.opacity(0.12), lineWidth: 1)
                )
        }
        .disabled(isTyping)
        .opacity(isTyping ? 0.5 : 1)
    }

    private var micButton: some View {
        Button(action: {
            lightImpact()
            showVoiceRecorder = true
        }) {
            Image(systemName: "mic.fill")
                .font(.system(size: iconSize))
                .foregroundColor(.textPrimary)
                .frame(width: controlSize, height: controlSize)
                .background(Color.surfaceGlass(for: colorScheme))
                .clipShape(Circle())
                .overlay(
                    Circle().stroke(Color.white.opacity(0.12), lineWidth: 1)
                )
        }
        .disabled(isTyping)
        .opacity(isTyping ? 0.5 : 1)
    }

    private var modePill: some View {
        Button(action: {
            lightImpact()
            onToggleMode()
        }) {
            Text(modelMode == .think ? "Pro" : "Fast")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(modelMode == .think ? .liquidGlassAccent : Color.textSecondary(for: colorScheme))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        .background(Capsule().fill(Color.surfaceGlass(for: colorScheme)))
                )
                .lineLimit(1)
                .minimumScaleFactor(0.9)
        }
        .disabled(isTyping)
        .opacity(isTyping ? 0.5 : 1)
    }

    private var inputField: some View {
        HStack(spacing: 10) {
            TextField("一起开始创作吧", text: $text)
                .focused(isFocused)
                .textFieldStyle(.plain)
                .foregroundColor(Color.textPrimary(for: colorScheme))
                .layoutPriority(1)

            if isTyping {
                Button(action: {
                    let impact = UIImpactFeedbackGenerator(style: .medium)
                    impact.impactOccurred()
                    onStop()
                }) {
                    Image(systemName: "stop.circle.fill")
                        .font(.system(size: sendSize))
                        .foregroundStyle(.red.opacity(0.9))
                        .shadow(color: .red.opacity(0.4), radius: 6)
                }
            } else if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button { onSend() } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: sendSize))
                        .symbolRenderingMode(.palette)
                        .foregroundStyle(Color.bgPrimary, Color.liquidGlassAccent)
                        .shadow(color: .liquidGlassAccent.opacity(0.4), radius: 6)
                }
            }
        }
        .padding(.horizontal, fieldHorizontalPadding)
        .padding(.vertical, fieldVerticalPadding)
        .frame(maxWidth: .infinity)
    }

    private func lightImpact() {
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
    }
}

// MARK: - 🆕 图片选择器 (PHPickerViewController)
import PhotosUI

struct ImagePickerView: UIViewControllerRepresentable {
    let onImageSelected: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePickerView
        
        init(_ parent: ImagePickerView) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            parent.dismiss()
            
            guard let result = results.first else { return }
            
            result.itemProvider.loadObject(ofClass: UIImage.self) { object, error in
                if let image = object as? UIImage {
                    DispatchQueue.main.async {
                        self.parent.onImageSelected(image)
                    }
                }
            }
        }
    }
}

// MARK: - 🆕 语音录入视图
import Speech

struct VoiceRecorderView: View {
    let onTranscription: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var isRecording = false
    @State private var transcribedText = ""
    @State private var audioEngine = AVAudioEngine()
    @State private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    @State private var recognitionTask: SFSpeechRecognitionTask?
    @State private var speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN"))
    @State private var pulseScale = 1.0
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.bgPrimary.ignoresSafeArea()
                
                VStack(spacing: 32) {
                    Spacer()
                    
                    // 录音指示器
                    ZStack {
                        // 脉冲环
                        if isRecording {
                            Circle()
                                .stroke(Color.liquidGlassAccent.opacity(0.3), lineWidth: 4)
                                .frame(width: 160, height: 160)
                                .scaleEffect(pulseScale)
                            
                            Circle()
                                .stroke(Color.liquidGlassAccent.opacity(0.5), lineWidth: 3)
                                .frame(width: 130, height: 130)
                                .scaleEffect(pulseScale * 0.9)
                        }
                        
                        Circle()
                            .fill(isRecording ? Color.red.opacity(0.8) : Color.liquidGlassAccent)
                            .frame(width: 100, height: 100)
                            .shadow(color: isRecording ? .red.opacity(0.5) : .liquidGlassAccent.opacity(0.5), radius: 20)
                        
                        Image(systemName: isRecording ? "waveform" : "mic.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.white)
                    }
                    .onTapGesture {
                        toggleRecording()
                    }
                    
                    Text(isRecording ? "点击停止录音" : "点击开始录音")
                        .font(.headline)
                        .foregroundColor(.white.opacity(0.7))
                    
                    // 转录结果
                    if !transcribedText.isEmpty {
                        Text(transcribedText)
                            .font(.body)
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal)
                    }
                    
                    Spacer()
                    
                    // 确认按钮
                    if !transcribedText.isEmpty && !isRecording {
                        Button {
                            onTranscription(transcribedText)
                            dismiss()
                        } label: {
                            Text("使用此文本")
                                .font(.headline)
                                .foregroundColor(.bgPrimary)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.liquidGlassAccent)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                        }
                        .padding(.horizontal)
                    }
                }
                .padding()
            }
            .navigationTitle("语音输入")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        stopRecording()
                        dismiss()
                    }
                    .foregroundColor(.liquidGlassAccent)
                }
            }
            .onAppear {
                requestSpeechAuthorization()
            }
            .onDisappear {
                stopRecording()
            }
            .onChange(of: isRecording) { newValue in
                if newValue {
                    withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                        pulseScale = 1.3
                    }
                } else {
                    pulseScale = 1.0
                }
            }
        }
    }
    
    private func requestSpeechAuthorization() {
        SFSpeechRecognizer.requestAuthorization { status in
            // 授权处理
        }
    }
    
    private func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    private func startRecording() {
        guard let recognizer = speechRecognizer, recognizer.isAvailable else { return }
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        
        recognitionRequest.shouldReportPartialResults = true
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        audioEngine.prepare()
        
        do {
            try audioEngine.start()
            isRecording = true
            
            recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { result, error in
                if let result = result {
                    transcribedText = result.bestTranscription.formattedString
                }
                
                if error != nil || result?.isFinal == true {
                    stopRecording()
                }
            }
        } catch {
            print("❌ 语音录制失败: \(error)")
        }
    }
    
    private func stopRecording() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        isRecording = false
    }
}

// MARK: - Preview
struct MaxChatView_Previews: PreviewProvider {
    static var previews: some View {
        MaxChatView()
            .preferredColorScheme(.dark)
    }
}

// MARK: - MarkdownText 组件
/// Markdown 文本渲染 - 使用 iOS 原生 AttributedString
struct MarkdownText: View {
    let content: String
    
    var body: some View {
        if #available(iOS 15.0, *) {
            Text(attributedContent)
                .textSelection(.enabled)
        } else {
            Text(content)
        }
    }
    
    @available(iOS 15.0, *)
    private var attributedContent: AttributedString {
        do {
            var options = AttributedString.MarkdownParsingOptions()
            options.interpretedSyntax = .inlineOnlyPreservingWhitespace
            
            var attributed = try AttributedString(markdown: content, options: options)
            attributed.foregroundColor = .white
            
            for run in attributed.runs {
                if run.inlinePresentationIntent?.contains(.stronglyEmphasized) == true {
                    attributed[run.range].foregroundColor = .white
                }
                if run.inlinePresentationIntent?.contains(.emphasized) == true {
                    attributed[run.range].foregroundColor = .white.opacity(0.95)
                }
                if run.inlinePresentationIntent?.contains(.code) == true {
                    attributed[run.range].foregroundColor = .white.opacity(0.9)
                    attributed[run.range].backgroundColor = .white.opacity(0.1)
                }
            }
            return attributed
        } catch {
            return AttributedString(content)
        }
    }
}

// MARK: - StarterQuestionsView 组件
/// 个性化起始问题卡片视图
struct StarterQuestionsView: View {
    let questions: [String]
    let onSelect: (String) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .foregroundColor(.liquidGlassAccent)
                Text("快速开始")
                    .font(.headline)
                    .foregroundColor(.textPrimary)
            }
            .padding(.bottom, 4)
            
            ForEach(questions.prefix(4), id: \.self) { question in
                StarterQuestionCard(question: question) {
                    onSelect(question)
                }
            }
        }
        .padding(.vertical, 16)
    }
}

/// 单个问题卡片
struct StarterQuestionCard: View {
    let question: String
    let onTap: () -> Void
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        Button(action: {
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            onTap()
        }) {
            HStack {
                Text(question)
                    .font(.subheadline)
                    .foregroundColor(.textPrimary)
                    .multilineTextAlignment(.leading)
                
                Spacer()
                
                Image(systemName: "arrow.right")
                    .font(.caption)
                    .foregroundColor(.textTertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(colorScheme == .dark ? Color.white.opacity(0.08) : Color.white.opacity(0.85))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(colorScheme == .dark ? Color.white.opacity(0.12) : Color.black.opacity(0.08), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

/// 按压缩放按钮样式
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}
