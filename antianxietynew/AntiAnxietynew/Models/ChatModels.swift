//
//  ChatModels.swift
//  聊天数据模型 - 对应 Supabase 表结构
//

import Foundation

// MARK: - Conversation 对话

/// 对话模型 - 逻辑对话（可能由 chat_conversations.session_id 生成）
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

struct FlexibleId: Codable {
    let value: String

    init(_ value: String) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let stringValue = try? container.decode(String.self) {
            value = stringValue
            return
        }
        if let intValue = try? container.decode(Int.self) {
            value = String(intValue)
            return
        }
        if let doubleValue = try? container.decode(Double.self) {
            value = String(Int(doubleValue))
            return
        }
        throw DecodingError.typeMismatch(
            String.self,
            DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Invalid id value")
        )
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(value)
    }
}

/// 消息 DTO - 对应 `chat_messages` 或 `chat_conversations`
struct ChatMessageDTO: Codable, Identifiable {
    let id: String
    let conversation_id: String
    let role: String  // "user" | "assistant"
    let content: String
    let created_at: String?

    enum CodingKeys: String, CodingKey {
        case id
        case conversation_id
        case role
        case content
        case created_at
    }

    init(id: String, conversation_id: String, role: String, content: String, created_at: String?) {
        self.id = id
        self.conversation_id = conversation_id
        self.role = role
        self.content = content
        self.created_at = created_at
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(FlexibleId.self, forKey: .id).value
        conversation_id = try container.decode(FlexibleId.self, forKey: .conversation_id).value
        role = try container.decode(String.self, forKey: .role)
        content = try container.decode(String.self, forKey: .content)
        created_at = try container.decodeIfPresent(String.self, forKey: .created_at)
    }
    
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
