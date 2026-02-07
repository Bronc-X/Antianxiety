// PlansViewModel.swift
// 计划视图模型 - 对齐 Web 端 usePlans Hook
//
// 功能对照:
// - Web: hooks/domain/usePlans.ts + app/actions/plans.ts
// - iOS: 本文件
//
// 数据源: Supabase user_plans + user_plan_completions

import SwiftUI

// MARK: - Plan Item (对齐 Web 端 PlanItem)

struct PlanItemData: Codable, Identifiable, Equatable {
  let id: String
  var text: String
  var completed: Bool
}

struct PlanCompletionItem: Codable, Identifiable, Equatable {
  let id: String
  let completed: Bool
  let text: String?
}

// MARK: - Plan Data (对齐 Web 端 PlanData)

struct PlanData: Identifiable, Equatable {
  let id: String
  let user_id: String
  var name: String
  var description: String?
  var category: String
  var status: PlanStatus
  var progress: Int
  var items: [PlanItemData]
  var target_date: String?
  let created_at: String
  var updated_at: String
  var difficulty: String?
  var plan_type: String?
  var expected_duration_days: Int?
}

enum PlanStatus: String, Codable {
  case active = "active"
  case completed = "completed"
  case paused = "paused"
}

enum PlanCompletionStatus: String, Codable {
  case completed
  case partial
  case skipped
  case archived
}

// MARK: - DTOs

private struct PlanItemPayload: Codable {
  let id: String
  let text: String
  let completed: Bool
}

private struct PlanContentPayload: Codable {
  let description: String
  let items: [PlanItemPayload]
}

private struct CreatePlanDTO: Codable {
  let user_id: String
  let name: String
  let title: String
  let description: String?
  let category: String
  let status: String
  let progress: Int
  let content: PlanContentPayload
}

private struct UpdatePlanDTO: Codable {
  let status: String?
  let progress: Int?
  let updated_at: String

  init(status: String? = nil, progress: Int? = nil) {
    self.status = status
    self.progress = progress
    self.updated_at = ISO8601DateFormatter().string(from: Date())
  }
}

private struct PlanCompletionDTO: Codable {
  let user_id: String
  let plan_id: String
  let completion_date: String
  let status: String
  let completed_items: [PlanCompletionItem]?
  let notes: String?
  let feeling_score: Int?
}

// MARK: - Raw Response from Supabase

private struct RawPlanResponse: Codable {
  let id: String
  let user_id: String
  let name: String?
  let title: String?
  let description: String?
  let category: String?
  let status: String?
  let progress: Int?
  let content: CodableValue?
  let target_date: String?
  let created_at: String?
  let updated_at: String?
  let difficulty: CodableValue?
  let plan_type: String?
  let expected_duration_days: Int?
}

struct PlanCompletionRow: Codable, Equatable {
  let plan_id: String?
  let completed_items: CodableValue?
  let completion_date: String?
  let status: String?
}

struct PlanStatsSummary: Equatable {
  let total_completions: Int
  let completed_days: Int
  let total_days: Int
  let completion_rate: Int
  let avg_feeling_score: Double?
}

struct PlanStatsData: Equatable {
  let total_plans: Int
  let plans: [PlanSummary]
  let completions: [PlanCompletionRow]
  let summary: PlanStatsSummary
}

struct PlanSummary: Equatable {
  let id: String
  let title: String
  let plan_type: String?
}

// MARK: - Helpers

private func parseJSONValue(from string: String) -> CodableValue? {
  guard let data = string.data(using: .utf8) else { return nil }
  return try? JSONDecoder().decode(CodableValue.self, from: data)
}

private func stringValue(_ value: CodableValue?) -> String? {
  guard let value else { return nil }
  switch value {
  case .string(let text): return text
  case .number(let number): return String(number)
  case .bool(let flag): return flag ? "true" : "false"
  case .object: return nil
  case .array: return nil
  case .null: return nil
  }
}

private func boolValue(_ value: CodableValue?) -> Bool? {
  guard let value else { return nil }
  switch value {
  case .bool(let flag): return flag
  case .number(let number): return number != 0
  case .string(let text): return ["true", "1", "yes"].contains(text.lowercased())
  default: return nil
  }
}

private func objectValue(_ value: CodableValue?) -> [String: CodableValue]? {
  guard let value else { return nil }
  if case .object(let object) = value {
    return object
  }
  return nil
}

private func arrayValue(_ value: CodableValue?) -> [CodableValue]? {
  guard let value else { return nil }
  if case .array(let array) = value {
    return array
  }
  return nil
}

private func parseDifficulty(_ value: CodableValue?) -> String? {
  guard let value else { return nil }
  switch value {
  case .string(let text):
    return text
  case .number(let number):
    if number <= 2 { return "easy" }
    if number <= 3 { return "medium" }
    return "hard"
  default:
    return nil
  }
}

private func parsePlanItems(from content: CodableValue?, planId: String) -> [PlanItemData] {
  guard let content else { return [] }
  let resolvedContent: CodableValue

  if case .string(let jsonString) = content, let parsed = parseJSONValue(from: jsonString) {
    resolvedContent = parsed
  } else {
    resolvedContent = content
  }

  guard let contentObject = objectValue(resolvedContent) else { return [] }
  let itemsValue = contentObject["items"] ?? contentObject["actions"]
  guard let itemsArray = arrayValue(itemsValue) else { return [] }

  return itemsArray.enumerated().map { index, rawItem in
    switch rawItem {
    case .string(let text):
      return PlanItemData(id: "\(planId)-\(index)", text: text, completed: false)
    case .object(let payload):
      let itemId = stringValue(payload["id"]) ?? "\(planId)-\(index)"
      let text = stringValue(payload["text"]) ?? stringValue(payload["title"]) ?? ""
      let completed = boolValue(payload["completed"]) ?? (stringValue(payload["status"]) == "completed")
      return PlanItemData(id: itemId, text: text, completed: completed)
    default:
      return PlanItemData(id: "\(planId)-\(index)", text: "", completed: false)
    }
  }
}

private func normalizeCompletedItems(_ raw: CodableValue?) -> [PlanCompletionItem] {
  guard let raw else { return [] }
  let resolved: CodableValue

  if case .string(let jsonString) = raw, let parsed = parseJSONValue(from: jsonString) {
    resolved = parsed
  } else {
    resolved = raw
  }

  guard let itemsArray = arrayValue(resolved) else { return [] }

  return itemsArray.compactMap { item in
    guard case .object(let payload) = item else { return nil }
    let itemId = stringValue(payload["id"]) ?? ""
    if itemId.isEmpty { return nil }
    let completed = boolValue(payload["completed"]) ?? (stringValue(payload["status"]) == "completed")
    let text = stringValue(payload["text"]) ?? stringValue(payload["title"])
    return PlanCompletionItem(id: itemId, completed: completed, text: text)
  }
}

private func applyCompletionItems(
  _ items: [PlanItemData],
  completedItems: [PlanCompletionItem],
  planId: String
) -> [PlanItemData] {
  guard !completedItems.isEmpty else { return items }

  return items.enumerated().map { index, item in
    let itemId = item.id
    let matched = completedItems.first { completion in
      completion.id == itemId ||
        completion.id == "\(planId)-\(index)" ||
        completion.id == String(index)
    }

    return PlanItemData(
      id: itemId,
      text: item.text,
      completed: matched?.completed ?? item.completed
    )
  }
}

private func mapPlanRow(_ raw: RawPlanResponse) -> PlanData {
  let items = parsePlanItems(from: raw.content, planId: raw.id)
  let completedCount = items.filter { $0.completed }.count
  let computedProgress = items.isEmpty ? 0 : Int((Double(completedCount) / Double(items.count)) * 100)
  let resolvedProgress = raw.progress ?? computedProgress
  let fallbackDate = ISO8601DateFormatter().string(from: Date())

  return PlanData(
    id: raw.id,
    user_id: raw.user_id,
    name: raw.name ?? raw.title ?? "未命名计划",
    description: raw.description,
    category: raw.category ?? "general",
    status: PlanStatus(rawValue: raw.status ?? "active") ?? .active,
    progress: resolvedProgress,
    items: items,
    target_date: raw.target_date,
    created_at: raw.created_at ?? fallbackDate,
    updated_at: raw.updated_at ?? raw.created_at ?? fallbackDate,
    difficulty: parseDifficulty(raw.difficulty),
    plan_type: raw.plan_type,
    expected_duration_days: raw.expected_duration_days
  )
}

private func todayDateString() -> String {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withFullDate]
  return formatter.string(from: Date())
}

// MARK: - ViewModel

@MainActor
class PlansViewModel: ObservableObject {

  // MARK: - Published State (对齐 usePlans)

  @Published var plans: [PlanData] = []
  @Published var isLoading = false
  @Published var isSaving = false
  @Published var isGeneratingPlan = false
  @Published var error: String?

  // MARK: - Computed Properties

  var activePlans: [PlanData] {
    plans.filter { $0.status == .active }
  }

  var completedPlans: [PlanData] {
    plans.filter { $0.status == .completed }
  }

  // MARK: - Dependencies

  private let supabase = SupabaseManager.shared

  // MARK: - Load Plans

  func loadPlans() async {
    guard let user = supabase.currentUser else { return }

    isLoading = true
    defer { isLoading = false }
    error = nil

    do {
      let endpoint = "user_plans?user_id=eq.\(user.id)&select=*&order=created_at.desc"
      let rawPlans: [RawPlanResponse] = try await supabase.request(endpoint)

      var mappedPlans = rawPlans.map(mapPlanRow)
      if mappedPlans.isEmpty {
        plans = []
        return
      }

      let idList = mappedPlans.map { $0.id }.joined(separator: ",")
      let completionEndpoint = "user_plan_completions?user_id=eq.\(user.id)&plan_id=in.(\(idList))&select=plan_id,completed_items,completion_date,status&order=completion_date.desc"
      let completionRows: [PlanCompletionRow] = (try? await supabase.request(completionEndpoint)) ?? []

      var completionMap: [String: [PlanCompletionItem]] = [:]
      for row in completionRows {
        guard let planId = row.plan_id, completionMap[planId] == nil else { continue }
        let normalized = normalizeCompletedItems(row.completed_items)
        if !normalized.isEmpty {
          completionMap[planId] = normalized
        }
      }

      mappedPlans = mappedPlans.map { plan in
        guard let completionItems = completionMap[plan.id] else { return plan }
        let mergedItems = applyCompletionItems(plan.items, completedItems: completionItems, planId: plan.id)
        let completedCount = mergedItems.filter { $0.completed }.count
        let progress = mergedItems.isEmpty ? plan.progress : Int((Double(completedCount) / Double(mergedItems.count)) * 100)

        var updated = plan
        updated.items = mergedItems
        updated.progress = progress
        if progress == 100 {
          updated.status = .completed
        }
        return updated
      }

      plans = mappedPlans
    } catch {
      self.error = error.localizedDescription
      print("[Plans] Load error: \(error)")
    }
  }

  // MARK: - Create Plan

  func addPlan(_ title: String, description: String?, category: PlanCategory, items: [String]) {
    guard let user = supabase.currentUser else { return }

    let now = ISO8601DateFormatter().string(from: Date())
    let planId = UUID().uuidString
    let planItems = items.enumerated().map { index, text in
      PlanItemData(id: "\(planId)-\(index)", text: text, completed: false)
    }

    let newPlan = PlanData(
      id: planId,
      user_id: user.id,
      name: title,
      description: description,
      category: category.rawValue,
      status: .active,
      progress: 0,
      items: planItems,
      target_date: nil,
      created_at: now,
      updated_at: now,
      difficulty: nil,
      plan_type: nil,
      expected_duration_days: nil
    )

    withAnimation {
      plans.insert(newPlan, at: 0)
    }

    Task {
      do {
        let content = PlanContentPayload(
          description: description ?? "",
          items: planItems.map { PlanItemPayload(id: $0.id, text: $0.text, completed: $0.completed) }
        )

        let dto = CreatePlanDTO(
          user_id: user.id,
          name: title,
          title: title,
          description: description,
          category: category.rawValue,
          status: "active",
          progress: 0,
          content: content
        )

        let _: [RawPlanResponse] = try await supabase.request("user_plans", method: "POST", body: dto)
        await loadPlans()
      } catch {
        if let index = plans.firstIndex(where: { $0.id == planId }) {
          plans.remove(at: index)
        }
        print("[Plans] Create error: \(error)")
      }
    }
  }

  // MARK: - Personalized Plan (Rule-Based)

  func generatePersonalizedPlan(language: AppLanguage) async {
    guard !isGeneratingPlan else { return }
    isGeneratingPlan = true
    defer { isGeneratingPlan = false }

    guard let profile = try? await supabase.getUnifiedProfile() else {
      error = language == .en
        ? "No unified profile found. Complete daily check-ins first."
        : "未找到统一画像，请先完成每日校准。"
      return
    }

    let draft = buildPersonalizedPlanDraft(from: profile, language: language)
    let itemTexts = draft.items.map { item in
      let separator = language == .en ? ": " : "："
      let base = "\(item.title)\(separator)\(item.action)"
      if item.science.isEmpty { return base }
      return language == .en ? "\(base)\nWhy: \(item.science)" : "\(base)\n科学依据：\(item.science)"
    }

    addPlan(draft.title, description: draft.description, category: draft.category, items: itemTexts)
  }

  // MARK: - Refresh

  func refresh() async {
    await loadPlans()
  }

  // MARK: - Status Updates

  func updatePlanStatus(planId: String, status: PlanStatus, progress: Int? = nil) async {
    guard let index = plans.firstIndex(where: { $0.id == planId }) else { return }

    let previous = plans[index]
    plans[index].status = status
    if let progress = progress {
      plans[index].progress = progress
    }

    do {
      let dto = UpdatePlanDTO(status: status.rawValue, progress: progress)
      try await supabase.requestVoid("user_plans?id=eq.\(planId)", method: "PATCH", body: dto)
    } catch {
      plans[index] = previous
      print("[Plans] Status update error: \(error)")
    }
  }

  func pausePlan(planId: String) async {
    await updatePlanStatus(planId: planId, status: .paused)
  }

  func resumePlan(planId: String) async {
    await updatePlanStatus(planId: planId, status: .active)
  }

  func togglePlan(planId: String) async {
    guard let plan = plans.first(where: { $0.id == planId }) else { return }
    let newStatus: PlanStatus = plan.status == .completed ? .active : .completed
    let newProgress = newStatus == .completed ? 100 : 0
    await updatePlanStatus(planId: planId, status: newStatus, progress: newProgress)
  }

  // MARK: - Update Items

  func updateItems(planId: String, items: [PlanItemData], status: PlanCompletionStatus) async {
    guard let user = supabase.currentUser else { return }
    guard let index = plans.firstIndex(where: { $0.id == planId }) else { return }

    isSaving = true
    error = nil

    let previous = plans[index]
    let completedCount = items.filter { $0.completed }.count
    let progress = items.isEmpty ? 0 : Int((Double(completedCount) / Double(items.count)) * 100)

    plans[index].items = items
    plans[index].progress = progress
    if progress == 100 {
      plans[index].status = .completed
    }

    do {
      let completionDTO = PlanCompletionDTO(
        user_id: user.id,
        plan_id: planId,
        completion_date: todayDateString(),
        status: status.rawValue,
        completed_items: items.map { PlanCompletionItem(id: $0.id, completed: $0.completed, text: $0.text) },
        notes: nil,
        feeling_score: nil
      )

      try await supabase.requestVoid(
        "user_plan_completions?on_conflict=user_id,plan_id,completion_date",
        method: "POST",
        body: completionDTO,
        prefer: "resolution=merge-duplicates,return=representation"
      )

      let updateDTO = UpdatePlanDTO(status: progress == 100 ? PlanStatus.completed.rawValue : nil, progress: progress)
      try await supabase.requestVoid("user_plans?id=eq.\(planId)", method: "PATCH", body: updateDTO)
    } catch {
      plans[index] = previous
      self.error = error.localizedDescription
      print("[Plans] Update items error: \(error)")
    }

    isSaving = false
  }

  // MARK: - Archive

  func archivePlan(planId: String) async {
    await updatePlanStatus(planId: planId, status: .completed, progress: 100)
  }

  // MARK: - Delete Plan

  func deletePlan(planId: String) async {
    guard let index = plans.firstIndex(where: { $0.id == planId }) else { return }

    let removedPlan = plans.remove(at: index)

    do {
      try await supabase.requestVoid("user_plans?id=eq.\(planId)", method: "DELETE")
    } catch {
      plans.insert(removedPlan, at: index)
      print("[Plans] Delete error: \(error)")
    }
  }

  // MARK: - Stats Summary

  func getStatsSummary(days: Int = 30) async -> PlanStatsData? {
    guard let user = supabase.currentUser else { return nil }

    do {
      let plansEndpoint = "user_plans?user_id=eq.\(user.id)&select=id,title,plan_type,user_id&status=eq.active"
      let rawPlans: [RawPlanResponse] = try await supabase.request(plansEndpoint)
      if rawPlans.isEmpty {
        return PlanStatsData(
          total_plans: 0,
          plans: [],
          completions: [],
          summary: PlanStatsSummary(
            total_completions: 0,
            completed_days: 0,
            total_days: days,
            completion_rate: 0,
            avg_feeling_score: nil
          )
        )
      }

      let dateFrom = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
      let dateFromString = ISO8601DateFormatter().string(from: dateFrom).prefix(10)

      let planIds = rawPlans.map { $0.id }.joined(separator: ",")
      let completionsEndpoint = "user_plan_completions?user_id=eq.\(user.id)&plan_id=in.(\(planIds))&completion_date=gte.\(dateFromString)&select=plan_id,completed_items,completion_date,status"
      let completions: [PlanCompletionRow] = (try? await supabase.request(completionsEndpoint)) ?? []

      let completedDays = Set(completions.compactMap { $0.status == "completed" ? $0.completion_date : nil }).count
      let totalCompletions = completions.count

      let planSummaries = rawPlans.map {
        PlanSummary(id: $0.id, title: $0.title ?? $0.name ?? "未命名计划", plan_type: $0.plan_type)
      }

      let completionRate = days > 0 ? Int((Double(completedDays) / Double(days)) * 100) : 0

      return PlanStatsData(
        total_plans: rawPlans.count,
        plans: planSummaries,
        completions: completions,
        summary: PlanStatsSummary(
          total_completions: totalCompletions,
          completed_days: completedDays,
          total_days: days,
          completion_rate: completionRate,
          avg_feeling_score: nil
        )
      )
    } catch {
      print("[Plans] Stats error: \(error)")
      return nil
    }
  }
}

// MARK: - Personalized Plan Rule Engine

private struct PlanRuleItem {
  let title: String
  let action: String
  let science: String
  let difficulty: String
  let category: String
}

private struct PlanDraft {
  let title: String
  let description: String
  let category: PlanCategory
  let items: [PlanRuleItem]
}

private func buildPersonalizedPlanDraft(from profile: UnifiedProfile, language: AppLanguage) -> PlanDraft {
  var items: [PlanRuleItem] = []
  var basedOn: [String] = []

  let isEn = language == .en

  if let goals = profile.health_goals, !goals.isEmpty {
    basedOn.append(isEn ? "goals" : "健康目标")
    for goal in goals.prefix(3) {
      if let item = generateItemForGoal(category: goal.category ?? "habits", goalText: goal.goal_text, language: language) {
        items.append(item)
      }
    }
  }

  if let mood = profile.recent_mood_trend, !mood.isEmpty {
    basedOn.append(isEn ? "mood trend" : "情绪趋势")
    if mood == "declining" {
      items.append(PlanRuleItem(
        title: isEn ? "Emotional Reset Breathing" : "情绪调节呼吸",
        action: isEn
          ? "5 minutes of box breathing daily (inhale 4s - hold 4s - exhale 4s - hold 4s)."
          : "每天进行 5 分钟箱式呼吸（吸4秒-屏4秒-呼4秒-屏4秒）。",
        science: isEn
          ? "Box breathing activates the parasympathetic system and can lower cortisol."
          : "箱式呼吸可激活副交感神经系统，降低皮质醇水平。",
        difficulty: "easy",
        category: "mental"
      ))
    } else if mood == "improving" {
      items.append(PlanRuleItem(
        title: isEn ? "Keep Momentum" : "保持正向动力",
        action: isEn ? "Write down 3 things you are grateful for every night." : "每晚记录 3 件今日感恩的事。",
        science: isEn
          ? "Gratitude practice can enhance dopamine and serotonin activity."
          : "感恩练习有助于增强多巴胺和血清素水平。",
        difficulty: "easy",
        category: "mental"
      ))
    }
  }

  if let lifestyle = profile.lifestyle_factors {
    basedOn.append(isEn ? "lifestyle" : "生活习惯")

    if lifestyle.stress_level == "high" {
      items.append(PlanRuleItem(
        title: isEn ? "Stress-Release Movement" : "压力释放运动",
        action: isEn ? "15 minutes of moderate cardio daily (brisk walk/swim)." : "每天 15 分钟中等强度运动（快走/游泳）。",
        science: isEn
          ? "Aerobic exercise reduces cortisol and releases endorphins."
          : "有氧运动可降低皮质醇并释放内啡肽。",
        difficulty: "medium",
        category: "fitness"
      ))
    }

    if let sleepHours = lifestyle.sleep_hours, sleepHours > 0, sleepHours < 7 {
      items.append(PlanRuleItem(
        title: isEn ? "Sleep Duration Upgrade" : "睡眠时长优化",
        action: isEn ? "Shift bedtime 15 minutes earlier each week to reach 7 hours." : "每周提前 15 分钟入睡，目标 7 小时。",
        science: isEn
          ? "Gradual shifts are easier on circadian rhythm and more sustainable."
          : "渐进式调整对昼夜节律冲击更小，更易坚持。",
        difficulty: "medium",
        category: "sleep"
      ))
    }
  }

  if let concerns = profile.health_concerns, !concerns.isEmpty {
    basedOn.append(isEn ? "health concerns" : "健康关注点")

    if concerns.contains("失眠") || concerns.contains("睡眠问题") {
      items.append(PlanRuleItem(
        title: isEn ? "Blue-Light Wind-Down" : "睡前蓝光管理",
        action: isEn ? "Stop screens 1 hour before bed and switch to warm light." : "睡前 1 小时停止使用电子设备，切换到暖光。",
        science: isEn
          ? "Blue light suppresses melatonin, delaying sleep onset."
          : "蓝光会抑制褪黑素分泌，影响入睡质量。",
        difficulty: "medium",
        category: "sleep"
      ))
    }

    if concerns.contains("焦虑") || concerns.contains("紧张") {
      items.append(PlanRuleItem(
        title: isEn ? "NSDR Practice" : "NSDR 练习",
        action: isEn ? "10 minutes of NSDR daily (search 'NSDR' for a guided session)." : "每天 10 分钟 NSDR（可搜索引导练习）。",
        science: isEn
          ? "NSDR helps trigger recovery through parasympathetic activation."
          : "NSDR 可在清醒状态下触发副交感神经恢复。",
        difficulty: "medium",
        category: "mental"
      ))
    }
  }

  if items.isEmpty {
    items.append(PlanRuleItem(
      title: isEn ? "Daily Check-in" : "每日状态记录",
      action: isEn ? "Complete daily calibration and log sleep/mood." : "每天完成每日校准，记录睡眠和情绪。",
      science: isEn
        ? "Self-monitoring is the first step to sustainable behavior change."
        : "自我监测是行为改变的第一步，提高健康意识。",
      difficulty: "easy",
      category: "habits"
    ))
  }

  let category = mapPlanCategory(from: items)
  let dateFormatter = DateFormatter()
  dateFormatter.locale = Locale(identifier: isEn ? "en_US_POSIX" : "zh_CN")
  dateFormatter.dateFormat = isEn ? "MMM d" : "M月d日"
  let dateTitle = dateFormatter.string(from: Date())

  let title = isEn ? "\(dateTitle) Personalized Plan" : "\(dateTitle) 个性化计划"
  let basedOnText = basedOn.isEmpty
    ? (isEn ? "your recent data" : "你的近期数据")
    : basedOn.joined(separator: isEn ? ", " : "、")
  let description = isEn
    ? "Built from \(basedOnText)."
    : "基于你的\(basedOnText)生成的专属计划。"

  return PlanDraft(title: title, description: description, category: category, items: items)
}

private func mapPlanCategory(from items: [PlanRuleItem]) -> PlanCategory {
  if items.contains(where: { $0.category == "sleep" }) { return .sleep }
  if items.contains(where: { $0.category == "fitness" }) { return .exercise }
  if items.contains(where: { $0.category == "nutrition" }) { return .diet }
  if items.contains(where: { $0.category == "mental" || $0.category == "stress" }) { return .mental }
  return .general
}

private func generateItemForGoal(category: String, goalText: String, language: AppLanguage) -> PlanRuleItem? {
  let isEn = language == .en
  switch category {
  case "sleep":
    return PlanRuleItem(
      title: isEn ? "Sleep Quality Optimization" : "睡眠质量优化",
      action: isEn
        ? "For goal \"\(goalText)\": keep a consistent bedtime and start winding down 30 minutes earlier."
        : "针对目标「\(goalText)」：每晚固定时间入睡，睡前 30 分钟开始准备。",
      science: isEn
        ? "Stable sleep timing strengthens circadian rhythm and improves efficiency."
        : "固定作息时间可以强化昼夜节律，提高睡眠效率。",
      difficulty: "medium",
      category: "sleep"
    )
  case "stress":
    return PlanRuleItem(
      title: isEn ? "Stress Management Training" : "压力管理训练",
      action: isEn
        ? "For goal \"\(goalText)\": 5 minutes of mindful breathing twice a day."
        : "针对目标「\(goalText)」：每天 2 次 5 分钟正念呼吸。",
      science: isEn
        ? "Mindful breathing reduces amygdala reactivity and stress response."
        : "正念练习可以降低杏仁核活动，减少压力反应。",
      difficulty: "medium",
      category: "mental"
    )
  case "fitness":
    return PlanRuleItem(
      title: isEn ? "Exercise Habit" : "运动习惯建立",
      action: isEn
        ? "For goal \"\(goalText)\": 30 minutes of cardio 3x per week."
        : "针对目标「\(goalText)」：每周 3 次 30 分钟有氧运动。",
      science: isEn
        ? "Regular exercise improves cardio fitness and basal metabolism."
        : "规律运动可以提高心肺功能和基础代谢。",
      difficulty: "hard",
      category: "fitness"
    )
  case "nutrition":
    return PlanRuleItem(
      title: isEn ? "Nutrition Optimization" : "营养优化",
      action: isEn
        ? "For goal \"\(goalText)\": include a protein source in each meal."
        : "针对目标「\(goalText)」：每餐保证蛋白质摄入。",
      science: isEn
        ? "Adequate protein supports muscle repair and immune function."
        : "足够的蛋白质是肌肉合成和免疫功能的基础。",
      difficulty: "medium",
      category: "nutrition"
    )
  case "mental":
    return PlanRuleItem(
      title: isEn ? "Mental Wellbeing" : "心理健康维护",
      action: isEn
        ? "For goal \"\(goalText)\": weekly 1 deep self-reflection session."
        : "针对目标「\(goalText)」：每周进行 1 次深度自我反思。",
      science: isEn
        ? "Reflection improves metacognition and emotional regulation."
        : "自我反思可以增强元认知能力，提高情绪调节。",
      difficulty: "medium",
      category: "mental"
    )
  case "habits":
    return PlanRuleItem(
      title: isEn ? "Habit Building" : "习惯养成",
      action: isEn
        ? "For goal \"\(goalText)\": stack the new habit onto an existing routine."
        : "针对目标「\(goalText)」：使用习惯堆叠法，与现有习惯绑定。",
      science: isEn
        ? "Habit stacking reduces resistance by using existing neural pathways."
        : "习惯堆叠利用已有神经通路，降低新习惯阻力。",
      difficulty: "medium",
      category: "habits"
    )
  default:
    return PlanRuleItem(
      title: isEn ? "Habit Building" : "习惯养成",
      action: isEn
        ? "For goal \"\(goalText)\": start with a small daily routine."
        : "针对目标「\(goalText)」：从一个小的日常动作开始。",
      science: isEn
        ? "Small routines compound into long-term behavior change."
        : "小习惯可以形成持续的行为改变。",
      difficulty: "medium",
      category: "habits"
    )
  }
}

// Note: PlanCategory is defined in PlansView.swift
