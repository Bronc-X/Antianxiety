//
//  PlanReplaceService.swift
//  antios
//
//  E3: 方案项替换服务
//

import Foundation

class PlanReplaceService {
    static let shared = PlanReplaceService()
    
    private init() {}
    
    func replaceItem(_ item: PlanItem, userPreferences: [String] = []) async throws -> PlanItem {
        struct ReplaceRequest: Encodable {
            let currentItem: PlanItem
            let preferences: [String]
        }
        
        struct ReplaceResponse: Decodable {
            let newItem: PlanItemResponse
        }
        
        let response: ReplaceResponse = try await APIClient.shared.request(
            endpoint: "max/plan-replace",
            method: .post,
            body: ReplaceRequest(currentItem: item, preferences: userPreferences)
        )
        
        return PlanItem(
            id: response.newItem.id,
            title: response.newItem.title,
            action: response.newItem.action,
            science: response.newItem.science,
            difficulty: response.newItem.difficulty,
            category: response.newItem.category,
            isCompleted: false
        )
    }
    
    func localReplace(_ item: PlanItem) -> PlanItem {
        let alternatives: [String: [PlanItem]] = [
            "sleep": [
                PlanItem(id: UUID().uuidString, title: "睡前冥想", action: "使用冥想 App 进行 10 分钟睡前放松", science: "冥想可降低皮质醇水平，促进入睡", difficulty: 1, category: "sleep", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "限制咖啡因", action: "下午 2 点后避免摄入咖啡因", science: "咖啡因半衰期约 5-6 小时，影响睡眠质量", difficulty: 2, category: "sleep", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "卧室温度调节", action: "保持卧室温度在 18-22°C", science: "凉爽环境有助于启动睡眠机制", difficulty: 1, category: "sleep", isCompleted: false)
            ],
            "stress": [
                PlanItem(id: UUID().uuidString, title: "4-7-8 呼吸法", action: "吸气 4 秒，屏息 7 秒，呼气 8 秒", science: "激活副交感神经，快速镇静", difficulty: 1, category: "stress", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "散步 20 分钟", action: "在自然环境中步行 20 分钟", science: "自然环境可降低杏仁核活动", difficulty: 1, category: "stress", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "渐进式肌肉放松", action: "从脚趾到头顶逐步放松肌肉群", science: "减少躯体紧张，缓解焦虑", difficulty: 2, category: "stress", isCompleted: false)
            ],
            "exercise": [
                PlanItem(id: UUID().uuidString, title: "晨间拉伸", action: "起床后进行 5 分钟全身拉伸", science: "改善血液循环，提升清醒度", difficulty: 1, category: "exercise", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "午间快走", action: "午休时快走 10-15 分钟", science: "短暂运动可提升下午注意力", difficulty: 1, category: "exercise", isCompleted: false)
            ],
            "diet": [
                PlanItem(id: UUID().uuidString, title: "增加水摄入", action: "每天至少喝 8 杯水", science: "轻度脱水会影响认知功能", difficulty: 1, category: "diet", isCompleted: false),
                PlanItem(id: UUID().uuidString, title: "减少糖分", action: "用水果替代甜食", science: "血糖波动影响情绪稳定性", difficulty: 2, category: "diet", isCompleted: false)
            ]
        ]
        
        let categoryItems = alternatives[item.category] ?? alternatives["stress"]!
        let filtered = categoryItems.filter { $0.title != item.title }
        return filtered.randomElement() ?? categoryItems.first!
    }
}
