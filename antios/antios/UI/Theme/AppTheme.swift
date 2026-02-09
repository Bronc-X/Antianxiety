//
//  AppTheme.swift
//  antios
//
//  Liquid Glass theme bridge:
//  - keeps original AppTheme APIs used by antios business screens
//  - adopts antianxietynew visual system (aurora + glass material)
//

import SwiftUI

// MARK: - Screen Metrics

struct ScreenMetrics {
    let size: CGSize
    let safeAreaInsets: EdgeInsets

    var fixedScreenWidth: CGFloat {
        alignToPixel(size.width)
    }

    var safeWidth: CGFloat {
        max(0, size.width - safeAreaInsets.leading - safeAreaInsets.trailing)
    }

    var isCompactWidth: Bool { fixedScreenWidth <= 360 }
    var isCompactHeight: Bool { size.height <= 700 }

    var horizontalPadding: CGFloat {
        fixedScreenWidth <= 360 ? 16 : (fixedScreenWidth < 390 ? 24 : 32)
    }

    var verticalPadding: CGFloat {
        isCompactHeight ? 12 : 16
    }

    var sectionSpacing: CGFloat {
        isCompactHeight ? 16 : 24
    }

    var tabBarHeight: CGFloat { isCompactHeight ? 58 : 70 }
    var tabBarHorizontalPadding: CGFloat { isCompactWidth ? 8 : 12 }

    var tabBarWidth: CGFloat {
        let baseWidth = fixedScreenWidth - tabBarHorizontalPadding * 2
        return alignToPixel(min(max(0, baseWidth), 560))
    }

    var bottomContentInset: CGFloat {
        tabBarHeight + 20
    }

    var maxContentWidth: CGFloat {
        max(0, min(safeWidth - horizontalPadding * 2, 520))
    }

    private func alignToPixel(_ value: CGFloat) -> CGFloat {
        let scale = UIScreen.main.scale
        return (value * scale).rounded() / scale
    }
}

private struct ScreenMetricsKey: EnvironmentKey {
    static let defaultValue = ScreenMetrics(
        size: UIScreen.main.bounds.size,
        safeAreaInsets: EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0)
    )
}

extension EnvironmentValues {
    var screenMetrics: ScreenMetrics {
        get { self[ScreenMetricsKey.self] }
        set { self[ScreenMetricsKey.self] = newValue }
    }
}

// MARK: - Theme

enum AppTheme {
    enum Colors {
        static let primary = Color.liquidGlassAccent
        static let secondary = Color.liquidGlassSecondary
        static let accent = Color.liquidGlassWarm

        static let backgroundDark = Color.bgPrimary
        static let backgroundCard = Color.bgSecondary.opacity(0.82)
        static let backgroundElevated = Color.bgTertiary.opacity(0.9)

        static let textPrimary = Color.textPrimary
        static let textSecondary = Color.textSecondary
        static let textTertiary = Color.textTertiary

        static let success = Color.statusSuccess
        static let warning = Color.statusWarning
        static let error = Color.statusError
        static let info = Color.liquidGlassSecondary

        static let primaryGradient = LinearGradient(
            colors: [primary, secondary],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    enum Typography {
        static let largeTitle = Font.system(size: 34, weight: .bold, design: .serif)
        static let title = Font.system(size: 28, weight: .bold, design: .serif)
        static let title2 = Font.system(size: 22, weight: .bold, design: .serif)
        static let title3 = Font.system(size: 20, weight: .semibold, design: .serif)
        static let headline = Font.system(size: 17, weight: .semibold)
        static let body = Font.system(size: 17, weight: .regular)
        static let callout = Font.system(size: 16, weight: .regular)
        static let subheadline = Font.system(size: 15, weight: .regular)
        static let footnote = Font.system(size: 13, weight: .regular)
        static let caption = Font.system(size: 12, weight: .regular, design: .rounded)
    }

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }

    enum CornerRadius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let full: CGFloat = 9999
    }
}

// MARK: - Color Palette

extension Color {
    static let deepGreen = Color(hex: "#0B3D2E")
    static let paperWhite = Color(hex: "#FAF6EF")
    static let sageGreen = Color(hex: "#9CAF88")

    static let bgPrimary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#0B3D2E") : UIColor(hex: "#FAF6EF")
    })

    static let bgSecondary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#0F4636") : UIColor(hex: "#F2EFE9")
    })

    static let bgTertiary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#143F33") : UIColor(hex: "#E8E4DC")
    })

    static let liquidGlassAccent = Color.sageGreen
    static let liquidGlassSecondary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#A78BFA") : UIColor(hex: "#7C3AED")
    })
    static let liquidGlassWarm = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#FBBF24") : UIColor(hex: "#D97706")
    })

    static let textPrimary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#FAF6EF") : UIColor(hex: "#0B3D2E")
    })

    static let textSecondary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#D8D1C6") : UIColor(hex: "#4A665A")
    })

    static let textTertiary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#B9B1A6") : UIColor(hex: "#7A8F70")
    })

    static let statusSuccess = Color(hex: "#7AA88A")
    static let statusWarning = Color(hex: "#D4B26E")
    static let statusError = Color(hex: "#C97A6D")

    init(hex: String) {
        let normalized = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: normalized).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch normalized.count {
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

extension UIColor {
    convenience init(hex: String) {
        let hexString = hex
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")
        var rgb: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&rgb)

        let r = CGFloat((rgb >> 16) & 0xFF) / 255.0
        let g = CGFloat((rgb >> 8) & 0xFF) / 255.0
        let b = CGFloat(rgb & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b, alpha: 1.0)
    }
}

// MARK: - Background

struct AuroraBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.bgPrimary, Color.bgSecondary],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            Circle()
                .fill(Color.liquidGlassAccent.opacity(0.2))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -140, y: -180)

            RoundedRectangle(cornerRadius: 200)
                .fill(Color.bgTertiary.opacity(0.5))
                .frame(width: 480, height: 260)
                .blur(radius: 80)
                .rotationEffect(.degrees(-8))
                .offset(x: 120, y: -30)

            Circle()
                .fill(Color.liquidGlassSecondary.opacity(0.16))
                .frame(width: 420, height: 420)
                .blur(radius: 90)
                .offset(x: 120, y: 260)

            GrainTexture(opacity: 0.03)
                .blendMode(.overlay)
                .ignoresSafeArea()
        }
    }
}

struct GrainTexture: View {
    var opacity: Double = 0.03

    var body: some View {
        Canvas { context, size in
            let count = Int(size.width * size.height * 0.02)
            for _ in 0..<count {
                let x = Double.random(in: 0...size.width)
                let y = Double.random(in: 0...size.height)
                context.opacity = Double.random(in: 0.06...0.25)
                context.fill(Path(CGRect(x: x, y: y, width: 1, height: 1)), with: .color(.black))
            }
        }
        .opacity(opacity)
        .allowsHitTesting(false)
    }
}

struct FluidBackground: View {
    var body: some View {
        AuroraBackground()
    }
}

// MARK: - View Modifiers

enum GlassSurfaceStyle {
    case standard
    case elevated
}

struct LiquidGlassCard<Content: View>: View {
    let content: Content
    var padding: CGFloat
    var style: GlassSurfaceStyle

    init(style: GlassSurfaceStyle = .standard, padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.style = style
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.lg, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.lg, style: .continuous)
                            .stroke(Color.white.opacity(0.16), lineWidth: 1)
                    )
            }
            .shadow(
                color: .black.opacity(style == .elevated ? 0.2 : 0.12),
                radius: style == .elevated ? 14 : 8,
                y: style == .elevated ? 8 : 4
            )
    }
}

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(AppTheme.Spacing.md)
            .background {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.lg, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.lg, style: .continuous)
                            .stroke(Color.white.opacity(0.16), lineWidth: 1)
                    )
            }
            .shadow(color: .black.opacity(0.14), radius: 10, y: 4)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTheme.Typography.headline)
            .foregroundColor(Color.paperWhite)
            .frame(maxWidth: .infinity)
            .padding(AppTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.md, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                AppTheme.Colors.primary.opacity(configuration.isPressed ? 0.85 : 1.0),
                                AppTheme.Colors.secondary.opacity(configuration.isPressed ? 0.8 : 0.95)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.md, style: .continuous)
                    .stroke(Color.white.opacity(0.18), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.18), radius: 10, y: 4)
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
