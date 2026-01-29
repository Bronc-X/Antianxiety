// ArticleReaderView.swift
// 文章阅读视图

import SwiftUI

struct ArticleReaderView: View {
    let article: ScienceArticle
    @Environment(\.screenMetrics) private var metrics

    var body: some View {
        ZStack {
            AuroraBackground()

            ScrollView {
                VStack(spacing: metrics.sectionSpacing) {
                    header

                    LiquidGlassCard(style: .standard, padding: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(article.titleZh ?? article.title)
                                .font(.title3.bold())
                                .foregroundColor(.textPrimary)

                            if let summary = article.summaryZh ?? article.summary {
                                Text(summary)
                                    .font(.subheadline)
                                    .foregroundColor(.textSecondary)
                            }

                            if let why = article.whyRecommended {
                                InsightBox(
                                    icon: "sparkles",
                                    title: "为什么推荐给你",
                                    content: why,
                                    accentColor: .liquidGlassAccent
                                )
                            }

                            if let insight = article.actionableInsight {
                                InsightBox(
                                    icon: "lightbulb.fill",
                                    title: "你可以这样做",
                                    content: insight,
                                    accentColor: .statusSuccess
                                )
                            }

                            if let url = article.sourceUrl, let link = URL(string: url) {
                                Link(destination: link) {
                                    HStack(spacing: 6) {
                                        Image(systemName: "arrow.up.right")
                                        Text("打开原文")
                                    }
                                    .font(.caption)
                                    .foregroundColor(.liquidGlassAccent)
                                }
                            }
                        }
                    }
                }
                .liquidGlassPageWidth()
                .padding(.vertical, metrics.verticalPadding)
            }
        }
        .navigationTitle("文章详情")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("阅读模式")
                .font(.headline)
                .foregroundColor(.textPrimary)
            Text(article.sourceType ?? "来源未知")
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

