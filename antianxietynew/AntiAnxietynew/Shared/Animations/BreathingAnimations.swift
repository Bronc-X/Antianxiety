// BreathingAnimations.swift
// 呼吸感动画系统（4-7-8 ρυθμός）

import SwiftUI

enum BreathingPhase: String {
    case inhale
    case hold
    case exhale

    var title: String {
        switch self {
        case .inhale: return "吸气"
        case .hold: return "屏息"
        case .exhale: return "呼气"
        }
    }
}

struct BreathingCircle: View {
    var tint: Color = .brandMoss
    var cycleDuration: Double = 19
    var minScale: CGFloat = 0.82
    var maxScale: CGFloat = 1.0

    private let inhaleDuration: Double = 4
    private let holdDuration: Double = 7
    private let exhaleDuration: Double = 8

    var body: some View {
        TimelineView(.animation) { context in
            let t = context.date.timeIntervalSinceReferenceDate
            let progress = t.truncatingRemainder(dividingBy: cycleDuration)
            let state = breathingState(at: progress)

            ZStack {
                Circle()
                    .fill(tint.opacity(0.18))
                    .frame(width: 240, height: 240)
                    .blur(radius: 26)
                    .scaleEffect(state.scale)

                Circle()
                    .stroke(tint.opacity(0.4), lineWidth: 2)
                    .frame(width: 210, height: 210)
                    .scaleEffect(state.scale)

                Circle()
                    .fill(
                        LinearGradient(
                            colors: [tint.opacity(0.35), tint.opacity(0.12)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 180, height: 180)
                    .scaleEffect(state.scale)

                Text(state.phase.title)
                    .font(GlassTypography.title(18, weight: .semibold))
                    .foregroundColor(.textPrimary)
            }
            .animation(.easeInOut(duration: 0.2), value: state.phase)
        }
    }

    private func breathingState(at progress: Double) -> (phase: BreathingPhase, scale: CGFloat) {
        if progress < inhaleDuration {
            let ratio = eased(progress / inhaleDuration)
            return (.inhale, lerp(minScale, maxScale, ratio))
        }
        if progress < inhaleDuration + holdDuration {
            return (.hold, maxScale)
        }
        let exhaleProgress = (progress - inhaleDuration - holdDuration) / exhaleDuration
        let ratio = eased(exhaleProgress)
        return (.exhale, lerp(maxScale, minScale, ratio))
    }

    private func eased(_ t: Double) -> CGFloat {
        let clamped = max(0, min(1, t))
        let easedValue = 0.5 - cos(.pi * clamped) * 0.5
        return CGFloat(easedValue)
    }

    private func lerp(_ start: CGFloat, _ end: CGFloat, _ t: CGFloat) -> CGFloat {
        start + (end - start) * t
    }
}

struct PulseAnimation: ViewModifier {
    var duration: Double = 2.4
    var scale: CGFloat = 1.04
    @State private var animate = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(animate ? scale : 1.0)
            .animation(.easeInOut(duration: duration).repeatForever(autoreverses: true), value: animate)
            .onAppear { animate = true }
    }
}

struct FloatingAnimation: ViewModifier {
    var duration: Double = 5.0
    var offset: CGFloat = 8
    @State private var animate = false

    func body(content: Content) -> some View {
        content
            .offset(y: animate ? -offset : offset)
            .animation(.easeInOut(duration: duration).repeatForever(autoreverses: true), value: animate)
            .onAppear { animate = true }
    }
}

struct GentleFade: ViewModifier {
    var duration: Double = 0.6
    @State private var visible = false

    func body(content: Content) -> some View {
        content
            .opacity(visible ? 1 : 0)
            .animation(.easeInOut(duration: duration), value: visible)
            .onAppear { visible = true }
    }
}

extension View {
    func pulseAnimation(duration: Double = 2.4, scale: CGFloat = 1.04) -> some View {
        modifier(PulseAnimation(duration: duration, scale: scale))
    }

    func floatingAnimation(duration: Double = 5.0, offset: CGFloat = 8) -> some View {
        modifier(FloatingAnimation(duration: duration, offset: offset))
    }

    func gentleFade(duration: Double = 0.6) -> some View {
        modifier(GentleFade(duration: duration))
    }
}
