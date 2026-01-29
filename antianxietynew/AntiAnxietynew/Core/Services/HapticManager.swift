// HapticManager.swift
// 触感反馈管理

import UIKit

@MainActor
final class HapticManager {
    static let shared = HapticManager()

    private init() {}

    func lightImpact() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    func mediumImpact() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }

    func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }

    func breathingHaptic() {
        Task { @MainActor in
            await breathingSequence()
        }
    }

    private func breathingSequence() async {
        lightImpact()
        await sleep(seconds: 4)
        mediumImpact()
        await sleep(seconds: 7)
        lightImpact()
        await sleep(seconds: 8)
    }

    private func sleep(seconds: Double) async {
        let nanoseconds = UInt64(seconds * 1_000_000_000)
        try? await Task.sleep(nanoseconds: nanoseconds)
    }
}
