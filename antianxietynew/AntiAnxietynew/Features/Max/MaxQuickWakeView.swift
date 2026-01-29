// MaxQuickWakeView.swift
// Max 快速唤醒视图（用于 Spotlight 和锁屏快速访问）

import SwiftUI

struct MaxQuickWakeView: View {
    @State private var inputText = ""
    @State private var isProcessing = false
    @FocusState private var isFocused: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // 头像和状态
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [.cyan, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: "brain.head.profile")
                        .font(.title3)
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Max")
                        .font(.headline)
                    Text(isProcessing ? "思考中..." : "有什么我能帮你的？")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isProcessing {
                    ProgressView()
                }
            }
            
            // 快速问题输入
            HStack(spacing: 12) {
                TextField("快速问 Max...", text: $inputText)
                    .focused($isFocused)
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                
                Button {
                    sendQuickQuestion()
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.cyan)
                }
                .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isProcessing)
            }
            
            // 快捷操作
            HStack(spacing: 12) {
                QuickActionButton(icon: "waveform.path.ecg", title: "查看 HRV") {
                    NotificationCenter.default.post(name: .openDashboard, object: nil)
                }
                
                QuickActionButton(icon: "brain.head.profile", title: "开始校准") {
                    NotificationCenter.default.post(name: .startCalibration, object: nil)
                }
                
                QuickActionButton(icon: "wind", title: "呼吸练习") {
                    NotificationCenter.default.post(name: .startBreathing, object: nil, userInfo: ["duration": 5])
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .onAppear {
            isFocused = true
        }
    }
    
    private func sendQuickQuestion() {
        guard !inputText.isEmpty else { return }
        
        isProcessing = true
        
        // 发送到 Max
        NotificationCenter.default.post(
            name: .askMax,
            object: nil,
            userInfo: ["question": inputText]
        )
        
        // 延迟后重置
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isProcessing = false
            inputText = ""
        }
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.title3)
                Text(title)
                    .font(.caption2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .foregroundColor(.primary)
    }
}

struct MaxQuickWakeView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            MaxQuickWakeView()
                .padding()
        }
        .preferredColorScheme(.dark)
    }
}
