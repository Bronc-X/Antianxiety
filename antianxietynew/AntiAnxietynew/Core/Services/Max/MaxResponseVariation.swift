import Foundation

enum MaxFormatStyle: String {
    case structured
    case conversational
    case concise
    case detailed
    case plan
}

enum MaxCitationStyle: String {
    case formal
    case casual
    case minimal
}

struct MaxVariationStrategy {
    let formatStyle: MaxFormatStyle
    let endearment: String?
    let citationStyle: MaxCitationStyle
    let shouldMentionHealthContext: Bool
    let responseTemplate: String
}

enum MaxResponseVariation {
    private static let endearmentPool = ["朋友", "小伙伴", "老铁", "亲", "伙计", "兄弟", "姐妹"]
    private static let formatTemplates: [MaxFormatStyle: String] = [
        .structured: """
回复结构：
1. 简短的关键要点（1-2句）
2. 科学依据（如有）
3. 具体建议
""",
        .conversational: """
回复风格：
- 像朋友聊天一样自然
- 不使用固定模板
- 直接回答问题
""",
        .concise: """
回复风格：
- 简洁直接
- 不重复已知信息
- 直奔主题
""",
        .detailed: """
回复风格：
- 详细解释
- 提供背景知识
- 多角度分析
""",
        .plan: """
回复格式：
- 直接给出方案
- 不重述问题背景
- 使用方案1/方案2格式
"""
    ]

    private static let citationTemplates: [MaxCitationStyle: String] = [
        .formal: "引用格式：使用 [1], [2] 标注，末尾列出参考文献",
        .casual: "引用格式：自然地提及研究发现，如\"研究表明...\"",
        .minimal: "引用格式：仅在必要时简短提及，不重复已引用的论文"
    ]

    static func selectVariationStrategy(state: MaxConversationState) -> MaxVariationStrategy {
        let formatStyle = selectFormatStyle(turnCount: state.turnCount, usedFormats: state.usedFormats)
        let endearment = selectEndearment(turnCount: state.turnCount, usedEndearments: state.usedEndearments)
        let citationStyle = selectCitationStyle(turnCount: state.turnCount, citedCount: state.citedPaperIds.count)
        let shouldMentionHealthContext = state.turnCount <= 1 && !state.mentionedHealthContext
        let responseTemplate = formatTemplates[formatStyle] ?? ""

        return MaxVariationStrategy(
            formatStyle: formatStyle,
            endearment: endearment,
            citationStyle: citationStyle,
            shouldMentionHealthContext: shouldMentionHealthContext,
            responseTemplate: responseTemplate
        )
    }

    static func generateVariationInstructions(strategy: MaxVariationStrategy) -> String {
        var parts: [String] = []
        parts.append("[RESPONSE VARIATION INSTRUCTIONS - 回复变化指令]")
        parts.append("")
        parts.append(strategy.responseTemplate)
        parts.append("")
        parts.append(citationTemplates[strategy.citationStyle] ?? "")
        if let endearment = strategy.endearment {
            parts.append("\n称呼：可以使用\"\(endearment)\"，但不要每句都用")
        } else {
            parts.append("\n称呼：这次不使用特定称呼语，保持自然")
        }

        if !strategy.shouldMentionHealthContext {
            parts.append("\n⚠️ 重要：不要重复提及用户的健康状况，已经在之前的对话中说过了")
            parts.append("直接回答问题，不要以\"考虑到你的XXX状况\"开头")
        }

        parts.append("\n⚠️ 避免重复：")
        parts.append("- 不要使用和上一条回复相同的格式结构")
        parts.append("- 不要重复引用已经引用过的论文")
        parts.append("- 不要重复解释已经解释过的概念")

        return parts.joined(separator: "\n")
    }

    private static func selectFormatStyle(turnCount: Int, usedFormats: [String]) -> MaxFormatStyle {
        if turnCount <= 1 {
            return .structured
        }
        let lastFormat = usedFormats.last
        let rotation: [MaxFormatStyle] = [.conversational, .concise, .detailed, .structured]
        for format in rotation {
            if format.rawValue != lastFormat {
                return format
            }
        }
        return .conversational
    }

    private static func selectEndearment(turnCount: Int, usedEndearments: [String]) -> String? {
        if turnCount % 3 != 1 {
            return nil
        }
        let unused = endearmentPool.filter { !usedEndearments.contains($0) }
        if unused.isEmpty {
            let lastUsed = usedEndearments.last
            let available = endearmentPool.filter { $0 != lastUsed }
            guard !available.isEmpty else { return nil }
            let index = (turnCount + usedEndearments.count) % available.count
            return available[index]
        }
        let index = (turnCount + usedEndearments.count) % unused.count
        return unused[index]
    }

    private static func selectCitationStyle(turnCount: Int, citedCount: Int) -> MaxCitationStyle {
        if turnCount <= 1 {
            return .formal
        }
        if citedCount >= 3 {
            return .minimal
        }
        return .casual
    }
}
