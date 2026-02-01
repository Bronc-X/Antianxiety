// AntiAnxietynewApp.swift
// 应用入口

import SwiftUI
import UIKit

@main
struct AntiAnxietynewApp: App {
    @StateObject private var supabase = SupabaseManager.shared
    @StateObject private var appSettings = AppSettings()
    @StateObject private var themeManager = ThemeManager.shared
    
    init() {
        // 启动调试日志
        print("🚀 [App] AntiAnxiety iOS 启动")

        configureTabBarAppearance()
        
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

    private func configureTabBarAppearance() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Color.bgPrimary)
        appearance.shadowColor = UIColor.black.withAlphaComponent(0.25)

        let normalAttributes: [NSAttributedString.Key: Any] = [
            .foregroundColor: UIColor(Color.textTertiary),
            .font: UIFont.systemFont(ofSize: 11, weight: .semibold)
        ]
        let selectedAttributes: [NSAttributedString.Key: Any] = [
            .foregroundColor: UIColor(Color.liquidGlassAccent),
            .font: UIFont.systemFont(ofSize: 11, weight: .bold)
        ]

        let itemAppearance = UITabBarItemAppearance()
        itemAppearance.normal.iconColor = UIColor(Color.textTertiary)
        itemAppearance.normal.titleTextAttributes = normalAttributes
        itemAppearance.selected.iconColor = UIColor(Color.liquidGlassAccent)
        itemAppearance.selected.titleTextAttributes = selectedAttributes

        appearance.stackedLayoutAppearance = itemAppearance
        appearance.inlineLayoutAppearance = itemAppearance
        appearance.compactInlineLayoutAppearance = itemAppearance

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
        UITabBar.appearance().isTranslucent = false
        UITabBar.appearance().tintColor = UIColor(Color.liquidGlassAccent)
    }
}
