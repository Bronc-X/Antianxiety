//
//  PlanSelectorView.swift
//  计划选择器视图 - 显示两个计划选项供用户选择
//

import SwiftUI

struct PlanSelectorView: View {
    let options: [PlanOption]
    let onConfirm: (PlanOption) -> Void
    
    @State private var selectedIndex: Int? = nil
    @State private var isConfirmed = false
    @State private var isSaving = false
    @State private var expandedCards: Set<Int> = []
    
    var body: some View {
        if isConfirmed {
            // 确认成功状态
            HStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                Text("方案已添加到计划")
                    .font(.subheadline)
            }
            .padding()
            .background(Color.green.opacity(0.15))
            .cornerRadius(12)
        } else {
            VStack(alignment: .leading, spacing: 12) {
                // 标题
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.caption)
                        .foregroundColor(Color.liquidGlassAccent)
                    Text("选择一个方案开始执行:")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
                
                // 计划卡片
                ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                    PlanCardView(
                        option: option,
                        isSelected: selectedIndex == index,
                        isExpanded: expandedCards.contains(index),
                        onSelect: { selectedIndex = index },
                        onToggleExpand: {
                            if expandedCards.contains(index) {
                                expandedCards.remove(index)
                            } else {
                                expandedCards.insert(index)
                            }
                        }
                    )
                }
                
                // 操作按钮
                if selectedIndex != nil {
                    HStack(spacing: 12) {
                        // 确认按钮
                        Button {
                            handleConfirm()
                        } label: {
                            HStack(spacing: 6) {
                                if isSaving {
                                    ProgressView()
                                        .tint(.black)
                                } else {
                                    Image(systemName: "bolt.fill")
                                }
                                Text("确认并保存")
                            }
                            .font(.subheadline.bold())
                            .foregroundColor(.black)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                            .background(Color.liquidGlassAccent)
                            .cornerRadius(12)
                        }
                        .disabled(isSaving)
                    }
                    .padding(.top, 8)
                }
            }
            .padding()
            .background(.ultraThinMaterial)
            .cornerRadius(16)
        }
    }
    
    private func handleConfirm() {
        guard let index = selectedIndex else { return }
        isSaving = true
        
        // 调用确认回调
        onConfirm(options[index])
        
        // 模拟保存延迟后显示成功
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            isSaving = false
            isConfirmed = true
        }
    }
}

// MARK: - 单个计划卡片
struct PlanCardView: View {
    let option: PlanOption
    let isSelected: Bool
    let isExpanded: Bool
    let onSelect: () -> Void
    let onToggleExpand: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    // 标题
                    Text(option.displayTitle)
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    // 选中指示器
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(Color.liquidGlassAccent)
                    }
                }
                
                // 元信息
                HStack(spacing: 12) {
                    if let difficulty = option.difficulty {
                        Label(difficulty, systemImage: "target")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.5))
                    }
                    if let duration = option.duration {
                        Label(duration, systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.5))
                    }
                }
                
                // 描述
                if let description = option.description, !description.isEmpty {
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.7))
                        .lineLimit(isExpanded ? nil : 2)
                }
                
                // 项目列表
                let items = option.displayItems
                if !items.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(Array((isExpanded ? items : Array(items.prefix(4))).enumerated()), id: \.offset) { index, item in
                            HStack(alignment: .top, spacing: 6) {
                                Circle()
                                    .fill(Color.white.opacity(0.4))
                                    .frame(width: 4, height: 4)
                                    .padding(.top, 6)
                                Text(item.text)
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))
                                    .lineLimit(isExpanded ? nil : 1)
                            }
                        }
                        
                        // 展开/收起按钮
                        if items.count > 4 {
                            Button(action: onToggleExpand) {
                                HStack(spacing: 4) {
                                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                                        .font(.caption2)
                                    Text(isExpanded ? "收起" : "展开全部 (\(items.count - 4) 项)")
                                        .font(.caption)
                                }
                                .foregroundColor(Color.liquidGlassAccent)
                            }
                            .padding(.top, 4)
                        }
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.white.opacity(0.08) : Color.white.opacity(0.03))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.liquidGlassAccent.opacity(0.4) : Color.white.opacity(0.08), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}
