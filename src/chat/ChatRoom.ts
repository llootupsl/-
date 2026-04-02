/**
 * =============================================================================
 * 聊天管理器
 * =============================================================================
 */

import { EventEmitter } from '../core/EventEmitter';

export interface ChatMessage {
  id: string;
  type: 'text' | 'system' | 'divine' | 'entity' | 'ai';
  sender: string;
  avatar?: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ChatRoomConfig {
  maxMessages: number;
  retentionDays: number;
  enableEmoji: boolean;
  enableMarkdown: boolean;
}

const defaultConfig: ChatRoomConfig = {
  maxMessages: 500,
  retentionDays: 7,
  enableEmoji: true,
  enableMarkdown: true,
};

export class ChatRoom extends EventEmitter {
  private messages: ChatMessage[] = [];
  private config: ChatRoomConfig;
  private broadcastChannel: BroadcastChannel | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private userId: string;
  private userName: string;
  private userAvatar: string = '👤';

  constructor(userId: string, userName: string, config: Partial<ChatRoomConfig> = {}) {
    super();
    this.userId = userId;
    this.userName = userName;
    this.config = { ...defaultConfig, ...config };
    
    this.initBroadcastChannel();
  }

  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('omnis-chat');
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };
    }
  }

  private handleIncomingMessage(message: ChatMessage): void {
    if (message.sender !== this.userId) {
      this.messages.push(message);
      this.emit('message', message);
      this.pruneMessages();
    }
  }

  send(content: string, type: ChatMessage['type'] = 'text'): ChatMessage {
    const message: ChatMessage = {
      id: this.generateId(),
      type,
      sender: this.userId,
      avatar: this.userAvatar,
      content,
      timestamp: Date.now(),
    };

    this.messages.push(message);
    this.emit('message', message);
    this.broadcastChannel?.postMessage(message);
    this.pruneMessages();

    return message;
  }

  sendSystem(content: string): ChatMessage {
    return this.send(content, 'system');
  }

  sendDivine(content: string): ChatMessage {
    return this.send(content, 'divine');
  }

  sendEntity(sender: string, content: string, avatar?: string): ChatMessage {
    const message: ChatMessage = {
      id: this.generateId(),
      type: 'entity',
      sender,
      avatar,
      content,
      timestamp: Date.now(),
    };
    this.messages.push(message);
    this.emit('message', message);
    this.broadcastChannel?.postMessage(message);
    return message;
  }

  sendAI(content: string): ChatMessage {
    return this.sendEntity('AI助手', content, '🤖');
  }

  getMessages(limit?: number): ChatMessage[] {
    if (limit) {
      return this.messages.slice(-limit);
    }
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
    this.emit('clear');
  }

  private pruneMessages(): void {
    if (this.messages.length > this.config.maxMessages) {
      this.messages = this.messages.slice(-this.config.maxMessages);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserInfo(name: string, avatar: string): void {
    this.userName = name;
    this.userAvatar = avatar;
  }

  destroy(): void {
    this.broadcastChannel?.close();
    this.peers.forEach(pc => pc.close());
    this.peers.clear();
    this.messages = [];
  }
}
