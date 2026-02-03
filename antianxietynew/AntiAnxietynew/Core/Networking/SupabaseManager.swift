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

// MARK: - Evidence Models
struct EvidenceItem: Codable, Identifiable {
    let id: UUID
    let type: EvidenceType
    let value: String
    let weight: Double?

    enum CodingKeys: String, CodingKey {
        case type
        case value
        case weight
    }

    init(id: UUID = UUID(), type: EvidenceType, value: String, weight: Double? = nil) {
        self.id = id
        self.type = type
        self.value = value
        self.weight = weight
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = (try? container.decode(EvidenceType.self, forKey: .type)) ?? .bio
        value = (try? container.decode(String.self, forKey: .value)) ?? ""
        weight = try? container.decode(Double.self, forKey: .weight)
        id = UUID()
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(type, forKey: .type)
        try container.encode(value, forKey: .value)
        try container.encodeIfPresent(weight, forKey: .weight)
    }
}

enum EvidenceType: String, Codable {
    case bio
    case science
    case action
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

    private enum HabitsBackend {
        case v2
        case legacy
    }
    private var habitsBackendCache: HabitsBackend?
    private var reminderPreferencesColumnAvailable: Bool?
    private var userHealthDataTableAvailable: Bool?
    
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
        habitsBackendCache = nil
        reminderPreferencesColumnAvailable = nil
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
            components?.percentEncodedQuery = sanitizePercentEncodedQuery(query)
        }
        return components?.url
    }

    private func sanitizePercentEncodedQuery(_ query: String) -> String {
        // URLComponents.percentEncodedQuery requires all '%' to be valid percent escapes.
        var output = ""
        let characters = Array(query)
        var index = 0
        while index < characters.count {
            let char = characters[index]
            if char == "%" {
                if index + 2 < characters.count,
                   isHexDigit(characters[index + 1]),
                   isHexDigit(characters[index + 2]) {
                    output.append(char)
                    output.append(characters[index + 1])
                    output.append(characters[index + 2])
                    index += 3
                    continue
                }
                output.append("%25")
                index += 1
                continue
            }
            if char == " " {
                output.append("%20")
                index += 1
                continue
            }
            output.append(char)
            index += 1
        }
        return output
    }

    private func isHexDigit(_ char: Character) -> Bool {
        return ("0"..."9").contains(char) || ("a"..."f").contains(char) || ("A"..."F").contains(char)
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
        let user_id: String?
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
            let endpoint = "chat_conversations?user_id=eq.\(userId)&select=id,user_id,session_id,role,content,created_at&order=created_at.desc&limit=200"
            rows = try await request(endpoint)
        } catch {
            let endpoint = "chat_conversations?user_id=eq.\(userId)&select=id,user_id,role,content,created_at&order=created_at.desc&limit=200"
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
                    user_id: row.user_id ?? userId,
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
        let calibrations = await fetchDigitalTwinCalibrations(userId: user.id, logs: logs)
        let inquiryInsights = await fetchDigitalTwinInquiryInsights(userId: user.id)
        let conversationSummary = await fetchDigitalTwinConversationSummary(userId: user.id)
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
            calibrations: calibrations,
            inquiryInsights: inquiryInsights,
            conversationSummary: conversationSummary,
            profile: profile,
            now: Date()
        )
    }

    private func fetchDigitalTwinCalibrations(userId: String, logs: [WellnessLog]) async -> [CalibrationData] {
        struct CalibrationRow: Codable {
            let date: String
            let sleep_hours: Double?
            let stress_level: Int?
            let exercise_duration: Int?
            let meal_quality: String?
            let mood_score: Int?
            let water_intake: String?
        }

        let endpoint = "daily_calibrations?user_id=eq.\(userId)&select=date,sleep_hours,stress_level,exercise_duration,meal_quality,mood_score,water_intake&order=date.asc&limit=60"
        let rows: [CalibrationRow] = (try? await request(endpoint)) ?? []

        if !rows.isEmpty {
            return rows.map { row in
                let sleepHours = row.sleep_hours ?? 0
                let sleepQuality = sleepQualityFromHours(sleepHours)
                let mood = normalizeTo10(row.mood_score)
                let stress = normalizeTo10(row.stress_level)
                let energy = estimateEnergyLevel(mood: mood, stress: stress, exercise: row.exercise_duration)
                return CalibrationData(
                    date: row.date,
                    sleepHours: sleepHours,
                    sleepQuality: sleepQuality,
                    moodScore: mood,
                    stressLevel: stress,
                    energyLevel: energy,
                    restingHeartRate: nil,
                    hrv: nil,
                    stepCount: nil,
                    deviceSleepScore: nil,
                    activityScore: nil
                )
            }
        }

        let sortedLogs = logs.sorted { $0.log_date < $1.log_date }
        return sortedLogs.map { log in
            let sleepHours = log.sleepHours
            let sleepQuality = sleepQualityFromLog(log, fallbackHours: sleepHours)
            let mood = moodScoreFromLog(log)
            let stress = normalizeTo10(log.stress_level)
            let energy = log.energy_level ?? log.morning_energy ?? estimateEnergyLevel(mood: mood, stress: stress, exercise: log.exercise_duration_minutes)
            return CalibrationData(
                date: log.log_date,
                sleepHours: sleepHours,
                sleepQuality: sleepQuality,
                moodScore: mood,
                stressLevel: stress,
                energyLevel: normalizeTo10(Int?(energy)),
                restingHeartRate: nil,
                hrv: nil,
                stepCount: nil,
                deviceSleepScore: nil,
                activityScore: nil
            )
        }
    }

    private func fetchDigitalTwinInquiryInsights(userId: String) async -> [InquiryInsight] {
        struct InquiryRow: Codable {
            let question_text: String?
            let question_type: String?
            let user_response: String?
            let data_gaps_addressed: [String]?
            let created_at: String?
            let responded_at: String?
        }

        let endpoint = "inquiry_history?user_id=eq.\(userId)&select=question_text,question_type,user_response,data_gaps_addressed,created_at,responded_at&order=created_at.desc&limit=10"
        let rows: [InquiryRow] = (try? await request(endpoint)) ?? []

        return rows.compactMap { row in
            guard let response = row.user_response, !response.isEmpty else { return nil }
            let date = row.responded_at ?? row.created_at ?? isoDate(Date())
            var indicators: [String: CodableValue] = [:]
            if let gaps = row.data_gaps_addressed {
                for gap in gaps {
                    indicators[gap] = .string(response)
                }
            }
            if indicators.isEmpty, let question = row.question_text {
                indicators["question"] = .string(question)
            }
            return InquiryInsight(
                date: date,
                topic: row.question_type ?? "general",
                userResponse: response,
                extractedIndicators: indicators
            )
        }
    }

    private func fetchDigitalTwinConversationSummary(userId: String) async -> ConversationSummary {
        struct ConversationRow: Codable {
            let role: String?
            let content: String?
            let created_at: String?
        }

        let endpoint = "chat_conversations?user_id=eq.\(userId)&select=role,content,created_at&order=created_at.desc&limit=100"
        let rows: [ConversationRow] = (try? await request(endpoint)) ?? []

        let total = rows.count
        let lastInteraction = rows.first?.created_at ?? isoDate(Date())
        let userMessages = rows.filter { ($0.role ?? "") == "user" }

        let negativeKeywords = ["焦虑", "压力", "紧张", "恐慌", "失眠", "难受", "崩溃", "panic", "anxiety", "stress"]
        let positiveKeywords = ["好转", "改善", "平静", "放松", "舒服", "稳定", "开心", "进步", "calm", "better"]

        var score = 0
        var topicCounts: [String: Int] = [:]
        let topicKeywords: [String: [String]] = [
            "睡眠": ["睡眠", "失眠", "睡不着", "sleep"],
            "压力": ["压力", "紧张", "stress"],
            "焦虑": ["焦虑", "恐慌", "anxiety"],
            "能量": ["能量", "精力", "疲劳", "energy"],
            "运动": ["运动", "锻炼", "exercise"],
            "饮食": ["饮食", "吃", "diet"]
        ]

        for message in userMessages {
            let content = message.content?.lowercased() ?? ""
            for keyword in negativeKeywords where content.contains(keyword) {
                score += 1
            }
            for keyword in positiveKeywords where content.contains(keyword) {
                score -= 1
            }
            for (topic, keywords) in topicKeywords {
                if keywords.contains(where: { content.contains($0) }) {
                    topicCounts[topic, default: 0] += 1
                }
            }
        }

        let emotionalTrend: String
        if score >= 2 {
            emotionalTrend = "declining"
        } else if score <= -2 {
            emotionalTrend = "improving"
        } else {
            emotionalTrend = "stable"
        }

        let frequentTopics = topicCounts
            .sorted { $0.value > $1.value }
            .prefix(3)
            .map { $0.key }

        return ConversationSummary(
            totalMessages: total,
            emotionalTrend: emotionalTrend,
            frequentTopics: frequentTopics,
            lastInteraction: lastInteraction
        )
    }

    private func moodScoreFromLog(_ log: WellnessLog) -> Int {
        if let mood = log.mood_status?.lowercased() {
            switch mood {
            case "great", "excellent": return 9
            case "good": return 7
            case "okay", "neutral": return 5
            case "bad", "poor": return 3
            case "terrible": return 1
            default: break
            }
        }
        if let anxiety = log.anxiety_level {
            return max(0, 10 - anxiety)
        }
        return 5
    }

    private func sleepQualityFromLog(_ log: WellnessLog, fallbackHours: Double) -> Int {
        if let qualityString = log.sleep_quality {
            if let quality = Int(qualityString) {
                return normalizeTo10(quality)
            }
            switch qualityString.lowercased() {
            case "poor", "bad": return 3
            case "okay", "neutral": return 5
            case "good": return 7
            case "great", "excellent": return 9
            default: break
            }
        }
        return sleepQualityFromHours(fallbackHours)
    }

    private func sleepQualityFromHours(_ hours: Double) -> Int {
        if hours <= 0 { return 0 }
        if hours >= 7 && hours <= 9 { return 10 }
        if hours < 7 {
            let penalty = Int(round((7 - hours) * 2))
            return max(0, 10 - penalty)
        }
        let penalty = Int(round((hours - 9) * 1.5))
        return max(0, 10 - penalty)
    }

    private func estimateEnergyLevel(mood: Int?, stress: Int?, exercise: Int?) -> Int {
        var energy = 5.0
        if let mood {
            energy += Double(mood - 5) * 0.6
        }
        if let stress {
            energy -= Double(stress - 5) * 0.5
        }
        if let exercise, exercise > 0 {
            energy += min(3.0, Double(exercise) / 30.0)
        }
        return normalizeTo10(energy)
    }

    private func normalizeTo10(_ value: Int?) -> Int {
        guard let value else { return 0 }
        if value <= 10 { return max(0, value) }
        if value <= 100 { return max(0, min(10, value / 10)) }
        return 10
    }

    private func normalizeTo10(_ value: Double) -> Int {
        if value <= 10 { return max(0, min(10, Int(round(value)))) }
        if value <= 100 { return max(0, min(10, Int(round(value / 10)))) }
        return 10
    }

    private func isoDate(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.string(from: date)
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
        if userHealthDataTableAvailable == false { return nil }
        
        let endpoint = "user_health_data?user_id=eq.\(user.id)&select=data_type,value,source,recorded_at&order=recorded_at.desc&limit=20"
        
        struct RawHealthData: Codable {
            let data_type: String
            let value: Double
            let source: String?
            let recorded_at: String
        }
        
        let rawData: [RawHealthData]
        do {
            rawData = try await request(endpoint)
        } catch {
            userHealthDataTableAvailable = false
            print("[SupabaseManager] ⚠️ user_health_data unavailable: \(error)")
            return nil
        }
        
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

    func isUserHealthDataAvailable() -> Bool {
        userHealthDataTableAvailable != false
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

        let baseSelect = "id,full_name,avatar_url,ai_personality,ai_persona_context,ai_settings,preferred_language,primary_goal,current_focus,inferred_scale_scores"
        if reminderPreferencesColumnAvailable == false {
            let legacyEndpoint = "profiles?id=eq.\(user.id)&select=\(baseSelect)&limit=1"
            let results: [ProfileSettings] = try await request(legacyEndpoint)
            return results.first
        }

        let endpoint = "profiles?id=eq.\(user.id)&select=\(baseSelect),reminder_preferences&limit=1"
        do {
            let results: [ProfileSettings] = try await request(endpoint)
            reminderPreferencesColumnAvailable = true
            return results.first
        } catch {
            let originalError = error
            let legacyEndpoint = "profiles?id=eq.\(user.id)&select=\(baseSelect)&limit=1"
            do {
                let results: [ProfileSettings] = try await request(legacyEndpoint)
                reminderPreferencesColumnAvailable = false
                print("[SupabaseManager] ⚠️ profiles.reminder_preferences missing; fallback to legacy profile select")
                return results.first
            } catch {
                throw originalError
            }
        }
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

    func getReminderPreferences() async throws -> ReminderPreferences {
        let profile = try await getProfileSettings()
        return profile?.reminder_preferences ?? ReminderPreferences(morning: false, evening: false, breathing: false)
    }

    func updateReminderPreferences(_ preferences: ReminderPreferences) async throws -> ReminderPreferences {
        let update = ProfileSettingsUpdate(reminder_preferences: preferences)
        let profile = try await updateProfileSettings(update)
        return profile?.reminder_preferences ?? preferences
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
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        let localMessages = messages.map { message in
            ChatMessage(
                role: message.role == "user" ? .user : .assistant,
                content: message.content
            )
        }
        let profile = try? await getProfileSettings()
        let language = profile?.preferred_language ?? "zh"
        let conversationState = MaxConversationStateTracker.extractState(from: localMessages)
        let inquirySummary = try? await getInquiryContextSummary(language: language)

        let lastUserMessage = localMessages.last { $0.role == .user }
        if let lastUserMessage, shouldRefuseNonHealthRequest(lastUserMessage.content) {
            return refusalMessage(language: language)
        }
        var memoryContext: String? = nil
        var playbookContext: String? = nil
        if let lastUserMessage {
            let ragContext = await MaxRAGService.buildContext(
                userId: user.id,
                query: lastUserMessage.content,
                language: language
            )
            memoryContext = ragContext.memoryBlock
            playbookContext = ragContext.playbookBlock
        }

        var contextBlock: String? = nil
        if let lastUserMessage {
            let searchResult = await ScientificSearchService.searchScientificTruth(query: lastUserMessage.content)
            let papers = searchResult.papers.map { ScientificPaperLite(title: $0.title, year: $0.year) }
            let decision = MaxContextOptimizer.optimize(
                state: conversationState,
                healthFocus: profile?.current_focus ?? profile?.primary_goal,
                scientificPapers: papers
            )
            contextBlock = MaxContextOptimizer.buildContextBlock(decision: decision)
        } else if let healthFocus = profile?.current_focus ?? profile?.primary_goal {
            let decision = MaxContextOptimizer.optimize(
                state: conversationState,
                healthFocus: healthFocus,
                scientificPapers: []
            )
            contextBlock = MaxContextOptimizer.buildContextBlock(decision: decision)
        }

        let userContext = await buildUserContextSummary(profile: profile)
        var combinedContext: [String] = []
        if let userContext, !userContext.isEmpty {
            combinedContext.append("[USER CONTEXT]\n\(userContext)")
        }
        if let contextBlock, !contextBlock.isEmpty {
            combinedContext.append(contextBlock)
        }
        let finalContextBlock = combinedContext.isEmpty ? nil : combinedContext.joined(separator: "\n")

        let prompt = MaxPromptBuilder.build(input: MaxPromptInput(
            conversationState: conversationState,
            aiSettings: profile?.ai_settings,
            aiPersonaContext: profile?.ai_persona_context,
            personality: profile?.ai_personality,
            healthFocus: profile?.current_focus ?? profile?.primary_goal,
            inquirySummary: inquirySummary,
            memoryContext: memoryContext,
            playbookContext: playbookContext,
            contextBlock: finalContextBlock,
            language: language
        ))
        let model: AIModel = (mode == "think") ? .deepseekV3Thinking : .deepseekV3Exp
        let response = try await AIManager.shared.chatCompletion(
            messages: localMessages,
            systemPrompt: prompt,
            model: model,
            temperature: 0.7
        )
        let cleaned = stripReasoningContent(response)

        if let lastUserMessage {
            await MaxMemoryService.storeMemory(
                userId: user.id,
                content: lastUserMessage.content,
                role: "user",
                metadata: ["source": "max_chat"]
            )
        }
        await MaxMemoryService.storeMemory(
            userId: user.id,
            content: cleaned,
            role: "assistant",
            metadata: ["source": "max_chat"]
        )

        return cleaned
    }

    private func shouldRefuseNonHealthRequest(_ text: String) -> Bool {
        let lowered = text.lowercased()
        let politicsTokens = [
            "特朗普", "拜登", "哈里斯", "共和党", "民主党", "选举", "大选", "投票", "竞选",
            "摇摆州", "总统", "议会", "参议院", "众议院", "民调",
            "trump", "biden", "harris", "election", "vote", "campaign", "poll", "swing state"
        ]
        let gamblingTokens = [
            "博彩", "赔率", "下注", "赌", "盘口", "赌场",
            "bet", "odds", "sportsbook", "casino", "wager"
        ]
        let containsPolitics = politicsTokens.contains { lowered.contains($0.lowercased()) }
        let containsGambling = gamblingTokens.contains { lowered.contains($0.lowercased()) }
        return containsPolitics || containsGambling
    }

    private func refusalMessage(language: String) -> String {
        if language == "en" {
            return "I can’t help with election predictions or betting odds. If you have a health, emotion, or lifestyle question, I can help."
        }
        return "我不能提供政治选举预测或博彩赔率等内容。如果你有健康/情绪/生活方式的问题，我可以帮你。"
    }

    private func buildMemoryContext(_ records: [MaxMemoryRecord]) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let lines = records.prefix(6).map { record -> String in
            if let date = formatter.date(from: record.created_at) {
                let dateString = ISO8601DateFormatter().string(from: date)
                return "[\(dateString)] \(record.role): \(record.content_text)"
            }
            return "[\(record.created_at)] \(record.role): \(record.content_text)"
        }
        return lines.joined(separator: "\n")
    }

    private func stripReasoningContent(_ text: String) -> String {
        var cleaned = text
        if let regex = try? NSRegularExpression(pattern: "<think>[\\s\\S]*?</think>", options: [.caseInsensitive]) {
            let range = NSRange(cleaned.startIndex..<cleaned.endIndex, in: cleaned)
            cleaned = regex.stringByReplacingMatches(in: cleaned, options: [], range: range, withTemplate: "")
        }
        if cleaned.contains("reasoning_content") {
            let lines = cleaned.split(separator: "\n").filter { !$0.contains("reasoning_content") }
            cleaned = lines.joined(separator: "\n")
        }
        return cleaned.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func buildUserContextSummary(profile: ProfileSettings?) async -> String? {
        var lines: [String] = []

        if let profile {
            if let name = profile.full_name, !name.isEmpty { lines.append("姓名: \(name)") }
            if let language = profile.preferred_language, !language.isEmpty { lines.append("偏好语言: \(language)") }
            if let goal = profile.primary_goal, !goal.isEmpty { lines.append("主要目标: \(goal)") }
            if let focus = profile.current_focus, !focus.isEmpty { lines.append("当前关注: \(focus)") }
            if let personality = profile.ai_personality, !personality.isEmpty { lines.append("沟通风格: \(personality)") }
            if let scores = profile.inferred_scale_scores, !scores.isEmpty {
                let gad7 = scores["gad7"].map { "GAD7=\($0)" }
                let phq9 = scores["phq9"].map { "PHQ9=\($0)" }
                let isi = scores["isi"].map { "ISI=\($0)" }
                let pss10 = scores["pss10"].map { "PSS10=\($0)" }
                let parts = [gad7, phq9, isi, pss10].compactMap { $0 }
                if !parts.isEmpty { lines.append("量表分数: \(parts.joined(separator: ", "))") }
            }
        }

        if let dashboard = try? await getDashboardData() {
            let logs = dashboard.weeklyLogs
            if !logs.isEmpty {
                let avgSleep = average(logs.map { $0.sleep_duration_minutes }).map { String(format: "%.1f", $0 / 60.0) }
                let avgStress = average(logs.map { $0.stress_level }).map { String(format: "%.1f", $0) }
                let avgEnergy = average(logs.map { $0.energy_level }).map { String(format: "%.1f", $0) }
                let avgAnxiety = average(logs.map { $0.anxiety_level }).map { String(format: "%.1f", $0) }
                var summaryParts: [String] = []
                if let avgSleep { summaryParts.append("平均睡眠=\(avgSleep)小时") }
                if let avgStress { summaryParts.append("平均压力=\(avgStress)") }
                if let avgAnxiety { summaryParts.append("平均焦虑=\(avgAnxiety)") }
                if let avgEnergy { summaryParts.append("平均精力=\(avgEnergy)") }
                if !summaryParts.isEmpty { lines.append("最近7天: \(summaryParts.joined(separator: ", "))") }
            }

            if let hardware = dashboard.hardwareData {
                var hardwareParts: [String] = []
                if let hrv = hardware.hrv?.value { hardwareParts.append("HRV=\(String(format: "%.0f", hrv))") }
                if let rhr = hardware.resting_heart_rate?.value { hardwareParts.append("静息心率=\(String(format: "%.0f", rhr))") }
                if let sleepScore = hardware.sleep_score?.value { hardwareParts.append("睡眠评分=\(String(format: "%.0f", sleepScore))") }
                if let steps = hardware.steps?.value { hardwareParts.append("步数=\(String(format: "%.0f", steps))") }
                if !hardwareParts.isEmpty { lines.append("穿戴设备: \(hardwareParts.joined(separator: ", "))") }
            }
        }

        let context = lines.joined(separator: "\n")
        return context.isEmpty ? nil : context
    }

    private func average(_ values: [Int?]) -> Double? {
        let nums = values.compactMap { $0 }
        guard !nums.isEmpty else { return nil }
        return Double(nums.reduce(0, +)) / Double(nums.count)
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

struct ReminderPreferences: Codable, Equatable {
    let morning: Bool?
    let evening: Bool?
    let breathing: Bool?
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
    let reminder_preferences: ReminderPreferences?
}

struct ProfileSettingsUpdate: Encodable {
    var full_name: String?
    var avatar_url: String?
    var ai_personality: String?
    var ai_persona_context: String?
    var ai_settings: AISettings?
    var preferred_language: String?
    var reminder_preferences: ReminderPreferences?

    enum CodingKeys: String, CodingKey {
        case full_name
        case avatar_url
        case ai_personality
        case ai_persona_context
        case ai_settings
        case preferred_language
        case reminder_preferences
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        if let full_name { try container.encode(full_name, forKey: .full_name) }
        if let avatar_url { try container.encode(avatar_url, forKey: .avatar_url) }
        if let ai_personality { try container.encode(ai_personality, forKey: .ai_personality) }
        if let ai_persona_context { try container.encode(ai_persona_context, forKey: .ai_persona_context) }
        if let ai_settings { try container.encode(ai_settings, forKey: .ai_settings) }
        if let preferred_language { try container.encode(preferred_language, forKey: .preferred_language) }
        if let reminder_preferences { try container.encode(reminder_preferences, forKey: .reminder_preferences) }
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

        guard let user = currentUser else { return defaults }

        var questions: [String] = []
        func appendUnique(_ text: String) {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { return }
            if !questions.contains(trimmed) {
                questions.append(trimmed)
            }
        }

        if let pending = try? await fetchLatestPendingInquiry(userId: user.id),
           let questionText = pending.question_text, !questionText.isEmpty {
            appendUnique(questionText)
        }

        let profile = try? await getProfileSettings()
        let scores = profile?.inferred_scale_scores ?? [:]
        if let gad7 = scores["gad7"], gad7 >= 7 {
            appendUnique("最近最让你焦虑的触发点是什么？")
        }
        if let isi = scores["isi"], isi >= 7 {
            appendUnique("最近入睡困难还是早醒更明显？")
        }
        if let pss10 = scores["pss10"], pss10 >= 14 {
            appendUnique("最近压力主要来自哪件事？")
        }
        if let phq9 = scores["phq9"], phq9 >= 8 {
            appendUnique("近两周情绪低落的高峰在什么场景？")
        }

        let logs = (try? await getMonthlyWellnessLogs()) ?? []
        let calibrations = await fetchDigitalTwinCalibrations(userId: user.id, logs: logs)
        if let latest = calibrations.last {
            if latest.sleepHours > 0, latest.sleepHours < 6 {
                appendUnique("最近睡眠偏少，影响最大的是哪一段？")
            }
            if latest.stressLevel >= 7 {
                appendUnique("当前压力偏高，想先优化哪一块？")
            }
            if latest.energyLevel <= 4 {
                appendUnique("最近精力偏低，你更想提升哪一时段？")
            }
        }

        if let goal = profile?.primary_goal, !goal.isEmpty {
            switch goal {
            case "maintain_energy":
                appendUnique("基于你的目标，怎样提升白天能量？")
            case "improve_sleep":
                appendUnique("基于你的目标，先从睡眠哪个环节优化？")
            case "reduce_stress":
                appendUnique("基于你的目标，先从哪种减压方式开始？")
            default:
                appendUnique("围绕你的目标，我该先给你什么建议？")
            }
        }

        for fallback in defaults where questions.count < 4 {
            appendUnique(fallback)
        }

        return Array(questions.prefix(4))
    }
}

// MARK: - 🆕 Science Feed API
extension SupabaseManager {
    /// 获取科学期刊 Feed
    func getScienceFeed(language: String) async throws -> ScienceFeedResponse {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        struct CuratedFeedRow: Codable {
            let id: String
            let content_type: String?
            let title: String
            let summary: String?
            let url: String?
            let source: String
            let relevance_score: Double?
            let relevance_explanation: String?
            let created_at: String?
        }

        let endpoint = "curated_feed_queue?user_id=eq.\(user.id)&select=id,content_type,title,summary,url,source,relevance_score,relevance_explanation,created_at&order=relevance_score.desc.nullsfirst,created_at.desc&limit=20"
        let curatedRows: [CuratedFeedRow] = (try? await request(endpoint)) ?? []

        if !curatedRows.isEmpty {
            let articles = curatedRows.map { row in
                ScienceArticle(
                    id: row.id,
                    title: row.title,
                    titleZh: nil,
                    summary: row.summary,
                    summaryZh: nil,
                    sourceType: row.source,
                    sourceUrl: row.url,
                    matchPercentage: row.relevance_score.map { Int($0 * 100) },
                    whyRecommended: row.relevance_explanation,
                    actionableInsight: nil,
                    tags: nil,
                    createdAt: row.created_at.flatMap { ISO8601DateFormatter().date(from: $0) }
                )
            }
            return ScienceFeedResponse(
                success: true,
                items: articles,
                data: nil,
                personalization: FeedPersonalization(ready: true, message: nil, fallback: nil)
            )
        }

        let fallbackQuery = language == "en" ? "anxiety sleep stress" : "焦虑 睡眠 压力"
        let result = await ScientificSearchService.searchScientificTruth(query: fallbackQuery)
        let articles = result.papers.map { paper in
            ScienceArticle(
                id: paper.id,
                title: paper.title,
                titleZh: nil,
                summary: paper.abstract,
                summaryZh: nil,
                sourceType: paper.source.rawValue,
                sourceUrl: paper.url,
                matchPercentage: Int(paper.compositeScore * 100),
                whyRecommended: "基于科学检索匹配",
                actionableInsight: nil,
                tags: nil,
                createdAt: nil
            )
        }

        return ScienceFeedResponse(
            success: !articles.isEmpty,
            items: articles,
            data: nil,
            personalization: FeedPersonalization(
                ready: !articles.isEmpty,
                message: articles.isEmpty ? (language == "en" ? "No curated feed available." : "暂无推荐内容") : nil,
                fallback: articles.isEmpty ? (language == "en" ? "Please check back later." : "请稍后再试") : nil
            )
        )
    }
    
    /// 提交 Feed 反馈
    func submitFeedFeedback(_ feedback: FeedFeedbackInput) async throws {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        struct FeedbackRow: Encodable {
            let user_id: String
            let content_id: String
            let content_url: String?
            let content_title: String?
            let source: String?
            let feedback_type: String
        }

        let payload = FeedbackRow(
            user_id: user.id,
            content_id: feedback.contentId,
            content_url: feedback.contentUrl,
            content_title: feedback.contentTitle,
            source: feedback.source,
            feedback_type: feedback.feedbackType
        )
        try await requestVoid("user_feed_feedback", method: "POST", body: payload)
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
        if let url = appAPIURL(path: "api/understanding-score", queryItems: queryItems) {
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            attachSupabaseCookies(to: &request)

            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                    return try JSONDecoder().decode(UnderstandingScoreResponse.self, from: data)
                }
            } catch {
                print("[UnderstandingScore] Remote API failed: \(error)")
            }
        }

        return try await buildUnderstandingScoreLocally(includeHistory: includeHistory, days: days)
    }

    private func buildUnderstandingScoreLocally(includeHistory: Bool, days: Int) async throws -> UnderstandingScoreResponse {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let normalizedDays = max(1, days)
        let now = Date()
        let calendar = Calendar(identifier: .gregorian)
        let startDate = calendar.date(byAdding: .day, value: -(normalizedDays - 1), to: now) ?? now
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        let startString = dateFormatter.string(from: startDate)

        let logs = (try? await getMonthlyWellnessLogs()) ?? []
        let logsInRange = logs.filter { $0.log_date.prefix(10) >= startString }
        let completionRate = min(1.0, Double(logsInRange.count) / Double(normalizedDays))

        struct InquiryRow: Codable {
            let responded_at: String?
            let created_at: String?
        }
        let inquiryEndpoint = "inquiry_history?user_id=eq.\(user.id)&select=responded_at,created_at&created_at=gte.\(startString)"
        let inquiryRows: [InquiryRow] = (try? await request(inquiryEndpoint)) ?? []
        let totalInquiries = inquiryRows.count
        let respondedCount = inquiryRows.filter { ($0.responded_at ?? "").isEmpty == false }.count
        let inquiryRate = totalInquiries == 0 ? 0.4 : min(1.0, Double(respondedCount) / Double(totalInquiries))

        let profile = try? await getProfileSettings()
        var preferenceScore: Double = 0.2
        if let personality = profile?.ai_personality, !personality.isEmpty { preferenceScore += 0.2 }
        if let language = profile?.preferred_language, !language.isEmpty { preferenceScore += 0.2 }
        if let goal = profile?.primary_goal, !goal.isEmpty { preferenceScore += 0.2 }
        if let focus = profile?.current_focus, !focus.isEmpty { preferenceScore += 0.2 }
        preferenceScore = min(1.0, preferenceScore)

        let currentScore = (35 + 65 * (0.45 * completionRate + 0.35 * inquiryRate + 0.2 * preferenceScore)).rounded()

        let breakdown = UnderstandingScoreBreakdown(
            completionPredictionAccuracy: (completionRate * 100).rounded(),
            replacementAcceptanceRate: (inquiryRate * 100).rounded(),
            sentimentPredictionAccuracy: ((completionRate * 0.6 + preferenceScore * 0.4) * 100).rounded(),
            preferencePatternMatch: (preferenceScore * 100).rounded()
        )

        let score = UnderstandingScore(
            current: currentScore,
            breakdown: breakdown,
            isDeepUnderstanding: currentScore >= 70,
            lastUpdated: ISO8601DateFormatter().string(from: now)
        )

        var history: [UnderstandingScoreHistory] = []
        if includeHistory {
            for offset in (0..<normalizedDays).reversed() {
                if let day = calendar.date(byAdding: .day, value: -offset, to: now) {
                    let dayString = dateFormatter.string(from: day)
                    let hasLog = logsInRange.contains { $0.log_date.hasPrefix(dayString) }
                    let hasInquiry = inquiryRows.contains {
                        ($0.responded_at ?? "").hasPrefix(dayString)
                    }
                    let dailyScore = (30 + 70 * ((hasLog ? 0.6 : 0) + (hasInquiry ? 0.4 : 0))).rounded()
                    history.append(UnderstandingScoreHistory(date: dayString, score: dailyScore, factorsChanged: nil))
                }
            }
        }

        return UnderstandingScoreResponse(score: score, history: includeHistory ? history : nil)
    }
}

// MARK: - 🆕 Inquiry API
extension SupabaseManager {
    fileprivate struct InquiryHistoryRow: Codable {
        let id: String
        let user_id: String?
        let question_text: String?
        let question_type: String?
        let priority: String?
        let data_gaps_addressed: [String]?
        let user_response: String?
        let responded_at: String?
        let delivery_method: String?
        let created_at: String?
    }

    fileprivate struct InquiryHistoryInsert: Encodable {
        let user_id: String
        let question_text: String
        let question_type: String
        let priority: String
        let data_gaps_addressed: [String]
        let delivery_method: String
    }

    fileprivate struct InquiryHistoryUpdate: Encodable {
        let user_response: String
        let responded_at: String
    }

    fileprivate struct InquiryGapRow: Codable {
        let data_gaps_addressed: [String]?
    }

    fileprivate struct InquiryRecentResponseRow: Codable {
        let responded_at: String?
    }

    private func getInquiryContextSummary(language: String, limit: Int = 8) async throws -> String? {
        guard let user = currentUser else { return nil }

        let endpoint = "inquiry_history?user_id=eq.\(user.id)&select=id,question_text,user_response,data_gaps_addressed,created_at,responded_at&order=created_at.desc&limit=\(max(1, limit))"
        let rows: [InquiryHistoryRow] = (try? await request(endpoint)) ?? []
        guard !rows.isEmpty else { return nil }

        let records = rows.map { row in
            InquiryHistoryRecord(
                id: row.id,
                questionText: row.question_text ?? "",
                userResponse: row.user_response,
                dataGapsAddressed: row.data_gaps_addressed ?? [],
                createdAt: row.created_at ?? "",
                respondedAt: row.responded_at
            )
        }

        let context = InquiryContextService.buildContext(from: records, language: language)
        return InquiryContextService.generateSummary(context, language: language)
    }

    /// 获取待答问询（本地 Supabase 直连）
    func getPendingInquiry(language: String) async throws -> InquiryPendingResponse {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        if let existing = try? await fetchLatestPendingInquiry(userId: user.id) {
            let question = resolveInquiryQuestion(from: existing, language: language)
            return InquiryPendingResponse(hasInquiry: question != nil, inquiry: question)
        }

        if await hasRecentInquiryResponse(userId: user.id, withinMinutes: 20) {
            return InquiryPendingResponse(hasInquiry: false, inquiry: nil)
        }

        let answeredGaps = await fetchAnsweredGapsToday(userId: user.id)

        // 无待答问询，尝试生成新的问询
        if let inquiry = try await generateInquiryFromGaps(language: language, excluding: answeredGaps) {
            return InquiryPendingResponse(hasInquiry: true, inquiry: inquiry)
        }

        return InquiryPendingResponse(hasInquiry: false, inquiry: nil)
    }
    
    /// 提交问询回答（本地 Supabase 直连）
    func respondInquiry(inquiryId: String, response: String) async throws -> InquiryRespondResponse {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let payload = InquiryHistoryUpdate(
            user_response: response,
            responded_at: ISO8601DateFormatter().string(from: Date())
        )
        let endpoint = "inquiry_history?id=eq.\(inquiryId)"
        let updatedRows: [InquiryHistoryRow] = try await request(endpoint, method: "PATCH", body: payload, prefer: "return=representation")

        if let gapField = updatedRows.first?.data_gaps_addressed?.first {
            await syncInquiryResponseToCalibration(userId: user.id, gapField: gapField, response: response)
        }
        return InquiryRespondResponse(success: true, message: nil)
    }

    private func fetchLatestPendingInquiry(userId: String) async throws -> InquiryHistoryRow? {
        let endpoint = "inquiry_history?user_id=eq.\(userId)&responded_at=is.null&order=created_at.desc&limit=1"
        let rows: [InquiryHistoryRow] = try await request(endpoint)
        return rows.first
    }

    private func resolveInquiryQuestion(from row: InquiryHistoryRow, language: String) -> InquiryQuestion? {
        guard let questionText = row.question_text,
              let questionType = row.question_type,
              let priority = row.priority else {
            return nil
        }

        let gaps = row.data_gaps_addressed ?? []
        var resolvedText = questionText
        var options: [InquiryOption]?
        if let gap = gaps.first,
           let template = InquiryEngine.inquiryTemplate(
            for: DataGap(field: gap, importance: .medium, description: gap, lastUpdated: row.created_at),
            language: language
           ) {
            resolvedText = template.questionText
            options = template.options
        }

        return InquiryQuestion(
            id: row.id,
            questionText: resolvedText,
            questionType: questionType,
            priority: priority,
            dataGapsAddressed: gaps,
            options: options,
            feedContent: nil
        )
    }

    private func generateInquiryFromGaps(
        language: String,
        excluding answeredGaps: Set<String> = []
    ) async throws -> InquiryQuestion? {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let recentData = await collectRecentInquiryData(userId: user.id)
        let gaps = InquiryEngine.identifyDataGaps(recentData: recentData, staleThresholdHours: 24)
        let filtered = gaps.filter { gap in
            !answeredGaps.contains(gap.field)
        }
        let prioritized = InquiryEngine.prioritizeDataGaps(filtered)

        guard let gap = prioritized.first,
              let inquiry = InquiryEngine.inquiryTemplate(for: gap, language: language) else {
            return nil
        }

        let payload = InquiryHistoryInsert(
            user_id: user.id,
            question_text: inquiry.questionText,
            question_type: inquiry.questionType,
            priority: inquiry.priority,
            data_gaps_addressed: inquiry.dataGapsAddressed,
            delivery_method: "in_app"
        )

        _ = try? await requestVoid("inquiry_history", method: "POST", body: payload, prefer: "return=representation")
        return inquiry
    }

    private func hasRecentInquiryResponse(userId: String, withinMinutes: Int) async -> Bool {
        let threshold = Date().addingTimeInterval(-Double(max(1, withinMinutes)) * 60)
        let iso = ISO8601DateFormatter().string(from: threshold)
        let endpoint = "inquiry_history?user_id=eq.\(userId)&user_response=not.is.null&responded_at=gte.\(iso)&select=responded_at&order=responded_at.desc&limit=1"
        let rows: [InquiryRecentResponseRow] = (try? await request(endpoint)) ?? []
        return !rows.isEmpty
    }

    private func fetchAnsweredGapsToday(userId: String) async -> Set<String> {
        let dayString = utcDayString(for: Date())
        let endpoint = "inquiry_history?user_id=eq.\(userId)&user_response=not.is.null&responded_at=gte.\(dayString)T00:00:00Z&select=data_gaps_addressed"
        let rows: [InquiryGapRow] = (try? await request(endpoint)) ?? []
        var gaps = Set<String>()
        for row in rows {
            row.data_gaps_addressed?.forEach { gaps.insert($0) }
        }
        return gaps
    }

    private func utcDayString(for date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter.string(from: date)
    }

    private func syncInquiryResponseToCalibration(userId: String, gapField: String, response: String) async {
        let now = Date()
        var payload: [String: AnyCodable] = [
            "user_id": AnyCodable(userId),
            "date": AnyCodable(utcDayString(for: now)),
            "updated_at": AnyCodable(ISO8601DateFormatter().string(from: now))
        ]

        switch gapField {
        case "sleep_hours":
            let map: [String: Double] = [
                "under_6": 5,
                "6_7": 6.5,
                "7_8": 7.5,
                "over_8": 8.5
            ]
            if let value = map[response] {
                payload["sleep_hours"] = AnyCodable(value)
            }
        case "stress_level":
            let map: [String: Int] = [
                "low": 3,
                "medium": 6,
                "high": 9
            ]
            if let value = map[response] {
                payload["stress_level"] = AnyCodable(value)
            }
        case "exercise_duration":
            let map: [String: Int] = [
                "none": 0,
                "light": 15,
                "moderate": 30,
                "intense": 60
            ]
            if let value = map[response] {
                payload["exercise_duration"] = AnyCodable(value)
            }
        case "mood":
            let map: [String: Int] = [
                "bad": 3,
                "okay": 6,
                "great": 9
            ]
            if let value = map[response] {
                payload["mood_score"] = AnyCodable(value)
            }
        case "meal_quality":
            payload["meal_quality"] = AnyCodable(response)
        case "water_intake":
            payload["water_intake"] = AnyCodable(response)
        default:
            break
        }

        guard payload.keys.count > 3 else { return }

        do {
            try await requestVoid(
                "daily_calibrations?on_conflict=user_id,date",
                method: "POST",
                body: payload,
                prefer: "resolution=merge-duplicates,return=representation"
            )
        } catch {
            print("[Inquiry] daily_calibrations sync warning: \(error)")
        }
    }

    private func collectRecentInquiryData(userId: String) async -> [String: (value: String, timestamp: String)] {
        var data: [String: (value: String, timestamp: String)] = [:]

        if let recentLogs = try? await getWeeklyWellnessLogs() {
            for log in recentLogs {
                let timestamp = log.log_date
                if let minutes = log.sleep_duration_minutes {
                    data["sleep_hours"] = (value: String(format: "%.1f", Double(minutes) / 60.0), timestamp: timestamp)
                }
                if let stress = log.stress_level {
                    data["stress_level"] = (value: "\(stress)", timestamp: timestamp)
                }
                if let exercise = log.exercise_duration_minutes {
                    data["exercise_duration"] = (value: "\(exercise)", timestamp: timestamp)
                }
                if let mood = log.mood_status {
                    data["mood"] = (value: mood, timestamp: timestamp)
                }
                if let energy = log.energy_level {
                    data["energy_level"] = (value: "\(energy)", timestamp: timestamp)
                }
            }
        }

        // 日常校准表的补充（如果存在）
        struct CalibrationRow: Codable {
            let date: String
            let sleep_hours: Double?
            let stress_level: Int?
            let exercise_duration: Int?
            let meal_quality: String?
            let mood_score: Int?
            let water_intake: String?
        }
        let calibrationEndpoint = "daily_calibrations?user_id=eq.\(userId)&select=date,sleep_hours,stress_level,exercise_duration,meal_quality,mood_score,water_intake&order=date.desc&limit=7"
        if let rows: [CalibrationRow] = try? await request(calibrationEndpoint) {
            for row in rows {
                let timestamp = row.date
                if let sleepHours = row.sleep_hours {
                    data["sleep_hours"] = (value: String(format: "%.1f", sleepHours), timestamp: timestamp)
                }
                if let stress = row.stress_level {
                    data["stress_level"] = (value: "\(stress)", timestamp: timestamp)
                }
                if let exercise = row.exercise_duration {
                    data["exercise_duration"] = (value: "\(exercise)", timestamp: timestamp)
                }
                if let meal = row.meal_quality {
                    data["meal_quality"] = (value: meal, timestamp: timestamp)
                }
                if let moodScore = row.mood_score {
                    data["mood"] = (value: "\(moodScore)", timestamp: timestamp)
                }
                if let water = row.water_intake {
                    data["water_intake"] = (value: water, timestamp: timestamp)
                }
            }
        }

        return data
    }
}

// MARK: - 🆕 Habits API
extension SupabaseManager {
    struct HabitStatus: Identifiable, Equatable {
        let id: String
        let title: String
        let description: String?
        let minResistanceLevel: Int?
        var isCompleted: Bool
    }

    private struct HabitRowV2: Codable {
        let id: FlexibleId
        let title: String
        let description: String?
        let min_resistance_level: Int?
        let created_at: String?
    }

    private struct HabitRowLegacy: Codable {
        let id: FlexibleId
        let habit_name: String
        let cue: String?
        let response: String?
        let reward: String?
        let belief_score: Int?
        let created_at: String?
    }

    private struct HabitCompletionRow: Codable {
        let habit_id: FlexibleId
        let completed_at: String?
    }

    func getHabitsForToday(referenceDate: Date = Date()) async throws -> [HabitStatus] {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let backend = await resolveHabitsBackend(userId: user.id)
        var habits = try await fetchHabits(backend: backend, userId: user.id)
        if habits.isEmpty {
            habits = try await seedDefaultHabits(backend: backend, userId: user.id)
        }

        let completedIds = try await fetchHabitCompletionIds(
            backend: backend,
            userId: user.id,
            referenceDate: referenceDate
        )

        if !completedIds.isEmpty {
            let completedSet = Set(completedIds)
            habits = habits.map { habit in
                var updated = habit
                updated.isCompleted = completedSet.contains(habit.id)
                return updated
            }
        }

        return habits
    }

    func setHabitCompletion(habitId: String, isCompleted: Bool, referenceDate: Date = Date()) async throws {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }
        let backend = await resolveHabitsBackend(userId: user.id)

        let (start, end) = dayRange(for: referenceDate)
        let habitValue = habitIdPayloadValue(habitId)
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime]

        switch backend {
        case .v2:
            if isCompleted {
                let payload: [String: AnyCodable] = [
                    "user_id": AnyCodable(user.id),
                    "habit_id": habitValue,
                    "completed_at": AnyCodable(dateFormatter.string(from: referenceDate))
                ]
                try await requestVoid("habit_completions", method: "POST", body: payload, prefer: "return=representation")
            } else {
                let endpoint = "habit_completions?user_id=eq.\(user.id)&habit_id=eq.\(habitId)&completed_at=gte.\(start)&completed_at=lt.\(end)"
                try await requestVoid(endpoint, method: "DELETE", body: nil, prefer: nil)
            }
        case .legacy:
            if isCompleted {
                let payload: [String: AnyCodable] = [
                    "habit_id": habitValue,
                    "completed_at": AnyCodable(dateFormatter.string(from: referenceDate))
                ]
                try await requestVoid("habit_log", method: "POST", body: payload, prefer: "return=representation")
            } else {
                let endpoint = "habit_log?habit_id=eq.\(habitId)&completed_at=gte.\(start)&completed_at=lt.\(end)"
                try await requestVoid(endpoint, method: "DELETE", body: nil, prefer: nil)
            }
        }
    }

    private func resolveHabitsBackend(userId: String) async -> HabitsBackend {
        if let cached = habitsBackendCache {
            return cached
        }
        do {
            let _: [HabitRowV2] = try await request("habits?user_id=eq.\(userId)&select=id&limit=1")
            habitsBackendCache = .v2
            return .v2
        } catch {
            habitsBackendCache = .legacy
            return .legacy
        }
    }

    private func fetchHabits(backend: HabitsBackend, userId: String) async throws -> [HabitStatus] {
        switch backend {
        case .v2:
            let endpoint = "habits?user_id=eq.\(userId)&select=id,title,description,min_resistance_level,created_at&order=created_at.asc"
            let rows: [HabitRowV2] = try await request(endpoint)
            return rows.map { row in
                HabitStatus(
                    id: row.id.value,
                    title: row.title,
                    description: row.description,
                    minResistanceLevel: row.min_resistance_level,
                    isCompleted: false
                )
            }
        case .legacy:
            let endpoint = "user_habits?user_id=eq.\(userId)&select=id,habit_name,cue,response,reward,belief_score,created_at&order=created_at.asc"
            do {
                let rows: [HabitRowLegacy] = try await request(endpoint)
                return rows.map { row in
                    let description = [row.cue, row.response, row.reward].compactMap { $0 }.first
                    return HabitStatus(
                        id: row.id.value,
                        title: row.habit_name,
                        description: description,
                        minResistanceLevel: row.belief_score,
                        isCompleted: false
                    )
                }
            } catch {
                let fallbackEndpoint = "user_habits?user_id=eq.\(userId)&select=id,habit_name,cue,response,reward,created_at&order=created_at.asc"
                let rows: [HabitRowLegacy] = try await request(fallbackEndpoint)
                return rows.map { row in
                    let description = [row.cue, row.response, row.reward].compactMap { $0 }.first
                    return HabitStatus(
                        id: row.id.value,
                        title: row.habit_name,
                        description: description,
                        minResistanceLevel: nil,
                        isCompleted: false
                    )
                }
            }
        }
    }

    private func seedDefaultHabits(backend: HabitsBackend, userId: String) async throws -> [HabitStatus] {
        let defaults = defaultHabitTemplates()
        switch backend {
        case .v2:
            for habit in defaults {
                let payload: [String: AnyCodable] = [
                    "user_id": AnyCodable(userId),
                    "title": AnyCodable(habit.title),
                    "description": AnyCodable(habit.description ?? ""),
                    "min_resistance_level": AnyCodable(habit.minResistanceLevel ?? 3)
                ]
                let _: [[String: AnyCodable]]? = try? await request("habits", method: "POST", body: payload, prefer: "return=representation")
            }
        case .legacy:
            for habit in defaults {
                let payload: [String: AnyCodable] = [
                    "user_id": AnyCodable(userId),
                    "habit_name": AnyCodable(habit.title),
                    "cue": AnyCodable(habit.description ?? ""),
                    "belief_score": AnyCodable(habit.minResistanceLevel ?? 3)
                ]
                let inserted: [[String: AnyCodable]]? = try? await request("user_habits", method: "POST", body: payload, prefer: "return=representation")
                if inserted == nil {
                    let fallbackPayload: [String: AnyCodable] = [
                        "user_id": AnyCodable(userId),
                        "habit_name": AnyCodable(habit.title),
                        "cue": AnyCodable(habit.description ?? "")
                    ]
                    let _: [[String: AnyCodable]]? = try? await request("user_habits", method: "POST", body: fallbackPayload, prefer: "return=representation")
                }
            }
        }
        return try await fetchHabits(backend: backend, userId: userId)
    }

    private func defaultHabitTemplates() -> [HabitStatus] {
        [
            HabitStatus(id: UUID().uuidString, title: "补水 2000ml", description: "保持全天水分摄入", minResistanceLevel: 2, isCompleted: false),
            HabitStatus(id: UUID().uuidString, title: "完成 5 分钟呼吸", description: "降低紧张水平", minResistanceLevel: 1, isCompleted: false),
            HabitStatus(id: UUID().uuidString, title: "完成 20 分钟运动", description: "提升能量与心率变异性", minResistanceLevel: 3, isCompleted: false),
            HabitStatus(id: UUID().uuidString, title: "22:30 前入睡", description: "稳定昼夜节律", minResistanceLevel: 3, isCompleted: false)
        ]
    }

    private func fetchHabitCompletionIds(
        backend: HabitsBackend,
        userId: String,
        referenceDate: Date
    ) async throws -> [String] {
        let (start, end) = dayRange(for: referenceDate)
        let endpoint: String
        switch backend {
        case .v2:
            endpoint = "habit_completions?user_id=eq.\(userId)&completed_at=gte.\(start)&completed_at=lt.\(end)&select=habit_id"
        case .legacy:
            endpoint = "habit_log?completed_at=gte.\(start)&completed_at=lt.\(end)&select=habit_id"
        }

        let rows: [HabitCompletionRow] = (try? await request(endpoint)) ?? []
        return rows.map { $0.habit_id.value }
    }

    private func dayRange(for date: Date) -> (String, String) {
        let calendar = Calendar(identifier: .gregorian)
        let startDate = calendar.startOfDay(for: date)
        let endDate = calendar.date(byAdding: .day, value: 1, to: startDate) ?? startDate.addingTimeInterval(86400)

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let start = formatter.string(from: startDate)
        let end = formatter.string(from: endDate)
        return (start, end)
    }

    private func habitIdPayloadValue(_ habitId: String) -> AnyCodable {
        if let intValue = Int(habitId) {
            return AnyCodable(intValue)
        }
        return AnyCodable(habitId)
    }
}

// MARK: - 🆕 Bayesian API
extension SupabaseManager {
    private struct BayesianBeliefRow: Codable {
        let id: String
        let belief_context: String?
        let prior_score: Double
        let posterior_score: Double
        let evidence_stack: [EvidenceItem]?
        let calculation_details: [String: CodableValue]?
        let created_at: String?
    }

    func getBayesianHistory(range: BayesianHistoryRange, context: String? = nil) async throws -> BayesianHistoryResponse {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        var endpoint = "bayesian_beliefs?user_id=eq.\(user.id)&select=*&order=created_at.asc"
        if let startDate = bayesianStartDate(range: range) {
            endpoint += "&created_at=gte.\(startDate)"
        }
        if let context, !context.isEmpty {
            endpoint += "&belief_context=eq.\(context)"
        }

        let rows: [BayesianBeliefRow] = (try? await request(endpoint)) ?? []
        let points: [BayesianHistoryPoint] = rows.compactMap { row in
            let exaggeration: Double
            if let details = row.calculation_details,
               case .number(let value) = details["exaggeration_factor"] {
                exaggeration = value
            } else {
                exaggeration = row.posterior_score > 0 ? (row.prior_score / row.posterior_score) : 1
            }
            return BayesianHistoryPoint(
                id: row.id,
                date: row.created_at ?? ISO8601DateFormatter().string(from: Date()),
                beliefContext: row.belief_context,
                priorScore: row.prior_score,
                posteriorScore: row.posterior_score,
                evidenceStack: row.evidence_stack,
                exaggerationFactor: exaggeration
            )
        }

        let summary = summarizeBayesianHistory(points: points)
        let data = BayesianHistoryData(points: points, summary: summary)
        return BayesianHistoryResponse(success: true, data: data, error: nil)
    }

    func triggerBayesianNudge(actionType: String, durationMinutes: Int?) async throws -> BayesianNudgeResponse {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let correction = calculateNudgeCorrection(actionType: actionType, durationMinutes: durationMinutes)
        let message = generateNudgeMessage(actionType: actionType, correction: correction)

        let endpoint = "bayesian_beliefs?user_id=eq.\(user.id)&select=*&order=created_at.desc&limit=1"
        let rows: [BayesianBeliefRow] = (try? await request(endpoint)) ?? []

        guard let latest = rows.first else {
            return BayesianNudgeResponse(
                success: true,
                data: BayesianNudgeData(correction: correction, newPosterior: clampBayesian(50 + correction), message: message),
                error: nil
            )
        }

        let newPosterior = clampBayesian(latest.posterior_score + correction)
        var updatedStack = latest.evidence_stack ?? []
        updatedStack.append(EvidenceItem(id: UUID(), type: .action, value: message, weight: correction))

        let updatePayload: [String: AnyCodable] = [
            "posterior_score": AnyCodable(newPosterior),
            "evidence_stack": AnyCodable(updatedStack.map { ["type": $0.type.rawValue, "value": $0.value, "weight": $0.weight ?? 0] })
        ]
        _ = try? await requestVoid(
            "bayesian_beliefs?id=eq.\(latest.id)",
            method: "PATCH",
            body: updatePayload,
            prefer: "return=representation"
        )

        return BayesianNudgeResponse(
            success: true,
            data: BayesianNudgeData(correction: correction, newPosterior: newPosterior, message: message),
            error: nil
        )
    }

    func runBayesianRitual(context: String, priorScore: Int, customQuery: String?) async throws -> BayesianRitualResponse {
        guard let user = currentUser else { throw SupabaseError.notAuthenticated }

        let query = (customQuery?.isEmpty == false ? customQuery! : context)
        let papersResult = await ScientificSearchService.searchScientificTruth(query: query)
        let hrvValue = try? await getHardwareData()?.hrv?.value

        let likelihood = BayesianEngine.calculateLikelihood(hrvData: BayesianHRVData(rmssd: hrvValue, lf_hf_ratio: nil))
        let evidenceWeight = BayesianEngine.calculateEvidenceWeight(
            papers: papersResult.papers.map {
                BayesianPaper(id: $0.id, title: $0.title, relevanceScore: $0.compositeScore, url: $0.url)
            }
        )
        let posterior = BayesianEngine.calculateBayesianPosterior(
            prior: Double(priorScore),
            likelihood: likelihood,
            evidence: evidenceWeight
        )

        var evidenceStack: [EvidenceItem] = []
        if let hrvValue {
            evidenceStack.append(EvidenceItem(id: UUID(), type: .bio, value: "HRV \(Int(hrvValue))", weight: likelihood))
        }
        for paper in papersResult.papers.prefix(3) {
            evidenceStack.append(EvidenceItem(id: UUID(), type: .science, value: paper.title, weight: paper.compositeScore))
        }

        let exaggeration = posterior > 0 ? (Double(priorScore) / posterior) : 1
        let payload: [String: AnyCodable] = [
            "user_id": AnyCodable(user.id),
            "belief_context": AnyCodable(context),
            "prior_score": AnyCodable(Double(priorScore)),
            "posterior_score": AnyCodable(posterior),
            "evidence_stack": AnyCodable(evidenceStack.map { ["type": $0.type.rawValue, "value": $0.value, "weight": $0.weight ?? 0] }),
            "calculation_details": AnyCodable([
                "exaggeration_factor": exaggeration,
                "evidence_weight": evidenceWeight,
                "likelihood": likelihood
            ])
        ]

        var insertedId = UUID().uuidString
        if let rows: [[String: AnyCodable]] = try? await request("bayesian_beliefs", method: "POST", body: payload, prefer: "return=representation"),
           let first = rows.first,
           let idValue = first["id"]?.value as? String {
            insertedId = idValue
        }

        let message = "概率已调整至 \(Int(posterior))%"
        let data = BayesianRitualData(
            id: insertedId,
            priorScore: Double(priorScore),
            posteriorScore: posterior,
            evidenceStack: evidenceStack,
            exaggerationFactor: exaggeration,
            message: message
        )
        return BayesianRitualResponse(success: true, data: data, error: nil)
    }

    private func bayesianStartDate(range: BayesianHistoryRange) -> String? {
        let now = Date()
        let calendar = Calendar.current
        let date: Date?
        switch range {
        case .days7:
            date = calendar.date(byAdding: .day, value: -7, to: now)
        case .days30:
            date = calendar.date(byAdding: .day, value: -30, to: now)
        case .days90:
            date = calendar.date(byAdding: .day, value: -90, to: now)
        case .all:
            date = nil
        }
        guard let date else { return nil }
        return ISO8601DateFormatter().string(from: date)
    }

    private func summarizeBayesianHistory(points: [BayesianHistoryPoint]) -> BayesianHistorySummary {
        let total = points.count
        let averagePrior = total > 0 ? points.reduce(0) { $0 + $1.priorScore } / Double(total) : 0
        let averagePosterior = total > 0 ? points.reduce(0) { $0 + $1.posteriorScore } / Double(total) : 0
        let averageReduction = averagePrior - averagePosterior
        let trend = calculateBayesianTrend(points: points)

        return BayesianHistorySummary(
            totalEntries: total,
            averagePrior: round1(averagePrior),
            averagePosterior: round1(averagePosterior),
            averageReduction: round1(averageReduction),
            trend: trend
        )
    }

    private func calculateBayesianTrend(points: [BayesianHistoryPoint]) -> String {
        guard points.count >= 3 else { return "stable" }
        let recent = points.suffix(5)
        let older = points.dropLast(5).suffix(5)
        guard !older.isEmpty else { return "stable" }
        let recentAvg = recent.reduce(0) { $0 + $1.posteriorScore } / Double(recent.count)
        let olderAvg = older.reduce(0) { $0 + $1.posteriorScore } / Double(older.count)
        let diff = recentAvg - olderAvg
        if diff < -5 { return "improving" }
        if diff > 5 { return "worsening" }
        return "stable"
    }

    private func round1(_ value: Double) -> Double {
        (value * 10).rounded() / 10
    }

    private func calculateNudgeCorrection(actionType: String, durationMinutes: Int?) -> Double {
        let base: [String: Double] = [
            "breathing_exercise": -5,
            "meditation": -8,
            "exercise": -10,
            "sleep_improvement": -7,
            "hydration": -3,
            "journaling": -4,
            "stretching": -3
        ]
        var correction = base[actionType] ?? -2
        if let durationMinutes, durationMinutes > 10 {
            correction = max(correction * 1.5, -20)
        }
        correction = max(-20, min(-1, correction.rounded()))
        return correction
    }

    private func generateNudgeMessage(actionType: String, correction: Double) -> String {
        let names: [String: String] = [
            "breathing_exercise": "呼吸练习",
            "meditation": "冥想",
            "exercise": "运动",
            "sleep_improvement": "睡眠改善",
            "hydration": "补水",
            "journaling": "日记",
            "stretching": "拉伸"
        ]
        let name = names[actionType] ?? "健康行为"
        return "\(name)完成。皮质醇风险概率修正：\(Int(correction))%"
    }

    private func clampBayesian(_ value: Double) -> Double {
        min(100, max(0, value))
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
        if let inquiry = try await generateInquiryFromGaps(language: language) {
            return inquiry
        }
        throw SupabaseError.requestFailed
    }

    private func isAIConfigured() -> Bool {
        guard let key = Bundle.main.infoDictionary?["OPENAI_API_KEY"] as? String,
              !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return false
        }
        guard let base = Bundle.main.infoDictionary?["OPENAI_API_BASE"] as? String,
              !base.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return false
        }
        return true
    }

    private func extractJSONPayload(from text: String) -> Data? {
        guard let start = text.firstIndex(of: "{"),
              let end = text.lastIndex(of: "}") else { return nil }
        let jsonString = String(text[start...end])
        return jsonString.data(using: .utf8)
    }

    func analyzeVoiceInput(_ input: VoiceAnalysisInput) async throws -> VoiceAnalysisResponse {
        if let url = appAPIURL(path: "api/ai/analyze-voice-input") {
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            attachSupabaseCookies(to: &request)
            request.httpBody = try JSONEncoder().encode(input)

            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                    return try JSONDecoder().decode(VoiceAnalysisResponse.self, from: data)
                }
            } catch {
                print("[VoiceAnalysis] Remote API failed: \(error)")
            }
        }

        return try await analyzeVoiceInputLocally(input)
    }

    func generateInsight(_ input: InsightGenerateInput) async throws -> String {
        if let url = appAPIURL(path: "api/insight/generate") {
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            attachSupabaseCookies(to: &request)
            request.httpBody = try JSONEncoder().encode(input)

            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                    return String(data: data, encoding: .utf8) ?? ""
                }
            } catch {
                print("[Insight] Remote API failed: \(error)")
            }
        }

        return try await generateInsightLocally(input)
    }

    func fetchInsightSummary() async throws -> InsightSummaryResponse {
        if let url = appAPIURL(path: "api/insight") {
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            attachSupabaseCookies(to: &request)

            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                    return try JSONDecoder().decode(InsightSummaryResponse.self, from: data)
                }
            } catch {
                print("[InsightSummary] Remote API failed: \(error)")
            }
        }

        return try await fetchInsightSummaryLocally()
    }

    func getDeepInference(analysisResult: [String: Any], recentLogs: [[String: Any]]) async throws -> String {
        if let url = appAPIURL(path: "api/ai/deep-inference") {
            let payload: [String: Any] = [
                "analysisResult": analysisResult,
                "recentLogs": recentLogs
            ]

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            attachSupabaseCookies(to: &request)
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)

            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                    if let object = try? JSONSerialization.jsonObject(with: data),
                       let prettyData = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted]) {
                        return String(data: prettyData, encoding: .utf8) ?? ""
                    }
                    return String(data: data, encoding: .utf8) ?? ""
                }
            } catch {
                print("[DeepInference] Remote API failed: \(error)")
            }
        }

        return try await getDeepInferenceLocally(analysisResult: analysisResult, recentLogs: recentLogs)
    }

    func explainRecommendation(
        recommendationId: String,
        title: String,
        description: String,
        science: String,
        language: String,
        category: String? = nil
    ) async throws -> String {
        if let url = appAPIURL(path: "api/digital-twin/explain-recommendation") {
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

            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                    struct ExplainResponse: Codable { let explanation: String }
                    let decoded = try JSONDecoder().decode(ExplainResponse.self, from: data)
                    return decoded.explanation
                }
            } catch {
                print("[ExplainRecommendation] Remote API failed: \(error)")
            }
        }

        return try await explainRecommendationLocally(
            recommendationId: recommendationId,
            title: title,
            description: description,
            science: science,
            language: language,
            category: category
        )
    }

    private func analyzeVoiceInputLocally(_ input: VoiceAnalysisInput) async throws -> VoiceAnalysisResponse {
        let transcript = input.transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !transcript.isEmpty else {
            return VoiceAnalysisResponse(formUpdates: [:], summary: "未检测到语音内容。", confidence: 0.1)
        }

        if isAIConfigured() {
            let currentStateData = (try? JSONEncoder().encode(input.currentFormState)) ?? Data()
            let currentState = String(data: currentStateData, encoding: .utf8) ?? "{}"
            let systemPrompt = """
你是健康助手，负责从用户口述中提取结构化数据。
请只输出 JSON，格式如下：
{
  "formUpdates": { "sleepDuration": "...", "sleepQuality": "...", "exerciseDuration": "...", "moodStatus": "...", "stressLevel": "...", "notes": "..." },
  "summary": "...",
  "confidence": 0.0
}
要求：
- formUpdates 只包含你能确定的字段，其余省略
- 数值用字符串表达
- summary 用中文简短总结
- confidence 在 0~1 之间
"""
            let userPrompt = """
Transcript:
\(transcript)

CurrentFormState:
\(currentState)
"""
            let response = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: userPrompt)],
                systemPrompt: systemPrompt,
                model: .deepseekV3Exp,
                temperature: 0.2
            )
            if let data = extractJSONPayload(from: response),
               let parsed = try? JSONDecoder().decode(VoiceAnalysisResponse.self, from: data) {
                return parsed
            }
        }

        return heuristicVoiceAnalysis(input)
    }

    private func heuristicVoiceAnalysis(_ input: VoiceAnalysisInput) -> VoiceAnalysisResponse {
        let transcript = input.transcript.lowercased()
        var updates: [String: String] = [:]

        func match(_ pattern: String) -> String? {
            let regex = try? NSRegularExpression(pattern: pattern, options: [])
            let range = NSRange(transcript.startIndex..<transcript.endIndex, in: transcript)
            if let match = regex?.firstMatch(in: transcript, options: [], range: range),
               let matchRange = Range(match.range(at: 1), in: transcript) {
                return String(transcript[matchRange])
            }
            return nil
        }

        if let sleep = match("(\\d+(?:\\.\\d+)?)\\s*(?:小时|h)") {
            updates["sleepDuration"] = sleep
        }
        if let exercise = match("(\\d+(?:\\.\\d+)?)\\s*(?:分钟|min)") {
            updates["exerciseDuration"] = exercise
        }
        if transcript.contains("压力"), let stress = match("压力\\D{0,6}(\\d+)") {
            updates["stressLevel"] = stress
        }
        if transcript.contains("心情"), let mood = match("心情\\D{0,6}(\\d+)") {
            updates["moodStatus"] = mood
        }

        let summary = updates.isEmpty ? "暂未识别到可填写的数据。" : "已从描述中提取可更新字段。"
        let confidence = updates.isEmpty ? 0.2 : 0.45
        return VoiceAnalysisResponse(formUpdates: updates, summary: summary, confidence: confidence)
    }

    private func generateInsightLocally(_ input: InsightGenerateInput) async throws -> String {
        if isAIConfigured() {
            let systemPrompt = """
你是健康数据洞察助手。请基于输入的睡眠、HRV、压力、运动数据，输出 3 条洞察和 2 条建议。
要求：中文、简洁、可执行、不做医疗诊断。
"""
            let userPrompt = """
sleepHours: \(input.sleepHours)
hrv: \(input.hrv)
stressLevel: \(input.stressLevel)
exerciseMinutes: \(input.exerciseMinutes ?? 0)
"""
            let response = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: userPrompt)],
                systemPrompt: systemPrompt,
                model: .deepseekV3Exp,
                temperature: 0.4
            )
            return response.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        var lines: [String] = []
        if input.sleepHours < 6 {
            lines.append("睡眠时长偏低，可能影响恢复与情绪稳定。")
        } else if input.sleepHours > 8.5 {
            lines.append("睡眠时长偏高，注意是否存在睡眠效率下降。")
        } else {
            lines.append("睡眠时长处于合理区间，保持节律更重要。")
        }
        if input.stressLevel >= 7 {
            lines.append("压力水平偏高，建议增加呼吸练习或短时放松。")
        } else {
            lines.append("压力水平可控，可以继续保持当前节奏。")
        }
        if let exercise = input.exerciseMinutes, exercise < 20 {
            lines.append("运动量偏少，建议每天安排 20 分钟轻度运动。")
        }
        lines.append("建议：固定作息 + 1 次短时呼吸练习。")
        return lines.joined(separator: "\n")
    }

    private func fetchInsightSummaryLocally() async throws -> InsightSummaryResponse {
        let dashboard = try? await getDashboardData()
        let logs = dashboard?.weeklyLogs ?? []
        let avgSleep = logs.compactMap { $0.sleep_duration_minutes }.reduce(0, +)
        let avgSleepHours = logs.isEmpty ? 0 : Double(avgSleep) / Double(logs.count) / 60.0
        let avgStress = logs.compactMap { $0.stress_level }.reduce(0, +)
        let avgStressScore = logs.isEmpty ? 0 : Double(avgStress) / Double(logs.count)

        let baseSummary = "近7天平均睡眠 \(String(format: "%.1f", avgSleepHours)) 小时，平均压力 \(String(format: "%.1f", avgStressScore))。"

        if isAIConfigured() {
            let systemPrompt = """
你是健康周报助手。基于输入的统计摘要，给出 3 条洞察和 1 个重点建议。
要求：中文、简洁、可执行。
"""
            let response = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: baseSummary)],
                systemPrompt: systemPrompt,
                model: .deepseekV3Exp,
                temperature: 0.4
            )
            return InsightSummaryResponse(insight: response.trimmingCharacters(in: .whitespacesAndNewlines))
        }

        return InsightSummaryResponse(insight: baseSummary + " 建议保持作息一致，并安排放松练习。")
    }

    private func getDeepInferenceLocally(analysisResult: [String: Any], recentLogs: [[String: Any]]) async throws -> String {
        let analysisData = (try? JSONSerialization.data(withJSONObject: analysisResult, options: [.prettyPrinted])) ?? Data()
        let logsData = (try? JSONSerialization.data(withJSONObject: recentLogs, options: [.prettyPrinted])) ?? Data()
        let analysisString = String(data: analysisData, encoding: .utf8) ?? "{}"
        let logsString = String(data: logsData, encoding: .utf8) ?? "[]"

        if isAIConfigured() {
            let systemPrompt = """
你是健康趋势分析助手。请基于分析结果和最近日志，输出：1) 主要趋势 2) 可能驱动因素 3) 3 条行动建议。
要求：中文、结构化、避免医疗诊断。
"""
            let userPrompt = """
analysisResult:
\(analysisString)

recentLogs:
\(logsString)
"""
            let response = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: userPrompt)],
                systemPrompt: systemPrompt,
                model: .deepseekV3Exp,
                temperature: 0.4
            )
            return response.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        return "暂无可用的深度推断结果（AI 未配置）。"
    }

    private func explainRecommendationLocally(
        recommendationId: String,
        title: String,
        description: String,
        science: String,
        language: String,
        category: String? = nil
    ) async throws -> String {
        if isAIConfigured() {
            let systemPrompt = language == "en"
                ? "You are Max. Explain why the recommendation helps, in 3 concise bullets, avoid medical claims."
                : "你是 Max，请用 3 条要点解释该建议为何有效，避免医疗诊断。"
            let userPrompt = """
title: \(title)
description: \(description)
science: \(science)
category: \(category ?? "")
"""
            let response = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: userPrompt)],
                systemPrompt: systemPrompt,
                model: .deepseekV3Exp,
                temperature: 0.4
            )
            return response.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        return "该建议有助于稳定节律与降低压力反应，可先尝试 1-2 周观察变化。"
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
