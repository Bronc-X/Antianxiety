// DebugViewInspector.swift
// 开发调试工具 - 长按复制 View 信息
// 仅在 DEBUG 模式下启用，不影响 Release 性能

import SwiftUI

#if DEBUG

// MARK: - 调试信息模型
struct DebugViewInfo {
    let viewName: String
    let filePath: String
    let lineNumber: Int
    
    var displayText: String {
        """
        📍 View: \(viewName)
        📁 File: \(filePath)
        📎 Line: \(lineNumber)
        """
    }
    
    var copyText: String {
        """
        View: \(viewName)
        Path: \(filePath)#L\(lineNumber)
        """
    }
}

// MARK: - 调试 Overlay 修饰器
struct DebugViewInspectorModifier: ViewModifier {
    let viewName: String
    let file: String
    let line: Int
    
    @State private var showInfo = false
    @State private var copied = false
    
    private var fileName: String {
        (file as NSString).lastPathComponent
    }
    
    private var info: DebugViewInfo {
        DebugViewInfo(viewName: viewName, filePath: file, lineNumber: line)
    }
    
    func body(content: Content) -> some View {
        content
            .overlay(alignment: .topTrailing) {
                if showInfo {
                    debugInfoOverlay
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .onLongPressGesture(minimumDuration: 0.5) {
                withAnimation(.spring(response: 0.3)) {
                    showInfo.toggle()
                }
                
                // 触觉反馈
                let impact = UIImpactFeedbackGenerator(style: .medium)
                impact.impactOccurred()
            }
    }
    
    private var debugInfoOverlay: some View {
        VStack(alignment: .leading, spacing: 8) {
            // 标题
            HStack {
                Image(systemName: "ladybug.fill")
                    .foregroundColor(.orange)
                Text("Debug Inspector")
                    .font(.caption.bold())
                Spacer()
                Button {
                    withAnimation { showInfo = false }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
            
            Divider()
            
            // 信息
            Group {
                Label(viewName, systemImage: "cube.fill")
                Label(fileName, systemImage: "doc.fill")
                Label("Line \(line)", systemImage: "number")
            }
            .font(.caption2)
            .foregroundColor(.white.opacity(0.9))
            
            // 复制按钮
            Button {
                UIPasteboard.general.string = info.copyText
                copied = true
                
                let impact = UINotificationFeedbackGenerator()
                impact.notificationOccurred(.success)
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    copied = false
                }
            } label: {
                HStack {
                    Image(systemName: copied ? "checkmark" : "doc.on.doc")
                    Text(copied ? "已复制!" : "复制信息")
                }
                .font(.caption.bold())
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(copied ? Color.green : Color.blue)
                .cornerRadius(8)
            }
        }
        .padding(12)
        .frame(width: 200)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.orange.opacity(0.5), lineWidth: 2)
                )
        )
        .shadow(color: .black.opacity(0.3), radius: 10)
        .padding(8)
    }
}

// MARK: - View Extension
extension View {
    /// 调试模式：长按显示 View 信息并可复制
    /// 用法: SomeView().debugInspect()
    func debugInspect(
        _ name: String? = nil,
        file: String = #file,
        line: Int = #line
    ) -> some View {
        let viewName = name ?? String(describing: type(of: self))
            .replacingOccurrences(of: "ModifiedContent<", with: "")
            .components(separatedBy: ",").first ?? "Unknown"
        
        return modifier(DebugViewInspectorModifier(
            viewName: viewName,
            file: file,
            line: line
        ))
    }
}

// MARK: - 全局调试开关
class DebugSettings: ObservableObject {
    static let shared = DebugSettings()
    
    @Published var inspectorEnabled = true
    
    private init() {}
}

#else

// Release 模式下，debugInspect 完全不做任何事
extension View {
    @inlinable
    func debugInspect(_ name: String? = nil, file: String = #file, line: Int = #line) -> some View {
        self
    }
}

#endif
