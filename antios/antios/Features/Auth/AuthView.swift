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
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        ZStack {
            FluidBackground()
                .ignoresSafeArea()
            
            VStack(spacing: AppTheme.Spacing.lg) {
                // Logo
                VStack(spacing: AppTheme.Spacing.md) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 72, weight: .semibold))
                        .foregroundStyle(AppTheme.Colors.primaryGradient)
                        .shadow(color: AppTheme.Colors.primary.opacity(0.5), radius: 18)
                    
                    Text("Antianxiety")
                        .font(.system(.largeTitle, design: .serif).bold())
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Text("你的智能健康助手")
                        .font(AppTheme.Typography.subheadline)
                        .foregroundColor(AppTheme.Colors.textSecondary)
                }
                .padding(.top, AppTheme.Spacing.xxl)
                
                Spacer()
                
                // Form
                VStack(spacing: AppTheme.Spacing.md) {
                    LiquidGlassCard(style: .elevated, padding: 24) {
                        VStack(spacing: 16) {
                            HStack {
                                Button {
                                    withAnimation {
                                        isSignUp = false
                                    }
                                } label: {
                                    Text("登录")
                                        .font(.title3.bold())
                                        .foregroundColor(!isSignUp ? .textPrimary : .textTertiary)
                                }

                                Text("/")
                                    .foregroundColor(.textTertiary)

                                Button {
                                    withAnimation {
                                        isSignUp = true
                                    }
                                } label: {
                                    Text("注册")
                                        .font(.title3.bold())
                                        .foregroundColor(isSignUp ? .textPrimary : .textTertiary)
                                }
                            }
                            .padding(.bottom, 4)

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
                                    .frame(maxWidth: .infinity, alignment: .leading)
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
                                    Text(isSignUp ? "创建账号" : "立即登录")
                                }
                            }
                            .buttonStyle(PrimaryButtonStyle())
                            .disabled(authManager.isLoading)
                        }
                    }

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

                    SignInWithAppleButton(.signIn) { request in
                        request.requestedScopes = [.fullName, .email]
                    } onCompletion: { result in
                        authManager.handleAppleSignIn(result)
                    }
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 50)
                    .cornerRadius(AppTheme.CornerRadius.md)
                    .disabled(authManager.isLoading)

                    Button {
                        withAnimation {
                            isSignUp.toggle()
                        }
                    } label: {
                        Text(isSignUp ? "已有账号？登录" : "没有账号？注册")
                            .font(AppTheme.Typography.subheadline)
                            .foregroundColor(AppTheme.Colors.primary)
                    }
                }
                .padding(.horizontal, metrics.horizontalPadding)
                
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
            .background {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.md, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.md, style: .continuous)
                            .stroke(Color.white.opacity(0.15), lineWidth: 1)
                    )
            }
            .foregroundColor(AppTheme.Colors.textPrimary)
    }
}

struct AuthView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    AuthView()
        .environmentObject(AuthManager())
    }
}
