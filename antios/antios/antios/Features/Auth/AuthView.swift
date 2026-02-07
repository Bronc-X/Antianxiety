//
//  AuthView.swift
//  antios
//
//  A1: 登录/注册视图
//

import SwiftUI
import AuthenticationServices

struct AuthView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    
    var body: some View {
        ZStack {
            AppTheme.Colors.backgroundDark
                .ignoresSafeArea()
            
            VStack(spacing: AppTheme.Spacing.xl) {
                // Logo
                VStack(spacing: AppTheme.Spacing.md) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 60))
                        .foregroundStyle(AppTheme.Colors.primaryGradient)
                    
                    Text("Antianxiety")
                        .font(AppTheme.Typography.title)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Text("你的智能健康助手")
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
                .padding(.top, AppTheme.Spacing.xxl)
                
                Spacer()
                
                // Form
                VStack(spacing: AppTheme.Spacing.md) {
                    if isSignUp {
                        TextField("姓名", text: $name)
                            .textFieldStyle(AuthTextFieldStyle())
                    }
                    
                    TextField("邮箱", text: $email)
                        .textFieldStyle(AuthTextFieldStyle())
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    
                    SecureField("密码", text: $password)
                        .textFieldStyle(AuthTextFieldStyle())
                    
                    if let error = authManager.errorMessage {
                        Text(error)
                            .font(AppTheme.Typography.caption)
                            .foregroundColor(AppTheme.Colors.error)
                    }
                    
                    Button {
                        Task {
                            if isSignUp {
                                await authManager.signUp(email: email, password: password, name: name)
                            } else {
                                await authManager.signIn(email: email, password: password)
                            }
                        }
                    } label: {
                        if authManager.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text(isSignUp ? "注册" : "登录")
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(authManager.isLoading)
                }
                
                // Divider
                HStack {
                    Rectangle()
                        .fill(AppTheme.Colors.textTertiary.opacity(0.3))
                        .frame(height: 1)
                    
                    Text("或")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textTertiary)
                    
                    Rectangle()
                        .fill(AppTheme.Colors.textTertiary.opacity(0.3))
                        .frame(height: 1)
                }
                
                // Apple Sign In
                SignInWithAppleButton(.signIn) { request in
                    request.requestedScopes = [.fullName, .email]
                } onCompletion: { result in
                    authManager.handleAppleSignIn(result)
                }
                .signInWithAppleButtonStyle(.white)
                .frame(height: 50)
                .cornerRadius(AppTheme.CornerRadius.md)
                
                // Toggle
                Button {
                    withAnimation {
                        isSignUp.toggle()
                    }
                } label: {
                    Text(isSignUp ? "已有账号？登录" : "没有账号？注册")
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.primary)
                }
                
                Spacer()
            }
            .padding(AppTheme.Spacing.lg)
        }
    }
}

struct AuthTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(AppTheme.Spacing.md)
            .background(AppTheme.Colors.backgroundCard)
            .cornerRadius(AppTheme.CornerRadius.md)
            .foregroundColor(AppTheme.Colors.textPrimary)
    }
}

