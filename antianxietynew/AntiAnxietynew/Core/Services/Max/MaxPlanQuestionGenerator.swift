import Foundation

@MainActor
enum MaxPlanQuestionGenerator {
    private enum QuestionType: String, CaseIterable {
        case concern
        case sleep
        case stress
        case energy
        case mood
        case lifestyle
        case exercise
        case goal
    }

    private struct QuestionTemplate {
        let zh: String
        let en: String
    }

    private static let maxQuestions = 5

    private static let priority: [QuestionType: Int] = [
        .concern: 1,
        .sleep: 2,
        .stress: 3,
        .energy: 4,
        .mood: 5,
        .lifestyle: 6,
        .exercise: 7,
        .goal: 8
    ]

    private static let templates: [QuestionType: QuestionTemplate] = [
        .concern: QuestionTemplate(
            zh: "最近有什么让你感到不舒服或困扰的地方吗？",
            en: "Is there anything bothering you lately?"
        ),
        .sleep: QuestionTemplate(
            zh: "最近睡眠情况怎么样？",
            en: "How has your sleep been lately?"
        ),
        .stress: QuestionTemplate(
            zh: "最近感觉压力大吗？",
            en: "How stressed have you been feeling lately?"
        ),
        .energy: QuestionTemplate(
            zh: "今天精力如何？",
            en: "How is your energy level today?"
        ),
        .mood: QuestionTemplate(
            zh: "现在心情怎么样？",
            en: "How are you feeling right now?"
        ),
        .lifestyle: QuestionTemplate(
            zh: "你的日常作息是怎样的？",
            en: "What is your daily routine like?"
        ),
        .exercise: QuestionTemplate(
            zh: "你平时运动多吗？",
            en: "How often do you exercise?"
        ),
        .goal: QuestionTemplate(
            zh: "这次计划你最想改善什么？",
            en: "What would you most like to improve with this plan?"
        )
    ]

    static func generateStarterQuestions(language: AppLanguage) async -> [String] {
        guard let userId = SupabaseManager.shared.currentUser?.id else {
            return fallbackQuestions(language: language)
        }

        let data = await MaxPlanEngine.aggregatePlanData(userId: userId)
        let calibration = data.calibration

        let hasHealthKitSleep = await hasLocalSleepData()

        var missing: [QuestionType] = []

        if !data.dataStatus.hasInquiryData {
            missing.append(.concern)
        }

        let needsSleep = (calibration?.sleepHours ?? 0) <= 0 && !hasHealthKitSleep
        let needsStress = (calibration?.stressLevel ?? 0) <= 0
        let needsEnergy = (calibration?.energyLevel ?? 0) <= 0
        let needsMood = (calibration?.moodScore ?? 0) <= 0

        if needsSleep { missing.append(.sleep) }
        if needsStress { missing.append(.stress) }
        if needsEnergy { missing.append(.energy) }
        if needsMood { missing.append(.mood) }

        for type in [QuestionType.lifestyle, .exercise, .goal] where !missing.contains(type) {
            missing.append(type)
        }

        let sorted = missing.sorted { (priority[$0] ?? 99) < (priority[$1] ?? 99) }
        let selected = Array(sorted.prefix(maxQuestions))

        if selected.isEmpty {
            return fallbackQuestions(language: language)
        }

        let isEn = language == .en
        return selected.compactMap { type in
            guard let template = templates[type] else { return nil }
            return isEn ? template.en : template.zh
        }
    }

    private static func fallbackQuestions(language: AppLanguage) -> [String] {
        if language == .en {
            return [
                "How is your sleep lately?",
                "What's your biggest stress trigger right now?",
                "Which part of your day needs more energy?",
                "What should we optimize first?",
                "What habit would you like to build?"
            ]
        }
        return [
            "最近睡眠情况怎么样？",
            "当前压力最大的来源是什么？",
            "你更想提升哪一段精力？",
            "先从哪一件事优化？",
            "你最想养成哪个习惯？"
        ]
    }

    private static func hasLocalSleepData() async -> Bool {
        let healthKit = HealthKitService.shared
        guard healthKit.isAvailable, healthKit.isAuthorizedForRead() else { return false }
        let now = Date()
        let start = Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now
        do {
            let sleepMinutes = try await healthKit.querySleepDuration(from: start, to: now)
            return sleepMinutes > 0
        } catch {
            return false
        }
    }
}
