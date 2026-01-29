// InsightModels.swift
// 报告/洞察相关模型定义

import Foundation

// MARK: - 理解度评分

struct UnderstandingScoreResponse: Codable {
    let score: UnderstandingScore?
    let history: [UnderstandingScoreHistory]?
}

struct UnderstandingScore: Codable {
    let current: Double?
    let breakdown: UnderstandingScoreBreakdown?
    let isDeepUnderstanding: Bool?
    let lastUpdated: String?

    enum CodingKeys: String, CodingKey {
        case current
        case breakdown
        case isDeepUnderstanding
        case lastUpdated = "lastUpdated"
    }
}

struct UnderstandingScoreBreakdown: Codable {
    let completionPredictionAccuracy: Double?
    let replacementAcceptanceRate: Double?
    let sentimentPredictionAccuracy: Double?
    let preferencePatternMatch: Double?

    enum CodingKeys: String, CodingKey {
        case completionPredictionAccuracy = "completion_prediction_accuracy"
        case replacementAcceptanceRate = "replacement_acceptance_rate"
        case sentimentPredictionAccuracy = "sentiment_prediction_accuracy"
        case preferencePatternMatch = "preference_pattern_match"
    }
}

struct UnderstandingScoreHistory: Codable, Identifiable {
    let date: String
    let score: Double
    let factorsChanged: [String]?

    var id: String { date }

    enum CodingKeys: String, CodingKey {
        case date
        case score
        case factorsChanged = "factors_changed"
    }
}

// MARK: - 主动问询

struct InquiryOption: Codable, Equatable {
    let label: String
    let value: String
}

struct InquiryQuestion: Codable, Equatable {
    let id: String
    let questionText: String
    let questionType: String
    let priority: String
    let dataGapsAddressed: [String]
    let options: [InquiryOption]?
    let feedContent: CuratedContent?

    enum CodingKeys: String, CodingKey {
        case id
        case questionText = "question_text"
        case questionType = "question_type"
        case priority
        case dataGapsAddressed = "data_gaps_addressed"
        case options
        case feedContent
    }
}

struct CuratedContent: Codable, Equatable {
    let id: String
    let contentType: String
    let title: String
    let summary: String?
    let url: String?
    let source: String
    let relevanceScore: Double?
    let relevanceExplanation: String?
    let isPushed: Bool?
    let pushedAt: String?
    let isRead: Bool?
    let readAt: String?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case contentType = "content_type"
        case title
        case summary
        case url
        case source
        case relevanceScore = "relevance_score"
        case relevanceExplanation = "relevance_explanation"
        case isPushed = "is_pushed"
        case pushedAt = "pushed_at"
        case isRead = "is_read"
        case readAt = "read_at"
        case createdAt = "created_at"
    }
}

struct InquiryPendingResponse: Codable {
    let hasInquiry: Bool
    let inquiry: InquiryQuestion?
}

struct InquiryRespondResponse: Codable {
    let success: Bool?
    let message: String?
}
