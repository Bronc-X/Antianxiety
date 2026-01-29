// AssessmentViewModel.swift
// 临床评估视图模型 - 对齐 Web 端 useAssessment Hook
//
// 功能对照:
// - Web: hooks/domain/useAssessment.ts + app/actions/assessment-engine.ts
// - iOS: 本文件
//
// AI 驱动的动态临床评估流程 ("Bio-Ledger")

import SwiftUI

// MARK: - Assessment Types

enum AssessmentPhase: String, Codable {
    case welcome
    case baseline        // API返回的基线评估阶段
    case chief_complaint // 主诉阶段
    case differential    // 鉴别诊断阶段
    case assessment      // 通用评估阶段（UI显示用）
    case report          // 报告阶段
    case emergency
    case complete
    
    // 将API返回的phase映射到UI显示的phase
    var displayPhase: AssessmentPhase {
        switch self {
        case .baseline, .chief_complaint, .differential:
            return .assessment  // 这些都显示为评估阶段UI
        case .report, .complete:
            return .complete
        default:
            return self
        }
    }
}

struct AssessmentQuestion: Codable, Equatable {
    let id: String
    let text: String
    let type: String // "single_choice", "multi_choice", "scale", "text"
    let options: [AssessmentOption]?
    let minValue: Int?
    let maxValue: Int?
    let progress: Int?      // API返回的进度
    let category: String?   // API返回的分类
    let description: String? // 问题描述
}

struct AssessmentOption: Codable, Equatable {
    let value: String
    let label: String
}

struct AssessmentResponse: Codable {
    let session_id: String
    let phase: String
    let question: AssessmentQuestion?
    let progress: Int?
    let message: String?
}

struct AnswerRecord: Equatable {
    let questionId: String
    let questionText: String
    let value: String
    let answeredAt: String
}

// MARK: - API DTOs

private struct StartSessionDTO: Codable {
    let language: String
    let country_code: String
}

private struct SubmitAnswerDTO: Codable {
    let session_id: String
    let answer: AnswerPayload
    let language: String
    let country_code: String
}

private struct AnswerPayload: Codable {
    let question_id: String
    let value: String
    let input_method: String?
}

// MARK: - ViewModel

@MainActor
class AssessmentViewModel: ObservableObject {
    
    // MARK: - Published State (对齐 useAssessment)
    
    @Published var sessionId: String?
    @Published var phase: AssessmentPhase = .welcome
    @Published var currentQuestion: AssessmentQuestion?
    @Published var history: [AnswerRecord] = []
    @Published var progress: Int = 0
    @Published var isLoading = false
    @Published var error: String?
    @Published var language: String = "zh"
    @Published var countryCode: String = "CN"
    @Published var message: String?
    
    // MARK: - Dependencies
    
    private let supabase = SupabaseManager.shared
    
    // MARK: - Start Assessment
    
    func startAssessment() async {
        isLoading = true
        error = nil
        
        do {
            guard let url = supabase.appAPIURL(path: "api/assessment/start") else {
                throw AssessmentError.missingApiUrl
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            attachAuth(to: &request)
            
            let dto = StartSessionDTO(language: language, country_code: countryCode)
            request.httpBody = try JSONEncoder().encode(dto)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw AssessmentError.requestFailed
            }
            
            let result = try JSONDecoder().decode(AssessmentResponse.self, from: data)
            
            sessionId = result.session_id
            phase = AssessmentPhase(rawValue: result.phase) ?? .assessment
            currentQuestion = result.question
            progress = result.progress ?? 0
            message = result.message
            history = []
            
            isLoading = false
        } catch {
            isLoading = false
            self.error = error.localizedDescription
            print("[Assessment] Start error: \(error)")
        }
    }
    
    // MARK: - Submit Answer
    
    func submitAnswer(questionId: String, value: String) async {
        guard let sessionId = sessionId else { return }
        
        let previousQuestion = currentQuestion?.text ?? ""
        isLoading = true
        error = nil
        
        do {
            guard let url = supabase.appAPIURL(path: "api/assessment/next") else {
                throw AssessmentError.missingApiUrl
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            attachAuth(to: &request)
            
            let dto = SubmitAnswerDTO(
                session_id: sessionId,
                answer: AnswerPayload(question_id: questionId, value: value, input_method: "tap"),
                language: language,
                country_code: countryCode
            )
            request.httpBody = try JSONEncoder().encode(dto)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw AssessmentError.requestFailed
            }
            
            // 调试：打印原始响应
            if let jsonString = String(data: data, encoding: .utf8) {
                print("[Assessment] Raw response: \(jsonString.prefix(500))")
            }
            
            let result = try JSONDecoder().decode(AssessmentResponse.self, from: data)
            print("[Assessment] Decoded successfully - phase: \(result.phase), question: \(result.question?.text ?? "nil")")
            
            // 记录历史
            let record = AnswerRecord(
                questionId: questionId,
                questionText: previousQuestion,
                value: value,
                answeredAt: ISO8601DateFormatter().string(from: Date())
            )
            history.append(record)
            
            // 更新状态
            phase = AssessmentPhase(rawValue: result.phase) ?? phase
            print("[Assessment] Phase updated to: \(phase)")
            currentQuestion = result.question
            // progress优先从question中获取，其次从顶层获取
            progress = result.question?.progress ?? result.progress ?? progress
            message = result.message
            
            isLoading = false
        } catch let decodingError as DecodingError {
            isLoading = false
            print("[Assessment] Decoding error: \(decodingError)")
            switch decodingError {
            case .keyNotFound(let key, let context):
                print("[Assessment] Missing key: \(key.stringValue), path: \(context.codingPath)")
            case .typeMismatch(let type, let context):
                print("[Assessment] Type mismatch: expected \(type), path: \(context.codingPath)")
            case .valueNotFound(let type, let context):
                print("[Assessment] Value not found: \(type), path: \(context.codingPath)")
            case .dataCorrupted(let context):
                print("[Assessment] Data corrupted: \(context)")
            @unknown default:
                print("[Assessment] Unknown decoding error")
            }
            self.error = "数据解析失败"
        } catch {
            isLoading = false
            self.error = error.localizedDescription
            print("[Assessment] Submit error: \(error)")
        }
    }
    
    // MARK: - Reset Assessment
    
    func resetAssessment() {
        sessionId = nil
        phase = .welcome
        currentQuestion = nil
        history = []
        progress = 0
        isLoading = false
        error = nil
        message = nil
    }
    
    // MARK: - Dismiss Emergency
    
    func dismissEmergency() async {
        guard let sessionId = sessionId else { return }
        
        do {
            guard let url = supabase.appAPIURL(path: "api/assessment/dismiss-emergency") else {
                throw AssessmentError.missingApiUrl
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            attachAuth(to: &request)
            
            let body = ["session_id": sessionId]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            _ = try await URLSession.shared.data(for: request)
        } catch {
            print("[Assessment] Dismiss emergency error: \(error)")
        }
        
        resetAssessment()
    }
    
    // MARK: - Helpers
    
    private func attachAuth(to request: inout URLRequest) {
        if let accessToken = UserDefaults.standard.string(forKey: "supabase_access_token") {
            let refreshToken = UserDefaults.standard.string(forKey: "supabase_refresh_token") ?? ""
            request.setValue("sb-access-token=\(accessToken); sb-refresh-token=\(refreshToken)", forHTTPHeaderField: "Cookie")
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
    }
}

// MARK: - Error

enum AssessmentError: LocalizedError {
    case missingApiUrl
    case requestFailed
    
    var errorDescription: String? {
        switch self {
        case .missingApiUrl: return "未配置 APP_API_BASE_URL"
        case .requestFailed: return "请求失败"
        }
    }
}
