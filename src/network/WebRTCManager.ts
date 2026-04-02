/**
 * =============================================================================
 * 永夜熵纪 - WebRTC 网络管理器
 * WebRTC Manager for LAN Synchronization
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';
import { logger } from '@/core/utils/Logger';

/** 连接状态 */
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'failed';

/** 对等节点信息 */
export interface Peer {
  id: string;
  name: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  state: ConnectionState;
}

/** 消息类型 */
export type MessageType = 
  | 'sync:full'
  | 'sync:delta'
  | 'sync:request'
  | 'event:action'
  | 'event:chat'
  | 'system:ping'
  | 'system:pong';

/** 网络消息 */
export interface NetworkMessage {
  type: MessageType;
  payload: unknown;
  timestamp: number;
  senderId: string;
}

/** WebRTC 配置 */
export interface WebRTCConfig {
  /** ICE 服务器 */
  iceServers: RTCIceServer[];
  /** 数据通道配置 */
  dataChannelConfig: RTCDataChannelInit;
  /** 连接超时 (ms) */
  connectionTimeout: number;
  /** 重连间隔 (ms) */
  reconnectInterval: number;
  /** 最大重连次数 */
  maxReconnectAttempts: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  dataChannelConfig: {
    ordered: true,
    maxRetransmits: 3,
  },
  connectionTimeout: 30000,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
};

/** WebRTC 事件 */
export interface WebRTCEvents {
  /** 新节点连接 */
  peerConnected: (peer: Peer) => void;
  /** 节点断开 */
  peerDisconnected: (peerId: string) => void;
  /** 收到消息 */
  message: (message: NetworkMessage) => void;
  /** 连接状态变化 */
  stateChange: (state: ConnectionState) => void;
  /** 错误 */
  error: (error: Error) => void;
  /** ICE 候选就绪 */
  iceCandidate: (candidate: RTCIceCandidate, peerId: string) => void;
  /** SDP 就绪 */
  sdp: (sdp: RTCSessionDescriptionInit, peerId: string) => void;
}

/**
 * WebRTC 管理器
 * 
 * 管理局域网 P2P 连接
 */
export class WebRTCManager extends EventEmitter<WebRTCEvents> {
  private config: WebRTCConfig;
  private localId: string;
  private localName: string;
  
  // 节点映射
  private peers: Map<string, Peer> = new Map();
  
  // 状态
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts: Map<string, number> = new Map();

  constructor(config: Partial<WebRTCConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.localId = this.generateId();
    this.localName = `Player-${this.localId.slice(0, 4)}`;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return crypto.randomUUID?.() || 
      `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取本地 ID
   */
  public getLocalId(): string {
    return this.localId;
  }

  /**
   * 获取本地名称
   */
  public getLocalName(): string {
    return this.localName;
  }

  /**
   * 设置本地名称
   */
  public setLocalName(name: string): void {
    this.localName = name;
  }

  /**
   * 创建连接（主动方）
   */
  public async createConnection(peerId: string): Promise<RTCPeerConnection> {
    const connection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // 创建数据通道
    const dataChannel = connection.createDataChannel(
      'sync',
      this.config.dataChannelConfig
    );

    this.setupDataChannel(dataChannel, peerId);
    this.setupConnectionHandlers(connection, peerId);

    // 创建 Offer
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    // 创建节点记录
    const peer: Peer = {
      id: peerId,
      name: `Peer-${peerId.slice(0, 4)}`,
      connection,
      dataChannel,
      state: 'connecting',
    };

    this.peers.set(peerId, peer);
    this.updateState();

    return connection;
  }

  /**
   * 接受连接（被动方）
   */
  public async acceptConnection(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const connection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.setupConnectionHandlers(connection, peerId);

    // 设置远程描述
    await connection.setRemoteDescription(new RTCSessionDescription(offer));

    // 创建 Answer
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    // 创建节点记录
    const peer: Peer = {
      id: peerId,
      name: `Peer-${peerId.slice(0, 4)}`,
      connection,
      dataChannel: null,
      state: 'connecting',
    };

    this.peers.set(peerId, peer);
    this.updateState();

    return answer;
  }

  /**
   * 处理 Answer
   */
  public async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * 添加 ICE 候选
   */
  public async addIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * 设置连接处理器
   */
  private setupConnectionHandlers(connection: RTCPeerConnection, peerId: string): void {
    // ICE 候选
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', event.candidate, peerId);
      }
    };

    // 连接状态变化
    connection.onconnectionstatechange = () => {
      const peer = this.peers.get(peerId);
      if (!peer) return;

      const state = connection.connectionState;
      
      switch (state) {
        case 'connected':
          peer.state = 'connected';
          this.reconnectAttempts.delete(peerId);
          this.emit('peerConnected', peer);
          break;
        case 'disconnected':
        case 'failed':
          peer.state = 'failed';
          this.handleDisconnection(peerId);
          break;
        case 'closed':
          this.removePeer(peerId);
          break;
      }

      this.updateState();
    };

    // 数据通道（被动方）
    connection.ondatachannel = (event) => {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.dataChannel = event.channel;
        this.setupDataChannel(event.channel, peerId);
      }
    };
  }

  /**
   * 设置数据通道
   */
  private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => {
      logger.info('WebRTC', `Data channel opened with ${peerId}`);
      
      // 发送同步请求
      this.send(peerId, {
        type: 'sync:request',
        payload: { id: this.localId, name: this.localName },
        timestamp: Date.now(),
        senderId: this.localId,
      });
    };

    channel.onclose = () => {
      logger.info('WebRTC', `Data channel closed with ${peerId}`);
    };

    channel.onmessage = (event) => {
      try {
        const message: NetworkMessage = JSON.parse(event.data);
        this.emit('message', message);
      } catch (error) {
        logger.error('WebRTC', 'Failed to parse message', error as Error);
      }
    };

    channel.onerror = (error) => {
      logger.error('WebRTC', `Data channel error with ${peerId}`, new Error(String(error)));
      this.emit('error', new Error(`Data channel error: ${error}`));
    };
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(peerId: string): void {
    const attempts = this.reconnectAttempts.get(peerId) || 0;
    
    if (attempts < this.config.maxReconnectAttempts) {
      this.reconnectAttempts.set(peerId, attempts + 1);
      
      logger.info('WebRTC', `Attempting reconnect (${attempts + 1}/${this.config.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.createConnection(peerId);
      }, this.config.reconnectInterval);
    } else {
      this.removePeer(peerId);
    }
  }

  /**
   * 移除节点
   */
  private removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    
    if (peer) {
      peer.dataChannel?.close();
      peer.connection.close();
      this.peers.delete(peerId);
      this.reconnectAttempts.delete(peerId);
      this.emit('peerDisconnected', peerId);
    }

    this.updateState();
  }

  /**
   * 发送消息
   */
  public send(peerId: string, message: NetworkMessage): boolean {
    const peer = this.peers.get(peerId);
    
    if (!peer?.dataChannel || peer.dataChannel.readyState !== 'open') {
      return false;
    }

    try {
      peer.dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('WebRTC', `Failed to send message to ${peerId}`, error as Error);
      return false;
    }
  }

  /**
   * 广播消息
   */
  public broadcast(message: Omit<NetworkMessage, 'senderId' | 'timestamp'>): void {
    const fullMessage: NetworkMessage = {
      ...message,
      senderId: this.localId,
      timestamp: Date.now(),
    };

    for (const peerId of this.peers.keys()) {
      this.send(peerId, fullMessage);
    }
  }

  /**
   * 获取所有节点
   */
  public getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  /**
   * 获取节点
   */
  public getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  /**
   * 获取连接状态
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * 更新连接状态
   */
  private updateState(): void {
    const oldState = this.state;
    
    if (this.peers.size === 0) {
      this.state = 'disconnected';
    } else {
      const states = Array.from(this.peers.values()).map(p => p.state);
      
      if (states.every(s => s === 'connected')) {
        this.state = 'connected';
      } else if (states.some(s => s === 'failed')) {
        this.state = 'failed';
      } else {
        this.state = 'connecting';
      }
    }

    if (oldState !== this.state) {
      this.emit('stateChange', this.state);
    }
  }

  /**
   * 断开所有连接
   */
  public disconnect(): void {
    for (const peerId of this.peers.keys()) {
      this.removePeer(peerId);
    }

    this.state = 'disconnected';
    this.emit('stateChange', this.state);
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.disconnect();
    this.removeAllListeners();
  }
}

export default WebRTCManager;
