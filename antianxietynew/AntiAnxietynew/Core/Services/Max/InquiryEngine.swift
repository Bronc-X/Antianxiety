import Foundation

struct DataGap: Codable, Equatable {
    let field: String
    let importance: InquiryPriority
    let description: String
    let lastUpdated: String?
}

enum InquiryPriority: String, Codable {
    case high
    case medium
    case low
}

enum InquiryEngine {
    private static let dataGapDefinitions: [DataGap] = [
        DataGap(field: "sleep_hours", importance: .high, description: "睡眠时长数据", lastUpdated: nil),
        DataGap(field: "stress_level", importance: .high, description: "压力水平数据", lastUpdated: nil),
        DataGap(field: "exercise_duration", importance: .medium, description: "运动时长数据", lastUpdated: nil),
        DataGap(field: "meal_quality", importance: .medium, description: "饮食质量数据", lastUpdated: nil),
        DataGap(field: "mood", importance: .low, description: "情绪状态数据", lastUpdated: nil),
        DataGap(field: "water_intake", importance: .low, description: "饮水量数据", lastUpdated: nil)
    ]

    static func identifyDataGaps(
        recentData: [String: (value: String, timestamp: String)],
        staleThresholdHours: Int = 24
    ) -> [DataGap] {
        let now = Date()
        var gaps: [DataGap] = []

        for gapDef in dataGapDefinitions {
            guard let data = recentData[gapDef.field] else {
                gaps.append(gapDef)
                continue
            }
            let date = ISO8601DateFormatter().date(from: data.timestamp) ?? Date(timeIntervalSince1970: 0)
            let hours = now.timeIntervalSince(date) / 3600
            if hours > Double(staleThresholdHours) {
                gaps.append(DataGap(
                    field: gapDef.field,
                    importance: gapDef.importance,
                    description: gapDef.description,
                    lastUpdated: data.timestamp
                ))
            }
        }

        return gaps
    }

    static func prioritizeDataGaps(_ gaps: [DataGap]) -> [DataGap] {
        let priorityOrder: [InquiryPriority] = [.high, .medium, .low]
        return gaps.sorted { lhs, rhs in
            priorityOrder.firstIndex(of: lhs.importance) ?? 99 < priorityOrder.firstIndex(of: rhs.importance) ?? 99
        }
    }

    static func inquiryTemplate(for gap: DataGap, language: String) -> InquiryQuestion? {
        let lang = language == "en" ? "en" : "zh"
        switch gap.field {
        case "sleep_hours":
            return InquiryQuestion(
                id: "inquiry_sleep",
                questionText: lang == "en" ? "How did you sleep last night? About how many hours?" : "昨晚睡得怎么样？大概睡了几个小时？",
                questionType: "diagnostic",
                priority: "high",
                dataGapsAddressed: ["sleep_hours"],
                options: [
                    InquiryOption(label: lang == "en" ? "Less than 6 hours" : "不到6小时", value: "under_6"),
                    InquiryOption(label: lang == "en" ? "6-7 hours" : "6-7小时", value: "6_7"),
                    InquiryOption(label: lang == "en" ? "7-8 hours" : "7-8小时", value: "7_8"),
                    InquiryOption(label: lang == "en" ? "More than 8 hours" : "8小时以上", value: "over_8")
                ],
                feedContent: nil
            )
        case "stress_level":
            return InquiryQuestion(
                id: "inquiry_stress",
                questionText: lang == "en" ? "Are you feeling stressed today?" : "今天感觉压力大吗？",
                questionType: "diagnostic",
                priority: "high",
                dataGapsAddressed: ["stress_level"],
                options: [
                    InquiryOption(label: lang == "en" ? "Very relaxed" : "很轻松", value: "low"),
                    InquiryOption(label: lang == "en" ? "A bit tense" : "有点紧张", value: "medium"),
                    InquiryOption(label: lang == "en" ? "Very stressed" : "压力很大", value: "high")
                ],
                feedContent: nil
            )
        case "exercise_duration":
            return InquiryQuestion(
                id: "inquiry_exercise",
                questionText: lang == "en" ? "Did you exercise today?" : "今天有运动吗？",
                questionType: "diagnostic",
                priority: "medium",
                dataGapsAddressed: ["exercise_duration"],
                options: [
                    InquiryOption(label: lang == "en" ? "No" : "没有", value: "none"),
                    InquiryOption(label: lang == "en" ? "Light activity" : "轻度活动", value: "light"),
                    InquiryOption(label: lang == "en" ? "Moderate intensity" : "中等强度", value: "moderate"),
                    InquiryOption(label: lang == "en" ? "High intensity" : "高强度", value: "intense")
                ],
                feedContent: nil
            )
        case "meal_quality":
            return InquiryQuestion(
                id: "inquiry_meal",
                questionText: lang == "en" ? "Did you eat healthy today?" : "今天吃得健康吗？",
                questionType: "diagnostic",
                priority: "medium",
                dataGapsAddressed: ["meal_quality"],
                options: [
                    InquiryOption(label: lang == "en" ? "Very healthy" : "很健康", value: "healthy"),
                    InquiryOption(label: lang == "en" ? "Average" : "一般", value: "average"),
                    InquiryOption(label: lang == "en" ? "Not very healthy" : "不太健康", value: "unhealthy")
                ],
                feedContent: nil
            )
        case "mood":
            return InquiryQuestion(
                id: "inquiry_mood",
                questionText: lang == "en" ? "How are you feeling right now?" : "现在心情如何？",
                questionType: "diagnostic",
                priority: "low",
                dataGapsAddressed: ["mood"],
                options: [
                    InquiryOption(label: lang == "en" ? "Great" : "很好", value: "great"),
                    InquiryOption(label: lang == "en" ? "Okay" : "还行", value: "okay"),
                    InquiryOption(label: lang == "en" ? "Not good" : "不太好", value: "bad")
                ],
                feedContent: nil
            )
        case "water_intake":
            return InquiryQuestion(
                id: "inquiry_water",
                questionText: lang == "en" ? "How much water did you drink today?" : "今天喝了多少水？",
                questionType: "diagnostic",
                priority: "low",
                dataGapsAddressed: ["water_intake"],
                options: [
                    InquiryOption(label: lang == "en" ? "Less than 4 cups" : "不到4杯", value: "low"),
                    InquiryOption(label: lang == "en" ? "4-8 cups" : "4-8杯", value: "moderate"),
                    InquiryOption(label: lang == "en" ? "More than 8 cups" : "8杯以上", value: "high")
                ],
                feedContent: nil
            )
        default:
            return nil
        }
    }
}
