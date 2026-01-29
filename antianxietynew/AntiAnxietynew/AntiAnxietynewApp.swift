// AntiAnxietynewApp.swift
// 应用入口

import SwiftUI

@main
struct AntiAnxietynewApp: App {
    @StateObject private var supabase = SupabaseManager.shared
    @StateObject private var appSettings = AppSettings()
    @StateObject private var themeManager = ThemeManager.shared
    
    init() {
        // 启动调试日志
        print("🚀 [App] AntiAnxiety iOS 启动")
        
        if let apiBase = Bundle.main.infoDictionary?["APP_API_BASE_URL"] as? String {
            print("✅ [Config] APP_API_BASE_URL = \(apiBase)")
        } else {
            print("❌ [Config] APP_API_BASE_URL 未配置!")
        }
        
        if let supabaseUrl = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String {
            print("✅ [Config] SUPABASE_URL = \(supabaseUrl)")
        } else {
            print("❌ [Config] SUPABASE_URL 未配置!")
        }
        
        if let accessToken = UserDefaults.standard.string(forKey: "supabase_access_token") {
            print("✅ [Auth] 已有 access_token: \(accessToken.prefix(20))...")
        } else {
            print("⚠️ [Auth] 未找到 access_token，需要登录")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(supabase)
                .environmentObject(appSettings)
                .environmentObject(themeManager)
                .preferredColorScheme(themeManager.colorScheme)
                .task {
                    await supabase.refreshAppAPIBaseURL()
                    // 应用启动时检查会话
                    await supabase.checkSession()
                }
        }
    }
}
