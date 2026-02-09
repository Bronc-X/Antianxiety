//
//  antiosApp.swift
//  antios
//
//  应用入口
//

import SwiftUI
import UIKit

@main
struct antiosApp: App {
    @StateObject private var authManager = AuthManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .preferredColorScheme(.dark)
                .onAppear {
                    applyGlobalWindowLeftShift()
                }
                .onReceive(NotificationCenter.default.publisher(for: UIWindow.didBecomeVisibleNotification)) { _ in
                    applyGlobalWindowLeftShift()
                }
        }
    }

    // Hardcoded global transform requested by product decision:
    // 1) keep total horizontal shift at -28pt
    // 2) apply global scale to 0.93 to avoid edge overflow
    private func applyGlobalWindowLeftShift() {
        let globalScale: CGFloat = 0.93
        let globalShiftX: CGFloat = -28

        DispatchQueue.main.async {
            let windowScenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            for scene in windowScenes {
                for window in scene.windows {
                    window.transform = CGAffineTransform(
                        a: globalScale,
                        b: 0,
                        c: 0,
                        d: globalScale,
                        tx: globalShiftX,
                        ty: 0
                    )
                }
            }
        }
    }
}
