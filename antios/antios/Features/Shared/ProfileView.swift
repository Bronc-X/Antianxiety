//
//  ProfileView.swift
//  antios
//
//  个人资料视图
//

import SwiftUI
import UserNotifications

struct ProfileView: View {
    @ObservedObject private var supabase = SupabaseManager.shared
    @EnvironmentObject var authManager: AuthManager
    @State private var showAISettings = false
    @State private var showWearables = false
    @State private var infoMessage: String?
    @AppStorage("antios_notifications_enabled") private var notificationsEnabled = false
    @AppStorage("antios_preferred_dark_mode") private var prefersDarkMode = true
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.md) {
                    profileHeader

                    VStack(spacing: AppTheme.Spacing.sm) {
                        SettingsRow(icon: "brain.head.profile", title: "AI 人格设置", color: AppTheme.Colors.primary) {
                            showAISettings = true
                        }

                        SettingsRow(icon: "heart.fill", title: "健康数据", color: .red) {
                            showWearables = true
                        }

                        SettingsRow(icon: "bell.fill", title: "通知设置", color: .orange) {
                            toggleNotifications()
                        }

                        SettingsRow(icon: "moon.fill", title: "深色模式", color: .purple) {
                            prefersDarkMode.toggle()
                            infoMessage = prefersDarkMode ? "已切换为深色模式偏好" : "已切换为浅色模式偏好"
                        }
                    }
                    .cardStyle()

                    Button {
                        authManager.signOut()
                    } label: {
                        Text("退出登录")
                            .foregroundColor(AppTheme.Colors.error)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(AppTheme.Colors.error)
                    .padding(.top, AppTheme.Spacing.sm)
                }
                .padding(AppTheme.Spacing.md)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle("设置")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showAISettings) {
                AIPersonaSettingsView()
            }
            .sheet(isPresented: $showWearables) {
                WearablesView()
            }
            .alert("设置更新", isPresented: Binding(
                get: { infoMessage != nil },
                set: { if !$0 { infoMessage = nil } }
            )) {
                Button("确定", role: .cancel) {}
            } message: {
                Text(infoMessage ?? "")
            }
        }
    }

    private var profileHeader: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            Image(systemName: "person.circle.fill")
                .font(.system(size: 62))
                .foregroundColor(AppTheme.Colors.primary)

            VStack(alignment: .leading, spacing: 4) {
                Text(supabase.currentUser?.name ?? "用户")
                    .font(AppTheme.Typography.title3)
                    .foregroundColor(AppTheme.Colors.textPrimary)

                Text(supabase.currentUser?.email ?? "")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textSecondary)
            }

            Spacer()
        }
        .cardStyle()
    }

    private func toggleNotifications() {
        if notificationsEnabled {
            notificationsEnabled = false
            infoMessage = "已关闭应用提醒。"
            return
        }

        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            Task { @MainActor in
                notificationsEnabled = granted
                infoMessage = granted ? "通知权限已开启。" : "系统拒绝通知权限，请到设置中开启。"
            }
        }
    }
}

// MARK: - Settings Row

struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 28)
                
                Text(title)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
            }
        }
    }
}

struct ProfileView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    ProfileView()
    }
}
