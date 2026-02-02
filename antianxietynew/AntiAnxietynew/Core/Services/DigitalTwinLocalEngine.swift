// DigitalTwinLocalEngine.swift
// 纯 Swift 数字孪生本地生成器（不依赖 Next API）

import Foundation

struct DigitalTwinLocalInput {
    let userId: String
    let baselineScores: BaselineScores?
    let logs: [WellnessLog]
    let profile: ProfileSnapshot
    let now: Date
}

struct BaselineScores {
    let gad7: Int
    let phq9: Int
    let isi: Int
    let pss10: Int
}

struct ProfileSnapshot {
    let age: Int?
    let gender: String?
    let primaryGoal: String?
    let registrationDate: String
    let fullName: String?
}

enum DigitalTwinLocalEngine {
    static func curveResponse(input: DigitalTwinLocalInput, conversationTrend: String?) -> DigitalTwinCurveResponse {
        guard let baseline = input.baselineScores else {
            return DigitalTwinCurveResponse(
                success: false,
                data: nil,
                error: "缺少基线评估，请先完成基础量表",
                status: "no_baseline",
                hasBaseline: false,
                calibrationCount: input.logs.count
            )
        }

        let output = buildCurveOutput(input: input, baseline: baseline, conversationTrend: conversationTrend)
        return DigitalTwinCurveResponse(
            success: true,
            data: output,
            error: nil,
            status: "ok",
            hasBaseline: true,
            calibrationCount: input.logs.count
        )
    }

    static func dashboardPayload(input: DigitalTwinLocalInput) -> DigitalTwinDashboardPayload {
        guard let baseline = input.baselineScores else {
            return DigitalTwinDashboardPayload(
                status: "no_baseline",
                collectionStatus: buildCollectionStatus(input: input, hasBaseline: false),
                message: "缺少基线评估，请先完成基础量表",
                dashboardData: nil,
                adaptivePlan: nil,
                isStale: false,
                lastAnalyzed: nil
            )
        }

        let output = buildCurveOutput(input: input, baseline: baseline, conversationTrend: nil)
        let dashboard = buildDashboardData(input: input, baseline: baseline, curve: output)
        let adaptivePlan = buildAdaptivePlan(input: input, baseline: baseline)
        let lastAnalyzed = isoString(input.now)

        return DigitalTwinDashboardPayload(
            status: "ok",
            collectionStatus: buildCollectionStatus(input: input, hasBaseline: true),
            message: "已生成本地数字孪生分析",
            dashboardData: dashboard,
            adaptivePlan: adaptivePlan,
            isStale: false,
            lastAnalyzed: lastAnalyzed
        )
    }

    static func analysis(input: DigitalTwinLocalInput) -> DigitalTwinAnalysis? {
        guard let baseline = input.baselineScores else { return nil }

        let curve = buildCurveOutput(input: input, baseline: baseline, conversationTrend: nil)
        let dashboard = buildDashboardData(input: input, baseline: baseline, curve: curve)
        let adaptivePlan = buildAdaptivePlan(input: input, baseline: baseline)
        let assessment = buildPhysiologicalAssessment(baseline: baseline)
        let predictions = buildLongitudinalPredictions(curve: curve)
        let snapshot = buildAggregatedUserData(input: input, baseline: baseline)

        return DigitalTwinAnalysis(
            id: nil,
            userId: input.userId,
            inputSnapshot: snapshot,
            physiologicalAssessment: assessment,
            longitudinalPredictions: predictions,
            adaptivePlan: adaptivePlan,
            papersUsed: [],
            dashboardData: dashboard,
            modelUsed: "local-rule-v1",
            confidenceScore: 0.62,
            analysisVersion: 1,
            createdAt: isoString(input.now),
            expiresAt: isoString(input.now.addingTimeInterval(6 * 3600))
        )
    }
}

private extension DigitalTwinLocalEngine {
    static func buildCurveOutput(input: DigitalTwinLocalInput, baseline: BaselineScores, conversationTrend: String?) -> DigitalTwinCurveOutput {
        let baselineMetrics = normalizedMetrics(baseline: baseline)
        let timepoints = buildTimepoints(baseline: baselineMetrics)
        let currentWeek = currentWeek(from: input.logs, now: input.now)

        let meta = DigitalTwinCurveMeta(
            ruleVersion: "swift-local-1.0",
            asOfDate: isoDate(input.now),
            baselineDate: baselineDate(from: input.logs),
            daysSinceBaseline: daysSinceBaseline(from: input.logs, now: input.now),
            currentWeek: currentWeek,
            dataQualityFlags: DigitalTwinDataQualityFlags(
                baselineMissing: [],
                dailyCalibrationSparse: input.logs.count < 3,
                conversationTrendMissing: conversationTrend == nil,
                pss10Missing: baseline.pss10 <= 0,
                hrvIsInferred: true,
                sleepHoursOutOfRange: nil,
                scaleMismatchFlag: nil
            )
        )

        let curveModel = DigitalTwinCurveModel(
            shape: "linear",
            kRangePerWeek: [0.03, 0.06],
            targetHorizonWeeks: 15,
            trendWindowDays: 14,
            notes: ["本地规则生成", "可接入 AI 细化"]
        )

        let outcomes = DigitalTwinPredictedLongitudinalOutcomes(
            timepoints: timepoints,
            curveModel: curveModel
        )

        let timeline = DigitalTwinTimelineView(
            milestones: buildMilestones(currentWeek: currentWeek, baseline: baseline)
        )

        let baselineView = DigitalTwinParticipantBaselineView(
            scales: buildBaselineScales(baseline: baseline),
            vitals: DigitalTwinVitalsData(
                restingHeartRate: nil,
                bloodPressure: nil,
                bmi: nil
            )
        )

        let metricEndpoints = DigitalTwinMetricEndpointsView(
            charts: buildCharts(timepoints: timepoints),
            summaryStats: buildCurveSummaryStats(timepoints: timepoints)
        )

        return DigitalTwinCurveOutput(
            meta: meta,
            predictedLongitudinalOutcomes: outcomes,
            timeSinceBaselineVisit: timeline,
            participantBaselineData: baselineView,
            metricEndpoints: metricEndpoints,
            schema: nil
        )
    }

    static func normalizedMetrics(baseline: BaselineScores) -> (anxiety: Double, sleep: Double, stress: Double, mood: Double, energy: Double, hrv: Double) {
        let anxiety = scaleTo100(value: Double(baseline.gad7), max: 21)
        let sleep = 100 - scaleTo100(value: Double(baseline.isi), max: 28)
        let stress = 100 - scaleTo100(value: Double(baseline.pss10), max: 40)
        let mood = 100 - scaleTo100(value: Double(baseline.phq9), max: 27)
        let energy = clamp((sleep + stress) / 2.0, min: 30, max: 95)
        let hrv = clamp(55 + (energy - 50) * 0.3, min: 30, max: 90)
        return (anxiety, sleep, stress, mood, energy, hrv)
    }

    static func buildTimepoints(baseline: (anxiety: Double, sleep: Double, stress: Double, mood: Double, energy: Double, hrv: Double)) -> [DigitalTwinCurveTimepoint] {
        let weeks = [0, 3, 6, 9, 12, 15]
        return weeks.enumerated().map { index, week in
            let progress = Double(index) / Double(max(1, weeks.count - 1))
            let improve = 0.25 * progress
            let anxiety = clamp(baseline.anxiety * (1 - improve), min: 10, max: 100)
            let sleep = clamp(baseline.sleep + (100 - baseline.sleep) * improve, min: 10, max: 100)
            let stress = clamp(baseline.stress + (100 - baseline.stress) * improve, min: 10, max: 100)
            let mood = clamp(baseline.mood + (100 - baseline.mood) * improve, min: 10, max: 100)
            let energy = clamp(baseline.energy + (100 - baseline.energy) * improve, min: 10, max: 100)
            let hrv = clamp(baseline.hrv + (80 - baseline.hrv) * improve, min: 10, max: 100)

            return DigitalTwinCurveTimepoint(
                week: week,
                metrics: DigitalTwinTimepointMetrics(
                    anxietyScore: DigitalTwinMetricPrediction(value: anxiety, confidence: confidenceLabel(progress: progress)),
                    sleepQuality: DigitalTwinMetricPrediction(value: sleep, confidence: confidenceLabel(progress: progress)),
                    stressResilience: DigitalTwinMetricPrediction(value: stress, confidence: confidenceLabel(progress: progress)),
                    moodStability: DigitalTwinMetricPrediction(value: mood, confidence: confidenceLabel(progress: progress)),
                    energyLevel: DigitalTwinMetricPrediction(value: energy, confidence: confidenceLabel(progress: progress)),
                    hrvScore: DigitalTwinMetricPrediction(value: hrv, confidence: confidenceLabel(progress: progress))
                )
            )
        }
    }

    static func buildMilestones(currentWeek: Int?, baseline: BaselineScores) -> [DigitalTwinTimelineMilestone] {
        let current = currentWeek ?? 0
        let milestones = [
            (0, "建立基线", "完成初始评估"),
            (3, "情绪稳定", "观察焦虑波动"),
            (6, "节律调整", "睡眠质量提升"),
            (12, "巩固期", "维持稳定节奏"),
            (15, "复盘", "评估长周期变化")
        ]

        return milestones.map { week, event, detail in
            let status: DigitalTwinMilestoneStatus
            if week < current { status = .completed }
            else if week == current { status = .current }
            else { status = .upcoming }

            return DigitalTwinTimelineMilestone(
                week: week,
                event: event,
                status: status,
                detail: detail,
                actualScore: DigitalTwinMilestoneActualScore(
                    gad7: baseline.gad7,
                    phq9: baseline.phq9,
                    isi: baseline.isi,
                    pss10: baseline.pss10
                )
            )
        }
    }

    static func buildBaselineScales(baseline: BaselineScores) -> [DigitalTwinScaleBaselineItem] {
        [
            DigitalTwinScaleBaselineItem(name: "GAD-7", value: Double(baseline.gad7), interpretation: interpretGAD7(baseline.gad7)),
            DigitalTwinScaleBaselineItem(name: "PHQ-9", value: Double(baseline.phq9), interpretation: interpretPHQ9(baseline.phq9)),
            DigitalTwinScaleBaselineItem(name: "ISI", value: Double(baseline.isi), interpretation: interpretISI(baseline.isi)),
            DigitalTwinScaleBaselineItem(name: "PSS-10", value: Double(baseline.pss10), interpretation: interpretPSS10(baseline.pss10))
        ]
    }

    static func buildCharts(timepoints: [DigitalTwinCurveTimepoint]) -> DigitalTwinChartsData {
        func trend(_ key: DigitalTwinMetricKey) -> DigitalTwinChartTrend {
            let points = timepoints.map { tp in
                let metric = key.prediction(in: tp.metrics)
                return DigitalTwinChartDataPoint(
                    week: tp.week,
                    source: .predicted,
                    value: metric.value,
                    confidence: metric.confidence
                )
            }
            return DigitalTwinChartTrend(unit: "score", points: points)
        }

        return DigitalTwinChartsData(
            anxietyTrend: trend(.anxietyScore),
            sleepTrend: trend(.sleepQuality),
            hrvTrend: trend(.hrvScore),
            energyTrend: trend(.energyLevel)
        )
    }

    static func buildCurveSummaryStats(timepoints: [DigitalTwinCurveTimepoint]) -> DigitalTwinCurveSummaryStats {
        let first = timepoints.first?.metrics.anxietyScore.value ?? 0
        let last = timepoints.last?.metrics.anxietyScore.value ?? 0
        let improvement = max(0, first - last)
        return DigitalTwinCurveSummaryStats(
            overallImprovement: DigitalTwinSummaryStatItem(value: improvement, unit: "分", method: "本地规则"),
            daysToFirstResult: DigitalTwinSummaryStatItem(value: 21, unit: "天", method: "平均"),
            consistencyScore: DigitalTwinSummaryStatItem(value: 78, unit: "%", method: "估算")
        )
    }

    static func buildDashboardData(input: DigitalTwinLocalInput, baseline: BaselineScores, curve: DigitalTwinCurveOutput) -> DigitalTwinDashboardData {
        let participant = ParticipantInfo(
            initials: initials(from: input.profile.fullName),
            age: input.profile.age,
            gender: input.profile.gender,
            diagnosis: input.profile.primaryGoal ?? "情绪管理",
            registrationDate: input.profile.registrationDate
        )

        let predictionMetrics = [
            predictionMetric(name: "焦虑评分", baseline: Double(baseline.gad7), curve: curve, key: .anxietyScore),
            predictionMetric(name: "睡眠质量", baseline: 100 - Double(baseline.isi), curve: curve, key: .sleepQuality),
            predictionMetric(name: "压力韧性", baseline: 100 - Double(baseline.pss10), curve: curve, key: .stressResilience),
            predictionMetric(name: "情绪稳定", baseline: 100 - Double(baseline.phq9), curve: curve, key: .moodStability)
        ]

        let baselineAssessments = buildBaselineScales(baseline: baseline).map { item in
            BaselineAssessment(name: item.name, value: item.value.map { String(format: "%.0f", $0) } ?? "--", interpretation: item.interpretation)
        }

        let chartData = ChartData(
            anxietyTrend: curve.predictedLongitudinalOutcomes.timepoints.map { $0.metrics.anxietyScore.value },
            sleepTrend: curve.predictedLongitudinalOutcomes.timepoints.map { $0.metrics.sleepQuality.value },
            hrvTrend: curve.predictedLongitudinalOutcomes.timepoints.map { $0.metrics.hrvScore.value },
            energyTrend: curve.predictedLongitudinalOutcomes.timepoints.map { $0.metrics.energyLevel.value }
        )

        let summary = SummaryStats(
            overallImprovement: "预计改善 \(Int(max(0, baseline.gad7 - 2))) 分",
            daysToFirstResult: 21,
            consistencyScore: "78%"
        )

        return DigitalTwinDashboardData(
            participant: participant,
            predictionTable: PredictionTable(metrics: predictionMetrics),
            timeline: curve.timeSinceBaselineVisit.milestones.map { milestone in
                TreatmentMilestone(
                    week: milestone.week,
                    event: milestone.event,
                    status: milestone.status.rawValue,
                    detail: milestone.detail,
                    actualScore: milestone.actualScore?.gad7.map(Double.init)
                )
            },
            baselineData: BaselineDashboardData(
                assessments: baselineAssessments,
                vitals: [VitalMetric(name: "HRV", value: "--", trend: "稳定")]
            ),
            charts: chartData,
            summaryStats: summary,
            lastAnalyzed: isoString(input.now),
            nextAnalysisScheduled: isoString(input.now.addingTimeInterval(6 * 3600))
        )
    }

    static func buildCollectionStatus(input: DigitalTwinLocalInput, hasBaseline: Bool) -> DataCollectionStatus {
        let count = input.logs.count
        let required = 3
        let progress = min(1.0, Double(count) / Double(required))
        return DataCollectionStatus(
            hasBaseline: hasBaseline,
            calibrationCount: count,
            calibrationDays: count,
            firstCalibrationDate: input.logs.last?.log_date,
            lastCalibrationDate: input.logs.first?.log_date,
            requiredCalibrations: required,
            isReady: hasBaseline && count >= 1,
            progress: progress,
            message: hasBaseline ? "数据已就绪" : "缺少基线评估"
        )
    }

    static func buildAdaptivePlan(input: DigitalTwinLocalInput, baseline: BaselineScores) -> AdaptivePlan {
        let focus = [
            DailyFocus(area: "睡眠", priority: "高", action: "固定睡前1小时离屏", rationale: "减少入睡时间", scientificBasis: nil),
            DailyFocus(area: "压力", priority: "中", action: "午后 10 分钟呼吸练习", rationale: "降低皮质醇", scientificBasis: nil)
        ]

        let breathing = [
            BreathingExercise(name: "4-7-8 呼吸", duration: "5分钟", timing: "睡前", benefit: "放松神经系统")
        ]

        let sleep = [
            SleepRecommendation(recommendation: "保持固定起床时间", reason: "稳定昼夜节律", expectedImpact: "改善睡眠深度")
        ]

        let activity = [
            ActivitySuggestion(activity: "轻量步行", frequency: "每周 4 次", duration: "20-30 分钟", benefit: "提升能量与情绪")
        ]

        return AdaptivePlan(
            dailyFocus: focus,
            breathingExercises: breathing,
            sleepRecommendations: sleep,
            activitySuggestions: activity,
            avoidanceBehaviors: ["过量咖啡因", "连续熬夜"],
            nextCheckpoint: AdaptivePlanCheckpoint(date: isoDate(input.now.addingTimeInterval(7 * 24 * 3600)), focus: "睡眠节律")
        )
    }

    static func buildPhysiologicalAssessment(baseline: BaselineScores) -> PhysiologicalAssessment {
        let anxiety = scaleTo100(value: Double(baseline.gad7), max: 21)
        let sleep = 100 - scaleTo100(value: Double(baseline.isi), max: 28)
        let stress = 100 - scaleTo100(value: Double(baseline.pss10), max: 40)
        let mood = 100 - scaleTo100(value: Double(baseline.phq9), max: 27)
        let energy = clamp((sleep + stress) / 2.0, min: 30, max: 95)

        return PhysiologicalAssessment(
            overallStatus: "需要关注",
            anxietyLevel: MetricScore(score: anxiety, trend: "stable", confidence: 0.6),
            sleepHealth: MetricScore(score: sleep, trend: "stable", confidence: 0.6),
            stressResilience: MetricScore(score: stress, trend: "stable", confidence: 0.6),
            moodStability: MetricScore(score: mood, trend: "stable", confidence: 0.6),
            energyLevel: MetricScore(score: energy, trend: "stable", confidence: 0.6),
            hrvEstimate: MetricScore(score: 60, trend: "stable", confidence: 0.5),
            riskFactors: ["压力波动", "睡眠不稳"],
            strengths: ["有主动管理意识"],
            scientificBasis: []
        )
    }

    static func buildLongitudinalPredictions(curve: DigitalTwinCurveOutput) -> LongitudinalPredictions {
        let timepoints = curve.predictedLongitudinalOutcomes.timepoints.map { tp in
            TimepointPrediction(
                week: tp.week,
                predictions: PredictionMetrics(
                    anxietyScore: PredictionValue(value: tp.metrics.anxietyScore.value, confidence: tp.metrics.anxietyScore.confidence),
                    sleepQuality: PredictionValue(value: tp.metrics.sleepQuality.value, confidence: tp.metrics.sleepQuality.confidence),
                    stressResilience: PredictionValue(value: tp.metrics.stressResilience.value, confidence: tp.metrics.stressResilience.confidence),
                    moodStability: PredictionValue(value: tp.metrics.moodStability.value, confidence: tp.metrics.moodStability.confidence),
                    energyLevel: PredictionValue(value: tp.metrics.energyLevel.value, confidence: tp.metrics.energyLevel.confidence),
                    hrvScore: PredictionValue(value: tp.metrics.hrvScore.value, confidence: tp.metrics.hrvScore.confidence)
                )
            )
        }

        let baseline = curve.predictedLongitudinalOutcomes.timepoints.first?.metrics
        let current = curve.predictedLongitudinalOutcomes.timepoints.last?.metrics

        let comparisons: [BaselineComparison] = [
            buildComparison(metric: "焦虑评分", baseline: baseline?.anxietyScore.value, current: current?.anxietyScore.value, negative: true),
            buildComparison(metric: "睡眠质量", baseline: baseline?.sleepQuality.value, current: current?.sleepQuality.value, negative: false),
            buildComparison(metric: "能量水平", baseline: baseline?.energyLevel.value, current: current?.energyLevel.value, negative: false)
        ]

        return LongitudinalPredictions(timepoints: timepoints, baselineComparison: comparisons)
    }

    static func buildAggregatedUserData(input: DigitalTwinLocalInput, baseline: BaselineScores) -> AggregatedUserData {
        let baselineData = BaselineData(
            gad7Score: baseline.gad7,
            phq9Score: baseline.phq9,
            isiScore: baseline.isi,
            pss10Score: baseline.pss10,
            assessmentDate: isoDate(input.now),
            interpretations: BaselineInterpretations(
                gad7: interpretGAD7(baseline.gad7),
                phq9: interpretPHQ9(baseline.phq9),
                isi: interpretISI(baseline.isi),
                pss10: interpretPSS10(baseline.pss10)
            )
        )

        let calibrations: [CalibrationData] = input.logs.map { log in
            CalibrationData(
                date: log.log_date,
                sleepHours: log.sleepHours,
                sleepQuality: Int(log.sleep_quality ?? "") ?? 0,
                moodScore: log.anxiety_level ?? 0,
                stressLevel: log.stress_level ?? 0,
                energyLevel: log.energy_level ?? 0,
                restingHeartRate: nil,
                hrv: nil,
                stepCount: nil,
                deviceSleepScore: nil,
                activityScore: nil
            )
        }

        let conversationSummary = ConversationSummary(
            totalMessages: 0,
            emotionalTrend: "stable",
            frequentTopics: [],
            lastInteraction: isoDate(input.now)
        )

        let profile = UserProfileSnapshot(
            age: input.profile.age,
            gender: input.profile.gender,
            primaryConcern: input.profile.primaryGoal,
            registrationDate: input.profile.registrationDate,
            medicalHistoryConsent: nil
        )

        return AggregatedUserData(
            userId: input.userId,
            baseline: baselineData,
            calibrations: calibrations,
            inquiryInsights: [],
            conversationSummary: conversationSummary,
            profile: profile
        )
    }

    static func predictionMetric(name: String, baseline: Double, curve: DigitalTwinCurveOutput, key: DigitalTwinMetricKey) -> PredictionTableMetric {
        let predictions = curve.predictedLongitudinalOutcomes.timepoints.reduce(into: [String: String]()) { dict, tp in
            let value = key.prediction(in: tp.metrics).value
            dict["W\(tp.week)"] = String(format: "%.0f", value)
        }
        return PredictionTableMetric(name: name, baseline: baseline, predictions: predictions)
    }

    static func buildComparison(metric: String, baseline: Double?, current: Double?, negative: Bool) -> BaselineComparison {
        let base = baseline ?? 0
        let curr = current ?? base
        let change = curr - base
        let changePercent = base == 0 ? 0 : (change / base) * 100
        return BaselineComparison(metric: metric, baseline: base, current: curr, change: change, changePercent: changePercent)
    }

    static func scaleTo100(value: Double, max: Double) -> Double {
        guard max > 0 else { return 0 }
        return clamp((value / max) * 100, min: 0, max: 100)
    }

    static func clamp(_ value: Double, min: Double, max: Double) -> Double {
        if value < min { return min }
        if value > max { return max }
        return value
    }

    static func confidenceLabel(progress: Double) -> String {
        if progress < 0.3 { return "±10" }
        if progress < 0.6 { return "±8" }
        return "±6"
    }

    static func interpretGAD7(_ score: Int) -> String {
        switch score {
        case 0...4: return "轻度"
        case 5...9: return "轻中度"
        case 10...14: return "中度"
        default: return "重度"
        }
    }

    static func interpretPHQ9(_ score: Int) -> String {
        switch score {
        case 0...4: return "轻度"
        case 5...9: return "轻中度"
        case 10...14: return "中度"
        case 15...19: return "中重度"
        default: return "重度"
        }
    }

    static func interpretISI(_ score: Int) -> String {
        switch score {
        case 0...7: return "正常"
        case 8...14: return "轻度失眠"
        case 15...21: return "中度失眠"
        default: return "重度失眠"
        }
    }

    static func interpretPSS10(_ score: Int) -> String {
        switch score {
        case 0...13: return "压力低"
        case 14...26: return "压力中等"
        default: return "压力偏高"
        }
    }

    static func isoDate(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.string(from: date)
    }

    static func isoString(_ date: Date) -> String {
        ISO8601DateFormatter().string(from: date)
    }

    static func baselineDate(from logs: [WellnessLog]) -> String? {
        logs.last?.log_date
    }

    static func daysSinceBaseline(from logs: [WellnessLog], now: Date) -> Int? {
        guard let dateString = baselineDate(from: logs) else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let baselineDate = formatter.date(from: dateString) else { return nil }
        return Calendar.current.dateComponents([.day], from: baselineDate, to: now).day
    }

    static func currentWeek(from logs: [WellnessLog], now: Date) -> Int? {
        guard let days = daysSinceBaseline(from: logs, now: now) else { return nil }
        return max(0, days / 7)
    }

    static func initials(from name: String?) -> String {
        guard let name = name, !name.isEmpty else { return "U" }
        return String(name.prefix(1))
    }
}

