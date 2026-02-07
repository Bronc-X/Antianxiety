//
//  antiosApp.swift
//  antios
//
//  应用入口
//

import SwiftUI

@main
struct antiosApp: App {
    @StateObject private var authManager = AuthManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .preferredColorScheme(.dark)
        }
    }
}
