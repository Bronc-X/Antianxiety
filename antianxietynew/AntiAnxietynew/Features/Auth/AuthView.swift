import SwiftUI

// MARK: - ViewModel
@MainActor
class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var error: String?
    
    func authenticate(isLogin: Bool) async {
        isLoading = true
        error = nil
        defer { isLoading = false }
        
        do {
            if isLogin {
                try await SupabaseManager.shared.signIn(email: email, password: password)
            } else {
                try await SupabaseManager.shared.signUp(email: email, password: password)
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct AuthView: View {
    @StateObject private var viewModel = AuthViewModel()
    @State private var isLogin = true
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        ZStack {
            // 背景
            FluidBackground()
            
            VStack(spacing: 32) {
                Spacer()
                
                // Logo
                VStack(spacing: 16) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 80))
                        .foregroundColor(.liquidGlassAccent)
                        .shadow(color: .liquidGlassAccent.opacity(0.5), radius: 20)
                    
                    Text("AntiAnxiety")
                        .font(.system(.largeTitle, design: .serif).bold())
                        .foregroundColor(.white)
                    
                    Text("用真相打破焦虑")
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)
                }
                
                // 表单
                LiquidGlassCard(style: .elevated, padding: 24) {
                    VStack(spacing: 24) {
                        // 标题切换
                        HStack {
                            Button { withAnimation { isLogin = true } } label: {
                                Text("登录")
                                    .font(.title3.bold())
                                    .foregroundColor(isLogin ? .white : .textTertiary)
                            }
                            
                            Text("/")
                                .foregroundColor(.textTertiary)
                            
                            Button { withAnimation { isLogin = false } } label: {
                                Text("注册")
                                    .font(.title3.bold())
                                    .foregroundColor(!isLogin ? .white : .textTertiary)
                            }
                        }
                        .padding(.bottom, 8)
                        
                        TextField("邮箱", text: $viewModel.email)
                            .textFieldStyle(.plain)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .padding()
                            .background(Color.bgSecondary.opacity(0.5))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .foregroundColor(.white)
                        
                        SecureField("密码", text: $viewModel.password)
                            .textFieldStyle(.plain)
                            .textContentType(isLogin ? .password : .newPassword)
                            .padding()
                            .background(Color.bgSecondary.opacity(0.5))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .foregroundColor(.white)
                        
                        if let error = viewModel.error {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.statusError)
                                .multilineTextAlignment(.center)
                        }
                        
                        Button {
                            Task {
                                await viewModel.authenticate(isLogin: isLogin)
                            }
                        } label: {
                            if viewModel.isLoading {
                                ProgressView()
                                    .tint(.black)
                            } else {
                                Text(isLogin ? "立即登录" : "创建账号")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
                        .disabled(viewModel.isLoading || viewModel.email.isEmpty || viewModel.password.isEmpty)
                    }
                }
                .padding(.top, 20)
                
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.horizontal, metrics.horizontalPadding)
        }
    }
}

struct AuthView_Previews: PreviewProvider {
    static var previews: some View {
        AuthView()
    }
}
