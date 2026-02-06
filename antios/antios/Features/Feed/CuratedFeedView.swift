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
            }
            .background(AppTheme.Colors.backgroundDark)
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
                FeedItemCard(item: item)
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
        
        try? await Task.sleep(nanoseconds: 500_000_000)
        
        feedItems = [
            FeedItem(
                id: "1",
                title: "睡眠不足如何影响焦虑水平：最新研究综述",
                summary: "2024年发表在《Sleep Medicine Reviews》的meta分析显示，慢性睡眠剥夺与焦虑症状呈显著正相关...",
                source: "PubMed",
                type: .research,
                tags: ["睡眠", "焦虑", "研究"],
                relevanceScore: 0.92,
                personalizedBenefit: "基于你最近的睡眠数据，这篇文章可能帮助你理解睡眠与焦虑的关系"
            ),
            FeedItem(
                id: "2",
                title: "5分钟正念呼吸练习：快速缓解压力",
                summary: "哈佛医学院推荐的简易呼吸技巧，适合忙碌人群在任何场景下使用...",
                source: "YouTube",
                type: .video,
                tags: ["正念", "呼吸", "压力"],
                relevanceScore: 0.85,
                personalizedBenefit: nil
            ),
            FeedItem(
                id: "3",
                title: "认知行为疗法（CBT）自助指南",
                summary: "系统介绍如何识别和改变负面思维模式，实用性强的自我疗愈方法...",
                source: "Semantic Scholar",
                type: .article,
                tags: ["CBT", "心理健康"],
                relevanceScore: 0.78,
                personalizedBenefit: "你上次评估显示轻度焦虑，CBT 可能对你有帮助"
            )
        ]
        
        isLoading = false
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

#Preview {
    CuratedFeedView()
}
