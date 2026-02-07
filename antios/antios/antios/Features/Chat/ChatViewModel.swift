//
//  ChatViewModel.swift
//  antios
//
//  D1-D4: 对话视图模型 - 硬编码响应模式
//

import Foundation

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isStreaming = false
    @Published var activeInquiry: ActiveInquiry?
    
    private var conversationHistory: [ChatMessage] = []
    
    // 硬编码响应库
    private let hardcodedResponses: [String: String] = [
        "睡眠": """
        睡眠质量对心理健康非常重要。以下是一些改善睡眠的建议：
        
        1. **保持规律作息** - 每天同一时间睡觉和起床
        2. **睡前 1 小时避免屏幕** - 蓝光会抑制褪黑素分泌
        3. **4-7-8 呼吸法** - 吸气 4 秒，屏住 7 秒，呼气 8 秒
        4. **保持卧室凉爽** - 最佳睡眠温度是 18-22°C
        
        你想详细了解哪个方面？
        """,
        "焦虑": """
        焦虑是很常见的情绪反应。以下是一些缓解焦虑的方法：
        
        1. **深呼吸练习** - 激活副交感神经系统
        2. **接地技术** - 5-4-3-2-1 感官练习
        3. **渐进式肌肉放松** - 从脚趾到头顶逐步放松
        4. **正念冥想** - 专注当下，不评判
        
        记住，焦虑是身体的保护机制，适度的焦虑是正常的。
        """,
        "压力": """
        压力管理是现代生活的重要技能。以下是一些建议：
        
        1. **识别压力源** - 了解什么让你感到压力
        2. **时间管理** - 使用番茄工作法等技巧
        3. **运动** - 每天 20 分钟的运动可以显著减压
        4. **社交支持** - 与朋友家人保持联系
        
        你最近感到压力的主要来源是什么？
        """,
        "default": """
        我理解你的感受。作为你的健康助手，我可以帮助你了解：
        
        • 睡眠改善
        • 压力管理
        • 焦虑缓解
        • 运动建议
        • 饮食调整
        
        你想从哪个方面开始？
        """
    ]
    
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
    
    // MARK: - Send Message（硬编码模式）
    
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
        
        // 模拟网络延迟
        try? await Task.sleep(nanoseconds: 800_000_000)
        
        // 硬编码响应
        let response = getHardcodedResponse(for: text)
        
        let assistantMessage = ChatMessage(
            id: UUID().uuidString,
            role: .assistant,
            content: response,
            citations: [],
            timestamp: Date()
        )
        
        messages.append(assistantMessage)
        conversationHistory.append(assistantMessage)
        
        isStreaming = false
        
        checkForActiveInquiry()
    }
    
    // MARK: - Get Hardcoded Response
    
    private func getHardcodedResponse(for text: String) -> String {
        let lowercased = text.lowercased()
        
        for (keyword, response) in hardcodedResponses {
            if lowercased.contains(keyword) && keyword != "default" {
                return response
            }
        }
        
        return hardcodedResponses["default"]!
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
