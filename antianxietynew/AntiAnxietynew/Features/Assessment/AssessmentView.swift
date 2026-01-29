// AssessmentView.swift
// 临床评估视图 - Neuro-Glass 界面
//
// 审美: 深空 / 数字孪生交互

import SwiftUI

struct AssessmentView: View {
    @StateObject private var viewModel = AssessmentViewModel()
    @Environment(\.dismiss) private var dismiss
    @Namespace private var namespace
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 背景
                AuroraBackground()
                
                // 内容切换器
                switch viewModel.phase.displayPhase {
                case .welcome:
                    welcomePhase
                        .transition(.opacity.combined(with: .scale(scale: 0.9)))
                case .assessment, .baseline, .chief_complaint, .differential:
                    assessmentPhase
                        .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                case .emergency:
                    emergencyPhase
                        .transition(.opacity)
                case .complete, .report:
                    completePhase
                        .transition(.opacity)
                }
                
                // 加载遮罩 (神经处理中)
                if viewModel.isLoading {
                    neuralLoadingOverlay
                }
            }
            .navigationBarHidden(true) // 全沉浸模式
            .alert(
                "连接错误",
                isPresented: Binding(
                    get: { viewModel.error != nil },
                    set: { newValue in
                        if !newValue { viewModel.error = nil }
                    }
                )
            ) {
                Button("重试") { viewModel.error = nil }
            } message: {
                Text(viewModel.error ?? "")
            }
        }
    }
    
    // MARK: - 欢迎阶段 (神经链接)
    private var welcomePhase: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // 核心光球
            ZStack {
                PulsingOrb(color: .liquidGlassAccent)
                    .scaleEffect(metrics.isCompactHeight ? 1.2 : 1.5)
                
                Image(systemName: "brain")
                    .font(.system(size: 40))
                    .foregroundColor(.white)
                    .shadow(color: .liquidGlassAccent, radius: 10)
            }
            .padding(.bottom, 20)
            
            // 文本块
            VStack(spacing: 16) {
                Text("神经连接就绪")
                    .neuroFont(24, weight: .bold)
                    .tracking(4)
                    .foregroundColor(.liquidGlassAccent)
                
                Text("正在初始化高级健康评估协议。\nAI 自适应引擎待命中。")
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Spacer()
            
            // 主要操作
            Button {
                Task { await viewModel.startAssessment() }
            } label: {
                Text("建立连接")
                    .tracking(2)
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .padding(.horizontal, 40)
            .padding(.bottom, 20)
            
            // 页脚
            Text("预计持续时间: 5-10 个周期")
                .font(.caption2)
                .tracking(1)
                .foregroundColor(.textTertiary)
                .padding(.bottom)
        }
        .liquidGlassPageWidth(alignment: .center)
    }
    
    // MARK: - 评估阶段 (数据输入)
    private var assessmentPhase: some View {
        VStack(spacing: 0) {
            // 头部: 进度与控制
            HStack {
                Button {
                    viewModel.resetAssessment()
                    dismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.textTertiary)
                }
                
                Spacer()
                
                // 进度条
                HStack(spacing: 8) {
                    Text("\(viewModel.progress)%")
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(.liquidGlassAccent)
                    
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.white.opacity(0.1))
                            Capsule()
                                .fill(Color.liquidGlassAccent)
                                .frame(width: geo.size.width * Double(viewModel.progress) / 100)
                                .shadow(color: .liquidGlassAccent, radius: 5)
                        }
                    }
                    .frame(width: 100, height: 4)
                }
            }
            .padding()
            .padding(.top, metrics.safeAreaInsets.top + (metrics.isCompactHeight ? 4 : 12))
            
            Spacer()
            
            // 问题卡片
            if let question = viewModel.currentQuestion {
                QuestionView(
                    question: question,
                    onAnswer: { value in
                        Task {
                            await viewModel.submitAnswer(questionId: question.id, value: value)
                        }
                    }
                )
                // 添加唯一ID以在问题变更时强制触发转场动画
                .id(question.id)
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity).combined(with: .scale(scale: 0.9))
                ))
            }
            
            Spacer()
        }
        .liquidGlassPageWidth()
    }
    
    // MARK: - 紧急阶段 (红色警报)
    private var emergencyPhase: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()
            
            // 脉冲红色背景
            Color.statusError.opacity(0.1)
                .ignoresSafeArea()
                .overlay(
                    NoiseTexture(opacity: 0.1)
                )
            
            VStack(spacing: 30) {
                Spacer()
                
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.statusError)
                    .shadow(color: .statusError, radius: 20)
                
                VStack(spacing: 12) {
                    Text("紧急警报")
                        .neuroFont(28, weight: .heavy)
                        .foregroundColor(.statusError)
                    
                    Text(viewModel.message ?? "建议立即启动援助协议。")
                        .font(.body)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                LiquidGlassCard(style: .elevated, padding: 20) {
                    VStack(spacing: 20) {
                        ContactRow(icon: "phone.fill", title: "心理援助热线", number: "400-161-9995", color: .statusSuccess)
                        Divider().background(Color.white.opacity(0.1))
                        ContactRow(icon: "cross.fill", title: "危机干预中心", number: "010-82951332", color: .liquidGlassAccent)
                    }
                }
                .padding(.horizontal)
                
                Spacer()
                
                Button {
                    Task { await viewModel.dismissEmergency() }
                } label: {
                    Text("收到")
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                .padding(.bottom, 40)
            }
            .liquidGlassPageWidth(alignment: .center)
        }
    }
    
    // MARK: - 完成阶段 (同步)
    private var completePhase: some View {
        VStack(spacing: 32) {
            Spacer()
            
            ZStack {
                Circle()
                    .stroke(Color.statusSuccess.opacity(0.3), lineWidth: 2)
                    .frame(width: 150, height: 150)
                
                Image(systemName: "checkmark")
                    .font(.system(size: 60, weight: .bold))
                    .foregroundColor(.statusSuccess)
                    .shadow(color: .statusSuccess, radius: 10)
            }
            
            VStack(spacing: 12) {
                Text("分析完成")
                    .neuroFont(24, weight: .bold)
                    .foregroundColor(.white)
                
                Text(viewModel.message ?? "数据已与数字孪生同步。")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            Button {
                viewModel.resetAssessment()
                dismiss()
            } label: {
                Text("返回仪表盘")
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .padding(.horizontal, 40)
            
            Spacer()
        }
        .liquidGlassPageWidth(alignment: .center)
    }
    
    // MARK: - 加载遮罩
    private var neuralLoadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            
            VStack(spacing: 20) {
                PulsingOrb(color: .liquidGlassAccent)
                    .frame(width: 60, height: 60)
                
                Text("处理中...")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(.liquidGlassAccent)
            }
        }
    }
    
    // 辅助行视图
    struct ContactRow: View {
        let icon: String
        let title: String
        let number: String
        let color: Color
        
        var body: some View {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title2)
                    .frame(width: 40)
                
                VStack(alignment: .leading) {
                    Text(title).font(.headline).foregroundColor(.white)
                    Text(number).font(.subheadline).foregroundColor(.textSecondary)
                }
                Spacer()
                Image(systemName: "phone.circle.fill")
                    .font(.title2)
                    .foregroundColor(.white)
            }
        }
    }
}

// MARK: - 问题子视图

struct QuestionView: View {
    let question: AssessmentQuestion
    let onAnswer: (String) -> Void
    
    // 本地状态以支持多种输入
    @State private var sliderValue: Double = 5
    @State private var textInput: String = ""
    @State private var selectedOption: String?
    
    var body: some View {
        LiquidGlassCard(style: .elevated, padding: 20) {
            VStack(spacing: 30) {
                // 问题文本
                Text(question.text)
                    .neuroFont(20, weight: .semibold)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.white)
                    .fixedSize(horizontal: false, vertical: true)
                
                // 输入机制
                switch question.type {
                case "scale":
                    scaleInput
                case "text":
                    textInputArea
                default:
                    // 单选/多选
                    optionsList
                }
            }
            .padding(.vertical, 10)
        }
        .padding(.horizontal)
    }
    
    // 选项列表
    var optionsList: some View {
        VStack(spacing: 12) {
            ForEach(question.options ?? [], id: \.value) { option in
                Button {
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                    selectedOption = option.value
                    
                    //动画延迟
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                        onAnswer(option.value)
                    }
                } label: {
                    HStack {
                        Text(option.label)
                            .font(.system(size: 16, design: .rounded))
                            .foregroundColor(selectedOption == option.value ? .black : .white)
                        
                        Spacer()
                        
                        if selectedOption == option.value {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.black)
                        }
                    }
                    .padding()
                    .background {
                        if selectedOption == option.value {
                            // 激活态
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.liquidGlassAccent)
                                .shadow(color: .liquidGlassAccent.opacity(0.5), radius: 10)
                        } else {
                            // 未激活玻璃态
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.white.opacity(0.05))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }
    
    // 刻度输入
    var scaleInput: some View {
        VStack(spacing: 20) {
            Text("\(Int(sliderValue))")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundColor(.liquidGlassAccent)
            
            LiquidGlassSlider(
                value: $sliderValue,
                range: Double(question.minValue ?? 0)...Double(question.maxValue ?? 10),
                step: 1,
                showValue: false
            )
            
            Button {
                onAnswer(String(Int(sliderValue)))
            } label: {
                Text("确认")
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
        }
    }
    
    // 文本输入
    var textInputArea: some View {
        VStack(spacing: 20) {
            TextField("请输入你的回答...", text: $textInput)
                .textFieldStyle(.plain)
                .padding()
                .background(Color.white.opacity(0.05))
                .cornerRadius(12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1)))
                .foregroundColor(.white)
            
            Button {
                onAnswer(textInput)
            } label: {
                Text("提交")
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
            .disabled(textInput.isEmpty)
        }
    }
}

// MARK: - 预览
struct AssessmentView_Previews: PreviewProvider {
    static var previews: some View {
        AssessmentView()
    }
}
