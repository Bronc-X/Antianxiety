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
    @AppStorage("antios_preferred_dark_mode") private var prefersDarkMode = true
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .preferredColorScheme(prefersDarkMode ? .dark : .light)
        }
    }
}
