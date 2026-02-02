import Foundation

struct MaxRAGContext {
    let memoryBlock: String?
    let playbookBlock: String?
}

enum MaxRAGService {
    static func buildContext(userId: String, query: String, language: String) async -> MaxRAGContext {
        let cleanedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedQuery.isEmpty else {
            return MaxRAGContext(memoryBlock: nil, playbookBlock: nil)
        }

        let embedding = try? await AIManager.shared.createEmbedding(for: cleanedQuery)
        async let memoriesTask = MaxMemoryService.retrieveMemories(userId: userId, query: cleanedQuery, embedding: embedding, limit: 8)
        async let knowledgeTask = KnowledgeBaseService.matchKnowledge(query: cleanedQuery, embedding: embedding, limit: 10)

        let memories = await memoriesTask
        var knowledge = await knowledgeTask

        if !knowledge.isEmpty {
            if let reranked = await RerankService.rerank(
                query: cleanedQuery,
                documents: knowledge.map { $0.content }
            ) {
                knowledge = reranked.compactMap { index in
                    guard knowledge.indices.contains(index) else { return nil }
                    return knowledge[index]
                }
            }
        }

        let memoryBlock = formatMemories(memories)
        let playbookBlock = formatKnowledge(knowledge, language: language)
        return MaxRAGContext(memoryBlock: memoryBlock, playbookBlock: playbookBlock)
    }

    private static func formatMemories(_ records: [MaxMemoryRecord]) -> String? {
        guard !records.isEmpty else { return nil }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let now = Date()

        let scored = records.map { record -> (MaxMemoryRecord, Double) in
            let similarity = record.similarity ?? 0.5
            let recency: Double
            if let date = formatter.date(from: record.created_at) {
                let days = max(0, now.timeIntervalSince(date) / 86400.0)
                recency = max(0.2, 1.0 - (days / 30.0))
            } else {
                recency = 0.5
            }
            let score = similarity * 0.7 + recency * 0.3
            return (record, score)
        }

        let top = scored.sorted { $0.1 > $1.1 }.prefix(6).map { $0.0 }
        let lines = top.map { record in
            let roleTag = record.role == "assistant" ? "assistant" : "user"
            return "• [\(roleTag)] \(record.content_text)"
        }
        return lines.joined(separator: "\n")
    }

    private static func formatKnowledge(_ chunks: [KnowledgeBaseChunk], language: String) -> String? {
        guard !chunks.isEmpty else { return nil }
        let top = chunks.prefix(6)
        let lines = top.map { chunk -> String in
            let content = (language == "en" ? (chunk.contentEn ?? chunk.content) : chunk.content)
            let category = chunk.category ?? "general"
            return "• [\(category)] \(content)"
        }
        return lines.joined(separator: "\n")
    }
}
