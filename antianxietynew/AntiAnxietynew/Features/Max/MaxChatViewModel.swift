// MaxChatViewModel.swift
// Max 对话视图模型 - 支持消息持久化、多对话管理、P1/P2 功能

import SwiftUI
import Network

// MARK: - 模型模式枚举
enum ModelMode: String, CaseIterable {
    case fast = "fast"
    case think = "think"
    
    var displayName: String {
        switch self {
        case .fast: return "快速"
        case .think: return "深思"
        }
    }
    
    var icon: String {
        switch self {
        case .fast: return "hare"
        case .think: return "brain"
        }
    }
}

@MainActor
class MaxChatViewModel: ObservableObject {
    // MARK: - Published Properties
    
    @Published var messages: [ChatMessage] = []
    @Published var conversations: [Conversation] = []
    @Published var currentConversationId: String? = nil
    @Published var inputText = ""
    @Published var isTyping = false
    @Published var isLoading = false
    @Published var error: String? = nil
    
    // 🆕 P1 功能
    @Published var modelMode: ModelMode = .fast
    @Published var starterQuestions: [String] = []
    
    // 🆕 P2 功能 - 离线状态
    @Published var isOffline = false
    private var networkMonitor: NWPathMonitor?
    
    // 🆕 停止生成 - 任务引用
    private var currentGenerationTask: Task<Void, Never>? = nil
    private var generationId: Int = 0
    
    // MARK: - Init
    
    init() {
        setupNetworkMonitor()
        Task {
            await loadConversations()
            await loadStarterQuestions()
        }
    }
    
    deinit {
        networkMonitor?.cancel()
    }

    private let maxSystemPrompt = """
    你是 Max，一个高效、直接、简洁的健康共情型助手。
    - 中文回答，避免冗长铺垫
    - 输出结构化建议（要点/步骤）
    - 不要编造数据；不确定就说不确定
    """
    
    // MARK: - 🆕 P2 网络状态监听
    
    private func setupNetworkMonitor() {
        networkMonitor = NWPathMonitor()
        networkMonitor?.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isOffline = (path.status != .satisfied)
                if self?.isOffline == true {
                    print("⚠️ 网络已断开")
                } else {
                    print("✅ 网络已连接")
                }
            }
        }
        networkMonitor?.start(queue: DispatchQueue.global(qos: .background))
    }
    
    // MARK: - 🆕 Starter Questions
    
    /// 加载个性化起始问题
    func loadStarterQuestions() async {
        do {
            starterQuestions = try await SupabaseManager.shared.getStarterQuestions()
            print("✅ 加载了 \(starterQuestions.count) 个起始问题")
        } catch {
            print("⚠️ 加载起始问题失败，使用默认问题: \(error)")
            // 默认问题
            starterQuestions = [
                "今天我的焦虑评分如何？",
                "帮我分析一下最近的睡眠质量",
                "我该如何改善当前的压力水平？",
                "根据我的数据，有什么建议？"
            ]
        }
    }
    
    // MARK: - 🆕 模型模式切换
    
    func toggleModelMode() {
        modelMode = modelMode == .fast ? .think : .fast
        print("🔄 切换模型模式: \(modelMode.displayName)")
    }
    
    // MARK: - 🆕 停止生成
    
    func stopGeneration() {
        generationId += 1  // 使当前任务失效
        currentGenerationTask?.cancel()
        currentGenerationTask = nil
        isTyping = false
        
        // 更新最后一条 AI 消息
        if let lastIndex = messages.lastIndex(where: { $0.role == .assistant && $0.content.isEmpty }) {
            messages[lastIndex].content = "（已取消）"
        }
        print("⏹️ 已停止生成")
    }
    
    // MARK: - 对话管理
    
    /// 加载对话列表
    func loadConversations() async {
        isLoading = true
        do {
            conversations = try await SupabaseManager.shared.getConversations()
            print("✅ 加载了 \(conversations.count) 个对话")
        } catch {
            conversations = []
            self.error = "加载对话失败: \(error.localizedDescription)"
            print("❌ 加载对话列表失败: \(error)")
        }
        isLoading = false
    }
    
    /// 切换到指定对话
    func switchConversation(_ conversationId: String) async {
        currentConversationId = conversationId
        isLoading = true
        
        do {
            let history = try await SupabaseManager.shared.getChatHistory(conversationId: conversationId)
            messages = history.map { $0.toLocal() }
            print("✅ 加载了 \(messages.count) 条历史消息")
        } catch {
            print("❌ 加载对话历史失败: \(error)")
            messages = []
            self.error = "加载对话失败: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    /// 创建新对话并切换
    func startNewConversation() {
        // 取消正在进行的生成
        stopGeneration()
        
        Task {
            do {
                let conversation = try await SupabaseManager.shared.createConversation()
                conversations.insert(conversation, at: 0)
                currentConversationId = conversation.id
                messages = []
                print("✅ 创建新对话: \(conversation.id)")

                // 重新加载 Starter Questions
                await loadStarterQuestions()
            } catch {
                print("❌ 创建对话失败: \(error)")
                self.error = "创建对话失败: \(error.localizedDescription)"
            }
        }
    }
    
    /// 删除对话
    func deleteConversation(_ conversationId: String) async -> Bool {
        do {
            try await SupabaseManager.shared.deleteConversation(conversationId: conversationId)
            conversations.removeAll { $0.id == conversationId }
            
            if currentConversationId == conversationId {
                currentConversationId = nil
                messages = []
            }
            
            print("✅ 删除对话: \(conversationId)")
            return true
        } catch {
            print("❌ 删除对话失败: \(error)")
            self.error = "删除失败"
            return false
        }
    }
    
    // MARK: - 消息发送（🆕 支持停止生成和模型模式）
    
    func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        guard !isTyping else { return }
        
        // 记录当前生成 ID
        let currentGenId = generationId + 1
        generationId = currentGenId
        
        // 乐观更新 UI
        let tempUserMessage = ChatMessage(role: .user, content: text)
        messages.append(tempUserMessage)
        inputText = ""
        isTyping = true
        
        // 🆕 使用可取消任务
        currentGenerationTask = Task {
            do {
                // 检查是否已取消
                guard generationId == currentGenId else { return }
                
        // 1. 如果没有对话，先创建一个
                var conversationId = currentConversationId
                if conversationId == nil {
                    let conversation = try await SupabaseManager.shared.createConversation(title: deriveTitle(from: text))
                    conversations.insert(conversation, at: 0)
                    currentConversationId = conversation.id
                    conversationId = conversation.id
                }
                guard let convId = conversationId else {
                    throw SupabaseError.requestFailed
                }
                
                // 检查是否已取消
                guard generationId == currentGenId else { return }
                
                // 2. 保存用户消息到数据库
                let savedUserMsg = try await SupabaseManager.shared.appendMessage(
                    conversationId: convId,
                    role: "user",
                    content: text
                )
                if let index = messages.lastIndex(where: { $0.content == text && $0.role == .user }) {
                    messages[index].remoteId = savedUserMsg.id
                }
                
                // 检查是否已取消
                guard generationId == currentGenId else { return }
                
                // 3. 直连 AICAN API（纯 Swift）
                let responseText = try await AIManager.shared.chatCompletion(
                    messages: messages,
                    systemPrompt: maxSystemPrompt,
                    model: modelMode == .think ? .deepseekV3Thinking : .deepseekV3Exp,
                    temperature: 0.7
                )
                
                // 检查是否已取消
                guard generationId == currentGenId else { return }
                
                // 4. 保存 AI 回复到数据库
                let savedAssistantMsg = try await SupabaseManager.shared.appendMessage(
                    conversationId: convId,
                    role: "assistant",
                    content: responseText
                )
                
                // 5. 更新 UI
                isTyping = false
                messages.append(ChatMessage(
                    role: .assistant,
                    content: responseText,
                    remoteId: savedAssistantMsg.id
                ))
                
            } catch {
                // 检查是否是取消导致的
                guard generationId == currentGenId else { return }
                
                isTyping = false
                let description = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                messages.append(ChatMessage(
                    role: .assistant,
                    content: "抱歉，Max 无法连接：\(description)"
                ))
                self.error = "发送失败: \(description)"
                print("❌ MaxChat Error: \(error)")
            }
        }
    }
    
    // MARK: - 计划保存
    
    func savePlan(_ plan: PlanOption) {
        Task {
            do {
                try await SupabaseManager.shared.savePlan(plan)
                print("✅ 计划保存成功: \(plan.displayTitle)")
            } catch {
                print("❌ 保存计划失败: \(error)")
            }
        }
    }
    
    // MARK: - 辅助方法
    
    /// 从消息内容生成对话标题
    private func deriveTitle(from content: String) -> String {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.count <= 20 {
            return trimmed
        }
        return String(trimmed.prefix(20)) + "..."
    }

}
