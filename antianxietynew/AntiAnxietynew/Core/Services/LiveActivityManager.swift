// LiveActivityManager.swift
// Live Activities 管理器

import ActivityKit
import SwiftUI

@MainActor
final class LiveActivityManager: ObservableObject, LiveActivityManaging {
    static let shared = LiveActivityManager()
    
    @Published var currentActivity: Activity<AnxietyTrackingAttributes>?
    @Published var isActivityActive = false

    private init() {}
    
    // MARK: - 开始 Live Activity
    
    func startBreathingSession(name: String, durationMinutes: Int) async {
        await startActivity(
            sessionName: name,
            sessionType: "breathing",
            durationMinutes: durationMinutes
        )
    }
    
    func startMeditationSession(name: String, durationMinutes: Int) async {
        await startActivity(
            sessionName: name,
            sessionType: "meditation",
            durationMinutes: durationMinutes
        )
    }
    
    func startCalibrationSession() async {
        await startActivity(
            sessionName: "每日校准",
            sessionType: "calibration",
            durationMinutes: 5
        )
    }
    
    private func startActivity(sessionName: String, sessionType: String, durationMinutes: Int) async {
        // 检查是否支持 Live Activities
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("Live Activities 未启用")
            return
        }
        
        // 结束之前的活动
        await endCurrentActivity()
        
        let attributes = AnxietyTrackingAttributes(
            sessionName: sessionName,
            startTime: Date()
        )
        
        let initialState = AnxietyTrackingAttributes.ContentState(
            currentHRV: 0,
            anxietyScore: 70,
            minutesRemaining: durationMinutes,
            sessionType: sessionType,
            progressPercent: 0
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                contentState: initialState,
                pushType: nil
            )
            
            currentActivity = activity
            isActivityActive = true
            print("Live Activity 已启动: \(activity.id)")
        } catch {
            print("启动 Live Activity 失败: \(error.localizedDescription)")
        }
    }
    
    // MARK: - 更新 Live Activity
    
    func updateActivity(
        hrv: Double,
        anxietyScore: Int,
        minutesRemaining: Int,
        progressPercent: Double
    ) async {
        guard let activity = currentActivity else { return }
        
        let updatedState = AnxietyTrackingAttributes.ContentState(
            currentHRV: hrv,
            anxietyScore: anxietyScore,
            minutesRemaining: minutesRemaining,
            sessionType: activity.contentState.sessionType,
            progressPercent: progressPercent
        )
        
        await activity.update(using: updatedState)
    }
    
    // MARK: - 结束 Live Activity
    
    func endCurrentActivity() async {
        guard let activity = currentActivity else { return }
        
        let finalState = AnxietyTrackingAttributes.ContentState(
            currentHRV: activity.contentState.currentHRV,
            anxietyScore: activity.contentState.anxietyScore,
            minutesRemaining: 0,
            sessionType: activity.contentState.sessionType,
            progressPercent: 1.0
        )
        
        await activity.end(using: finalState, dismissalPolicy: .immediate)
        
        currentActivity = nil
        isActivityActive = false
        print("Live Activity 已结束")
    }
    
    // MARK: - 结束所有活动
    
    func endAllActivities() async {
        for activity in Activity<AnxietyTrackingAttributes>.activities {
            await activity.end(dismissalPolicy: .immediate)
        }
        
        currentActivity = nil
        isActivityActive = false
    }
}
