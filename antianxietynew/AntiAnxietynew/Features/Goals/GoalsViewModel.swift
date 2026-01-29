// GoalsViewModel.swift
// 目标视图模型 - 对齐 Web 端 useGoals Hook
//
// 功能对照:
// - Web: hooks/domain/useGoals.ts + app/actions/goals.ts
// - iOS: 本文件
//
// 数据源: Supabase phase_goals

import SwiftUI

// MARK: - Goal Model

struct PhaseGoal: Identifiable, Equatable {
    let id: String
    let userId: String
    var title: String
    var description: String?
    var category: String
    var isCompleted: Bool
    var progress: Int
    var targetDate: String?
    let createdAt: String
    var updatedAt: String
}

struct CreateGoalInput: Codable {
    let title: String
    let description: String?
    let category: String
    let target_date: String?
}

// MARK: - Raw Response

private struct RawGoalResponse: Codable {
    let id: String
    let user_id: String
    let title: String?
    let goal_text: String?
    let description: String?
    let category: String?
    let is_completed: Bool?
    let progress: Int?
    let target_date: String?
    let created_at: String?
    let updated_at: String?
}

private struct CreateGoalDTO: Codable {
    let user_id: String
    let title: String
    let goal_text: String
    let description: String?
    let category: String
    let is_completed: Bool
    let progress: Int
}

private struct UpdateGoalDTO: Codable {
    let is_completed: Bool?
    let progress: Int?
    let updated_at: String
    
    init(isCompleted: Bool? = nil, progress: Int? = nil) {
        self.is_completed = isCompleted
        self.progress = progress
        self.updated_at = ISO8601DateFormatter().string(from: Date())
    }
}

// MARK: - Helper

private func mapGoalRow(_ raw: RawGoalResponse) -> PhaseGoal {
    let fallbackDate = ISO8601DateFormatter().string(from: Date())
    return PhaseGoal(
        id: raw.id,
        userId: raw.user_id,
        title: raw.title ?? raw.goal_text ?? "未命名目标",
        description: raw.description,
        category: raw.category ?? "general",
        isCompleted: raw.is_completed ?? false,
        progress: raw.progress ?? (raw.is_completed == true ? 100 : 0),
        targetDate: raw.target_date,
        createdAt: raw.created_at ?? fallbackDate,
        updatedAt: raw.updated_at ?? raw.created_at ?? fallbackDate
    )
}

// MARK: - ViewModel

@MainActor
class GoalsViewModel: ObservableObject {
    
    // MARK: - Published State (对齐 useGoals)
    
    @Published var goals: [PhaseGoal] = []
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var error: String?
    
    // MARK: - Computed Properties
    
    var activeGoals: [PhaseGoal] {
        goals.filter { !$0.isCompleted }
    }
    
    var completedGoals: [PhaseGoal] {
        goals.filter { $0.isCompleted }
    }
    
    // MARK: - Dependencies
    
    private let supabase = SupabaseManager.shared
    
    // MARK: - Load Goals
    
    func loadGoals() async {
        guard let user = supabase.currentUser else { return }
        
        isLoading = true
        error = nil
        defer { isLoading = false }
        
        do {
            let endpoint = "phase_goals?user_id=eq.\(user.id)&select=*&order=created_at.desc"
            let rawGoals: [RawGoalResponse] = try await supabase.request(endpoint)
            goals = rawGoals.map(mapGoalRow)
        } catch {
            self.error = error.localizedDescription
            print("[Goals] Load error: \(error)")
        }
    }
    
    // MARK: - Create Goal
    
    func create(_ input: CreateGoalInput) async -> Bool {
        guard let user = supabase.currentUser else { return false }
        
        isSaving = true
        error = nil
        defer { isSaving = false }
        
        let now = ISO8601DateFormatter().string(from: Date())
        let goalId = UUID().uuidString
        
        // 乐观更新
        let newGoal = PhaseGoal(
            id: goalId,
            userId: user.id,
            title: input.title,
            description: input.description,
            category: input.category,
            isCompleted: false,
            progress: 0,
            targetDate: input.target_date,
            createdAt: now,
            updatedAt: now
        )
        
        withAnimation {
            goals.insert(newGoal, at: 0)
        }
        
        do {
            let dto = CreateGoalDTO(
                user_id: user.id,
                title: input.title,
                goal_text: input.title,
                description: input.description,
                category: input.category,
                is_completed: false,
                progress: 0
            )
            
            let _: [RawGoalResponse] = try await supabase.request("phase_goals", method: "POST", body: dto)
            await loadGoals() // 重新加载获取正确的 ID
            return true
        } catch {
            // 回滚
            if let index = goals.firstIndex(where: { $0.id == goalId }) {
                goals.remove(at: index)
            }
            self.error = error.localizedDescription
            print("[Goals] Create error: \(error)")
            return false
        }
    }
    
    // MARK: - Toggle Goal Completion
    
    func toggle(_ goalId: String) async -> Bool {
        guard let index = goals.firstIndex(where: { $0.id == goalId }) else { return false }
        
        isSaving = true
        
        // 乐观更新
        let previous = goals[index]
        goals[index].isCompleted.toggle()
        goals[index].progress = goals[index].isCompleted ? 100 : 0
        
        do {
            let dto = UpdateGoalDTO(
                isCompleted: goals[index].isCompleted,
                progress: goals[index].progress
            )
            try await supabase.requestVoid("phase_goals?id=eq.\(goalId)", method: "PATCH", body: dto)
            isSaving = false
            return true
        } catch {
            // 回滚
            goals[index] = previous
            isSaving = false
            print("[Goals] Toggle error: \(error)")
            return false
        }
    }
    
    // MARK: - Remove Goal
    
    func remove(_ goalId: String) async -> Bool {
        guard let index = goals.firstIndex(where: { $0.id == goalId }) else { return false }
        
        isSaving = true
        
        let removed = goals.remove(at: index)
        
        do {
            try await supabase.requestVoid("phase_goals?id=eq.\(goalId)", method: "DELETE")
            isSaving = false
            return true
        } catch {
            // 回滚
            goals.insert(removed, at: index)
            isSaving = false
            print("[Goals] Delete error: \(error)")
            return false
        }
    }
    
    // MARK: - Refresh
    
    func refresh() async {
        await loadGoals()
    }
}
