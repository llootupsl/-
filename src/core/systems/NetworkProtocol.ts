/**
 * =============================================================================
 * 永夜熵纪 - 网络协议层
 * Network Protocol for P2P Communication
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';

/** 消息类型 */
export enum MessageType {
  // 节点管理
  NODE_ANNOUNCE = 'node:announce',
  NODE_DISCOVER = 'node:discover',
  NODE_LEAVE = 'node:leave',
  NODE_PING = 'node:ping',
  NODE_PONG = 'node:pong',
  
  // 数据同步
  DATA_REQUEST = 'data:request',
  DATA_RESPONSE = 'data:response',
  DATA_BROADCAST = 'data:broadcast',
  DATA_DELTA = 'data:delta',
  
  // 共识
  CONSENSUS_PROPOSE = 'consensus:propose',
  CONSENSUS_VOTE = 'consensus:vote',
  CONSENSUS_COMMIT = 'consensus:commit',
  
  // 游戏
  GAME_ACTION = 'game:action',
  GAME_STATE = 'game:state',
  GAME_EVENT = 'game:event',
  
  // 系统
  SYSTEM_ERROR = 'system:error',
  SYSTEM_ACK = 'system:ack',
}

/** 网络消息 */
export interface NetworkProtocolMessage {
  type: MessageType;
  id: string;
  timestamp: number;
  sender: string;
  recipient?: string;
  payload: unknown;
  signature?: string;
  ttl?: number;
}

/** 节点信息 */
export interface NetworkNode {
  id: string;
  address: string;
  port: number;
  lastSeen: number;
  latency: number;
  capabilities: string[];
}

/** 协议配置 */
export interface ProtocolConfig {
  /** 消息超时 (ms) */
  messageTimeout: number;
  /** 最大 TTL */
  maxTTL: number;
  /** 心跳间隔 (ms) */
  heartbeatInterval: number;
  /** 节点超时 (ms) */
  nodeTimeout: number;
  /** 最大消息大小 (bytes) */
  maxMessageSize: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: ProtocolConfig = {
  messageTimeout: 30000,
  maxTTL: 10,
  heartbeatInterval: 30000,
  nodeTimeout: 120000,
  maxMessageSize: 1024 * 1024, // 1MB
};

/** 协议事件 */
export interface ProtocolEvents {
  /** 消息接收 */
  message: (message: NetworkProtocolMessage) => void;
  /** 节点加入 */
  nodeJoined: (node: NetworkNode) => void;
  /** 节点离开 */
  nodeLeft: (nodeId: string) => void;
  /** 错误 */
  error: (error: Error) => void;
}

/**
 * 网络协议管理器
 */
export class NetworkProtocol extends EventEmitter<ProtocolEvents> {
  private config: ProtocolConfig;
  private localId: string;
  private nodes: Map<string, NetworkNode> = new Map();
  private pendingMessages: Map<string, {
    message: NetworkProtocolMessage;
    resolve: (response: NetworkProtocolMessage) => void;
    reject: (error: Error) => void;
    timeout: number;
  }> = new Map();
  private messageCounter: number = 0;
  private handlers: Map<MessageType, (msg: NetworkProtocolMessage) => void> = new Map();

  constructor(config: Partial<ProtocolConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.localId = this.generateId();
    this.setupDefaultHandlers();
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `node-${crypto.randomUUID?.() || Date.now()}`;
  }

  /**
   * 获取本地 ID
   */
  public getLocalId(): string {
    return this.localId;
  }

  /**
   * 设置默认处理器
   */
  private setupDefaultHandlers(): void {
    // Ping/Pong
    this.handlers.set(MessageType.NODE_PING, (msg) => {
      this.sendPong(msg.sender, msg.id);
    });

    // 节点公告
    this.handlers.set(MessageType.NODE_ANNOUNCE, (msg) => {
      const node = msg.payload as NetworkNode;
      this.addNode(node);
    });

    // 节点离开
    this.handlers.set(MessageType.NODE_LEAVE, (msg) => {
      this.removeNode(msg.sender);
    });

    // ACK
    this.handlers.set(MessageType.SYSTEM_ACK, (msg) => {
      const pending = this.pendingMessages.get(msg.payload as string);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(msg);
        this.pendingMessages.delete(msg.payload as string);
      }
    });
  }

  /**
   * 添加节点
   */
  public addNode(node: NetworkNode): void {
    const existing = this.nodes.get(node.id);
    
    if (existing) {
      existing.lastSeen = Date.now();
    } else {
      this.nodes.set(node.id, { ...node, lastSeen: Date.now() });
      this.emit('nodeJoined', node);
    }
  }

  /**
   * 移除节点
   */
  public removeNode(nodeId: string): void {
    if (this.nodes.has(nodeId)) {
      this.nodes.delete(nodeId);
      this.emit('nodeLeft', nodeId);
    }
  }

  /**
   * 获取节点
   */
  public getNode(nodeId: string): NetworkNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * 获取所有节点
   */
  public getNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 创建消息
   */
  public createMessage(
    type: MessageType,
    payload: unknown,
    recipient?: string
  ): NetworkProtocolMessage {
    this.messageCounter++;
    
    return {
      type,
      id: `${this.localId}-${Date.now()}-${this.messageCounter}`,
      timestamp: Date.now(),
      sender: this.localId,
      recipient,
      payload,
      ttl: this.config.maxTTL,
    };
  }

  /**
   * 发送消息
   */
  public async send(
    type: MessageType,
    payload: unknown,
    recipient?: string
  ): Promise<NetworkProtocolMessage> {
    const message = this.createMessage(type, payload, recipient);
    
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pendingMessages.delete(message.id);
        reject(new Error('Message timeout'));
      }, this.config.messageTimeout);

      this.pendingMessages.set(message.id, {
        message,
        resolve,
        reject,
        timeout,
      });

      // 实际发送由外部实现
      this.emit('message', message);
    });
  }

  /**
   * 广播消息
   */
  public broadcast(type: MessageType, payload: unknown): void {
    const message = this.createMessage(type, payload);
    message.ttl = this.config.maxTTL;
    
    this.emit('message', message);
  }

  /**
   * 处理接收的消息
   */
  public receive(rawMessage: string): void {
    try {
      const message: NetworkProtocolMessage = JSON.parse(rawMessage);

      // 验证消息
      if (!this.validateMessage(message)) {
        this.emit('error', new Error('Invalid message'));
        return;
      }

      // 检查 TTL
      if (message.ttl !== undefined && message.ttl <= 0) {
        return;
      }

      // 查找处理器
      const handler = this.handlers.get(message.type);
      if (handler) {
        handler(message);
      }

      // 发出通用事件
      this.emit('message', message);
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 验证消息
   */
  private validateMessage(message: NetworkProtocolMessage): boolean {
    if (!message.type || !message.id || !message.sender) {
      return false;
    }

    if (message.timestamp > Date.now() + 60000) {
      return false; // 来自未来
    }

    return true;
  }

  /**
   * 发送 Pong
   */
  private sendPong(recipient: string, pingId: string): void {
    const message = this.createMessage(
      MessageType.NODE_PONG,
      { pingId },
      recipient
    );
    this.emit('message', message);
  }

  /**
   * Ping 节点
   */
  public async ping(nodeId: string): Promise<number> {
    const start = Date.now();
    
    await this.send(MessageType.NODE_PING, { timestamp: start }, nodeId);
    
    const node = this.nodes.get(nodeId);
    if (node) {
      node.latency = Date.now() - start;
    }
    
    return Date.now() - start;
  }

  /**
   * 注册消息处理器
   */
  public registerHandler(
    type: MessageType,
    handler: (msg: NetworkProtocolMessage) => void
  ): void {
    this.handlers.set(type, handler);
  }

  /**
   * 移除消息处理器
   */
  public removeHandler(type: MessageType): void {
    this.handlers.delete(type);
  }

  /**
   * 请求/响应模式
   */
  public async request<T>(
    recipient: string,
    type: MessageType,
    payload: unknown,
    responseType: MessageType
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const message = this.createMessage(type, payload, recipient);
      
      const timeout = window.setTimeout(() => {
        this.handlers.delete(responseType);
        reject(new Error('Request timeout'));
      }, this.config.messageTimeout);

      const responseHandler = (msg: NetworkProtocolMessage) => {
        if (msg.sender === recipient && msg.payload) {
          clearTimeout(timeout);
          this.handlers.delete(responseType);
          resolve(msg.payload as T);
        }
      };

      this.handlers.set(responseType, responseHandler);
      this.emit('message', message);
    });
  }

  /**
   * 清理过期节点
   */
  public cleanupExpiredNodes(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, node] of this.nodes) {
      if (now - node.lastSeen > this.config.nodeTimeout) {
        this.removeNode(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    nodeCount: number;
    pendingCount: number;
    averageLatency: number;
  } {
    const latencies = Array.from(this.nodes.values())
      .map(n => n.latency)
      .filter(l => l > 0);

    return {
      nodeCount: this.nodes.size,
      pendingCount: this.pendingMessages.size,
      averageLatency: latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0,
    };
  }

  /**
   * 销毁
   */
  public destroy(): void {
    // 清理超时
    for (const pending of this.pendingMessages.values()) {
      clearTimeout(pending.timeout);
    }
    
    this.pendingMessages.clear();
    this.nodes.clear();
    this.handlers.clear();
    this.removeAllListeners();
  }
}

export default NetworkProtocol;
