import Foundation

struct KnowledgeBaseChunk: Codable, Equatable {
    let content: String
    let contentEn: String?
    let category: String?
    let subcategory: String?
    let tags: [String]
    let similarity: Double
    let priority: Int
}

enum KnowledgeBaseService {
    static func matchKnowledge(
        query: String,
        embedding: [Double]?,
        limit: Int = 8,
        threshold: Double = 0.68,
        categories: [String]? = nil
    ) async -> [KnowledgeBaseChunk] {
        guard let embedding, !embedding.isEmpty, !query.isEmpty else { return [] }

        if let categories, !categories.isEmpty {
            return await matchKnowledgeMultiCategory(
                embedding: embedding,
                limit: limit,
                threshold: threshold,
                categories: categories
            )
        }

        struct RPCPayload: Encodable {
            let query_embedding: [Double]
            let match_threshold: Double
            let match_count: Int
            let filter_category: String?
        }

        struct KnowledgeRow: Codable {
            let content: String
            let content_en: String?
            let category: String?
            let subcategory: String?
            let tags: [String]?
            let similarity: Double?
            let priority: Int?
        }

        let payload = RPCPayload(
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: max(1, limit),
            filter_category: nil
        )

        let rows: [KnowledgeRow] = (try? await SupabaseManager.shared.request("rpc/match_metabolic_knowledge", method: "POST", body: payload)) ?? []
        return rank(rows.compactMap { row in
            guard !row.content.isEmpty else { return nil }
            return KnowledgeBaseChunk(
                content: row.content,
                contentEn: row.content_en,
                category: row.category,
                subcategory: row.subcategory,
                tags: row.tags ?? [],
                similarity: row.similarity ?? 0,
                priority: row.priority ?? 1
            )
        })
    }

    private static func matchKnowledgeMultiCategory(
        embedding: [Double],
        limit: Int,
        threshold: Double,
        categories: [String]
    ) async -> [KnowledgeBaseChunk] {
        struct RPCPayload: Encodable {
            let query_embedding: [Double]
            let match_threshold: Double
            let match_count: Int
            let filter_categories: [String]?
        }

        struct KnowledgeRow: Codable {
            let content: String
            let content_en: String?
            let category: String?
            let subcategory: String?
            let tags: [String]?
            let similarity: Double?
            let priority: Int?
        }

        let payload = RPCPayload(
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: max(1, limit),
            filter_categories: categories
        )

        let rows: [KnowledgeRow] = (try? await SupabaseManager.shared.request("rpc/match_metabolic_knowledge_multi_category", method: "POST", body: payload)) ?? []
        return rank(rows.compactMap { row in
            guard !row.content.isEmpty else { return nil }
            return KnowledgeBaseChunk(
                content: row.content,
                contentEn: row.content_en,
                category: row.category,
                subcategory: row.subcategory,
                tags: row.tags ?? [],
                similarity: row.similarity ?? 0,
                priority: row.priority ?? 1
            )
        })
    }

    private static func rank(_ chunks: [KnowledgeBaseChunk]) -> [KnowledgeBaseChunk] {
        let scored = chunks.map { chunk -> (KnowledgeBaseChunk, Double) in
            let similarity = chunk.similarity
            let priorityWeight = Double(max(1, chunk.priority)) / 5.0
            let score = similarity * 0.75 + priorityWeight * 0.25
            return (chunk, score)
        }

        return scored.sorted { $0.1 > $1.1 }.map { $0.0 }
    }
}
