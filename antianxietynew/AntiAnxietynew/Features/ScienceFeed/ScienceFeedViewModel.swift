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
            return
        }
        
        isLoading = true
        error = nil
        startLoadingAnimation()
        
        do {
            let response = try await SupabaseManager.shared.getScienceFeed(language: "zh")
            articles = response.articles
            personalization = response.personalization
            lastFetchDate = Date()
            saveToCache()
            print("✅ 加载了 \(articles.count) 篇科学文章")
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
            articles = response.articles
            personalization = response.personalization
            lastFetchDate = Date()
            saveToCache()
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
}

// 缓存结构
private struct ScienceFeedCache: Codable {
    let articles: [ScienceArticle]
    let date: Date
}
