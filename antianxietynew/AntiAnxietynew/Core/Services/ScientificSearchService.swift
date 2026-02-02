import Foundation

enum ScientificSource: String, Codable {
    case semanticScholar = "semantic_scholar"
    case pubmed
    case healthline
    case openalex
}

struct ScientificPaper: Codable, Equatable {
    let id: String
    let title: String
    let abstract: String
    let url: String
    let year: Int?
    let citationCount: Int
    let doi: String?
    let source: ScientificSource
}

struct RankedScientificPaper: Codable, Equatable {
    let id: String
    let title: String
    let abstract: String
    let url: String
    let year: Int?
    let citationCount: Int
    let doi: String?
    let source: ScientificSource
    let rank: Int
    let authorityScore: Double
    let recencyScore: Double
    let sourceQualityScore: Double
    let compositeScore: Double
}

struct ScientificConsensus: Codable, Equatable {
    let score: Double
    let level: String
    let rationale: String
}

struct ScientificSearchResult: Codable {
    let keywords: [String]
    let papers: [RankedScientificPaper]
    let consensus: ScientificConsensus
    let success: Bool
    let retryNeeded: Bool
}

enum ScientificSearchService {
    private static let semanticScholarBase = "https://api.semanticscholar.org/graph/v1"
    private static let semanticScholarFields = "paperId,title,abstract,year,citationCount,url,externalIds,authors"
    private static let semanticScholarLimit = 15
    private static let pubmedBase = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    private static let pubmedLimit = 10
    private static let openAlexBase = "https://api.openalex.org"
    private static let openAlexLimit = 10
    private static let targetPaperCount = 10
    private static let searchTimeout: TimeInterval = 20
    private static let session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 12
        config.timeoutIntervalForResource = 18
        return URLSession(configuration: config)
    }()

    private static let weightAuthority = 0.4
    private static let weightRecency = 0.3
    private static let weightSourceQuality = 0.3

    private static let sourceQuality: [ScientificSource: Double] = [
        .pubmed: 1.0,
        .semanticScholar: 0.8,
        .healthline: 0.7,
        .openalex: 0.8
    ]

    static func searchScientificTruth(query: String) async -> ScientificSearchResult {
        let keywords = await extractKeywords(query: query)
        let searchQuery = keywords.isEmpty ? query : keywords.joined(separator: " ")

        var allPapers: [ScientificPaper] = await searchKnowledgeBase(query: searchQuery, limit: 6)
        var round = 0
        let start = Date()

        while allPapers.count < targetPaperCount && round < 3 {
            if Date().timeIntervalSince(start) > searchTimeout { break }
            round += 1

            async let semantic = searchSemanticScholar(query: searchQuery, limit: semanticScholarLimit)
            async let pubmed = searchPubMed(query: searchQuery, limit: pubmedLimit)
            async let healthline = searchHealthline(query: searchQuery, limit: 5)
            async let openalex = searchOpenAlex(query: searchQuery, limit: openAlexLimit)

            let results = await [semantic, pubmed, healthline, openalex].flatMap { $0 }
            allPapers = dedupePapers(allPapers + results)

            if allPapers.count >= targetPaperCount { break }
            try? await Task.sleep(nanoseconds: 1_000_000_000)
        }

        let ranked = Array(rerankPapers(allPapers).prefix(targetPaperCount))
        let consensus = computeConsensus(ranked, keywords: keywords)
        let success = ranked.count >= targetPaperCount

        return ScientificSearchResult(
            keywords: keywords,
            papers: Array(ranked),
            consensus: consensus,
            success: success,
            retryNeeded: !success
        )
    }

    private static func extractKeywords(query: String) async -> [String] {
        if query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return [] }

        let prompt = """
Extract 3-5 academic/medical English keywords from the user's health question for searching PubMed and Semantic Scholar.

Rules:
- Use medical/scientific terminology
- Avoid colloquial time expressions
- Return a comma-separated list only
"""

        do {
            let response = try await AIManager.shared.chatCompletion(
                messages: [ChatMessage(role: .user, content: query)],
                systemPrompt: prompt,
                model: .deepseekV3Exp,
                temperature: 0.2
            )
            let keywords = response
                .split { $0 == "," || $0 == "\n" || $0 == ";" }
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
                .filter { !$0.isEmpty }
            if !keywords.isEmpty {
                return Array(Set(keywords)).prefix(7).map { $0 }
            }
        } catch {
            // fallback below
        }

        let stopwords: Set<String> = ["the","a","an","and","or","of","for","to","in","with","about","what","how","why","is","are","can"]
        let tokens = query
            .lowercased()
            .split { !$0.isLetter && !$0.isNumber }
            .map(String.init)
            .filter { !stopwords.contains($0) && !$0.isEmpty }
        return Array(Set(tokens)).prefix(6).map { $0 }
    }

    private static func searchSemanticScholar(query: String, limit: Int) async -> [ScientificPaper] {
        guard let url = URL(string: "\(semanticScholarBase)/paper/search?query=\(query.addingPercentEncoding(withAllowedCharacters: CharacterSet.urlQueryAllowed) ?? "")&limit=\(limit)&fields=\(semanticScholarFields)") else {
            return []
        }
        do {
            let (data, response) = try await session.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return [] }
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let dataArray = json?["data"] as? [[String: Any]] ?? []
            return dataArray.map { item in
                let paperId = item["paperId"] as? String ?? UUID().uuidString
                let title = item["title"] as? String ?? "Untitled"
                let abstract = item["abstract"] as? String ?? ""
                let year = item["year"] as? Int
                let citation = item["citationCount"] as? Int ?? 0
                let url = item["url"] as? String ?? ""
                let external = item["externalIds"] as? [String: Any]
                let doi = external?["DOI"] as? String
                return ScientificPaper(id: paperId, title: title, abstract: abstract, url: url, year: year, citationCount: citation, doi: doi, source: .semanticScholar)
            }
        } catch {
            return []
        }
    }

    private static func searchPubMed(query: String, limit: Int) async -> [ScientificPaper] {
        let keywords = query.split(separator: " ").filter { String($0).count > 2 }.prefix(5).joined(separator: " OR ")
        let searchUrl = "\(pubmedBase)/esearch.fcgi?db=pubmed&term=\(keywords.addingPercentEncoding(withAllowedCharacters: CharacterSet.urlQueryAllowed) ?? "")&retmax=\(limit)&retmode=json&sort=relevance"
        guard let url = URL(string: searchUrl) else { return [] }
        do {
            let (data, response) = try await session.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return [] }
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let idList = ((json?["esearchresult"] as? [String: Any])?["idlist"] as? [String]) ?? []
            if idList.isEmpty { return [] }
            let idString = idList.joined(separator: ",")
            let fetchUrl = "\(pubmedBase)/efetch.fcgi?db=pubmed&id=\(idString)&retmode=xml"
            guard let fetchURL = URL(string: fetchUrl) else { return [] }
            let (fetchData, fetchResponse) = try await session.data(from: fetchURL)
            guard let fetchHttp = fetchResponse as? HTTPURLResponse, fetchHttp.statusCode == 200 else { return [] }
            let xml = String(data: fetchData, encoding: .utf8) ?? ""
            return parsePubMedXML(xml)
        } catch {
            return []
        }
    }

    private static func parsePubMedXML(_ xml: String) -> [ScientificPaper] {
        // Minimal XML parsing via regex for title/abstract/pmid/year
        let pmidRegex = try? NSRegularExpression(pattern: "<PMID[^>]*>(\\d+)</PMID>", options: [])
        let titleRegex = try? NSRegularExpression(pattern: "<ArticleTitle>(.*?)</ArticleTitle>", options: [.dotMatchesLineSeparators])
        let abstractRegex = try? NSRegularExpression(pattern: "<AbstractText[^>]*>(.*?)</AbstractText>", options: [.dotMatchesLineSeparators])
        let yearRegex = try? NSRegularExpression(pattern: "<PubDate>.*?<Year>(\\d+)</Year>", options: [.dotMatchesLineSeparators])

        let pmids = pmidRegex?.matches(in: xml, options: [], range: NSRange(xml.startIndex..<xml.endIndex, in: xml)) ?? []
        var papers: [ScientificPaper] = []

        for (index, pmidMatch) in pmids.enumerated() {
            guard let pmidRange = Range(pmidMatch.range(at: 1), in: xml) else { continue }
            let pmid = String(xml[pmidRange])

            let title = extractFirstMatch(regex: titleRegex, in: xml, offset: index) ?? "Untitled"
            let abstract = extractFirstMatch(regex: abstractRegex, in: xml, offset: index) ?? ""
            let yearString = extractFirstMatch(regex: yearRegex, in: xml, offset: index)
            let year = yearString.flatMap { Int($0) }

            let url = "https://pubmed.ncbi.nlm.nih.gov/\(pmid)/"
            papers.append(ScientificPaper(
                id: "pubmed_\(pmid)",
                title: title,
                abstract: abstract,
                url: url,
                year: year,
                citationCount: 0,
                doi: nil,
                source: .pubmed
            ))
        }
        return papers
    }

    private static func extractFirstMatch(regex: NSRegularExpression?, in text: String, offset: Int) -> String? {
        guard let regex else { return nil }
        let matches = regex.matches(in: text, options: [], range: NSRange(text.startIndex..<text.endIndex, in: text))
        guard offset < matches.count, let range = Range(matches[offset].range(at: 1), in: text) else { return nil }
        return String(text[range]).replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func searchOpenAlex(query: String, limit: Int) async -> [ScientificPaper] {
        let encoded = query.addingPercentEncoding(withAllowedCharacters: CharacterSet.urlQueryAllowed) ?? ""
        let urlString = "\(openAlexBase)/works?search=\(encoded)&per-page=\(limit)"
        guard let url = URL(string: urlString) else { return [] }
        do {
            let (data, response) = try await session.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return [] }
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let results = json?["results"] as? [[String: Any]] ?? []
            return results.map { item in
                let id = item["id"] as? String ?? UUID().uuidString
                let title = item["display_name"] as? String ?? "Untitled"
                let year = item["publication_year"] as? Int
                let citation = item["cited_by_count"] as? Int ?? 0
                let doi = (item["doi"] as? String)?.replacingOccurrences(of: "https://doi.org/", with: "")
                let url = id
                return ScientificPaper(id: id, title: title, abstract: "", url: url, year: year, citationCount: citation, doi: doi, source: .openalex)
            }
        } catch {
            return []
        }
    }

    private static func searchHealthline(query: String, limit: Int) async -> [ScientificPaper] {
        let embedding = try? await AIManager.shared.createEmbedding(for: query)
        let chunks = await KnowledgeBaseService.matchKnowledge(query: query, embedding: embedding, limit: limit)
        if chunks.isEmpty { return [] }

        return chunks.prefix(limit).enumerated().map { index, chunk in
            ScientificPaper(
                id: "kb_\(index)",
                title: chunk.category ?? "科学知识",
                abstract: chunk.content,
                url: "",
                year: nil,
                citationCount: Int(chunk.similarity * 100),
                doi: nil,
                source: .healthline
            )
        }
    }

    private static func searchKnowledgeBase(query: String, limit: Int) async -> [ScientificPaper] {
        let embedding = try? await AIManager.shared.createEmbedding(for: query)
        let chunks = await KnowledgeBaseService.matchKnowledge(query: query, embedding: embedding, limit: limit)
        guard !chunks.isEmpty else { return [] }
        return chunks.prefix(limit).enumerated().map { index, chunk in
            ScientificPaper(
                id: "kb_seed_\(index)",
                title: chunk.category ?? "科学知识",
                abstract: chunk.content,
                url: "",
                year: nil,
                citationCount: Int(chunk.similarity * 100),
                doi: nil,
                source: .healthline
            )
        }
    }

    private static func dedupePapers(_ papers: [ScientificPaper]) -> [ScientificPaper] {
        var seen = Set<String>()
        var result: [ScientificPaper] = []
        for paper in papers {
            let key = "\(paper.title.lowercased())|\(paper.doi ?? "")|\(paper.url)"
            if seen.contains(key) { continue }
            seen.insert(key)
            result.append(paper)
        }
        return result
    }

    private static func rerankPapers(_ papers: [ScientificPaper]) -> [RankedScientificPaper] {
        let currentYear = Calendar.current.component(.year, from: Date())
        let ranked = papers.enumerated().map { index, paper -> RankedScientificPaper in
            let authorityScore = min(1.0, log(Double(paper.citationCount + 1)) / 6.0)
            let recencyScore: Double
            if let year = paper.year {
                let age = max(0, currentYear - year)
                recencyScore = max(0.0, 1.0 - (Double(age) / 10.0))
            } else {
                recencyScore = 0.5
            }
            let sourceScore = sourceQuality[paper.source] ?? 0.7
            let composite = authorityScore * weightAuthority + recencyScore * weightRecency + sourceScore * weightSourceQuality
            return RankedScientificPaper(
                id: paper.id,
                title: paper.title,
                abstract: paper.abstract,
                url: paper.url,
                year: paper.year,
                citationCount: paper.citationCount,
                doi: paper.doi,
                source: paper.source,
                rank: index + 1,
                authorityScore: authorityScore,
                recencyScore: recencyScore,
                sourceQualityScore: sourceScore,
                compositeScore: composite
            )
        }

        return ranked.sorted { $0.compositeScore > $1.compositeScore }.enumerated().map { idx, paper in
            RankedScientificPaper(
                id: paper.id,
                title: paper.title,
                abstract: paper.abstract,
                url: paper.url,
                year: paper.year,
                citationCount: paper.citationCount,
                doi: paper.doi,
                source: paper.source,
                rank: idx + 1,
                authorityScore: paper.authorityScore,
                recencyScore: paper.recencyScore,
                sourceQualityScore: paper.sourceQualityScore,
                compositeScore: paper.compositeScore
            )
        }
    }

    private static func computeConsensus(_ papers: [RankedScientificPaper], keywords: [String]) -> ScientificConsensus {
        guard !papers.isEmpty else {
            return ScientificConsensus(score: 0.4, level: "low", rationale: "缺少论文证据")
        }
        let avgAuthority = papers.map { $0.authorityScore }.reduce(0, +) / Double(papers.count)
        let avgRecency = papers.map { $0.recencyScore }.reduce(0, +) / Double(papers.count)
        let score = min(1.0, (avgAuthority * 0.6 + avgRecency * 0.4))
        let level: String
        if score >= 0.75 { level = "high" }
        else if score >= 0.6 { level = "emerging" }
        else if score >= 0.45 { level = "mixed" }
        else { level = "low" }
        let rationale = keywords.isEmpty ? "基于可用论文证据" : "基于关键词 \(keywords.prefix(3).joined(separator: ", ")) 的论文共识"
        return ScientificConsensus(score: score, level: level, rationale: rationale)
    }
}
