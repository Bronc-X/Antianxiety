import Foundation

struct MaxContextDecision {
    let includeFullHealthContext: Bool
    let includeHealthReminder: Bool
    let healthContextText: String
    let excludePaperIds: [String]
    let filteredPapers: [ScientificPaperLite]
    let contextSummary: String
}

struct ScientificPaperLite: Equatable {
    let title: String
    let year: Int?
}

enum MaxContextOptimizer {
    static func optimize(
        state: MaxConversationState,
        healthFocus: String?,
        scientificPapers: [ScientificPaperLite]
    ) -> MaxContextDecision {
        var includeFull = false
        var includeReminder = false
        var healthText = ""
        if let focus = healthFocus, !focus.isEmpty {
            let decision = decideHealthContextInjection(state: state, healthFocus: focus)
            includeFull = decision.includeFull
            includeReminder = decision.includeReminder
            healthText = decision.text
        }

        let paperDecision = decidePaperInjection(state: state, papers: scientificPapers)
        let summary = generateContextSummary(state: state, healthFocus: healthFocus)

        return MaxContextDecision(
            includeFullHealthContext: includeFull,
            includeHealthReminder: includeReminder,
            healthContextText: healthText,
            excludePaperIds: paperDecision.excludeIds,
            filteredPapers: paperDecision.filteredPapers,
            contextSummary: summary
        )
    }

    static func buildContextBlock(decision: MaxContextDecision) -> String {
        var parts: [String] = []
        if !decision.healthContextText.isEmpty {
            parts.append(decision.healthContextText)
        }
        if !decision.filteredPapers.isEmpty {
            parts.append("\n[SCIENTIFIC CONTEXT - 科学上下文]")
            parts.append("可引用的新论文 (\(decision.filteredPapers.count)篇):")
            for (index, paper) in decision.filteredPapers.prefix(5).enumerated() {
                parts.append("[\(index + 1)] \"\(paper.title)\" (\(paper.year.map(String.init) ?? "N/A"))")
            }
            if !decision.excludePaperIds.isEmpty {
                parts.append("\n⚠️ 以下论文已在之前引用过，请勿重复完整引用：")
                parts.append(decision.excludePaperIds.prefix(3).joined(separator: ", "))
            }
        }
        if !decision.contextSummary.isEmpty {
            parts.append("\n[CONTEXT SUMMARY] \(decision.contextSummary)")
        }
        return parts.joined(separator: "\n")
    }

    private static func decideHealthContextInjection(
        state: MaxConversationState,
        healthFocus: String
    ) -> (includeFull: Bool, includeReminder: Bool, text: String) {
        if state.turnCount <= 1 && !state.mentionedHealthContext {
            return (true, false, buildFullHealthContext(healthFocus))
        }
        if state.mentionedHealthContext {
            return (false, true, buildHealthReminder(healthFocus))
        }
        return (false, true, buildHealthReminder(healthFocus))
    }

    private static func buildFullHealthContext(_ focus: String) -> String {
        """
[CRITICAL HEALTH CONTEXT - 关键健康上下文]
🚨 用户当前健康问题: \(focus)

⚠️ 这是最高优先级的上下文！你必须：
1. 在回答时首先考虑这个健康问题
2. 如果用户询问的活动可能加重这个问题，必须警告
3. 安全永远是第一位的

注意：这是第一次提及，可以在回复中说明\"考虑到你的\(focus)状况...\"
"""
    }

    private static func buildHealthReminder(_ focus: String) -> String {
        """
[HEALTH REMINDER - 健康提醒（内部参考）]
用户健康问题: \(focus)
⚠️ 重要：你已经在之前的对话中提及过这个健康问题了！
❌ 不要再次以\"考虑到你的XXX状况\"开头
✅ 直接回答问题，在必要时隐式考虑健康限制
"""
    }

    private static func decidePaperInjection(
        state: MaxConversationState,
        papers: [ScientificPaperLite]
    ) -> (excludeIds: [String], filteredPapers: [ScientificPaperLite]) {
        let cited = Set(state.citedPaperIds.map { $0.lowercased() })
        let filtered = papers.filter { !cited.contains($0.title.lowercased()) }
        let excludeIds = papers
            .filter { cited.contains($0.title.lowercased()) }
            .map { $0.title.lowercased() }
        return (excludeIds, filtered)
    }

    private static func generateContextSummary(state: MaxConversationState, healthFocus: String?) -> String {
        var parts: [String] = []
        if state.turnCount > 0 {
            parts.append("对话轮次: \(state.turnCount)")
        }
        if !state.citedPaperIds.isEmpty {
            parts.append("已引用论文: \(state.citedPaperIds.count)篇")
        }
        if !state.userSharedDetails.isEmpty {
            parts.append("用户分享的细节: \(state.userSharedDetails.prefix(3).joined(separator: ", "))")
        }
        if let focus = healthFocus, !focus.isEmpty {
            parts.append("用户目标/关注: \(focus)")
        }
        return parts.joined(separator: " | ")
    }
}
