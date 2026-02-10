//
//  WearablesView.swift
//  antios
//
//  H1-H2: 穿戴设备视图
//

import SwiftUI
import UIKit

struct WearablesView: View {
    @StateObject private var healthKit = HealthKitService.shared
    @State private var isSyncing = false
    @State private var connectedProviders: Set<String> = []
    @State private var statusMessage: String?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // HealthKit Section
                    healthKitSection
                    
                    // Third-party Devices (H2)
                    thirdPartySection
                    
                    // Data Summary
                    if healthKit.isAuthorized {
                        dataSummarySection
                    }
                }
                .padding(AppTheme.Spacing.md)
            }
            .background(AuroraBackground().ignoresSafeArea())
            .navigationTitle("健康数据")
            .navigationBarTitleDisplayMode(.large)
            .alert("设备连接", isPresented: Binding(
                get: { statusMessage != nil },
                set: { if !$0 { statusMessage = nil } }
            )) {
                Button("确定", role: .cancel) {}
            } message: {
                Text(statusMessage ?? "")
            }
        }
        .onAppear {
            Task { await loadConnections() }
        }
    }
    
    // MARK: - HealthKit Section
    
    private var healthKitSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                
                Text("Apple 健康")
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(AppTheme.Colors.textPrimary)
                
                Spacer()
                
                if healthKit.isAuthorized {
                    Text("已连接")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.success)
                }
            }
            
            if !healthKit.isAuthorized {
                Button {
                    Task {
                        try? await healthKit.requestAuthorization()
                    }
                } label: {
                    Text("连接 HealthKit")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
            } else {
                Button {
                    syncData()
                } label: {
                    HStack {
                        if isSyncing {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "arrow.triangle.2.circlepath")
                            Text("同步数据")
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(isSyncing)
            }
        }
        .cardStyle()
    }
    
    // MARK: - Third-party Section (H2)
    
    private var thirdPartySection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("第三方设备")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            DeviceRow(name: "Oura Ring", icon: "circle.circle", isConnected: connectedProviders.contains("oura")) {
                connectProvider("oura")
            }
            DeviceRow(name: "Whoop", icon: "waveform", isConnected: connectedProviders.contains("whoop")) {
                connectProvider("whoop")
            }
            DeviceRow(name: "Garmin", icon: "figure.run", isConnected: connectedProviders.contains("garmin")) {
                connectProvider("garmin")
            }
            
            Text("已连接设备会自动参与健康建模")
                .font(AppTheme.Typography.caption)
                .foregroundColor(AppTheme.Colors.textTertiary)
        }
    }
    
    // MARK: - Data Summary
    
    private var dataSummarySection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            Text("今日数据")
                .font(AppTheme.Typography.headline)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            if let sleep = healthKit.sleepData {
                DataCard(
                    icon: "moon.fill",
                    title: "睡眠",
                    value: String(format: "%.1f", sleep.totalHours),
                    unit: "小时",
                    color: .indigo
                )
            }
            
            if let hrv = healthKit.hrvData {
                DataCard(
                    icon: "heart.fill",
                    title: "HRV",
                    value: String(format: "%.0f", hrv.averageHRV),
                    unit: "ms",
                    color: .red
                )
            }
            
            if let activity = healthKit.activityData {
                DataCard(
                    icon: "figure.walk",
                    title: "步数",
                    value: "\(activity.steps)",
                    unit: "步",
                    color: .green
                )
            }
        }
    }
    
    private func syncData() {
        isSyncing = true
        
        Task {
            do {
                _ = try await healthKit.fetchSleepData()
                _ = try await healthKit.fetchHRVData()
                _ = try await healthKit.fetchActivityData()
                try await healthKit.syncToServer()
            } catch {
                print("同步失败: \(error)")
            }
            
            isSyncing = false
        }
    }

    private func loadConnections() async {
        struct SyncStatusResponse: Decodable {
            struct Connection: Decodable {
                let connected: Bool
                let lastSync: String?
            }
            let connections: [String: Connection]?
        }

        do {
            let response: SyncStatusResponse = try await APIClient.shared.request(
                endpoint: "wearables/sync",
                method: .get
            )
            let remote = response.connections?
                .filter { $0.value.connected }
                .map { $0.key.lowercased() } ?? []
            connectedProviders = Set(remote)
            persistConnections()
        } catch {
            connectedProviders = loadPersistedConnections()
        }
    }

    private func connectProvider(_ provider: String) {
        let supported: Set<String> = ["oura", "fitbit"]
        guard supported.contains(provider) else {
            connectedProviders.insert(provider)
            persistConnections()
            statusMessage = "\(provider.uppercased()) 暂无官方 OAuth，已按本地连接标记。"
            return
        }

        let envBase = ProcessInfo.processInfo.environment["ANTIOS_API_BASE_URL"] ?? "https://antianxiety.vercel.app/api"
        let host = envBase.hasSuffix("/api") ? String(envBase.dropLast(4)) : envBase
        let urlString = "\(host)/api/wearables/connect/\(provider)?redirect_uri=antianxiety://wearables/callback"
        guard let url = URL(string: urlString) else {
            statusMessage = "无法构建连接地址，请检查 API_BASE_URL。"
            return
        }
        UIApplication.shared.open(url)
        connectedProviders.insert(provider)
        persistConnections()
    }

    private func persistConnections() {
        UserDefaults.standard.set(Array(connectedProviders), forKey: "antios_connected_providers")
    }

    private func loadPersistedConnections() -> Set<String> {
        Set((UserDefaults.standard.array(forKey: "antios_connected_providers") as? [String]) ?? [])
    }
}

// MARK: - Device Row

struct DeviceRow: View {
    let name: String
    let icon: String
    let isConnected: Bool
    let action: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(AppTheme.Colors.primary)
                .frame(width: 32)
            
            Text(name)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            Spacer()
            
            if isConnected {
                Text("已连接")
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.success)
            } else {
                Button("连接") {
                    action()
                }
                .font(AppTheme.Typography.caption)
                .foregroundColor(AppTheme.Colors.primary)
            }
        }
        .cardStyle()
    }
}

// MARK: - Data Card

struct DataCard: View {
    let icon: String
    let title: String
    let value: String
    let unit: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 44, height: 44)
                .background(color.opacity(0.2))
                .cornerRadius(AppTheme.CornerRadius.md)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.textSecondary)
                
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(value)
                        .font(AppTheme.Typography.title2)
                        .foregroundColor(AppTheme.Colors.textPrimary)
                    
                    Text(unit)
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.textTertiary)
                }
            }
            
            Spacer()
        }
        .cardStyle()
    }
}

struct WearablesView_PreviewProvider: PreviewProvider {
    static var previews: some View {
    WearablesView()
    }
}
