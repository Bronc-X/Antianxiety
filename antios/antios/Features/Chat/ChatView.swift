//
//  ChatView.swift
//  antios
//
//  D1-D4: AI 对话视图
//

import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()
    @State private var inputText = ""
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: AppTheme.Spacing.md) {
                            ForEach(viewModel.messages) { message in
                                MessageBubble(message: message)
                            }
                            
                            if viewModel.isStreaming {
                                streamingIndicator
                            }
                            
                            // Active Inquiry (D4)
                            if let inquiry = viewModel.activeInquiry {
                                activeInquiryCard(inquiry)
                            }
                        }
                        .padding(AppTheme.Spacing.md)
                    }
                    .onChange(of: viewModel.messages.count) { _ in
                        withAnimation {
                            proxy.scrollTo(viewModel.messages.last?.id, anchor: .bottom)
                        }
                    }
                }
                
                // Input Bar
                inputBar
            }
            .background(AppTheme.Colors.backgroundDark)
            .navigationTitle("Max")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            viewModel.clearConversation()
                        } label: {
                            Label("新对话", systemImage: "plus.bubble")
                        }
                        
                        Button {
                            // Show history
                        } label: {
                            Label("历史记录", systemImage: "clock")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
    }
    
    // MARK: - Streaming Indicator
    
    private var streamingIndicator: some View {
        HStack(spacing: AppTheme.Spacing.sm) {
            ProgressView()
                .scaleEffect(0.8)
            
            Text("Max 正在思考...")
                .font(AppTheme.Typography.caption)
                .foregroundColor(AppTheme.Colors.textTertiary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.leading, AppTheme.Spacing.md)
    }
    
    // MARK: - Active Inquiry Card (D4)
    
    private func activeInquiryCard(_ inquiry: ActiveInquiry) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
            HStack {
                Image(systemName: "questionmark.bubble.fill")
                    .foregroundColor(AppTheme.Colors.warning)
                
                Text("Max 想了解")
                    .font(AppTheme.Typography.subheadline)
                    .foregroundColor(AppTheme.Colors.textSecondary)
            }
            
            Text(inquiry.question)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.textPrimary)
            
            HStack(spacing: AppTheme.Spacing.sm) {
                ForEach(inquiry.options, id: \.self) { option in
                    Button {
                        viewModel.respondToInquiry(option)
                    } label: {
                        Text(option)
                            .font(AppTheme.Typography.caption)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(AppTheme.Colors.backgroundElevated)
                            .cornerRadius(AppTheme.CornerRadius.full)
                    }
                }
            }
        }
        .cardStyle()
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.lg)
                .stroke(AppTheme.Colors.warning.opacity(0.5), lineWidth: 1)
        )
    }
    
    // MARK: - Input Bar
    
    private var inputBar: some View {
        HStack(spacing: AppTheme.Spacing.sm) {
            TextField("输入消息...", text: $inputText, axis: .vertical)
                .textFieldStyle(.plain)
                .padding(AppTheme.Spacing.sm)
                .background(AppTheme.Colors.backgroundElevated)
                .cornerRadius(AppTheme.CornerRadius.lg)
                .focused($isInputFocused)
                .lineLimit(1...5)
            
            Button {
                sendMessage()
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundColor(inputText.isEmpty ? AppTheme.Colors.textTertiary : AppTheme.Colors.primary)
            }
            .disabled(inputText.isEmpty || viewModel.isStreaming)
        }
        .padding(AppTheme.Spacing.md)
        .background(AppTheme.Colors.backgroundCard)
    }
    
    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        
        inputText = ""
        isInputFocused = false
        
        Task {
            await viewModel.sendMessage(text)
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack(alignment: .top, spacing: AppTheme.Spacing.sm) {
            if message.role == .assistant {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(AppTheme.Colors.primary)
                    .frame(width: 32, height: 32)
                    .background(AppTheme.Colors.primary.opacity(0.2))
                    .cornerRadius(AppTheme.CornerRadius.full)
            }
            
            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: AppTheme.Spacing.xs) {
                Text(message.content)
                    .font(AppTheme.Typography.body)
                    .foregroundColor(message.role == .user ? .white : AppTheme.Colors.textPrimary)
                    .padding(AppTheme.Spacing.md)
                    .background(
                        message.role == .user
                            ? AppTheme.Colors.primary
                            : AppTheme.Colors.backgroundCard
                    )
                    .cornerRadius(AppTheme.CornerRadius.lg)
                
                // Citations (D2)
                if !message.citations.isEmpty {
                    citationsView(message.citations)
                }
            }
            .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)
            
            if message.role == .user {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(AppTheme.Colors.textTertiary)
                    .frame(width: 32, height: 32)
            }
        }
    }
    
    private func citationsView(_ citations: [Citation]) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
            ForEach(citations) { citation in
                HStack(spacing: 4) {
                    Image(systemName: "link")
                        .font(.caption2)
                    
                    Text(citation.title)
                        .font(AppTheme.Typography.caption)
                        .lineLimit(1)
                }
                .foregroundColor(AppTheme.Colors.info)
            }
        }
        .padding(.leading, AppTheme.Spacing.sm)
    }
}

#Preview {
    ChatView()
}
