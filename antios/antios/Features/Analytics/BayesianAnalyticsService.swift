//
//  BayesianAnalyticsService.swift
//  antios
//
//  G1-G2: 贝叶斯分析服务
//

import Foundation

class BayesianAnalyticsService {
    static let shared = BayesianAnalyticsService()
    
    private init() {}
    
    // MARK: - G1: 置信度计算
    
    struct ConfidenceResult {
        let factor: String
        let confidence: Double
        let direction: TrendDirection
        let description: String
    }
    
    enum TrendDirection: String {
        case positive = "positive"
        case negative = "negative"
        case neutral = "neutral"
    }
    
    func calculateConfidence(
        sleepData: [SleepData],
        moodScores: [Int],
        stressLevels: [Int]
    ) -> [ConfidenceResult] {
        var results: [ConfidenceResult] = []
        
        // 睡眠与情绪相关性
        if sleepData.count >= 7 && moodScores.count >= 7 {
            let sleepMoodCorrelation = calculateCorrelation(
                x: sleepData.map { $0.totalHours },
                y: moodScores.map { Double($0) }
            )
            
            let confidence = abs(sleepMoodCorrelation)
            let direction: TrendDirection = sleepMoodCorrelation > 0 ? .positive : .negative
            
            results.append(ConfidenceResult(
                factor: "睡眠-情绪",
                confidence: confidence,
                direction: direction,
                description: confidence > 0.6
                    ? "你的睡眠质量与情绪有强相关性"
                    : "你的睡眠对情绪影响适中"
            ))
        }
        
        // 压力趋势
        if stressLevels.count >= 7 {
            let recentAvg = Double(stressLevels.suffix(3).reduce(0, +)) / 3.0
            let previousAvg = Double(stressLevels.prefix(4).reduce(0, +)) / 4.0
            
            let trend = recentAvg - previousAvg
            let direction: TrendDirection = trend > 0.5 ? .negative : trend < -0.5 ? .positive : .neutral
            
            results.append(ConfidenceResult(
                factor: "压力趋势",
                confidence: min(abs(trend) / 3.0, 1.0),
                direction: direction,
                description: direction == .positive
                    ? "你的压力水平正在下降"
                    : direction == .negative
                    ? "你的压力水平有所上升"
                    : "你的压力水平保持稳定"
            ))
        }
        
        return results
    }
    
    private func calculateCorrelation(x: [Double], y: [Double]) -> Double {
        guard x.count == y.count, x.count > 1 else { return 0 }
        
        let n = Double(x.count)
        let sumX = x.reduce(0, +)
        let sumY = y.reduce(0, +)
        let sumXY = zip(x, y).map(*).reduce(0, +)
        let sumX2 = x.map { $0 * $0 }.reduce(0, +)
        let sumY2 = y.map { $0 * $0 }.reduce(0, +)
        
        let numerator = n * sumXY - sumX * sumY
        let denominator = sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
        
        return denominator == 0 ? 0 : numerator / denominator
    }
    
    // MARK: - G2: 行为推动
    
    struct BehavioralNudge {
        let id: String
        let title: String
        let message: String
        let priority: NudgePriority
        let actionType: String
    }
    
    enum NudgePriority: Int {
        case low = 1
        case medium = 2
        case high = 3
    }
    
    func generateNudges(
        sleepData: SleepData?,
        stressLevel: Int?,
        lastCalibration: Date?,
        planCompletion: Double?
    ) -> [BehavioralNudge] {
        var nudges: [BehavioralNudge] = []
        
        // 睡眠不足提醒
        if let sleep = sleepData, sleep.totalHours < 6 {
            nudges.append(BehavioralNudge(
                id: "sleep_deficit",
                title: "睡眠不足",
                message: "昨晚睡眠时间较短，建议今晚早点休息",
                priority: .high,
                actionType: "sleep_plan"
            ))
        }
        
        // 高压力干预
        if let stress = stressLevel, stress >= 7 {
            nudges.append(BehavioralNudge(
                id: "high_stress",
                title: "压力较高",
                message: "检测到压力水平较高，试试 4-7-8 呼吸法？",
                priority: .high,
                actionType: "breathing_exercise"
            ))
        }
        
        // 校准提醒
        if let lastCal = lastCalibration {
            let hoursSince = Date().timeIntervalSince(lastCal) / 3600
            if hoursSince > 24 {
                nudges.append(BehavioralNudge(
                    id: "calibration_reminder",
                    title: "每日校准",
                    message: "今天还没有进行校准，花 2 分钟记录一下状态吧",
                    priority: .medium,
                    actionType: "daily_calibration"
                ))
            }
        }
        
        // 方案执行鼓励
        if let completion = planCompletion {
            if completion >= 0.8 {
                nudges.append(BehavioralNudge(
                    id: "plan_achievement",
                    title: "太棒了！",
                    message: "你今天完成了 \(Int(completion * 100))% 的方案，继续保持！",
                    priority: .low,
                    actionType: "celebration"
                ))
            } else if completion < 0.3 {
                nudges.append(BehavioralNudge(
                    id: "plan_encouragement",
                    title: "小步前进",
                    message: "还有一些任务未完成，选一个最简单的开始吧",
                    priority: .medium,
                    actionType: "plan_view"
                ))
            }
        }
        
        return nudges.sorted { $0.priority.rawValue > $1.priority.rawValue }
    }
    
    // MARK: - 预测模型
    
    func predictMoodScore(
        sleepHours: Double,
        stressLevel: Int,
        exerciseMinutes: Int
    ) -> Int {
        // 简化的线性预测模型
        var score: Double = 5.0
        
        // 睡眠影响
        if sleepHours >= 7 && sleepHours <= 9 {
            score += 1.5
        } else if sleepHours < 6 {
            score -= 1.5
        }
        
        // 压力影响
        score -= Double(stressLevel) * 0.3
        
        // 运动影响
        if exerciseMinutes >= 30 {
            score += 1.0
        } else if exerciseMinutes >= 15 {
            score += 0.5
        }
        
        return max(1, min(10, Int(score.rounded())))
    }
}
