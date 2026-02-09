//
//  ProfileView.swift
//  antios
//
//  个人资料视图
//

import SwiftUI

struct ProfileView: View {
    @ObservedObject private var supabase = SupabaseManager.shared
    @EnvironmentObject var authManager: AuthManager
    @State private var showAISettings = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.md) {
                    profileHeader

                    VStack(spacing: AppTheme.Spacing.sm) {
                        SettingsRow(icon: "brain.head.profile", title: "AI 人格设置", color: AppTheme.Colors.primary) {
                            showAISettings = true
                        }

                        SettingsRow(icon: "heart.fill", title: "健康数据", color: .red) {}

                        SettingsRow(icon: "bell.fill", title: "通知设置", color: .orange) {}

                        SettingsRow(icon: "moon.fill", title: "深色模式", color: .purple) {}
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
