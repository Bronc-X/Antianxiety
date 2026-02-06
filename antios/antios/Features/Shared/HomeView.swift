//
//  HomeView.swift
//  antios
//
//  首页视图
//

import SwiftUI

struct HomeView: View {
    @ObservedObject private var supabase = SupabaseManager.shared
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // 问候
                    greetingSection
                    
                    // 今日状态
                    todayStatusSection
                    
                    // 快速操作
                    quickActionsSection
                    
                    // 活跃方案
                    activePlanSection
                }
                .padding(AppTheme.Spacing.md)
            }
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("首页")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    // MARK: - Greeting
    
    private var greetingSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                Text(greeting)
                    .font(AppTheme.Typography.title2)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Text(supabase.currentUser?.name ?? "用户")
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.primaryGradient)
            }
            
            Spacer()
            
            Image(systemName: "person.circle.fill")
                .font(.system(size: 44))
                .foregroundColor(AppTheme.Colors.primary)
        }
    }
    
    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "早上好"
        case 12..<18: return "下午好"
        default: return "晚上好"
        }
    }
    
    // MARK: - Today Status
    
    private var todayStatusSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("今日状态")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            HStack(spacing: AppTheme.Spacing.md) {
                StatusCard(icon: "moon.fill", title: "睡眠", value: "7.5h", color: .blue)
                StatusCard(icon: "bolt.fill", title: "能量", value: "良好", color: .orange)
                StatusCard(icon: "heart.fill", title: "压力", value: "中等", color: .red)
            }
        }
    }
    
    // MARK: - Quick Actions
    
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("快速操作")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppTheme.Spacing.md) {
                QuickActionCard(icon: "waveform.path.ecg", title: "每日校准", color: AppTheme.Colors.primary)
                QuickActionCard(icon: "bubble.left.and.bubble.right.fill", title: "和 Max 聊聊", color: AppTheme.Colors.secondary)
                QuickActionCard(icon: "list.clipboard", title: "临床评估", color: AppTheme.Colors.info)
                QuickActionCard(icon: "book.fill", title: "科学期刊", color: .green)
            }
        }
    }
    
    // MARK: - Active Plan
    
    private var activePlanSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            HStack {
                Text("活跃方案")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Spacer()
                
                Text("查看全部")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.primary)
            }
            
            VStack(spacing: AppTheme.Spacing.sm) {
                PlanItemRow(title: "睡前冥想 10 分钟", isCompleted: true)
                PlanItemRow(title: "户外散步 20 分钟", isCompleted: false)
                PlanItemRow(title: "限制咖啡因摄入", isCompleted: false)
            }
            .cardStyle()
        }
    }
}

// MARK: - Status Card

struct StatusCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            Text(title)
                .font(AppTheme.Typography.caption)
                .foregroundColor(AppTheme.Colors.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.md)
        .background(AppTheme.Colors.backgroundCard)
        .cornerRadius(AppTheme.CornerRadius.md)
    }
}

// MARK: - Quick Action Card

struct QuickActionCard: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(color)
            
            Text(title)
                .font(AppTheme.Typography.subheadline)
                .foregroundColor(AppTheme.Colors.textPrimary)
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.lg)
        .background(AppTheme.Colors.backgroundCard)
        .cornerRadius(AppTheme.CornerRadius.lg)
    }
}

// MARK: - Plan Item Row

struct PlanItemRow: View {
    let title: String
    let isCompleted: Bool
    
    var body: some View {
        HStack {
            Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundColor(isCompleted ? AppTheme.Colors.success : AppTheme.Colors.textTertiary)
            
            Text(title)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textPrimary)
                .strikethrough(isCompleted)
            
            Spacer()
        }
    }
}

#Preview {
    HomeView()
}
