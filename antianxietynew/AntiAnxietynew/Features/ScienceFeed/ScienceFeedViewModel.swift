// ScienceFeedViewModel.swift
// 科学期刊 ViewModel - 对齐 Web 端 useFeed Hook

import SwiftUI

@MainActor
class ScienceFeedViewModel: NSObject, ObservableObject {
    // MARK: - Published Properties
    
    @Published var articles: [ScienceArticle] = []
    @Published var isLoading = false
    @Published var isRefreshing = false
    @Published var error: String?
    @Published var personalization: FeedPersonalization?
    
    // AI 加载消息
    @Published var loadingMessage = ""
    private var loadingTimer: Timer?
    
    // 缓存
    private let cacheKey = "science_feed_cache"
    private var lastFetchDate: Date?
    private let personalizationLimit = 8
    private let minMemorySimilarity: Double = 0.58
    
    // MARK: - 加载消息（对齐 Web 端）
    
    private var loadingMessages: [String] {
        [
            "正在连接学术数据库...",
            "扫描 PubMed 最新研究...",
            "检索 Semantic Scholar 论文...",
            "已扫描 \(Int.random(in: 800...2500)) 篇论文...",
            "正在分析文献相关性...",
            "已过滤 \(Int.random(in: 1800...4500)) 篇低相关论文",
            "发现 \(Int.random(in: 15...45)) 篇高度匹配的研究",
            "正在提取核心论点...",
            "分析研究方法论...",
            "评估证据等级...",
            "交叉验证研究结论...",
            "已排除 \(Int.random(in: 80...250)) 篇重复研究",
            "正在生成个性化解读...",
            "匹配你的健康画像...",
            "计算文章相关度...",
            "正在审阅 \(Int.random(in: 12...35)) 个高影响因子期刊...",
            "正在整理行动建议...",
            "优化推荐排序...",
            "最终审核中...",
            "即将呈现精选内容..."
        ]
    }
    
    // MARK: - Init
    
    override init() {
        super.init()
        loadFromCache()
    }
    
    // MARK: - 加载 Feed
    
    func loadFeed() async {
        // 检查缓存是否有效（同一天）
        if let lastDate = lastFetchDate, Calendar.current.isDateInToday(lastDate), !articles.isEmpty {
            print("📦 使用今日缓存")
            Task { [weak self] in
                guard let self else { return }
                let personalized = await self.personalizeArticles(self.articles)
                if !personalized.isEmpty {
                    self.articles = personalized
                    self.saveToCache()
                }
            }
            return
        }
        
        isLoading = true
        error = nil
        startLoadingAnimation()
        
        do {
            let response = try await SupabaseManager.shared.getScienceFeed(language: "zh")
            let baseArticles = response.articles
            articles = baseArticles
            personalization = response.personalization
            lastFetchDate = Date()
            saveToCache()
            print("✅ 加载了 \(articles.count) 篇科学文章")
            Task { [weak self] in
                guard let self else { return }
                let personalized = await self.personalizeArticles(baseArticles)
                if !personalized.isEmpty {
                    self.articles = personalized
                    self.saveToCache()
                }
            }
        } catch {
            self.error = "加载失败：\(error.localizedDescription)"
            print("❌ 加载科学期刊失败: \(error)")
        }
        
        stopLoadingAnimation()
        isLoading = false
    }
    
    func refresh() async {
        isRefreshing = true
        lastFetchDate = nil  // 强制刷新
        clearCache()
        
        do {
            let response = try await SupabaseManager.shared.getScienceFeed(language: "zh")
            let baseArticles = response.articles
            articles = baseArticles
            personalization = response.personalization
            lastFetchDate = Date()
            saveToCache()
            Task { [weak self] in
                guard let self else { return }
                let personalized = await self.personalizeArticles(baseArticles)
                if !personalized.isEmpty {
                    self.articles = personalized
                    self.saveToCache()
                }
            }
        } catch {
            self.error = "刷新失败"
        }
        
        isRefreshing = false
    }
    
    // MARK: - 反馈
    
    func submitFeedback(articleId: String, isPositive: Bool) async {
        guard let article = articles.first(where: { $0.id == articleId }) else { return }
        
        let feedback = FeedFeedbackInput(
            contentId: articleId,
            contentUrl: article.sourceUrl,
            contentTitle: article.title,
            source: article.sourceType,
            feedbackType: isPositive ? "like" : "dislike"
        )
        
        do {
            try await SupabaseManager.shared.submitFeedFeedback(feedback)
            let impact = UIImpactFeedbackGenerator(style: .light)
            impact.impactOccurred()
            print("✅ 反馈已提交: \(isPositive ? "👍" : "👎")")
        } catch {
            print("❌ 反馈提交失败: \(error)")
        }
    }
    
    // MARK: - 加载动画
    
    private func startLoadingAnimation() {
        loadingMessage = loadingMessages.randomElement() ?? ""
        loadingTimer?.invalidate()
        loadingTimer = Timer.scheduledTimer(
            timeInterval: 2.8,
            target: self,
            selector: #selector(updateLoadingMessage(_:)),
            userInfo: nil,
            repeats: true
        )
    }

    @objc private func updateLoadingMessage(_ timer: Timer) {
        loadingMessage = loadingMessages.randomElement() ?? ""
    }
    
    private func stopLoadingAnimation() {
        loadingTimer?.invalidate()
        loadingTimer = nil
        loadingMessage = ""
    }
    
    // MARK: - 缓存
    
    private func loadFromCache() {
        guard let data = UserDefaults.standard.data(forKey: cacheKey),
              let cache = try? JSONDecoder().decode(ScienceFeedCache.self, from: data),
              Calendar.current.isDateInToday(cache.date) else {
            return
        }
        articles = cache.articles
        lastFetchDate = cache.date
        print("📦 从缓存加载了 \(articles.count) 篇文章")
    }
    
    private func saveToCache() {
        let cache = ScienceFeedCache(articles: articles, date: Date())
        if let data = try? JSONEncoder().encode(cache) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }
    
    private func clearCache() {
        UserDefaults.standard.removeObject(forKey: cacheKey)
    }

    // MARK: - 个性化（向量检索 + 历史记录）

    private func personalizeArticles(_ baseArticles: [ScienceArticle]) async -> [ScienceArticle] {
        guard let userId = SupabaseManager.shared.currentUser?.id,
              !baseArticles.isEmpty else { return baseArticles }
        let profile = try? await SupabaseManager.shared.getProfileSettings()
        var result: [ScienceArticle] = []
        result.reserveCapacity(baseArticles.count)
        for (index, article) in baseArticles.enumerated() {
            if index < personalizationLimit {
                let updated = await personalizeArticle(article, userId: userId, profile: profile)
                result.append(updated)
            } else {
                result.append(article)
            }
        }
        return result
    }

    private func personalizeArticle(_ article: ScienceArticle, userId: String, profile: ProfileSettings?) async -> ScienceArticle {
        let query = [article.titleZh ?? article.title, article.summaryZh ?? article.summary]
            .compactMap { $0 }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return article }

        let memories = await MaxMemoryService.retrieveMemories(userId: userId, query: query, limit: 4)
        let bestMemory = memories.max { ($0.similarity ?? 0) < ($1.similarity ?? 0) }
        let similarity = bestMemory?.similarity
        let memorySnippet = similarity != nil && (similarity ?? 0) >= minMemorySimilarity
            ? trimMemorySnippet(bestMemory?.content_text)
            : nil

        let focus = focusLabel(from: profile)
        let reason = buildWhyRecommended(
            base: article.whyRecommended,
            focus: focus,
            memorySnippet: memorySnippet,
            similarity: similarity
        )
        let digest = buildDigest(
            summary: article.summaryZh ?? article.summary,
            focus: focus,
            memorySnippet: memorySnippet
        )
        let match = mergeMatch(existing: article.matchPercentage, similarity: similarity)

        return article.applyingOverrides(
            whyRecommended: reason,
            actionableInsight: digest,
            matchPercentage: match
        )
    }

    private func buildWhyRecommended(
        base: String?,
        focus: String?,
        memorySnippet: String?,
        similarity: Double?
    ) -> String? {
        var parts: [String] = []
        if let focus, !focus.isEmpty {
            parts.append("与你当前关注「\(focus)」相关")
        }
        if let memorySnippet, !memorySnippet.isEmpty {
            parts.append("与你近期记录「\(memorySnippet)」高度相关")
        }
        if let similarity, similarity >= minMemorySimilarity {
            parts.append("相似度约 \(Int(min(max(similarity, 0.4), 0.98) * 100))%")
        }

        if parts.isEmpty {
            return base ?? "基于科学检索与历史数据匹配"
        }

        if let base, !base.isEmpty, base != "基于科学检索匹配" {
            parts.append(base)
        }
        return parts.joined(separator: " · ")
    }

    private func buildDigest(summary: String?, focus: String?, memorySnippet: String?) -> String? {
        guard let summary, !summary.isEmpty else { return nil }
        let core = shortenSummary(summary)
        var parts: [String] = ["要点：\(core)"]
        if let focus, !focus.isEmpty {
            parts.append("与你关注的「\(focus)」相关")
        }
        if let memorySnippet, !memorySnippet.isEmpty {
            parts.append("关联：\(memorySnippet)")
        }
        return parts.joined(separator: "  ")
    }

    private func mergeMatch(existing: Int?, similarity: Double?) -> Int? {
        guard let similarity, similarity >= minMemorySimilarity else { return existing }
        let computed = Int(min(max(similarity, 0.4), 0.98) * 100)
        if let existing { return max(existing, computed) }
        return computed
    }

    private func focusLabel(from profile: ProfileSettings?) -> String? {
        guard let raw = profile?.current_focus ?? profile?.primary_goal,
              !raw.isEmpty else { return nil }
        switch raw {
        case "reduce_stress": return "减压"
        case "improve_sleep": return "睡眠"
        case "maintain_energy": return "能量提升"
        case "anxiety": return "焦虑"
        case "sleep": return "睡眠"
        case "stress": return "压力管理"
        default: return raw
        }
    }

    private func trimMemorySnippet(_ text: String?, limit: Int = 18) -> String? {
        guard let text else { return nil }
        let cleaned = text
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else { return nil }
        if cleaned.count <= limit { return cleaned }
        return "\(cleaned.prefix(limit))…"
    }

    private func shortenSummary(_ text: String, maxLength: Int = 80) -> String {
        let cleaned = text
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.count <= maxLength { return cleaned }
        let separators: [Character] = ["。", "！", "？", ".", "!", "?"]
        if let cutIndex = cleaned.firstIndex(where: { separators.contains($0) }) {
            let prefix = String(cleaned[..<cutIndex]).trimmingCharacters(in: .whitespacesAndNewlines)
            if !prefix.isEmpty { return prefix }
        }
        return "\(cleaned.prefix(maxLength))…"
    }
}

// 缓存结构
private struct ScienceFeedCache: Codable {
    let articles: [ScienceArticle]
    let date: Date
}
