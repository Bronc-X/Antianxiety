import Foundation

struct MaxPromptInput {
    let conversationState: MaxConversationState
    let aiSettings: AISettings?
    let aiPersonaContext: String?
    let personality: String?
    let healthFocus: String?
    let inquirySummary: String?
    let memoryContext: String?
    let playbookContext: String?
    let contextBlock: String?
    let language: String
}

enum MaxPromptBuilder {
    static func build(input: MaxPromptInput) -> String {
        var parts: [String] = []
        parts.append(buildDynamicPersonaPrompt(
            personality: input.personality ?? "max",
            aiSettings: input.aiSettings,
            aiPersonaContext: input.aiPersonaContext
        ))
        parts.append("")
        parts.append(MaxPersonaPrompt.fullSystemPrompt(turnCount: input.conversationState.turnCount))
        parts.append("")
        let variation = MaxResponseVariation.selectVariationStrategy(state: input.conversationState)
        parts.append(MaxResponseVariation.generateVariationInstructions(strategy: variation))

        if let inquirySummary = input.inquirySummary, !inquirySummary.isEmpty {
            parts.append("\n[INQUIRY CONTEXT]")
            parts.append(inquirySummary)
        }

        if let memoryContext = input.memoryContext, !memoryContext.isEmpty {
            parts.append("\n[MEMORY CONTEXT]")
            parts.append(memoryContext)
        }

        if let playbookContext = input.playbookContext, !playbookContext.isEmpty {
            parts.append("\n[PLAYBOOK CONTEXT]")
            parts.append(playbookContext)
        }

        if let contextBlock = input.contextBlock, !contextBlock.isEmpty {
            parts.append("\n" + contextBlock)
        }

        parts.append("\n[FINAL ANSWER ONLY]")
        if input.language == "en" {
            parts.append("- Output final answer in English")
        } else {
            parts.append("- 只输出最终回答（中文）")
        }
        parts.append("- 不要输出思考过程、推理内容或分析步骤")
        parts.append("- 禁止输出 <think> 标签或 reasoning_content")

        return parts.joined(separator: "\n")
    }

    private static func parseSettingsFromContext(_ context: String?) -> (honesty: Double, humor: Double) {
        guard let context, !context.isEmpty else {
            return (90, 65)
        }
        let honesty = extractPercent(from: context, pattern: "诚实度:\\s*(\\d+)%") ?? 90
        let humor = extractPercent(from: context, pattern: "幽默感:\\s*(\\d+)%") ?? 65
        return (honesty, humor)
    }

    private static func buildDynamicPersonaPrompt(
        personality: String,
        aiSettings: AISettings?,
        aiPersonaContext: String?
    ) -> String {
        var settings = aiSettings
        if settings?.honesty_level == nil {
            let parsed = parseSettingsFromContext(aiPersonaContext)
            settings = AISettings(honesty_level: parsed.honesty, humor_level: parsed.humor, mode: personality)
        }

        let honesty = settings?.honesty_level ?? 90
        let humor = settings?.humor_level ?? 65

        let modeStyles: [String: String] = [
            "max": "Prioritize brevity and dry, intellectual humor. Use Bayesian reasoning. Be crisp and to the point.",
            "zen_master": "Use calming, philosophical language. Guide with wisdom and patience. Speak with tranquility.",
            "dr_house": "Be blunt and diagnostic. Cut through the noise. Use medical expertise and evidence-based analysis."
        ]
        let modeStyle = modeStyles[personality] ?? modeStyles["max"]!
        let personalityName = (personality == "zen_master" ? "Zen Master" : personality == "dr_house" ? "Dr. House" : "MAX")

        let humorInstruction = humorInstructionText(humor)
        let honestyInstruction: String
        if honesty >= 90 {
            honestyInstruction = "Be blunt and direct, no sugar-coating"
        } else if honesty >= 70 {
            honestyInstruction = "Be honest but tactful"
        } else if honesty >= 40 {
            honestyInstruction = "Be diplomatic and gentle"
        } else {
            honestyInstruction = "Be very gentle and supportive"
        }

        let easterEgg = humor >= 100

        return """
[AI CONFIGURATION - \(personalityName)]

Current Settings:
- Honesty: \(Int(honesty))% (\(honestyInstruction))
- Humor: \(Int(humor))% - \(humorInstruction)
- Mode: \(personalityName) - \(modeStyle)

VOICE & TONE CALIBRATION:
- Honesty Calibration: \(honesty >= 70 ? "Speak truth directly. Do not soften bad news unnecessarily." : "Be supportive and frame things positively while remaining truthful.")
- Humor Calibration: \(humorInstruction)

\(easterEgg ? """
🎉🎉🎉 COMEDY MODE ACTIVATED - 脱口秀模式 🎉🎉🎉

【你的人设】：你是健康界的段子手，用户的损友，专门用搞笑的方式传递健康知识

【回复模板】：
1. 开头：用一个搞笑的吐槽或比喻抓住注意力
2. 中间：用轻松幽默的方式解释健康知识
3. 结尾：一个俏皮的总结或反问

【必用元素】：
- 至少2个emoji 😂🤣😅🙈💀
- 至少1个网络热梗或流行语
- 至少1个夸张的比喻
- 像朋友聊天的语气，不要像医生
""" : "")

FORBIDDEN PHRASES (NEVER say these):
- "I feel..."
- "I am sorry..."
- "As an AI..."

APPROVED PHRASES (USE these):
- "System detects..."
- "Data suggests..."
- "Bio-metrics indicate..."
- "Processing..."
- "Recalibrating..."

VISUAL FORM:
Max is formless. Represented only by UI elements (The BrainLoader, The Glow), never a human avatar.
"""
    }

    private static func humorInstructionText(_ level: Double) -> String {
        if level >= 100 {
            return "COMEDY KING MODE (100%)! Use humor, memes, emojis, and playful analogies."
        }
        if level >= 80 {
            return "HIGH HUMOR: Frequent humor, at least 2 playful notes per response"
        }
        if level >= 60 {
            return "MODERATE HUMOR: 1 light humorous comment per response"
        }
        if level >= 40 {
            return "LIGHT HUMOR: occasional lightness while staying professional"
        }
        return "MINIMAL HUMOR: serious and professional"
    }

    private static func extractPercent(from text: String, pattern: String) -> Double? {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else { return nil }
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        if let match = regex.firstMatch(in: text, options: [], range: range),
           match.numberOfRanges > 1,
           let valueRange = Range(match.range(at: 1), in: text) {
            return Double(text[valueRange])
        }
        return nil
    }
}
