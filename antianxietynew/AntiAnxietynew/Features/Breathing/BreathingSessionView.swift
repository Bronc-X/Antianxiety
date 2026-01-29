// BreathingSessionView.swift
// 呼吸练习 - 简易引导 + Live Activity

import SwiftUI

struct BreathingSessionView: View {
    let durationMinutes: Int
    @Environment(\.dismiss) private var dismiss
    @Environment(\.screenMetrics) private var metrics

    @State private var remainingSeconds: Int
    @State private var isRunning = true

    init(durationMinutes: Int) {
        self.durationMinutes = max(1, durationMinutes)
        _remainingSeconds = State(initialValue: max(1, durationMinutes) * 60)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AbyssBackground()

                VStack(spacing: 24) {
                    Spacer()

                    ZStack {
                        PulsingRingsView(color: .liquidGlassAccent)
                            .frame(width: metrics.ringLarge, height: metrics.ringLarge)

                        VStack(spacing: 8) {
                            Text("呼吸练习")
                                .font(.title2.bold())
                                .foregroundColor(.white)

                            Text(formattedTime)
                                .font(.system(size: 34, weight: .bold, design: .rounded))
                                .foregroundColor(.liquidGlassAccent)
                        }
                    }

                    Text("跟随节奏，缓慢吸气与呼气")
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)

                    Spacer()

                    Button("结束练习") {
                        endSession()
                    }
                    .buttonStyle(LiquidGlassButtonStyle(isProminent: false))
                    .padding(.horizontal, 40)

                    Spacer(minLength: 12)
                }
                .liquidGlassPageWidth(alignment: .center)
                .padding(.vertical, metrics.verticalPadding)
            }
            .navigationTitle("呼吸练习")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("关闭") {
                        endSession()
                    }
                    .foregroundColor(.liquidGlassAccent)
                }
            }
            .task {
                // Live Activity 暂时禁用
                // await LiveActivityManager.shared.startBreathingSession(
                //     name: "呼吸练习",
                //     durationMinutes: durationMinutes
                // )
                // await updateLiveActivity()

                let totalSeconds = remainingSeconds
                while isRunning && remainingSeconds > 0 {
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                    remainingSeconds -= 1

                    // Live Activity 暂时禁用
                    // if remainingSeconds == 0 || remainingSeconds % 15 == 0 {
                    //     await updateLiveActivity(totalSeconds: totalSeconds)
                    // }
                }

                // Live Activity 暂时禁用
                // await LiveActivityManager.shared.endCurrentActivity()
                if remainingSeconds <= 0 {
                    dismiss()
                }
            }
            .onDisappear {
                isRunning = false
                // Live Activity 暂时禁用
                // Task {
                //     await LiveActivityManager.shared.endCurrentActivity()
                // }
            }
        }
    }

    private var formattedTime: String {
        let minutes = remainingSeconds / 60
        let seconds = remainingSeconds % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    private func updateLiveActivity(totalSeconds: Int? = nil) async {
        // Live Activity 暂时禁用
        // let total = totalSeconds ?? max(remainingSeconds, 1)
        // let elapsed = max(0, total - remainingSeconds)
        // let progress = total == 0 ? 1.0 : Double(elapsed) / Double(total)
        // let minutesRemaining = max(1, Int(ceil(Double(remainingSeconds) / 60.0)))
        //
        // await LiveActivityManager.shared.updateActivity(
        //     hrv: 0,
        //     anxietyScore: 70,
        //     minutesRemaining: minutesRemaining,
        //     progressPercent: progress
        // )
    }

    private func endSession() {
        isRunning = false
        dismiss()
    }
}

struct BreathingSessionView_Previews: PreviewProvider {
    static var previews: some View {
        BreathingSessionView(durationMinutes: 5)
            .preferredColorScheme(.dark)
    }
}
