//
//  ProfileView.swift
//  antios
//
//  个人资料视图
//

import SwiftUI

struct ProfileView: View {
    @ObservedObject private var supabase = SupabaseManager.shared
    @StateObject private var authManager = AuthManager()
    @State private var showAISettings = false
    
    var body: some View {
        NavigationStack {
            List {
                // 用户信息
                Section {
                    HStack(spacing: AppTheme.Spacing.md) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(AppTheme.Colors.primary)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(supabase.currentUser?.name ?? "用户")
                                .font(AppTheme.Typography.headline)
                                .foregroundColor(AppTheme.Colors.textPrimary)
                            
                            Text(supabase.currentUser?.email ?? "")
                                .font(AppTheme.Typography.caption)
                                .foregroundColor(AppTheme.Colors.textSecondary)
                        }
                    }
                    .padding(.vertical, AppTheme.Spacing.sm)
                }
                .listRowBackground(AppTheme.Colors.backgroundCard)
                
                // 设置
                Section("设置") {
                    SettingsRow(icon: "brain.head.profile", title: "AI 人格设置", color: AppTheme.Colors.primary) {
                        showAISettings = true
                    }
                    
                    SettingsRow(icon: "heart.fill", title: "健康数据", color: .red) {}
                    
                    SettingsRow(icon: "bell.fill", title: "通知设置", color: .orange) {}
                    
                    SettingsRow(icon: "moon.fill", title: "深色模式", color: .purple) {}
                }
                .listRowBackground(AppTheme.Colors.backgroundCard)
                
                // 退出
                Section {
                    Button {
                        authManager.signOut()
                    } label: {
                        HStack {
                            Spacer()
                            Text("退出登录")
                                .foregroundColor(AppTheme.Colors.error)
                            Spacer()
                        }
                    }
                }
                .listRowBackground(AppTheme.Colors.backgroundCard)
            }
            .scrollContentBackground(.hidden)
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("我的")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showAISettings) {
                AIPersonaSettingsView()
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

