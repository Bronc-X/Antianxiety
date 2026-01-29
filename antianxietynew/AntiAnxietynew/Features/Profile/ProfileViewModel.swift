// ProfileViewModel.swift
// 用户画像视图模型 - 对齐 Web 端 useProfile Hook
//
// 功能对照:
// - Web: hooks/domain/useProfile.ts + app/actions/profile.ts
// - iOS: 本文件

import SwiftUI

// MARK: - Profile Model

struct UserProfileData: Equatable {
    let id: String
    var email: String?
    var fullName: String?
    var avatarUrl: String?
    var aiPersonality: String?
    var aiPersonaContext: String?
    var preferredLanguage: String?
    var primaryGoal: String?
    var currentFocus: String?
    var notificationEnabled: Bool
    var dailyCheckinTime: String?
}

struct UpdateProfileInput: Codable {
    var full_name: String?
    var avatar_url: String?
    var ai_personality: String?
    var ai_persona_context: String?
    var preferred_language: String?
    var notification_enabled: Bool?
    var daily_checkin_time: String?
    var primary_goal: String?
    var current_focus: String?
    
    // 只编码非 nil 值
    enum CodingKeys: String, CodingKey {
        case full_name, avatar_url, ai_personality, ai_persona_context
        case preferred_language, notification_enabled, daily_checkin_time
        case primary_goal, current_focus
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        if let full_name { try container.encode(full_name, forKey: .full_name) }
        if let avatar_url { try container.encode(avatar_url, forKey: .avatar_url) }
        if let ai_personality { try container.encode(ai_personality, forKey: .ai_personality) }
        if let ai_persona_context { try container.encode(ai_persona_context, forKey: .ai_persona_context) }
        if let preferred_language { try container.encode(preferred_language, forKey: .preferred_language) }
        if let notification_enabled { try container.encode(notification_enabled, forKey: .notification_enabled) }
        if let daily_checkin_time { try container.encode(daily_checkin_time, forKey: .daily_checkin_time) }
        if let primary_goal { try container.encode(primary_goal, forKey: .primary_goal) }
        if let current_focus { try container.encode(current_focus, forKey: .current_focus) }
    }
}

// MARK: - Raw Response

private struct RawProfileResponse: Codable {
    let id: String
    let email: String?
    let full_name: String?
    let avatar_url: String?
    let ai_personality: String?
    let ai_persona_context: String?
    let preferred_language: String?
    let primary_goal: String?
    let current_focus: String?
    let notification_enabled: Bool?
    let daily_checkin_time: String?
}

// MARK: - ViewModel

@MainActor
class ProfileViewModel: ObservableObject {
    
    // MARK: - Published State (对齐 useProfile)
    
    @Published var profile: UserProfileData?
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var isUploading = false
    @Published var error: String?
    
    // MARK: - Dependencies
    
    private let supabase = SupabaseManager.shared
    
    // MARK: - Load Profile
    
    func loadProfile() async {
        guard let user = supabase.currentUser else { return }
        
        isLoading = true
        error = nil
        defer { isLoading = false }
        
        do {
            let endpoint = "profiles?id=eq.\(user.id)&select=*&limit=1"
            let results: [RawProfileResponse] = try await supabase.request(endpoint)
            
            if let raw = results.first {
                profile = UserProfileData(
                    id: raw.id,
                    email: raw.email ?? user.email,
                    fullName: raw.full_name,
                    avatarUrl: raw.avatar_url,
                    aiPersonality: raw.ai_personality,
                    aiPersonaContext: raw.ai_persona_context,
                    preferredLanguage: raw.preferred_language,
                    primaryGoal: raw.primary_goal,
                    currentFocus: raw.current_focus,
                    notificationEnabled: raw.notification_enabled ?? true,
                    dailyCheckinTime: raw.daily_checkin_time
                )
            }
        } catch {
            self.error = error.localizedDescription
            print("[Profile] Load error: \(error)")
        }
    }
    
    // MARK: - Update Profile
    
    func update(_ input: UpdateProfileInput) async -> Bool {
        guard let user = supabase.currentUser else { return false }
        
        isSaving = true
        error = nil
        defer { isSaving = false }
        
        // 乐观更新
        let previous = profile
        if var current = profile {
            if let fullName = input.full_name { current.fullName = fullName }
            if let avatarUrl = input.avatar_url { current.avatarUrl = avatarUrl }
            if let aiPersonality = input.ai_personality { current.aiPersonality = aiPersonality }
            if let aiPersonaContext = input.ai_persona_context { current.aiPersonaContext = aiPersonaContext }
            if let preferredLanguage = input.preferred_language { current.preferredLanguage = preferredLanguage }
            if let notificationEnabled = input.notification_enabled { current.notificationEnabled = notificationEnabled }
            if let dailyCheckinTime = input.daily_checkin_time { current.dailyCheckinTime = dailyCheckinTime }
            profile = current
        }
        
        do {
            try await supabase.requestVoid("profiles?id=eq.\(user.id)", method: "PATCH", body: input)
            return true
        } catch {
            profile = previous
            self.error = error.localizedDescription
            print("[Profile] Update error: \(error)")
            return false
        }
    }
    
    // MARK: - Upload Avatar
    
    func uploadAvatar(imageData: Data, contentType: String = "image/jpeg") async -> String? {
        isUploading = true
        error = nil
        defer { isUploading = false }
        
        do {
            let url = try await supabase.uploadAvatar(imageData: imageData, contentType: contentType)
            
            // 更新本地状态
            if var current = profile {
                current.avatarUrl = url
                profile = current
            }
            
            return url
        } catch {
            self.error = error.localizedDescription
            print("[Profile] Upload error: \(error)")
            return nil
        }
    }
    
    // MARK: - Refresh
    
    func refresh() async {
        await loadProfile()
    }
    
    // MARK: - Delete Account
    
    func deleteAccount() async -> Bool {
        guard supabase.currentUser != nil else { return false }
        
        isSaving = true
        error = nil
        defer { isSaving = false }
        
        // 注意：删除账户需要后端 API 支持
        // 这里只实现登出，真正删除需要调用后端 API
        await supabase.signOut()
        return true
    }
}
