//
//  CuratedFeedView.swift
//  antios
//
//  F1-F3: 科学期刊视图
//

import SwiftUI

struct CuratedFeedView: View {
    @StateObject private var viewModel = CuratedFeedViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.md) {
                    // Filter Tags
                    filterSection
                    
                    // Feed Items
                    if viewModel.isLoading {
                        loadingView
                    } else if viewModel.feedItems.isEmpty {
                        emptyView
                    } else {
                        feedList
                    }
                }
                .padding(AppTheme.Spacing.md)
                .padding(.bottom, 24)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle("科学期刊")
            .navigationBarTitleDisplayMode(.large)
        }
        .onAppear {
            Task {
                await viewModel.loadFeed()
            }
        }
    }
    
    // MARK: - Filter Section
    
    private var filterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppTheme.Spacing.sm) {
                ForEach(FeedCategory.allCases) { category in
                    FilterTag(
                        title: category.displayName,
                        isSelected: viewModel.selectedCategory == category
                    ) {
                        viewModel.selectedCategory = category
                        Task {
                            await viewModel.loadFeed()
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Loading View
    
    private var loadingView: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            ForEach(0..<3, id: \.self) { _ in
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.lg)
                    .fill(AppTheme.Colors.backgroundCard)
                    .frame(height: 200)
                    .shimmer()
            }
        }
    }
    
    // MARK: - Empty View
    
    private var emptyView: some View {
        VStack(spacing: AppTheme.Spacing.md) {
            Image(systemName: "book.closed")
                .font(.system(size: 60))
                .foregroundColor(AppTheme.Colors.textTertiary)
            
            Text("暂无相关内容")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, AppTheme.Spacing.xxl)
    }
    
    // MARK: - Feed List
    
    private var feedList: some View {
        LazyVStack(spacing: AppTheme.Spacing.md) {
            ForEach(viewModel.feedItems) { item in
                if let urlString = item.url, let url = URL(string: urlString) {
                    Link(destination: url) {
                        FeedItemCard(item: item)
                    }
                    .buttonStyle(.plain)
                } else {
                    FeedItemCard(item: item)
                }
            }
        }
    }
}

// MARK: - Filter Tag

struct FilterTag: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(AppTheme.Typography.subheadline)
                .foregroundColor(isSelected ? .white : AppTheme.Colors.textSecondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? AppTheme.Colors.primary : AppTheme.Colors.backgroundCard)
                .cornerRadius(AppTheme.CornerRadius.full)
        }
    }
}

// MARK: - Feed Item Card

struct FeedItemCard: View {
    let item: FeedItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            // Header
            HStack {
                Image(systemName: item.type.icon)
                    .foregroundColor(item.type.color)
                
                Text(item.source)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textTertiary)
                
                Spacer()
                
                // Relevance Score (F3)
                HStack(spacing: 2) {
                    Image(systemName: "star.fill")
                        .font(.caption2)
                    Text("\(Int(item.relevanceScore * 100))%")
                        .font(AppTheme.Typography.caption)
                }
                .foregroundColor(AppTheme.Colors.warning)
            }
            
            // Title
            Text(item.title)
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
                .lineLimit(2)
            
            // Summary
            Text(item.summary)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textSecondary)
                .lineLimit(3)
            
            // Personalized Benefit (F2)
            if let benefit = item.personalizedBenefit {
                HStack(alignment: .top, spacing: AppTheme.Spacing.sm) {
                    Image(systemName: "sparkles")
                        .foregroundColor(AppTheme.Colors.primary)
                    
                    Text(benefit)
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.primary)
                }
                .padding(AppTheme.Spacing.sm)
                .background(AppTheme.Colors.primary.opacity(0.1))
                .cornerRadius(AppTheme.CornerRadius.sm)
            }
            
            // Tags
            HStack {
                ForEach(item.tags.prefix(3), id: \.self) { tag in
                    Text("#\(tag)")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.info)
                }
            }
        }
        .cardStyle()
    }
}

// MARK: - View Model

@MainActor
class CuratedFeedViewModel: ObservableObject {
    @Published var feedItems: [FeedItem] = []
    @Published var selectedCategory: FeedCategory = .all
    @Published var isLoading = false
    
    func loadFeed() async {
        isLoading = true
        defer { isLoading = false }

        if let remoteItems = try? await fetchRemoteFeed() {
            feedItems = filterByCategory(remoteItems)
            return
        }

        feedItems = filterByCategory(localFallbackFeed())
    }

    private func filterByCategory(_ items: [FeedItem]) -> [FeedItem] {
        guard selectedCategory != .all else { return items }
        return items.filter { item in
            item.tags.contains { $0.localizedCaseInsensitiveContains(selectedCategory.matchToken) }
        }
    }

    private func fetchRemoteFeed() async throws -> [FeedItem] {
        let response: FeedAPIResponse = try await APIClient.shared.request(
            endpoint: "feed?limit=20&enrich=true&lang=zh",
            method: .get
        )
        let mapped = response.items.map { item -> FeedItem in
            let source = item.sourceLabel ?? item.source ?? item.sourceType ?? "Feed"
            let tags = item.tags ?? item.matchedTags ?? []
            return FeedItem(
                id: item.id,
                title: item.title ?? "未命名内容",
                summary: item.summary ?? item.contentText ?? "暂无摘要",
                source: source,
                type: FeedItemType.from(source: source),
                tags: tags,
                relevanceScore: item.relevanceScore ?? item.matchScore ?? 0.7,
                personalizedBenefit: item.personalizedBenefit ?? item.benefit ?? deriveBenefitFromLocalSignals(tags: tags),
                url: item.url ?? item.sourceURL
            )
        }
        return mapped.isEmpty ? localFallbackFeed() : mapped
    }

    private func localFallbackFeed() -> [FeedItem] {
        let stress = UserDefaults.standard.integer(forKey: "antios_clinical_stress_level")
        let sleep = UserDefaults.standard.double(forKey: "antios_clinical_sleep_hours")
        let goals = (UserDefaults.standard.array(forKey: "antios_clinical_goals") as? [String]) ?? []

        let stressTag = stress >= 6 ? "压力" : "恢复"
        let sleepTag = sleep > 0 && sleep < 7 ? "睡眠" : "节律"
        let goalTag = goals.first ?? "身心健康"

        return [
            FeedItem(
                id: "local-1",
                title: "睡眠连续性与焦虑波动的关联",
                summary: "系统回顾显示，连续一周稳定的睡眠时长可降低焦虑评分波动幅度。",
                source: "PubMed",
                type: .research,
                tags: [sleepTag, "焦虑", goalTag],
                relevanceScore: sleep > 0 && sleep < 7 ? 0.91 : 0.78,
                personalizedBenefit: "你的睡眠校准数据提示可优先优化入睡前 1 小时行为。",
                url: nil
            ),
            FeedItem(
                id: "local-2",
                title: "短时呼吸训练对压力恢复的即时效果",
                summary: "4-7-8 与盒式呼吸在高压人群中的实验对比，均可快速改善主观压力。",
                source: "Semantic Scholar",
                type: .article,
                tags: [stressTag, "呼吸", "恢复"],
                relevanceScore: stress >= 6 ? 0.9 : 0.76,
                personalizedBenefit: stress >= 6 ? "你当前压力评分偏高，建议优先尝试呼吸练习。" : nil,
                url: nil
            ),
            FeedItem(
                id: "local-3",
                title: "CBT 微练习：从触发到重评估",
                summary: "一个可在 5 分钟内完成的认知重评估流程，适合日常焦虑管理。",
                source: "YouTube",
                type: .video,
                tags: ["CBT", "情绪", goalTag],
                relevanceScore: 0.74,
                personalizedBenefit: deriveBenefitFromLocalSignals(tags: ["CBT", "情绪"]),
                url: nil
            )
        ]
    }

    private func deriveBenefitFromLocalSignals(tags: [String]) -> String? {
        let stress = UserDefaults.standard.integer(forKey: "antios_clinical_stress_level")
        let sleep = UserDefaults.standard.double(forKey: "antios_clinical_sleep_hours")
        if tags.contains(where: { $0.contains("睡眠") }) && sleep > 0 && sleep < 7 {
            return "你的临床引导睡眠时长偏短，这篇内容与当前问题高度相关。"
        }
        if tags.contains(where: { $0.contains("压力") || $0.contains("焦虑") }) && stress >= 6 {
            return "结合你的压力评分，这篇内容可作为本周优先阅读。"
        }
        return nil
    }
}

// MARK: - Models

struct FeedItem: Identifiable {
    let id: String
    let title: String
    let summary: String
    let source: String
    let type: FeedItemType
    let tags: [String]
    let relevanceScore: Double
    let personalizedBenefit: String?
    let url: String?
}

enum FeedItemType {
    case research
    case video
    case article
    
    var icon: String {
        switch self {
        case .research: return "doc.text"
        case .video: return "play.rectangle"
        case .article: return "newspaper"
        }
    }
    
    var color: Color {
        switch self {
        case .research: return .purple
        case .video: return .red
        case .article: return .blue
        }
    }
}

enum FeedCategory: String, CaseIterable, Identifiable {
    case all
    case sleep
    case anxiety
    case stress
    case mindfulness
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .all: return "全部"
        case .sleep: return "睡眠"
        case .anxiety: return "焦虑"
        case .stress: return "压力"
        case .mindfulness: return "正念"
        }
    }

    var matchToken: String {
        switch self {
        case .all: return ""
        case .sleep: return "睡眠"
        case .anxiety: return "焦虑"
        case .stress: return "压力"
        case .mindfulness: return "正念"
        }
    }
}

extension FeedItemType {
    static func from(source: String) -> FeedItemType {
        let lowercased = source.lowercased()
        if lowercased.contains("youtube") || lowercased.contains("video") {
            return .video
        }
        if lowercased.contains("pubmed") || lowercased.contains("nature") || lowercased.contains("science") {
            return .research
        }
        return .article
    }
}

private struct FeedAPIResponse: Decodable {
    let items: [FeedAPIItem]
}

private struct FeedAPIItem: Decodable {
    let id: String
    let title: String?
    let summary: String?
    let contentText: String?
    let source: String?
    let sourceLabel: String?
    let sourceType: String?
    let sourceURL: String?
    let url: String?
    let relevanceScore: Double?
    let matchScore: Double?
    let matchedTags: [String]?
    let tags: [String]?
    let benefit: String?
    let personalizedBenefit: String?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case summary
        case contentText = "content_text"
        case source
        case sourceLabel
        case sourceType = "source_type"
        case sourceURL = "source_url"
        case url
        case relevanceScore = "relevance_score"
        case matchScore
        case matchedTags
        case tags
        case benefit
        case personalizedBenefit
    }
}

// MARK: - Shimmer Effect

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .overlay(
                LinearGradient(
                    colors: [.clear, .white.opacity(0.1), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase)
                .animation(.linear(duration: 1.5).repeatForever(autoreverses: false), value: phase)
            )
            .onAppear {
                phase = 300
            }
    }
}

extension View {
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }
}

struct CuratedFeedView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    CuratedFeedView()
    }
}
