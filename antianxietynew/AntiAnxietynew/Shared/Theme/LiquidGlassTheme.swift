// LiquidGlassTheme.swift
// iOS 端 Liquid Glass 设计系统（高端杂志感 / Calm / Scientific / Minimal）

import SwiftUI

// MARK: - Screen Metrics
struct ScreenMetrics {
    let size: CGSize
    let safeAreaInsets: EdgeInsets

    var safeWidth: CGFloat {
        max(0, size.width - safeAreaInsets.leading - safeAreaInsets.trailing)
    }

    var isCompactWidth: Bool { size.width <= 360 }
    var isCompactHeight: Bool { size.height <= 700 }

    var horizontalPadding: CGFloat {
        isCompactWidth ? 16 : (safeWidth < 390 ? 24 : 32)
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

    var tabBarWidth: CGFloat {
        min(max(0, safeWidth - tabBarHorizontalPadding * 2), 560)
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
    static let brandDeepGreen = Color(hex: "#0B3D2E")
    static let brandPaper = Color(hex: "#FAF6EF")
    static let brandMoss = Color(hex: "#9CAF88")
    static let brandSage = Color(hex: "#CBD6C4")

    static let bgPrimary = Color(hex: "#0B3D2E")
    static let bgSecondary = Color(hex: "#0F4636")
    static let bgTertiary = Color(hex: "#143F33")

    static let liquidGlassPrimary = Color(hex: "#0B3D2E")
    static let liquidGlassAccent = Color(hex: "#9CAF88")
    static let liquidGlassSecondary = Color(hex: "#CBD6C4")
    static let liquidGlassWarm = Color(hex: "#CBD6C4")
    static let liquidGlassPurple = Color(hex: "#9CAF88")

    static let statusSuccess = Color(hex: "#7AA88A")
    static let statusWarning = Color(hex: "#D4B26E")
    static let statusError = Color(hex: "#C97A6D")

    static let textPrimary = Color(hex: "#FAF6EF")
    static let textSecondary = Color(hex: "#D8D1C6")
    static let textTertiary = Color(hex: "#B9B1A6")

    static func textPrimary(for scheme: ColorScheme) -> Color {
        Color.bioTextPrimary(for: scheme)
    }

    static func textSecondary(for scheme: ColorScheme) -> Color {
        Color.bioTextSecondary(for: scheme)
    }

    static func surfaceGlass(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color.brandPaper.opacity(0.12) : Color.brandPaper.opacity(0.7)
    }
}

// MARK: - Gradients
extension LinearGradient {
    static let magazineWash = LinearGradient(
        colors: [Color.bgPrimary, Color.bgSecondary],
        startPoint: .top,
        endPoint: .bottom
    )

    static let mossVeil = LinearGradient(
        colors: [
            Color.brandMoss.opacity(0.22),
            Color.brandSage.opacity(0.10),
            Color.brandPaper.opacity(0.0)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let glassSheen = LinearGradient(
        colors: [
            Color.brandPaper.opacity(0.45),
            Color.brandPaper.opacity(0.12),
            Color.brandPaper.opacity(0.04)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Background
struct AuroraBackground: View {
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        ZStack {
            // Dynamic Gradient Background
            LinearGradient(
                colors: [
                    Color.bgAbyss(for: colorScheme),
                    Color.deepViolet(for: colorScheme)
                ],
                startPoint: .top,
                endPoint: .bottom
            ).ignoresSafeArea()

            Circle()
                .fill(Color.bioGlow(for: colorScheme).opacity(0.18))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -140, y: -180)

            RoundedRectangle(cornerRadius: 200)
                .fill(Color.bgMist(for: colorScheme))
                .frame(width: 480, height: 260)
                .blur(radius: 80)
                .rotationEffect(.degrees(-8))
                .offset(x: 120, y: -30)

            Circle()
                .fill(Color.bioluminPink(for: colorScheme).opacity(0.12))
                .frame(width: 420, height: 420)
                .blur(radius: 90)
                .offset(x: 120, y: 260)

            GrainTexture(opacity: colorScheme == .dark ? 0.04 : 0.06)
                .blendMode(.overlay)
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

    init(style: GlassSurfaceStyle = .standard, padding: CGFloat = 20, @ViewBuilder content: () -> Content) {
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

    private var fillStyle: AnyShapeStyle {
        switch style {
        case .sunk:
            return AnyShapeStyle(Color.bgSecondary.opacity(0.9))
        case .concave:
            return AnyShapeStyle(Color.brandPaper.opacity(0.08))
        case .elevated:
            return AnyShapeStyle(Color.brandPaper.opacity(0.16))
        case .standard:
            return AnyShapeStyle(Color.brandPaper.opacity(0.12))
        }
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(fillStyle)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .stroke(LinearGradient.glassSheen, lineWidth: 1)
                            .opacity(colorScheme == .dark ? 0.25 : 0.5)
                    )
                    .shadow(
                        color: style == .elevated ? GlassShadow.floatColor : GlassShadow.softColor,
                        radius: style == .elevated ? GlassShadow.floatRadius : GlassShadow.softRadius,
                        y: style == .elevated ? GlassShadow.floatY : GlassShadow.softY
                    )
            }
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
