// LiquidGlassShowcaseView.swift
// 纯静态 UI 展示容器 - 用于预览 Deep Liquid Glass 设计语言
// 无需业务逻辑挂钩

import SwiftUI

struct LiquidGlassShowcaseView: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var sliderValue: Double = 50
    @State private var toggleValue: Bool = true
    @State private var sampleText: String = ""
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 1. 核心背景
                AbyssBackground()
                
                ScrollView {
                    VStack(spacing: 32) {
                        // Header
                        VStack(spacing: 8) {
                            Text("Deep Liquid Glass")
                                .font(.system(size: 34, weight: .bold, design: .rounded))
                                .foregroundStyle(LinearGradient.accentFlow)
                            
                            Text("iOS 26 Concept Showcase")
                                .font(.headline)
                                .foregroundColor(.textSecondary)
                        }
                        .padding(.top, 20)
                        
                        // Section 1: Cards System
                        VStack(alignment: .leading, spacing: 16) {
                            sectionHeader("材质系统 (Material System)")
                            
                            // Elevated Card (浮起 - 用于强调)
                            LiquidGlassCard(style: .elevated) {
                                HStack {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text("Elevated Glass")
                                            .font(.headline)
                                            .foregroundColor(.white)
                                        Text("浮起材质，用于核心卡片")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                    }
                                    Spacer()
                                    Image(systemName: "cube.transparent.fill")
                                        .font(.title)
                                        .foregroundStyle(LinearGradient.accentFlow)
                                }
                            }
                            
                            // Standard Card (标准 - 用于列表)
                            LiquidGlassCard(style: .standard) {
                                HStack {
                                    Image(systemName: "doc.text.fill")
                                        .foregroundColor(.liquidGlassAccent)
                                    Text("Standard Glass · 标准磨砂")
                                        .font(.subheadline)
                                        .foregroundColor(.textPrimary)
                                    Spacer()
                                }
                            }
                            
                            // Sunk Card (凹陷 - 用于背景容器/数据展示)
                            LiquidGlassCard(style: .sunk) {
                                HStack {
                                    Text("Sunk Glass · 凹陷区域")
                                        .font(.subheadline)
                                        .foregroundColor(.textSecondary)
                                    Spacer()
                                    Text("VALUE")
                                        .font(.caption.bold())
                                        .padding(6)
                                        .background(Color.white.opacity(0.1))
                                        .clipShape(RoundedRectangle(cornerRadius: 6))
                                }
                            }
                        }
                        .padding(.horizontal)
                        
                        // Section 2: Interactive Components
                        VStack(alignment: .leading, spacing: 16) {
                            sectionHeader("交互组件 (Interactive)")
                            
                            LiquidGlassCard(style: .standard) {
                                VStack(spacing: 20) {
                                    // Toggle
                                    Toggle("生物荧光 (Bio-Glow)", isOn: $toggleValue)
                                        .toggleStyle(LiquidGlassToggleStyle())
                                    
                                    Divider().background(Color.white.opacity(0.1))
                                    
                                    // Slider
                                    VStack(alignment: .leading) {
                                        Text("强度控制")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                        LiquidGlassSlider(value: $sliderValue, range: 0...100)
                                    }
                                    
                                    Divider().background(Color.white.opacity(0.1))
                                    
                                    // TextField
                                    LiquidGlassTextField(placeholder: "输入点什么...", text: $sampleText, icon: "pencil")
                                }
                            }
                        }
                        .padding(.horizontal)
                        
                        // Section 3: Visual Effects
                        VStack(alignment: .leading, spacing: 16) {
                            sectionHeader("视觉特效 (Visual FX)")
                            
                            HStack(spacing: 20) {
                                // Pulsing Ring
                                VStack {
                                    PulsingRingsView()
                                        .frame(width: 80, height: 80)
                                    Text("Pulse")
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                }
                                
                                // Glowing Ring
                                VStack {
                                    GlowingProgressRing(progress: 0.75, showChromatic: true)
                                        .frame(width: 80, height: 80)
                                    Text("Chrome")
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                }
                                
                                // Breathing Ring
                                VStack {
                                    BreathingRingView(progress: 0.6)
                                        .frame(width: 80, height: 80)
                                    Text("Breath")
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.black.opacity(0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                        }
                        .padding(.horizontal)
                        
                        // Section 4: Mock Dashboard
                        VStack(alignment: .leading, spacing: 16) {
                            sectionHeader("仪表盘模拟 (Mockup)")
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 16) {
                                    mockMetricCard("HRV", "42 ms", "waveform.path.ecg", .liquidGlassAccent)
                                    mockMetricCard("睡眠", "7.5 h", "moon.zzz.fill", .liquidGlassPurple)
                                    mockMetricCard("压力", "Low", "brain.head.profile", .liquidGlassWarm)
                                }
                                .padding(.horizontal)
                            }
                        }
                        
                        Spacer(minLength: 50)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.caption.bold())
            .foregroundColor(.liquidGlassAccent)
            .textCase(.uppercase)
            .padding(.leading, 8)
    }
    
    private func mockMetricCard(_ title: String, _ value: String, _ icon: String, _ color: Color) -> some View {
        LiquidGlassCard(style: .concave, padding: 12) {
            VStack(alignment: .leading, spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(value)
                        .font(.title3.bold())
                        .foregroundColor(.white)
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
            .frame(width: 100)
        }
    }
}

struct LiquidGlassShowcaseView_Previews: PreviewProvider {
    static var previews: some View {
        LiquidGlassShowcaseView()
            .preferredColorScheme(.dark)
    }
}
