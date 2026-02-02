import Foundation

struct MaxResponseStructure {
    let hasKeyTakeaway: Bool
    let hasEvidence: Bool
    let hasActionAdvice: Bool
    let hasBulletPoints: Bool
    let hasNumberedList: Bool
}

struct MaxConversationState {
    var turnCount: Int
    var mentionedHealthContext: Bool
    var citedPaperIds: [String]
    var usedFormats: [String]
    var usedEndearments: [String]
    var lastResponseStructure: MaxResponseStructure?
    var establishedContext: [String]
    var userSharedDetails: [String]
}

enum MaxConversationStateTracker {
    static func initial() -> MaxConversationState {
        MaxConversationState(
            turnCount: 0,
            mentionedHealthContext: false,
            citedPaperIds: [],
            usedFormats: [],
            usedEndearments: [],
            lastResponseStructure: nil,
            establishedContext: [],
            userSharedDetails: []
        )
    }

    static func extractState(from messages: [ChatMessage]) -> MaxConversationState {
        var state = initial()
        for message in messages {
            switch message.role {
            case .user:
                state.turnCount += 1
                state.userSharedDetails.append(contentsOf: extractUserDetails(message.content))
            case .assistant:
                if containsHealthContextMention(message.content) {
                    state.mentionedHealthContext = true
                }
                state.citedPaperIds.append(contentsOf: extractCitedPapers(message.content))
                state.usedFormats.append(detectResponseFormat(message.content))
                if let endearment = extractEndearment(message.content) {
                    state.usedEndearments.append(endearment)
                }
                state.lastResponseStructure = analyzeResponseStructure(message.content)
            }
        }
        state.citedPaperIds = Array(Set(state.citedPaperIds))
        return state
    }

    static func containsHealthContextMention(_ content: String) -> Bool {
        let patterns = [
            "考虑到你目前有【",
            "考虑到你的",
            "鉴于你有",
            "由于你"
        ]
        return patterns.contains { content.contains($0) }
    }

    static func extractCitedPapers(_ content: String) -> [String] {
        var papers: [String] = []
        let pattern = "\\[(\\d+)\\]\\s*\"([^\"]+)\""
        if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
            let range = NSRange(content.startIndex..<content.endIndex, in: content)
            for match in regex.matches(in: content, options: [], range: range) {
                if match.numberOfRanges >= 3,
                   let titleRange = Range(match.range(at: 2), in: content) {
                    papers.append(content[titleRange].lowercased().trimmingCharacters(in: .whitespacesAndNewlines))
                }
            }
        }

        let refPattern = "参考文献[：:]\\s*\\[?\\d+\\]?\\s*([^。\\n]+)"
        if let regex = try? NSRegularExpression(pattern: refPattern, options: []) {
            let range = NSRange(content.startIndex..<content.endIndex, in: content)
            for match in regex.matches(in: content, options: [], range: range) {
                if match.numberOfRanges >= 2,
                   let titleRange = Range(match.range(at: 1), in: content) {
                    papers.append(content[titleRange].lowercased().trimmingCharacters(in: .whitespacesAndNewlines))
                }
            }
        }

        return Array(Set(papers))
    }

    static func detectResponseFormat(_ content: String) -> String {
        if content.contains("**关键要点**") && content.contains("**科学证据**") {
            return "full_structured"
        }
        if content.contains("方案1") || content.contains("方案1：") {
            return "plan_format"
        }
        if content.range(of: "^\\s*[-•]\\s", options: .regularExpression) != nil {
            return "bullet_points"
        }
        if content.range(of: "^\\s*\\d+\\.\\s", options: .regularExpression) != nil {
            return "numbered_list"
        }
        return "conversational"
    }

    static func extractEndearment(_ content: String) -> String? {
        let endearments = ["宝子", "亲爱的", "朋友", "小伙伴", "老铁", "兄弟", "姐妹"]
        return endearments.first { content.contains($0) }
    }

    static func analyzeResponseStructure(_ content: String) -> MaxResponseStructure {
        let hasBullet = content.range(of: "^\\s*[-•]\\s", options: .regularExpression) != nil
        let hasNumbered = content.range(of: "^\\s*\\d+\\.\\s", options: .regularExpression) != nil
        return MaxResponseStructure(
            hasKeyTakeaway: content.contains("关键要点") || content.contains("Key Takeaway"),
            hasEvidence: content.contains("科学证据") || content.contains("证据基础") || content.contains("Evidence"),
            hasActionAdvice: content.contains("行动建议") || content.contains("实用建议") || content.contains("Actionable"),
            hasBulletPoints: hasBullet,
            hasNumberedList: hasNumbered
        )
    }

    static func extractUserDetails(_ content: String) -> [String] {
        let patterns = [
            "我(有|出现|感觉|觉得)[^，。]+",
            "最近[^，。]+",
            "我的[^，。]+(疼|痛|不舒服|问题)"
        ]
        var details: [String] = []
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
                let range = NSRange(content.startIndex..<content.endIndex, in: content)
                for match in regex.matches(in: content, options: [], range: range) {
                    if let matchRange = Range(match.range, in: content) {
                        details.append(String(content[matchRange]))
                    }
                }
            }
        }
        return details
    }
}
