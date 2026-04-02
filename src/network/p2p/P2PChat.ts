/**
 * =============================================================================
 * P2P 聊天 - 空间折跃内的实时通讯
 * 支持文字、表情、文件传输
 * =============================================================================
 */

import { EventEmitter } from 'events';
import { logger } from '../../core/utils/Logger';

export type MessageType = 'text' | 'emoji' | 'file' | 'system' | 'image';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  status: MessageStatus;
  replyTo?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  createdAt: number;
  lastMessage?: ChatMessage;
  unreadCount: Map<string, number>;
}

export interface P2PChatCallbacks {
  onMessage?: (message: ChatMessage) => void;
  onMessageStatus?: (messageId: string, status: MessageStatus) => void;
  onTyping?: (peerId: string, isTyping: boolean) => void;
  onPresence?: (peerId: string, isOnline: boolean) => void;
}

export interface P2PChatConfig {
  maxMessageLength?: number;
  typingTimeout?: number;
  deliveryTimeout?: number;
}

const defaultConfig: Required<P2PChatConfig> = {
  maxMessageLength: 10000,
  typingTimeout: 3000,
  deliveryTimeout: 5000,
};

/**
 * P2P 聊天引擎
 */
export class P2PChat extends EventEmitter {
  private peerId: string;
  private peerName: string;
  private config: Required<P2PChatConfig>;
  private messages: Map<string, ChatMessage[]> = new Map(); // roomId -> messages
  private rooms: Map<string, ChatRoom> = new Map();
  private currentRoom: string | null = null;
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private deliveryTimers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: P2PChatCallbacks;
  private sendHandler: ((peerId: string, type: string, payload: unknown) => void) | null = null;

  constructor(peerId: string, peerName: string, callbacks: P2PChatCallbacks, config?: P2PChatConfig) {
    super();
    this.peerId = peerId;
    this.peerName = peerName;
    this.config = { ...defaultConfig, ...config };
    this.callbacks = callbacks;
  }

  /**
   * 设置发送处理器（用于通过 SpaceWarp 发送）
   */
  public setSendHandler(handler: (peerId: string, type: string, payload: unknown) => void): void {
    this.sendHandler = handler;
  }

  /**
   * 处理接收到的消息
   */
  public handleIncomingMessage(data: {
    type: string;
    from: string;
    payload: unknown;
  }): void {
    if (data.type === 'chat-message') {
      const payload = data.payload as ChatMessagePayload;
      this.receiveMessage(payload);
    } else if (data.type === 'typing') {
      const payload = data.payload as { roomId: string; isTyping: boolean };
      this.callbacks.onTyping?.(data.from, payload.isTyping);
    } else if (data.type === 'message-status') {
      const payload = data.payload as { messageId: string; status: MessageStatus };
      this.updateMessageStatus(payload.messageId, payload.status);
    } else if (data.type === 'presence') {
      const payload = data.payload as { isOnline: boolean };
      this.callbacks.onPresence?.(data.from, payload.isOnline);
    }
  }

  /**
   * 创建聊天室
   */
  public createRoom(participantIds: string[]): ChatRoom {
    const room: ChatRoom = {
      id: crypto.randomUUID(),
      name: `Chat Room ${this.rooms.size + 1}`,
      participants: [...participantIds, this.peerId],
      createdAt: Date.now(),
      unreadCount: new Map(),
    };

    this.rooms.set(room.id, room);
    this.messages.set(room.id, []);

    // 初始化未读计数
    room.participants.forEach((pid) => {
      room.unreadCount.set(pid, 0);
    });

    this.emit('room-created', room);
    return room;
  }

  /**
   * 加入聊天室
   */
  public joinRoom(room: ChatRoom): void {
    this.rooms.set(room.id, room);
    if (!this.messages.has(room.id)) {
      this.messages.set(room.id, []);
    }
    this.currentRoom = room.id;
    this.emit('room-joined', room);
  }

  /**
   * 切换当前聊天室
   */
  public switchRoom(roomId: string): void {
    if (!this.rooms.has(roomId)) {
      console.warn('[P2PChat] Room not found:', roomId);
      return;
    }

    // 标记当前房间消息为已读
    if (this.currentRoom) {
      this.markRoomAsRead(this.currentRoom);
    }

    this.currentRoom = roomId;
    this.emit('room-switched', roomId);
  }

  /**
   * 发送消息
   */
  public sendMessage(content: string, type: MessageType = 'text', replyTo?: string): ChatMessage | null {
    if (!this.currentRoom) {
      logger.warn('P2PChat', 'No current room selected');
      return null;
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type,
      content: content.slice(0, this.config.maxMessageLength),
      senderId: this.peerId,
      senderName: this.peerName,
      timestamp: Date.now(),
      status: 'sending',
      replyTo,
    };

    // 保存到本地
    const roomMessages = this.messages.get(this.currentRoom)!;
    roomMessages.push(message);

    // 更新房间最后消息
    const room = this.rooms.get(this.currentRoom)!;
    room.lastMessage = message;

    // 发送网络消息
    this.sendChatMessage(message);

    // 设置投递超时
    this.setDeliveryTimer(message.id);

    this.emit('message-sent', message);
    return message;
  }

  /**
   * 发送聊天消息到网络
   */
  private sendChatMessage(message: ChatMessage): void {
    if (!this.sendHandler) {
      logger.warn('P2PChat', 'No send handler configured');
      return;
    }

    const payload: ChatMessagePayload = {
      id: message.id,
      type: message.type,
      content: message.content,
      senderId: message.senderId,
      senderName: message.senderName,
      timestamp: message.timestamp,
      roomId: this.currentRoom!,
      replyTo: message.replyTo,
      metadata: message.metadata,
    };

    this.sendHandler(this.currentRoom!, 'chat-message', payload);
  }

  /**
   * 设置投递定时器
   */
  private setDeliveryTimer(messageId: string): void {
    const timer = setTimeout(() => {
      this.updateMessageStatus(messageId, 'failed');
    }, this.config.deliveryTimeout);

    this.deliveryTimers.set(messageId, timer);
  }

  /**
   * 接收消息
   */
  private receiveMessage(payload: ChatMessagePayload): void {
    const message: ChatMessage = {
      id: payload.id,
      type: payload.type,
      content: payload.content,
      senderId: payload.senderId,
      senderName: payload.senderName,
      timestamp: payload.timestamp,
      status: 'delivered',
      replyTo: payload.replyTo,
      metadata: payload.metadata,
    };

    // 添加到对应房间
    const roomId = payload.roomId;
    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }

    const roomMessages = this.messages.get(roomId)!;
    const existingIndex = roomMessages.findIndex((m) => m.id === message.id);

    if (existingIndex === -1) {
      roomMessages.push(message);
    } else {
      roomMessages[existingIndex] = message;
    }

    // 更新房间
    const room = this.rooms.get(roomId);
    if (room) {
      room.lastMessage = message;

      // 增加未读计数
      if (roomId !== this.currentRoom) {
        const unread = room.unreadCount.get(this.peerId) || 0;
        room.unreadCount.set(this.peerId, unread + 1);
      }
    }

    // 发送已读回执
    this.sendStatusUpdate(message.id, 'delivered');

    // 清除发送超时
    const timer = this.deliveryTimers.get(payload.id);
    if (timer) {
      clearTimeout(timer);
      this.deliveryTimers.delete(payload.id);
    }

    this.callbacks.onMessage?.(message);
    this.emit('message-received', message);
  }

  /**
   * 更新消息状态
   */
  public updateMessageStatus(messageId: string, status: MessageStatus): void {
    let found = false;

    this.messages.forEach((messages) => {
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        msg.status = status;
        found = true;
      }
    });

    if (found) {
      this.callbacks.onMessageStatus?.(messageId, status);
      this.emit('status-changed', { messageId, status });
    }
  }

  /**
   * 发送状态更新
   */
  private sendStatusUpdate(messageId: string, status: MessageStatus): void {
    if (!this.sendHandler) return;

    this.sendHandler(this.currentRoom!, 'message-status', {
      messageId,
      status,
    });
  }

  /**
   * 发送输入中状态
   */
  public sendTypingIndicator(isTyping: boolean): void {
    if (!this.sendHandler || !this.currentRoom) return;

    this.sendHandler(this.currentRoom, 'typing', {
      roomId: this.currentRoom,
      isTyping,
    });

    // 清除之前的定时器
    const existingTimer = this.typingTimers.get(this.peerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    if (isTyping) {
      // 设置自动停止定时器
      const timer = setTimeout(() => {
        this.sendTypingIndicator(false);
      }, this.config.typingTimeout);
      this.typingTimers.set(this.peerId, timer);
    }
  }

  /**
   * 标记房间为已读
   */
  public markRoomAsRead(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.unreadCount.set(this.peerId, 0);
      this.emit('room-read', roomId);
    }
  }

  /**
   * 获取房间消息
   */
  public getMessages(roomId?: string): ChatMessage[] {
    const targetRoom = roomId || this.currentRoom;
    if (!targetRoom) return [];
    return this.messages.get(targetRoom) || [];
  }

  /**
   * 获取聊天室列表
   */
  public getRooms(): ChatRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 获取当前房间
   */
  public getCurrentRoom(): ChatRoom | null {
    return this.currentRoom ? this.rooms.get(this.currentRoom) || null : null;
  }

  /**
   * 获取未读总数
   */
  public getTotalUnreadCount(): number {
    let total = 0;
    this.rooms.forEach((room) => {
      total += room.unreadCount.get(this.peerId) || 0;
    });
    return total;
  }

  /**
   * 获取指定房间未读数
   */
  public getUnreadCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room?.unreadCount.get(this.peerId) || 0;
  }

  /**
   * 发送系统消息
   */
  public sendSystemMessage(content: string): ChatMessage | null {
    if (!this.currentRoom) return null;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'system',
      content,
      senderId: 'system',
      senderName: 'System',
      timestamp: Date.now(),
      status: 'sent',
    };

    const roomMessages = this.messages.get(this.currentRoom)!;
    roomMessages.push(message);

    this.emit('message-sent', message);
    return message;
  }

  /**
   * 发送表情消息
   */
  public sendEmoji(emoji: string): ChatMessage | null {
    return this.sendMessage(emoji, 'emoji');
  }

  /**
   * 发送图片（Base64）
   */
  public sendImage(base64Data: string, metadata?: Record<string, unknown>): ChatMessage | null {
    return this.sendMessage(base64Data, 'image', undefined);
  }

  /**
   * 发送文件引用
   */
  public sendFile(fileName: string, fileUrl: string, fileSize: number): ChatMessage | null {
    const content = JSON.stringify({ fileName, fileUrl, fileSize });
    return this.sendMessage(content, 'file');
  }

  /**
   * 回复消息
   */
  public replyMessage(content: string, replyToId: string): ChatMessage | null {
    return this.sendMessage(content, 'text', replyToId);
  }

  /**
   * 删除消息
   */
  public deleteMessage(messageId: string): void {
    this.messages.forEach((messages, roomId) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index !== -1) {
        messages.splice(index, 1);
        this.emit('message-deleted', { roomId, messageId });
      }
    });
  }

  /**
   * 获取消息统计
   */
  public getStats(): {
    roomCount: number;
    messageCount: number;
    totalUnread: number;
  } {
    let messageCount = 0;
    this.messages.forEach((msgs) => {
      messageCount += msgs.length;
    });

    return {
      roomCount: this.rooms.size,
      messageCount,
      totalUnread: this.getTotalUnreadCount(),
    };
  }

  /**
   * 导出聊天记录
   */
  public exportChat(roomId?: string): string {
    const exportData: {
      exportedAt: number;
      peerId: string;
      rooms: ChatRoom[];
      messages: Record<string, ChatMessage[]>;
    } = {
      exportedAt: Date.now(),
      peerId: this.peerId,
      rooms: Array.from(this.rooms.values()),
      messages: {},
    };

    if (roomId) {
      exportData.messages[roomId] = this.messages.get(roomId) || [];
    } else {
      this.messages.forEach((msgs, id) => {
        exportData.messages[id] = msgs;
      });
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 销毁
   */
  public destroy(): void {
    // 清除所有定时器
    this.typingTimers.forEach((timer) => clearTimeout(timer));
    this.deliveryTimers.forEach((timer) => clearTimeout(timer));
    this.typingTimers.clear();
    this.deliveryTimers.clear();

    this.messages.clear();
    this.rooms.clear();
    this.removeAllListeners();
  }
}

interface ChatMessagePayload {
  id: string;
  type: MessageType;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  roomId: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
}

export default P2PChat;
