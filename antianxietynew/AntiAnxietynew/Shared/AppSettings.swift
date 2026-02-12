// AppSettings.swift
// 全局设置与简易语言管理

import Foundation
import SwiftUI

enum AppLanguage: String, CaseIterable, Identifiable {
    // Legacy key kept for backward compatibility with old persisted values.
    case zh
    case zhHans = "zh-Hans"
    case zhHant = "zh-Hant"
    case en

    static var allCases: [AppLanguage] { [.zhHans, .zhHant, .en] }
    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .zh, .zhHans: return "简体中文"
        case .zhHant: return "繁體中文"
        case .en: return "English"
        }
    }

    var apiCode: String {
        self == .en ? "en" : "zh"
    }

    var localeIdentifier: String {
        switch self {
        case .en:
            return "en"
        case .zhHant:
            return "zh-Hant"
        case .zh, .zhHans:
            return "zh-Hans"
        }
    }

    static func fromStored(_ stored: String?) -> AppLanguage {
        guard let stored else { return .zhHans }
        if stored == AppLanguage.en.rawValue { return .en }
        if stored == AppLanguage.zhHant.rawValue || stored.lowercased() == "zh-tw" { return .zhHant }
        if stored == AppLanguage.zhHans.rawValue || stored == AppLanguage.zh.rawValue { return .zhHans }
        return .zhHans
    }

    static func fromSystemPreferred(_ preferredLanguages: [String] = Locale.preferredLanguages) -> AppLanguage {
        for rawIdentifier in preferredLanguages {
            let identifier = rawIdentifier.lowercased()
            if identifier.hasPrefix("en") {
                return .en
            }
            if identifier.hasPrefix("zh-hant")
                || identifier.hasPrefix("zh-tw")
                || identifier.hasPrefix("zh-hk")
                || identifier.hasPrefix("zh-mo") {
                return .zhHant
            }
            if identifier.hasPrefix("zh") {
                return .zhHans
            }
        }
        return .zhHans
    }
}

final class AppSettings: ObservableObject {
    private let appLanguageKey = "app_language"
    private let lastSystemLanguageKey = "app_last_system_language"
    private var localeDidChangeObserver: NSObjectProtocol?

    @Published var language: AppLanguage {
        didSet {
            UserDefaults.standard.set(language.rawValue, forKey: appLanguageKey)
        }
    }

    init() {
        let defaults = UserDefaults.standard
        let storedLanguage = AppLanguage.fromStored(defaults.string(forKey: appLanguageKey))
        let previousSystemLanguage = AppLanguage.fromStored(defaults.string(forKey: lastSystemLanguageKey))
        let currentSystemLanguage = AppLanguage.fromSystemPreferred()

        if defaults.string(forKey: appLanguageKey) == nil || previousSystemLanguage != currentSystemLanguage {
            language = currentSystemLanguage
        } else {
            language = storedLanguage
        }

        defaults.set(currentSystemLanguage.rawValue, forKey: lastSystemLanguageKey)

        localeDidChangeObserver = NotificationCenter.default.addObserver(
            forName: NSLocale.currentLocaleDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.syncLanguageWithSystem()
        }
    }

    deinit {
        if let localeDidChangeObserver {
            NotificationCenter.default.removeObserver(localeDidChangeObserver)
        }
    }

    private func syncLanguageWithSystem() {
        let defaults = UserDefaults.standard
        let currentSystemLanguage = AppLanguage.fromSystemPreferred()
        defaults.set(currentSystemLanguage.rawValue, forKey: lastSystemLanguageKey)
        if language != currentSystemLanguage {
            language = currentSystemLanguage
        }
    }
}

struct L10n {
    static func text(_ zh: String, _ en: String, language: AppLanguage) -> String {
        switch language {
        case .en:
            return en
        case .zhHant:
            return toTraditional(zh)
        case .zh, .zhHans:
            return zh
        }
    }

    static func currentLanguage() -> AppLanguage {
        let defaults = UserDefaults.standard
        if let stored = defaults.string(forKey: "app_language") {
            return AppLanguage.fromStored(stored)
        }
        return AppLanguage.fromSystemPreferred()
    }

    static func localized(_ key: String, language: AppLanguage? = nil) -> String {
        let resolvedLanguage = language ?? currentLanguage()

        let resolvedFromBundle = bundle(for: resolvedLanguage).localizedString(forKey: key, value: key, table: nil)
        if resolvedFromBundle != key {
            return resolvedFromBundle
        }

        switch resolvedLanguage {
        case .zhHant:
            let zhHans = bundle(for: .zhHans).localizedString(forKey: key, value: key, table: nil)
            return toTraditional(zhHans)
        case .zh, .zhHans:
            return bundle(for: .zhHans).localizedString(forKey: key, value: key, table: nil)
        case .en:
            return bundle(for: .en).localizedString(forKey: key, value: key, table: nil)
        }
    }

    static func runtime(_ text: String, language: AppLanguage? = nil) -> String {
        let resolvedLanguage = language ?? currentLanguage()
        let localizedText = localized(text, language: resolvedLanguage)
        if localizedText != text {
            return localizedText
        }

        switch resolvedLanguage {
        case .zhHant:
            return toTraditional(text)
        case .en:
            return convertCommonChineseToEnglish(text)
        case .zh, .zhHans:
            return text
        }
    }

    static func toTraditional(_ text: String) -> String {
        let mutable = NSMutableString(string: text) as CFMutableString
        CFStringTransform(mutable, nil, "Hans-Hant" as CFString, false)
        return mutable as String
    }

    private static func bundle(for language: AppLanguage) -> Bundle {
        let resource: String
        switch language {
        case .en:
            resource = "en"
        case .zhHant:
            resource = "zh-Hant"
        case .zh, .zhHans:
            resource = "zh-Hans"
        }

        guard let path = Bundle.main.path(forResource: resource, ofType: "lproj"),
              let bundle = Bundle(path: path) else {
            return .main
        }
        return bundle
    }

    private static func convertCommonChineseToEnglish(_ text: String) -> String {
        let normalized = text.trimmingCharacters(in: .whitespacesAndNewlines)

        let exactMap: [String: String] = [
            "稳定": "Stable",
            "上升": "Rising",
            "下降": "Falling",
            "改善": "Improved",
            "需关注": "Needs attention",
            "需要关注": "Needs attention",
            "规则版本": "Rule version",
            "置信区间": "Confidence interval",
            "整体改善": "Overall improvement",
            "首次见效": "Time to first effect",
            "坚持度": "Consistency",
            "焦虑评分": "Anxiety score",
            "睡眠质量": "Sleep quality",
            "抗压韧性": "Stress resilience",
            "情绪稳定": "Mood stability",
            "能量水平": "Energy level",
            "HRV 代理": "HRV proxy",
            "今日重点": "Today's focus",
            "睡眠建议": "Sleep recommendation",
            "呼吸练习": "Breathing exercise",
            "数据来源": "Data source",
            "整体改善趋势": "Overall improvement trend",
            "说明恢复方向正在建立。": "This indicates recovery momentum is being established.",
            "规律性是当前最关键的增长点。": "Consistency is the most important growth lever right now.",
            "建议重点关注情绪与睡眠节律。": "Focus on emotional state and sleep rhythm.",
            "已生成本地数字孪生分析": "Local digital twin analysis generated",
            "数据已就绪": "Data is ready",
            "缺少基线评估": "Baseline assessment missing",
            "对话趋势分析不可用": "Conversation trend analysis unavailable",
            "建立基线": "Establish baseline",
            "完成初始评估": "Complete initial assessment",
            "观察焦虑波动": "Observe anxiety fluctuations",
            "节律调整": "Rhythm adjustment",
            "睡眠质量提升": "Improved sleep quality",
            "巩固期": "Consolidation phase",
            "维持稳定节奏": "Maintain a stable rhythm",
            "复盘": "Review",
            "评估长周期变化": "Evaluate long-term changes"
        ]

        if let mapped = exactMap[normalized] {
            return mapped
        }

        var converted = normalized

        let phraseReplacements: [(String, String)] = [
            ("趋势：稳定", "Trend: Stable"),
            ("趋势：上升", "Trend: Rising"),
            ("趋势：下降", "Trend: Falling"),
            ("缺少基线量表:", "Missing baseline scales:"),
            ("连续记录三日每日校准, 准确率增加15%", "Log daily calibration for 3 consecutive days to improve accuracy by 15%"),
            ("整体状态稳健，恢复节奏良好，可继续保持当前节律。", "Overall condition is stable and recovery rhythm is good. Keep the current routine."),
            ("整体状态稳定，但仍有提升空间，建议把注意力放在一两个关键指标上。", "Overall condition is stable, with room to improve. Focus on one or two key indicators."),
            ("整体状态偏弱，建议优先修复睡眠与压力管理。", "Overall condition is below target. Prioritize sleep and stress regulation."),
            ("近期睡眠时长偏短，可能影响情绪稳定与能量恢复。", "Recent sleep duration is short, which may affect mood stability and energy recovery."),
            ("睡眠时长较理想，是稳定情绪的关键支撑。", "Sleep duration is ideal and is key support for emotional stability."),
            ("压力感受偏高，短时放松练习会更有效。", "Stress perception is high; short relaxation exercises can help."),
            ("压力水平处于可控区间，保持即可。", "Stress is within a manageable range. Keep it up."),
            ("固定入睡时间，睡前 60 分钟减少屏幕刺激。", "Keep a fixed bedtime and reduce screen stimulation 60 minutes before sleep."),
            ("午后安排 5-8 分钟慢呼吸或短时冥想。", "Schedule 5-8 minutes of slow breathing or short meditation in the afternoon."),
            ("继续保持规律作息与轻度活动，巩固当前稳定趋势。", "Maintain regular rest and light activity to reinforce the current stable trend."),
            ("连续记录与校准 7 天以上，提升模型准确度。", "Record and calibrate for at least 7 days to improve model accuracy."),
            ("每天固定 1 个可执行小动作（如 10 分钟慢呼吸或短时步行）。", "Set one executable daily action, such as 10 minutes of slow breathing or a short walk."),
            ("睡前 1 小时减少屏幕刺激，稳定入睡时间。", "Reduce screen stimulation 1 hour before bed to stabilize sleep onset."),
            ("稳定昼夜节律", "Stabilize circadian rhythm"),
            ("改善睡眠深度", "Improve sleep depth"),
            ("保持固定起床时间", "Keep a fixed wake-up time"),
            ("放松神经系统", "Relax the nervous system"),
            ("提升能量与情绪", "Improve energy and mood"),
            ("过量咖啡因", "Excessive caffeine"),
            ("连续熬夜", "Consecutive late nights"),
            ("睡眠节律", "Sleep rhythm"),
            ("基于 GAD-7 量表推导，越低越好", "Derived from GAD-7 score; lower is better."),
            ("综合睡眠时长和睡眠质量评分", "Combined score of sleep duration and sleep quality."),
            ("基于 PSS-10 和每日压力校准", "Based on PSS-10 and daily stress calibration."),
            ("基于 PHQ-9 和每日情绪波动", "Based on PHQ-9 and daily mood fluctuations."),
            ("综合睡眠、情绪和每日校准", "Combined from sleep, mood, and daily calibration."),
            ("推断值，接入穿戴设备后更准确", "Estimated value; more accurate after connecting wearable devices.")
        ]

        for (zh, en) in phraseReplacements {
            converted = converted.replacingOccurrences(of: zh, with: en)
        }

        let patterns: [(String, String)] = [
            (#"([+-]?\d+(?:\.\d+)?)\s*分"#, "$1 pts"),
            (#"([+-]?\d+(?:\.\d+)?)\s*天"#, "$1 days"),
            (#"([+-]?\d+(?:\.\d+)?)\s*小时"#, "$1 hours"),
            (#"([+-]?\d+(?:\.\d+)?)\s*分钟"#, "$1 min"),
            (#"([+-]?\d+(?:\.\d+)?)\s*步"#, "$1 steps")
        ]

        for (pattern, template) in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern) else { continue }
            let range = NSRange(converted.startIndex..., in: converted)
            converted = regex.stringByReplacingMatches(in: converted, options: [], range: range, withTemplate: template)
        }

        return converted
    }
}
