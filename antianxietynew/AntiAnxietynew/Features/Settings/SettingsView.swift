// SettingsView.swift
// 设置视图 - Liquid Glass 风格

import SwiftUI
import UserNotifications
import LocalAuthentication

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    @ObservedObject var supabase = SupabaseManager.shared
    @ObservedObject var themeManager = ThemeManager.shared
    @EnvironmentObject var appSettings: AppSettings
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 深渊背景
                AbyssBackground()
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: metrics.sectionSpacing) {
                        // ==========================================
                        // 用户资料卡片
                        // ==========================================
                        userProfileCard

                        // ==========================================
                        // 会员与授权
                        // ==========================================
                        membershipSection
                        
                        // ==========================================
                        // 健康数据
                        // ==========================================
                        healthDataSection
                        
                        // ==========================================
                        // 通知设置
                        // ==========================================
                        notificationSection
                        
                        // ==========================================
                        // 隐私与安全
                        // ==========================================
                        privacySection
                        
                        // ==========================================
                        // 外观
                        // ==========================================
                        appearanceSection
                        
                        // ==========================================
                        // 语言
                        // ==========================================
                        languageSection
                        
                        // ==========================================
                        // 关于
                        // ==========================================
                        aboutSection
                        
                        // ==========================================
                        // 退出登录
                        // ==========================================
                        logoutButton
                    }
                    .liquidGlassPageWidth()
                    .padding(.vertical, metrics.verticalPadding)
                }
            }
            .navigationTitle("设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("设置")
                        .font(.headline)
                        .foregroundColor(.white)
                }
            }
            .alert(
                "提示",
                isPresented: Binding(
                    get: { viewModel.alertMessage != nil },
                    set: { _ in viewModel.alertMessage = nil }
                )
            ) {
                Button("知道了", role: .cancel) {}
            } message: {
                Text(viewModel.alertMessage ?? "")
            }
            .onChange(of: viewModel.notificationsEnabled) { newValue in
                viewModel.handleNotificationsChanged(newValue)
            }
            .onChange(of: viewModel.dailyReminderEnabled) { newValue in
                viewModel.handleDailyReminderChanged(newValue)
            }
            .onChange(of: viewModel.biometricEnabled) { newValue in
                viewModel.handleBiometricChanged(newValue)
            }
        }
    }
    
    // MARK: - 用户资料卡片
    
    private var userProfileCard: some View {
        let avatarSize: CGFloat = metrics.isCompactWidth ? 52 : 60
        let iconSize: CGFloat = metrics.isCompactWidth ? 48 : 56
        return NavigationLink(destination: ProfileView()) {
            LiquidGlassCard(style: .elevated, padding: 20) {
                HStack(spacing: 16) {
                    // 头像
                    ZStack {
                        Circle()
                            .fill(LinearGradient.accentFlow)
                            .frame(width: avatarSize, height: avatarSize)
                            .blur(radius: 4)
                            .opacity(0.5)
                        
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: iconSize))
                            .foregroundColor(.liquidGlassAccent)
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text(supabase.currentUser?.email?.components(separatedBy: "@").first ?? "探索者")
                            .font(.title3.bold())
                            .foregroundColor(.white)
                        
                        Text(supabase.currentUser?.email ?? "未登录")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                        
                        StatusPill(text: "已验证", color: .statusSuccess)
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.textTertiary)
                }
            }
        }
        .buttonStyle(.plain)
    }
    
    // MARK: - 健康数据
    
    private var healthDataSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "健康数据", icon: "heart.fill")
            
            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 0) {
                    LiquidGlassSettingsRow(
                        icon: "heart.fill",
                        iconColor: .statusError,
                        title: "HealthKit",
                        subtitle: "连接 Apple 健康"
                    ) {
                        HealthKitSettingsViewNew()
                    }
                    
                    Divider()
                        .background(Color.white.opacity(0.05))
                        .padding(.leading, 46)
                    
                    LiquidGlassSettingsRow(
                        icon: "applewatch",
                        iconColor: .liquidGlassPrimary,
                        title: "穿戴设备",
                        subtitle: "管理已连接设备"
                    ) {
                        WearablesView()
                    }
                }
            }
        }
    }
    
    // MARK: - 通知设置
    
    private var notificationSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "通知", icon: "bell.fill")
            
            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 16) {
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.statusSuccess.opacity(0.15))
                                .frame(width: 32, height: 32)
                            Image(systemName: "bell.fill")
                                .font(.system(size: 14))
                                .foregroundColor(.statusSuccess)
                        }
                        
                        Text("推送通知")
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                        
                        Spacer()
                        
                        Toggle("", isOn: $viewModel.notificationsEnabled)
                            .toggleStyle(LiquidGlassToggleStyle())
                            .labelsHidden()
                    }
                    
                    if viewModel.notificationsEnabled {
                        Divider()
                            .background(Color.white.opacity(0.05))
                            .padding(.leading, 46)
                        
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.liquidGlassWarm.opacity(0.15))
                                    .frame(width: 32, height: 32)
                                Image(systemName: "clock.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(.liquidGlassWarm)
                            }
                            
                            Text("每日校准提醒")
                                .font(.subheadline)
                                .foregroundColor(.textPrimary)
                            
                            Spacer()
                            
                            Toggle("", isOn: $viewModel.dailyReminderEnabled)
                                .toggleStyle(LiquidGlassToggleStyle())
                                .labelsHidden()
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - 隐私与安全
    
    private var privacySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "隐私与安全", icon: "lock.fill")
            
            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 0) {
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.liquidGlassPurple.opacity(0.15))
                                .frame(width: 32, height: 32)
                            Image(systemName: "faceid")
                                .font(.system(size: 14))
                                .foregroundColor(.liquidGlassPurple)
                        }
                        
                        Text("生物识别锁")
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                        
                        Spacer()
                        
                        Toggle("", isOn: $viewModel.biometricEnabled)
                            .toggleStyle(LiquidGlassToggleStyle())
                            .labelsHidden()
                    }
                    
                    Divider()
                        .background(Color.white.opacity(0.05))
                        .padding(.leading, 46)
                        .padding(.vertical, 12)
                    
                    LiquidGlassSettingsRow(
                        icon: "square.and.arrow.up",
                        iconColor: .liquidGlassAccent,
                        title: "导出数据"
                    ) {
                        DataExportView()
                    }
                    
                    Divider()
                        .background(Color.white.opacity(0.05))
                        .padding(.leading, 46)
                    
                    LiquidGlassSettingsRow(
                        icon: "hand.raised.fill",
                        iconColor: .liquidGlassSecondary,
                        title: "隐私政策"
                    ) {
                        PrivacyPolicyView()
                    }
                }
            }
        }
    }
    
    // MARK: - 外观
    
    private var appearanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "外观", icon: "paintpalette.fill")
            
            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 12) {
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.liquidGlassPrimary.opacity(0.15))
                                .frame(width: 32, height: 32)
                            Image(systemName: "circle.lefthalf.filled")
                                .font(.system(size: 14))
                                .foregroundColor(.liquidGlassPrimary)
                        }
                        
                        Text("外观模式")
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                        
                        Spacer()
                    }
                    
                    // 外观模式选择器
                    HStack(spacing: 8) {
                        ForEach(AppearanceMode.allCases) { mode in
                            Button {
                                let impact = UIImpactFeedbackGenerator(style: .light)
                                impact.impactOccurred()
                                themeManager.appearanceMode = mode
                            } label: {
                                Text(mode.rawValue)
                                    .font(.caption.bold())
                                    .foregroundColor(themeManager.appearanceMode == mode ? .bgPrimary : .textSecondary)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(
                                        themeManager.appearanceMode == mode
                                            ? Color.liquidGlassAccent
                                            : Color.white.opacity(0.05)
                                    )
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - 语言
    
    private var languageSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "语言", icon: "globe")
            
            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 12) {
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.liquidGlassWarm.opacity(0.15))
                                .frame(width: 32, height: 32)
                            Image(systemName: "globe")
                                .font(.system(size: 14))
                                .foregroundColor(.liquidGlassWarm)
                        }
                        
                        Text("应用语言")
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                        
                        Spacer()
                    }
                    
                    // 语言选择器
                    HStack(spacing: 8) {
                        ForEach(AppLanguage.allCases) { lang in
                            Button {
                                let impact = UIImpactFeedbackGenerator(style: .light)
                                impact.impactOccurred()
                                appSettings.language = lang
                            } label: {
                                Text(lang.displayName)
                                    .font(.caption.bold())
                                    .foregroundColor(appSettings.language == lang ? .bgPrimary : .textSecondary)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(
                                        appSettings.language == lang
                                            ? Color.liquidGlassAccent
                                            : Color.white.opacity(0.05)
                                    )
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - 关于
    
    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "关于", icon: "info.circle.fill")
            
            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 0) {
                    HStack(spacing: 14) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.textSecondary.opacity(0.15))
                                .frame(width: 32, height: 32)
                            Image(systemName: "app.badge")
                                .font(.system(size: 14))
                                .foregroundColor(.textSecondary)
                        }
                        
                        Text("版本")
                            .font(.subheadline)
                            .foregroundColor(.textPrimary)
                        
                        Spacer()
                        
                        Text("1.0.0 (Swift)")
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                    }
                    
                    Divider()
                        .background(Color.white.opacity(0.05))
                        .padding(.leading, 46)
                        .padding(.vertical, 12)
                    
                    LiquidGlassSettingsRow(
                        icon: "questionmark.circle",
                        iconColor: .liquidGlassAccent,
                        title: "反馈与帮助"
                    ) {
                        HelpCenterView()
                    }

                    Divider()
                        .background(Color.white.opacity(0.05))
                        .padding(.leading, 46)

                    LiquidGlassSettingsRow(
                        icon: "ladybug.fill",
                        iconColor: .textSecondary,
                        title: "调试会话"
                    ) {
                        DebugSessionView()
                    }
                }
            }
        }
    }

    // MARK: - 会员与授权

    private var membershipSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            LiquidGlassSectionHeader(title: "会员与授权", icon: "crown.fill")

            LiquidGlassCard(style: .standard, padding: 16) {
                VStack(spacing: 0) {
                    LiquidGlassSettingsRow(
                        icon: "crown.fill",
                        iconColor: .liquidGlassWarm,
                        title: "会员方案",
                        subtitle: "查看当前权益"
                    ) {
                        MembershipView()
                    }

                    Divider()
                        .background(Color.white.opacity(0.05))
                        .padding(.leading, 46)

                    LiquidGlassSettingsRow(
                        icon: "shield.fill",
                        iconColor: .statusSuccess,
                        title: "数据授权",
                        subtitle: "管理数据同步状态"
                    ) {
                        WearablesView()
                    }
                }
            }
        }
    }
    
    // MARK: - 退出登录
    
    private var logoutButton: some View {
        Button {
            let impact = UIImpactFeedbackGenerator(style: .medium)
            impact.impactOccurred()
            Task { await supabase.signOut() }
        } label: {
            HStack {
                Spacer()
                
                HStack(spacing: 8) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 14))
                    Text("退出登录")
                        .font(.subheadline.bold())
                }
                .foregroundColor(.statusError)
                
                Spacer()
            }
            .padding(.vertical, 16)
            .background(Color.statusError.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.statusError.opacity(0.3), lineWidth: 1)
            )
        }
        .padding(.top, 8)
    }
}

// MARK: - HealthKit 设置视图 (新版)

struct HealthKitSettingsViewNew: View {
    @StateObject private var healthKit = HealthKitService.shared
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        ZStack {
            AbyssBackground()
            
            ScrollView {
                VStack(spacing: 20) {
                    // 状态卡片
                    LiquidGlassCard(style: .elevated, padding: 20) {
                        HStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(healthKit.isAuthorized ? Color.statusSuccess.opacity(0.2) : Color.statusWarning.opacity(0.2))
                                    .frame(width: 56, height: 56)
                                
                                Image(systemName: healthKit.isAuthorized ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                                    .font(.system(size: 28))
                                    .foregroundColor(healthKit.isAuthorized ? .statusSuccess : .statusWarning)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(healthKit.isAuthorized ? "已授权" : "未授权")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                Text(healthKit.isAuthorized ? "健康数据同步已开启" : "需要授权以同步健康数据")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                            
                            Spacer()
                        }
                    }
                    
                    // 授权按钮
                    if !healthKit.isAuthorized {
                        Button {
                            let impact = UIImpactFeedbackGenerator(style: .medium)
                            impact.impactOccurred()
                            Task { try? await healthKit.requestAuthorization() }
                        } label: {
                            Text("请求授权")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                    }
                    
                    // 数据类型
                    VStack(alignment: .leading, spacing: 12) {
                        LiquidGlassSectionHeader(title: "可同步数据", icon: "heart.text.square.fill")
                        
                        LiquidGlassCard(style: .standard, padding: 16) {
                            VStack(spacing: 14) {
                                healthDataRow(icon: "waveform.path.ecg", color: .liquidGlassAccent, title: "心率变异性 (HRV)", status: "核心指标")
                                
                                Divider().background(Color.white.opacity(0.05))
                                
                                healthDataRow(icon: "heart.fill", color: .statusError, title: "静息心率", status: "健康基线")
                                
                                Divider().background(Color.white.opacity(0.05))
                                
                                healthDataRow(icon: "moon.zzz.fill", color: .liquidGlassPurple, title: "睡眠分析", status: "睡眠质量")
                                
                                Divider().background(Color.white.opacity(0.05))
                                
                                healthDataRow(icon: "figure.walk", color: .liquidGlassWarm, title: "步数", status: "活动量")
                            }
                        }
                    }
                }
                .padding()
            }
        }
        .navigationTitle("HealthKit")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func healthDataRow(icon: String, color: Color, title: String, status: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(color.opacity(0.15))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(color)
            }
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(.textPrimary)
            
            Spacer()
            
            Text(status)
                .font(.caption)
                .foregroundColor(.textTertiary)
        }
    }
}

// MARK: - ViewModel

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var notificationsEnabled: Bool
    @Published var dailyReminderEnabled: Bool
    @Published var biometricEnabled: Bool
    @Published var alertMessage: String?

    private let notificationCenter = UNUserNotificationCenter.current()
    private let dailyReminderId = "daily-calibration-reminder"
    private var isUpdating = false

    init() {
        let defaults = UserDefaults.standard
        notificationsEnabled = defaults.object(forKey: "settings_notifications_enabled") as? Bool ?? false
        dailyReminderEnabled = defaults.object(forKey: "settings_daily_reminder_enabled") as? Bool ?? false
        biometricEnabled = defaults.object(forKey: "settings_biometric_enabled") as? Bool ?? false
    }

    func handleNotificationsChanged(_ enabled: Bool) {
        guard !isUpdating else { return }
        isUpdating = true
        UserDefaults.standard.set(enabled, forKey: "settings_notifications_enabled")

        Task { @MainActor in
            if enabled {
                let granted = await requestNotificationPermission()
                if !granted {
                    notificationsEnabled = false
                    dailyReminderEnabled = false
                    UserDefaults.standard.set(false, forKey: "settings_notifications_enabled")
                    UserDefaults.standard.set(false, forKey: "settings_daily_reminder_enabled")
                    alertMessage = "通知权限未授权，请在系统设置中开启。"
                } else if dailyReminderEnabled {
                    await scheduleDailyReminder()
                }
            } else {
                notificationCenter.removeAllPendingNotificationRequests()
                dailyReminderEnabled = false
                UserDefaults.standard.set(false, forKey: "settings_daily_reminder_enabled")
            }
            isUpdating = false
        }
    }

    func handleDailyReminderChanged(_ enabled: Bool) {
        guard !isUpdating else { return }
        isUpdating = true
        UserDefaults.standard.set(enabled, forKey: "settings_daily_reminder_enabled")

        Task { @MainActor in
            if enabled {
                if !notificationsEnabled {
                    notificationsEnabled = true
                    let granted = await requestNotificationPermission()
                    if !granted {
                        notificationsEnabled = false
                        dailyReminderEnabled = false
                        UserDefaults.standard.set(false, forKey: "settings_notifications_enabled")
                        UserDefaults.standard.set(false, forKey: "settings_daily_reminder_enabled")
                        alertMessage = "通知权限未授权，请在系统设置中开启。"
                        isUpdating = false
                        return
                    }
                }
                await scheduleDailyReminder()
            } else {
                notificationCenter.removePendingNotificationRequests(withIdentifiers: [dailyReminderId])
            }
            isUpdating = false
        }
    }

    func handleBiometricChanged(_ enabled: Bool) {
        guard !isUpdating else { return }
        isUpdating = true
        UserDefaults.standard.set(enabled, forKey: "settings_biometric_enabled")

        Task { @MainActor in
            if enabled {
                let success = await authenticateBiometric()
                if !success {
                    biometricEnabled = false
                    UserDefaults.standard.set(false, forKey: "settings_biometric_enabled")
                }
            }
            isUpdating = false
        }
    }

    private func requestNotificationPermission() async -> Bool {
        await withCheckedContinuation { continuation in
            notificationCenter.requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
                continuation.resume(returning: granted)
            }
        }
    }

    private func scheduleDailyReminder() async {
        let content = UNMutableNotificationContent()
        content.title = "每日校准提醒"
        content.body = "花 2 分钟完成今日校准，Max 会更了解你。"
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = 9
        dateComponents.minute = 0

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: dailyReminderId, content: content, trigger: trigger)
        try? await notificationCenter.add(request)
    }

    private func authenticateBiometric() async -> Bool {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            alertMessage = "当前设备不支持生物识别。"
            return false
        }

        return await withCheckedContinuation { continuation in
            context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "用于开启生物识别锁"
            ) { success, _ in
                continuation.resume(returning: success)
            }
        }
    }
}

// MARK: - Preview

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
            .environmentObject(AppSettings())
            .preferredColorScheme(.dark)
    }
}

// MARK: - Settings Subviews

struct MembershipView: View {
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("会员方案")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("当前计划：基础版")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("当前权益")
                                .font(.subheadline)
                                .foregroundColor(.textPrimary)
                            Text("• 每日校准与数字孪生分析")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                            Text("• 科学期刊精选与反馈")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                            Text("• 计划引擎与习惯追踪")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }
                    }

                    LiquidGlassCard(style: .concave, padding: 16) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("升级计划")
                                .font(.subheadline)
                                .foregroundColor(.textPrimary)
                            Text("高级报告、AI 深度分析与更多 API 配额")
                                .font(.caption)
                                .foregroundColor(.textSecondary)

                            Button {
                                // 预留升级入口
                            } label: {
                                Text("联系支持")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("会员方案")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct WearablesView: View {
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("穿戴设备")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("管理 HealthKit 与设备同步")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    NavigationLink(destination: WearableConnectView(viewModel: WearableConnectViewModel())) {
                        LiquidGlassCard(style: .standard, padding: 16) {
                            HStack(spacing: 12) {
                                Image(systemName: "applewatch")
                                    .foregroundColor(.liquidGlassAccent)
                                Text("设备管理")
                                    .font(.headline)
                                    .foregroundColor(.textPrimary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.textTertiary)
                            }
                        }
                    }
                    .buttonStyle(.plain)

                    NavigationLink(destination: HealthKitSettingsViewNew()) {
                        LiquidGlassCard(style: .standard, padding: 16) {
                            HStack(spacing: 12) {
                                Image(systemName: "heart.text.square")
                                    .foregroundColor(.statusSuccess)
                                Text("HealthKit 授权")
                                    .font(.headline)
                                    .foregroundColor(.textPrimary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.textTertiary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("穿戴设备")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct DataExportView: View {
    @StateObject private var viewModel = DataExportViewModel()
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("数据导出")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                        Text("生成可导出的 JSON 快照")
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    Button {
                        Task { await viewModel.export() }
                    } label: {
                        Text(viewModel.isExporting ? "生成中..." : "生成导出文件")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                    .disabled(viewModel.isExporting)

                    if let exportText = viewModel.exportText {
                        Text(exportText)
                            .font(.caption2)
                            .foregroundColor(.textSecondary)
                            .lineLimit(12)
                    }

                    if let error = viewModel.error {
                        Text(error)
                            .font(.caption2)
                            .foregroundColor(.statusError)
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("数据导出")
        .navigationBarTitleDisplayMode(.inline)
    }
}

@MainActor
final class DataExportViewModel: ObservableObject {
    @Published var exportText: String?
    @Published var isExporting = false
    @Published var error: String?

    private let supabase = SupabaseManager.shared

    func export() async {
        isExporting = true
        error = nil
        exportText = nil
        defer { isExporting = false }

        do {
            let profile = try? await supabase.getProfileSettings()
            let logs = (try? await supabase.getWeeklyWellnessLogs()) ?? []
            let digitalTwin = try? await supabase.getDigitalTwinAnalysis()
            let hardware = try? await supabase.getHardwareData()

            let payload = ExportPayload(profile: profile, weeklyLogs: logs, digitalTwin: digitalTwin, hardware: hardware)
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            let data = try encoder.encode(payload)
            exportText = String(data: data, encoding: .utf8)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct ExportPayload: Codable {
    let profile: ProfileSettings?
    let weeklyLogs: [WellnessLog]
    let digitalTwin: DigitalTwinAnalysis?
    let hardware: HardwareData?
}

struct PrivacyPolicyView: View {
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    Text("隐私政策摘要")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("• 数据仅用于生成可解释健康建议")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                            Text("• 仅在你授权时同步穿戴设备数据")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                            Text("• 支持导出与删除个人数据")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("隐私政策")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct HelpCenterView: View {
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    Text("帮助中心")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("如需支持，请联系 support@antianxiety.ai")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                            Text("建议在反馈中附上调试会话截图")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("帮助中心")
        .navigationBarTitleDisplayMode(.inline)
    }
}
