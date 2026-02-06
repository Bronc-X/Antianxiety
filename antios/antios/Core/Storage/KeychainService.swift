//
//  KeychainService.swift
//  antios
//
//  安全存储服务 - Token 和敏感数据
//

import Foundation
import Security

class KeychainService {
    static let shared = KeychainService()
    
    private let service = "com.antianxiety.antios"
    
    private init() {}
    
    // MARK: - Keys
    
    enum Key: String {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case userId = "user_id"
    }
    
    // MARK: - Save
    
    func save(_ value: String, for key: Key) {
        guard let data = value.data(using: .utf8) else { return }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue
        ]
        
        SecItemDelete(query as CFDictionary)
        
        var newQuery = query
        newQuery[kSecValueData as String] = data
        
        SecItemAdd(newQuery as CFDictionary, nil)
    }
    
    // MARK: - Load
    
    func load(for key: Key) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return string
    }
    
    // MARK: - Delete
    
    func delete(for key: Key) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue
        ]
        
        SecItemDelete(query as CFDictionary)
    }
    
    // MARK: - Clear All
    
    func clearAll() {
        Key.allCases.forEach { delete(for: $0) }
    }
}

extension KeychainService.Key: CaseIterable {}
