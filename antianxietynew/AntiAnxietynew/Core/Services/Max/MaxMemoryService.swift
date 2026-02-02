import Foundation

struct MaxMemoryRecord: Codable {
    let content_text: String
    let role: String
    let created_at: String
    let similarity: Double?
}

enum MaxMemoryService {
    static func retrieveMemories(userId: String, query: String, embedding: [Double]? = nil, limit: Int = 8) async -> [MaxMemoryRecord] {
        guard !query.isEmpty else { return [] }
        do {
            let resolvedEmbedding: [Double]
            if let embedding {
                resolvedEmbedding = embedding
            } else {
                resolvedEmbedding = try await AIManager.shared.createEmbedding(for: query)
            }
            if resolvedEmbedding.isEmpty {
                return try await retrieveRecentMemories(userId: userId, limit: limit)
            }
            struct RPCPayload: Encodable {
                let query_embedding: [Double]
                let match_threshold: Double
                let match_count: Int
                let p_user_id: String
            }
            let payload = RPCPayload(query_embedding: resolvedEmbedding, match_threshold: 0.7, match_count: limit, p_user_id: userId)
            let records: [MaxMemoryRecord] = (try? await SupabaseManager.shared.request("rpc/match_ai_memories", method: "POST", body: payload)) ?? []
            if !records.isEmpty { return records }
            return try await retrieveRecentMemories(userId: userId, limit: limit)
        } catch {
            return (try? await retrieveRecentMemories(userId: userId, limit: limit)) ?? []
        }
    }

    static func storeMemory(userId: String, content: String, role: String, metadata: [String: Any]? = nil) async {
        let sanitized = sanitizeMemoryContent(content)
        guard let sanitized, shouldStoreMemory(content: sanitized, role: role) else { return }
        struct MemoryPayload: Encodable {
            let user_id: String
            let content_text: String
            let role: String
            let embedding: [Double]?
            let metadata: [String: AnyCodable]?
        }

        let embedding = try? await AIManager.shared.createEmbedding(for: sanitized)
        let metadataEncoded = metadata?.mapValues { AnyCodable($0) }
        let payload = MemoryPayload(
            user_id: userId,
            content_text: sanitized,
            role: role,
            embedding: embedding?.isEmpty == false ? embedding : nil,
            metadata: metadataEncoded
        )
        do {
            try await SupabaseManager.shared.requestVoid("ai_memory", method: "POST", body: payload)
        } catch {
            print("[MaxMemory] store failed: \(error)")
        }
    }

    private static func retrieveRecentMemories(userId: String, limit: Int) async throws -> [MaxMemoryRecord] {
        let endpoint = "ai_memory?user_id=eq.\(userId)&select=content_text,role,created_at&order=created_at.desc&limit=\(max(1, limit))"
        let records: [MaxMemoryRecord] = (try? await SupabaseManager.shared.request(endpoint)) ?? []
        return records
    }

    private static func shouldStoreMemory(content: String, role: String) -> Bool {
        let lowered = content.lowercased()
        if containsSensitivePattern(lowered) { return false }

        if role == "user" {
            let preferenceTokens = ["喜欢", "偏好", "更喜欢", "不喜欢", "讨厌", "有用", "有效", "对我有效", "不适合", "触发", "加重", "缓解", "让我", "对我", "我更"]
            return preferenceTokens.contains { lowered.contains($0) }
        }

        if role == "assistant" {
            let strategyTokens = ["建议", "方案", "策略", "步骤", "行动", "计划", "练习", "干预"]
            return strategyTokens.contains { lowered.contains($0) }
        }

        return false
    }

    private static func sanitizeMemoryContent(_ content: String) -> String? {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        return String(trimmed.prefix(600))
    }

    private static func containsSensitivePattern(_ text: String) -> Bool {
        let patterns = [
            "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}",
            "\\b\\d{7,}\\b"
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]),
               regex.firstMatch(in: text, options: [], range: NSRange(text.startIndex..<text.endIndex, in: text)) != nil {
                return true
            }
        }
        return false
    }
}

struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            value = ()
        } else if let boolVal = try? container.decode(Bool.self) {
            value = boolVal
        } else if let intVal = try? container.decode(Int.self) {
            value = intVal
        } else if let doubleVal = try? container.decode(Double.self) {
            value = doubleVal
        } else if let stringVal = try? container.decode(String.self) {
            value = stringVal
        } else if let arrayVal = try? container.decode([AnyCodable].self) {
            value = arrayVal.map { $0.value }
        } else if let dictVal = try? container.decode([String: AnyCodable].self) {
            value = dictVal.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "AnyCodable unsupported")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case is Void:
            try container.encodeNil()
        case let boolVal as Bool:
            try container.encode(boolVal)
        case let intVal as Int:
            try container.encode(intVal)
        case let doubleVal as Double:
            try container.encode(doubleVal)
        case let stringVal as String:
            try container.encode(stringVal)
        case let arrayVal as [Any]:
            try container.encode(arrayVal.map { AnyCodable($0) })
        case let dictVal as [String: Any]:
            let wrapped = dictVal.mapValues { AnyCodable($0) }
            try container.encode(wrapped)
        default:
            throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: encoder.codingPath, debugDescription: "AnyCodable unsupported"))
        }
    }
}
