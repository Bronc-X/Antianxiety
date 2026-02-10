//
//  ChatViewModel.swift
//  antios
//
//  D1-D4: 对话视图模型 - 流式响应 + 记忆 + 主动问询
//

import Foundation

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var savedSessions: [ChatSession] = []
    @Published var isStreaming = false
    @Published var activeInquiry: ActiveInquiry?

    private var conversationHistory: [ChatMessage] = []
    private let sessionsStoreKey = "antios_chat_sessions"
    private let lastInquiryAtKey = "antios_last_inquiry_at"

    init() {
        loadSessions()
        addWelcomeMessageIfNeeded()
    }

    private func addWelcomeMessageIfNeeded() {
        guard messages.isEmpty else { return }
        let welcome = ChatMessage(
            id: UUID().uuidString,
            role: .assistant,
            content: "你好！我是 Max，你的健康助手。今天有什么我可以帮助你的吗？",
            citations: [],
            timestamp: Date()
        )
        messages.append(welcome)
    }

    // MARK: - Send Message (D1)

    func sendMessage(_ text: String) async {
        let userMessage = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: text,
            citations: [],
            timestamp: Date()
        )

        messages.append(userMessage)
        conversationHistory.append(userMessage)
        isStreaming = true

        do {
            try await streamResponse(for: text)
        } catch {
            let fallback = ChatMessage(
                id: UUID().uuidString,
                role: .assistant,
                content: "当前网络不可用，我先给你一个离线建议：先做 3 分钟缓慢呼气，然后告诉我现在的压力评分。",
                citations: [],
                timestamp: Date()
            )
            messages.append(fallback)
            conversationHistory.append(fallback)
        }

        isStreaming = false
        checkForActiveInquiry()
    }

    // MARK: - Stream Response

    private func streamResponse(for text: String) async throws {
        struct ChatRequest: Encodable {
            let message: String
            let history: [[String: String]]
        }

        let history = conversationHistory.suffix(10).map {
            ["role": $0.role.rawValue, "content": $0.content]
        }

        let stream = await APIClient.shared.streamRequest(
            endpoint: "chat",
            body: ChatRequest(message: text, history: history)
        )

        var fullContent = ""
        var citations: [Citation] = []
        let assistantMessage = ChatMessage(
            id: UUID().uuidString,
            role: .assistant,
            content: "",
            citations: [],
            timestamp: Date()
        )
        messages.append(assistantMessage)
        let messageIndex = messages.count - 1

        for try await chunk in stream {
            if let data = chunk.data(using: .utf8),
               let json = try? JSONDecoder().decode(StreamChunk.self, from: data) {
                fullContent += json.content ?? ""
                if let newCitations = json.citations {
                    citations.append(contentsOf: newCitations)
                }
                messages[messageIndex] = ChatMessage(
                    id: assistantMessage.id,
                    role: .assistant,
                    content: fullContent,
                    citations: citations,
                    timestamp: Date()
                )
            }
        }

        let finalMessage = messages[messageIndex]
        conversationHistory.append(finalMessage)
    }

    // MARK: - Active Inquiry (D4)

    private func checkForActiveInquiry() {
        guard activeInquiry == nil else { return }

        let keywords = ["睡眠", "失眠", "压力", "焦虑", "疲惫", "紧张"]
        let recentContent = messages.suffix(4).map(\.content).joined(separator: " ")
        let containsKeyword = keywords.contains { recentContent.localizedCaseInsensitiveContains($0) }
        guard containsKeyword else { return }

        let now = Date()
        let lastInquiryAt = UserDefaults.standard.object(forKey: lastInquiryAtKey) as? Date
        if let lastInquiryAt, now.timeIntervalSince(lastInquiryAt) < 8 * 3600 {
            return
        }

        activeInquiry = ActiveInquiry(
            id: UUID().uuidString,
            question: "为了给你更准确建议，你最近 3 天的睡眠变化是？",
            options: ["变好了", "差不多", "变差了", "不想回答"]
        )
        UserDefaults.standard.set(now, forKey: lastInquiryAtKey)
    }

    func respondToInquiry(_ response: String) {
        let userResponse = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: response,
            citations: [],
            timestamp: Date()
        )
        messages.append(userResponse)
        conversationHistory.append(userResponse)

        let acknowledgment = ChatMessage(
            id: UUID().uuidString,
            role: .assistant,
            content: "收到，我会把这条变化纳入后续建议。",
            citations: [],
            timestamp: Date()
        )
        messages.append(acknowledgment)
        conversationHistory.append(acknowledgment)
        activeInquiry = nil
    }

    // MARK: - History

    func clearConversation() {
        archiveCurrentConversationIfNeeded()
        messages.removeAll()
        conversationHistory.removeAll()
        activeInquiry = nil
        addWelcomeMessageIfNeeded()
    }

    func restoreSession(_ session: ChatSession) {
        messages = session.messages
        conversationHistory = session.messages.filter { $0.role != .assistant || !$0.content.contains("你好！我是 Max") }
        activeInquiry = nil
    }

    func deleteSessions(at offsets: IndexSet) {
        savedSessions.remove(atOffsets: offsets)
        persistSessions()
    }

    private func archiveCurrentConversationIfNeeded() {
        let userMessageCount = messages.filter { $0.role == .user }.count
        guard userMessageCount > 0 else { return }

        let title = messages.first(where: { $0.role == .user })?.content ?? "未命名对话"
        let session = ChatSession(
            id: UUID().uuidString,
            title: String(title.prefix(24)),
            createdAt: Date(),
            messages: messages
        )

        savedSessions.insert(session, at: 0)
        if savedSessions.count > 20 {
            savedSessions = Array(savedSessions.prefix(20))
        }
        persistSessions()
    }

    private func persistSessions() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let data = try? encoder.encode(savedSessions) {
            UserDefaults.standard.set(data, forKey: sessionsStoreKey)
        }
    }

    private func loadSessions() {
        guard let data = UserDefaults.standard.data(forKey: sessionsStoreKey) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        savedSessions = (try? decoder.decode([ChatSession].self, from: data)) ?? []
    }
}

// MARK: - Models

struct ChatMessage: Identifiable, Codable {
    let id: String
    let role: MessageRole
    let content: String
    let citations: [Citation]
    let timestamp: Date
}

enum MessageRole: String, Codable {
    case user
    case assistant
}

struct Citation: Identifiable, Codable {
    let id: String
    let title: String
    let url: String?
    let source: String?
}

struct ActiveInquiry: Identifiable {
    let id: String
    let question: String
    let options: [String]
}

struct StreamChunk: Decodable {
    let content: String?
    let citations: [Citation]?
}

struct ChatSession: Identifiable, Codable {
    let id: String
    let title: String
    let createdAt: Date
    let messages: [ChatMessage]
}
