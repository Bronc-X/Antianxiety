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
        let url = URL(string: "\(baseURL)/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
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
            "model": model?.rawValue ?? defaultModel,
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
