// MaxChatView.swift
// Max AI 对话视图 - 支持 P1 功能

import SwiftUI

struct MaxChatView: View {
    @StateObject private var viewModel = MaxChatViewModel()
    @FocusState private var isInputFocused: Bool
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 1. Bioluminescent 深渊背景
                // 1. Vercel Style Background (Pure Black)
                Color.black.ignoresSafeArea()
                
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
                        .padding(.top, 100) // Below nav bar
                        Spacer()
                    }
                    .zIndex(100)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
                
                VStack(spacing: 0) {
                    ScrollViewReader { proxy in
                        ScrollView {
                            LazyVStack(spacing: metrics.sectionSpacing) {
                                // 🆕 空消息时显示 Starter Questions
                                if viewModel.messages.isEmpty && !viewModel.starterQuestions.isEmpty {
                                    StarterQuestionsView(questions: viewModel.starterQuestions) { question in
                                        viewModel.inputText = question
                                        viewModel.sendMessage()
                                    }
                                    .padding(.top, metrics.isCompactHeight ? 20 : 40)
                                }
                                
                                ForEach(viewModel.messages) { message in
                                    MessageBubble(message: message) { selectedPlan in
                                        viewModel.savePlan(selectedPlan)
                                    }
                                    .id(message.id)
                                }
                                if viewModel.isTyping { TypingIndicator() }
                            }
                            .liquidGlassPageWidth()
                            .padding(.vertical, metrics.verticalPadding)
                        }
                        .onChange(of: viewModel.messages.count) { _ in
                            if let lastMessage = viewModel.messages.last {
                                withAnimation { proxy.scrollTo(lastMessage.id, anchor: .bottom) }
                            }
                        }
                    }
                    
                    // 2. 悬浮输入栏 (🆕 支持模式切换和停止生成)
                    InputBarV2(
                        text: $viewModel.inputText,
                        isFocused: $isInputFocused,
                        isTyping: viewModel.isTyping,
                        modelMode: viewModel.modelMode,
                        onSend: { viewModel.sendMessage() },
                        onToggleMode: { viewModel.toggleModelMode() },
                        onStop: { viewModel.stopGeneration() }
                    )
                    .padding(.bottom, metrics.isCompactHeight ? 6 : 10)
                }
            }
            .navigationTitle("Max")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .onReceive(NotificationCenter.default.publisher(for: .askMax)) { notification in
                guard let question = notification.userInfo?["question"] as? String,
                      !question.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                    return
                }
                viewModel.inputText = question
                viewModel.sendMessage()
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { viewModel.startNewConversation() } label: {
                        Image(systemName: "plus.bubble")
                            .foregroundColor(.white)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                    .scaleEffect(0.8)
                }
                
                // 🆕 P2 离线状态指示
                ToolbarItem(placement: .navigationBarLeading) {
                    if viewModel.isOffline {
                        HStack(spacing: 4) {
                            Image(systemName: "wifi.slash")
                                .font(.caption)
                                .foregroundColor(.orange)
                            Text("离线")
                                .font(.caption2)
                                .foregroundColor(.orange)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.ultraThinMaterial)
                        .clipShape(Capsule())
                    }
                }
            }
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
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background {
                        if message.role == .user {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color(white: 0.15))
                        } else {
                            Color.clear // AI message is transparent/clean
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
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

// MARK: - 🆕 Input Bar V3 (支持图片上传和语音输入)
struct InputBarV2: View {
    @Binding var text: String
    var isFocused: FocusState<Bool>.Binding
    let isTyping: Bool
    let modelMode: ModelMode
    let onSend: () -> Void
    let onToggleMode: () -> Void
    let onStop: () -> Void
    var onImageSelected: ((UIImage) -> Void)? = nil
    var onVoiceInput: ((String) -> Void)? = nil
    
    @State private var showImagePicker = false
    @State private var showVoiceRecorder = false
    @State private var isRecording = false
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        let controlSize: CGFloat = metrics.isCompactWidth ? 32 : 36
        let iconSize: CGFloat = metrics.isCompactWidth ? 16 : 18
        let sendSize: CGFloat = metrics.isCompactWidth ? 32 : 36
        let fieldHorizontalPadding: CGFloat = metrics.isCompactWidth ? 12 : 14
        let fieldVerticalPadding: CGFloat = metrics.isCompactHeight ? 8 : 10
        let barCornerRadius: CGFloat = metrics.isCompactWidth ? 20 : 24

        VStack(spacing: 8) {
            HStack(spacing: 10) {
                // 🆕 附件按钮（图片）
                Button(action: {
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                    showImagePicker = true
                }) {
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.system(size: iconSize))
                        .foregroundColor(.white.opacity(0.7))
                        .frame(width: controlSize, height: controlSize)
                        .background(.ultraThinMaterial)
                        .clipShape(Circle())
                        .overlay(
                            Circle().stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                }
                .disabled(isTyping)
                .opacity(isTyping ? 0.5 : 1)
                
                // 模式切换按钮
                Button(action: {
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                    onToggleMode()
                }) {
                    Image(systemName: modelMode.icon)
                        .font(.system(size: iconSize))
                        .foregroundColor(modelMode == .think ? .liquidGlassAccent : .white.opacity(0.7))
                        .frame(width: controlSize, height: controlSize)
                        .background(.ultraThinMaterial)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(modelMode == .think ? Color.liquidGlassAccent.opacity(0.5) : Color.white.opacity(0.1), lineWidth: 1)
                        )
                }
                .disabled(isTyping)
                .opacity(isTyping ? 0.5 : 1)
                
                // 输入框
                TextField("与 Max 对话...", text: $text)
                    .focused(isFocused)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, fieldHorizontalPadding)
                    .padding(.vertical, fieldVerticalPadding)
                    .background {
                        RoundedRectangle(cornerRadius: barCornerRadius)
                            .stroke(Color(white: 0.2), lineWidth: 1)
                    }
                    .foregroundColor(.white)
                
                // 🆕 语音输入按钮
                Button(action: {
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                    showVoiceRecorder = true
                }) {
                    Image(systemName: "mic.fill")
                        .font(.system(size: iconSize))
                        .foregroundColor(.white.opacity(0.7))
                        .frame(width: controlSize, height: controlSize)
                        .background(.ultraThinMaterial)
                        .clipShape(Circle())
                        .overlay(
                            Circle().stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                }
                .disabled(isTyping)
                .opacity(isTyping ? 0.5 : 1)
                
                // 发送/停止按钮
                if isTyping {
                    Button(action: {
                        let impact = UIImpactFeedbackGenerator(style: .medium)
                        impact.impactOccurred()
                        onStop()
                    }) {
                        Image(systemName: "stop.circle.fill")
                            .font(.system(size: sendSize))
                            .foregroundStyle(.red.opacity(0.9))
                            .shadow(color: .red.opacity(0.4), radius: 8)
                    }
                } else {
                    Button { onSend() } label: {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: sendSize))
                            .symbolRenderingMode(.palette)
                            .foregroundStyle(Color.bgPrimary, Color.liquidGlassAccent)
                            .shadow(color: .liquidGlassAccent.opacity(0.4), radius: 8)
                    }
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .padding(.horizontal, metrics.isCompactWidth ? 10 : 12)
        .padding(.vertical, metrics.isCompactHeight ? 12 : 16)
        .background(Color.black)
        .overlay(
            Rectangle().frame(height: 1).foregroundColor(Color(white: 0.2)), alignment: .top
        )
        .liquidGlassPageWidth(alignment: .center)
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
                    .foregroundColor(.white)
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
    
    var body: some View {
        Button(action: {
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            onTap()
        }) {
            HStack {
                Text(question)
                    .font(.subheadline)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.leading)
                
                Spacer()
                
                Image(systemName: "arrow.right")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.5))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color(white: 0.2), lineWidth: 1)
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
