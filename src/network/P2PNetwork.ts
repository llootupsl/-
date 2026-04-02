/**
 * =============================================================================
 * 永夜熵纪 - P2P网络模块
 * Peer-to-Peer Network with WebRTC and WebTransport
 * =============================================================================
 */

import { logger } from '../core/utils/Logger';

/** 消息类型 */
export enum MessageType {
  /** 握手 */
  HANDSHAKE = 'handshake',
  /** 握手响应 */
  HANDSHAKE_ACK = 'handshake_ack',
  /** 心跳 */
  HEARTBEAT = 'heartbeat',
  /** 同步请求 */
  SYNC_REQUEST = 'sync_request',
  /** 同步响应 */
  SYNC_RESPONSE = 'sync_response',
  /** 交易 */
  TRANSACTION = 'transaction',
  /** 区块 */
  BLOCK = 'block',
  /** 投票 */
  VOTE = 'vote',
  /** 通用消息 */
  MESSAGE = 'message',
  /** 举报 */
  REPORT = 'report',
}

/** 网络消息 */
export interface NetworkMessage {
  /** 消息ID */
  id: string;
  /** 类型 */
  type: MessageType;
  /** 发送者 */
  sender: string;
  /** 接收者（可选） */
  recipient?: string;
  /** 时间戳 */
  timestamp: number;
  /** 负载 */
  payload: any;
  /** 签名 */
  signature?: string;
}

/** 对等节点 */
export interface Peer {
  /** 节点ID */
  id: string;
  /** 地址 */
  address: string;
  /** 端口 */
  port: number;
  /** WebRTC连接 */
  connection?: RTCPeerConnection;
  /** 数据通道 */
  dataChannel?: RTCDataChannel;
  /** WebTransport会话 */
  transport?: WebTransport;
  /** 连接状态 */
  status: PeerStatus;
  /** 最后活跃时间 */
  lastActive: number;
  /** 信任度 */
  trust: number;
  /** 延迟 */
  latency: number;
}

/** 节点状态 */
export enum PeerStatus {
  /** 断开 */
  DISCONNECTED = 'disconnected',
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 已认证 */
  AUTHENTICATED = 'authenticated',
}

/** 共识消息 */
export interface ConsensusMessage {
  /** 轮次 */
  round: number;
  /** 步骤 */
  step: number;
  /** 类型 */
  type: 'propose' | 'prevote' | 'precommit' | 'commit';
  /** 提议者 */
  proposer: string;
  /** 区块哈希 */
  blockHash?: string;
  /** 签名 */
  signature?: string;
}

/** DHT节点信息 */
export interface DHTNode {
  /** 节点ID */
  nodeId: string;
  /** 地址 */
  address: string;
  /** 端口 */
  port: number;
  /** 最近的K个邻居 */
  kbucket: string[];
  /** 最后更新时间 */
  lastUpdated: number;
}

/** P2P网络类 */
export class P2PNetwork {
  private peers: Map<string, Peer> = new Map();
  private localPeerId: string;
  private messageHandlers: Map<MessageType, (msg: NetworkMessage) => void> = new Map();
  private consensusHandlers: Map<string, (msg: ConsensusMessage) => void> = new Map();
  private dht: DHTNode[] = [];
  private pendingConnections: Set<string> = new Set();
  private consensusState: Map<string, ConsensusState> = new Map();
  private stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
  ];
  private turnServer?: string;
  private webTransportSupported = false;
  private heartbeatInterval?: number;
  private syncInterval?: number;
  private config: P2PConfig;
  private onPeerConnected?: (peer: Peer) => void;
  private onPeerDisconnected?: (peerId: string) => void;
  private onMessage?: (msg: NetworkMessage) => void;

  constructor(config: Partial<P2PConfig> = {}) {
    this.localPeerId = crypto.randomUUID();
    this.config = {
      maxPeers: config.maxPeers ?? 50,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      syncInterval: config.syncInterval ?? 60000,
      maxMessageSize: config.maxMessageSize ?? 1024 * 1024, // 1MB
      relayEnabled: config.relayEnabled ?? true,
      dhtEnabled: config.dhtEnabled ?? true,
      consensusTimeout: config.consensusTimeout ?? 5000,
    };
    this.webTransportSupported = 'WebTransport' in window;
  }

  /**
   * 初始化网络
   */
  public async init(
    stunServer?: string,
    turnServer?: string,
    callbacks?: {
      onPeerConnected?: (peer: Peer) => void;
      onPeerDisconnected?: (peerId: string) => void;
      onMessage?: (msg: NetworkMessage) => void;
    }
  ): Promise<void> {
    if (stunServer) {
      this.stunServers.push(stunServer);
    }
    this.turnServer = turnServer;
    this.onPeerConnected = callbacks?.onPeerConnected;
    this.onPeerDisconnected = callbacks?.onPeerDisconnected;
    this.onMessage = callbacks?.onMessage;
    this.startHeartbeat();
    logger.info('P2P', `Initialized with peer ID: ${this.localPeerId}`);
    logger.info('P2P', `WebTransport supported: ${this.webTransportSupported}`);
  }

  /**
   * 创建WebRTC连接
   */
  public async createConnection(peerAddress: string): Promise<RTCPeerConnection | null> {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: this.stunServers },
        ...(this.turnServer ? [{ urls: this.turnServer }] : []),
      ],
    };

    const pc = new RTCPeerConnection(config);

    // 创建数据通道
    const channel = pc.createDataChannel('data', {
      ordered: true,
      maxRetransmits: 3,
    });
    this.setupDataChannel(channel, peerAddress);

    // 设置ICE候选处理
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(peerAddress, event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.updatePeerStatus(peerAddress, PeerStatus.CONNECTED);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.updatePeerStatus(peerAddress, PeerStatus.DISCONNECTED);
        this.onPeerDisconnected?.(peerAddress);
      }
    };

    return pc;
  }

  /**
   * 接收WebRTC连接
   */
  public async acceptConnection(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: this.stunServers },
        ...(this.turnServer ? [{ urls: this.turnServer }] : []),
      ],
    };

    const pc = new RTCPeerConnection(config);

    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, 'unknown');
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.debug('P2P', 'ICE candidate generated');
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return answer;
  }

  /**
   * 设置数据通道
   */
  private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => {
      logger.info('P2P', `Data channel opened with ${peerId}`);
      const peer: Peer = {
        id: peerId,
        address: '',
        port: 0,
        connection: undefined,
        dataChannel: channel,
        status: PeerStatus.CONNECTED,
        lastActive: Date.now(),
        trust: 50,
        latency: 0,
      };
      this.peers.set(peerId, peer);
      this.sendHandshake(peerId);
      this.onPeerConnected?.(peer);
    };

    channel.onmessage = (event) => {
      this.handleMessage(peerId, event.data);
    };

    channel.onclose = () => {
      logger.info('P2P', `Data channel closed with ${peerId}`);
      this.peers.delete(peerId);
      this.onPeerDisconnected?.(peerId);
    };

    channel.onerror = (error) => {
      logger.error('P2P', `Data channel error with ${peerId}`, new Error(String(error)));
    };
  }

  /**
   * 发送握手消息
   */
  private sendHandshake(peerId: string): void {
    const msg: NetworkMessage = {
      id: crypto.randomUUID(),
      type: MessageType.HANDSHAKE,
      sender: this.localPeerId,
      recipient: peerId,
      timestamp: Date.now(),
      payload: {
        peerId: this.localPeerId,
        version: '1.0.0',
        capabilities: ['relay', 'sync', 'consensus'],
        chainHeight: 0,
      },
    };
    this.send(peerId, msg);
  }

  /**
   * 处理消息
   */
  private handleMessage(peerId: string, data: any): void {
    let msg: NetworkMessage;
    if (typeof data === 'string') {
      msg = JSON.parse(data);
    } else {
      msg = data;
    }

    switch (msg.type) {
      case MessageType.HANDSHAKE:
        this.handleHandshake(peerId, msg);
        break;
      case MessageType.HANDSHAKE_ACK:
        this.handleHandshakeAck(peerId, msg);
        break;
      case MessageType.HEARTBEAT:
        this.handleHeartbeat(peerId, msg);
        break;
      case MessageType.SYNC_REQUEST:
        this.handleSyncRequest(peerId, msg);
        break;
      case MessageType.SYNC_RESPONSE:
        this.handleSyncResponse(peerId, msg);
        break;
      case MessageType.TRANSACTION:
      case MessageType.BLOCK:
      case MessageType.VOTE:
      case MessageType.MESSAGE:
        this.onMessage?.(msg);
        break;
    }

    const handler = this.messageHandlers.get(msg.type);
    handler?.(msg);
  }

  /**
   * 处理握手
   */
  private handleHandshake(peerId: string, msg: NetworkMessage): void {
    const ack: NetworkMessage = {
      id: crypto.randomUUID(),
      type: MessageType.HANDSHAKE_ACK,
      sender: this.localPeerId,
      recipient: peerId,
      timestamp: Date.now(),
      payload: {
        peerId: this.localPeerId,
        version: '1.0.0',
        capabilities: ['relay', 'sync', 'consensus'],
        chainHeight: 0,
      },
    };
    this.send(peerId, ack);

    // 更新对等节点信息
    if (msg.payload) {
      this.updatePeerStatus(peerId, PeerStatus.AUTHENTICATED);
    }
  }

  /**
   * 处理握手确认
   */
  private handleHandshakeAck(peerId: string, msg: NetworkMessage): void {
    logger.info('P2P', `Handshake acknowledged by ${peerId}`);
    this.updatePeerStatus(peerId, PeerStatus.AUTHENTICATED);
  }

  /**
   * 处理心跳
   */
  private handleHeartbeat(peerId: string, msg: NetworkMessage): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastActive = Date.now();
      if (msg.payload?.timestamp) {
        peer.latency = Date.now() - msg.payload.timestamp;
      }
    }
  }

  /**
   * 处理同步请求
   */
  private handleSyncRequest(peerId: string, msg: NetworkMessage): void {
    logger.debug('P2P', `Sync request from ${peerId}`);
  }

  /**
   * 处理同步响应
   */
  private handleSyncResponse(peerId: string, msg: NetworkMessage): void {
    console.log(`[P2P] Sync response from ${peerId}`);
  }

  /**
   * 发送消息
   */
  public send(peerId: string, msg: NetworkMessage): void {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.dataChannel || peer.dataChannel.readyState !== 'open') {
      logger.warn('P2P', `Cannot send to peer ${peerId}: channel not ready`);
      return;
    }

    try {
      peer.dataChannel.send(JSON.stringify(msg));
    } catch (error) {
      logger.error('P2P', `Send error to ${peerId}`, error as Error);
    }
  }

  /**
   * 广播消息
   */
  public broadcast(msg: NetworkMessage, excludePeerIds: string[] = []): void {
    msg.sender = this.localPeerId;
    msg.timestamp = Date.now();
    for (const [peerId, peer] of this.peers) {
      if (!excludePeerIds.includes(peerId) && peer.status === PeerStatus.AUTHENTICATED) {
        this.send(peerId, msg);
      }
    }
  }

  /**
   * 发送ICE候选
   */
  private sendIceCandidate(peerId: string, candidate: RTCIceCandidate): void {
    const msg: NetworkMessage = {
      id: crypto.randomUUID(),
      type: MessageType.MESSAGE,
      sender: this.localPeerId,
      recipient: peerId,
      timestamp: Date.now(),
      payload: { type: 'ice_candidate', candidate: candidate.toJSON() },
    };
    this.send(peerId, msg);
  }

  /**
   * 添加ICE候选
   */
  public async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer?.connection) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  /**
   * 发起WebTransport连接
   */
  public async connectWebTransport(address: string): Promise<boolean> {
    if (!this.webTransportSupported) {
      console.warn('[P2P] WebTransport not supported');
      return false;
    }

    try {
      const transport = new WebTransport(address);
      await transport.ready;
      console.log(`[P2P] WebTransport connected to ${address}`);
      // 设置双向流
      const outgoing = transport.datagrams.writable;
      const incoming = transport.datagrams.readable;
      this.setupWebTransportStream(address, incoming, outgoing);
      return true;
    } catch (error) {
      console.error(`[P2P] WebTransport connection failed:`, error);
      return false;
    }
  }

  /**
   * 设置WebTransport流
   */
  private setupWebTransportStream(
    peerId: string,
    incoming: ReadableStream<Uint8Array>,
    outgoing: WritableStream<Uint8Array>
  ): void {
    const reader = incoming.getReader();
    const processMessages = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const decoder = new TextDecoder();
          const msg = JSON.parse(decoder.decode(value));
          this.handleMessage(peerId, msg);
        }
      } catch (error) {
        logger.error('P2P', 'WebTransport stream error', error as Error);
      }
    };
    processMessages();
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      const msg: NetworkMessage = {
        id: crypto.randomUUID(),
        type: MessageType.HEARTBEAT,
        sender: this.localPeerId,
        timestamp: Date.now(),
        payload: { timestamp: Date.now() },
      };
      this.broadcast(msg);
      this.cleanupInactivePeers();
    }, this.config.heartbeatInterval);
  }

  /**
   * 清理不活跃节点
   */
  private cleanupInactivePeers(): void {
    const now = Date.now();
    const timeout = this.config.heartbeatInterval * 3;

    for (const [peerId, peer] of this.peers) {
      if (now - peer.lastActive > timeout) {
        logger.info('P2P', `Removing inactive peer: ${peerId}`);
        peer.dataChannel?.close();
        peer.connection?.close();
        this.peers.delete(peerId);
        this.onPeerDisconnected?.(peerId);
      }
    }
  }

  /**
   * 更新节点状态
   */
  private updatePeerStatus(peerId: string, status: PeerStatus): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.status = status;
      peer.lastActive = Date.now();
    }
  }

  /**
   * 注册消息处理器
   */
  public on(type: MessageType, handler: (msg: NetworkMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * 发送共识消息
   */
  public sendConsensusMessage(
    round: number,
    step: number,
    type: ConsensusMessage['type'],
    blockHash?: string
  ): void {
    const msg: ConsensusMessage = {
      round,
      step,
      type,
      proposer: this.localPeerId,
      blockHash,
    };
    const networkMsg: NetworkMessage = {
      id: crypto.randomUUID(),
      type: MessageType.VOTE,
      sender: this.localPeerId,
      timestamp: Date.now(),
      payload: msg,
    };
    this.broadcast(networkMsg);
  }

  /**
   * 注册共识处理器
   */
  public onConsensus(handler: (msg: ConsensusMessage) => void): void {
    const id = crypto.randomUUID();
    this.consensusHandlers.set(id, handler);
  }

  /**
   * 获取节点列表
   */
  public getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  /**
   * 获取已连接节点数
   */
  public getConnectedPeerCount(): number {
    return Array.from(this.peers.values()).filter(p => p.status === PeerStatus.AUTHENTICATED).length;
  }

  /**
   * 获取本地节点ID
   */
  public getLocalPeerId(): string {
    return this.localPeerId;
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    for (const peer of this.peers.values()) {
      peer.dataChannel?.close();
      peer.connection?.close();
      peer.transport?.close();
    }
    this.peers.clear();
    logger.info('P2P', 'Disconnected');
  }

  /**
   * DHT：存储键值对
   */
  public async dhtStore(key: string, value: any): Promise<void> {
    const node: DHTNode = {
      nodeId: this.localPeerId,
      address: 'localhost',
      port: 0,
      kbucket: [],
      lastUpdated: Date.now(),
    };
    // 简化实现：本地存储
    this.dht.push(node);
    // 广播到其他节点
    const msg: NetworkMessage = {
      id: crypto.randomUUID(),
      type: MessageType.MESSAGE,
      sender: this.localPeerId,
      timestamp: Date.now(),
      payload: { type: 'dht_store', key, value },
    };
    this.broadcast(msg);
  }

  /**
   * DHT：查找值
   */
  public async dhtFind(key: string): Promise<any | null> {
    // 简化实现：本地查找
    const node = this.dht.find(n => n.nodeId === key);
    return node ?? null;
  }

  /**
   * DHT：查找节点
   */
  public async dhtFindNode(nodeId: string): Promise<DHTNode | null> {
    const node = this.dht.find(n => n.nodeId === nodeId);
    return node ?? null;
  }
}

/** P2P配置 */
interface P2PConfig {
  maxPeers: number;
  heartbeatInterval: number;
  syncInterval: number;
  maxMessageSize: number;
  relayEnabled: boolean;
  dhtEnabled: boolean;
  consensusTimeout: number;
}

/** 共识状态 */
interface ConsensusState {
  round: number;
  step: number;
  phase: 'propose' | 'prevote' | 'precommit' | 'commit';
  proposals: Map<string, boolean>;
  prevotes: Map<string, number>;
  precommits: Map<string, number>;
  committed: boolean;
}

// 导出单例
export const p2pNetwork = new P2PNetwork();
export default p2pNetwork;
