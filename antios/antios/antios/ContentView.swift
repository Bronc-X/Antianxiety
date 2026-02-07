//
//  ContentView.swift
//  antios
//
//  主内容视图
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var selectedTab = 0
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                mainTabView
            } else {
                AuthView()
            }
        }
    }
    
    private var mainTabView: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("首页", systemImage: "house.fill")
                }
                .tag(0)
            
            ChatView()
                .tabItem {
                    Label("对话", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .tag(1)
            
            PlanView()
                .tabItem {
                    Label("方案", systemImage: "list.clipboard.fill")
                }
                .tag(2)
            
            CuratedFeedView()
                .tabItem {
                    Label("期刊", systemImage: "book.fill")
                }
                .tag(3)
            
            ProfileView()
                .tabItem {
                    Label("我的", systemImage: "person.fill")
                }
                .tag(4)
        }
        .tint(AppTheme.Colors.primary)
    }
}

