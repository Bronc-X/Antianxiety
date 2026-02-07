//
//  SupabaseManager.swift
//  antios
//
//  Supabase 管理器 - 硬编码模式（不连接后端）
//

import Foundation

class SupabaseManager: ObservableObject {
    static let shared = SupabaseManager()
    
    @Published var currentUser: SupabaseUser?
    @Published var isAuthenticated = false
    
    private init() {
        checkSession()
    }
    
    // MARK: - Session Management（硬编码模式）
    
    private func checkSession() {
        // 检查 UserDefaults 中的登录状态
        if UserDefaults.standard.bool(forKey: "isLoggedIn") {
            isAuthenticated = true
            currentUser = SupabaseUser(
                id: UserDefaults.standard.string(forKey: "userId") ?? "demo-001",
                email: UserDefaults.standard.string(forKey: "userEmail") ?? "demo@antianxiety.com",
                name: UserDefaults.standard.string(forKey: "userName") ?? "演示用户",
                avatarUrl: nil,
                aiSettings: nil
            )
        }
    }
    
    // MARK: - Sign In（硬编码模式）
    
    func signIn(email: String, password: String) async throws {
        // 模拟网络延迟
        try await Task.sleep(nanoseconds: 500_000_000)
        
        // 硬编码验证
        UserDefaults.standard.set(true, forKey: "isLoggedIn")
        UserDefaults.standard.set(email, forKey: "userEmail")
        UserDefaults.standard.set(UUID().uuidString, forKey: "userId")
        
        await MainActor.run {
            self.isAuthenticated = true
            self.currentUser = SupabaseUser(
                id: UUID().uuidString,
                email: email,
                name: "用户",
                avatarUrl: nil,
                aiSettings: nil
            )
        }
    }
    
    // MARK: - Sign Up（硬编码模式）
    
    func signUp(email: String, password: String, name: String) async throws {
        // 模拟网络延迟
        try await Task.sleep(nanoseconds: 500_000_000)
        
        // 硬编码注册
        UserDefaults.standard.set(true, forKey: "isLoggedIn")
        UserDefaults.standard.set(email, forKey: "userEmail")
        UserDefaults.standard.set(name, forKey: "userName")
        UserDefaults.standard.set(UUID().uuidString, forKey: "userId")
        
        await MainActor.run {
            self.isAuthenticated = true
            self.currentUser = SupabaseUser(
                id: UUID().uuidString,
                email: email,
                name: name,
                avatarUrl: nil,
                aiSettings: nil
            )
        }
    }
    
    // MARK: - Sign Out
    
    func signOut() {
        UserDefaults.standard.removeObject(forKey: "isLoggedIn")
        UserDefaults.standard.removeObject(forKey: "userEmail")
        UserDefaults.standard.removeObject(forKey: "userName")
        UserDefaults.standard.removeObject(forKey: "userId")
        
        currentUser = nil
        isAuthenticated = false
    }
}

// MARK: - User Model

struct SupabaseUser: Codable, Identifiable {
    let id: String
    let email: String
    var name: String?
    var avatarUrl: String?
    var aiSettings: AISettings?
    
    struct AISettings: Codable {
        var persona: String
        var honestyLevel: Int
        var humorLevel: Int
    }
}
