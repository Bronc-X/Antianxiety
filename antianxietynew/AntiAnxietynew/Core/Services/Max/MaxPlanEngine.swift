import Foundation

struct PlanItemDraft: Codable, Equatable {
    let id: String
    let title: String
    let action: String
    let rationale: String
    let difficulty: String
    let category: String
}

struct AggregatedPlanData {
    let userId: String
    let inquiry: InquiryData?
    let calibration: CalibrationSnapshot?
    let hrv: HrvSnapshot?
    let profile: PlanUserProfile?
    let dataStatus: PlanDataStatus
}

struct InquiryData {
    let id: String
    let userId: String
    let topic: String
    let responses: [String: String]
    let extractedIndicators: [String: AnyCodable]
    let createdAt: String
}

struct CalibrationSnapshot {
    let date: String
    let sleepHours: Double
    let sleepQuality: Int
    let moodScore: Int
    let stressLevel: Int
    let energyLevel: Int
}

struct HrvSnapshot {
    let date: String
    let avgHrv: Double
    let minHrv: Double
    let maxHrv: Double
    let restingHr: Double
    let hrvTrend: String
    let source: String
}

struct PlanUserProfile {
    let gender: String?
    let age: Int?
    let primaryConcern: String?
    let healthGoals: [String]
    let healthConcerns: [String]
    let lifestyleFactors: [String: AnyCodable]
    let recentMoodTrend: String?
}

struct PlanDataStatus {
    let hasInquiryData: Bool
    let hasCalibrationData: Bool
    let hasHrvData: Bool
    let inquirySummary: String?
    let calibrationSummary: String?
    let hrvSummary: String?
    let lastInquiryDate: String?
    let lastCalibrationDate: String?
}

enum MaxPlanEngine {
    static func aggregatePlanData(userId: String) async -> AggregatedPlanData {
        let inquiry = await fetchInquiry(userId: userId)
        let calibration = await fetchCalibration(userId: userId)
        let hrv = await fetchHrv(userId: userId)
        let profile = await fetchProfile(userId: userId)
        let status = calculateStatus(inquiry: inquiry, calibration: calibration, hrv: hrv)

        return AggregatedPlanData(
            userId: userId,
            inquiry: inquiry,
            calibration: calibration,
            hrv: hrv,
            profile: profile,
            dataStatus: status
        )
    }

    static func generatePlan(
        data: AggregatedPlanData,
        userResponses: [String: String],
        language: String,
        model: AIModel = .deepseekV3Exp
    ) async -> [PlanItemDraft] {
        let systemPrompt = language == "en" ? planSystemPromptEn : planSystemPromptZh
        let summary = buildUserDataSummary(data: data, responses: userResponses, language: language)
        let userPrompt = language == "en"
            ? "User summary:\n\(summary)\n\nGenerate plan items in JSON array only."
            : "用户摘要：\n\(summary)\n\n请输出 JSON 数组，仅包含计划项。"

        do {
            let response = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: userPrompt)],
                systemPrompt: systemPrompt,
                model: model,
                temperature: 0.7
            )
            if let parsed = parsePlanItems(from: response) {
                return normalizePlanItems(parsed)
            }
        } catch {
            print("[MaxPlan] AI generation failed: \(error)")
        }

        return generateFallbackPlan(language: language)
    }

    private static var planSystemPromptZh: String {
        """
你是 Max，一位温暖、专业的健康顾问。你的任务是根据用户的健康数据生成个性化的训练计划。

核心原则：
1. 语气温暖、鼓励，像朋友交流
2. 避免医疗化语言
3. 建议可执行、循序渐进
4. 每条建议有科学依据
5. 根据用户状态调整难度
6. 针对具体问题给出建议

输出 JSON 数组，每项包含：
title, action, rationale, difficulty (easy/medium/hard), category (sleep/stress/fitness/nutrition/mental/habits)
"""
    }

    private static var planSystemPromptEn: String {
        """
You are Max, a warm and professional health consultant. Generate a personalized plan.
Output a JSON array with fields: title, action, rationale, difficulty (easy/medium/hard), category (sleep/stress/fitness/nutrition/mental/habits).
"""
    }

    private static func parsePlanItems(from response: String) -> [PlanItemDraft]? {
        let trimmed = response
            .replacingOccurrences(of: "```json", with: "")
            .replacingOccurrences(of: "```", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard let data = trimmed.data(using: .utf8) else { return nil }
        if let items = try? JSONDecoder().decode([PlanItemDraft].self, from: data) {
            return items
        }
        if let payload = try? JSONDecoder().decode([String: [PlanItemDraft]].self, from: data),
           let items = payload["items"] ?? payload["data"] {
            return items
        }
        return nil
    }

    private static func normalizePlanItems(_ items: [PlanItemDraft]) -> [PlanItemDraft] {
        let trimmed = items.filter { !$0.title.isEmpty && !$0.action.isEmpty }
        if trimmed.count >= 4 { return Array(trimmed.prefix(6)) }
        var result = trimmed
        while result.count < 4 {
            result.append(contentsOf: generateFallbackPlan(language: "zh").prefix(1))
        }
        return Array(result.prefix(6))
    }

    private static func generateFallbackPlan(language: String) -> [PlanItemDraft] {
        let isEn = language == "en"
        let id = UUID().uuidString
        return [
            PlanItemDraft(
                id: "\(id)_sleep",
                title: isEn ? "Sleep Routine" : "睡眠节律",
                action: isEn ? "Turn off screens 1 hour before bed and keep a consistent wake time." : "睡前1小时关闭电子设备，固定起床时间。",
                rationale: isEn ? "Reduces blue light and stabilizes circadian rhythm." : "减少蓝光干扰，稳定生物钟。",
                difficulty: "medium",
                category: "sleep"
            ),
            PlanItemDraft(
                id: "\(id)_stress",
                title: isEn ? "Breathing Reset" : "呼吸减压",
                action: isEn ? "Practice box breathing 5 minutes twice daily." : "每天2次箱式呼吸，每次5分钟。",
                rationale: isEn ? "Activates vagus nerve, lowers cortisol." : "激活迷走神经，降低皮质醇。",
                difficulty: "easy",
                category: "stress"
            ),
            PlanItemDraft(
                id: "\(id)_energy",
                title: isEn ? "Light Walk" : "轻度步行",
                action: isEn ? "20-minute daylight walk each afternoon." : "每天午后20分钟户外散步。",
                rationale: isEn ? "Boosts mitochondrial activity and mood." : "提升线粒体功能与情绪。",
                difficulty: "easy",
                category: "fitness"
            ),
            PlanItemDraft(
                id: "\(id)_mindset",
                title: isEn ? "Gratitude Note" : "感恩记录",
                action: isEn ? "Write 3 things you're grateful for before bed." : "睡前写下3件感恩的事。",
                rationale: isEn ? "Improves positive mood patterns." : "建立积极情绪循环。",
                difficulty: "easy",
                category: "mental"
            )
        ]
    }

    private static func buildUserDataSummary(
        data: AggregatedPlanData,
        responses: [String: String],
        language: String
    ) -> String {
        var parts: [String] = []
        if let profile = data.profile {
            if let age = profile.age { parts.append(language == "en" ? "Age: \(age)" : "年龄: \(age)岁") }
            if let concern = profile.primaryConcern, !concern.isEmpty {
                parts.append(language == "en" ? "Primary concern: \(concern)" : "主要关注: \(concern)")
            }
            if !profile.healthGoals.isEmpty {
                let goals = profile.healthGoals.joined(separator: ", ")
                parts.append(language == "en" ? "Health goals: \(goals)" : "健康目标: \(goals)")
            }
        }
        if let inquiry = data.inquiry {
            parts.append(language == "en" ? "Inquiry topic: \(inquiry.topic)" : "近期问询主题: \(inquiry.topic)")
        }
        if let calibration = data.calibration {
            parts.append(language == "en"
                ? "SleepHours: \(calibration.sleepHours), Stress: \(calibration.stressLevel), Mood: \(calibration.moodScore)"
                : "睡眠: \(calibration.sleepHours)h，压力: \(calibration.stressLevel)，情绪: \(calibration.moodScore)")
        }
        if let hrv = data.hrv {
            parts.append(language == "en" ? "HRV: \(hrv.avgHrv)" : "HRV: \(hrv.avgHrv)")
        }
        if !responses.isEmpty {
            parts.append(language == "en" ? "User responses: \(responses)" : "用户回答: \(responses)")
        }
        return parts.joined(separator: "\n")
    }

    private static func fetchInquiry(userId: String) async -> InquiryData? {
        let endpoint = "active_inquiries?user_id=eq.\(userId)&select=*&order=created_at.desc&limit=1"
        if let records: [[String: AnyCodable]] = try? await SupabaseManager.shared.request(endpoint),
           let first = records.first {
            return InquiryData(
                id: first["id"]?.value as? String ?? UUID().uuidString,
                userId: userId,
                topic: first["topic"]?.value as? String ?? "general",
                responses: first["responses"]?.value as? [String: String] ?? [:],
                extractedIndicators: first["extracted_indicators"]?.value as? [String: AnyCodable] ?? [:],
                createdAt: first["created_at"]?.value as? String ?? ""
            )
        }

        let responseEndpoint = "inquiry_responses?user_id=eq.\(userId)&select=*&order=created_at.desc&limit=5"
        if let responses: [[String: AnyCodable]] = try? await SupabaseManager.shared.request(responseEndpoint),
           let first = responses.first {
            var aggregated: [String: String] = [:]
            var indicators: [String: AnyCodable] = [:]
            for resp in responses {
                if let qid = resp["question_id"]?.value as? String,
                   let value = resp["response_value"]?.value as? String {
                    aggregated[qid] = value
                }
                if let extracted = resp["extracted_data"]?.value as? [String: Any] {
                    extracted.forEach { indicators[$0.key] = AnyCodable($0.value) }
                }
            }
            return InquiryData(
                id: first["id"]?.value as? String ?? UUID().uuidString,
                userId: userId,
                topic: "aggregated",
                responses: aggregated,
                extractedIndicators: indicators,
                createdAt: first["created_at"]?.value as? String ?? ""
            )
        }

        return nil
    }

    private static func fetchCalibration(userId: String) async -> CalibrationSnapshot? {
        let date = ISO8601DateFormatter().string(from: Date().addingTimeInterval(-7 * 24 * 3600))
        let endpoint = "daily_wellness_logs?user_id=eq.\(userId)&select=*&gte=created_at.\(date)&order=created_at.desc&limit=1"
        if let rows: [[String: AnyCodable]] = try? await SupabaseManager.shared.request(endpoint),
           let row = rows.first {
            let sleepHours = row["sleep_hours"]?.value as? Double ?? 0
            let sleepQuality = row["sleep_quality"]?.value as? Int ?? 0
            let mood = row["mood_score"]?.value as? Int ?? 0
            let stress = row["stress_level"]?.value as? Int ?? 0
            let energy = row["energy_level"]?.value as? Int ?? 0
            return CalibrationSnapshot(
                date: row["created_at"]?.value as? String ?? "",
                sleepHours: sleepHours,
                sleepQuality: sleepQuality,
                moodScore: mood,
                stressLevel: stress,
                energyLevel: energy
            )
        }
        return nil
    }

    private static func fetchHrv(userId: String) async -> HrvSnapshot? {
        let endpoint = "user_health_data?user_id=eq.\(userId)&select=*&order=recorded_at.desc&limit=5"
        if let rows: [[String: AnyCodable]] = try? await SupabaseManager.shared.request(endpoint),
           let row = rows.first {
            let hrvVal = row["hrv"]?.value as? Double ?? row["heart_rate_variability"]?.value as? Double ?? 0
            let resting = row["resting_heart_rate"]?.value as? Double ?? row["heart_rate"]?.value as? Double ?? 0
            let baseline = row["baseline_hrv"]?.value as? Double
            let trend = calculateHrvTrend(current: hrvVal, baseline: baseline)
            return HrvSnapshot(
                date: row["recorded_at"]?.value as? String ?? "",
                avgHrv: hrvVal,
                minHrv: row["min_hrv"]?.value as? Double ?? hrvVal * 0.8,
                maxHrv: row["max_hrv"]?.value as? Double ?? hrvVal * 1.2,
                restingHr: resting,
                hrvTrend: trend,
                source: row["source"]?.value as? String ?? "wearable"
            )
        }
        return nil
    }

    private static func fetchProfile(userId: String) async -> PlanUserProfile? {
        let unifiedEndpoint = "unified_user_profiles?user_id=eq.\(userId)&select=*&limit=1"
        if let rows: [UnifiedProfile] = try? await SupabaseManager.shared.request(unifiedEndpoint),
           let profile = rows.first {
            let goals = profile.health_goals?.map { $0.goal_text } ?? []
            let concerns = profile.health_concerns ?? []
            var lifestyle: [String: AnyCodable] = [:]
            if let factors = profile.lifestyle_factors {
                if let exercise = factors.exercise_frequency { lifestyle["exercise_frequency"] = AnyCodable(exercise) }
                if let sleepPattern = factors.sleep_pattern { lifestyle["sleep_pattern"] = AnyCodable(sleepPattern) }
                if let sleepHours = factors.sleep_hours { lifestyle["sleep_hours"] = AnyCodable(sleepHours) }
                if let stress = factors.stress_level { lifestyle["stress_level"] = AnyCodable(stress) }
                if let diet = factors.diet_preference { lifestyle["diet_preference"] = AnyCodable(diet) }
            }
            return PlanUserProfile(
                gender: profile.demographics?.gender,
                age: profile.demographics?.age,
                primaryConcern: concerns.first,
                healthGoals: goals,
                healthConcerns: concerns,
                lifestyleFactors: lifestyle,
                recentMoodTrend: profile.recent_mood_trend
            )
        }

        let profileEndpoint = "profiles?id=eq.\(userId)&select=gender,age,primary_goal,primary_focus_topics"
        if let rows: [[String: AnyCodable]] = try? await SupabaseManager.shared.request(profileEndpoint),
           let row = rows.first {
            return PlanUserProfile(
                gender: row["gender"]?.value as? String,
                age: row["age"]?.value as? Int,
                primaryConcern: row["primary_goal"]?.value as? String,
                healthGoals: (row["primary_focus_topics"]?.value as? [String]) ?? [],
                healthConcerns: [],
                lifestyleFactors: [:],
                recentMoodTrend: nil
            )
        }
        return nil
    }

    private static func calculateStatus(inquiry: InquiryData?, calibration: CalibrationSnapshot?, hrv: HrvSnapshot?) -> PlanDataStatus {
        let now = Date()
        let threshold: TimeInterval = 7 * 24 * 3600
        let hasInquiry = inquiry != nil && (now.timeIntervalSince(parseDate(inquiry?.createdAt)) < threshold)
        let hasCalibration = calibration != nil && (now.timeIntervalSince(parseDate(calibration?.date)) < threshold)
        let hasHrv = hrv != nil && (hrv?.avgHrv ?? 0) > 0
        return PlanDataStatus(
            hasInquiryData: hasInquiry,
            hasCalibrationData: hasCalibration,
            hasHrvData: hasHrv,
            inquirySummary: inquiry.map { "最近问询: \($0.topic)" },
            calibrationSummary: calibration.map { "睡眠\($0.sleepHours)h 压力\($0.stressLevel)" },
            hrvSummary: hrv.map { "HRV \($0.avgHrv)" },
            lastInquiryDate: inquiry?.createdAt,
            lastCalibrationDate: calibration?.date
        )
    }

    private static func calculateHrvTrend(current: Double, baseline: Double?) -> String {
        guard let baseline, baseline > 0 else { return "stable" }
        let change = ((current - baseline) / baseline) * 100
        if change > 10 { return "improving" }
        if change < -10 { return "declining" }
        return "stable"
    }

    private static func parseDate(_ dateString: String?) -> Date {
        guard let dateString else { return Date.distantPast }
        return ISO8601DateFormatter().date(from: dateString) ?? Date.distantPast
    }
}
