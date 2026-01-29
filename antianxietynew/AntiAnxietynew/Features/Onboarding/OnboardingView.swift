// OnboardingView.swift
// 新手引导视图 - Liquid Glass 风格

import SwiftUI

struct OnboardingView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @Binding var isComplete: Bool
    @Environment(\.screenMetrics) private var metrics
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        ZStack {
            // 深渊背景
            AbyssBackground()
            
            VStack(spacing: 0) {
                // 进度指示器
                progressIndicator
                    .padding(.top, metrics.safeAreaInsets.top + (metrics.isCompactHeight ? 8 : 20))
                
                // 步骤内容
                TabView(selection: $viewModel.currentStep) {
                    welcomeStep.tag(1)
                    basicInfoStep.tag(2)
                    goalsStep.tag(3)
                    lifestyleStep.tag(4)
                    preferencesStep.tag(5)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: viewModel.currentStep)
            }
            
            // 加载指示器
            if viewModel.isLoading || viewModel.isSaving {
                loadingOverlay
            }
        }
        .task {
            await viewModel.loadProgress()
        }
        .onChange(of: viewModel.isComplete) { newValue in
            if newValue {
                isComplete = true
            }
        }
    }
    
    // MARK: - Progress Indicator
    
    private var progressIndicator: some View {
        HStack(spacing: 8) {
            ForEach(1...5, id: \.self) { step in
                Capsule()
                    .fill(step <= viewModel.currentStep 
                        ? Color.liquidGlassAccent 
                        : Color.white.opacity(0.2))
                    .frame(height: 4)
                    .animation(.spring(response: 0.3), value: viewModel.currentStep)
            }
        }
        .liquidGlassPageWidth()
    }
    
    // MARK: - Step 1: Welcome
    
    private var welcomeStep: some View {
        let ringSize: CGFloat = metrics.isCompactHeight ? 150 : 180
        let iconSize: CGFloat = metrics.isCompactWidth ? 60 : 70
        return VStack(spacing: 32) {
            Spacer()
            
            // Logo 和动画
            ZStack {
                PulsingRingsView(color: .liquidGlassAccent)
                    .frame(width: ringSize, height: ringSize)
                
                Image(systemName: "brain.head.profile")
                    .font(.system(size: iconSize))
                    .foregroundColor(.liquidGlassAccent)
            }
            
            VStack(spacing: 16) {
                Text("欢迎来到 AntiAnxiety")
                    .font(.title.bold())
                    .foregroundColor(.bioTextPrimary(for: colorScheme))
                
                Text("你的 AI 健康伙伴\n帮助你更好地了解和管理自己的身心状态")
                    .font(.subheadline)
                    .foregroundColor(.bioTextSecondary(for: colorScheme))
                    .multilineTextAlignment(.center)
            }
            
            Spacer()
            
            VStack(spacing: 16) {
                Button {
                    viewModel.nextStep()
                } label: {
                    Text("开始设置")
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                
                Button {
                    Task {
                        if await viewModel.skip() {
                            isComplete = true
                        }
                    }
                } label: {
                    Text("跳过")
                        .font(.subheadline)
                        .foregroundColor(.bioTextSecondary(for: colorScheme))
                }
            }
            .padding(.bottom, metrics.isCompactHeight ? 24 : 40)
        }
        .liquidGlassPageWidth(alignment: .center)
    }
    
    // MARK: - Step 2: Basic Info
    
    private var basicInfoStep: some View {
        VStack(spacing: 24) {
            stepHeader(
                title: "基本信息",
                subtitle: "让我们先了解一下你"
            )
            
            ScrollView {
                VStack(spacing: 20) {
                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(spacing: 16) {
                            LiquidGlassTextField(
                                placeholder: "你的名字",
                                text: Binding(
                                    get: { viewModel.onboardingData.name ?? "" },
                                    set: { viewModel.onboardingData.name = $0 }
                                ),
                                icon: "person.fill"
                            )
                            
                            // 年龄选择
                            HStack(spacing: 14) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.liquidGlassAccent.opacity(0.15))
                                        .frame(width: 32, height: 32)
                                    Image(systemName: "calendar")
                                        .font(.system(size: 14))
                                        .foregroundColor(.liquidGlassAccent)
                                }
                                
                                Text("年龄")
                                    .font(.subheadline)
                                    .foregroundColor(.bioTextPrimary(for: colorScheme))
                                
                                Spacer()
                                
                                Picker("年龄", selection: Binding(
                                    get: { viewModel.onboardingData.age ?? 25 },
                                    set: { viewModel.onboardingData.age = $0 }
                                )) {
                                    ForEach(18...80, id: \.self) { age in
                                        Text("\(age) 岁").tag(age)
                                    }
                                }
                                .pickerStyle(.menu)
                                .tint(.liquidGlassAccent)
                            }
                        }
                    }
                    
                    // 性别选择
                    VStack(alignment: .leading, spacing: 12) {
                        LiquidGlassSectionHeader(title: "性别", icon: "person.2.fill")
                        
                        LiquidGlassCard(style: .standard, padding: 16) {
                            HStack(spacing: 12) {
                                genderButton("male", label: "男", icon: "figure.stand")
                                genderButton("female", label: "女", icon: "figure.stand.dress")
                                genderButton("other", label: "其他", icon: "figure.wave")
                            }
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
            
            navigationButtons()
        }
    }
    
    private func genderButton(_ value: String, label: String, icon: String) -> some View {
        Button {
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            viewModel.onboardingData.gender = value
        } label: {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                Text(label)
                    .font(.caption)
            }
            .foregroundColor(viewModel.onboardingData.gender == value ? .bgPrimary : .bioTextSecondary(for: colorScheme))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                viewModel.onboardingData.gender == value
                    ? Color.liquidGlassAccent
                    : Color.white.opacity(0.05)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    
    // MARK: - Step 3: Goals
    
    private var goalsStep: some View {
        VStack(spacing: 24) {
            stepHeader(
                title: "健康目标",
                subtitle: "你最想改善的是什么？"
            )
            
            ScrollView {
                VStack(spacing: 16) {
                    goalOption("anxiety", label: "缓解焦虑", icon: "brain.head.profile", color: .liquidGlassPurple)
                    goalOption("sleep", label: "改善睡眠", icon: "moon.zzz.fill", color: .liquidGlassAccent)
                    goalOption("stress", label: "压力管理", icon: "waveform.path.ecg", color: .statusWarning)
                    goalOption("mood", label: "情绪调节", icon: "heart.fill", color: .statusError)
                    goalOption("focus", label: "提升专注", icon: "scope", color: .statusSuccess)
                    goalOption("general", label: "整体健康", icon: "figure.mind.and.body", color: .liquidGlassWarm)
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
            
            navigationButtons()
        }
    }
    
    private func goalOption(_ value: String, label: String, icon: String, color: Color) -> some View {
        Button {
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            viewModel.onboardingData.primaryGoal = value
        } label: {
            LiquidGlassCard(style: viewModel.onboardingData.primaryGoal == value ? .elevated : .standard, padding: 16) {
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(color.opacity(0.2))
                            .frame(width: 44, height: 44)
                        Image(systemName: icon)
                            .font(.system(size: 20))
                            .foregroundColor(color)
                    }
                    
                    Text(label)
                        .font(.headline)
                        .foregroundColor(.bioTextPrimary(for: colorScheme))
                    
                    Spacer()
                    
                    if viewModel.onboardingData.primaryGoal == value {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.statusSuccess)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - Step 4: Lifestyle
    
    private var lifestyleStep: some View {
        VStack(spacing: 24) {
            stepHeader(
                title: "生活方式",
                subtitle: "帮助我们更好地了解你"
            )
            
            ScrollView {
                VStack(spacing: 20) {
                    // 睡眠时间
                    VStack(alignment: .leading, spacing: 12) {
                        LiquidGlassSectionHeader(title: "平均睡眠时间", icon: "moon.zzz.fill")
                        
                        LiquidGlassCard(style: .standard, padding: 16) {
                            VStack(spacing: 12) {
                                Text(String(format: "%.1f 小时", viewModel.onboardingData.sleepHours ?? 7))
                                    .font(.system(size: 32, weight: .bold, design: .rounded))
                                    .foregroundColor(.liquidGlassAccent)
                                
                                Slider(
                                    value: Binding(
                                        get: { viewModel.onboardingData.sleepHours ?? 7 },
                                        set: { viewModel.onboardingData.sleepHours = $0 }
                                    ),
                                    in: 4...12,
                                    step: 0.5
                                )
                                .tint(.liquidGlassAccent)
                            }
                        }
                    }
                    
                    // 运动频率
                    VStack(alignment: .leading, spacing: 12) {
                        LiquidGlassSectionHeader(title: "运动频率", icon: "figure.run")
                        
                        LiquidGlassCard(style: .standard, padding: 16) {
                            HStack(spacing: 8) {
                                exerciseButton("rarely", label: "很少")
                                exerciseButton("sometimes", label: "偶尔")
                                exerciseButton("regular", label: "经常")
                            }
                        }
                    }
                    
                    // 压力水平
                    VStack(alignment: .leading, spacing: 12) {
                        LiquidGlassSectionHeader(title: "当前压力水平", icon: "gauge.high")
                        
                        LiquidGlassCard(style: .standard, padding: 16) {
                            VStack(spacing: 12) {
                                Text("\(viewModel.onboardingData.stressLevel ?? 5)")
                                    .font(.system(size: 32, weight: .bold, design: .rounded))
                                    .foregroundColor(stressColor)
                                
                                Slider(
                                    value: Binding(
                                        get: { Double(viewModel.onboardingData.stressLevel ?? 5) },
                                        set: { viewModel.onboardingData.stressLevel = Int($0) }
                                    ),
                                    in: 1...10,
                                    step: 1
                                )
                                .tint(stressColor)
                                
                                HStack {
                                    Text("低压力")
                                        .font(.caption2)
                                        .foregroundColor(.bioTextSecondary(for: colorScheme).opacity(0.6))
                                    Spacer()
                                    Text("高压力")
                                        .font(.caption2)
                                        .foregroundColor(.bioTextSecondary(for: colorScheme).opacity(0.6))
                                }
                            }
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
            
            navigationButtons()
        }
    }
    
    private var stressColor: Color {
        let level = viewModel.onboardingData.stressLevel ?? 5
        if level <= 3 { return .statusSuccess }
        if level <= 6 { return .statusWarning }
        return .statusError
    }
    
    private func exerciseButton(_ value: String, label: String) -> some View {
        Button {
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            viewModel.onboardingData.exerciseFrequency = value
        } label: {
            Text(label)
                .font(.subheadline.bold())
                .foregroundColor(viewModel.onboardingData.exerciseFrequency == value ? .bgPrimary : .bioTextSecondary(for: colorScheme))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    viewModel.onboardingData.exerciseFrequency == value
                        ? Color.liquidGlassAccent
                        : Color.white.opacity(0.05)
                )
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }
    
    // MARK: - Step 5: Preferences
    
    private var preferencesStep: some View {
        VStack(spacing: 24) {
            stepHeader(
                title: "偏好设置",
                subtitle: "最后一步，自定义你的体验"
            )
            
            ScrollView {
                VStack(spacing: 20) {
                    // 通知设置
                    LiquidGlassCard(style: .standard, padding: 16) {
                        Toggle(isOn: Binding(
                            get: { viewModel.onboardingData.notificationEnabled ?? true },
                            set: { viewModel.onboardingData.notificationEnabled = $0 }
                        )) {
                            HStack(spacing: 14) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.statusSuccess.opacity(0.15))
                                        .frame(width: 32, height: 32)
                                    Image(systemName: "bell.fill")
                                        .font(.system(size: 14))
                                        .foregroundColor(.statusSuccess)
                                }
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("启用通知")
                                        .font(.subheadline)
                                        .foregroundColor(.bioTextPrimary(for: colorScheme))
                                    Text("接收每日校准提醒")
                                        .font(.caption)
                                        .foregroundColor(.bioTextSecondary(for: colorScheme))
                                }
                            }
                        }
                        .toggleStyle(LiquidGlassToggleStyle())
                    }
                    
                    // 语言选择
                    VStack(alignment: .leading, spacing: 12) {
                        LiquidGlassSectionHeader(title: "语言", icon: "globe")
                        
                        LiquidGlassCard(style: .standard, padding: 16) {
                            HStack(spacing: 12) {
                                languageButton("zh", label: "中文")
                                languageButton("en", label: "English")
                            }
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
            
            // 完成按钮
            VStack(spacing: 16) {
                Button {
                    print("[Onboarding] 开始使用按钮被点击")
                    
                    // 触觉反馈
                    let impact = UIImpactFeedbackGenerator(style: .medium)
                    impact.impactOccurred()
                    
                    // 保存数据到本地
                    let data: [String: String] = [
                        "notification_enabled": String(viewModel.onboardingData.notificationEnabled ?? true),
                        "language": viewModel.onboardingData.language ?? "zh"
                    ]
                    
                    // 直接标记 Onboarding 完成
                    UserDefaults.standard.set(true, forKey: "isOnboardingComplete")
                    // isOnboardingComplete = true // Removed invalid line
                    isComplete = true
                    
                    print("[Onboarding] 已完成 Onboarding")
                    
                    // 后台异步同步到服务器
                    Task {
                        _ = await viewModel.saveStep(data)
                    }
                } label: {
                    Text("开始使用")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                .frame(maxWidth: .infinity)
                .contentShape(Rectangle())
                
                Button {
                    viewModel.prevStep()
                } label: {
                    Text("上一步")
                        .font(.subheadline)
                        .foregroundColor(.bioTextSecondary(for: colorScheme))
                }
            }
            .liquidGlassPageWidth(alignment: .center)
            .padding(.bottom, metrics.isCompactHeight ? 24 : 40)
        }
    }
    
    private func languageButton(_ value: String, label: String) -> some View {
        Button {
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            viewModel.onboardingData.language = value
        } label: {
            Text(label)
                .font(.subheadline.bold())
                .foregroundColor(viewModel.onboardingData.language == value ? .bgPrimary : .bioTextSecondary(for: colorScheme))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    viewModel.onboardingData.language == value
                        ? Color.liquidGlassAccent
                        : Color.white.opacity(0.05)
                )
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }
    
    // MARK: - Helpers
    
    private func stepHeader(title: String, subtitle: String) -> some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.title2.bold())
                .foregroundColor(.bioTextPrimary(for: colorScheme))
            
            Text(subtitle)
                .font(.subheadline)
                .foregroundColor(.bioTextSecondary(for: colorScheme))
        }
        .padding(.top, metrics.isCompactHeight ? 16 : 32)
    }
    
    private func navigationButtons() -> some View {
        HStack(spacing: 16) {
            if viewModel.currentStep > 1 {
                Button {
                    viewModel.prevStep()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                        .foregroundColor(.bioTextSecondary(for: colorScheme))
                        .frame(width: 50, height: 50)
                        .background(Color.white.opacity(0.1))
                        .clipShape(Circle())
                }
            }
            
            Spacer()
            
            Button {
                print("[Onboarding] 继续按钮被点击，当前步骤: \(viewModel.currentStep)")
                
                // 触觉反馈
                let impact = UIImpactFeedbackGenerator(style: .medium)
                impact.impactOccurred()
                
                // 同步保存数据到本地
                let data = collectStepData()
                saveDataLocally(data)
                
                // 直接前进到下一步
                withAnimation(.easeInOut(duration: 0.3)) {
                    viewModel.currentStep += 1
                }
                
                print("[Onboarding] 已前进到步骤: \(viewModel.currentStep)")
                
                // 后台异步同步到服务器
                Task {
                    _ = await viewModel.saveStep(data)
                }
            } label: {
                HStack(spacing: 8) {
                    Text("继续")
                    Image(systemName: "chevron.right")
                }
            }
            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
        }
        .liquidGlassPageWidth()
        .padding(.bottom, metrics.isCompactHeight ? 24 : 40)
    }
    
    private func collectStepData() -> [String: String] {
        var data: [String: String] = [:]
        
        switch viewModel.currentStep {
        case 2:
            if let name = viewModel.onboardingData.name { data["name"] = name }
            if let age = viewModel.onboardingData.age { data["age"] = String(age) }
            if let gender = viewModel.onboardingData.gender { data["gender"] = gender }
        case 3:
            if let goal = viewModel.onboardingData.primaryGoal { data["primary_goal"] = goal }
        case 4:
            if let sleep = viewModel.onboardingData.sleepHours { data["sleep_hours"] = String(sleep) }
            if let exercise = viewModel.onboardingData.exerciseFrequency { data["exercise_frequency"] = exercise }
            if let stress = viewModel.onboardingData.stressLevel { data["stress_level"] = String(stress) }
        default:
            break
        }
        
        return data
    }
    
    private func saveDataLocally(_ data: [String: String]) {
        // 将数据保存到 viewModel 的 onboardingData
        switch viewModel.currentStep {
        case 2:
            if let name = data["name"] { viewModel.onboardingData.name = name }
            if let ageStr = data["age"], let age = Int(ageStr) { viewModel.onboardingData.age = age }
            if let gender = data["gender"] { viewModel.onboardingData.gender = gender }
        case 3:
            if let goal = data["primary_goal"] { viewModel.onboardingData.primaryGoal = goal }
        case 4:
            if let sleepStr = data["sleep_hours"], let sleep = Double(sleepStr) { viewModel.onboardingData.sleepHours = sleep }
            if let exercise = data["exercise_frequency"] { viewModel.onboardingData.exerciseFrequency = exercise }
            if let stressStr = data["stress_level"], let stress = Int(stressStr) { viewModel.onboardingData.stressLevel = stress }
        default:
            break
        }
        
        // 持久化到 UserDefaults
        if let encoded = try? JSONEncoder().encode(viewModel.onboardingData) {
            UserDefaults.standard.set(encoded, forKey: "onboarding_data")
        }
    }
    
    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
            
            ProgressView()
                .scaleEffect(1.5)
                .tint(.liquidGlassAccent)
        }
    }
}

// MARK: - Preview

struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingView(isComplete: .constant(false))
            .preferredColorScheme(.dark)
    }
}
