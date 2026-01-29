// AdaptiveLayout.swift
// 响应式布局系统

import SwiftUI

enum DeviceType {
    case phoneSE
    case phoneStandard
    case phoneProMax
    case pad
}

extension ScreenMetrics {
    var deviceType: DeviceType {
        if size.width >= 700 {
            return .pad
        }
        if size.width <= 360 {
            return .phoneSE
        }
        if size.width >= 430 {
            return .phoneProMax
        }
        return .phoneStandard
    }
}

struct AdaptiveStack<Content: View>: View {
    var compactAxis: Axis = .vertical
    var regularAxis: Axis = .horizontal
    var spacing: CGFloat = GlassSpacing.md
    let content: Content

    @Environment(\.screenMetrics) private var metrics

    init(
        compactAxis: Axis = .vertical,
        regularAxis: Axis = .horizontal,
        spacing: CGFloat = GlassSpacing.md,
        @ViewBuilder content: () -> Content
    ) {
        self.compactAxis = compactAxis
        self.regularAxis = regularAxis
        self.spacing = spacing
        self.content = content()
    }

    var body: some View {
        let axis: Axis = metrics.deviceType == .pad ? regularAxis : compactAxis
        if axis == .horizontal {
            HStack(spacing: spacing) { content }
        } else {
            VStack(spacing: spacing) { content }
        }
    }
}

struct ResponsiveGrid<Content: View>: View {
    var minColumnWidth: CGFloat = 160
    var spacing: CGFloat = GlassSpacing.md
    let content: Content

    @Environment(\.screenMetrics) private var metrics

    init(
        minColumnWidth: CGFloat = 160,
        spacing: CGFloat = GlassSpacing.md,
        @ViewBuilder content: () -> Content
    ) {
        self.minColumnWidth = minColumnWidth
        self.spacing = spacing
        self.content = content()
    }

    private var columns: [GridItem] {
        let available = metrics.maxContentWidth
        let count = max(1, Int(available / minColumnWidth))
        return Array(repeating: GridItem(.flexible(), spacing: spacing), count: count)
    }

    var body: some View {
        LazyVGrid(columns: columns, spacing: spacing) {
            content
        }
    }
}

extension View {
    func safeAreaBottomInset(_ inset: CGFloat) -> some View {
        padding(.bottom, inset)
            .ignoresSafeArea(edges: .bottom)
    }
}
