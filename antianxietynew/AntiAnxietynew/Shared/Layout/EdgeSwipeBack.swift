// EdgeSwipeBack.swift
// 左侧中部边缘右滑返回

import SwiftUI

struct EdgeSwipeBackModifier: ViewModifier {
    @Environment(\.dismiss) private var dismiss

    var edgeWidth: CGFloat = 24
    var minTranslation: CGFloat = 36
    var verticalZone: ClosedRange<CGFloat> = 0.2...0.8
    var verticalToleranceRatio: CGFloat = 0.6

    func body(content: Content) -> some View {
        content.overlay(
            GeometryReader { proxy in
                let height = max(1, proxy.size.height)
                Color.clear
                    .contentShape(Rectangle())
                    .simultaneousGesture(
                        DragGesture(minimumDistance: 10, coordinateSpace: .local)
                            .onEnded { value in
                                let start = value.startLocation
                                let translation = value.translation
                                let inEdge = start.x <= edgeWidth
                                let inVerticalZone = start.y >= height * verticalZone.lowerBound &&
                                    start.y <= height * verticalZone.upperBound
                                let isHorizontal = translation.width > minTranslation &&
                                    abs(translation.height) <= translation.width * verticalToleranceRatio

                                if inEdge && inVerticalZone && isHorizontal {
                                    dismiss()
                                }
                            }
                    )
            }
        )
    }
}

extension View {
    func edgeSwipeBack(
        edgeWidth: CGFloat = 24,
        minTranslation: CGFloat = 36,
        verticalZone: ClosedRange<CGFloat> = 0.2...0.8
    ) -> some View {
        modifier(
            EdgeSwipeBackModifier(
                edgeWidth: edgeWidth,
                minTranslation: minTranslation,
                verticalZone: verticalZone
            )
        )
    }
}
