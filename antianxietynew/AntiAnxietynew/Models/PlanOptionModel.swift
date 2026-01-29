//
//  PlanOptionModel.swift
//  计划选项数据模型
//

import Foundation

/// 单个计划项目
struct PlanOptionItem: Codable, Identifiable {
    var id: String?
    let text: String
    
    enum CodingKeys: String, CodingKey {
        case id, text
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // id 可能是 String 或 Int
        if let stringId = try? container.decode(String.self, forKey: .id) {
            id = stringId
        } else if let intId = try? container.decode(Int.self, forKey: .id) {
            id = String(intId)
        } else {
            id = nil
        }
        text = (try? container.decode(String.self, forKey: .text)) ?? ""
    }
    
    init(id: String? = nil, text: String) {
        self.id = id
        self.text = text
    }
}

/// 单个计划选项
struct PlanOption: Codable, Identifiable {
    let id: Int?
    let title: String?
    let description: String?
    let difficulty: String?
    let duration: String?
    let items: [PlanOptionItem]?
    
    // 🆕 手动初始化器（用于 Markdown 解析）
    init(id: Int?, title: String?, description: String?, difficulty: String?, duration: String?, items: [PlanOptionItem]?) {
        self.id = id
        self.title = title
        self.description = description
        self.difficulty = difficulty
        self.duration = duration
        self.items = items
    }
    
    var displayTitle: String {
        title ?? "方案\(id ?? 0)"
    }
    
    var displayItems: [PlanOptionItem] {
        items ?? []
    }
}

/// 计划选项容器
struct PlanOptionsPayload: Codable {
    let options: [PlanOption]
}

/// 解析 plan-options JSON
func parsePlanOptions(from content: String) -> [PlanOption]? {
    // 先尝试 JSON 解析
    if let jsonPlans = parseJSONPlanOptions(from: content) {
        return jsonPlans
    }
    
    // 🆕 再尝试 Markdown 解析
    let markdownPlans = parsePlansFromMarkdown(content)
    return markdownPlans.count >= 2 ? markdownPlans : nil
}

/// 解析 plan-options JSON（原有逻辑）
private func parseJSONPlanOptions(from content: String) -> [PlanOption]? {
    var jsonString = content
    
    if jsonString.contains("```plan-options") {
        jsonString = jsonString
            .replacingOccurrences(of: "```plan-options", with: "")
            .replacingOccurrences(of: "```", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    guard let data = jsonString.data(using: .utf8) else { return nil }
    
    do {
        let payload = try JSONDecoder().decode(PlanOptionsPayload.self, from: data)
        return payload.options.count >= 2 ? payload.options : nil
    } catch {
        return nil
    }
}

// MARK: - 🆕 Markdown 方案解析（移植自 plan-parser.ts）

/// 检测是否包含方案
func containsPlans(_ message: String) -> Bool {
    // 排除确认消息
    if message.contains("✅ **保存成功") || message.contains("已确认") || message.contains("已添加到您的健康方案") {
        return false
    }
    
    // 检测方案关键词
    let patterns = [
        "方案\\s*[1-9一二三四五][\\s:：]",
        "建议\\s*[1-9一二三四五][\\s:：]",
        "计划\\s*[1-9一二三四五][\\s:：]",
        "选项\\s*[1-9一二三四五][\\s:：]",
        "\\*\\*方案\\s*[1-9一二三四五]",
        "\\*\\*建议\\s*[1-9一二三四五]"
    ]
    
    for pattern in patterns {
        if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
            let range = NSRange(message.startIndex..., in: message)
            if regex.firstMatch(in: message, range: range) != nil {
                return true
            }
        }
    }
    
    return false
}

/// 解析 Markdown 中的方案
func parsePlansFromMarkdown(_ message: String) -> [PlanOption] {
    var plans: [PlanOption] = []
    
    // 排除确认消息
    if message.contains("✅") && (message.contains("保存成功") || message.contains("已确认")) {
        return []
    }
    
    // 正则：匹配 "方案1：标题" 或 "**方案1：标题**"
    let planPattern = "\\*{0,2}(?:方案|建议|计划|选项)\\s*([1-9一二三四五])[\\s:：]+\\*{0,2}([^\\n*]+)\\*{0,2}((?:\\n(?!\\*{0,2}(?:方案|建议|计划|选项)\\s*[1-9一二三四五])[^\\n]*)*)"
    
    guard let regex = try? NSRegularExpression(pattern: planPattern, options: [.caseInsensitive]) else {
        return []
    }
    
    let range = NSRange(message.startIndex..., in: message)
    let matches = regex.matches(in: message, range: range)
    
    for (index, match) in matches.enumerated() {
        guard match.numberOfRanges >= 3 else { continue }
        
        // 提取编号
        let numRange = Range(match.range(at: 1), in: message)
        let num = numRange.map { String(message[$0]) } ?? "\(index + 1)"
        
        // 提取标题
        let titleRange = Range(match.range(at: 2), in: message)
        let titleText = titleRange.map { String(message[$0]).trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "*", with: "") } ?? "方案\(index + 1)"
        
        // 提取内容
        var content = ""
        if match.numberOfRanges >= 4, let contentRange = Range(match.range(at: 3), in: message) {
            content = String(message[contentRange]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        // 提取难度
        var difficulty: String?
        if let diffMatch = content.range(of: "难度[：:]\\s*([⭐★☆]+|[1-5]星?)", options: .regularExpression) {
            difficulty = String(content[diffMatch])
        }
        
        // 提取时长
        var duration: String?
        let durationPatterns = ["(?:预期|时长|周期)[：:]\\s*([^\\n]+)"]
        for pattern in durationPatterns {
            if let durationMatch = content.range(of: pattern, options: .regularExpression) {
                duration = String(content[durationMatch])
                break
            }
        }
        
        // 提取条目
        var items: [PlanOptionItem] = []
        let itemPattern = "(?:^|\\n)\\s*(?:[1-9]\\.|[-•])\\s+([^\\n]+)"
        if let itemRegex = try? NSRegularExpression(pattern: itemPattern, options: []) {
            let contentRange = NSRange(content.startIndex..., in: content)
            let itemMatches = itemRegex.matches(in: content, range: contentRange)
            
            for itemMatch in itemMatches {
                if let textRange = Range(itemMatch.range(at: 1), in: content) {
                    let itemText = String(content[textRange]).trimmingCharacters(in: .whitespaces)
                    // 跳过元数据
                    if !itemText.hasPrefix("难度") && !itemText.hasPrefix("时长") && itemText.count >= 2 {
                        items.append(PlanOptionItem(id: UUID().uuidString, text: itemText))
                    }
                }
            }
        }
        
        // 创建 PlanOption（需要扩展 init）
        let plan = PlanOption(
            id: index + 1,
            title: "方案\(num)：\(titleText)",
            description: content.isEmpty ? nil : String(content.prefix(200)),
            difficulty: difficulty,
            duration: duration,
            items: items.isEmpty ? nil : items
        )
        
        plans.append(plan)
    }
    
    print("🔍 [iOS] 解析到 \(plans.count) 个方案")
    return plans
}

