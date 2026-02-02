import Foundation

enum RerankService {
    private struct CohereConfig {
        static var apiKey: String? {
            guard let key = Bundle.main.infoDictionary?["COHERE_API_KEY"] as? String else { return nil }
            let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? nil : trimmed
        }

        static var baseURL: String {
            if let url = Bundle.main.infoDictionary?["COHERE_API_BASE"] as? String,
               !url.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return url.trimmingCharacters(in: .whitespacesAndNewlines)
            }
            return "https://api.cohere.ai"
        }

        static var model: String {
            if let model = Bundle.main.infoDictionary?["COHERE_RERANK_MODEL"] as? String,
               !model.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return model
            }
            return "rerank-multilingual-v3.0"
        }
    }

    struct RerankResult: Codable {
        let results: [RerankItem]
    }

    struct RerankItem: Codable {
        let index: Int
        let relevance_score: Double
    }

    static func rerank(query: String, documents: [String], topN: Int = 8) async -> [Int]? {
        guard let apiKey = CohereConfig.apiKey,
              !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !documents.isEmpty else {
            return nil
        }

        let url = URL(string: "\(CohereConfig.baseURL)/v1/rerank")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 20

        let body: [String: Any] = [
            "model": CohereConfig.model,
            "query": query,
            "documents": documents,
            "top_n": min(topN, documents.count),
            "return_documents": false
        ]

        guard let payload = try? JSONSerialization.data(withJSONObject: body) else { return nil }
        request.httpBody = payload

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return nil }
            let result = try JSONDecoder().decode(RerankResult.self, from: data)
            return result.results.map { $0.index }
        } catch {
            return nil
        }
    }
}
