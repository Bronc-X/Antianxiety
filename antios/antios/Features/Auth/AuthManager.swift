//
//  AuthManager.swift
//  antios
//
//  认证管理 - 邮箱登录 + Apple Sign-In
//

import SwiftUI
import AuthenticationServices

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let supabase = SupabaseManager.shared
    
    init() {
        isAuthenticated = supabase.isAuthenticated
    }
    
    // MARK: - Email Sign In
    
    func signIn(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await supabase.signIn(email: email, password: password)
            isAuthenticated = true
        } catch {
            if applyTemporaryAuthBypassIfNeeded(error) {
                isLoading = false
                return
            }
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    // MARK: - Email Sign Up
    
    func signUp(email: String, password: String, name: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await supabase.signUp(email: email, password: password, name: name)
            isAuthenticated = true
        } catch {
            if applyTemporaryAuthBypassIfNeeded(error) {
                isLoading = false
                return
            }
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    // MARK: - Apple Sign In
    
    func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            if let credential = auth.credential as? ASAuthorizationAppleIDCredential {
                Task {
                    await processAppleCredential(credential)
                }
            }
        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }
    
    private func processAppleCredential(_ credential: ASAuthorizationAppleIDCredential) async {
        isLoading = true
        
        guard let identityToken = credential.identityToken,
              let tokenString = String(data: identityToken, encoding: .utf8) else {
            errorMessage = "无法获取 Apple 凭证"
            isLoading = false
            return
        }
        
        struct AppleSignInRequest: Encodable {
            let idToken: String
            let fullName: String?
        }
        
        let fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
            .compactMap { $0 }
            .joined(separator: " ")
        
        do {
            let _: EmptyResponse = try await APIClient.shared.request(
                endpoint: "auth/apple",
                method: .post,
                body: AppleSignInRequest(
                    idToken: tokenString,
                    fullName: fullName.isEmpty ? nil : fullName
                )
            )
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    // MARK: - Sign Out
    
    func signOut() {
        supabase.signOut()
        isAuthenticated = false
    }

    // Pseudocode-style temporary workaround:
    // IF local auth API returns 404 or connection-refused
    // THEN mark user authenticated to unblock homepage preview/testing.
    private func applyTemporaryAuthBypassIfNeeded(_ error: Error) -> Bool {
        #if DEBUG
        if isLocalAuthUnavailable(error) {
            isAuthenticated = true
            errorMessage = nil
            return true
        }
        #endif
        return false
    }

    private func isLocalAuthUnavailable(_ error: Error) -> Bool {
        if let apiError = error as? APIError,
           case .httpError(let code) = apiError,
           code == 404 {
            return true
        }

        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == -1004 {
            return true
        }

        let text = error.localizedDescription.lowercased()
        if text.contains("could not connect to the server") || text.contains("connection refused") {
            return true
        }

        return false
    }
}
