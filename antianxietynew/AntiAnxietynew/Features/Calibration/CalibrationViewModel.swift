// CalibrationViewModel.swift
// 校准视图模型 - 对齐 Web 端 useCalibration Hook
//
// 功能对照:
// - Web: hooks/domain/useCalibration.ts + lib/assessment
// - iOS: 本文件
//
// 数据源: Supabase daily_wellness_logs + user_scale_responses + user_assessment_preferences

import SwiftUI

// MARK: - Calibration Question Models

enum CalibrationQuestionType: String, Equatable {
  case single
  case slider
}

enum CalibrationQuestionCategory: String, Equatable {
  case anxiety
  case sleep
  case stress
  case energy
  case mood
  case lifestyle
  case exercise
  case goal
  case evolution
  case ai_pick
}

struct CalibrationOption: Identifiable, Equatable {
  let value: Int
  let label: String

  var id: Int { value }
}

struct CalibrationQuestion: Identifiable, Equatable {
  let id: String
  let text: String
  let type: CalibrationQuestionType
  let category: CalibrationQuestionCategory
  let options: [CalibrationOption]?
  let min: Int?
  let max: Int?
  let isSafetyQuestion: Bool
}

// MARK: - Calibration Result

struct StabilityResult: Equatable {
  let isStable: Bool
  let completionRate: Double
  let averageScore: Double
  let maxSingleDay: Int
  let slope: Double
  let hasRedFlag: Bool
  let redFlagReasons: [String]
  let canReduceFrequency: Bool
  let consecutiveStableDays: Int
  let recommendation: String
}

struct DailyCalibrationResult: Equatable {
  let dailyIndex: Int
  let gad2Score: Int
  let sleepDurationScore: Int
  let sleepQualityScore: Int
  let stressScore: Int
  let triggerFullScale: String?
  let safetyTriggered: Bool
  let stability: StabilityResult?
  let savedToCloud: Bool
}

private struct CalibrationFrequency {
  let dailyFrequency: String
  let weeklyFrequency: String
  let nextDailyDate: Date
  let frequencyReason: String?
}

private struct UserScaleResponseRow: Codable {
  let question_id: String?
  let answer_value: Int?
  let response_date: String?
  let created_at: String?
}

private struct UserAssessmentPreferences: Codable {
  let daily_frequency: String?
  let weekly_frequency: String?
  let daily_frequency_reason: String?
}

private struct ProfileCalibrationState: Codable {
  let last_daily_calibration: String?
  let daily_stability_streak: Int?
}

private struct DailyWellnessLogDTO: Codable {
  let user_id: String
  let log_date: String
  let sleep_duration_minutes: Int?
  let sleep_quality: String?
  let stress_level: Int?
  let updated_at: String
}

private struct DailyResponse {
  let date: String
  var gad2Score: Int
  var sleepDuration: Double
  var sleepQuality: Int
  var stressLevel: Int
  var dailyIndex: Int
}

// MARK: - ViewModel

@MainActor
class CalibrationViewModel: ObservableObject {

  // MARK: - State (对齐 useCalibration)

  enum Step: Equatable {
    case welcome
    case questions
    case analyzing
    case result
  }

  @Published var step: Step = .welcome
  @Published var questions: [CalibrationQuestion] = []
  @Published var currentQuestionIndex: Int = 0
  @Published var answers: [String: Int] = [:]
  @Published var result: DailyCalibrationResult?
  @Published var isLoading = false

  @Published var frequency: String = "daily"
  @Published var frequencyReason: String?
  @Published var shouldShowToday = true
  @Published var hasCompletedToday = false
  @Published var isRestoringFrequency = false

  private var isSubmitting = false

  // MARK: - Computed Properties

  var progressPercent: Double {
    guard !questions.isEmpty else { return 0 }
    return Double(currentQuestionIndex + 1) / Double(questions.count) * 100
  }

  var currentQuestion: CalibrationQuestion? {
    guard currentQuestionIndex < questions.count else { return nil }
    return questions[currentQuestionIndex]
  }

  // MARK: - Dependencies

  private let supabase = SupabaseManager.shared

  // MARK: - Start Calibration

  func start() async {
    // Show base questions immediately to avoid "no response" feeling on slow networks.
    isLoading = true
    let baseQuestions = getDailyCalibrationQuestions()
    questions = baseQuestions
    currentQuestionIndex = 0
    answers = [:]
    result = nil
    step = .questions

    let mergedQuestions = await mergeAdaptiveQuestions(into: baseQuestions)
    questions = mergedQuestions
    isLoading = false
    // Live Activity 暂时禁用
    // await LiveActivityManager.shared.startCalibrationSession()
  }

  // MARK: - Answer Question

  func answerQuestion(questionId: String, value: Int) {
    answers[questionId] = value

    let isLastQuestion = currentQuestionIndex >= questions.count - 1
    if !isLastQuestion {
      currentQuestionIndex += 1
      Task {
        await updateCalibrationActivityProgress()
      }
      return
    }

    Task {
      await updateCalibrationActivityProgress()
    }

    guard !isSubmitting else { return }
    isSubmitting = true

    Task {
      await submitAssessment()
      isSubmitting = false
    }
  }

  // MARK: - Submit Assessment

  private func submitAssessment() async {
    step = .analyzing
    isLoading = true
    defer { isLoading = false }

    let dailyResult = await processDailyCalibration(answers)
    result = dailyResult

    if dailyResult.savedToCloud {
      markCompletedToday()
    }

    step = .result
    // Live Activity 暂时禁用
    // await LiveActivityManager.shared.endCurrentActivity()
  }

  // MARK: - Check Frequency

  func checkFrequency() async {
    guard let user = supabase.currentUser else { return }

    let todayKey = storageKey(for: user.id)
    if UserDefaults.standard.bool(forKey: todayKey) {
      hasCompletedToday = true
    }

    do {
      let frequencyInfo = try await getUserCalibrationFrequency(userId: user.id)
      frequency = frequencyInfo.dailyFrequency
      frequencyReason = frequencyInfo.frequencyReason

      let shouldShow = await shouldCalibrateToday(userId: user.id)
      shouldShowToday = hasCompletedToday ? false : shouldShow
    } catch {
      frequency = "daily"
      shouldShowToday = !hasCompletedToday
    }
  }

  func resetFrequency() async {
    guard let user = supabase.currentUser else { return }

    isRestoringFrequency = true
    defer { isRestoringFrequency = false }

    await resetToDailyFrequency(userId: user.id)
    frequency = "daily"
    frequencyReason = "user_choice"
    shouldShowToday = true
  }

  func reset() {
    step = .welcome
    currentQuestionIndex = 0
    answers = [:]
    result = nil
    // Live Activity 暂时禁用
    // Task {
    //   await LiveActivityManager.shared.endCurrentActivity()
    // }
  }

  private func updateCalibrationActivityProgress() async {
    let total = max(questions.count, 1)
    let current = min(currentQuestionIndex + 1, total)
    let progress = Double(current) / Double(total)
    let remaining = max(total - current, 0)
    _ = (progress, remaining) // Live Activity 暂时禁用，保留计算以便后续启用
    // Live Activity 暂时禁用
    // await LiveActivityManager.shared.updateActivity(
    //   hrv: 0,
    //   anxietyScore: result?.dailyIndex ?? 70,
    //   minutesRemaining: max(1, remaining),
    //   progressPercent: progress
    // )
  }

  // MARK: - Local Helpers

  private func storageKey(for userId: String) -> String {
    let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
    return "calibration_\(userId)_\(today)"
  }

  private func markCompletedToday() {
    guard let user = supabase.currentUser else { return }
    UserDefaults.standard.set(true, forKey: storageKey(for: user.id))
    hasCompletedToday = true
    shouldShowToday = false
    NotificationCenter.default.post(name: .calibrationCompleted, object: nil)
  }

  // MARK: - Daily Calibration Logic

  private func processDailyCalibration(_ responses: [String: Int]) async -> DailyCalibrationResult {
    guard let user = supabase.currentUser else {
      return DailyCalibrationResult(
        dailyIndex: 0,
        gad2Score: 0,
        sleepDurationScore: 0,
        sleepQualityScore: 0,
        stressScore: 0,
        triggerFullScale: nil,
        safetyTriggered: false,
        stability: nil,
        savedToCloud: false
      )
    }

    let gad2Score = (responses["gad7_q1"] ?? 0) + (responses["gad7_q2"] ?? 0)
    let sleepDurationScore = getSleepDurationScore(responses["daily_sleep_duration"] ?? 0)
    let sleepQualityScore = responses["daily_sleep_quality"] ?? 0
    let stressScore = responses["daily_stress_level"] ?? 0
    let dailyIndex = gad2Score + sleepDurationScore + sleepQualityScore + stressScore

    let triggerFullScale = gad2Score >= 3 ? "GAD7" : nil
    let safetyTriggered = responses.contains { checkSafetyTrigger(questionId: $0.key, value: $0.value) }

    var saved = await saveDailyCalibrationResponses(userId: user.id, responses: responses)
    if triggerFullScale != nil {
      await logScaleTrigger(userId: user.id, shortScale: "GAD2", shortScore: gad2Score, fullScale: "GAD7")
    }
    if safetyTriggered {
      await logSafetyEvent(userId: user.id, triggerSource: "daily_calibration", triggerValue: 1)
    }
    let stability = await fetchStabilityAndUpdate(userId: user.id)

    if await saveDailyWellnessLog(userId: user.id, responses: responses) == false {
      saved = false
    }

    // Trigger digital twin analysis (non-blocking)
    Task {
      _ = await supabase.triggerDigitalTwinAnalysis(forceRefresh: false)
    }

    return DailyCalibrationResult(
      dailyIndex: dailyIndex,
      gad2Score: gad2Score,
      sleepDurationScore: sleepDurationScore,
      sleepQualityScore: sleepQualityScore,
      stressScore: stressScore,
      triggerFullScale: triggerFullScale,
      safetyTriggered: safetyTriggered,
      stability: stability,
      savedToCloud: saved
    )
  }

  private func saveDailyCalibrationResponses(userId: String, responses: [String: Int]) async -> Bool {
    let now = Date()
    let responseDate = ISO8601DateFormatter().string(from: now).prefix(10)

    struct ResponsePayload: Codable {
      let user_id: String
      let scale_id: String
      let question_id: String
      let answer_value: Int
      let source: String
      let response_date: String
      let created_at: String
    }

    let payload = responses.map { key, value in
      ResponsePayload(
        user_id: userId,
        scale_id: "DAILY",
        question_id: key,
        answer_value: value,
        source: "daily",
        response_date: String(responseDate),
        created_at: ISO8601DateFormatter().string(from: now)
      )
    }

    do {
      try await supabase.requestVoid(
        "user_scale_responses?on_conflict=user_id,scale_id,question_id,response_date",
        method: "POST",
        body: payload,
        prefer: "resolution=merge-duplicates,return=representation"
      )
      return true
    } catch {
      print("[Calibration] Save responses error: \(error)")
      return false
    }
  }

  private func saveDailyWellnessLog(userId: String, responses: [String: Int]) async -> Bool {
    let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
    let sleepHours = getSleepHoursFromValue(responses["daily_sleep_duration"] ?? 0)
    let sleepQuality = mapSleepQuality(responses["daily_sleep_quality"])
    let stressLevel = mapStressLevel(responses["daily_stress_level"])

    let dto = DailyWellnessLogDTO(
      user_id: userId,
      log_date: String(today),
      sleep_duration_minutes: Int(sleepHours * 60),
      sleep_quality: sleepQuality,
      stress_level: stressLevel,
      updated_at: ISO8601DateFormatter().string(from: Date())
    )

    do {
      try await supabase.requestVoid(
        "daily_wellness_logs?on_conflict=user_id,log_date",
        method: "POST",
        body: dto,
        prefer: "resolution=merge-duplicates,return=representation"
      )
      return true
    } catch {
      print("[Calibration] Save log error: \(error)")
      return false
    }
  }

  private func fetchStabilityAndUpdate(userId: String) async -> StabilityResult? {
    do {
      let stabilityData = try await fetchUserStabilityData(userId: userId)
      let stability = calculateDailyStability(
        responses: stabilityData.dailyResponses,
        previousConsecutiveStableDays: stabilityData.consecutiveStableDays
      )
      await updateUserFrequency(userId: userId, stability: stability)
      await updateProfileCalibration(userId: userId, stability: stability)
      return stability
    } catch {
      print("[Calibration] Stability error: \(error)")
      return nil
    }
  }

  private func updateProfileCalibration(userId: String, stability: StabilityResult) async {
    struct ProfileUpdate: Codable {
      let last_daily_calibration: String
      let daily_stability_streak: Int
    }

    let dto = ProfileUpdate(
      last_daily_calibration: ISO8601DateFormatter().string(from: Date()),
      daily_stability_streak: stability.consecutiveStableDays
    )

    do {
      try await supabase.requestVoid("profiles?id=eq.\(userId)", method: "PATCH", body: dto)
    } catch {
      print("[Calibration] Profile update error: \(error)")
    }
  }

  // MARK: - Frequency Logic

  private func getUserCalibrationFrequency(userId: String) async throws -> CalibrationFrequency {
    let prefsEndpoint = "user_assessment_preferences?user_id=eq.\(userId)&select=daily_frequency,weekly_frequency,daily_frequency_reason&limit=1"
    let prefs: [UserAssessmentPreferences] = (try? await supabase.request(prefsEndpoint)) ?? []

    let profileEndpoint = "profiles?id=eq.\(userId)&select=last_daily_calibration,daily_stability_streak&limit=1"
    let profiles: [ProfileCalibrationState] = (try? await supabase.request(profileEndpoint)) ?? []

    let dailyFrequency = prefs.first?.daily_frequency ?? "daily"
    let weeklyFrequency = prefs.first?.weekly_frequency ?? "weekly"
    let frequencyReason = prefs.first?.daily_frequency_reason

    let lastDailyString = profiles.first?.last_daily_calibration
    let lastDailyDate = lastDailyString.flatMap { ISO8601DateFormatter().date(from: $0) } ?? Date(timeIntervalSince1970: 0)

    var nextDailyDate = lastDailyDate
    if dailyFrequency == "every_other_day" {
      nextDailyDate = Calendar.current.date(byAdding: .day, value: 2, to: nextDailyDate) ?? nextDailyDate
    } else {
      nextDailyDate = Calendar.current.date(byAdding: .day, value: 1, to: nextDailyDate) ?? nextDailyDate
    }

    return CalibrationFrequency(
      dailyFrequency: dailyFrequency,
      weeklyFrequency: weeklyFrequency,
      nextDailyDate: nextDailyDate,
      frequencyReason: frequencyReason
    )
  }

  private func shouldCalibrateToday(userId: String) async -> Bool {
    if let frequencyInfo = try? await getUserCalibrationFrequency(userId: userId) {
      let today = Calendar.current.startOfDay(for: Date())
      let nextDate = Calendar.current.startOfDay(for: frequencyInfo.nextDailyDate)
      return today >= nextDate
    }
    return true
  }

  private func resetToDailyFrequency(userId: String) async {
    struct PreferencesUpdate: Codable {
      let user_id: String
      let daily_frequency: String
      let daily_frequency_reason: String
      let last_frequency_change: String
    }

    let dto = PreferencesUpdate(
      user_id: userId,
      daily_frequency: "daily",
      daily_frequency_reason: "user_choice",
      last_frequency_change: ISO8601DateFormatter().string(from: Date())
    )

    do {
      try await supabase.requestVoid(
        "user_assessment_preferences?on_conflict=user_id",
        method: "POST",
        body: dto,
        prefer: "resolution=merge-duplicates,return=representation"
      )

      struct ProfileReset: Codable { let daily_stability_streak: Int }
      try await supabase.requestVoid(
        "profiles?id=eq.\(userId)",
        method: "PATCH",
        body: ProfileReset(daily_stability_streak: 0)
      )
    } catch {
      print("[Calibration] Reset frequency error: \(error)")
    }
  }

  // MARK: - Stability Calculation

  private func fetchUserStabilityData(userId: String) async throws -> (dailyResponses: [DailyResponse], consecutiveStableDays: Int) {
    let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
    let dateString = ISO8601DateFormatter().string(from: sevenDaysAgo)

    let endpoint = "user_scale_responses?user_id=eq.\(userId)&source=eq.daily&created_at=gte.\(dateString)&select=question_id,answer_value,response_date,created_at"
    let responses: [UserScaleResponseRow] = (try? await supabase.request(endpoint)) ?? []

    let profileEndpoint = "profiles?id=eq.\(userId)&select=daily_stability_streak&limit=1"
    let profiles: [ProfileCalibrationState] = (try? await supabase.request(profileEndpoint)) ?? []
    let previousStreak = profiles.first?.daily_stability_streak ?? 0

    var dailyMap: [String: DailyResponse] = [:]

    for response in responses {
      let date = response.response_date ?? response.created_at?.prefix(10).description ?? ""
      if date.isEmpty { continue }

      if dailyMap[date] == nil {
        dailyMap[date] = DailyResponse(
          date: date,
          gad2Score: 0,
          sleepDuration: 7,
          sleepQuality: 0,
          stressLevel: 0,
          dailyIndex: 0
        )
      }

      guard var day = dailyMap[date] else { continue }
      let value = response.answer_value ?? 0

      switch response.question_id {
      case "gad7_q1", "gad7_q2":
        day.gad2Score += value
      case "daily_sleep_duration":
        day.sleepDuration = getSleepHoursFromValue(value)
      case "daily_sleep_quality":
        day.sleepQuality = value
      case "daily_stress_level":
        day.stressLevel = value
      default:
        break
      }

      dailyMap[date] = day
    }

    let dailyResponses = dailyMap.values.map { response in
      DailyResponse(
        date: response.date,
        gad2Score: response.gad2Score,
        sleepDuration: response.sleepDuration,
        sleepQuality: response.sleepQuality,
        stressLevel: response.stressLevel,
        dailyIndex: calculateDailyIndexFromResponses(
          gad2Score: response.gad2Score,
          stressLevel: response.stressLevel,
          sleepQuality: response.sleepQuality,
          sleepDuration: response.sleepDuration
        )
      )
    }

    return (dailyResponses: dailyResponses, consecutiveStableDays: previousStreak)
  }

  private func calculateDailyIndexFromResponses(
    gad2Score: Int,
    stressLevel: Int,
    sleepQuality: Int,
    sleepDuration: Double
  ) -> Int {
    var sleepDurationScore = 0
    if sleepDuration < 5 { sleepDurationScore = 2 }
    else if sleepDuration < 6 { sleepDurationScore = 2 }
    else if sleepDuration < 7 { sleepDurationScore = 1 }
    else if sleepDuration <= 9 { sleepDurationScore = 0 }
    else { sleepDurationScore = 1 }

    return gad2Score + stressLevel + sleepQuality + sleepDurationScore
  }

  private func calculateSlope(values: [Double]) -> Double {
    guard values.count >= 2 else { return 0 }

    let n = Double(values.count)
    let sumX = (n - 1) * n / 2
    let sumY = values.reduce(0, +)
    let sumXY = values.enumerated().reduce(0) { $0 + Double($1.offset) * $1.element }
    let sumX2 = (n - 1) * n * (2 * n - 1) / 6

    let numerator = n * sumXY - sumX * sumY
    let denominator = n * sumX2 - sumX * sumX
    return denominator == 0 ? 0 : numerator / denominator
  }

  private func checkRedFlags(responses: [DailyResponse]) -> (hasRedFlag: Bool, reasons: [String]) {
    var reasons: [String] = []

    let highGad2Days = responses.filter { $0.gad2Score >= 3 }.count
    if highGad2Days > 0 {
      reasons.append("GAD-2 ≥ 3")
    }

    var consecutiveLowSleep = 0
    for response in responses.sorted(by: { $0.date < $1.date }) {
      if response.sleepDuration < 5 {
        consecutiveLowSleep += 1
        if consecutiveLowSleep >= 2 {
          reasons.append("Sleep < 5h")
          break
        }
      } else {
        consecutiveLowSleep = 0
      }
    }

    let highStressDays = responses.filter { $0.stressLevel == 2 }.count
    if highStressDays >= 3 {
      reasons.append("High stress")
    }

    return (!reasons.isEmpty, reasons)
  }

  private func calculateDailyStability(
    responses: [DailyResponse],
    previousConsecutiveStableDays: Int
  ) -> StabilityResult {
    let completionRate = min(Double(responses.count) / 7.0, 1.0)
    let scores = responses.map { Double($0.dailyIndex) }
    let averageScore = scores.isEmpty ? 0 : scores.reduce(0, +) / Double(scores.count)
    let maxSingleDay = Int(scores.max() ?? 0)
    let slope = calculateSlope(values: scores)

    let redFlagResult = checkRedFlags(responses: responses)

    let isStableCriteria = completionRate >= 0.71 &&
      averageScore <= 3 &&
      maxSingleDay <= 5 &&
      abs(slope) <= 0.3 &&
      !redFlagResult.hasRedFlag

    let consecutiveStableDays = isStableCriteria ? previousConsecutiveStableDays + 1 : 0
    let canReduceFrequency = consecutiveStableDays >= 3

    let recommendation: String
    if redFlagResult.hasRedFlag {
      recommendation = "increase_to_daily"
    } else if canReduceFrequency {
      recommendation = "every_other_day"
    } else {
      recommendation = "daily"
    }

    return StabilityResult(
      isStable: isStableCriteria,
      completionRate: completionRate,
      averageScore: averageScore,
      maxSingleDay: maxSingleDay,
      slope: slope,
      hasRedFlag: redFlagResult.hasRedFlag,
      redFlagReasons: redFlagResult.reasons,
      canReduceFrequency: canReduceFrequency,
      consecutiveStableDays: consecutiveStableDays,
      recommendation: recommendation
    )
  }

  private func updateUserFrequency(userId: String, stability: StabilityResult) async {
    struct PreferencesUpdate: Codable {
      let user_id: String
      let daily_frequency: String
      let daily_frequency_reason: String
      let last_frequency_change: String
    }

    if stability.canReduceFrequency || stability.hasRedFlag {
      let dailyFrequency = stability.recommendation == "increase_to_daily" ? "daily" : stability.recommendation
      let reason = stability.hasRedFlag
        ? "red_flag: \(stability.redFlagReasons.joined(separator: ", "))"
        : "stable_7d"

      let dto = PreferencesUpdate(
        user_id: userId,
        daily_frequency: dailyFrequency,
        daily_frequency_reason: reason,
        last_frequency_change: ISO8601DateFormatter().string(from: Date())
      )

      do {
        try await supabase.requestVoid(
          "user_assessment_preferences?on_conflict=user_id",
          method: "POST",
          body: dto,
          prefer: "resolution=merge-duplicates,return=representation"
        )
      } catch {
        print("[Calibration] Frequency update error: \(error)")
      }
    }
  }

  private func logScaleTrigger(userId: String, shortScale: String, shortScore: Int, fullScale: String) async {
    struct ScaleTriggerDTO: Codable {
      let user_id: String
      let short_scale: String
      let short_score: Int
      let triggered_full_scale: String
      let trigger_reason: String
      let confidence: Double
    }

    let dto = ScaleTriggerDTO(
      user_id: userId,
      short_scale: shortScale,
      short_score: shortScore,
      triggered_full_scale: fullScale,
      trigger_reason: "score >= 3",
      confidence: 0.85
    )

    do {
      try await supabase.requestVoid("scale_trigger_logs", method: "POST", body: dto)
    } catch {
      print("[Calibration] Scale trigger log error: \(error)")
    }
  }

  // MARK: - Question Library

  private func getDailyCalibrationQuestions() -> [CalibrationQuestion] {
    let optionsGad = [
      CalibrationOption(value: 0, label: "完全没有"),
      CalibrationOption(value: 1, label: "偶尔"),
      CalibrationOption(value: 2, label: "经常"),
      CalibrationOption(value: 3, label: "完全符合")
    ]

    return [
      CalibrationQuestion(
        id: "gad7_q1",
        text: "感到紧张、焦虑或急切",
        type: .single,
        category: .anxiety,
        options: optionsGad,
        min: nil,
        max: nil,
        isSafetyQuestion: false
      ),
      CalibrationQuestion(
        id: "gad7_q2",
        text: "不能停止或控制担忧",
        type: .single,
        category: .anxiety,
        options: optionsGad,
        min: nil,
        max: nil,
        isSafetyQuestion: false
      ),
      CalibrationQuestion(
        id: "daily_sleep_duration",
        text: "昨晚睡了多少小时？",
        type: .single,
        category: .sleep,
        options: [
          CalibrationOption(value: 0, label: "7-8小时"),
          CalibrationOption(value: 1, label: "8-9小时"),
          CalibrationOption(value: 2, label: "6-7小时"),
          CalibrationOption(value: 3, label: "5-6小时"),
          CalibrationOption(value: 4, label: "超过9小时"),
          CalibrationOption(value: 5, label: "少于5小时")
        ],
        min: nil,
        max: nil,
        isSafetyQuestion: false
      ),
      CalibrationQuestion(
        id: "daily_sleep_quality",
        text: "入睡容易吗？",
        type: .single,
        category: .sleep,
        options: [
          CalibrationOption(value: 0, label: "很容易"),
          CalibrationOption(value: 1, label: "有点困难"),
          CalibrationOption(value: 2, label: "很困难")
        ],
        min: nil,
        max: nil,
        isSafetyQuestion: false
      ),
      CalibrationQuestion(
        id: "daily_stress_level",
        text: "当前压力水平？",
        type: .single,
        category: .stress,
        options: [
          CalibrationOption(value: 0, label: "低压"),
          CalibrationOption(value: 1, label: "中压"),
          CalibrationOption(value: 2, label: "高压")
        ],
        min: nil,
        max: nil,
        isSafetyQuestion: false
      )
    ]
  }

  // MARK: - Adaptive Questions (Phase Goals + Evolution)

  private let maxDailyQuestions = 7
  private let evolutionTriggerDays = 7

  private struct PhaseGoalRow: Codable {
    let category: String?
    let goal_type: String?
    let title: String?
    let goal_text: String?
  }

  private func mergeAdaptiveQuestions(into baseQuestions: [CalibrationQuestion]) async -> [CalibrationQuestion] {
    var questions = baseQuestions
    guard let user = supabase.currentUser else { return questions }

    let (goalTypes, consecutiveDays) = await (
      fetchGoalTypes(userId: user.id),
      fetchConsecutiveDays(userId: user.id)
    )

    let adaptive = generateAdaptiveQuestions(goalTypes: goalTypes, consecutiveDays: consecutiveDays)
    for question in adaptive where questions.count < maxDailyQuestions {
      if !questions.contains(where: { $0.id == question.id }) {
        questions.append(question)
      }
    }

    return questions
  }

  private func fetchGoalTypes(userId: String) async -> [String] {
    let endpoint = "phase_goals?user_id=eq.\(userId)&select=category,goal_type,goal_text,title&order=created_at.desc&limit=3"
    let rows: [PhaseGoalRow] = (try? await supabase.request(endpoint)) ?? []
    let types = rows.compactMap { row in
      row.goal_type ?? row.category
    }
    return Array(Set(types.map { $0.lowercased() }))
  }

  private func fetchConsecutiveDays(userId: String) async -> Int {
    let endpoint = "profiles?id=eq.\(userId)&select=daily_stability_streak&limit=1"
    let profiles: [ProfileCalibrationState] = (try? await supabase.request(endpoint)) ?? []
    return profiles.first?.daily_stability_streak ?? 0
  }

  private func generateAdaptiveQuestions(goalTypes: [String], consecutiveDays: Int) -> [CalibrationQuestion] {
    var questions: [CalibrationQuestion] = []

    for goal in goalTypes {
      let goalQuestions = goalQuestionBank(for: goal)
      if let first = goalQuestions.first {
        questions.append(first)
      }
    }

    if shouldEvolve(consecutiveDays: consecutiveDays) {
      let evolutionCount = min(calculateEvolutionLevel(consecutiveDays: consecutiveDays), evolutionQuestionBank.count)
      questions.append(contentsOf: evolutionQuestionBank.prefix(evolutionCount))
    }

    return questions
  }

  private func shouldEvolve(consecutiveDays: Int) -> Bool {
    consecutiveDays > 0 && consecutiveDays % evolutionTriggerDays == 0
  }

  private func calculateEvolutionLevel(consecutiveDays: Int) -> Int {
    max(1, (consecutiveDays / evolutionTriggerDays) + 1)
  }

  private var evolutionQuestionBank: [CalibrationQuestion] {
    [
      CalibrationQuestion(
        id: "evo_overall_progress",
        text: "这周整体感觉如何？",
        type: .slider,
        category: .evolution,
        options: nil,
        min: 1,
        max: 10,
        isSafetyQuestion: false
      ),
      CalibrationQuestion(
        id: "evo_next_week_focus",
        text: "下周想重点改善什么？",
        type: .single,
        category: .evolution,
        options: [
          CalibrationOption(value: 0, label: "睡眠"),
          CalibrationOption(value: 1, label: "能量"),
          CalibrationOption(value: 2, label: "压力"),
          CalibrationOption(value: 3, label: "运动")
        ],
        min: nil,
        max: nil,
        isSafetyQuestion: false
      )
    ]
  }

  private func goalQuestionBank(for goal: String) -> [CalibrationQuestion] {
    switch goal {
    case "sleep":
      return [
        CalibrationQuestion(
          id: "sleep_quality",
          text: "睡眠质量如何？",
          type: .slider,
          category: .sleep,
          options: nil,
          min: 1,
          max: 10,
          isSafetyQuestion: false
        ),
        CalibrationQuestion(
          id: "sleep_onset_time",
          text: "入睡花了多长时间？",
          type: .single,
          category: .sleep,
          options: [
            CalibrationOption(value: 0, label: "15分钟以内"),
            CalibrationOption(value: 1, label: "15-30分钟"),
            CalibrationOption(value: 2, label: "超过30分钟")
          ],
          min: nil,
          max: nil,
          isSafetyQuestion: false
        )
      ]
    case "energy":
      return [
        CalibrationQuestion(
          id: "morning_energy",
          text: "早上起床时精力如何？",
          type: .slider,
          category: .energy,
          options: nil,
          min: 1,
          max: 10,
          isSafetyQuestion: false
        ),
        CalibrationQuestion(
          id: "afternoon_crash",
          text: "下午是否有能量低谷？",
          type: .single,
          category: .energy,
          options: [
            CalibrationOption(value: 0, label: "没有"),
            CalibrationOption(value: 1, label: "轻微"),
            CalibrationOption(value: 2, label: "明显")
          ],
          min: nil,
          max: nil,
          isSafetyQuestion: false
        )
      ]
    case "stress":
      return [
        CalibrationQuestion(
          id: "stress_triggers",
          text: "今天主要的压力来源是？",
          type: .single,
          category: .stress,
          options: [
            CalibrationOption(value: 0, label: "工作"),
            CalibrationOption(value: 1, label: "人际关系"),
            CalibrationOption(value: 2, label: "健康"),
            CalibrationOption(value: 3, label: "其他")
          ],
          min: nil,
          max: nil,
          isSafetyQuestion: false
        ),
        CalibrationQuestion(
          id: "recovery_activity",
          text: "今天做了什么放松活动？",
          type: .single,
          category: .stress,
          options: [
            CalibrationOption(value: 0, label: "运动"),
            CalibrationOption(value: 1, label: "冥想/呼吸"),
            CalibrationOption(value: 2, label: "社交"),
            CalibrationOption(value: 3, label: "没有")
          ],
          min: nil,
          max: nil,
          isSafetyQuestion: false
        )
      ]
    case "fitness", "exercise":
      return [
        CalibrationQuestion(
          id: "exercise_done",
          text: "今天运动了吗？",
          type: .single,
          category: .exercise,
          options: [
            CalibrationOption(value: 0, label: "有"),
            CalibrationOption(value: 1, label: "没有")
          ],
          min: nil,
          max: nil,
          isSafetyQuestion: false
        ),
        CalibrationQuestion(
          id: "exercise_intensity",
          text: "运动强度如何？",
          type: .single,
          category: .exercise,
          options: [
            CalibrationOption(value: 0, label: "轻度"),
            CalibrationOption(value: 1, label: "中度"),
            CalibrationOption(value: 2, label: "高强度")
          ],
          min: nil,
          max: nil,
          isSafetyQuestion: false
        )
      ]
    case "weight", "nutrition", "diet":
      return [
        CalibrationQuestion(
          id: "meal_quality",
          text: "今天饮食质量如何？",
          type: .slider,
          category: .goal,
          options: nil,
          min: 1,
          max: 10,
          isSafetyQuestion: false
        ),
        CalibrationQuestion(
          id: "hunger_level",
          text: "今天饥饿感如何？",
          type: .single,
          category: .goal,
          options: [
            CalibrationOption(value: 0, label: "正常"),
            CalibrationOption(value: 1, label: "经常饿"),
            CalibrationOption(value: 2, label: "没什么食欲")
          ],
          min: nil,
          max: nil,
          isSafetyQuestion: false
        )
      ]
    default:
      return []
    }
  }

  // MARK: - Mappers

  private func getSleepHoursFromValue(_ value: Int) -> Double {
    switch value {
    case 0: return 7.5
    case 1: return 8.5
    case 2: return 6.5
    case 3: return 5.5
    case 4: return 10.5
    case 5: return 4.0
    default: return 7.0
    }
  }

  private func getSleepDurationScore(_ value: Int) -> Int {
    if value == 5 || value == 3 { return 2 }
    if value == 2 || value == 4 { return 1 }
    return 0
  }

  private func mapSleepQuality(_ value: Int?) -> String? {
    guard let value else { return nil }
    switch value {
    case 0: return "good"
    case 1: return "average"
    case 2: return "poor"
    default: return nil
    }
  }

  private func mapStressLevel(_ value: Int?) -> Int? {
    guard let value else { return nil }
    return max(1, min(10, value * 3 + 3))
  }

  private func checkSafetyTrigger(questionId: String, value: Int) -> Bool {
    return questionId == "phq9_q9" && value >= 1
  }

  private func logSafetyEvent(userId: String, triggerSource: String, triggerValue: Int) async {
    struct SafetyEventDTO: Codable {
      let user_id: String
      let trigger_source: String
      let trigger_value: Int
      let actions_taken: [String]
    }

    let dto = SafetyEventDTO(
      user_id: userId,
      trigger_source: triggerSource,
      trigger_value: triggerValue,
      actions_taken: ["show_safety_message", "show_crisis_resources"]
    )

    do {
      try await supabase.requestVoid("safety_events", method: "POST", body: dto)
    } catch {
      print("[Calibration] Safety event log error: \(error)")
    }
  }
}
