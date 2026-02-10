//
//  AIPersonaSettingsView.swift
//  antios
//
//  A3: AI 人格设置视图
//

import SwiftUI

struct AIPersonaSettingsView: View {
    @State private var selectedPersona: AIPersona = .max
    @State private var honestyLevel: Double = 70
    @State private var humorLevel: Double = 50
    @State private var isSaving = false
    @State private var message: String?
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // 人格选择
                    personaSection
                    
                    // 调节滑块
                    adjustmentSection
                    
                    // 预览
                    previewSection
                }
                .padding(AppTheme.Spacing.md)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .alert("人格设置", isPresented: Binding(
                get: { message != nil },
                set: { if !$0 { message = nil } }
            )) {
                Button("确定", role: .cancel) {}
            } message: {
                Text(message ?? "")
            }
            .navigationTitle("AI 人格设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("保存") {
                        saveSettings()
                    }
                    .disabled(isSaving)
                }
            }
        }
        .task {
            await loadSettings()
        }
    }
    
    // MARK: - Persona Section
    
    private var personaSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("选择 AI 人格")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            ForEach(AIPersona.allCases) { persona in
                PersonaCard(
                    persona: persona,
                    isSelected: selectedPersona == persona
                ) {
                    withAnimation {
                        selectedPersona = persona
                    }
                }
            }
        }
    }
    
    // MARK: - Adjustment Section
    
    private var adjustmentSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.lg) {
            Text("个性化调节")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            // 诚实度
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                HStack {
                    Text("诚实度")
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Spacer()
                    
                    Text("\(Int(honestyLevel))%")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
                
                Slider(value: $honestyLevel, in: 0...100)
                    .tint(AppTheme.Colors.primary)
                
                Text("更高的诚实度会让 Max 更直接地指出问题")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            .cardStyle()
            
            // 幽默感
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                HStack {
                    Text("幽默感")
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Spacer()
                    
                    Text("\(Int(humorLevel))%")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
                
                Slider(value: $humorLevel, in: 0...100)
                    .tint(AppTheme.Colors.secondary)
                
                Text("更高的幽默感会让对话更轻松，但可能降低严肃性")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
            .cardStyle()
        }
    }
    
    // MARK: - Preview Section
    
    private var previewSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("对话预览")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            VStack(alignment: .leading, spacing: AppTheme.Spacing.sm) {
                Text(selectedPersona.sampleResponse(honesty: honestyLevel, humor: humorLevel))
                    .font(AppTheme.Typography.body)
                    .foregroundColor(AppTheme.Colors.textSecondary)
            }
            .cardStyle()
        }
    }
    
    // MARK: - Save
    
    private func saveSettings() {
        isSaving = true
        
        Task {
            struct SettingsRequest: Encodable {
                let mode: String
                let honesty_level: Int
                let humor_level: Int
            }
            
            do {
                let _: SettingsResponse = try await APIClient.shared.request(
                    endpoint: "max/settings",
                    method: .patch,
                    body: SettingsRequest(
                        mode: selectedPersona.maxMode,
                        honesty_level: Int(honestyLevel),
                        humor_level: Int(humorLevel)
                    )
                )
                
                await MainActor.run {
                    message = "设置已保存"
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    message = error.localizedDescription
                }
            }
            
            isSaving = false
        }
    }

    private func loadSettings() async {
        do {
            let response: SettingsResponse = try await APIClient.shared.request(
                endpoint: "max/settings",
                method: .get
            )
            if let settings = response.settings {
                honestyLevel = Double(settings.honesty_level)
                humorLevel = Double(settings.humor_level)
                selectedPersona = AIPersona.from(maxMode: settings.mode)
            }
        } catch {
            // Keep local defaults if backend unavailable.
        }
    }
}

// MARK: - Persona Card

struct PersonaCard: View {
    let persona: AIPersona
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: AppTheme.Spacing.md) {
                Image(systemName: persona.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : persona.color)
                    .frame(width: 44, height: 44)
                    .background(isSelected ? persona.color : persona.color.opacity(0.2))
                    .cornerRadius(AppTheme.CornerRadius.md)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(persona.name)
                        .font(AppTheme.Typography.headline)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Text(persona.description)
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(AppTheme.Colors.success)
                }
            }
            .cardStyle()
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.lg)
                    .stroke(isSelected ? persona.color : Color.clear, lineWidth: 2)
            )
        }
    }
}

// MARK: - AI Persona

enum AIPersona: String, CaseIterable, Identifiable {
    case max = "max"
    case zen = "zen"
    case house = "house"
    
    var id: String { rawValue }
    
    var name: String {
        switch self {
        case .max: return "Max"
        case .zen: return "Zen Master"
        case .house: return "Dr. House"
        }
    }
    
    var description: String {
        switch self {
        case .max: return "友善、专业、平衡的健康顾问"
        case .zen: return "平静、富有哲理、注重内心平和"
        case .house: return "直接、讽刺、一针见血"
        }
    }
    
    var icon: String {
        switch self {
        case .max: return "brain.head.profile"
        case .zen: return "leaf.fill"
        case .house: return "stethoscope"
        }
    }
    
    var color: Color {
        switch self {
        case .max: return AppTheme.Colors.primary
        case .zen: return .green
        case .house: return .orange
        }
    }
    
    func sampleResponse(honesty: Double, humor: Double) -> String {
        switch self {
        case .max:
            if honesty > 70 {
                return "我注意到你最近睡眠时间不足 6 小时，这对你的焦虑症状有直接影响。我们需要认真对待这个问题。"
            } else {
                return "你的睡眠有些波动，我们可以一起想想怎么改善。"
            }
        case .zen:
            return "呼吸，感受当下。睡眠如同流水，顺其自然，才能找到平静。"
        case .house:
            if humor > 50 {
                return "每天睡 5 小时？你是在训练自己成为僵尸吗？听着，你的大脑需要休息，不是咖啡。"
            } else {
                return "你的睡眠数据很糟糕。改变它，否则后果自负。"
            }
        }
    }

    var maxMode: String {
        switch self {
        case .max: return "MAX"
        case .zen: return "Zen Master"
        case .house: return "Dr. House"
        }
    }

    static func from(maxMode: String?) -> AIPersona {
        switch maxMode {
        case "Dr. House": return .house
        case "Zen Master": return .zen
        default: return .max
        }
    }
}

private struct SettingsResponse: Decodable {
    struct Settings: Decodable {
        let honesty_level: Int
        let humor_level: Int
        let mode: String
    }
    let settings: Settings?
}

struct AIPersonaSettingsView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    AIPersonaSettingsView()
    }
}
