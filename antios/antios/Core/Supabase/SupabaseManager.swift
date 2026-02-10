//
//  SupabaseManager.swift
//  antios
//
//  Supabase 认证和数据管理
//

import Foundation

class SupabaseManager: ObservableObject {
    static let shared = SupabaseManager()
    
    @Published var currentUser: SupabaseUser?
    @Published var isAuthenticated = false
    
    private init() {
        checkSession()
    }
    
    // MARK: - Session Management
    
    private func checkSession() {
        if let token = KeychainService.shared.load(for: .accessToken),
           let userId = KeychainService.shared.load(for: .userId) {
            APIClient.shared.setAuthToken(token)
            isAuthenticated = true
            Task {
                await fetchUserProfile(userId: userId)
            }
        }
    }
    
    // MARK: - Sign In
    
    func signIn(email: String, password: String) async throws {
        struct SignInRequest: Encodable {
            let email: String
            let password: String
        }
        
        struct SignInResponse: Decodable {
            let accessToken: String
            let refreshToken: String
            let user: UserResponse
        }
        
        struct UserResponse: Decodable {
            let id: String
            let email: String
            let name: String?
        }
        
        let response: SignInResponse = try await APIClient.shared.request(
            endpoint: "auth/login",
            method: .post,
            body: SignInRequest(email: email, password: password)
        )
        
        KeychainService.shared.save(response.accessToken, for: .accessToken)
        KeychainService.shared.save(response.refreshToken, for: .refreshToken)
        KeychainService.shared.save(response.user.id, for: .userId)
        
        APIClient.shared.setAuthToken(response.accessToken)
        
        await MainActor.run {
            self.isAuthenticated = true
            self.currentUser = SupabaseUser(
                id: response.user.id,
                email: response.user.email,
                name: response.user.name,
                avatarUrl: nil,
                aiSettings: nil
            )
        }
        
        await fetchUserProfile(userId: response.user.id)
    }
    
    // MARK: - Sign Up
    
    func signUp(email: String, password: String, name: String) async throws {
        struct SignUpRequest: Encodable {
            let email: String
            let password: String
            let name: String
        }

        struct UserResponse: Decodable {
            let id: String
            let email: String
            let name: String?
        }
        
        struct SignUpResponse: Decodable {
            let accessToken: String
            let refreshToken: String
            let user: UserResponse
        }

        let response: SignUpResponse = try await APIClient.shared.request(
            endpoint: "auth/register",
            method: .post,
            body: SignUpRequest(email: email, password: password, name: name)
        )

        KeychainService.shared.save(response.accessToken, for: .accessToken)
        KeychainService.shared.save(response.refreshToken, for: .refreshToken)
        KeychainService.shared.save(response.user.id, for: .userId)
        APIClient.shared.setAuthToken(response.accessToken)

        await MainActor.run {
            self.isAuthenticated = true
            self.currentUser = SupabaseUser(
                id: response.user.id,
                email: response.user.email,
                name: response.user.name,
                avatarUrl: nil,
                aiSettings: nil
            )
        }

        await fetchUserProfile(userId: response.user.id)
    }
    
    // MARK: - Sign Out
    
    func signOut() {
        KeychainService.shared.clearAll()
        APIClient.shared.setAuthToken(nil)
        
        currentUser = nil
        isAuthenticated = false
    }
    
    // MARK: - Fetch Profile
    
    private func fetchUserProfile(userId: String) async {
        do {
            let user: SupabaseUser = try await APIClient.shared.request(
                endpoint: "user/profile",
                method: .get
            )
            
            await MainActor.run {
                self.currentUser = user
            }
        } catch {
            print("获取用户资料失败: \(error)")
        }
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
