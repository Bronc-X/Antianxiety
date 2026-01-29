//
//  ChatModels.swift
//  聊天数据模型 - 对应 Supabase 表结构
//

import Foundation

// MARK: - Conversation 对话

/// 对话模型 - 对应 `conversations` 表
struct Conversation: Codable, Identifiable {
    let id: String
    let user_id: String
    let title: String
    let last_message_at: String?
    let message_count: Int?
    let created_at: String?
    
    var displayTitle: String {
        if title.isEmpty || title == "新对话" {
            return "新对话"
        }
        return title
    }
    
    var lastMessageDate: Date? {
        guard let dateString = last_message_at else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: dateString)
    }
}

// MARK: - ChatMessageDTO 消息 DTO

/// 消息 DTO - 对应 `chat_messages` 表
struct ChatMessageDTO: Codable, Identifiable {
    let id: String
    let conversation_id: String
    let role: String  // "user" | "assistant"
    let content: String
    let created_at: String?
    
    var isUser: Bool {
        role == "user"
    }
    
    var timestamp: Date {
        guard let dateString = created_at else { return Date() }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: dateString) ?? Date()
    }
    
    /// 转换为本地 ChatMessage
    func toLocal() -> ChatMessage {
        ChatMessage(
            role: isUser ? .user : .assistant,
            content: content,
            id: UUID(uuidString: id) ?? UUID(),
            timestamp: timestamp,
            remoteId: id
        )
    }
}

// MARK: - ChatMessage 本地模型

struct ChatMessage: Identifiable, Equatable {
    let id: UUID
    let role: Role
    var content: String
    let timestamp: Date
    var remoteId: String?

    enum Role {
        case user
        case assistant
    }

    init(
        role: Role,
        content: String,
        id: UUID = UUID(),
        timestamp: Date = Date(),
        remoteId: String? = nil
    ) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.remoteId = remoteId
    }
}

// MARK: - 创建对话请求

struct CreateConversationRequest: Encodable {
    let user_id: String
    let title: String
}

// MARK: - 追加消息请求

struct AppendMessageRequest: Encodable {
    let conversation_id: String
    let role: String
    let content: String
}
