// SupabaseManager.swift
// Supabase 客户端管理器 - 连接现有后端

import Foundation

// MARK: - 科学期刊数据模型（主要定义位置）

/// 科学文章模型
struct ScienceArticle: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let titleZh: String?
    let summary: String?
    let summaryZh: String?
    let sourceType: String?
    let sourceUrl: String?
    let matchPercentage: Int?
    let whyRecommended: String?
    let actionableInsight: String?
    let tags: [String]?
    let createdAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, title, summary, tags
        case titleZh = "title_zh"
        case summaryZh = "summary_zh"
        case sourceType = "source_type"
        case sourceUrl = "source_url"
        case matchPercentage = "match_percentage"
        case whyRecommended = "why_recommended"
        case actionableInsight = "actionable_insight"
        case createdAt = "created_at"
    }
}

/// Feed API 响应
struct ScienceFeedResponse: Codable {
    let success: Bool?
    let items: [ScienceArticle]?
    let data: [ScienceArticle]?
    let personalization: FeedPersonalization?
    
    var articles: [ScienceArticle] { items ?? data ?? [] }
}

/// 个性化信息
struct FeedPersonalization: Codable {
    let ready: Bool?
    let message: String?
    let fallback: String?
}

/// Feed 反馈输入
struct FeedFeedbackInput: Codable {
    let contentId: String
    let contentUrl: String?
    let contentTitle: String?
    let source: String?
    let feedbackType: String
    
    enum CodingKeys: String, CodingKey {
        case contentId = "content_id"
        case contentUrl = "content_url"
        case contentTitle = "content_title"
        case source
        case feedbackType = "feedback_type"
    }
}

// MARK: - Supabase 配置 (从 Info.plist 读取，由 xcconfig 注入)
private enum SupabaseConfig {
    static var url: URL {
        guard let urlString = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String,
              let url = URL(string: urlString.replacingOccurrences(of: "\\", with: "")) else {
            fatalError("Missing SUPABASE_URL in Info.plist. Please configure Secrets.xcconfig.")
        }
        return url
    }
    
    static var anonKey: String {
        guard let key = Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String else {
            fatalError("Missing SUPABASE_ANON_KEY in Info.plist. Please configure Secrets.xcconfig.")
        }
        return key
    }
}

// MARK: - Supabase Manager
@MainActor
final class SupabaseManager: ObservableObject, SupabaseManaging {
    static let shared = SupabaseManager()
    
    @Published var currentUser: AuthUser?
    @Published var isAuthenticated = false
    @Published var isSessionRestored = false
    @Published var isClinicalComplete = false
    
    private init() {
        // 初始化时检查会话
        Task {
            await checkSession()
        }
    }
    
    // MARK: - 认证方法
    
    func signUp(email: String, password: String) async throws {
        let url = SupabaseConfig.url.appendingPathComponent("auth/v1/signup")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }
        
        if (200...299).contains(httpResponse.statusCode) {
            // 注册成功后通常会自动登录或返回 token (取决于 Supabase 设置：Confirm Email)
            // 如果后端设置为不需要验证邮箱，则直接解析并登录
            if let authResponse = try? JSONDecoder().decode(AuthResponse.self, from: data) {
                UserDefaults.standard.set(authResponse.accessToken, forKey: "supabase_access_token")
                UserDefaults.standard.set(authResponse.refreshToken, forKey: "supabase_refresh_token")
                currentUser = authResponse.user
                isAuthenticated = true
                await ensureProfileRow()
                await checkClinicalStatus()
            } else {
                // 如果需要验证邮箱，可能只返回 User 信息而无 Token
                // 这里暂时假设需要登录，或者提示用户去验证邮箱
                // 为了简单起见，我们尝试解析，如果失败则视为需验证
                
            // 自动尝试登录
                try await signIn(email: email, password: password)
            }
        } else {
            // 尝试解析错误信息
            if let errorDict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = errorDict["msg"] as? String {
                throw NSError(domain: "SupabaseError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: msg])
            }
            throw SupabaseError.authenticationFailed
        }
    }
    
    func signIn(email: String, password: String) async throws {
        // Supabase Auth API: POST /auth/v1/token?grant_type=password
        var components = URLComponents(url: SupabaseConfig.url.appendingPathComponent("auth/v1/token"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "grant_type", value: "password")]
        
        var request = URLRequest(url: components.url!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // Debug: Print response for troubleshooting
        if let responseString = String(data: data, encoding: .utf8) {
            print("Supabase Auth Response: \(responseString)")
        }
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.authenticationFailed
        }
        
        if httpResponse.statusCode == 200 {
            let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
            
            // 保存 token
            UserDefaults.standard.set(authResponse.accessToken, forKey: "supabase_access_token")
            UserDefaults.standard.set(authResponse.refreshToken, forKey: "supabase_refresh_token")
            
            currentUser = authResponse.user
            
            // 先检查临床量表状态，确保在 UI 渲染前完成
            await ensureProfileRow()
            await checkClinicalStatus()
            
            // 最后设置认证状态，触发 UI 更新
            isAuthenticated = true
        } else {
            // 尝试解析错误信息
            if let errorDict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let errorMessage = errorDict["error_description"] as? String
                    ?? errorDict["msg"] as? String
                    ?? errorDict["message"] as? String
                    ?? "登录失败"
                throw NSError(domain: "SupabaseError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage])
            }
            throw SupabaseError.authenticationFailed
        }
    }
    
    func signOut() async {
        UserDefaults.standard.removeObject(forKey: "supabase_access_token")
        UserDefaults.standard.removeObject(forKey: "supabase_refresh_token")
        currentUser = nil
        currentUser = nil
        isAuthenticated = false
        isClinicalComplete = false
    }
    
    func checkSession() async {
        guard let token = UserDefaults.standard.string(forKey: "supabase_access_token") else {
            isAuthenticated = false
            isSessionRestored = true
            return
        }
        
        // 验证 token 是否有效
        do {
            let user = try await getUser(token: token)
            currentUser = user
            currentUser = user
            isAuthenticated = true
            // 检查临床量表状态
            await ensureProfileRow()
            await checkClinicalStatus()
        } catch {
            // Token 无效，尝试刷新
            print("[SupabaseManager] access_token 无效，尝试刷新...")
            do {
                try await refreshSession()
                print("[SupabaseManager] ✅ Token 刷新成功")
            } catch {
                print("[SupabaseManager] ❌ Token 刷新失败: \(error)")
                print("[SupabaseManager] ❌ Token 刷新失败: \(error)")
                isAuthenticated = false
                isClinicalComplete = false
            }
        }
        isSessionRestored = true
    }
    
    /// 使用 refresh_token 刷新会话
    func refreshSession() async throws {
        guard let refreshToken = UserDefaults.standard.string(forKey: "supabase_refresh_token") else {
            throw SupabaseError.notAuthenticated
        }
        
        let url = SupabaseConfig.url.appendingPathComponent("auth/v1/token")
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "grant_type", value: "refresh_token")]
        
        var request = URLRequest(url: components.url!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        
        let body = ["refresh_token": refreshToken]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw SupabaseError.authenticationFailed
        }
        
        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
        
        // 保存新 token
        UserDefaults.standard.set(authResponse.accessToken, forKey: "supabase_access_token")
        UserDefaults.standard.set(authResponse.refreshToken, forKey: "supabase_refresh_token")
        
        currentUser = authResponse.user
        currentUser = authResponse.user
        isAuthenticated = true
        // 刷新会话也检查临床状态
        Task {
            await ensureProfileRow()
            await checkClinicalStatus()
        }
    }

    
    private func getUser(token: String) async throws -> AuthUser {
        let url = SupabaseConfig.url.appendingPathComponent("auth/v1/user")
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(AuthUser.self, from: data)
    }
    
    // MARK: - API 请求辅助

    private func ensureAccessToken() async throws -> String {
        if let token = UserDefaults.standard.string(forKey: "supabase_access_token"), !token.isEmpty {
            return token
        }

        try await refreshSession()
        guard let refreshed = UserDefaults.standard.string(forKey: "supabase_access_token"), !refreshed.isEmpty else {
            throw SupabaseError.notAuthenticated
        }
        return refreshed
    }

    private func buildRestURL(endpoint: String) -> URL? {
        var endpointPath = endpoint
        var query: String?

        if let queryIndex = endpoint.firstIndex(of: "?") {
            endpointPath = String(endpoint[..<queryIndex])
            let nextIndex = endpoint.index(after: queryIndex)
            query = nextIndex < endpoint.endIndex ? String(endpoint[nextIndex...]) : nil
        }

        let baseURL = SupabaseConfig.url
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)
        let basePath = components?.path ?? ""
        let trimmedBasePath = basePath.hasSuffix("/") ? String(basePath.dropLast()) : basePath
        let trimmedEndpointPath = endpointPath.hasPrefix("/") ? String(endpointPath.dropFirst()) : endpointPath
        components?.path = "\(trimmedBasePath)/rest/v1/\(trimmedEndpointPath)"
        if let query {
            components?.percentEncodedQuery = query
        }
        return components?.url
    }
    
    func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil,
        prefer: String? = nil
    ) async throws -> T {
        let token = try await ensureAccessToken()
        
        guard let url = buildRestURL(endpoint: endpoint) else {
            throw SupabaseError.requestFailed
        }
        print("[SupabaseManager.request] URL: \(url.absoluteString)")
        print("[SupabaseManager.request] Method: \(method)")
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let prefer = prefer {
            request.setValue(prefer, forHTTPHeaderField: "Prefer")
        } else if method != "GET" {
            request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse {
            print("[SupabaseManager.request] Status: \(httpResponse.statusCode)")
            if let responseStr = String(data: data, encoding: .utf8) {
                print("[SupabaseManager.request] Response: \(responseStr.prefix(500))")
            }
        }

        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 401 {
            try await refreshSession()
            let retryToken = try await ensureAccessToken()
            var retryRequest = request
            retryRequest.setValue("Bearer \(retryToken)", forHTTPHeaderField: "Authorization")
            let (retryData, retryResponse) = try await URLSession.shared.data(for: retryRequest)
            guard let retryHttp = retryResponse as? HTTPURLResponse, (200...299).contains(retryHttp.statusCode) else {
                throw SupabaseError.requestFailed
            }
            return try JSONDecoder().decode(T.self, from: retryData)
        }

        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw SupabaseError.requestFailed
        }

        return try JSONDecoder().decode(T.self, from: data)
    }

    func requestVoid(
        _ endpoint: String,
        method: String = "POST",
        body: Encodable? = nil,
        prefer: String? = nil
    ) async throws {
        let token = try await ensureAccessToken()

        guard let url = buildRestURL(endpoint: endpoint) else {
            throw SupabaseError.requestFailed
        }
        print("[SupabaseManager.requestVoid] URL: \(url.absoluteString)")
        print("[SupabaseManager.requestVoid] Method: \(method)")
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let prefer = prefer {
            request.setValue(prefer, forHTTPHeaderField: "Prefer")
        } else if method != "GET" {
            request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        }

        if let body = body {
            let bodyData = try JSONEncoder().encode(body)
            request.httpBody = bodyData
            if let bodyStr = String(data: bodyData, encoding: .utf8) {
                print("[SupabaseManager.requestVoid] Body: \(bodyStr)")
            }
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse {
            print("[SupabaseManager.requestVoid] Status: \(httpResponse.statusCode)")
            if let responseStr = String(data: data, encoding: .utf8), !responseStr.isEmpty {
                print("[SupabaseManager.requestVoid] Response: \(responseStr.prefix(500))")
            }
        }
        
        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 401 {
            try await refreshSession()
            let retryToken = try await ensureAccessToken()
            var retryRequest = request
            retryRequest.setValue("Bearer \(retryToken)", forHTTPHeaderField: "Authorization")
            let (_, retryResponse) = try await URLSession.shared.data(for: retryRequest)
            guard let retryHttp = retryResponse as? HTTPURLResponse, (200...299).contains(retryHttp.statusCode) else {
                throw SupabaseError.requestFailed
            }
            return
        }
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw SupabaseError.requestFailed
        }
    }
    
    // MARK: - Chat API Methods (对话管理)

    private struct ChatConversationRow: Codable {
        let id: FlexibleId
        let user_id: String
        let role: String
        let content: String
        let session_id: String?
        let created_at: String?
    }

    private struct ChatConversationInsert: Encodable {
        let user_id: String
        let role: String
        let content: String
        let session_id: String?
    }

    private struct ChatSessionRow: Codable {
        let id: FlexibleId
        let user_id: String
        let title: String?
        let summary: String?
        let message_count: Int?
        let last_message_at: String?
        let created_at: String?
        let updated_at: String?
    }

    private struct ChatSessionInsert: Encodable {
        let user_id: String
        let title: String?
    }

    private struct ChatSessionUpdate: Encodable {
        let last_message_at: String
        let message_count: Int?

        enum CodingKeys: String, CodingKey {
            case last_message_at
            case message_count
        }

        func encode(to encoder: Encoder) throws {
            var container = encoder.container(keyedBy: CodingKeys.self)
            try container.encode(last_message_at, forKey: .last_message_at)
            if let message_count {
                try container.encode(message_count, forKey: .message_count)
            }
        }
    }
    
    /// 获取所有对话列表（优先 chat_sessions）
    func getConversations() async throws -> [Conversation] {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        do {
            let endpoint = "chat_sessions?user_id=eq.\(user.id)&select=*&order=updated_at.desc.nullsfirst"
            let sessions: [ChatSessionRow] = try await request(endpoint)
            if !sessions.isEmpty {
                return sessions.map { session in
                    Conversation(
                        id: session.id.value,
                        user_id: session.user_id,
                        title: session.title ?? "新对话",
                        last_message_at: session.last_message_at ?? session.updated_at,
                        message_count: session.message_count,
                        created_at: session.created_at
                    )
                }
            }
        } catch {
            do {
                let endpoint = "chat_sessions?user_id=eq.\(user.id)&select=*&order=created_at.desc.nullsfirst"
                let sessions: [ChatSessionRow] = try await request(endpoint)
                if !sessions.isEmpty {
                    return sessions.map { session in
                        Conversation(
                            id: session.id.value,
                            user_id: session.user_id,
                            title: session.title ?? "新对话",
                            last_message_at: session.last_message_at ?? session.created_at,
                            message_count: session.message_count,
                            created_at: session.created_at
                        )
                    }
                }
            } catch {
                // fall through
            }
        }
        return try await getChatConversationsFallback(userId: user.id)
    }
    
    /// 创建新对话（优先 chat_sessions）
    func createConversation(title: String = "新对话") async throws -> Conversation {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        do {
            let body = ChatSessionInsert(user_id: user.id, title: title)
            let endpoint = "chat_sessions"
            let results: [ChatSessionRow] = try await request(endpoint, method: "POST", body: body, prefer: "return=representation")
            guard let session = results.first else {
                throw SupabaseError.requestFailed
            }
            return Conversation(
                id: session.id.value,
                user_id: session.user_id,
                title: session.title ?? title,
                last_message_at: session.last_message_at,
                message_count: session.message_count,
                created_at: session.created_at
            )
        } catch {
            let sessionId = UUID().uuidString
            return Conversation(
                id: sessionId,
                user_id: user.id,
                title: title,
                last_message_at: nil,
                message_count: nil,
                created_at: ISO8601DateFormatter().string(from: Date())
            )
        }
    }
    
    /// 获取对话历史消息（chat_conversations）
    func getChatHistory(conversationId: String) async throws -> [ChatMessageDTO] {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        if isUUID(conversationId) {
            let endpoint = "chat_conversations?user_id=eq.\(user.id)&session_id=eq.\(conversationId)&select=*&order=created_at.asc"
            let rows: [ChatConversationRow] = try await request(endpoint)
            return rows.map { row in
                ChatMessageDTO(
                    id: row.id.value,
                    conversation_id: conversationId,
                    role: row.role,
                    content: row.content,
                    created_at: row.created_at
                )
            }
        }

        let endpoint = "chat_conversations?user_id=eq.\(user.id)&session_id=is.null&select=*&order=created_at.asc"
        let rows: [ChatConversationRow] = try await request(endpoint)
        return rows.map { row in
            ChatMessageDTO(
                id: row.id.value,
                conversation_id: conversationId,
                role: row.role,
                content: row.content,
                created_at: row.created_at
            )
        }
    }
    
    /// 追加消息到对话（chat_conversations）
    func appendMessage(conversationId: String, role: String, content: String) async throws -> ChatMessageDTO {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        let endpoint = "chat_conversations"

        if isUUID(conversationId) {
            do {
                let body = ChatConversationInsert(user_id: user.id, role: role, content: content, session_id: conversationId)
                let results: [ChatConversationRow] = try await request(endpoint, method: "POST", body: body, prefer: "return=representation")
                guard let row = results.first else { throw SupabaseError.requestFailed }
                try? await updateChatSessionStats(sessionId: conversationId)
                return ChatMessageDTO(
                    id: row.id.value,
                    conversation_id: conversationId,
                    role: row.role,
                    content: row.content,
                    created_at: row.created_at
                )
            } catch {
                // session_id 外键失败时回退为无 session
                let body = ChatConversationInsert(user_id: user.id, role: role, content: content, session_id: nil)
                let results: [ChatConversationRow] = try await request(endpoint, method: "POST", body: body, prefer: "return=representation")
                guard let row = results.first else { throw SupabaseError.requestFailed }
                return ChatMessageDTO(
                    id: row.id.value,
                    conversation_id: conversationId,
                    role: row.role,
                    content: row.content,
                    created_at: row.created_at
                )
            }
        }

        let body = ChatConversationInsert(user_id: user.id, role: role, content: content, session_id: nil)
        let results: [ChatConversationRow] = try await request(endpoint, method: "POST", body: body, prefer: "return=representation")
        guard let row = results.first else { throw SupabaseError.requestFailed }
        return ChatMessageDTO(
            id: row.id.value,
            conversation_id: conversationId,
            role: row.role,
            content: row.content,
            created_at: row.created_at
        )
    }
    
    /// 删除对话
    func deleteConversation(conversationId: String) async throws {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        if isUUID(conversationId) {
            let messagesEndpoint = "chat_conversations?user_id=eq.\(user.id)&session_id=eq.\(conversationId)"
            try await requestVoid(messagesEndpoint, method: "DELETE")
            let sessionEndpoint = "chat_sessions?id=eq.\(conversationId)"
            try await requestVoid(sessionEndpoint, method: "DELETE")
        }
    }

    private func getChatConversationsFallback(userId: String) async throws -> [Conversation] {
        let rows: [ChatConversationRow]
        do {
            let endpoint = "chat_conversations?user_id=eq.\(userId)&select=id,session_id,role,content,created_at&order=created_at.desc&limit=200"
            rows = try await request(endpoint)
        } catch {
            let endpoint = "chat_conversations?user_id=eq.\(userId)&select=id,role,content,created_at&order=created_at.desc&limit=200"
            rows = try await request(endpoint)
        }
        if rows.isEmpty {
            return []
        }

        var seen: Set<String> = []
        var conversations: [Conversation] = []
        let formatter = ISO8601DateFormatter()

        for row in rows {
            let sessionId = row.session_id ?? "default"
            guard !seen.contains(sessionId) else { continue }
            seen.insert(sessionId)

            let title = row.role == "user" ? String(row.content.prefix(20)) : "新对话"
            let lastMessageAt = row.created_at
            let createdAt = row.created_at ?? formatter.string(from: Date())

            conversations.append(
                Conversation(
                    id: sessionId,
                    user_id: userId,
                    title: title.isEmpty ? "新对话" : title,
                    last_message_at: lastMessageAt,
                    message_count: nil,
                    created_at: createdAt
                )
            )
        }

        return conversations
    }

    private func updateChatSessionStats(sessionId: String) async throws {
        let now = ISO8601DateFormatter().string(from: Date())
        let body = ChatSessionUpdate(last_message_at: now, message_count: nil)
        let endpoint = "chat_sessions?id=eq.\(sessionId)"
        try await requestVoid(endpoint, method: "PATCH", body: body)
    }
    
    // MARK: - Dashboard API Methods
    
    /// 获取最近 7 天的健康日志
    func getWeeklyWellnessLogs() async throws -> [WellnessLog] {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        
        let calendar = Calendar.current
        let sevenDaysAgo = calendar.date(byAdding: .day, value: -7, to: Date())!
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        let dateString = dateFormatter.string(from: sevenDaysAgo)
        
        let endpoint = "daily_wellness_logs?user_id=eq.\(user.id)&log_date=gte.\(dateString)&select=*&order=log_date.desc"
        return try await request(endpoint)
    }

    /// 获取最近 30 天的健康日志
    func getMonthlyWellnessLogs() async throws -> [WellnessLog] {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let calendar = Calendar.current
        let thirtyDaysAgo = calendar.date(byAdding: .day, value: -30, to: Date())!
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        let dateString = dateFormatter.string(from: thirtyDaysAgo)

        let endpoint = "daily_wellness_logs?user_id=eq.\(user.id)&log_date=gte.\(dateString)&select=*&order=log_date.desc"
        return try await request(endpoint)
    }

    private struct FlexibleDouble: Codable {
        let value: Double

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if let doubleValue = try? container.decode(Double.self) {
                value = doubleValue
            } else if let intValue = try? container.decode(Int.self) {
                value = Double(intValue)
            } else if let stringValue = try? container.decode(String.self), let parsed = Double(stringValue) {
                value = parsed
            } else {
                value = 0
            }
        }
    }

    private struct DigitalTwinProfileRow: Codable {
        let id: String
        let inferred_scale_scores: [String: FlexibleDouble]?
        let age: Int?
        let gender: String?
        let full_name: String?
        let primary_goal: String?
        let created_at: String?
    }

    private func loadDigitalTwinLocalInput() async throws -> DigitalTwinLocalInput {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let profileEndpoint = "profiles?id=eq.\(user.id)&select=id,inferred_scale_scores,age,gender,full_name,primary_goal,created_at&limit=1"
        let profileRows: [DigitalTwinProfileRow] = (try? await request(profileEndpoint)) ?? []
        let profileRow = profileRows.first

        let scores = profileRow?.inferred_scale_scores
        let gad7 = Int(scores?["gad7"]?.value ?? 0)
        let phq9 = Int(scores?["phq9"]?.value ?? 0)
        let isi = Int(scores?["isi"]?.value ?? 0)
        let pss10 = Int(scores?["pss10"]?.value ?? 0)
        let baseline: BaselineScores? = (gad7 + phq9 + isi + pss10) > 0
            ? BaselineScores(gad7: gad7, phq9: phq9, isi: isi, pss10: pss10)
            : nil

        let logs = (try? await getMonthlyWellnessLogs()) ?? []
        let registrationDate = profileRow?.created_at ?? ISO8601DateFormatter().string(from: Date())
        let profile = ProfileSnapshot(
            age: profileRow?.age,
            gender: profileRow?.gender,
            primaryGoal: profileRow?.primary_goal,
            registrationDate: registrationDate,
            fullName: profileRow?.full_name
        )

        return DigitalTwinLocalInput(
            userId: user.id,
            baselineScores: baseline,
            logs: logs,
            profile: profile,
            now: Date()
        )
    }
    
    /// 获取最新的数字孪生分析结果
    func getDigitalTwinAnalysis() async throws -> DigitalTwinAnalysis? {
        let input = try await loadDigitalTwinLocalInput()
        return DigitalTwinLocalEngine.analysis(input: input)
    }

    /// 获取分析历史
    func getAnalysisHistory(limit: Int = 10) async throws -> [AnalysisHistoryRecord] {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let endpoint = "analysis_history?user_id=eq.\(user.id)&select=*&order=created_at.desc&limit=\(max(1, limit))"
        return try await request(endpoint)
    }
    
    /// 获取用户统一画像
    func getUnifiedProfile() async throws -> UnifiedProfile? {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        
        let endpoint = "unified_user_profiles?user_id=eq.\(user.id)&select=*&limit=1"
        let results: [UnifiedProfile] = try await request(endpoint)
        return results.first
    }
    
    /// 获取穿戴设备健康数据
    func getHardwareData() async throws -> HardwareData? {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        
        let endpoint = "user_health_data?user_id=eq.\(user.id)&select=data_type,value,source,recorded_at&order=recorded_at.desc&limit=20"
        
        struct RawHealthData: Codable {
            let data_type: String
            let value: Double
            let source: String?
            let recorded_at: String
        }
        
        let rawData: [RawHealthData] = try await request(endpoint)
        
        if rawData.isEmpty { return nil }
        
        var hardware = HardwareData()
        
        for item in rawData {
            let point = HardwareDataPoint(value: item.value, source: item.source, recorded_at: item.recorded_at)
            switch item.data_type {
            case "hrv" where hardware.hrv == nil:
                hardware.hrv = point
            case "resting_heart_rate" where hardware.resting_heart_rate == nil:
                hardware.resting_heart_rate = point
            case "sleep_score" where hardware.sleep_score == nil:
                hardware.sleep_score = point
            case "steps" where hardware.steps == nil:
                hardware.steps = point
            case "spo2" where hardware.spo2 == nil:
                hardware.spo2 = point
            default:
                break
            }
        }
        
        return hardware
    }
    
    /// 获取完整的 Dashboard 数据（聚合调用）
    func getDashboardData() async throws -> DashboardData {
        async let profileTask = getUnifiedProfile()
        async let logsTask = getWeeklyWellnessLogs()
        async let hardwareTask = getHardwareData()

        let profile = try? await profileTask
        let logs = (try? await logsTask) ?? []
        let hardware = try? await hardwareTask
        
        return DashboardData(
            profile: profile,
            weeklyLogs: logs,
            hardwareData: hardware
        )
    }

    // MARK: - Profile / Settings

    func getProfileSettings() async throws -> ProfileSettings? {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let endpoint = "profiles?id=eq.\(user.id)&select=id,full_name,avatar_url,ai_personality,ai_persona_context,ai_settings,preferred_language,primary_goal,current_focus,inferred_scale_scores&limit=1"
        let results: [ProfileSettings] = try await request(endpoint)
        return results.first
    }

    func updateProfileSettings(_ update: ProfileSettingsUpdate) async throws -> ProfileSettings? {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let endpoint = "profiles?id=eq.\(user.id)"
        let results: [ProfileSettings] = try await request(endpoint, method: "PATCH", body: update, prefer: "return=representation")
        let updatedProfile = results.first
        
        // 如果更新后包含量表数据，更新本地状态
        if let scores = updatedProfile?.inferred_scale_scores, !scores.isEmpty {
            self.isClinicalComplete = true
        }
        
        return updatedProfile
    }

    private func ensureProfileRow() async {
        guard let user = currentUser else { return }

        do {
            let endpoint = "profiles?id=eq.\(user.id)&select=id&limit=1"
            let results: [ProfileRow] = try await request(endpoint)
            if !results.isEmpty { return }
        } catch {
            print("[SupabaseManager] ⚠️ ensureProfileRow select failed: \(error)")
        }

        do {
            let payload = ProfileUpsertPayload(id: user.id, email: user.email, inferred_scale_scores: nil)
            try await requestVoid(
                "profiles?on_conflict=id",
                method: "POST",
                body: payload,
                prefer: "resolution=merge-duplicates,return=representation"
            )
            print("[SupabaseManager] ✅ profile row ensured")
        } catch {
            print("[SupabaseManager] ⚠️ ensureProfileRow upsert failed: \(error)")
        }
    }

    func upsertClinicalScores(_ scores: [String: Int]) async throws {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let payload = ProfileUpsertPayload(id: user.id, email: user.email, inferred_scale_scores: scores)
        try await requestVoid(
            "profiles?on_conflict=id",
            method: "POST",
            body: payload,
            prefer: "resolution=merge-duplicates,return=representation"
        )
        self.isClinicalComplete = true
    }
    
    // MARK: - Clinical Status Check
    func checkClinicalStatus() async {
        print("[SupabaseManager] 开始检查临床量表状态...")
        do {
            var profile = try await getProfileSettings()
            if profile == nil {
                await ensureProfileRow()
                profile = try await getProfileSettings()
            }
            guard let profile else {
                print("[SupabaseManager] ❌ 未获取到 profile")
                self.isClinicalComplete = false
                return
            }
            print("[SupabaseManager] 获取到 profile，inferred_scale_scores = \(String(describing: profile.inferred_scale_scores))")
            // 检查是否有 baseline scores (GAD-7 etc)
            if let scores = profile.inferred_scale_scores, !scores.isEmpty {
                // 更严格的检查：确保包含 gad7, phq9, isi
                // 但简单非空通常足够，或者检查 keys
                self.isClinicalComplete = true
                print("[SupabaseManager] ✅ isClinicalComplete = true")
            } else {
                self.isClinicalComplete = false
                print("[SupabaseManager] ⚠️ isClinicalComplete = false (no scores)")
            }
        } catch {
            print("[SupabaseManager] ❌ Check clinical status error: \(error)")
        }
    }

    func uploadAvatar(imageData: Data, contentType: String = "image/jpeg", fileExtension: String = "jpg") async throws -> String {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        guard let token = UserDefaults.standard.string(forKey: "supabase_access_token") else {
            throw SupabaseError.notAuthenticated
        }

        let baseURL = SupabaseConfig.url.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let objectPath = "avatars/\(user.id)/avatar.\(fileExtension)"
        guard let uploadURL = URL(string: "\(baseURL)/storage/v1/object/\(objectPath)") else {
            throw SupabaseError.requestFailed
        }

        var request = URLRequest(url: uploadURL)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        request.setValue("true", forHTTPHeaderField: "x-upsert")
        request.httpBody = imageData

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw SupabaseError.requestFailed
        }

        let publicURL = "\(baseURL)/storage/v1/object/public/\(objectPath)"
        let update = ProfileSettingsUpdate(avatar_url: publicURL)
        _ = try await updateProfileSettings(update)
        return publicURL
    }

    // MARK: - App API Helpers (Next API)
    private enum AppAPIConfig {
        static let cachedBaseURLKey = "app_api_base_url_cached"
        static let overrideBaseURLKey = "app_api_base_url_override"
        static let resolvedAtKey = "app_api_base_url_resolved_at"
        static let healthPath = "api/health"
        static var enforceSingleSource: Bool {
#if targetEnvironment(simulator)
            true
#else
            false
#endif
        }
        static let fallbackBaseURLs = [
            "https://project-metabasis.vercel.app",
            "https://antianxiety.app"
        ]
    }

    func refreshAppAPIBaseURL() async {
        if AppAPIConfig.enforceSingleSource {
            clearAppAPIOverrides()
            guard let infoBase = appAPIBaseURLFromInfoPlist(),
                  let infoURL = URL(string: infoBase) else {
                print("[AppAPI] APP_API_BASE_URL missing.")
                return
            }
            let healthy = await isAppAPIHealthy(baseURL: infoURL)
            if healthy {
                print("[AppAPI] Using fixed base URL: \(infoURL.absoluteString)")
            } else {
                print("[AppAPI] Fixed base URL is unreachable: \(infoURL.absoluteString)")
            }
            return
        }

        let candidates = appAPIBaseURLCandidates()
        guard !candidates.isEmpty else {
            print("[AppAPI] No base URL candidates.")
            return
        }

        for candidate in candidates {
            if await isAppAPIHealthy(baseURL: candidate) {
                cacheAppAPIBaseURL(candidate)
                print("[AppAPI] Selected base URL: \(candidate.absoluteString)")
                return
            }
        }

        print("[AppAPI] No healthy base URL found.")
    }

    func appAPIURL(path: String, queryItems: [URLQueryItem] = []) -> URL? {
        guard let baseURL = currentAppAPIBaseURL() else {
            print("[appAPIURL] APP_API_BASE_URL missing.")
            return nil
        }
        return buildAppAPIURL(baseURL: baseURL, path: path, queryItems: queryItems)
    }

    private func currentAppAPIBaseURL() -> URL? {
        if AppAPIConfig.enforceSingleSource {
            clearAppAPIOverrides()
            if let infoBase = appAPIBaseURLFromInfoPlist(),
               let infoURL = URL(string: infoBase) {
                return infoURL
            }
            return nil
        }

        if let overrideURL = loadAppAPIBaseURL(forKey: AppAPIConfig.overrideBaseURLKey) {
            return overrideURL
        }
        if let cachedURL = loadAppAPIBaseURL(forKey: AppAPIConfig.cachedBaseURLKey) {
            if isSimulator, isPrivateHost(cachedURL.host) {
                let port = cachedURL.port ?? 3001
                return URL(string: "http://localhost:\(port)")
            }
            return cachedURL
        }

        if let infoBase = appAPIBaseURLFromInfoPlist(),
           let infoURL = URL(string: infoBase) {
            if !isSimulator, isPrivateHost(infoURL.host), let fallback = fallbackRemoteBaseURL() {
                return fallback
            }
            if isSimulator, isPrivateHost(infoURL.host) {
                let port = infoURL.port ?? 3001
                return URL(string: "http://localhost:\(port)")
            }
            return infoURL
        }

        if isSimulator {
            return URL(string: "http://localhost:3001") ?? URL(string: "http://localhost:3000")
        }

        return fallbackRemoteBaseURL()
    }

    func currentAppAPIBaseURLString() -> String? {
        currentAppAPIBaseURL()?.absoluteString
    }

    private func appAPIBaseURLCandidates() -> [URL] {
        if AppAPIConfig.enforceSingleSource {
            if let infoBase = appAPIBaseURLFromInfoPlist(),
               let infoURL = URL(string: infoBase) {
                return [infoURL]
            }
            return []
        }

        var candidates: [URL] = []
        var seen: Set<String> = []

        func addCandidate(_ raw: String?) {
            guard let raw = raw,
                  let sanitized = sanitizeAppAPIBaseURLString(raw),
                  let url = URL(string: sanitized),
                  url.scheme != nil,
                  url.host != nil else {
                return
            }
            let key = sanitized.lowercased()
            if !seen.contains(key) {
                seen.insert(key)
                candidates.append(url)
            }
        }

        addCandidate(UserDefaults.standard.string(forKey: AppAPIConfig.overrideBaseURLKey))
        addCandidate(UserDefaults.standard.string(forKey: AppAPIConfig.cachedBaseURLKey))

        if isSimulator {
            addCandidate("http://localhost:3001")
            addCandidate("http://localhost:3000")
        }

        if let infoBase = appAPIBaseURLFromInfoPlist() {
            addCandidate(infoBase)
            if let infoURL = URL(string: infoBase),
               let host = infoURL.host,
               let scheme = infoURL.scheme,
               let port = infoURL.port {
                let altPort: Int?
                if port == 3001 {
                    altPort = 3000
                } else if port == 3000 {
                    altPort = 3001
                } else {
                    altPort = nil
                }
                if let altPort = altPort {
                    addCandidate("\(scheme)://\(host):\(altPort)")
                }
            }
        }

        AppAPIConfig.fallbackBaseURLs.forEach { addCandidate($0) }

        return candidates
    }

    private func maxAgentBaseURLCandidates() -> [URL] {
        var candidates: [URL] = []
        var seen: Set<String> = []

        func addCandidate(_ raw: String?) {
            guard let raw = raw,
                  let sanitized = sanitizeAppAPIBaseURLString(raw),
                  let url = URL(string: sanitized),
                  url.scheme != nil,
                  url.host != nil else {
                return
            }
            let key = sanitized.lowercased()
            if !seen.contains(key) {
                seen.insert(key)
                candidates.append(url)
            }
        }

        addCandidate(UserDefaults.standard.string(forKey: AppAPIConfig.overrideBaseURLKey))
        addCandidate(UserDefaults.standard.string(forKey: AppAPIConfig.cachedBaseURLKey))
        addCandidate(appAPIBaseURLFromInfoPlist())
        AppAPIConfig.fallbackBaseURLs.forEach { addCandidate($0) }

        return candidates.filter { !isPrivateHost($0.host) }
    }

    private func resolveMaxAgentBaseURL() async throws -> URL {
        if let current = currentAppAPIBaseURL(), !isPrivateHost(current.host) {
            return current
        }

        let candidates = maxAgentBaseURLCandidates()
        guard !candidates.isEmpty else {
            print("[MaxAgent] ❌ 没有可用的远程 App API")
            throw SupabaseError.appApiRequiresRemote
        }

        for candidate in candidates {
            if await isAppAPIHealthy(baseURL: candidate) {
                print("[MaxAgent] ✅ 使用远程 App API: \(candidate.absoluteString)")
                return candidate
            }
        }

        print("[MaxAgent] ❌ 远程 App API 不可达")
        throw SupabaseError.appApiRequiresRemote
    }

    private func appAPIBaseURLFromInfoPlist() -> String? {
        guard let baseURLString = Bundle.main.infoDictionary?["APP_API_BASE_URL"] as? String else {
            return nil
        }
        return sanitizeAppAPIBaseURLString(baseURLString)
    }

    private func sanitizeAppAPIBaseURLString(_ raw: String) -> String? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "\\", with: "")
        guard !trimmed.isEmpty else { return nil }
        let normalized = trimmed.hasSuffix("/") ? String(trimmed.dropLast()) : trimmed
        if let url = URL(string: normalized),
           let host = url.host?.lowercased(),
           host == "www.antianxiety.app" {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.host = "antianxiety.app"
            if let rebuilt = components?.url?.absoluteString {
                return rebuilt.hasSuffix("/") ? String(rebuilt.dropLast()) : rebuilt
            }
        }
        return normalized
    }

    private func clearAppAPIOverrides() {
        UserDefaults.standard.removeObject(forKey: AppAPIConfig.overrideBaseURLKey)
        UserDefaults.standard.removeObject(forKey: AppAPIConfig.cachedBaseURLKey)
        UserDefaults.standard.removeObject(forKey: AppAPIConfig.resolvedAtKey)
    }

    private func loadAppAPIBaseURL(forKey key: String) -> URL? {
        guard let raw = UserDefaults.standard.string(forKey: key),
              let sanitized = sanitizeAppAPIBaseURLString(raw),
              let url = URL(string: sanitized) else {
            return nil
        }
        return url
    }

    private func cacheAppAPIBaseURL(_ url: URL) {
        var resolvedURL = url
        if isSimulator, isPrivateHost(resolvedURL.host) {
            let port = resolvedURL.port ?? 3001
            if let localURL = URL(string: "http://localhost:\(port)") {
                resolvedURL = localURL
            }
        }
        let value = resolvedURL.absoluteString.hasSuffix("/") ? String(resolvedURL.absoluteString.dropLast()) : resolvedURL.absoluteString
        UserDefaults.standard.set(value, forKey: AppAPIConfig.cachedBaseURLKey)
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: AppAPIConfig.resolvedAtKey)
    }

    private func fallbackRemoteBaseURL() -> URL? {
        for raw in AppAPIConfig.fallbackBaseURLs {
            guard let sanitized = sanitizeAppAPIBaseURLString(raw),
                  let url = URL(string: sanitized),
                  url.scheme != nil,
                  url.host != nil else {
                continue
            }
            return url
        }
        return nil
    }

    private func isAppAPIHealthy(baseURL: URL) async -> Bool {
        guard let url = buildAppAPIURL(baseURL: baseURL, path: AppAPIConfig.healthPath) else {
            return false
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 2

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse {
                guard (200...299).contains(httpResponse.statusCode) else {
                    return false
                }
                if let payload = try? JSONDecoder().decode(AppAPIHealthPayload.self, from: data) {
                    if let healthSupabase = payload.supabaseUrl,
                       let healthHost = URL(string: healthSupabase)?.host?.lowercased(),
                       let localHost = SupabaseConfig.url.host?.lowercased(),
                       healthHost != localHost {
                        print("[AppAPI] Health check mismatch: \(healthHost) != \(localHost)")
                        return false
                    }
                }
                return true
            }
        } catch {
            return false
        }
        return false
    }

    private struct AppAPIHealthPayload: Decodable {
        let ok: Bool?
        let timestamp: String?
        let supabaseUrl: String?
    }

    private func ensureAppAPIBaseURLReady() async {
        if let current = currentAppAPIBaseURL(), isPrivateHost(current.host) {
            await refreshAppAPIBaseURL()
        }
    }

    private func buildAppAPIURL(baseURL: URL, path: String, queryItems: [URLQueryItem] = []) -> URL? {
        let baseString = baseURL.absoluteString.hasSuffix("/") ? String(baseURL.absoluteString.dropLast()) : baseURL.absoluteString
        let sanitizedPath = path.hasSuffix("/") ? path : path + "/"
        let fullURLString = "\(baseString)/\(sanitizedPath)"

        var components = URLComponents(string: fullURLString)
        if !queryItems.isEmpty {
            components?.queryItems = queryItems
        }
        return components?.url
    }

    private var isSimulator: Bool {
#if targetEnvironment(simulator)
        true
#else
        false
#endif
    }

    private func isPrivateHost(_ host: String?) -> Bool {
        guard let host = host?.lowercased() else { return false }
        if host == "localhost" || host == "127.0.0.1" { return true }
        if host.hasPrefix("10.") || host.hasPrefix("192.168.") { return true }
        if host.hasPrefix("172.") {
            let parts = host.split(separator: ".")
            if parts.count > 1, let second = Int(parts[1]) {
                return (16...31).contains(second)
            }
        }
        return false
    }

    private func isUUID(_ value: String) -> Bool {
        UUID(uuidString: value) != nil
    }

    private func attachSupabaseCookies(to request: inout URLRequest) {
        if let accessToken = UserDefaults.standard.string(forKey: "supabase_access_token") {
            let refreshToken = UserDefaults.standard.string(forKey: "supabase_refresh_token") ?? ""
            // 同时设置 Cookie 和 Authorization Header，确保 Next.js API 能识别
            request.setValue("sb-access-token=\(accessToken); sb-refresh-token=\(refreshToken)", forHTTPHeaderField: "Cookie")
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
            print("[SupabaseManager] 已附加认证信息到请求")
        } else {
            print("[SupabaseManager] ⚠️ 未找到 access_token，请先登录")
        }
    }

    private func performAppAPIRequest(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            return try await performAppAPIRequestOnce(request)
        } catch {
            if shouldRetryAppAPIRequest(error, request: request) {
                await refreshAppAPIBaseURL()
                if let newBase = currentAppAPIBaseURL(),
                   let retryRequest = rebuildAppAPIRequest(request, baseURL: newBase) {
                    return try await performAppAPIRequestOnce(retryRequest)
                }
            }
            throw error
        }
    }

    private func performAppAPIRequestOnce(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if httpResponse.statusCode == 401 {
            try await refreshSession()
            var retryRequest = request
            attachSupabaseCookies(to: &retryRequest)
            let (retryData, retryResponse) = try await URLSession.shared.data(for: retryRequest)
            guard let retryHttp = retryResponse as? HTTPURLResponse else {
                throw SupabaseError.requestFailed
            }
            return (retryData, retryHttp)
        }

        return (data, httpResponse)
    }

    private func shouldRetryAppAPIRequest(_ error: Error, request: URLRequest) -> Bool {
        guard let url = request.url, isPrivateHost(url.host) else { return false }
        let nsError = error as NSError
        if nsError.domain != NSURLErrorDomain { return false }
        let code = nsError.code
        switch code {
        case URLError.Code.cannotConnectToHost.rawValue,
             URLError.Code.cannotFindHost.rawValue,
             URLError.Code.notConnectedToInternet.rawValue,
             URLError.Code.networkConnectionLost.rawValue,
             URLError.Code.timedOut.rawValue,
             URLError.Code.dnsLookupFailed.rawValue:
            return true
        default:
            return false
        }
    }

    private func rebuildAppAPIRequest(_ request: URLRequest, baseURL: URL) -> URLRequest? {
        guard let originalURL = request.url else { return nil }
        let originalComponents = URLComponents(url: originalURL, resolvingAgainstBaseURL: false)
        let path = originalComponents?.path.trimmingCharacters(in: CharacterSet(charactersIn: "/")) ?? ""
        let queryItems = originalComponents?.queryItems ?? []
        guard let newURL = buildAppAPIURL(baseURL: baseURL, path: path, queryItems: queryItems) else {
            return nil
        }
        var newRequest = request
        newRequest.url = newURL
        return newRequest
    }

    // MARK: - Max Chat (Next API)

    func chatWithMax(messages: [ChatRequestMessage], mode: String = "fast") async throws -> String {
        let localMessages = messages.map { message in
            ChatMessage(
                role: message.role == "user" ? .user : .assistant,
                content: message.content
            )
        }
        let prompt = "你是 Max，一个高效、直接、简洁的健康共情型助手。中文回答，避免冗长。"
        let model: AIModel = (mode == "think") ? .deepseekV3Thinking : .deepseekV3Exp
        return try await AIManager.shared.chatCompletion(
            messages: localMessages,
            systemPrompt: prompt,
            model: model,
            temperature: 0.7
        )
    }
    
    // 🆕 确保 token 有效 - 请求前调用
    private func ensureValidToken() async {
        do {
            try await refreshSession()
            print("[Token] ✅ Token 刷新成功")
        } catch {
            // 刷新失败不抛错，可能 token 还有效
            print("[Token] ⚠️ Token 刷新失败，继续使用现有 token: \(error.localizedDescription)")
        }
    }

    // MARK: - Digital Twin (Local Engine)

    func triggerDigitalTwinAnalysis(forceRefresh: Bool = false) async -> DigitalTwinTriggerResult {
        do {
            let input = try await loadDigitalTwinLocalInput()
            if input.baselineScores == nil {
                return DigitalTwinTriggerResult(triggered: false, reason: "缺少基线评估")
            }
            _ = DigitalTwinLocalEngine.analysis(input: input)
            return DigitalTwinTriggerResult(triggered: true, reason: "Local generated", analysisId: nil)
        } catch {
            return DigitalTwinTriggerResult(triggered: false, reason: error.localizedDescription)
        }
    }

    func getDigitalTwinDashboard() async throws -> DigitalTwinDashboardPayload {
        let input = try await loadDigitalTwinLocalInput()
        return DigitalTwinLocalEngine.dashboardPayload(input: input)
    }

    func getDigitalTwinCurve(devMode: Bool = false) async throws -> DigitalTwinCurveResponse {
        let input = try await loadDigitalTwinLocalInput()
        return DigitalTwinLocalEngine.curveResponse(input: input, conversationTrend: nil)
    }

    func generateDigitalTwinCurve(conversationTrend: String? = nil) async throws -> DigitalTwinCurveResponse {
        let input = try await loadDigitalTwinLocalInput()
        return DigitalTwinLocalEngine.curveResponse(input: input, conversationTrend: conversationTrend)
    }
}

struct DigitalTwinTriggerResult {
    let triggered: Bool
    let reason: String
    let analysisId: String?

    init(triggered: Bool, reason: String, analysisId: String? = nil) {
        self.triggered = triggered
        self.reason = reason
        self.analysisId = analysisId
    }
}

// MARK: - Models

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: AuthUser
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
    }
}

struct AuthUser: Codable, Identifiable {
    let id: String
    let email: String?
    let phone: String?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id, email, phone
        case createdAt = "created_at"
    }
}

// MARK: - Profile / Settings Models

struct AISettings: Codable, Equatable {
    let honesty_level: Double?
    let humor_level: Double?
    let mode: String?
}

struct ProfileSettings: Codable, Equatable {
    let id: String?
    let full_name: String?
    let avatar_url: String?
    let ai_personality: String?
    let ai_persona_context: String?
    let ai_settings: AISettings?
    let preferred_language: String?
    let primary_goal: String?
    let current_focus: String?
    let inferred_scale_scores: [String: Int]?
}

struct ProfileSettingsUpdate: Encodable {
    var full_name: String?
    var avatar_url: String?
    var ai_personality: String?
    var ai_persona_context: String?
    var ai_settings: AISettings?
    var preferred_language: String?

    enum CodingKeys: String, CodingKey {
        case full_name
        case avatar_url
        case ai_personality
        case ai_persona_context
        case ai_settings
        case preferred_language
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        if let full_name { try container.encode(full_name, forKey: .full_name) }
        if let avatar_url { try container.encode(avatar_url, forKey: .avatar_url) }
        if let ai_personality { try container.encode(ai_personality, forKey: .ai_personality) }
        if let ai_persona_context { try container.encode(ai_persona_context, forKey: .ai_persona_context) }
        if let ai_settings { try container.encode(ai_settings, forKey: .ai_settings) }
        if let preferred_language { try container.encode(preferred_language, forKey: .preferred_language) }
    }
}

private struct ProfileRow: Decodable {
    let id: String
}

private struct ProfileUpsertPayload: Encodable {
    let id: String
    let email: String?
    let inferred_scale_scores: [String: Int]?

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case inferred_scale_scores
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        if let email { try container.encode(email, forKey: .email) }
        if let inferred_scale_scores { try container.encode(inferred_scale_scores, forKey: .inferred_scale_scores) }
    }
}

// MARK: - Chat Models

struct ChatRequestMessage: Codable, Equatable {
    let role: String
    let content: String
}

private struct ChatAPIRequest: Codable {
    let messages: [ChatRequestMessage]
    let stream: Bool
    let mode: String
}

private struct ChatAPIResponse: Codable {
    let response: String
}

private struct ChatAPIErrorResponse: Codable {
    let error: String?
}

// MARK: - 计划保存 API
extension SupabaseManager {
    /// 保存用户选择的计划
    func savePlan(_ plan: PlanOption) async throws {
        guard let user = currentUser else {
            throw SupabaseError.notAuthenticated
        }
        
        // 构建计划数据
        struct PlanPayload: Encodable {
            let user_id: String
            let title: String
            let description: String?
            let difficulty: String?
            let duration: String?
            let items: [[String: String]]
            let status: String
        }
        
        let planItems = plan.displayItems.map { item in
            var dict: [String: String] = ["text": item.text]
            if let id = item.id {
                dict["id"] = id
            }
            return dict
        }
        
        let payload = PlanPayload(
            user_id: user.id,
            title: plan.displayTitle,
            description: plan.description,
            difficulty: plan.difficulty,
            duration: plan.duration,
            items: planItems,
            status: "active"
        )
        
        // 调用 Supabase REST API 保存到 user_plans 表
        try await requestVoid("user_plans", method: "POST", body: payload)
        print("✅ 计划已保存到数据库: \(plan.displayTitle)")
    }
}

// MARK: - 🆕 Starter Questions API
extension SupabaseManager {
    /// 获取个性化起始问题
    func getStarterQuestions() async throws -> [String] {
        let defaults = [
            "今天我的焦虑评分如何？",
            "帮我分析一下最近的睡眠质量",
            "我该如何改善当前的压力水平？",
            "根据我的数据，有什么建议？"
        ]

        do {
            let prompt = """
            你是 Max，生成 4 条中文起始问题：
            - 每条不超过 18 个字
            - 聚焦焦虑/睡眠/压力/能量
            - 直接输出 4 行纯文本
            """
            let reply = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: prompt)],
                systemPrompt: "你是 Max，回答简洁直接。",
                model: .deepseekV3Exp,
                temperature: 0.6
            )
            let lines = reply
                .split(separator: "\n")
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "•", with: "").replacingOccurrences(of: "-", with: "") }
                .filter { !$0.isEmpty }
            let unique = Array(lines.prefix(4))
            if unique.count >= 2 {
                return unique
            }
        } catch {
            // ignore and fallback
        }

        return defaults
    }
}

// MARK: - 🆕 Science Feed API
extension SupabaseManager {
    /// 获取科学期刊 Feed
    func getScienceFeed(language: String) async throws -> ScienceFeedResponse {
        guard let url = appAPIURL(path: "api/feed") else {
            print("[ScienceFeed] ⚠️ APP_API_BASE_URL 未配置")
            throw SupabaseError.missingAppApiBaseUrl
        }
        
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "language", value: language),
            URLQueryItem(name: "limit", value: "20")
        ]
        
        guard let finalUrl = components?.url else {
            throw SupabaseError.requestFailed
        }
        
        var request = URLRequest(url: finalUrl)
        request.httpMethod = "GET"
        attachSupabaseCookies(to: &request)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw SupabaseError.requestFailed
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let feedResponse = try decoder.decode(ScienceFeedResponse.self, from: data)
        print("✅ [ScienceFeed] 获取了 \(feedResponse.articles.count) 篇文章")
        return feedResponse
    }
    
    /// 提交 Feed 反馈
    func submitFeedFeedback(_ feedback: FeedFeedbackInput) async throws {
        guard let url = appAPIURL(path: "api/feed/feedback") else {
            throw SupabaseError.missingAppApiBaseUrl
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        
        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(feedback)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw SupabaseError.requestFailed
        }
        
        print("✅ [FeedFeedback] 反馈已提交")
    }
}

// MARK: - 🆕 Understanding Score API
extension SupabaseManager {
    /// 获取理解度评分
    func getUnderstandingScore(includeHistory: Bool = true, days: Int = 14) async throws -> UnderstandingScoreResponse {
        let queryItems = [
            URLQueryItem(name: "includeHistory", value: includeHistory ? "true" : "false"),
            URLQueryItem(name: "days", value: String(max(1, days)))
        ]
        guard let url = appAPIURL(path: "api/understanding-score", queryItems: queryItems) else {
            throw SupabaseError.missingAppApiBaseUrl
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        attachSupabaseCookies(to: &request)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }
        
        if (200...299).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(UnderstandingScoreResponse.self, from: data)
        }
        
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let errorMessage = json["error"] as? String {
            throw NSError(domain: "UnderstandingScore", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage])
        }
        
        throw SupabaseError.requestFailed
    }
}

// MARK: - 🆕 Inquiry API
extension SupabaseManager {
    /// 获取待答问询
    func getPendingInquiry(language: String) async throws -> InquiryPendingResponse {
        let queryItems = [URLQueryItem(name: "language", value: language)]
        guard let url = appAPIURL(path: "api/inquiry/pending", queryItems: queryItems) else {
            throw SupabaseError.missingAppApiBaseUrl
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        attachSupabaseCookies(to: &request)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }
        
        if (200...299).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(InquiryPendingResponse.self, from: data)
        }
        
        throw SupabaseError.requestFailed
    }
    
    /// 提交问询回答
    func respondInquiry(inquiryId: String, response: String) async throws -> InquiryRespondResponse {
        guard let url = appAPIURL(path: "api/inquiry/respond") else {
            throw SupabaseError.missingAppApiBaseUrl
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        
        let payload = [
            "inquiryId": inquiryId,
            "response": response
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }
        
        if (200...299).contains(httpResponse.statusCode) {
            return (try? JSONDecoder().decode(InquiryRespondResponse.self, from: data)) ?? InquiryRespondResponse(success: true, message: nil)
        }
        
        throw SupabaseError.requestFailed
    }
}

// MARK: - 🆕 Bayesian API
extension SupabaseManager {
    func getBayesianHistory(range: BayesianHistoryRange, context: String? = nil) async throws -> BayesianHistoryResponse {
        var queryItems = [URLQueryItem(name: "timeRange", value: range.rawValue)]
        if let context, !context.isEmpty {
            queryItems.append(URLQueryItem(name: "context", value: context))
        }
        guard let url = appAPIURL(path: "api/bayesian/history", queryItems: queryItems) else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        attachSupabaseCookies(to: &request)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(BayesianHistoryResponse.self, from: data)
        }

        throw SupabaseError.requestFailed
    }

    func triggerBayesianNudge(actionType: String, durationMinutes: Int?) async throws -> BayesianNudgeResponse {
        guard let url = appAPIURL(path: "api/bayesian/nudge") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var payload: [String: Any] = ["action_type": actionType]
        if let durationMinutes {
            payload["duration_minutes"] = durationMinutes
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(BayesianNudgeResponse.self, from: data)
        }

        throw SupabaseError.requestFailed
    }

    func runBayesianRitual(context: String, priorScore: Int, customQuery: String?) async throws -> BayesianRitualResponse {
        guard let url = appAPIURL(path: "api/bayesian/ritual") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var payload: [String: Any] = [
            "belief_context": context,
            "prior_score": priorScore
        ]
        if let customQuery, !customQuery.isEmpty {
            payload["custom_query"] = customQuery
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(BayesianRitualResponse.self, from: data)
        }

        throw SupabaseError.requestFailed
    }
}

// MARK: - 🆕 Insight / Voice / Debug API
extension SupabaseManager {
    private struct ProactiveInquiryContext: Codable {
        let recentData: [String: String]
        let dataGaps: [String]
        let timeOfDay: String
    }

    private struct ProactiveInquiryPayload: Codable {
        let context: ProactiveInquiryContext
        let language: String
        let history: [InquiryQuestion]
    }

    func generateProactiveInquiry(language: String) async throws -> InquiryQuestion {
        guard let url = appAPIURL(path: "api/ai/generate-inquiry") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        let hour = Calendar.current.component(.hour, from: Date())
        let timeOfDay = hour < 12 ? "morning" : (hour < 18 ? "afternoon" : "evening")
        let context = ProactiveInquiryContext(
            recentData: ["sleep": "unknown", "stress": "unknown"],
            dataGaps: ["sleep_duration", "stress_level"],
            timeOfDay: timeOfDay
        )
        let payload = ProactiveInquiryPayload(context: context, language: language, history: [])

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            let decoded = try JSONDecoder().decode(ProactiveInquiryResponse.self, from: data)
            if let question = decoded.question {
                return question
            }
        }

        throw SupabaseError.requestFailed
    }

    func analyzeVoiceInput(_ input: VoiceAnalysisInput) async throws -> VoiceAnalysisResponse {
        guard let url = appAPIURL(path: "api/ai/analyze-voice-input") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = try JSONEncoder().encode(input)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(VoiceAnalysisResponse.self, from: data)
        }

        throw SupabaseError.requestFailed
    }

    func generateInsight(_ input: InsightGenerateInput) async throws -> String {
        guard let url = appAPIURL(path: "api/insight/generate") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = try JSONEncoder().encode(input)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            return String(data: data, encoding: .utf8) ?? ""
        }

        throw SupabaseError.requestFailed
    }

    func fetchInsightSummary() async throws -> InsightSummaryResponse {
        guard let url = appAPIURL(path: "api/insight") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        attachSupabaseCookies(to: &request)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(InsightSummaryResponse.self, from: data)
        }

        throw SupabaseError.requestFailed
    }

    func getDeepInference(analysisResult: [String: Any], recentLogs: [[String: Any]]) async throws -> String {
        guard let url = appAPIURL(path: "api/ai/deep-inference") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        let payload: [String: Any] = [
            "analysisResult": analysisResult,
            "recentLogs": recentLogs
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            if let object = try? JSONSerialization.jsonObject(with: data),
               let prettyData = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted]) {
                return String(data: prettyData, encoding: .utf8) ?? ""
            }
            return String(data: data, encoding: .utf8) ?? ""
        }

        throw SupabaseError.requestFailed
    }

    func explainRecommendation(
        recommendationId: String,
        title: String,
        description: String,
        science: String,
        language: String,
        category: String? = nil
    ) async throws -> String {
        guard let url = appAPIURL(path: "api/digital-twin/explain-recommendation") else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var payload: [String: Any] = [
            "recommendationId": recommendationId,
            "title": title,
            "description": description,
            "science": science,
            "language": language
        ]
        if let category, !category.isEmpty {
            payload["category"] = category
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            struct ExplainResponse: Codable { let explanation: String }
            let decoded = try JSONDecoder().decode(ExplainResponse.self, from: data)
            return decoded.explanation
        }

        throw SupabaseError.requestFailed
    }

    func sendDebugPayload(path: String, payload: String) async throws -> String {
        guard let url = appAPIURL(path: path) else {
            throw SupabaseError.missingAppApiBaseUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        attachSupabaseCookies(to: &request)
        request.httpBody = payload.data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.requestFailed
        }

        if (200...299).contains(httpResponse.statusCode) {
            if let object = try? JSONSerialization.jsonObject(with: data),
               let prettyData = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted]) {
                return String(data: prettyData, encoding: .utf8) ?? ""
            }
            return String(data: data, encoding: .utf8) ?? ""
        }

        throw SupabaseError.requestFailed
    }
}

// MARK: - Errors

enum SupabaseError: LocalizedError {
    case authenticationFailed
    case notAuthenticated
    case requestFailed
    case decodingFailed
    case missingAppApiBaseUrl
    case appApiRequiresRemote
    
    var errorDescription: String? {
        switch self {
        case .authenticationFailed: return "登录失败，请检查邮箱和密码"
        case .notAuthenticated: return "请先登录"
        case .requestFailed: return "请求失败"
        case .decodingFailed: return "数据解析失败"
        case .missingAppApiBaseUrl: return "未配置 APP_API_BASE_URL"
        case .appApiRequiresRemote: return "Max 必须连接远程 App API（https://antianxiety.app），请检查 APP_API_BASE_URL 或网络"
        }
    }
}
