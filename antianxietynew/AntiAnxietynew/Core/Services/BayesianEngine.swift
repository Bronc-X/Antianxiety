import Foundation

struct BayesianHRVData {
    let rmssd: Double?
    let lf_hf_ratio: Double?
}

struct BayesianPaper {
    let id: String
    let title: String
    let relevanceScore: Double
    let url: String?
}

enum BayesianEngine {
    static func calculateLikelihood(hrvData: BayesianHRVData) -> Double {
        if let rmssd = hrvData.rmssd, rmssd > 0 {
            // 20ms - 100ms normalize to 0-1
            let normalized = clamp((rmssd - 20) / 80, min: 0, max: 1)
            return round1(40 + normalized * 50) // 40 - 90
        }
        if let ratio = hrvData.lf_hf_ratio, ratio > 0 {
            // Lower LF/HF indicates better balance
            let normalized = clamp(1 - ((ratio - 0.5) / 2.5), min: 0, max: 1)
            return round1(35 + normalized * 45)
        }
        return 50
    }

    static func calculateEvidenceWeight(papers: [BayesianPaper]) -> Double {
        guard !papers.isEmpty else { return 40 }
        let topPapers = papers.sorted { $0.relevanceScore > $1.relevanceScore }.prefix(5)
        let avg = topPapers.reduce(0.0) { $0 + clamp($1.relevanceScore, min: 0, max: 1) } / Double(topPapers.count)
        return round1(40 + avg * 50)
    }

    static func calculateBayesianPosterior(prior: Double, likelihood: Double, evidence: Double) -> Double {
        let priorProb = clamp(prior / 100, min: 0, max: 1)
        let likelihoodProb = clamp(likelihood / 100, min: 0, max: 1)
        let evidenceProb = clamp(evidence / 100, min: 0, max: 1)
        let weighted = (priorProb * 0.5) + (likelihoodProb * 0.3) + (evidenceProb * 0.2)
        return round1(weighted * 100)
    }

    private static func clamp(_ value: Double, min: Double, max: Double) -> Double {
        if value < min { return min }
        if value > max { return max }
        return value
    }

    private static func round1(_ value: Double) -> Double {
        return (value * 10).rounded() / 10
    }
}
