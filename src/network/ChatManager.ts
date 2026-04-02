/**
 * 实时通信系统
 * 支持 WebSocket 和 WebTransport
 */

import type { EntityId } from '@/core/types';
import { logger } from '../core/utils/Logger';

/**
 * 消息类型
 */
export enum MessageType {
  CHAT = 'chat',
  SYSTEM = 'system',
  TRADE = 'trade',
  EVENT = 'event',
  SYNC = 'sync',
  COMMAND = 'command',
}

/**
 * 消息
 */
export interface ChatMessage {
  id: EntityId;
  type: MessageType;
  senderId: EntityId;
  senderName: string;
  content: string;
  timestamp: number;
  channel?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 连接状态
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * 聊天管理器
 */
export class ChatManager {
  private static instance: ChatManager | null = null;
  private messages: ChatMessage[] = [];
  private channels: Map<string, ChatMessage[]> = new Map();
  private listeners: Map<string, ((message: ChatMessage) => void)[]> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private socket: WebSocket | null = null;
  private transport: WebTransport | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {}

  public static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  /**
   * 连接到 WebSocket 服务器
   */
  public async connect(url: string): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          this.setConnectionState(ConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          logger.info('Chat', 'Connected to WebSocket');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ChatMessage;
            this.handleMessage(message);
          } catch (error) {
            logger.error('Chat', 'Failed to parse message', error as Error);
          }
        };

        this.socket.onclose = (event) => {
          logger.info('Chat', `WebSocket closed: ${event.code}`);
          this.setConnectionState(ConnectionState.DISCONNECTED);
          this.attemptReconnect(url);
        };

        this.socket.onerror = (error) => {
          logger.error('Chat', 'WebSocket error', new Error(String(error)));
          this.setConnectionState(ConnectionState.ERROR);
          reject(error);
        };
      } catch (error) {
        this.setConnectionState(ConnectionState.ERROR);
        reject(error);
      }
    });
  }

  /**
   * 连接到 WebTransport
   */
  public async connectTransport(url: string): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    try {
      this.transport = new WebTransport(url, {
        allowPooling: true,
      });

      await this.transport.ready;
      this.setConnectionState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;

      // 监听数据报
      const reader = this.transport.datagrams.readable.getReader();
      this.readTransportMessages(reader);

      console.log('[Chat] Connected to WebTransport');
    } catch (error) {
      console.error('[Chat] WebTransport connection failed:', error);
      this.setConnectionState(ConnectionState.ERROR);
      throw error;
    }
  }

  /**
   * 读取 WebTransport 消息
   */
  private async readTransportMessages(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const message = JSON.parse(text) as ChatMessage;
        this.handleMessage(message);
      } catch (error) {
        logger.error('Chat', 'Failed to read transport message', error as Error);
      }
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }

    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  /**
   * 尝试重连
   */
  private async attemptReconnect(url: string): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Chat', 'Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState(ConnectionState.RECONNECTING);

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    logger.info('Chat', `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect(url);
      } catch (error) {
        logger.error('Chat', 'Reconnect failed', error as Error);
      }
    }, delay);
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: ChatMessage): void {
    // 存储消息
    this.messages.push(message);

    // 存储到频道
    if (message.channel) {
      if (!this.channels.has(message.channel)) {
        this.channels.set(message.channel, []);
      }
      this.channels.get(message.channel)!.push(message);
    }

    // 触发监听器
    const channelListeners = this.listeners.get(message.channel || 'global') || [];
    const allListeners = this.listeners.get('*') || [];

    [...channelListeners, ...allListeners].forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        logger.error('Chat', 'Listener error', error as Error);
      }
    });
  }

  /**
   * 发送消息
   */
  public send(
    content: string,
    type: MessageType = MessageType.CHAT,
    channel?: string,
    metadata?: Record<string, unknown>
  ): void {
    const message: ChatMessage = {
      id: crypto.randomUUID() as EntityId,
      type,
      senderId: 'system' as EntityId,
      senderName: 'System',
      content,
      timestamp: Date.now(),
      channel,
      metadata,
    };

    // 发送到服务器
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else if (this.transport && this.transport.datagrams.writable) {
      const writer = this.transport.datagrams.writable.getWriter();
      writer.write(new TextEncoder().encode(JSON.stringify(message)));
      writer.releaseLock();
    }

    // 本地也添加消息（如果是系统消息）
    if (type === MessageType.SYSTEM) {
      this.handleMessage(message);
    }
  }

  /**
   * 订阅频道
   */
  public subscribe(channel: string, callback: (message: ChatMessage) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(callback);

    return () => {
      const listeners = this.listeners.get(channel);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 订阅所有消息
   */
  public subscribeAll(callback: (message: ChatMessage) => void): () => void {
    if (!this.listeners.has('*')) {
      this.listeners.set('*', []);
    }
    this.listeners.get('*')!.push(callback);

    return () => {
      const listeners = this.listeners.get('*');
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 获取消息历史
   */
  public getMessages(limit: number = 100, channel?: string): ChatMessage[] {
    if (channel) {
      return this.channels.get(channel)?.slice(-limit) || [];
    }
    return this.messages.slice(-limit);
  }

  /**
   * 获取连接状态
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 设置连接状态
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
  }

  /**
   * 清除消息
   */
  public clear(): void {
    this.messages = [];
    this.channels.clear();
  }
}

/**
 * 导出单例
 */
export const chatManager = ChatManager.getInstance();
export default chatManager;
