/**
 * Message Deduplicator for Max Plan Dialog
 * 
 * 防止消息重复显示的工具函数
 * 使用 ID 去重和内容哈希双重机制
 * 
 * @module lib/max/message-deduplicator
 */

import type { ChatMessage } from '@/types/max-plan';

/**
 * 计算消息内容哈希
 * 使用内容前50字符 + 长度作为简单哈希
 */
export function hashContent(content: string): string {
  const normalized = content.trim().toLowerCase();
  return `${normalized.slice(0, 50)}_${normalized.length}`;
}

/**
 * 消息去重器类
 */
export class MessageDeduplicator {
  /** 已显示消息的 ID 集合 */
  private displayedIds: Set<string> = new Set();
  
  /** 已显示消息的内容哈希集合（用于检测连续重复） */
  private recentContentHashes: string[] = [];
  
  /** 保留最近 N 条消息的哈希用于连续重复检测 */
  private readonly maxRecentHashes = 5;

  /**
   * 检查消息是否重复
   * @param message - 要检查的消息
   * @returns 如果是重复消息返回 true
   */
  isDuplicate(message: ChatMessage): boolean {
    // 1. 检查 ID 是否已存在
    if (this.displayedIds.has(message.id)) {
      return true;
    }

    // 2. 检查内容是否与最近消息重复（连续重复检测）
    const contentHash = hashContent(message.content);
    if (this.recentContentHashes.includes(contentHash)) {
      return true;
    }

    return false;
  }

  /**
   * 标记消息为已显示
   * @param message - 已显示的消息
   */
  markDisplayed(message: ChatMessage): void {
    // 记录 ID
    this.displayedIds.add(message.id);

    // 记录内容哈希（保持最近 N 条）
    const contentHash = hashContent(message.content);
    this.recentContentHashes.push(contentHash);
    
    if (this.recentContentHashes.length > this.maxRecentHashes) {
      this.recentContentHashes.shift();
    }
  }

  /**
   * 重置去重状态
   */
  reset(): void {
    this.displayedIds.clear();
    this.recentContentHashes = [];
  }

  /**
   * 获取已显示的消息 ID 数量
   */
  getDisplayedCount(): number {
    return this.displayedIds.size;
  }
}

/**
 * 过滤重复消息
 * @param messages - 消息数组
 * @param deduplicator - 去重器实例
 * @returns 过滤后的非重复消息数组
 */
export function filterDuplicateMessages(
  messages: ChatMessage[],
  deduplicator: MessageDeduplicator
): ChatMessage[] {
  const filtered: ChatMessage[] = [];
  
  for (const msg of messages) {
    if (!deduplicator.isDuplicate(msg)) {
      deduplicator.markDisplayed(msg);
      filtered.push(msg);
    }
  }
  
  return filtered;
}

/**
 * 检查消息数组中是否有连续重复
 * @param messages - 消息数组
 * @returns 如果有连续重复返回 true
 */
export function hasConsecutiveDuplicates(messages: ChatMessage[]): boolean {
  for (let i = 1; i < messages.length; i++) {
    const prevHash = hashContent(messages[i - 1].content);
    const currHash = hashContent(messages[i].content);
    if (prevHash === currHash) {
      return true;
    }
  }
  return false;
}

/**
 * 检查消息数组中所有 ID 是否唯一
 * @param messages - 消息数组
 * @returns 如果所有 ID 唯一返回 true
 */
export function allIdsUnique(messages: ChatMessage[]): boolean {
  const ids = new Set(messages.map(m => m.id));
  return ids.size === messages.length;
}
