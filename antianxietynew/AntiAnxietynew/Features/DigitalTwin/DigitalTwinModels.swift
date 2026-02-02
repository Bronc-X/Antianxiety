// DigitalTwinModels.swift
// 数字孪生曲线 API 数据模型（对应 /api/digital-twin/curve）

import Foundation

// MARK: - API Response

struct DigitalTwinCurveResponse: Codable {
    let success: Bool?
    let data: DigitalTwinCurveOutput?
    let error: String?
    let status: String?
    let hasBaseline: Bool?
    let calibrationCount: Int?
}

// MARK: - Curve Output

struct DigitalTwinCurveOutput: Codable {
    let meta: DigitalTwinCurveMeta
    let predictedLongitudinalOutcomes: DigitalTwinPredictedLongitudinalOutcomes
    let timeSinceBaselineVisit: DigitalTwinTimelineView
    let participantBaselineData: DigitalTwinParticipantBaselineView
    let metricEndpoints: DigitalTwinMetricEndpointsView
    let schema: [String: DigitalTwinSchemaField]?

    enum CodingKeys: String, CodingKey {
        case meta
        case predictedLongitudinalOutcomes = "A_predictedLongitudinalOutcomes"
        case timeSinceBaselineVisit = "B_timeSinceBaselineVisit"
        case participantBaselineData = "C_participantBaselineData"
        case metricEndpoints = "D_metricEndpoints"
        case schema
    }
}

struct DigitalTwinCurveMeta: Codable {
    let ruleVersion: String
    let asOfDate: String
    let baselineDate: String?
    let daysSinceBaseline: Int?
    let currentWeek: Int?
    let dataQualityFlags: DigitalTwinDataQualityFlags
}

struct DigitalTwinDataQualityFlags: Codable {
    let baselineMissing: [String]
    let dailyCalibrationSparse: Bool
    let conversationTrendMissing: Bool
    let pss10Missing: Bool
    let hrvIsInferred: Bool
    let sleepHoursOutOfRange: Bool?
    let scaleMismatchFlag: Bool?

    init(
        baselineMissing: [String],
        dailyCalibrationSparse: Bool,
        conversationTrendMissing: Bool,
        pss10Missing: Bool,
        hrvIsInferred: Bool,
        sleepHoursOutOfRange: Bool?,
        scaleMismatchFlag: Bool?
    ) {
        self.baselineMissing = baselineMissing
        self.dailyCalibrationSparse = dailyCalibrationSparse
        self.conversationTrendMissing = conversationTrendMissing
        self.pss10Missing = pss10Missing
        self.hrvIsInferred = hrvIsInferred
        self.sleepHoursOutOfRange = sleepHoursOutOfRange
        self.scaleMismatchFlag = scaleMismatchFlag
    }

    enum CodingKeys: String, CodingKey {
        case baselineMissing
        case dailyCalibrationSparse
        case conversationTrendMissing
        case pss10Missing
        case hrvIsInferred
        case sleepHoursOutOfRange
        case scaleMismatchFlag
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        baselineMissing = (try? container.decode([String].self, forKey: .baselineMissing)) ?? []
        dailyCalibrationSparse = (try? container.decode(Bool.self, forKey: .dailyCalibrationSparse)) ?? false
        conversationTrendMissing = (try? container.decode(Bool.self, forKey: .conversationTrendMissing)) ?? false
        pss10Missing = (try? container.decode(Bool.self, forKey: .pss10Missing)) ?? false
        hrvIsInferred = (try? container.decode(Bool.self, forKey: .hrvIsInferred)) ?? false
        sleepHoursOutOfRange = try? container.decode(Bool.self, forKey: .sleepHoursOutOfRange)
        scaleMismatchFlag = try? container.decode(Bool.self, forKey: .scaleMismatchFlag)
    }
}

// MARK: - View A: Predicted Outcomes

struct DigitalTwinPredictedLongitudinalOutcomes: Codable {
    let timepoints: [DigitalTwinCurveTimepoint]
    let curveModel: DigitalTwinCurveModel
}

struct DigitalTwinCurveModel: Codable {
    let shape: String
    let kRangePerWeek: [Double]
    let targetHorizonWeeks: Int
    let trendWindowDays: Int
    let notes: [String]
}

struct DigitalTwinCurveTimepoint: Codable, Identifiable {
    let week: Int
    let metrics: DigitalTwinTimepointMetrics

    var id: Int { week }
}

struct DigitalTwinTimepointMetrics: Codable {
    let anxietyScore: DigitalTwinMetricPrediction
    let sleepQuality: DigitalTwinMetricPrediction
    let stressResilience: DigitalTwinMetricPrediction
    let moodStability: DigitalTwinMetricPrediction
    let energyLevel: DigitalTwinMetricPrediction
    let hrvScore: DigitalTwinMetricPrediction
}

struct DigitalTwinMetricPrediction: Codable {
    let value: Double
    let confidence: String
}

// MARK: - View B: Timeline

enum DigitalTwinMilestoneStatus: String, Codable {
    case completed
    case current
    case upcoming
}

struct DigitalTwinTimelineView: Codable {
    let milestones: [DigitalTwinTimelineMilestone]
}

struct DigitalTwinTimelineMilestone: Codable, Identifiable {
    let week: Int
    let event: String
    let status: DigitalTwinMilestoneStatus
    let detail: String
    let actualScore: DigitalTwinMilestoneActualScore?

    var id: String { "\(week)-\(event)" }
}

struct DigitalTwinMilestoneActualScore: Codable {
    let gad7: Int?
    let phq9: Int?
    let isi: Int?
    let pss10: Int?

    enum CodingKeys: String, CodingKey {
        case gad7 = "GAD-7"
        case phq9 = "PHQ-9"
        case isi = "ISI"
        case pss10 = "PSS-10"
    }
}

// MARK: - View C: Baseline Data

struct DigitalTwinParticipantBaselineView: Codable {
    let scales: [DigitalTwinScaleBaselineItem]
    let vitals: DigitalTwinVitalsData
}

struct DigitalTwinScaleBaselineItem: Codable, Identifiable {
    let name: String
    let value: Double?
    let interpretation: String

    var id: String { name }
}

struct DigitalTwinVitalsData: Codable {
    let restingHeartRate: Double?
    let bloodPressure: String?
    let bmi: Double?
}

// MARK: - View D: Metric Endpoints

struct DigitalTwinMetricEndpointsView: Codable {
    let charts: DigitalTwinChartsData
    let summaryStats: DigitalTwinCurveSummaryStats
}

struct DigitalTwinChartsData: Codable {
    let anxietyTrend: DigitalTwinChartTrend
    let sleepTrend: DigitalTwinChartTrend
    let hrvTrend: DigitalTwinChartTrend
    let energyTrend: DigitalTwinChartTrend
}

struct DigitalTwinChartTrend: Codable {
    let unit: String
    let points: [DigitalTwinChartDataPoint]
}

enum DigitalTwinChartPointSource: String, Codable {
    case baselineScale
    case dailyCalibration
    case predicted
    case baselineScaleDaily = "baselineScale+daily"
    case inferred
}

struct DigitalTwinChartDataPoint: Codable, Identifiable {
    let week: Int
    let source: DigitalTwinChartPointSource
    let value: Double
    let confidence: String?

    var id: String { "\(week)-\(source.rawValue)" }
}

struct DigitalTwinCurveSummaryStats: Codable {
    let overallImprovement: DigitalTwinSummaryStatItem
    let daysToFirstResult: DigitalTwinSummaryStatItem
    let consistencyScore: DigitalTwinSummaryStatItem
}

struct DigitalTwinSummaryStatItem: Codable {
    let value: Double?
    let unit: String
    let method: String
}

// MARK: - Schema

enum DigitalTwinSchemaFieldType: String, Codable {
    case integer
    case number
    case string
}

struct DigitalTwinSchemaField: Codable {
    let type: DigitalTwinSchemaFieldType
    let range: [Double]?
    let allowed: [Double]?
    let format: String?
    let unit: String
}

// MARK: - Metric Helpers

enum DigitalTwinMetricKey: String, CaseIterable, Identifiable {
    case anxietyScore
    case sleepQuality
    case stressResilience
    case moodStability
    case energyLevel
    case hrvScore

    var id: String { rawValue }

    var label: String {
        switch self {
        case .anxietyScore: return "焦虑评分"
        case .sleepQuality: return "睡眠质量"
        case .stressResilience: return "抗压韧性"
        case .moodStability: return "情绪稳定"
        case .energyLevel: return "能量水平"
        case .hrvScore: return "HRV 代理"
        }
    }

    var systemImage: String {
        switch self {
        case .anxietyScore: return "chart.line.downtrend.xyaxis"
        case .sleepQuality: return "moon.zzz.fill"
        case .stressResilience: return "bolt.fill"
        case .moodStability: return "face.smiling"
        case .energyLevel: return "bolt.circle.fill"
        case .hrvScore: return "heart.fill"
        }
    }

    var isNegative: Bool {
        self == .anxietyScore
    }

    func prediction(in metrics: DigitalTwinTimepointMetrics) -> DigitalTwinMetricPrediction {
        switch self {
        case .anxietyScore: return metrics.anxietyScore
        case .sleepQuality: return metrics.sleepQuality
        case .stressResilience: return metrics.stressResilience
        case .moodStability: return metrics.moodStability
        case .energyLevel: return metrics.energyLevel
        case .hrvScore: return metrics.hrvScore
        }
    }
}

extension DigitalTwinCurveOutput {
    func dataQualityStatus() -> (isGood: Bool, warnings: [String]) {
        let flags = meta.dataQualityFlags
        var warnings: [String] = []

        if !flags.baselineMissing.isEmpty {
            warnings.append("缺少基线量表: \(flags.baselineMissing.joined(separator: ", "))")
        }
        if flags.dailyCalibrationSparse {
            warnings.append("连续记录三日每日校准, 准确率增加15%")
        }
        if flags.conversationTrendMissing {
            warnings.append("对话趋势分析不可用")
        }

        return (warnings.count <= 1, warnings)
    }
}

// MARK: - Digital Twin Dashboard / Analysis Models (对应 Web 端 types/digital-twin.ts)

struct DataCollectionStatus: Codable, Equatable {
    let hasBaseline: Bool
    let calibrationCount: Int
    let calibrationDays: Int?
    let firstCalibrationDate: String?
    let lastCalibrationDate: String?
    let requiredCalibrations: Int
    let isReady: Bool
    let progress: Double
    let message: String
}

struct DigitalTwinDashboardPayload: Codable, Equatable {
    let status: String?
    let collectionStatus: DataCollectionStatus?
    let message: String?
    let dashboardData: DigitalTwinDashboardData?
    let adaptivePlan: AdaptivePlan?
    let isStale: Bool?
    let lastAnalyzed: String?
}

struct DigitalTwinDashboardResponse: Codable, Equatable {
    let dashboardData: DigitalTwinDashboardData
    let adaptivePlan: AdaptivePlan
    let isStale: Bool
    let lastAnalyzed: String
}

// MARK: - Aggregated User Data (input_snapshot)

struct BaselineData: Codable, Equatable {
    let gad7Score: Int
    let phq9Score: Int
    let isiScore: Int
    let pss10Score: Int
    let assessmentDate: String
    let interpretations: BaselineInterpretations
}

struct BaselineInterpretations: Codable, Equatable {
    let gad7: String
    let phq9: String
    let isi: String
    let pss10: String
}

struct CalibrationData: Codable, Equatable {
    let date: String
    let sleepHours: Double
    let sleepQuality: Int
    let moodScore: Int
    let stressLevel: Int
    let energyLevel: Int
    let restingHeartRate: Double?
    let hrv: Double?
    let stepCount: Double?
    let deviceSleepScore: Double?
    let activityScore: Double?
}

struct InquiryInsight: Codable, Equatable {
    let date: String
    let topic: String
    let userResponse: String
    let extractedIndicators: [String: CodableValue]
}

struct ConversationSummary: Codable, Equatable {
    let totalMessages: Int
    let emotionalTrend: String
    let frequentTopics: [String]
    let lastInteraction: String
}

struct UserProfileSnapshot: Codable, Equatable {
    let age: Int?
    let gender: String?
    let primaryConcern: String?
    let registrationDate: String
    let medicalHistoryConsent: Bool?
}

struct AggregatedUserData: Codable, Equatable {
    let userId: String
    let baseline: BaselineData?
    let calibrations: [CalibrationData]
    let inquiryInsights: [InquiryInsight]
    let conversationSummary: ConversationSummary
    let profile: UserProfileSnapshot
}

// MARK: - Physiological Assessment

struct MetricScore: Codable, Equatable {
    let score: Double
    let trend: String
    let confidence: Double
}

struct ScientificBasis: Codable, Equatable {
    let claim: String
    let paperTitle: String
    let paperUrl: String
    let citationCount: Int
}

struct PhysiologicalAssessment: Codable, Equatable {
    let overallStatus: String
    let anxietyLevel: MetricScore
    let sleepHealth: MetricScore
    let stressResilience: MetricScore
    let moodStability: MetricScore
    let energyLevel: MetricScore
    let hrvEstimate: MetricScore
    let riskFactors: [String]
    let strengths: [String]
    let scientificBasis: [ScientificBasis]
}

// MARK: - Predictions

struct PredictionValue: Codable, Equatable {
    let value: Double
    let confidence: String
}

struct TimepointPrediction: Codable, Equatable, Identifiable {
    let week: Int
    let predictions: PredictionMetrics

    var id: Int { week }
}

struct PredictionMetrics: Codable, Equatable {
    let anxietyScore: PredictionValue
    let sleepQuality: PredictionValue
    let stressResilience: PredictionValue
    let moodStability: PredictionValue
    let energyLevel: PredictionValue
    let hrvScore: PredictionValue
}

struct BaselineComparison: Codable, Equatable {
    let metric: String
    let baseline: Double
    let current: Double
    let change: Double
    let changePercent: Double
}

struct LongitudinalPredictions: Codable, Equatable {
    let timepoints: [TimepointPrediction]
    let baselineComparison: [BaselineComparison]
}

struct TreatmentMilestone: Codable, Equatable, Identifiable {
    let week: Int
    let event: String
    let status: String
    let detail: String
    let actualScore: Double?

    var id: String { "\(week)-\(event)" }
}

// MARK: - Adaptive Plan

struct DailyFocus: Codable, Equatable, Identifiable {
    let area: String
    let priority: String
    let action: String
    let rationale: String
    let scientificBasis: String?

    var id: String { "\(area)-\(action)" }
}

struct BreathingExercise: Codable, Equatable, Identifiable {
    let name: String
    let duration: String
    let timing: String
    let benefit: String

    var id: String { "\(name)-\(timing)" }
}

struct SleepRecommendation: Codable, Equatable, Identifiable {
    let recommendation: String
    let reason: String
    let expectedImpact: String

    var id: String { recommendation }
}

struct ActivitySuggestion: Codable, Equatable, Identifiable {
    let activity: String
    let frequency: String
    let duration: String
    let benefit: String

    var id: String { "\(activity)-\(frequency)" }
}

struct AdaptivePlan: Codable, Equatable {
    let dailyFocus: [DailyFocus]
    let breathingExercises: [BreathingExercise]
    let sleepRecommendations: [SleepRecommendation]
    let activitySuggestions: [ActivitySuggestion]
    let avoidanceBehaviors: [String]
    let nextCheckpoint: AdaptivePlanCheckpoint
}

struct AdaptivePlanCheckpoint: Codable, Equatable {
    let date: String
    let focus: String
}

// MARK: - Dashboard Data

struct ParticipantInfo: Codable, Equatable {
    let initials: String
    let age: Int?
    let gender: String?
    let diagnosis: String
    let registrationDate: String
}

struct PredictionTableMetric: Codable, Equatable, Identifiable {
    let name: String
    let baseline: Double
    let predictions: [String: String]

    var id: String { name }
}

struct BaselineAssessment: Codable, Equatable, Identifiable {
    let name: String
    let value: String
    let interpretation: String

    var id: String { name }
}

struct VitalMetric: Codable, Equatable, Identifiable {
    let name: String
    let value: String
    let trend: String

    var id: String { name }
}

struct ChartData: Codable, Equatable {
    let anxietyTrend: [Double]
    let sleepTrend: [Double]
    let hrvTrend: [Double]
    let energyTrend: [Double]
}

struct SummaryStats: Codable, Equatable {
    let overallImprovement: String
    let daysToFirstResult: Int
    let consistencyScore: String
}

struct DigitalTwinDashboardData: Codable, Equatable {
    let participant: ParticipantInfo
    let predictionTable: PredictionTable
    let timeline: [TreatmentMilestone]
    let baselineData: BaselineDashboardData
    let charts: ChartData
    let summaryStats: SummaryStats
    let lastAnalyzed: String
    let nextAnalysisScheduled: String
}

struct PredictionTable: Codable, Equatable {
    let metrics: [PredictionTableMetric]
}

struct BaselineDashboardData: Codable, Equatable {
    let assessments: [BaselineAssessment]
    let vitals: [VitalMetric]
}

// MARK: - Digital Twin Analysis (digital_twin_analyses)

struct Paper: Codable, Equatable {
    let paperId: String
    let title: String
    let abstract: String
    let citationCount: Int
    let url: String
}

struct DigitalTwinAnalysis: Codable, Equatable {
    let id: String?
    let userId: String?
    let inputSnapshot: AggregatedUserData?
    let physiologicalAssessment: PhysiologicalAssessment?
    let longitudinalPredictions: LongitudinalPredictions?
    let adaptivePlan: AdaptivePlan?
    let papersUsed: [Paper]?
    let dashboardData: DigitalTwinDashboardData?
    let modelUsed: String?
    let confidenceScore: Double?
    let analysisVersion: Int?
    let createdAt: String?
    let expiresAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case inputSnapshot = "input_snapshot"
        case physiologicalAssessment = "physiological_assessment"
        case longitudinalPredictions = "longitudinal_predictions"
        case adaptivePlan = "adaptive_plan"
        case papersUsed = "papers_used"
        case dashboardData = "dashboard_data"
        case modelUsed = "model_used"
        case confidenceScore = "confidence_score"
        case analysisVersion = "analysis_version"
        case createdAt = "created_at"
        case expiresAt = "expires_at"
    }
}
