// LiquidGlassTheme.swift
// iOS 端 Liquid Glass 设计系统（高端杂志感 / Calm / Scientific / Minimal）

import SwiftUI

// MARK: - Screen Metrics
struct ScreenMetrics {
    let size: CGSize
    let safeAreaInsets: EdgeInsets

    /// 固定屏幕宽度（使用物理像素对齐，避免亚像素导致的布局漂移）
    var fixedScreenWidth: CGFloat {
        alignToPixel(size.width)
    }

    var safeWidth: CGFloat {
        max(0, size.width - safeAreaInsets.leading - safeAreaInsets.trailing)
    }

    var isCompactWidth: Bool { fixedScreenWidth <= 360 }
    var isCompactHeight: Bool { size.height <= 700 }

    /// 水平边距（基于 fixedScreenWidth 判断，避免 safeWidth 微小波动导致阈值跳变）
    var horizontalPadding: CGFloat {
        fixedScreenWidth <= 360 ? 16 : (fixedScreenWidth < 390 ? 24 : 32)
    }

    var verticalPadding: CGFloat {
        isCompactHeight ? 12 : 16
    }

    var sectionSpacing: CGFloat {
        isCompactHeight ? 16 : 24
    }

    var iconSize: CGFloat { isCompactWidth ? 18 : 20 }
    var smallIconSize: CGFloat { isCompactWidth ? 14 : 16 }

    var tabBarHeight: CGFloat { isCompactHeight ? 58 : 70 }
    var tabBarHorizontalPadding: CGFloat { isCompactWidth ? 8 : 12 }

    var tabBarBottomPadding: CGFloat {
        0
    }

    /// TabBar 宽度（基于 fixedScreenWidth，确保布局稳定）
    var tabBarWidth: CGFloat {
        let baseWidth = fixedScreenWidth - tabBarHorizontalPadding * 2
        return alignToPixel(min(max(0, baseWidth), 560))
    }

    var bottomContentInset: CGFloat {
        tabBarHeight + tabBarBottomPadding + 20
    }

    var maxContentWidth: CGFloat {
        max(0, min(safeWidth - horizontalPadding * 2, 520))
    }

    var ringLarge: CGFloat { isCompactHeight ? 140 : 160 }
    var ringMedium: CGFloat { isCompactHeight ? 120 : 140 }
    var avatarLarge: CGFloat { isCompactWidth ? 84 : 100 }

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

// MARK: - Tokens
enum GlassSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 20
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}

enum GlassRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
}

enum GlassShadow {
    static let softColor = Color.black.opacity(0.28)
    static let softRadius: CGFloat = 18
    static let softY: CGFloat = 10

    static let floatColor = Color.black.opacity(0.42)
    static let floatRadius: CGFloat = 28
    static let floatY: CGFloat = 14
}

enum GlassTypography {
    static func display(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }

    static func title(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }

    static func body(_ size: CGFloat = 16, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }

    static func caption(_ size: CGFloat = 12, weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}

// MARK: - Legacy Typography Helper
struct NeuroFont: ViewModifier {
    var size: CGFloat
    var weight: Font.Weight = .regular
    var design: Font.Design = .serif

    func body(content: Content) -> some View {
        content.font(.system(size: size, weight: weight, design: design))
    }
}

extension View {
    func neuroFont(_ size: CGFloat, weight: Font.Weight = .regular) -> some View {
        modifier(NeuroFont(size: size, weight: weight))
    }
}

// MARK: - Palette
extension Color {
    // 基础色板 (Base Palette - Static)
    static let deepGreen = Color(hex: "#0B3D2E")
    static let deepGreenDarker = Color(hex: "#0A2F24") // 更深的绿色用于深色模式背景
    static let paperWhite = Color(hex: "#FAF6EF") // 燕麦色/纸张白
    static let sageGreen = Color(hex: "#9CAF88")  // 鼠尾草绿
    static let lightGrey = Color(hex: "#F2EFE9")  // 浅灰/沙色
    static let softBlack = Color(hex: "#2C2C2C")
    
    // 语义色 (Semantic - Dynamic)
    static let bgPrimary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#0B3D2E") : UIColor(hex: "#FAF6EF")
    })
    
    static let bgSecondary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#0F4636") : UIColor(hex: "#F2EFE9")
    })
    
    static let bgTertiary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#143F33") : UIColor(hex: "#E8E4DC")
    })

    // Logo & Brand Colors
    static let brandDeepGreen = Color.deepGreen
    static let brandPaper = Color.paperWhite
    static let brandMoss = Color.sageGreen
    static let brandSage = Color(hex: "#B8C7A6")
    
    // Liquid Glass Specifics
    static let liquidGlassPrimary = Color.bgPrimary
    static let liquidGlassAccent = Color.sageGreen
    static let liquidGlassPurple = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#9CAF88") : UIColor(hex: "#7A8F70")
    })
    static let liquidGlassSecondary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#A78BFA") : UIColor(hex: "#7C3AED")
    })
    static let liquidGlassWarm = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#FBBF24") : UIColor(hex: "#D97706")
    })

    // Status Colors
    static let statusSuccess = Color(hex: "#7AA88A")
    static let statusWarning = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#D4B26E") : UIColor(hex: "#B89655")
    })
    static let statusError = Color(hex: "#C97A6D")

    // Text Colors (Dynamic)
    static let textPrimary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#FAF6EF") : UIColor(hex: "#0B3D2E")
    })
    
    static let textSecondary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#D8D1C6") : UIColor(hex: "#4A665A")
    })
    
    static let textTertiary = Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(hex: "#B9B1A6") : UIColor(hex: "#7A8F70")
    })

    static func textPrimary(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#FAF6EF") : Color(hex: "#0B3D2E")
    }

    static func textSecondary(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#D8D1C6") : Color(hex: "#4A665A")
    }

    static func textTertiary(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#B9B1A6") : Color(hex: "#7A8F70")
    }

    static func surfaceGlass(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#0F4636").opacity(0.6) : Color.brandPaper.opacity(0.75)
    }
}

// MARK: - UIColor Helper
extension UIColor {
    convenience init(hex: String) {
        let hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "#", with: "")
        var rgb: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&rgb)
        
        let r = CGFloat((rgb >> 16) & 0xFF) / 255.0
        let g = CGFloat((rgb >> 8) & 0xFF) / 255.0
        let b = CGFloat(rgb & 0xFF) / 255.0
        
        self.init(red: r, green: g, blue: b, alpha: 1.0)
    }
}

// MARK: - Gradients
extension LinearGradient {
    static var magazineWash: LinearGradient {
        LinearGradient(
            colors: [Color.bgPrimary, Color.bgSecondary],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    static var mossVeil: LinearGradient {
        LinearGradient(
            colors: [
                Color.brandMoss.opacity(0.22),
                Color.brandSage.opacity(0.10),
                Color.brandPaper.opacity(0.0)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var glassSheen: LinearGradient {
        LinearGradient(
            colors: [
                Color.textPrimary.opacity(0.15), // Light Mode 下用文字色(深色)做反光会太黑，应该用白色反光或根据模式调整
                Color.textPrimary.opacity(0.05),
                Color.textPrimary.opacity(0.01)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - Background
struct AuroraBackground: View {
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        ZStack {
            // Dynamic Gradient Background
            LinearGradient(
                colors: [
                    Color.bgPrimary,
                    Color.bgSecondary
                ],
                startPoint: .top,
                endPoint: .bottom
            ).ignoresSafeArea()

            // Orb 1 (Top Left)
            Circle()
                .fill(Color.liquidGlassAccent.opacity(colorScheme == .dark ? 0.18 : 0.3))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -140, y: -180)

            // Bar (Top Right)
            RoundedRectangle(cornerRadius: 200)
                .fill(colorScheme == .dark ? Color.bgTertiary : Color.sageGreen.opacity(0.2))
                .frame(width: 480, height: 260)
                .blur(radius: 80)
                .rotationEffect(.degrees(-8))
                .offset(x: 120, y: -30)

            // Orb 2 (Bottom Right)
            Circle()
                .fill(Color.liquidGlassPurple.opacity(colorScheme == .dark ? 0.12 : 0.2))
                .frame(width: 420, height: 420)
                .blur(radius: 90)
                .offset(x: 120, y: 260)

            GrainTexture(opacity: colorScheme == .dark ? 0.04 : 0.03) // Light mode 稍微减弱噪点
                .blendMode(colorScheme == .dark ? .overlay : .multiply) // Light mode 使用 multiply 让噪点显现
                .ignoresSafeArea()
        }
        .allowsHitTesting(false)
    }
}

// MARK: - Glass Surface
enum GlassSurfaceStyle {
    case standard
    case elevated
    case sunk
    case concave
}

struct LiquidGlassCard<Content: View>: View {
    let content: Content
    var padding: CGFloat
    var style: GlassSurfaceStyle
    @Environment(\.colorScheme) private var colorScheme

    init(style: GlassSurfaceStyle = .standard, padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.style = style
        self.padding = padding
        self.content = content()
    }

    private var cornerRadius: CGFloat {
        switch style {
        case .concave: return GlassRadius.md
        case .sunk: return GlassRadius.lg
        case .elevated: return GlassRadius.xl
        case .standard: return GlassRadius.xl
        }
    }

    private var tintStyle: AnyShapeStyle {
        // Material 上方的色调层 (Tint)
        switch style {
        case .sunk:
            return AnyShapeStyle(colorScheme == .dark ? Color.bgSecondary.opacity(0.6) : Color.white.opacity(0.4))
        case .concave:
            return AnyShapeStyle(colorScheme == .dark ? Color.black.opacity(0.2) : Color.black.opacity(0.02))
        case .elevated:
            return AnyShapeStyle(colorScheme == .dark ? Color.white.opacity(0.05) : Color.white.opacity(0.6))
        case .standard:
            // Dark: 微弱的白色提升亮度; Light: 白色增强通透感
            return AnyShapeStyle(colorScheme == .dark ? Color.white.opacity(0.03) : Color.white.opacity(0.3))
        }
    }
    
    private var borderGradient: LinearGradient {
        // 边缘光感 (Rim Light): 左上亮，右下暗
        LinearGradient(
            colors: [
                Color.white.opacity(colorScheme == .dark ? 0.3 : 0.7), // 左上高光
                Color.white.opacity(colorScheme == .dark ? 0.05 : 0.2),
                Color.white.opacity(colorScheme == .dark ? 0.02 : 0.0)  // 右下消隐
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    private var shadowColor: Color {
        colorScheme == .dark ? GlassShadow.softColor : Color.black.opacity(0.1)
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            // 1. 色调层 (Tint)
            .background {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(tintStyle)
            }
            // 2. 物理材质层 (Physical Material - Blur)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius))
            // 3. 边缘光与内描边
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(borderGradient, lineWidth: 1)
            )
            // 4. 投影
            .shadow(
                color: style == .elevated ? shadowColor.opacity(0.25) : shadowColor.opacity(0.15),
                radius: style == .elevated ? 16 : 8,
                y: style == .elevated ? 8 : 4
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }
}

// MARK: - Legacy Button Style
struct LiquidGlassButtonStyle: ButtonStyle {
    var isProminent: Bool = false
    var isDestructive: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        let kind: GlassButtonStyle.Kind = isDestructive ? .danger : (isProminent ? .primary : .secondary)
        return GlassButtonStyle(kind: kind).makeBody(configuration: configuration)
    }
}

// MARK: - Accent Orb
struct PulsingOrb: View {
    @State private var breathe = false
    var color: Color = .brandMoss

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .frame(width: 80, height: 80)
                .blur(radius: 8)

            Circle()
                .fill(color.opacity(0.25))
                .frame(width: 120, height: 120)
                .blur(radius: 22)
                .scaleEffect(breathe ? 1.1 : 0.92)
                .opacity(breathe ? 0.5 : 0.3)

            Circle()
                .stroke(color.opacity(0.5), lineWidth: 1)
                .frame(width: 100, height: 100)
                .scaleEffect(breathe ? 1.4 : 1.0)
                .opacity(breathe ? 0.0 : 0.7)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: false)) {
                breathe = true
            }
        }
    }
}

// MARK: - Grain Texture
struct GrainTexture: View {
    var opacity: Double = 0.03

    var body: some View {
        Canvas { context, size in
            let count = Int(size.width * size.height * 0.04)
            for _ in 0..<count {
                let x = Double.random(in: 0...size.width)
                let y = Double.random(in: 0...size.height)
                context.opacity = Double.random(in: 0.08...0.3)
                context.fill(Path(CGRect(x: x, y: y, width: 1, height: 1)), with: .color(.black))
            }
        }
        .opacity(opacity)
        .allowsHitTesting(false)
    }
}

// MARK: - Legacy Noise Texture
struct NoiseTexture: View {
    var opacity: Double = 0.03

    var body: some View {
        GrainTexture(opacity: opacity)
    }
}

// MARK: - View Extensions
extension View {
    func withAuroraBackground() -> some View {
        background(AuroraBackground())
    }

    func liquidGlassCard(style: GlassSurfaceStyle = .standard, padding: CGFloat = 20) -> some View {
        LiquidGlassCard(style: style, padding: padding) { self }
    }
}

// MARK: - Preview
struct Theme_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            AuroraBackground()

            VStack(spacing: 24) {
                Text("AntiAnxiety")
                    .font(GlassTypography.display(34, weight: .semibold))
                    .foregroundColor(.textPrimary)

                LiquidGlassCard(style: .elevated) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("整体状态")
                            .font(GlassTypography.caption())
                            .foregroundColor(.textSecondary)
                        Text("85")
                            .font(GlassTypography.display(40, weight: .bold))
                            .foregroundColor(.textPrimary)
                    }
                }

                Button("开始校准") {}
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: true))

                PulsingOrb()
            }
            .padding()
        }
        .preferredColorScheme(.light)
    }
}
