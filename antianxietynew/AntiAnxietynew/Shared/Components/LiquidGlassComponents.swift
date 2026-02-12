// LiquidGlassComponents.swift
// Liquid Glass 基础组件（高端杂志感）

import SwiftUI

// MARK: - Layout Debug
enum LayoutDebug {
    // Set to false to disable all debug frames.
    static let enabled = false
    static let showLabels = true
    static let showCenterLines = true
}

struct LayoutDebugOverlay: View {
    let label: String
    let color: Color
    let lineWidth: CGFloat
    let labelYOffset: CGFloat

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                Rectangle()
                    .stroke(color, lineWidth: lineWidth)

                if LayoutDebug.showLabels {
                    Text("\(label) \(Int(proxy.size.width))×\(Int(proxy.size.height))")
                        .font(.caption2)
                        .padding(4)
                        .background(Color.black.opacity(0.6))
                        .foregroundColor(color)
                        .cornerRadius(4)
                        .padding(4)
                        .offset(y: labelYOffset)
                }
            }
            .allowsHitTesting(false)
        }
    }
}

struct LayoutSafeAreaOverlay: View {
    let metrics: ScreenMetrics
    let color: Color

    var body: some View {
        GeometryReader { proxy in
            let insets = metrics.safeAreaInsets
            let safeWidth = max(0, proxy.size.width - insets.leading - insets.trailing)
            let safeHeight = max(0, proxy.size.height - insets.top - insets.bottom)
            let rootCenterX = proxy.size.width / 2
            let safeCenterX = insets.leading + safeWidth / 2

            ZStack(alignment: .topLeading) {
                Rectangle()
                    .stroke(color, lineWidth: 1)

                Rectangle()
                    .stroke(Color.green, lineWidth: 1)
                    .frame(width: safeWidth, height: safeHeight)
                    .offset(x: insets.leading, y: insets.top)

                if LayoutDebug.showCenterLines {
                    Path { path in
                        path.move(to: CGPoint(x: rootCenterX, y: 0))
                        path.addLine(to: CGPoint(x: rootCenterX, y: proxy.size.height))
                    }
                    .stroke(Color.yellow.opacity(0.8), lineWidth: 1)

                    Path { path in
                        path.move(to: CGPoint(x: safeCenterX, y: insets.top))
                        path.addLine(to: CGPoint(x: safeCenterX, y: insets.top + safeHeight))
                    }
                    .stroke(Color.green.opacity(0.8), lineWidth: 1)
                }

                if LayoutDebug.showLabels {
                    Text("SafeArea \(Int(safeWidth))×\(Int(safeHeight))  insets L\(Int(insets.leading)) R\(Int(insets.trailing)) T\(Int(insets.top)) B\(Int(insets.bottom))")
                        .font(.caption2)
                        .padding(4)
                        .background(Color.black.opacity(0.6))
                        .foregroundColor(.green)
                        .cornerRadius(4)
                        .padding(4)
                        .offset(x: insets.leading, y: insets.top)
                }
            }
            .allowsHitTesting(false)
        }
    }
}

struct LayoutColumnGuidesOverlay: View {
    let metrics: ScreenMetrics

    var body: some View {
        GeometryReader { proxy in
            let totalWidth = proxy.size.width
            let columnWidth = metrics.maxContentWidth
            let left = max(0, (totalWidth - columnWidth) / 2)
            let right = min(totalWidth, left + columnWidth)

            ZStack(alignment: .topLeading) {
                Path { path in
                    path.move(to: CGPoint(x: left, y: 0))
                    path.addLine(to: CGPoint(x: left, y: proxy.size.height))
                    path.move(to: CGPoint(x: right, y: 0))
                    path.addLine(to: CGPoint(x: right, y: proxy.size.height))
                }
                .stroke(Color.cyan.opacity(0.9), lineWidth: 1)

                if LayoutDebug.showLabels {
                    Text("Column \(Int(columnWidth))  L\(Int(left)) R\(Int(totalWidth - right))  pad \(Int(metrics.horizontalPadding))")
                        .font(.caption2)
                        .padding(4)
                        .background(Color.black.opacity(0.6))
                        .foregroundColor(.cyan)
                        .cornerRadius(4)
                        .padding(4)
                        .offset(y: 22)
                }
            }
            .allowsHitTesting(false)
        }
    }
}

extension View {
    @ViewBuilder
    func debugFrame(_ label: String, color: Color = .red, lineWidth: CGFloat = 1, labelYOffset: CGFloat = 0) -> some View {
        if LayoutDebug.enabled {
            overlay(LayoutDebugOverlay(label: label, color: color, lineWidth: lineWidth, labelYOffset: labelYOffset))
        } else {
            self
        }
    }
}

// MARK: - LinearGradient 扩展
extension LinearGradient {
    static let accentFlow = LinearGradient(
        colors: [
            Color.brandMoss,
            Color.brandSage
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let glassBorder = LinearGradient(
        colors: [
            .white.opacity(0.6),
            .white.opacity(0.2),
            .white.opacity(0.05)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Glass Button
struct GlassButtonStyle: ButtonStyle {
    enum Kind {
        case primary
        case secondary
        case danger
    }

    var kind: Kind = .primary

    func makeBody(configuration: Configuration) -> some View {
        let isPressed = configuration.isPressed
        let background: AnyShapeStyle
        let foreground: Color
        let strokeColor: Color

        switch kind {
        case .primary:
            background = AnyShapeStyle(Color.brandDeepGreen)
            foreground = Color.brandPaper
            strokeColor = Color.brandDeepGreen.opacity(0.2)
        case .secondary:
            background = AnyShapeStyle(.ultraThinMaterial)
            foreground = Color.textPrimary
            strokeColor = Color.brandDeepGreen.opacity(0.12)
        case .danger:
            background = AnyShapeStyle(Color.statusError)
            foreground = Color.brandPaper
            strokeColor = Color.statusError.opacity(0.2)
        }

        return configuration.label
            .font(GlassTypography.body(15, weight: .semibold))
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background {
                RoundedRectangle(cornerRadius: GlassRadius.lg)
                    .fill(background)
                    .overlay(
                        RoundedRectangle(cornerRadius: GlassRadius.lg)
                            .stroke(
                                kind == .secondary ? AnyShapeStyle(LinearGradient.glassBorder) : AnyShapeStyle(strokeColor),
                                lineWidth: 1
                            )
                            .opacity(kind == .secondary ? 0.6 : 0.25)
                    )
            }
            .foregroundColor(foreground)
            .shadow(color: GlassShadow.softColor, radius: GlassShadow.softRadius, y: GlassShadow.softY)
            .scaleEffect(isPressed ? 0.97 : 1.0)
            .animation(.easeOut(duration: 0.18), value: isPressed)
    }
}

struct GlassButton: View {
    enum Style {
        case primary
        case secondary
        case danger
    }

    let title: String
    var icon: String? = nil
    var style: Style = .primary
    var action: () -> Void

    private var mappedKind: GlassButtonStyle.Kind {
        switch style {
        case .primary: return .primary
        case .secondary: return .secondary
        case .danger: return .danger
        }
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon {
                    Image(systemName: icon)
                }
                Text(L10n.localized(title))
            }
        }
        .buttonStyle(GlassButtonStyle(kind: mappedKind))
    }
}

// MARK: - Glass Card (别名)
typealias GlassCard<Content: View> = LiquidGlassCard<Content>

// MARK: - Glass TextField
struct GlassTextField: View {
    var placeholder: String
    @Binding var text: String
    var icon: String? = nil
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 12) {
            if let iconName = icon {
                Image(systemName: iconName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.liquidGlassAccent)
            }

            TextField(L10n.localized(placeholder), text: $text)
                .textFieldStyle(.plain)
                .foregroundColor(Color.textPrimary(for: colorScheme))
                .accentColor(.liquidGlassPrimary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background {
            RoundedRectangle(cornerRadius: GlassRadius.md)
                .fill(Color.surfaceGlass(for: colorScheme))
                .overlay(
                    RoundedRectangle(cornerRadius: GlassRadius.md)
                        .stroke(
                            colorScheme == .dark
                                ? Color.brandPaper.opacity(0.22)
                                : Color.brandDeepGreen.opacity(0.12),
                            lineWidth: 1
                        )
                )
        }
    }
}

// MARK: - Liquid Glass TextField (兼容旧用法)
struct LiquidGlassTextField: View {
    var placeholder: String
    @Binding var text: String
    var icon: String? = nil

    var body: some View {
        GlassTextField(placeholder: placeholder, text: $text, icon: icon)
    }
}

// MARK: - Glass Navigation Bar
struct GlassNavigationBar<Leading: View, Trailing: View>: View {
    let title: String
    var subtitle: String? = nil
    let leading: Leading
    let trailing: Trailing

    init(
        title: String,
        subtitle: String? = nil,
        @ViewBuilder leading: () -> Leading,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self.title = title
        self.subtitle = subtitle
        self.leading = leading()
        self.trailing = trailing()
    }

    var body: some View {
        HStack(alignment: .center) {
            leading

            Spacer()

            VStack(spacing: 2) {
                Text(L10n.localized(title))
                    .font(GlassTypography.title(18, weight: .semibold))
                    .foregroundColor(.textPrimary)
                if let subtitle {
                    Text(L10n.localized(subtitle))
                        .font(GlassTypography.caption())
                        .foregroundColor(.textSecondary)
                }
            }

            Spacer()

            trailing
        }
        .padding(.horizontal, GlassSpacing.lg)
        .padding(.vertical, GlassSpacing.sm)
        .background(
            RoundedRectangle(cornerRadius: GlassRadius.xl)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: GlassRadius.xl)
                        .stroke(LinearGradient.glassBorder, lineWidth: 1)
                        .opacity(0.3)
                )
        )
    }
}

// MARK: - Glass Tab Bar
struct GlassTabBar: View {
    struct Item: Identifiable {
        let id = UUID()
        let title: String
        let icon: String
    }

    let items: [Item]
    @Binding var selection: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(items.indices, id: \.self) { index in
                let item = items[index]
                Button {
                    selection = index
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: item.icon)
                        Text(L10n.localized(item.title))
                            .font(GlassTypography.caption(11))
                    }
                    .foregroundColor(selection == index ? .brandPaper : .textTertiary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: GlassRadius.md)
                            .fill(selection == index ? Color.brandMoss.opacity(0.25) : Color.clear)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: GlassRadius.xl)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: GlassRadius.xl)
                        .stroke(LinearGradient.glassBorder, lineWidth: 1)
                        .opacity(0.3)
                )
        )
    }
}

// MARK: - Glass Sheet
struct GlassSheet<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(GlassSpacing.lg)
            .background(
                RoundedRectangle(cornerRadius: GlassRadius.xl)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: GlassRadius.xl)
                            .stroke(LinearGradient.glassBorder, lineWidth: 1)
                            .opacity(0.35)
                    )
            )
    }
}

// MARK: - Breathing Ring
struct BreathingRingView: View {
    var progress: Double = 0.5
    var color: Color = .liquidGlassAccent
    @State private var breathe = false

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.18), lineWidth: 8)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    AngularGradient(
                        colors: [color.opacity(0.6), color, color.opacity(0.6)],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            Circle()
                .fill(color.opacity(0.2))
                .scaleEffect(breathe ? 0.9 : 0.75)
                .blur(radius: 10)
                .opacity(breathe ? 0.5 : 0.25)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                breathe = true
            }
        }
    }
}

// MARK: - Slider
struct LiquidGlassSlider: View {
    @Binding var value: Double
    var range: ClosedRange<Double>
    var step: Double = 1
    var showValue: Bool = true
    var accentColor: Color = .liquidGlassAccent

    var body: some View {
        VStack(spacing: 8) {
            if showValue {
                Text("\(Int(value))")
                    .font(GlassTypography.display(22, weight: .bold))
                    .foregroundColor(accentColor)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.brandDeepGreen.opacity(0.08))
                        .frame(height: 6)

                    Capsule()
                        .fill(accentColor)
                        .frame(width: progressWidth(geo.size.width), height: 6)
                        .shadow(color: accentColor.opacity(0.3), radius: 4)

                    Circle()
                        .fill(accentColor)
                        .frame(width: 22, height: 22)
                        .shadow(color: accentColor.opacity(0.3), radius: 6)
                        .offset(x: progressWidth(geo.size.width) - 11)
                        .gesture(
                            DragGesture().onChanged { gesture in
                                updateValue(gesture.location.x, width: geo.size.width)
                            }
                        )
                }
            }
            .frame(height: 24)
        }
    }

    private func progressWidth(_ totalWidth: CGFloat) -> CGFloat {
        let normalizedValue = (value - range.lowerBound) / (range.upperBound - range.lowerBound)
        return max(0, min(totalWidth, CGFloat(normalizedValue) * totalWidth))
    }

    private func updateValue(_ x: CGFloat, width: CGFloat) {
        let normalizedValue = max(0, min(1, x / width))
        let newValue = range.lowerBound + Double(normalizedValue) * (range.upperBound - range.lowerBound)
        let steppedValue = round(newValue / step) * step
        value = max(range.lowerBound, min(range.upperBound, steppedValue))
    }
}

// MARK: - Section Header
struct LiquidGlassSectionHeader: View {
    let title: String
    var icon: String? = nil
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 8) {
            if let iconName = icon {
                Image(systemName: iconName)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.liquidGlassAccent)
            }

            Text(L10n.localized(title))
                .font(GlassTypography.body(14, weight: .semibold))
                .foregroundColor(Color.textSecondary(for: colorScheme))
        }
    }
}

// MARK: - Page Width Helper
struct LiquidGlassPageWidthModifier: ViewModifier {
    @Environment(\.screenMetrics) private var metrics
    var alignment: Alignment

    func body(content: Content) -> some View {
        // 回到基线布局：全宽对齐 + 对称内边距 + 最大宽度限制
        content
            .frame(maxWidth: metrics.maxContentWidth, alignment: alignment)
            .padding(.horizontal, metrics.horizontalPadding)
            .frame(maxWidth: .infinity, alignment: alignment)
    }
}

extension View {
    func liquidGlassPageWidth(alignment: Alignment = .center) -> some View {
        modifier(LiquidGlassPageWidthModifier(alignment: alignment))
    }
}

// MARK: - Toggle Style
struct LiquidGlassToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack {
            configuration.label
            Spacer()
            ZStack {
                Capsule()
                    .fill(configuration.isOn ? Color.brandMoss.opacity(0.6) : Color.brandDeepGreen.opacity(0.08))
                    .frame(width: 50, height: 30)
                    .overlay(
                        Capsule()
                            .stroke(Color.brandDeepGreen.opacity(0.12), lineWidth: 1)
                    )

                Circle()
                    .fill(Color.brandPaper)
                    .frame(width: 22, height: 22)
                    .shadow(color: Color.black.opacity(0.15), radius: 2, y: 1)
                    .offset(x: configuration.isOn ? 10 : -10)
                    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isOn)
            }
            .onTapGesture {
                let impact = UIImpactFeedbackGenerator(style: .light)
                impact.impactOccurred()
                configuration.isOn.toggle()
            }
        }
    }
}

// MARK: - Pulsing Rings
struct PulsingRingsView: View {
    @State private var animate = false
    var color: Color = .liquidGlassAccent

    var body: some View {
        ZStack {
            ForEach(0..<3) { i in
                Circle()
                    .stroke(color.opacity(0.3 - Double(i) * 0.1), lineWidth: 1)
                    .scaleEffect(animate ? 1 + Double(i) * 0.2 : 0.8 + Double(i) * 0.1)
                    .opacity(animate ? 0 : 0.8)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 2.2).repeatForever(autoreverses: false)) {
                animate = true
            }
        }
    }
}

// MARK: - Background (兼容旧用法)
struct FluidBackground: View {
    var body: some View {
        AuroraBackground()
    }
}

// MARK: - Status Pill
struct StatusPill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(L10n.localized(text))
            .font(GlassTypography.caption(12, weight: .semibold))
            .foregroundColor(color)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(color.opacity(0.15))
            )
    }
}

// MARK: - Progress Ring
struct ProgressRingView: View {
    var progress: Double
    var lineWidth: CGFloat = 12
    var color: Color = .liquidGlassAccent

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: lineWidth)

            Circle()
                .trim(from: 0, to: min(progress, 1))
                .stroke(
                    AngularGradient(
                        colors: [color.opacity(0.7), color, color.opacity(0.7)],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(color: color.opacity(0.3), radius: 6)
        }
    }
}

// MARK: - Settings Row
struct LiquidGlassSettingsRow<Destination: View>: View {
    let icon: String
    var iconColor: Color = .liquidGlassAccent
    let title: String
    var subtitle: String? = nil
    let destination: () -> Destination

    init(
        icon: String,
        iconColor: Color = .liquidGlassAccent,
        title: String,
        subtitle: String? = nil,
        @ViewBuilder destination: @escaping () -> Destination
    ) {
        self.icon = icon
        self.iconColor = iconColor
        self.title = title
        self.subtitle = subtitle
        self.destination = destination
    }

    var body: some View {
        NavigationLink(destination: destination()) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(iconColor.opacity(0.15))
                        .frame(width: 32, height: 32)
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundColor(iconColor)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.localized(title))
                        .font(GlassTypography.body(14, weight: .medium))
                        .foregroundColor(.textPrimary)

                    if let subtitle = subtitle {
                        Text(L10n.localized(subtitle))
                            .font(GlassTypography.caption(11))
                            .foregroundColor(.textTertiary)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.textTertiary)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview
struct LiquidGlassComponents_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            AuroraBackground()

            VStack(spacing: 20) {
                GlassTextField(placeholder: "输入内容", text: .constant(""), icon: "person.fill")
                LiquidGlassSlider(value: .constant(50), range: 0...100)
                    .padding(.horizontal)
                LiquidGlassSectionHeader(title: "设置选项", icon: "gear")
                PulsingRingsView()
                    .frame(width: 120, height: 120)
                StatusPill(text: "良好", color: .statusSuccess)
                GlassButton(title: "开始校准", style: .primary, action: {})
            }
            .padding()
        }
        .preferredColorScheme(.light)
    }
}
