// AppSettings.swift
// 全局设置与简易语言管理

import SwiftUI

enum AppLanguage: String, CaseIterable, Identifiable {
    case zh
    case en

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .zh: return "中文"
        case .en: return "English"
        }
    }
}

final class AppSettings: ObservableObject {
    @Published var language: AppLanguage {
        didSet {
            UserDefaults.standard.set(language.rawValue, forKey: "app_language")
        }
    }

    init() {
        let stored = UserDefaults.standard.string(forKey: "app_language")
        language = AppLanguage(rawValue: stored ?? "zh") ?? .zh
    }
}

struct L10n {
    static func text(_ zh: String, _ en: String, language: AppLanguage) -> String {
        language == .en ? en : zh
    }
}
