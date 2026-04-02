/**
 * =============================================================================
 * 消息队列 - 离线消息缓存
 * =============================================================================
 */

import { ChatMessage } from './ChatRoom';

const STORAGE_KEY = 'omnis-chat-queue';
const MAX_QUEUE_SIZE = 100;

export class MessageQueue {
  private queue: ChatMessage[] = [];
  private isProcessing = false;
  private onFlush: ((messages: ChatMessage[]) => void) | null = null;

  constructor() {
    this.loadFromStorage();
  }

  enqueue(message: ChatMessage): void {
    this.queue.push(message);
    this.prune();
    this.saveToStorage();
  }

  dequeue(): ChatMessage | undefined {
    const message = this.queue.shift();
    this.saveToStorage();
    return message;
  }

  peek(): ChatMessage | undefined {
    return this.queue[0];
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  setOnFlush(callback: (messages: ChatMessage[]) => void): void {
    this.onFlush = callback;
  }

  async flush(): Promise<void> {
    if (this.isProcessing || this.isEmpty()) return;
    
    this.isProcessing = true;
    
    try {
      const messages = [...this.queue];
      if (messages.length > 0 && this.onFlush) {
        await this.onFlush(messages);
      }
      this.clear();
    } finally {
      this.isProcessing = false;
    }
  }

  private prune(): void {
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('[MessageQueue] Save to storage failed:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.warn('[MessageQueue] Load from storage failed:', error);
      this.queue = [];
    }
  }
}
