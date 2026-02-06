//
//  AppTheme.swift
//  antios
//
//  统一主题系统 - 颜色、字体、间距、圆角
//

import SwiftUI

// MARK: - Theme

enum AppTheme {
    
    // MARK: - Colors
    
    enum Colors {
        // 主色调
        static let primary = Color(hex: "#6366F1")        // Indigo
        static let secondary = Color(hex: "#8B5CF6")      // Violet
        static let accent = Color(hex: "#EC4899")         // Pink
        
        // 背景
        static let backgroundDark = Color(hex: "#0F0F23")
        static let backgroundCard = Color(hex: "#1A1A2E")
        static let backgroundElevated = Color(hex: "#252542")
        
        // 文本
        static let textPrimary = Color.white
        static let textSecondary = Color(hex: "#A1A1AA")
        static let textTertiary = Color(hex: "#71717A")
        
        // 状态
        static let success = Color(hex: "#10B981")
        static let warning = Color(hex: "#F59E0B")
        static let error = Color(hex: "#EF4444")
        static let info = Color(hex: "#3B82F6")
        
        // 渐变
        static let primaryGradient = LinearGradient(
            colors: [primary, secondary],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    // MARK: - Typography
    
    enum Typography {
        static let largeTitle = Font.system(size: 34, weight: .bold)
        static let title = Font.system(size: 28, weight: .bold)
        static let title2 = Font.system(size: 22, weight: .bold)
        static let title3 = Font.system(size: 20, weight: .semibold)
        static let headline = Font.system(size: 17, weight: .semibold)
        static let body = Font.system(size: 17, weight: .regular)
        static let callout = Font.system(size: 16, weight: .regular)
        static let subheadline = Font.system(size: 15, weight: .regular)
        static let footnote = Font.system(size: 13, weight: .regular)
        static let caption = Font.system(size: 12, weight: .regular)
    }
    
    // MARK: - Spacing
    
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    
    enum CornerRadius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let full: CGFloat = 9999
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - View Modifiers

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(AppTheme.Spacing.md)
            .background(AppTheme.Colors.backgroundCard)
            .cornerRadius(AppTheme.CornerRadius.lg)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTheme.Typography.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(AppTheme.Spacing.md)
            .background(
                configuration.isPressed
                    ? AppTheme.Colors.primary.opacity(0.8)
                    : AppTheme.Colors.primary
            )
            .cornerRadius(AppTheme.CornerRadius.md)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// MARK: - Empty Response for API

struct EmptyResponse: Decodable {}
