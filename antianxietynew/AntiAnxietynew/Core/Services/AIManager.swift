// AIManager.swift
// AI 服务管理器 - 连接 AICanAPI (OpenAI Compatible)

import Foundation

enum AIModel: String {
    case deepseekV3Exp = "deepseek-v3.2-exp"
    case deepseekV3Thinking = "deepseek-v3.1-thinking"
    case geminiThinking = "gemini-3-pro-preview-thinking"
    case geminiStandard = "gemini-3-pro-preview"
}

@MainActor
final class AIManager: ObservableObject, AIManaging {
    static let shared = AIManager()
    
    private let requestTimeout: TimeInterval = 25
    private let embeddingCacheTTL: TimeInterval = 6 * 3600
    private var embeddingCache: [String: (vector: [Double], timestamp: Date)] = [:]
    private var didLogConfig = false
    
    private var apiKey: String {
        guard let key = Bundle.main.infoDictionary?["OPENAI_API_KEY"] as? String else {
            fatalError("Missing OPENAI_API_KEY in Info.plist. Please configure Secrets.xcconfig.")
        }
        return key
    }
    
    private var baseURL: String {
        guard let url = Bundle.main.infoDictionary?["OPENAI_API_BASE"] as? String else {
            fatalError("Missing OPENAI_API_BASE in Info.plist. Please configure Secrets.xcconfig.")
        }
        let cleaned = url.replacingOccurrences(of: "\\", with: "").trimmingCharacters(in: .whitespacesAndNewlines)
        let normalized = cleaned.replacingOccurrences(of: "/chat/completions", with: "")
        return normalized.hasSuffix("/") ? String(normalized.dropLast()) : normalized
    }

    private var embeddingURL: String {
        if let url = Bundle.main.infoDictionary?["OPENAI_EMBEDDING_API_URL"] as? String,
           !url.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return url.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return "\(baseURL)/embeddings"
    }

    private var embeddingModel: String {
        if let model = Bundle.main.infoDictionary?["OPENAI_EMBEDDING_MODEL"] as? String,
           !model.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return model
        }
        return "text-embedding-3-small"
    }

    private var defaultModel: String {
        if let model = Bundle.main.infoDictionary?["OPENAI_MODEL"] as? String,
           !model.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return model
        }
        return AIModel.deepseekV3Exp.rawValue
    }
    
    private init() {}

    // Protocol conformance
    func chatCompletion(messages: [ChatMessage], model: AIModel) async throws -> String {
        return try await chatCompletion(
            messages: messages,
            systemPrompt: nil,
            model: model,
            temperature: 0.7
        )
    }

    func chatCompletion(
        messages: [ChatMessage],
        systemPrompt: String? = nil,
        model: AIModel? = nil,
        temperature: Double = 0.7
    ) async throws -> String {
        let resolvedModel = model?.rawValue ?? defaultModel
        if !didLogConfig {
            print("✅ [AI] chat.completions base=\(baseURL) model=\(resolvedModel)")
            didLogConfig = true
        } else {
            print("✅ [AI] chat.completions model=\(resolvedModel)")
        }
        let url = URL(string: "\(baseURL)/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = requestTimeout
        
        // Convert internal ChatMessage to API format
        var apiMessages: [[String: String]] = []
        if let systemPrompt = systemPrompt, !systemPrompt.isEmpty {
            apiMessages.append(["role": "system", "content": systemPrompt])
        }
        apiMessages.append(contentsOf: messages.map { msg in
            ["role": msg.role == .user ? "user" : "assistant",
             "content": msg.content]
        })
        
        let body: [String: Any] = [
            "model": resolvedModel,
            "messages": apiMessages,
            "temperature": temperature
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            if let errorStr = String(data: data, encoding: .utf8) {
                print("AI API Error: \(errorStr)")
            }
            throw URLError(.badServerResponse)
        }
        
        let result = try JSONDecoder().decode(OpenAIChatResponse.self, from: data)
        return result.choices.first?.message.content ?? "思考中遇到了一些问题..."
    }

    func createEmbedding(for text: String) async throws -> [Double] {
        let cacheKey = embeddingCacheKey(for: text)
        if let cached = embeddingCache[cacheKey],
           Date().timeIntervalSince(cached.timestamp) < embeddingCacheTTL {
            return cached.vector
        }

        let url = URL(string: embeddingURL)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = requestTimeout

        let body: [String: Any] = [
            "model": embeddingModel,
            "input": String(text.prefix(8000))
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            if let errorStr = String(data: data, encoding: .utf8) {
                print("Embedding API Error: \(errorStr)")
            }
            throw URLError(.badServerResponse)
        }

        if let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let dataArray = parsed["data"] as? [[String: Any]],
           let first = dataArray.first,
           let embedding = first["embedding"] as? [Double] {
            embeddingCache[cacheKey] = (embedding, Date())
            return embedding
        }

        throw URLError(.cannotDecodeRawData)
    }

    private func embeddingCacheKey(for text: String) -> String {
        let normalized = text.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return String(normalized.prefix(200))
    }
}

// MARK: - API Models
struct OpenAIChatResponse: Codable {
    let choices: [Choice]
    
    struct Choice: Codable {
        let message: APIMessage
    }
    
    struct APIMessage: Codable {
        let content: String
    }
}
