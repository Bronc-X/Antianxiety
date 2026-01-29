// AppShortcuts.swift
// Siri 快捷指令 & App Shortcuts

import AppIntents
import SwiftUI

// MARK: - Max 快速唤醒

struct OpenMaxIntent: AppIntent {
    static var title: LocalizedStringResource = "打开 Max"
    static var description = IntentDescription("快速打开 Max AI 对话")
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult {
        // 发送通知让 App 切换到 Max Tab
        NotificationCenter.default.post(name: .openMaxChat, object: nil)
        return .result()
    }
}

// MARK: - 开始校准

struct StartCalibrationIntent: AppIntent {
    static var title: LocalizedStringResource = "开始校准"
    static var description = IntentDescription("开始每日健康校准")
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: .startCalibration, object: nil)
        return .result()
    }
}

// MARK: - 查看健康数据

struct ViewHealthDataIntent: AppIntent {
    static var title: LocalizedStringResource = "查看健康数据"
    static var description = IntentDescription("查看今日健康指标")
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: .openDashboard, object: nil)
        return .result()
    }
}

// MARK: - 开始呼吸练习

struct StartBreathingIntent: AppIntent {
    static var title: LocalizedStringResource = "开始呼吸练习"
    static var description = IntentDescription("开始 5 分钟呼吸放松练习")
    static var openAppWhenRun: Bool = true
    
    @Parameter(title: "持续时间", default: 5)
    var duration: Int
    
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(
            name: .startBreathing,
            object: nil,
            userInfo: ["duration": duration]
        )
        return .result()
    }
}

// MARK: - 快速问 Max

struct AskMaxIntent: AppIntent {
    static var title: LocalizedStringResource = "问 Max"
    static var description = IntentDescription("向 Max 提问")
    static var openAppWhenRun: Bool = true
    
    @Parameter(title: "问题")
    var question: String
    
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(
            name: .askMax,
            object: nil,
            userInfo: ["question": question]
        )
        return .result()
    }
}

// MARK: - App Shortcuts Provider

struct AntiAnxietyShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenMaxIntent(),
            phrases: [
                "打开 \(.applicationName) Max",
                "和 \(.applicationName) Max 聊天",
                "唤醒 Max"
            ],
            shortTitle: "打开 Max",
            systemImageName: "bubble.left.and.bubble.right.fill"
        )
        
        AppShortcut(
            intent: StartCalibrationIntent(),
            phrases: [
                "开始 \(.applicationName) 校准",
                "进行健康校准"
            ],
            shortTitle: "开始校准",
            systemImageName: "brain.head.profile"
        )
        
        AppShortcut(
            intent: ViewHealthDataIntent(),
            phrases: [
                "查看 \(.applicationName) 健康数据",
                "显示我的焦虑指数"
            ],
            shortTitle: "查看健康",
            systemImageName: "chart.bar.fill"
        )
        
        AppShortcut(
            intent: StartBreathingIntent(),
            phrases: [
                "开始呼吸练习",
                "用 \(.applicationName) 练习呼吸"
            ],
            shortTitle: "呼吸练习",
            systemImageName: "wind"
        )
        
        AppShortcut(
            intent: AskMaxIntent(),
            phrases: [
                "问 Max \(\.$question)",
                "让 Max 回答 \(\.$question)"
            ],
            shortTitle: "问 Max",
            systemImageName: "questionmark.bubble.fill"
        )
    }
}
