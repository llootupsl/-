/**
 * =============================================================================
 * 空间折跃 - WebRTC P2P 连接引擎
 * 实现 NAT 穿透与直连通信
 * =============================================================================
 */

import { EventEmitter } from 'events';
import { logger } from '../../core/utils/Logger';

// ICE 服务器配置
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

// 信令消息类型
export type SignalMessageType = 
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'peer-info'
  | 'sync-request'
  | 'chat-message'
  | 'data-sync';

export interface SignalMessage {
  type: SignalMessageType;
  from: string;
  to?: string;
  payload: unknown;
  timestamp: number;
  id: string;
}

export interface PeerInfo {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  connectedAt: number;
}

export interface SpaceWarpConfig {
  iceServers?: RTCIceServer[];
  maxConnections?: number;
  dataChannelConfig?: RTCDataChannelInit;
  reconnectTimeout?: number;
  heartbeatInterval?: number;
}

const defaultConfig: Required<SpaceWarpConfig> = {
  iceServers: ICE_SERVERS,
  maxConnections: 10,
  dataChannelConfig: {
    ordered: true,
    maxRetransmits: 3,
  },
  reconnectTimeout: 5000,
  heartbeatInterval: 30000,
};

/**
 * WebRTC P2P 空间折跃引擎
 */
export class SpaceWarp extends EventEmitter {
  private peerId: string;
  private peerName: string;
  private config: Required<SpaceWarpConfig>;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localInfo: PeerInfo;
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private messageQueue: Map<string, SignalMessage[]> = new Map();
  private signalHandler: ((msg: SignalMessage) => void) | null = null;
  private isInitiator: boolean = false;
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(peerId: string, peerName: string, config?: SpaceWarpConfig) {
    super();
    this.peerId = peerId;
    this.peerName = peerName;
    this.config = { ...defaultConfig, ...config };
    this.localInfo = {
      id: peerId,
      name: peerName,
      isHost: false,
      connectedAt: Date.now(),
    };
  }

  /**
   * 设置信令处理器
   */
  public setSignalHandler(handler: (msg: SignalMessage) => void): void {
    this.signalHandler = handler;
  }

  /**
   * 发送信令消息
   */
  private async sendSignal(to: string, type: SignalMessageType, payload: unknown): Promise<void> {
    const message: SignalMessage = {
      type,
      from: this.peerId,
      to,
      payload,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    };

    if (this.signalHandler) {
      this.signalHandler(message);
    }

    this.emit('signal-out', message);
  }

  /**
   * 处理接收到的信令消息
   */
  public async handleSignal(message: SignalMessage): Promise<void> {
    if (message.to && message.to !== this.peerId) return;
    if (message.from === this.peerId) return;

    this.emit('signal-in', message);

    try {
      switch (message.type) {
        case 'offer':
          await this.handleOffer(message);
          break;
        case 'answer':
          await this.handleAnswer(message);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message);
          break;
        case 'peer-info':
          this.handlePeerInfo(message);
          break;
      }
    } catch (error) {
      logger.error('SpaceWarp', 'Signal handling error', error as Error);
      this.emit('error', { type: 'signal-error', error, message });
    }
  }

  /**
   * 创建 P2P 连接（发起方）
   */
  public async connect(remotePeerId: string, remotePeerName: string): Promise<void> {
    if (this.peers.has(remotePeerId)) {
      logger.warn('SpaceWarp', `Already connected to peer: ${remotePeerId}`);
      return;
    }

    this.isInitiator = true;
    const pc = this.createPeerConnection(remotePeerId);

    // 创建数据通道
    const channel = pc.createDataChannel('spacetime', this.config.dataChannelConfig);
    this.setupDataChannel(channel, remotePeerId);

    // 发送 Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await this.sendSignal(remotePeerId, 'offer', {
      sdp: offer.sdp,
      type: offer.type,
      peerInfo: this.localInfo,
    });

    logger.info('SpaceWarp', `Initiating connection to: ${remotePeerName}`);
  }

  /**
   * 处理 Offer
   */
  private async handleOffer(message: SignalMessage): Promise<void> {
    const from = message.from;
    this.isInitiator = false;

    if (this.peers.has(from)) {
      await this.cleanupPeer(from);
    }

    const pc = this.createPeerConnection(from);
    const payload = message.payload as { sdp: string; type: string; peerInfo: PeerInfo };

    await pc.setRemoteDescription({
      type: 'offer',
      sdp: payload.sdp,
    });

    // 对方作为数据通道接收者
    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, from);
    };

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await this.sendSignal(from, 'answer', {
      sdp: answer.sdp,
      type: answer.type,
    });

    // 发送本地信息
    await this.sendSignal(from, 'peer-info', this.localInfo);

    logger.info('SpaceWarp', `Handling offer from: ${payload.peerInfo?.name}`);
  }

  /**
   * 处理 Answer
   */
  private async handleAnswer(message: SignalMessage): Promise<void> {
    const from = message.from;
    const pc = this.peers.get(from);
    if (!pc) {
      logger.warn('SpaceWarp', `No peer connection for answer: ${from}`);
      return;
    }

    const payload = message.payload as { sdp: string; type: string };
    await pc.setRemoteDescription({
      type: 'answer',
      sdp: payload.sdp,
    });

    // 发送本地信息
    await this.sendSignal(from, 'peer-info', this.localInfo);

    logger.info('SpaceWarp', `Connection established with: ${from}`);
  }

  /**
   * 处理 ICE Candidate
   */
  private async handleIceCandidate(message: SignalMessage): Promise<void> {
    const from = message.from;
    const pc = this.peers.get(from);
    if (!pc) {
      logger.warn('SpaceWarp', `No peer connection for ICE: ${from}`);
      return;
    }

    const candidate = message.payload as RTCIceCandidateInit;
    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      // 某些情况下 ICE candidate 可能在远程描述设置前到达，忽略错误
      console.debug('[SpaceWarp] ICE candidate error (may be expected):', error);
    }
  }

  /**
   * 处理对等方信息
   */
  private handlePeerInfo(message: SignalMessage): void {
    const peerInfo = message.payload as PeerInfo;
    this.emit('peer-joined', { ...peerInfo, id: message.from });
  }

  /**
   * 创建 PeerConnection
   */
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.config.iceServers });

    // ICE 候选收集
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, 'ice-candidate', event.candidate.toJSON());
      }
    };

    // ICE 连接状态变化
    pc.oniceconnectionstatechange = () => {
      logger.debug('SpaceWarp', `ICE state (${peerId}): ${pc.iceConnectionState}`);
      this.emit('ice-state', { peerId, state: pc.iceConnectionState });

      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        this.emit('peer-disconnected', { peerId, reason: pc.iceConnectionState });
        this.scheduleReconnect(peerId);
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        this.emit('peer-connected', { peerId });
        this.clearReconnect(peerId);
        this.startHeartbeat(peerId);
      }
    };

    // 连接状态变化
    pc.onconnectionstatechange = () => {
      logger.info('SpaceWarp', `Connection state (${peerId}): ${pc.connectionState}`);
      this.emit('connection-state', { peerId, state: pc.connectionState });
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  /**
   * 设置数据通道
   */
  private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => {
      logger.info('SpaceWarp', `Data channel opened with: ${peerId}`);
      this.dataChannels.set(peerId, channel);
      this.emit('channel-open', { peerId, channel });
      
      // 发送排队的消息
      const queue = this.messageQueue.get(peerId) || [];
      queue.forEach((msg) => this.sendData(peerId, msg.type, msg.payload));
      this.messageQueue.delete(peerId);
    };

    channel.onclose = () => {
      logger.info('SpaceWarp', `Data channel closed with: ${peerId}`);
      this.dataChannels.delete(peerId);
      this.emit('channel-close', { peerId });
    };

    channel.onerror = (error) => {
      logger.error('SpaceWarp', 'Data channel error', new Error(String(error)));
      this.emit('error', { type: 'channel-error', peerId, error });
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('data', { peerId, ...data });
      } catch (error) {
        logger.warn('SpaceWarp', 'Failed to parse data channel message as JSON, emitting raw data', error as Error);
        this.emit('data', { peerId, raw: event.data });
      }
    };

    // 如果通道已打开，立即设置
    if (channel.readyState === 'open') {
      this.dataChannels.set(peerId, channel);
      this.emit('channel-open', { peerId, channel });
    }
  }

  /**
   * 发送数据到指定对等方
   */
  public sendData(peerId: string, type: string, payload: unknown): void {
    const channel = this.dataChannels.get(peerId);
    
    if (!channel || channel.readyState !== 'open') {
      // 队列消息等待连接
      if (!this.messageQueue.has(peerId)) {
        this.messageQueue.set(peerId, []);
      }
      this.messageQueue.get(peerId)!.push({ type, payload } as SignalMessage);
      return;
    }

    const message = {
      type,
      from: this.peerId,
      timestamp: Date.now(),
      payload,
    };

    try {
      channel.send(JSON.stringify(message));
    } catch (error) {
      logger.error('SpaceWarp', 'Send error', error as Error);
      this.emit('error', { type: 'send-error', peerId, error });
    }
  }

  /**
   * 广播数据到所有连接的对等方
   */
  public broadcast(type: string, payload: unknown): void {
    this.dataChannels.forEach((_, peerId) => {
      this.sendData(peerId, type, payload);
    });
  }

  /**
   * 断开与指定对等方的连接
   */
  public disconnect(peerId: string): void {
    this.cleanupPeer(peerId);
    this.emit('peer-left', { peerId });
  }

  /**
   * 断开所有连接
   */
  public disconnectAll(): void {
    this.peers.forEach((pc, peerId) => {
      this.cleanupPeer(peerId);
    });
    this.emit('disconnected');
  }

  /**
   * 清理对等方连接
   */
  private async cleanupPeer(peerId: string): Promise<void> {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }

    const channel = this.dataChannels.get(peerId);
    if (channel) {
      channel.close();
      this.dataChannels.delete(peerId);
    }

    this.stopHeartbeat(peerId);
    this.clearReconnect(peerId);
    this.messageQueue.delete(peerId);
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(peerId: string): void {
    if (this.reconnectTimers.has(peerId)) return;

    const timer = setTimeout(() => {
      logger.info('SpaceWarp', `Attempting reconnection to: ${peerId}`);
      this.emit('reconnect-attempt', { peerId });
    }, this.config.reconnectTimeout);

    this.reconnectTimers.set(peerId, timer);
  }

  /**
   * 清除重连定时器
   */
  private clearReconnect(peerId: string): void {
    const timer = this.reconnectTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(peerId);
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(peerId: string): void {
    this.stopHeartbeat(peerId);

    const timer = setInterval(() => {
      this.sendData(peerId, 'heartbeat', { time: Date.now() });
    }, this.config.heartbeatInterval);

    this.heartbeatTimers.set(peerId, timer);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(peerId: string): void {
    const timer = this.heartbeatTimers.get(peerId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(peerId);
    }
  }

  /**
   * 获取已连接的对等方 ID 列表
   */
  public getConnectedPeers(): string[] {
    return Array.from(this.dataChannels.keys());
  }

  /**
   * 检查是否已连接
   */
  public isConnected(peerId?: string): boolean {
    if (peerId) {
      const channel = this.dataChannels.get(peerId);
      return channel?.readyState === 'open';
    }
    return this.dataChannels.size > 0;
  }

  /**
   * 获取连接信息
   */
  public getConnectionStats(): {
    peerCount: number;
    channelCount: number;
    queueSize: number;
  } {
    return {
      peerCount: this.peers.size,
      channelCount: this.dataChannels.size,
      queueSize: Array.from(this.messageQueue.values()).reduce((sum, q) => sum + q.length, 0),
    };
  }

  /**
   * 销毁引擎
   */
  public destroy(): void {
    this.disconnectAll();
    this.removeAllListeners();
  }
}

export default SpaceWarp;
