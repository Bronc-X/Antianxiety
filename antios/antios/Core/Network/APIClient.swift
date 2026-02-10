//
//  APIClient.swift
//  antios
//
//  网络请求客户端 - 支持普通请求和流式响应
//

import Foundation

class APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let session: URLSession
    private var authToken: String?
    
    private init() {
        self.baseURL = APIEnvironment.resolveBaseURL()

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }
    
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    // MARK: - Regular Request
    
    func request<T: Decodable, B: Encodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: B? = nil as Empty?
    ) async throws -> T {
        let url = try makeURL(for: endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        #if DEBUG
        if authToken == nil {
            request.setValue("true", forHTTPHeaderField: "x-skip-auth")
        }
        #endif
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    // MARK: - Streaming Request
    
    func streamRequest<B: Encodable>(
        endpoint: String,
        body: B
    ) async -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let url = try makeURL(for: endpoint)
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
                    
                    if let token = authToken {
                        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                    }

                    #if DEBUG
                    if authToken == nil {
                        request.setValue("true", forHTTPHeaderField: "x-skip-auth")
                    }
                    #endif
                    
                    request.httpBody = try JSONEncoder().encode(body)
                    
                    let (bytes, response) = try await session.bytes(for: request)
                    
                    guard let httpResponse = response as? HTTPURLResponse,
                          (200...299).contains(httpResponse.statusCode) else {
                        continuation.finish(throwing: APIError.invalidResponse)
                        return
                    }
                    
                    for try await line in bytes.lines {
                        if line.hasPrefix("data: ") {
                            let data = String(line.dropFirst(6))
                            if data != "[DONE]" {
                                continuation.yield(data)
                            }
                        }
                    }
                    
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    private func makeURL(for endpoint: String) throws -> URL {
        let cleanEndpoint = endpoint
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(baseURL)/\(cleanEndpoint)") else {
            throw APIError.invalidEndpoint
        }
        return url
    }
}

private enum APIEnvironment {
    private static let productionBaseURL = "https://antianxiety.vercel.app/api"
    private static let localBaseURL = "http://127.0.0.1:3000/api"

    static func resolveBaseURL() -> String {
        let env = ProcessInfo.processInfo.environment
        if let value = env["ANTIOS_API_BASE_URL"], !value.isEmpty {
            return normalized(value)
        }

        if let value = Bundle.main.infoDictionary?["API_BASE_URL"] as? String, !value.isEmpty {
            return normalized(value)
        }

        #if DEBUG
        if isTruthy(env["ANTIOS_USE_LOCAL_API"])
            || isTruthy(Bundle.main.infoDictionary?["ANTIOS_USE_LOCAL_API"] as? String) {
            return localBaseURL
        }
        #endif

        return productionBaseURL
    }

    private static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    private static func isTruthy(_ value: String?) -> Bool {
        guard let lowered = value?.lowercased() else { return false }
        return lowered == "1" || lowered == "true" || lowered == "yes"
    }
}

// MARK: - Supporting Types

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

enum APIError: Error, LocalizedError {
    case invalidResponse
    case httpError(Int)
    case invalidEndpoint
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "无效的服务器响应"
        case .httpError(let code):
            return "请求失败 (错误码: \(code))"
        case .invalidEndpoint:
            return "无效的请求路径"
        case .decodingError:
            return "数据解析失败"
        }
    }
}

struct Empty: Encodable {}
