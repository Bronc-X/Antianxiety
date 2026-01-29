// AIManager.swift
// AI 服务管理器 - 连接 AICanAPI (OpenAI Compatible)

import Foundation

enum AIModel: String {
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
        return url.replacingOccurrences(of: "\\", with: "")
    }
    
    private init() {}
    
    func chatCompletion(messages: [ChatMessage], model: AIModel = .geminiStandard) async throws -> String {
        let url = URL(string: "\(baseURL)/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Convert internal ChatMessage to API format
        let apiMessages = messages.map { msg in
            ["role": msg.role == .user ? "user" : "assistant",
             "content": msg.content]
        }
        
        let body: [String: Any] = [
            "model": model.rawValue,
            "messages": apiMessages,
            "temperature": 0.7
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
