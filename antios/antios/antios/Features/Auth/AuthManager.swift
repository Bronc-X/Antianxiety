//
//  AuthManager.swift
//  antios
//
//  认证管理 - 硬编码模式（不连接后端）
//

import SwiftUI
import AuthenticationServices

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var currentUser: MockUser?
    
    init() {
        // 启动时检查是否已登录（从 UserDefaults 读取）
        if UserDefaults.standard.bool(forKey: "isLoggedIn") {
            isAuthenticated = true
            currentUser = MockUser.demo
        }
    }
    
    // MARK: - Email Sign In（硬编码模式）
    
    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        // 模拟网络延迟
        try? await Task.sleep(nanoseconds: 500_000_000)
        
        // 硬编码验证：任何非空邮箱和密码都可以登录
        if !email.isEmpty && !password.isEmpty {
            UserDefaults.standard.set(true, forKey: "isLoggedIn")
            UserDefaults.standard.set(email, forKey: "userEmail")
            currentUser = MockUser(id: UUID().uuidString, email: email, name: "测试用户")
            isAuthenticated = true
        } else {
            errorMessage = "请输入邮箱和密码"
        }
        
        isLoading = false
    }
    
    // MARK: - Email Sign Up（硬编码模式）
    
    func signUp(email: String, password: String, name: String) async {
        isLoading = true
        errorMessage = nil
        
        // 模拟网络延迟
        try? await Task.sleep(nanoseconds: 500_000_000)
        
        // 硬编码注册：任何非空输入都可以注册
        if !email.isEmpty && !password.isEmpty && !name.isEmpty {
            UserDefaults.standard.set(true, forKey: "isLoggedIn")
            UserDefaults.standard.set(email, forKey: "userEmail")
            UserDefaults.standard.set(name, forKey: "userName")
            currentUser = MockUser(id: UUID().uuidString, email: email, name: name)
            isAuthenticated = true
        } else {
            errorMessage = "请填写所有字段"
        }
        
        isLoading = false
    }
    
    // MARK: - Apple Sign In（硬编码模式）
    
    func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            if let credential = auth.credential as? ASAuthorizationAppleIDCredential {
                let fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
                    .compactMap { $0 }
                    .joined(separator: " ")
                
                let email = credential.email ?? "apple_user@example.com"
                
                UserDefaults.standard.set(true, forKey: "isLoggedIn")
                UserDefaults.standard.set(email, forKey: "userEmail")
                UserDefaults.standard.set(fullName.isEmpty ? "Apple 用户" : fullName, forKey: "userName")
                
                currentUser = MockUser(
                    id: credential.user,
                    email: email,
                    name: fullName.isEmpty ? "Apple 用户" : fullName
                )
                isAuthenticated = true
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Sign Out
    
    func signOut() {
        UserDefaults.standard.removeObject(forKey: "isLoggedIn")
        UserDefaults.standard.removeObject(forKey: "userEmail")
        UserDefaults.standard.removeObject(forKey: "userName")
        currentUser = nil
        isAuthenticated = false
    }
}

// MARK: - Mock User Model

struct MockUser: Identifiable {
    let id: String
    let email: String
    var name: String
    
    static let demo = MockUser(
        id: "demo-user-001",
        email: "demo@antianxiety.com",
        name: "演示用户"
    )
}
