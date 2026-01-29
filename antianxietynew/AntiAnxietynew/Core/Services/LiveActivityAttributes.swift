// LiveActivityAttributes.swift
// Live Activities 数据模型

import ActivityKit
import WidgetKit
import SwiftUI

struct AnxietyTrackingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // 动态数据
        var currentHRV: Double
        var anxietyScore: Int
        var minutesRemaining: Int
        var sessionType: String // "breathing", "meditation", "calibration"
        var progressPercent: Double
    }
    
    // 静态数据
    var sessionName: String
    var startTime: Date
}

// MARK: - Live Activity View

struct AnxietyLiveActivityView: View {
    let context: ActivityViewContext<AnxietyTrackingAttributes>
    
    var body: some View {
        HStack(spacing: 16) {
            // 左侧：图标和进度
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 4)
                    .frame(width: 50, height: 50)
                
                Circle()
                    .trim(from: 0, to: context.state.progressPercent)
                    .stroke(progressColor, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .frame(width: 50, height: 50)
                    .rotationEffect(.degrees(-90))
                
                Image(systemName: sessionIcon)
                    .font(.title3)
                    .foregroundColor(progressColor)
            }
            
            // 中间：会话信息
            VStack(alignment: .leading, spacing: 4) {
                Text(context.attributes.sessionName)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text("\(context.state.minutesRemaining) 分钟剩余")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // 右侧：指数和 HRV
            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 4) {
                    Text("\(context.state.anxietyScore)")
                        .font(.title2.bold())
                        .foregroundColor(scoreColor)
                    
                    Image(systemName: scoreTrend)
                        .font(.caption)
                        .foregroundColor(scoreColor)
                }
                
                Text("HRV: \(Int(context.state.currentHRV))ms")
                    .font(.caption.monospacedDigit())
                    .foregroundColor(.secondary)
            }
        }
        .padding()
    }
    
    var sessionIcon: String {
        switch context.state.sessionType {
        case "breathing": return "wind"
        case "meditation": return "brain.head.profile"
        case "calibration": return "slider.horizontal.3"
        default: return "heart.fill"
        }
    }
    
    var progressColor: Color {
        switch context.state.sessionType {
        case "breathing": return .cyan
        case "meditation": return .purple
        case "calibration": return .orange
        default: return .green
        }
    }
    
    var scoreColor: Color {
        switch context.state.anxietyScore {
        case 80...100: return .green
        case 60..<80: return .cyan
        case 40..<60: return .yellow
        default: return .red
        }
    }
    
    var scoreTrend: String {
        context.state.anxietyScore >= 60 ? "arrow.up.right" : "arrow.down.right"
    }
}

// MARK: - Compact Views

struct AnxietyLiveActivityCompactLeading: View {
    let context: ActivityViewContext<AnxietyTrackingAttributes>
    
    var body: some View {
        Image(systemName: "brain.head.profile")
            .foregroundColor(.cyan)
    }
}

struct AnxietyLiveActivityCompactTrailing: View {
    let context: ActivityViewContext<AnxietyTrackingAttributes>
    
    var body: some View {
        Text("\(context.state.anxietyScore)")
            .font(.headline.monospacedDigit())
            .foregroundColor(context.state.anxietyScore >= 60 ? .green : .yellow)
    }
}

// MARK: - Minimal View

struct AnxietyLiveActivityMinimal: View {
    let context: ActivityViewContext<AnxietyTrackingAttributes>
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.gray.opacity(0.3), lineWidth: 2)
            
            Circle()
                .trim(from: 0, to: context.state.progressPercent)
                .stroke(Color.cyan, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                .rotationEffect(.degrees(-90))
            
            Text("\(context.state.anxietyScore)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
        }
    }
}
