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
    @Published var isStreaming = false
    @Published var activeInquiry: ActiveInquiry?
    
    private var conversationHistory: [ChatMessage] = []
    
    init() {
        addWelcomeMessage()
    }
    
    private func addWelcomeMessage() {
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
            let errorMessage = ChatMessage(
                id: UUID().uuidString,
                role: .assistant,
                content: "抱歉，发生了一些问题。请稍后再试。",
                citations: [],
                timestamp: Date()
            )
            messages.append(errorMessage)
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
        
        // Save to conversation memory (D3)
        let finalMessage = messages[messageIndex]
        conversationHistory.append(finalMessage)
    }
    
    // MARK: - Active Inquiry (D4)
    
    private func checkForActiveInquiry() {
        let keywords = ["睡眠", "失眠", "压力", "焦虑"]
        let recentContent = messages.suffix(3).map { $0.content }.joined()
        
        if keywords.contains(where: { recentContent.contains($0) }) && Int.random(in: 0...2) == 0 {
            activeInquiry = ActiveInquiry(
                id: UUID().uuidString,
                question: "你最近的睡眠质量有变化吗？",
                options: ["变好了", "差不多", "变差了", "不想回答"]
            )
        }
    }
    
    func respondToInquiry(_ response: String) {
        guard let inquiry = activeInquiry else { return }
        
        let userResponse = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: response,
            citations: [],
            timestamp: Date()
        )
        messages.append(userResponse)
        
        let acknowledgment = ChatMessage(
            id: UUID().uuidString,
            role: .assistant,
            content: "谢谢你告诉我。我会记住这一点，帮助更好地理解你的状况。",
            citations: [],
            timestamp: Date()
        )
        messages.append(acknowledgment)
        
        activeInquiry = nil
    }
    
    // MARK: - Clear Conversation
    
    func clearConversation() {
        messages.removeAll()
        conversationHistory.removeAll()
        activeInquiry = nil
        addWelcomeMessage()
    }
}

// MARK: - Models

struct ChatMessage: Identifiable {
    let id: String
    let role: MessageRole
    let content: String
    let citations: [Citation]
    let timestamp: Date
}

enum MessageRole: String {
    case user
    case assistant
}

struct Citation: Identifiable, Decodable {
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
