// SettingsView.swift
// 设置视图

import SwiftUI
import PhotosUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject var appSettings: AppSettings
    @ObservedObject var supabase = SupabaseManager.shared
    @StateObject private var viewModel = SettingsViewModel()
    @State private var selectedPhotoItem: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            ZStack {
                List {
                    accountSection
                    languageSection
                    aiStyleSection
                    healthSection
                    notificationsSection
                    privacySection
                    aboutSection
                    saveSection
                    signOutSection
                }
                .listStyle(.insetGrouped)
                .navigationTitle(L10n.text("设置", "Settings", language: appSettings.language))
                .task {
                    viewModel.preferredLanguage = appSettings.language
                    await viewModel.load()
                    appSettings.language = viewModel.preferredLanguage
                }
                .onChange(of: selectedPhotoItem) { newItem in
                    guard let newItem else { return }
                    Task { await viewModel.updateAvatar(from: newItem) }
                }
                .onChange(of: viewModel.preferredLanguage) { newValue in
                    appSettings.language = newValue
                }
                .alert("错误", isPresented: Binding(
                    get: { viewModel.error != nil },
                    set: { if !$0 { viewModel.error = nil } }
                )) {
                    Button("确定") { viewModel.error = nil }
                } message: {
                    Text(viewModel.error ?? "")
                }

                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.1)
                }
            }
        }
    }

    private var accountSection: some View {
        Section(header: Text(L10n.text("账号", "Account", language: appSettings.language))) {
            HStack(spacing: 16) {
                avatarView
                VStack(alignment: .leading, spacing: 6) {
                    TextField(L10n.text("昵称", "Display name", language: appSettings.language), text: $viewModel.displayName)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                    Text(supabase.currentUser?.email ?? "未登录")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
            }

            PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                Label(
                    viewModel.isUploadingAvatar
                        ? L10n.text("上传中", "Uploading", language: appSettings.language)
                        : L10n.text("更换头像", "Change avatar", language: appSettings.language),
                    systemImage: "camera"
                )
            }
            .disabled(viewModel.isUploadingAvatar)
        }
    }

    private var languageSection: some View {
        Section(header: Text(L10n.text("语言", "Language", language: appSettings.language))) {
            Picker(L10n.text("语言", "Language", language: appSettings.language), selection: $viewModel.preferredLanguage) {
                ForEach(AppLanguage.allCases) { language in
                    Text(language.displayName).tag(language)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private var aiStyleSection: some View {
        Section(header: Text("AI 风格")) {
            Picker("AI 风格", selection: $viewModel.aiStyle) {
                ForEach(AIStyle.allCases) { style in
                    Text(style.displayName).tag(style)
                }
            }
            .pickerStyle(.segmented)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("诚实度")
                    Spacer()
                    Text("\(Int(viewModel.honesty))%")
                        .foregroundColor(.secondary)
                }
                Slider(value: $viewModel.honesty, in: 0...100, step: 1)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("幽默感")
                    Spacer()
                    Text("\(Int(viewModel.humor))%")
                        .foregroundColor(.secondary)
                }
                Slider(value: $viewModel.humor, in: 0...100, step: 1)
            }
        }
    }

    private var healthSection: some View {
        Section("健康数据") {
            NavigationLink { HealthKitSettingsView() } label: {
                Label("HealthKit", systemImage: "heart.fill")
            }
            NavigationLink { } label: {
                Label("穿戴设备", systemImage: "applewatch")
            }
        }
    }

    private var notificationsSection: some View {
        Section("通知") {
            Toggle(isOn: $viewModel.notificationsEnabled) {
                Label("推送通知", systemImage: "bell.fill")
            }
            if viewModel.notificationsEnabled {
                Toggle(isOn: $viewModel.dailyReminderEnabled) {
                    Label("每日校准提醒", systemImage: "clock.fill")
                }
            }
        }
    }

    private var privacySection: some View {
        Section("隐私与安全") {
            Toggle(isOn: $viewModel.biometricEnabled) {
                Label("生物识别锁", systemImage: "faceid")
            }
            NavigationLink { } label: {
                Label("导出数据", systemImage: "square.and.arrow.up")
            }
            NavigationLink { } label: {
                Label("隐私政策", systemImage: "hand.raised.fill")
            }
        }
    }

    private var aboutSection: some View {
        Section("关于") {
            HStack {
                Text("版本")
                Spacer()
                Text("1.0.0 (Swift)").foregroundColor(.secondary)
            }
            NavigationLink { } label: {
                Label("反馈与帮助", systemImage: "questionmark.circle")
            }
        }
    }

    private var saveSection: some View {
        Section {
            Button {
                Task { await viewModel.save() }
            } label: {
                HStack {
                    Spacer()
                    if viewModel.isSaving {
                        ProgressView()
                    } else {
                        Text(L10n.text("保存设置", "Save Settings", language: appSettings.language))
                    }
                    Spacer()
                }
            }
            .disabled(viewModel.isSaving)
        }
    }

    private var signOutSection: some View {
        Section {
            Button(role: .destructive) {
                Task { await supabase.signOut() }
            } label: {
                HStack {
                    Spacer()
                    Text("退出登录")
                    Spacer()
                }
            }
        }
    }

    private var avatarView: some View {
        ZStack {
            if let preview = viewModel.avatarPreview {
                Image(uiImage: preview)
                    .resizable()
                    .scaledToFill()
            } else if let urlString = viewModel.avatarURL, let url = URL(string: urlString) {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.liquidGlassAccent)
                }
            } else {
                Image(systemName: "person.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.liquidGlassAccent)
            }

            if viewModel.isUploadingAvatar {
                Color.black.opacity(0.35)
                ProgressView()
                    .tint(.white)
            }
        }
        .frame(width: 64, height: 64)
        .clipShape(Circle())
    }
}

struct HealthKitSettingsView: View {
    @StateObject private var healthKit = HealthKitService.shared

    var body: some View {
        List {
            Section {
                HStack {
                    Text("状态")
                    Spacer()
                    StatusPill(text: healthKit.isAuthorized ? "已授权" : "未授权", color: healthKit.isAuthorized ? .statusSuccess : .statusWarning)
                }
                if !healthKit.isAuthorized {
                    Button("请求授权") {
                        Task { try? await healthKit.requestAuthorization() }
                    }
                }
            }
            Section("数据类型") {
                Label("心率变异性 (HRV)", systemImage: "waveform.path.ecg")
                Label("静息心率", systemImage: "heart.fill")
                Label("睡眠分析", systemImage: "moon.zzz.fill")
                Label("步数", systemImage: "figure.walk")
            }
        }
        .navigationTitle("HealthKit")
    }
}

enum AIStyle: String, CaseIterable, Identifiable {
    case max = "max"
    case zenMaster = "zen_master"
    case drHouse = "dr_house"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .max: return "Max"
        case .zenMaster: return "Zen Master"
        case .drHouse: return "Dr. House"
        }
    }
}

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var displayName = ""
    @Published var avatarURL: String?
    @Published var avatarPreview: UIImage?

    @Published var aiStyle: AIStyle = .max
    @Published var honesty: Double = 90
    @Published var humor: Double = 65
    @Published var preferredLanguage: AppLanguage = .zh

    @Published var notificationsEnabled = true
    @Published var dailyReminderEnabled = true
    @Published var biometricEnabled = false

    @Published var isLoading = false
    @Published var isSaving = false
    @Published var isUploadingAvatar = false
    @Published var error: String?

    private let supabase = SupabaseManager.shared
    private var primaryGoal: String?
    private var currentFocus: String?

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            if let profile = try await supabase.getProfileSettings() {
                displayName = profile.full_name ?? ""
                avatarURL = profile.avatar_url
                primaryGoal = profile.primary_goal
                currentFocus = profile.current_focus

                if let raw = profile.ai_personality, let style = AIStyle(rawValue: raw) {
                    aiStyle = style
                }

                let parsed = parseAISettings(settings: profile.ai_settings, context: profile.ai_persona_context)
                honesty = parsed.honesty
                humor = parsed.humor

                if let languageRaw = profile.preferred_language, let lang = AppLanguage(rawValue: languageRaw) {
                    preferredLanguage = lang
                }
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func save() async {
        isSaving = true
        error = nil
        defer { isSaving = false }

        let trimmedName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        let personaContext = buildPersonaContext(
            goal: primaryGoal,
            focus: currentFocus,
            personality: aiStyle,
            honesty: honesty,
            humor: humor
        )

        let aiSettings = AISettings(
            honesty_level: honesty,
            humor_level: humor,
            mode: aiStyle.rawValue
        )

        let update = ProfileSettingsUpdate(
            full_name: trimmedName,
            ai_personality: aiStyle.rawValue,
            ai_persona_context: personaContext,
            ai_settings: aiSettings,
            preferred_language: preferredLanguage.rawValue
        )

        do {
            if let profile = try await supabase.updateProfileSettings(update) {
                displayName = profile.full_name ?? displayName
                avatarURL = profile.avatar_url ?? avatarURL
                if let languageRaw = profile.preferred_language, let lang = AppLanguage(rawValue: languageRaw) {
                    preferredLanguage = lang
                }
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func updateAvatar(from item: PhotosPickerItem) async {
        isUploadingAvatar = true
        defer { isUploadingAvatar = false }

        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                throw NSError(domain: "Avatar", code: 0, userInfo: [NSLocalizedDescriptionKey: "无法读取图片"])
            }
            guard let image = UIImage(data: data) else {
                throw NSError(domain: "Avatar", code: 0, userInfo: [NSLocalizedDescriptionKey: "图片解析失败"])
            }

            avatarPreview = image
            let jpegData = image.jpegData(compressionQuality: 0.82) ?? data
            let url = try await supabase.uploadAvatar(imageData: jpegData)
            avatarURL = url
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func parseAISettings(settings: AISettings?, context: String?) -> (honesty: Double, humor: Double) {
        if let settings, let honesty = settings.honesty_level {
            return (honesty, settings.humor_level ?? 65)
        }

        guard let context else { return (90, 65) }
        let honesty = extractPercent(from: context, pattern: "诚实度:\\s*(\\d+)%") ?? 90
        let humor = extractPercent(from: context, pattern: "幽默感:\\s*(\\d+)%") ?? 65
        return (honesty, humor)
    }

    private func extractPercent(from text: String, pattern: String) -> Double? {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let range = NSRange(text.startIndex..., in: text)
        guard let match = regex.firstMatch(in: text, range: range),
              let valueRange = Range(match.range(at: 1), in: text) else {
            return nil
        }
        return Double(text[valueRange])
    }

    private func buildPersonaContext(
        goal: String?,
        focus: String?,
        personality: AIStyle,
        honesty: Double,
        humor: Double
    ) -> String {
        let goalMap: [String: String] = [
            "lose_weight": "减脂塑形",
            "improve_sleep": "改善睡眠质量",
            "boost_energy": "提升精力和活力",
            "maintain_energy": "保持健康状态"
        ]

        let personalityMap: [AIStyle: String] = [
            .max: "MAX模式：简洁干练，带有干幽默，贝叶斯推理引擎",
            .zenMaster: "Zen Master模式：平静哲学，深思熟虑，禅意智慧",
            .drHouse: "Dr. House模式：直接诊断，不绕弯子，医学专家"
        ]

        let personalityStyles: [AIStyle: String] = [
            .max: "简洁干练，带有干幽默，使用贝叶斯推理框架",
            .zenMaster: "平静哲学，深思熟虑，禅意智慧，引导式对话",
            .drHouse: "直接诊断，不绕弯子，医学专家视角，循证分析"
        ]

        let goalKey = goal ?? "maintain_energy"
        let focusText = (focus?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false)
            ? (focus ?? "")
            : "无特殊说明"

        let honestyValue = Int(honesty.rounded())
        let humorValue = Int(humor.rounded())
        let honestyDesc = honestyValue > 70 ? "直接坦率" : honestyValue > 40 ? "适度委婉" : "温和外交"
        let humorDesc = humorValue > 70 ? "机智风趣" : humorValue > 40 ? "适度幽默" : "严肃专业"

        var context = """
        用户主要目标：\(goalMap[goalKey] ?? goalKey)

        AI性格设定：\(personalityMap[personality] ?? personality.rawValue)

        用户当前关注点：\(focusText)

        重要提示：
        - 基于用户的主要目标调整建议优先级
        - 遵循设定的性格风格进行对话
        - 始终考虑用户的特殊关注点，避免不适合的建议
        """.trimmingCharacters(in: .whitespacesAndNewlines)

        let styleText = personalityStyles[personality] ?? "专业友好"
        context += """

        AI 引擎配置：
        - 人格模式: \(personalityMap[personality] ?? personality.rawValue)
        - 诚实度: \(honestyValue)% (\(honestyDesc))
        - 幽默感: \(humorValue)% (\(humorDesc))

        行为准则：
        - 风格特点: \(styleText)
        - 根据诚实度调整表达的直接程度
        - 根据幽默感添加适当的机智评论
        \(humorValue >= 100 ? "- 🎉 彩蛋模式激活：可以更加放飞自我，增加趣味性" : "")
        """

        return context
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
            .environmentObject(AppSettings())
            .preferredColorScheme(.dark)
    }
}
