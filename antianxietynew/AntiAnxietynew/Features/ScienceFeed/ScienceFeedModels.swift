// ScienceFeedModels.swift
// 科学期刊辅助数据模型
// 注意: ScienceArticle, ScienceFeedResponse, FeedPersonalization, FeedFeedbackInput
// 定义在 SupabaseManager.swift 中，此文件只包含 UI 辅助模型

import Foundation

/// 平台来源信息（UI 展示用）
struct PlatformInfo {
    let name: String
    let nameZh: String
    let icon: String
    let color: String  // Hex color
    
    static func forType(_ type: String?) -> PlatformInfo {
        switch type?.lowercased() {
        case "pubmed":
            return PlatformInfo(name: "PubMed", nameZh: "PubMed", icon: "📚", color: "#326599")
        case "semantic_scholar":
            return PlatformInfo(name: "Semantic Scholar", nameZh: "Semantic Scholar", icon: "🔬", color: "#1857B6")
        case "nature":
            return PlatformInfo(name: "Nature", nameZh: "Nature", icon: "🧬", color: "#C41E3A")
        case "science":
            return PlatformInfo(name: "Science", nameZh: "Science", icon: "⚗️", color: "#1A5276")
        case "lancet":
            return PlatformInfo(name: "The Lancet", nameZh: "The Lancet", icon: "🏥", color: "#00457C")
        case "cell":
            return PlatformInfo(name: "Cell", nameZh: "Cell", icon: "🔬", color: "#00A651")
        case "x":
            return PlatformInfo(name: "X", nameZh: "X", icon: "𝕏", color: "#111827")
        case "reddit":
            return PlatformInfo(name: "Reddit", nameZh: "Reddit", icon: "R", color: "#FF4500")
        default:
            return PlatformInfo(name: "Research", nameZh: "研究", icon: "📄", color: "#6B7280")
        }
    }
}

extension ScienceArticle {
    func applyingOverrides(
        whyRecommended: String?,
        actionableInsight: String?,
        matchPercentage: Int?
    ) -> ScienceArticle {
        ScienceArticle(
            id: id,
            title: title,
            titleZh: titleZh,
            summary: summary,
            summaryZh: summaryZh,
            sourceType: sourceType,
            sourceUrl: sourceUrl,
            matchPercentage: matchPercentage ?? self.matchPercentage,
            whyRecommended: whyRecommended ?? self.whyRecommended,
            actionableInsight: actionableInsight ?? self.actionableInsight,
            tags: tags,
            createdAt: createdAt
        )
    }
}
