// DashboardModels.swift
// 仪表盘数据模型 - 对齐 Web 端数据结构

import Foundation

// MARK: - 健康日志 (daily_wellness_logs 表)

struct WellnessLog: Codable, Identifiable {
    var id: String { log_date }

    let log_date: String
    let sleep_duration_minutes: Int?
    let exercise_duration_minutes: Int?
    let mindfulness_minutes: Int?
    let mood_status: String?
    let stress_level: Int?
    let sleep_quality: String?
    let morning_energy: Int?
    let overall_readiness: Int?
    let ai_recommendation: String?
    let body_tension: Int?
    let mental_clarity: Int?
    let exercise_type: String?
    let energy_level: Int?
    let anxiety_level: Int?
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case log_date
        case sleep_duration_minutes
        case exercise_duration_minutes
        case mindfulness_minutes
        case mood_status
        case stress_level
        case sleep_quality
        case morning_energy
        case overall_readiness
        case ai_recommendation
        case body_tension
        case mental_clarity
        case exercise_type
        case energy_level
        case anxiety_level
        case notes
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        log_date = (try? container.decode(String.self, forKey: .log_date)) ?? ""
        sleep_duration_minutes = try? container.decode(Int.self, forKey: .sleep_duration_minutes)
        exercise_duration_minutes = try? container.decode(Int.self, forKey: .exercise_duration_minutes)
        mindfulness_minutes = try? container.decode(Int.self, forKey: .mindfulness_minutes)
        mood_status = try? container.decode(String.self, forKey: .mood_status)
        stress_level = try? container.decode(Int.self, forKey: .stress_level)
        morning_energy = try? container.decode(Int.self, forKey: .morning_energy)
        overall_readiness = try? container.decode(Int.self, forKey: .overall_readiness)
        ai_recommendation = try? container.decode(String.self, forKey: .ai_recommendation)
        body_tension = try? container.decode(Int.self, forKey: .body_tension)
        mental_clarity = try? container.decode(Int.self, forKey: .mental_clarity)
        exercise_type = try? container.decode(String.self, forKey: .exercise_type)
        energy_level = try? container.decode(Int.self, forKey: .energy_level)
        anxiety_level = try? container.decode(Int.self, forKey: .anxiety_level)
        notes = try? container.decode(String.self, forKey: .notes)

        if let qualityString = try? container.decode(String.self, forKey: .sleep_quality) {
            sleep_quality = qualityString
        } else if let qualityInt = try? container.decode(Int.self, forKey: .sleep_quality) {
            sleep_quality = String(qualityInt)
        } else {
            sleep_quality = nil
        }
    }

    // 计算属性
    var sleepHours: Double {
        guard let minutes = sleep_duration_minutes else { return 0 }
        return Double(minutes) / 60.0
    }

    var moodEmoji: String {
        switch mood_status?.lowercased() {
        case "great", "excellent": return "😊"
        case "good": return "🙂"
        case "okay", "neutral": return "😐"
        case "bad", "poor": return "😔"
        case "terrible": return "😢"
        default: return "🙂"
        }
    }

    var readinessColor: String {
        guard let readiness = overall_readiness else { return "gray" }
        switch readiness {
        case 80...100: return "green"
        case 60..<80: return "yellow"
        case 40..<60: return "orange"
        default: return "red"
        }
    }
}

enum CodableValue: Codable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: CodableValue])
    case array([CodableValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode([String: CodableValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([CodableValue].self) {
            self = .array(value)
        } else {
            self = .null
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }

    var stringValue: String {
        switch self {
        case .string(let value): return value
        case .number(let value): return String(value)
        case .bool(let value): return value ? "true" : "false"
        case .object(let value): return String(describing: value)
        case .array(let value): return String(describing: value)
        case .null: return ""
        }
    }
}

// MARK: - 用户画像 (unified_user_profiles 表)

struct UnifiedProfile: Codable {
    let id: String?
    let full_name: String?
    let demographics: Demographics?
    let health_goals: [HealthGoal]?
    let health_concerns: [String]?
    let lifestyle_factors: LifestyleFactors?
    let recent_mood_trend: String?
    let ai_inferred_traits: [String: String]?
    let last_aggregated_at: String?

    enum CodingKeys: String, CodingKey {
        case id
        case full_name
        case demographics
        case health_goals
        case health_concerns
        case lifestyle_factors
        case recent_mood_trend
        case ai_inferred_traits
        case last_aggregated_at
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try? container.decode(String.self, forKey: .id)
        full_name = try? container.decode(String.self, forKey: .full_name)
        demographics = try? container.decode(Demographics.self, forKey: .demographics)
        health_concerns = try? container.decode([String].self, forKey: .health_concerns)
        lifestyle_factors = try? container.decode(LifestyleFactors.self, forKey: .lifestyle_factors)
        recent_mood_trend = try? container.decode(String.self, forKey: .recent_mood_trend)
        last_aggregated_at = try? container.decode(String.self, forKey: .last_aggregated_at)

        if let goals = try? container.decode([HealthGoal].self, forKey: .health_goals) {
            health_goals = goals
        } else if let goalStrings = try? container.decode([String].self, forKey: .health_goals) {
            health_goals = goalStrings.map { HealthGoal(goal_text: $0, category: nil) }
        } else {
            health_goals = nil
        }

        if let traits = try? container.decode([String: String].self, forKey: .ai_inferred_traits) {
            ai_inferred_traits = traits
        } else if let rawTraits = try? container.decode([String: CodableValue].self, forKey: .ai_inferred_traits) {
            ai_inferred_traits = rawTraits.mapValues { $0.stringValue }
        } else {
            ai_inferred_traits = nil
        }
    }

    init(
        id: String? = nil,
        full_name: String? = nil,
        demographics: Demographics?,
        health_goals: [HealthGoal]?,
        health_concerns: [String]?,
        lifestyle_factors: LifestyleFactors?,
        recent_mood_trend: String?,
        ai_inferred_traits: [String: String]?,
        last_aggregated_at: String?
    ) {
        self.id = id
        self.full_name = full_name
        self.demographics = demographics
        self.health_goals = health_goals
        self.health_concerns = health_concerns
        self.lifestyle_factors = lifestyle_factors
        self.recent_mood_trend = recent_mood_trend
        self.ai_inferred_traits = ai_inferred_traits
        self.last_aggregated_at = last_aggregated_at
    }
}

struct HealthGoal: Codable, Equatable {
    let goal_text: String
    let category: String?
}

struct Demographics: Codable {
    let age: Int?
    let gender: String?
    let bmi: Double?
}

struct LifestyleFactors: Codable {
    let exercise_frequency: String?
    let sleep_pattern: String?
    let sleep_hours: Double?
    let stress_level: String?
    let diet_preference: String?
}

// MARK: - 穿戴设备数据 (user_health_data 表)

struct HardwareDataPoint: Codable {
    let value: Double
    let source: String?
    let recorded_at: String
}

struct HardwareData: Codable {
    var hrv: HardwareDataPoint?
    var resting_heart_rate: HardwareDataPoint?
    var sleep_score: HardwareDataPoint?
    var spo2: HardwareDataPoint?
    var steps: HardwareDataPoint?
}

// MARK: - Dashboard 聚合数据

struct DashboardData {
    var profile: UnifiedProfile?
    var weeklyLogs: [WellnessLog]
    var hardwareData: HardwareData?
    
    // 计算属性：今日日志
    var todayLog: WellnessLog? {
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
        return weeklyLogs.first { $0.log_date.hasPrefix(String(today)) }
    }
    
    // 计算属性：平均睡眠
    var averageSleepHours: Double {
        let validLogs = weeklyLogs.compactMap { $0.sleep_duration_minutes }
        guard !validLogs.isEmpty else { return 0 }
        return Double(validLogs.reduce(0, +)) / Double(validLogs.count) / 60.0
    }
    
    // 计算属性：平均压力
    var averageStress: Double {
        let validLogs = weeklyLogs.compactMap { $0.stress_level }
        guard !validLogs.isEmpty else { return 0 }
        return Double(validLogs.reduce(0, +)) / Double(validLogs.count)
    }
    
}
