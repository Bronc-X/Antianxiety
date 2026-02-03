// ScienceFeedView.swift
// 定制科学期刊视图 - 完全对齐 Web 端 ScienceFeed.tsx

import SwiftUI

struct ScienceFeedView: View {
    @StateObject private var viewModel = ScienceFeedViewModel()
    @Environment(\.screenMetrics) private var metrics
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.bgPrimary.ignoresSafeArea()
                
                if viewModel.isLoading && viewModel.articles.isEmpty {
                    AILoadingView(message: viewModel.loadingMessage)
                } else if viewModel.articles.isEmpty {
                    EmptyFeedView(onRefresh: { Task { await viewModel.refresh() } })
                } else {
                    ScrollView {
                        VStack(spacing: metrics.sectionSpacing) {
                            // Header
                            FeedHeaderView(
                                isRefreshing: viewModel.isRefreshing,
                                onRefresh: { Task { await viewModel.refresh() } }
                            )
                            
                            // 文章列表
                            ForEach(Array(viewModel.articles.enumerated()), id: \.element.id) { index, article in
                                NavigationLink(destination: ArticleReaderView(article: article)) {
                                    ArticleCard(
                                        article: article,
                                        index: index,
                                        onFeedback: { isPositive in
                                            Task { await viewModel.submitFeedback(articleId: article.id, isPositive: isPositive) }
                                        }
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                            
                            // 刷新按钮
                            RefreshButton(
                                isRefreshing: viewModel.isRefreshing,
                                onRefresh: { Task { await viewModel.refresh() } }
                            )
                        }
                        .liquidGlassPageWidth()
                        .padding(.vertical, metrics.verticalPadding)
                    }
                }
            }
            .navigationTitle("科学期刊")
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await viewModel.refresh()
            }
        }
        .task {
            await viewModel.loadFeed()
        }
    }
}

// MARK: - Feed Header
struct FeedHeaderView: View {
    let isRefreshing: Bool
    let onRefresh: () -> Void
    
    private var todayString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "M月d日"
        return formatter.string(from: Date())
    }
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("今日精选 · \(todayString)")
                    .font(.caption)
                    .tracking(2)
                    .foregroundColor(.liquidGlassAccent)
                
                Spacer()
                
                Button(action: onRefresh) {
                    HStack(spacing: 4) {
                        if isRefreshing {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "arrow.clockwise")
                        }
                        Text("刷新")
                    }
                    .font(.caption)
                    .foregroundColor(.liquidGlassAccent)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.liquidGlassAccent.opacity(0.1))
                    .clipShape(Capsule())
                }
                .disabled(isRefreshing)
            }
            
            Text("为你量身定制的科学")
                .font(.title.bold())
                .foregroundColor(.textPrimary)
            
            Text("每篇文章都经过 AI 分析，解释为什么它对你重要")
                .font(.subheadline)
                .foregroundColor(.textSecondary)
            
            Text("📅 每天下午 2:00（UTC+8）更新推荐")
                .font(.caption2)
                .foregroundColor(.textTertiary)
        }
    }
}

// MARK: - Article Card
struct ArticleCard: View {
    let article: ScienceArticle
    let index: Int
    let onFeedback: (Bool) -> Void
    
    private var isLight: Bool { index % 2 == 0 }
    private var platform: PlatformInfo { PlatformInfo.forType(article.sourceType) }
    private var cardBackground: Color { isLight ? Color.brandPaper : Color(hex: "#0F4A37") }
    private var cardPrimaryText: Color { isLight ? Color.deepGreen : Color.brandPaper }
    private var cardSecondaryText: Color { isLight ? Color(hex: "#4A665A") : Color.brandPaper.opacity(0.75) }
    private var cardTertiaryText: Color { isLight ? Color(hex: "#7A8F70") : Color.brandPaper.opacity(0.55) }
    private var cardBorder: Color { isLight ? Color.black.opacity(0.06) : Color.white.opacity(0.12) }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header: Platform + Match
            HStack {
                PlatformBadge(platform: platform)
                Spacer()
                MatchBadge(percentage: article.matchPercentage)
            }
            
            // Title
            if let url = article.sourceUrl, let link = URL(string: url) {
                Link(destination: link) {
                    HStack(alignment: .top) {
                        Text(article.titleZh ?? article.title)
                            .font(.headline)
                            .foregroundColor(cardPrimaryText)
                            .multilineTextAlignment(.leading)
                        Image(systemName: "arrow.up.right")
                            .font(.caption)
                            .foregroundColor(cardTertiaryText)
                    }
                }
            } else {
                Text(article.titleZh ?? article.title)
                    .font(.headline)
                    .foregroundColor(cardPrimaryText)
            }
            
            // 精华检索（个性化摘要）
            if let digest = article.actionableInsight {
                InsightBox(
                    icon: "magnifyingglass",
                    title: "精华检索",
                    content: digest,
                    accentColor: .liquidGlassSecondary,
                    textColor: cardSecondaryText,
                    backgroundColor: .liquidGlassSecondary.opacity(isLight ? 0.12 : 0.2)
                )
            } else if let summary = article.summaryZh ?? article.summary {
                Text(summary)
                    .font(.subheadline)
                    .foregroundColor(cardSecondaryText)
                    .lineLimit(3)
            }
            
            // 为什么推荐给你
            if let why = article.whyRecommended {
                InsightBox(
                    icon: "sparkles",
                    title: "为什么推荐给你",
                    content: why,
                    accentColor: .liquidGlassAccent,
                    textColor: cardSecondaryText,
                    backgroundColor: .liquidGlassAccent.opacity(isLight ? 0.12 : 0.2)
                )
            }
            
            // Tags
            if let tags = article.tags, !tags.isEmpty {
                FlowLayout(spacing: 8) {
                    ForEach(tags, id: \.self) { tag in
                        Text(tag)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(isLight ? Color.gray.opacity(0.1) : Color.white.opacity(0.1))
                            .clipShape(Capsule())
                    }
                }
            }
            
            Divider().opacity(0.3)
            
            // Actions
            HStack {
                if let url = article.sourceUrl, let link = URL(string: url) {
                    Link(destination: link) {
                        HStack(spacing: 4) {
                            Image(systemName: "book.fill")
                            Text("阅读全文")
                            Image(systemName: "arrow.up.right")
                                .font(.caption2)
                        }
                        .font(.subheadline)
                        .foregroundColor(.liquidGlassAccent)
                    }
                }
                
                Spacer()
                
                HStack(spacing: 16) {
                    Button { onFeedback(true) } label: {
                        Image(systemName: "hand.thumbsup")
                            .foregroundColor(cardTertiaryText)
                    }
                    
                    Button { onFeedback(false) } label: {
                        Image(systemName: "hand.thumbsdown")
                            .foregroundColor(cardTertiaryText)
                    }
                }
            }
        }
        .padding()
        .background(cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(cardBorder, lineWidth: 1)
        )
    }
}

// MARK: - Platform Badge
struct PlatformBadge: View {
    let platform: PlatformInfo
    
    var body: some View {
        HStack(spacing: 6) {
            Text(platform.icon)
            Text(platform.nameZh)
                .font(.caption.weight(.medium))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color(hex: platform.color).opacity(0.2))
        .foregroundColor(Color(hex: platform.color))
        .clipShape(Capsule())
    }
}

// MARK: - Match Badge
struct MatchBadge: View {
    let percentage: Int?
    
    var body: some View {
        if let pct = percentage {
            HStack(spacing: 4) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.caption2)
                Text("\(pct)% 匹配")
                    .font(.caption.bold())
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(badgeColor.opacity(0.15))
            .foregroundColor(badgeColor)
            .clipShape(Capsule())
        }
    }
    
    private var badgeColor: Color {
        guard let pct = percentage else { return .blue }
        if pct >= 95 { return .green }
        if pct >= 90 { return .orange }
        return .blue
    }
}

// MARK: - Insight Box
struct InsightBox: View {
    let icon: String
    let title: String
    let content: String
    let accentColor: Color
    var textColor: Color = .textSecondary
    var backgroundColor: Color? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .foregroundColor(accentColor)
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(accentColor)
            }
            Text(content)
                .font(.subheadline)
                .foregroundColor(textColor)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(backgroundColor ?? accentColor.opacity(0.1))
        .overlay(
            Rectangle()
                .fill(accentColor)
                .frame(width: 3),
            alignment: .leading
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - AI Loading View
struct AILoadingView: View {
    let message: String
    @State private var progress: CGFloat = 0
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            ZStack {
                Circle()
                    .stroke(Color.liquidGlassAccent.opacity(0.2), lineWidth: 4)
                    .frame(width: 60, height: 60)
                
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.liquidGlassAccent)
            }
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .animation(.easeInOut, value: message)
            
            // Progress bar
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.white.opacity(0.1))
                .frame(width: 200, height: 4)
                .overlay(
                    GeometryReader { geo in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color.liquidGlassAccent)
                            .frame(width: geo.size.width * progress)
                    },
                    alignment: .leading
                )
            
            Text("这可能需要 10-20 秒")
                .font(.caption2)
                .foregroundColor(.textTertiary)
            
            Spacer()
        }
        .padding()
        .onAppear {
            withAnimation(.linear(duration: 25)) {
                progress = 1
            }
        }
    }
}

// MARK: - Empty Feed View
struct EmptyFeedView: View {
    let onRefresh: () -> Void
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "newspaper")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("暂时没有个性化内容")
                .font(.title3.bold())
                .foregroundColor(.textPrimary)
            
            Text("完成每日校准，即可开始接收 AI 精选研究")
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
            
            Button("刷新", action: onRefresh)
                .buttonStyle(LiquidGlassButtonStyle(isProminent: true))
        }
        .padding()
    }
}

// MARK: - Refresh Button
struct RefreshButton: View {
    let isRefreshing: Bool
    let onRefresh: () -> Void
    
    var body: some View {
        Button(action: onRefresh) {
            HStack(spacing: 8) {
                if isRefreshing {
                    ProgressView()
                        .tint(.liquidGlassAccent)
                } else {
                    Image(systemName: "arrow.clockwise")
                }
                Text(isRefreshing ? "刷新中..." : "刷新文章")
            }
            .font(.subheadline)
            .foregroundColor(.textPrimary)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Color.liquidGlassAccent.opacity(0.1))
            .clipShape(Capsule())
            .overlay(
                Capsule().stroke(Color.liquidGlassAccent.opacity(0.2), lineWidth: 1)
            )
        }
        .disabled(isRefreshing)
    }
}

// MARK: - Flow Layout (简化版)
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(proposal: proposal, subviews: subviews)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(proposal: proposal, subviews: subviews)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x, y: bounds.minY + result.positions[index].y), proposal: .unspecified)
        }
    }
    
    private func layout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let width = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }
        
        return (CGSize(width: width, height: y + rowHeight), positions)
    }
}

// MARK: - Preview
struct ScienceFeedView_Previews: PreviewProvider {
    static var previews: some View {
        ScienceFeedView()
            .preferredColorScheme(.dark)
    }
}
