import Foundation

struct InquiryContextSummary {
    let insights: InquiryInsights
    let recentResponses: [InquiryRecentResponse]
    let suggestedTopics: [String]
}

struct InquiryInsights {
    var recentSleepPattern: String?
    var recentStressLevel: String?
    var recentExercise: String?
    var recentMood: String?
    var lastInquiryTime: String?
    var totalResponses: Int
    var responseRate: Double
}

struct InquiryRecentResponse {
    let question: String
    let response: String
    let timestamp: String
    let dataGap: String
}

enum InquiryContextService {
    static func buildContext(from records: [InquiryHistoryRecord], language: String) -> InquiryContextSummary {
        var insights = InquiryInsights(
            recentSleepPattern: nil,
            recentStressLevel: nil,
            recentExercise: nil,
            recentMood: nil,
            lastInquiryTime: nil,
            totalResponses: 0,
            responseRate: 0
        )
        var recentResponses: [InquiryRecentResponse] = []
        var suggestedTopics: [String] = []

        if !records.isEmpty {
            var responded = 0
            for record in records {
                if let response = record.userResponse, !response.isEmpty {
                    responded += 1
                    let dataGap = record.dataGapsAddressed.first ?? "unknown"

                    switch dataGap {
                    case "sleep_hours":
                        if insights.recentSleepPattern == nil {
                            insights.recentSleepPattern = response == "under_6" ? "poor" : response == "over_8" ? "good" : "average"
                            if insights.recentSleepPattern == "poor" {
                                suggestedTopics.append(contentsOf: ["sleep_optimization", "circadian_rhythm"])
                            }
                        }
                    case "stress_level":
                        if insights.recentStressLevel == nil {
                            if ["low", "medium", "high"].contains(response) {
                                insights.recentStressLevel = response
                            }
                            if insights.recentStressLevel == "high" {
                                suggestedTopics.append(contentsOf: ["stress_management", "cortisol_regulation", "breathing_exercises"])
                            }
                        }
                    case "exercise_duration":
                        if insights.recentExercise == nil {
                            if ["none", "light", "moderate", "intense"].contains(response) {
                                insights.recentExercise = response
                            }
                            if insights.recentExercise == "none" {
                                suggestedTopics.append(contentsOf: ["exercise_benefits", "zone2_cardio"])
                            }
                        }
                    case "mood":
                        if insights.recentMood == nil {
                            if ["bad", "okay", "great"].contains(response) {
                                insights.recentMood = response
                            }
                            if insights.recentMood == "bad" {
                                suggestedTopics.append(contentsOf: ["mental_health", "neurotransmitters"])
                            }
                        }
                    default:
                        break
                    }

                    recentResponses.append(
                        InquiryRecentResponse(
                            question: record.questionText,
                            response: response,
                            timestamp: record.respondedAt ?? record.createdAt,
                            dataGap: dataGap
                        )
                    )
                }

                if insights.lastInquiryTime == nil {
                    insights.lastInquiryTime = record.createdAt
                }
            }

            insights.totalResponses = responded
            insights.responseRate = records.isEmpty ? 0 : Double(responded) / Double(records.count)
        }

        return InquiryContextSummary(
            insights: insights,
            recentResponses: Array(recentResponses.prefix(5)),
            suggestedTopics: Array(Set(suggestedTopics))
        )
    }

    static func generateSummary(_ context: InquiryContextSummary, language: String) -> String {
        let lang = language == "en" ? "en" : "zh"
        if context.recentResponses.isEmpty {
            return lang == "en" ? "No recent inquiry data available." : "暂无最近的问询数据。"
        }

        var parts: [String] = []
        if lang == "zh" {
            parts.append("用户最近的状态：")
            if let sleep = context.insights.recentSleepPattern {
                let text: [String: String] = [
                    "poor": "睡眠不足（少于6小时）",
                    "average": "睡眠一般（6-8小时）",
                    "good": "睡眠充足（8小时以上）"
                ]
                parts.append("- 睡眠：\(text[sleep] ?? sleep)")
            }
            if let stress = context.insights.recentStressLevel {
                let text: [String: String] = [
                    "low": "压力较低",
                    "medium": "压力中等",
                    "high": "压力较大"
                ]
                parts.append("- 压力：\(text[stress] ?? stress)")
            }
            if let exercise = context.insights.recentExercise {
                let text: [String: String] = [
                    "none": "未运动",
                    "light": "轻度运动",
                    "moderate": "中等强度运动",
                    "intense": "高强度运动"
                ]
                parts.append("- 运动：\(text[exercise] ?? exercise)")
            }
            if let mood = context.insights.recentMood {
                let text: [String: String] = [
                    "bad": "心情不佳",
                    "okay": "心情一般",
                    "great": "心情很好"
                ]
                parts.append("- 情绪：\(text[mood] ?? mood)")
            }
            parts.append("\n响应率：\(Int(round(context.insights.responseRate * 100)))%")
        } else {
            parts.append("User's recent status:")
            if let sleep = context.insights.recentSleepPattern {
                let text: [String: String] = [
                    "poor": "Poor sleep (less than 6 hours)",
                    "average": "Average sleep (6-8 hours)",
                    "good": "Good sleep (8+ hours)"
                ]
                parts.append("- Sleep: \(text[sleep] ?? sleep)")
            }
            if let stress = context.insights.recentStressLevel {
                let text: [String: String] = [
                    "low": "Low stress",
                    "medium": "Medium stress",
                    "high": "High stress"
                ]
                parts.append("- Stress: \(text[stress] ?? stress)")
            }
            if let exercise = context.insights.recentExercise {
                let text: [String: String] = [
                    "none": "No exercise",
                    "light": "Light exercise",
                    "moderate": "Moderate exercise",
                    "intense": "Intense exercise"
                ]
                parts.append("- Exercise: \(text[exercise] ?? exercise)")
            }
            if let mood = context.insights.recentMood {
                let text: [String: String] = [
                    "bad": "Bad mood",
                    "okay": "Okay mood",
                    "great": "Great mood"
                ]
                parts.append("- Mood: \(text[mood] ?? mood)")
            }
            parts.append("\nResponse rate: \(Int(round(context.insights.responseRate * 100)))%")
        }

        return parts.joined(separator: "\n")
    }
}

struct InquiryHistoryRecord {
    let id: String
    let questionText: String
    let userResponse: String?
    let dataGapsAddressed: [String]
    let createdAt: String
    let respondedAt: String?
}
