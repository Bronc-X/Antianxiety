// ThemeManager.swift
// 主题管理器 - iOS 26 Bioluminescent 设计系统
// 支持 Light/Dark 双模式跟随系统

import SwiftUI

// MARK: - Color Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
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

// MARK: - 外观模式
enum AppearanceMode: String, CaseIterable, Identifiable {
    case system = "跟随系统"
    case light = "浅色"
    case dark = "深色"
    
    var id: String { rawValue }
    
    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

// MARK: - 主题管理器
@MainActor
class ThemeManager: ObservableObject {
    static let shared = ThemeManager()
    
    @AppStorage("appearanceMode") private var storedMode: String = AppearanceMode.system.rawValue
    
    var appearanceMode: AppearanceMode {
        get { AppearanceMode(rawValue: storedMode) ?? .system }
        set { storedMode = newValue.rawValue; objectWillChange.send() }
    }
    
    var colorScheme: ColorScheme? {
        appearanceMode.colorScheme
    }
    
    private init() {}
}

// MARK: - Bioluminescent 色彩系统
extension Color {
    // ==========================================
    // ==========================================
    static func bgAbyss(for scheme: ColorScheme) -> Color {
        // Light Mode = Original Green Theme
        // Dark Mode  = New Onyx/Deep Space Theme
        scheme == .dark ? Color(hex: "#050505") : Color(hex: "#0B3D2E")
    }
    
    static func bgMist(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#FFFFFF").opacity(0.05) : Color(hex: "#FAF6EF").opacity(0.08)
    }
    
    // ==========================================
    // 生物荧光色 (Bioluminescent)
    // ==========================================
    static func bioGlow(for scheme: ColorScheme) -> Color {
        // Light: Bright Moss (#9CAF88)
        // Dark:  Muted Moss (#5C7A5C) for less glare on black
        scheme == .dark ? Color(hex: "#5C7A5C") : Color(hex: "#9CAF88")
    }
    
    static func bioluminPink(for scheme: ColorScheme) -> Color {
        // Light: Pale Sage (#CBD6C4)
        // Dark:  Deep Sage (#3A4A3A)
        scheme == .dark ? Color(hex: "#3A4A3A") : Color(hex: "#CBD6C4")
    }
    
    static func deepViolet(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color(hex: "#0A201A") : Color(hex: "#0F4636")
    }
    
    // ==========================================
    // 彩虹渐变 (Chromatic Frost)
    // ==========================================
    static let chromaticColors: [Color] = [
        Color(hex: "#9CAF88"),
        Color(hex: "#CBD6C4"),
        Color(hex: "#FAF6EF"),
        Color(hex: "#0B3D2E")
    ]
    
    static var chromaticGradient: LinearGradient {
        LinearGradient(
            colors: chromaticColors + [chromaticColors.first!],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    // ==========================================
    // 自适应文字色
    // ==========================================
    static func bioTextPrimary(for scheme: ColorScheme) -> Color {
        // Light (Green Theme): Off-white for softness
        // Dark (Onyx Theme): Pure White for contrast
        scheme == .dark ? Color.white : Color(hex: "#FAF6EF")
    }
    
    static func bioTextSecondary(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Color.white.opacity(0.7) : Color(hex: "#FAF6EF").opacity(0.7)
    }
}

// MARK: - 发光效果修饰器
struct GlowModifier: ViewModifier {
    let color: Color
    let radius: CGFloat
    let intensity: Double
    
    func body(content: Content) -> some View {
        content
            .shadow(color: color.opacity(intensity), radius: radius)
            .shadow(color: color.opacity(intensity * 0.5), radius: radius * 2)
    }
}

extension View {
    /// 添加生物荧光发光效果
    func bioGlow(color: Color = .bioGlow(for: .dark), radius: CGFloat = 20, intensity: Double = 0.6) -> some View {
        modifier(GlowModifier(color: color, radius: radius, intensity: intensity))
    }
}

// MARK: - 发光卡片
struct BioluminescentCard<Content: View>: View {
    @Environment(\.colorScheme) private var colorScheme
    let content: Content
    var glowColor: Color?
    var showChromaticBorder: Bool = false
    var padding: CGFloat = 20
    var cornerRadius: CGFloat = 24
    
    init(
        glowColor: Color? = nil,
        showChromaticBorder: Bool = false,
        padding: CGFloat = 20,
        cornerRadius: CGFloat = 24,
        @ViewBuilder content: () -> Content
    ) {
        self.glowColor = glowColor
        self.showChromaticBorder = showChromaticBorder
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.content = content()
    }
    
    private var effectiveGlowColor: Color {
        glowColor ?? .bioGlow(for: colorScheme)
    }
    
    private var glowIntensity: Double {
        colorScheme == .dark ? 0.4 : 0.2
    }
    
    var body: some View {
        content
            .padding(padding)
            .background {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(.ultraThinMaterial)
            }
            .overlay {
                if showChromaticBorder {
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(Color.chromaticGradient, lineWidth: 1.5)
                } else {
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(effectiveGlowColor.opacity(0.3), lineWidth: 1)
                }
            }
            .shadow(color: effectiveGlowColor.opacity(glowIntensity), radius: 16, y: 4)
    }
}

// MARK: - 发光按钮
struct BioluminescentButtonStyle: ButtonStyle {
    @Environment(\.colorScheme) private var colorScheme
    var isProminent: Bool = true
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.subheadline, design: .rounded).bold())
            .padding(.horizontal, 24)
            .padding(.vertical, 14)
            .background {
                if isProminent {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [.bioGlow(for: colorScheme), .bioluminPink(for: colorScheme)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .shadow(color: .bioGlow(for: colorScheme).opacity(colorScheme == .dark ? 0.4 : 0.2), radius: 12)
                } else {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(colorScheme == .dark ? .ultraThinMaterial : .regularMaterial)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.bioGlow(for: colorScheme).opacity(0.3), lineWidth: 1)
                        )
                }
            }
            .foregroundColor(isProminent ? .black : .bioTextPrimary(for: colorScheme))
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - 深渊背景
struct AbyssBackground: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var animate = false
    
    var body: some View {
        ZStack {
            Color.bgAbyss(for: colorScheme).ignoresSafeArea()
            
            // 荧光雾 1
            Circle()
                .fill(Color.bioGlow(for: colorScheme).opacity(colorScheme == .dark ? 0.16 : 0.1))
                .frame(width: 320, height: 320)
                .blur(radius: 100)
                .offset(x: animate ? -100 : 100, y: animate ? -100 : 100)
            
            // 荧光雾 2
            Circle()
                .fill(Color.bioluminPink(for: colorScheme).opacity(colorScheme == .dark ? 0.12 : 0.08))
                .frame(width: 360, height: 360)
                .blur(radius: 100)
                .offset(x: animate ? 100 : -100, y: animate ? 100 : -100)
            
            // 噪点纹理
            NoiseTexture(opacity: colorScheme == .dark ? 0.06 : 0.03)
                .ignoresSafeArea()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity) // 内部 ZStack 也要约束
        .clipped() // 裁剪溢出
        .allowsHitTesting(false)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped() // 关键：裁剪掉溢出的光晕，防止撑大视图
        .onAppear {
            withAnimation(.easeInOut(duration: 12).repeatForever(autoreverses: true)) {
                animate.toggle()
            }
        }
    }
}

// MARK: - 发光进度环
struct GlowingProgressRing: View {
    @Environment(\.colorScheme) private var colorScheme
    var progress: Double
    var lineWidth: CGFloat = 12
    var showChromatic: Bool = false
    
    private var glowColor: Color {
        .bioGlow(for: colorScheme)
    }
    
    var body: some View {
        ZStack {
            // 背景轨道
            Circle()
                .stroke(glowColor.opacity(0.1), lineWidth: lineWidth)
            
            // 进度条
            Circle()
                .trim(from: 0, to: min(progress, 1))
                .stroke(
                    showChromatic ? AnyShapeStyle(Color.chromaticGradient) : AnyShapeStyle(
                        AngularGradient(
                            colors: [glowColor.opacity(0.8), glowColor, glowColor.opacity(0.8)],
                            center: .center
                        )
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(color: glowColor.opacity(colorScheme == .dark ? 0.5 : 0.3), radius: 8)
        }
    }
}

// MARK: - Preview
struct ThemeManager_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            VStack(spacing: 24) {
                BioluminescentCard {
                    Text("Bioluminescent Card")
                        .foregroundColor(.white)
                }
                
                BioluminescentCard(showChromaticBorder: true) {
                    Text("Chromatic Border")
                        .foregroundColor(.white)
                }
                
                Button("Glow Button") {}
                    .buttonStyle(BioluminescentButtonStyle())
                
                GlowingProgressRing(progress: 0.75)
                    .frame(width: 80, height: 80)
            }
            .padding()
            .background(AbyssBackground())
            .preferredColorScheme(.dark)
            
            VStack(spacing: 24) {
                BioluminescentCard {
                    Text("Light Mode Card")
                        .foregroundColor(.black)
                }
                
                Button("Light Button") {}
                    .buttonStyle(BioluminescentButtonStyle())
            }
            .padding()
            .background(AbyssBackground())
            .preferredColorScheme(.light)
        }
    }
}
