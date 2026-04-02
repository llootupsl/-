/**
 * =============================================================================
 * 近场同步 - 设备间近距离数据同步
 * =============================================================================
 */

import { EventEmitter } from 'events';
import { logger } from '../../core/utils/Logger';

export interface SyncPacket {
  id: string;
  type: 'citizen' | 'event' | 'resource' | 'snapshot' | 'chat' | 'meta';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  senderId: string;
  checksum: string;
}

export interface ProximitySyncConfig {
  syncInterval?: number;
  maxPacketSize?: number;
  retryCount?: number;
  retryDelay?: number;
  conflictResolution?: 'local-wins' | 'remote-wins' | 'latest-wins' | 'manual';
}

const defaultConfig: Required<ProximitySyncConfig> = {
  syncInterval: 1000,
  maxPacketSize: 512,
  retryCount: 3,
  retryDelay: 1000,
  conflictResolution: 'latest-wins',
};

export interface SyncConflict {
  packetId: string;
  localData: unknown;
  remoteData: unknown;
  timestamp: number;
}

export interface ProximitySyncCallbacks {
  onSyncStart?: () => void;
  onSyncEnd?: (stats: SyncStats) => void;
  onPacketReceived?: (packet: SyncPacket) => void;
  onConflict?: (conflict: SyncConflict) => SyncConflict['timestamp'] | undefined;
  onError?: (error: Error) => void;
}

export interface SyncStats {
  packetsSent: number;
  packetsReceived: number;
  conflictsResolved: number;
  duration: number;
}

/**
 * 近场同步引擎
 */
export class ProximitySync extends EventEmitter {
  private config: Required<ProximitySyncConfig>;
  private callbacks: ProximitySyncCallbacks;
  private nodeId: string;
  private pendingPackets: Map<string, SyncPacket> = new Map();
  private receivedChecksums: Set<string> = new Set();
  private syncInterval: number | null = null;
  private sendHandler: ((deviceId: string, data: string) => Promise<void>) | null = null;
  private receiveHandler: ((deviceId: string, data: SyncPacket) => void) | null = null;
  private connectedDevices: Set<string> = new Set();
  private syncStartTime: number = 0;
  private stats: SyncStats = {
    packetsSent: 0,
    packetsReceived: 0,
    conflictsResolved: 0,
    duration: 0,
  };

  constructor(nodeId: string, callbacks: ProximitySyncCallbacks, config?: ProximitySyncConfig) {
    super();
    this.nodeId = nodeId;
    this.callbacks = callbacks;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 设置发送处理器
   */
  public setSendHandler(handler: (deviceId: string, data: string) => Promise<void>): void {
    this.sendHandler = handler;
  }

  /**
   * 设置接收处理器
   */
  public setReceiveHandler(handler: (deviceId: string, data: SyncPacket) => void): void {
    this.receiveHandler = handler;
  }

  /**
   * 注册已连接设备
   */
  public registerDevice(deviceId: string): void {
    this.connectedDevices.add(deviceId);
  }

  /**
   * 注销设备
   */
  public unregisterDevice(deviceId: string): void {
    this.connectedDevices.delete(deviceId);
  }

  /**
   * 创建同步数据包
   */
  public createPacket(
    type: SyncPacket['type'],
    action: SyncPacket['action'],
    data: unknown
  ): SyncPacket {
    const packet: SyncPacket = {
      id: crypto.randomUUID(),
      type,
      action,
      data,
      timestamp: Date.now(),
      senderId: this.nodeId,
      checksum: this.calculateChecksum(data),
    };

    this.pendingPackets.set(packet.id, packet);
    return packet;
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 发送数据包
   */
  public async sendPacket(packet: SyncPacket): Promise<boolean> {
    if (!this.sendHandler) {
      console.warn('[ProximitySync] No send handler configured');
      return false;
    }

    const dataString = JSON.stringify(packet);

    // 分片发送大包
    if (dataString.length > this.config.maxPacketSize) {
      return this.sendFragmented(packet);
    }

    try {
      for (const deviceId of this.connectedDevices) {
        await this.sendHandler(deviceId, dataString);
      }
      this.stats.packetsSent++;
      this.pendingPackets.delete(packet.id);
      return true;
    } catch (error) {
      console.error('[ProximitySync] Send error:', error);
      return false;
    }
  }

  /**
   * 分片发送大数据包
   */
  private async sendFragmented(packet: SyncPacket): Promise<boolean> {
    const dataString = JSON.stringify(packet);
    const totalChunks = Math.ceil(dataString.length / this.config.maxPacketSize);
    const fragments: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.config.maxPacketSize;
      const end = start + this.config.maxPacketSize;
      const chunk = dataString.slice(start, end);

      fragments.push(JSON.stringify({
        packetId: packet.id,
        totalChunks,
        chunkIndex: i,
        data: chunk,
        isFragment: true,
      }));
    }

    try {
      for (const deviceId of this.connectedDevices) {
        for (const fragment of fragments) {
          await this.sendHandler(deviceId, fragment);
        }
      }
      return true;
    } catch (error) {
      console.error('[ProximitySync] Fragmented send error:', error);
      return false;
    }
  }

  /**
   * 处理接收到的数据
   */
  public handleIncomingData(deviceId: string, dataString: string): SyncPacket | null {
    try {
      const parsed = JSON.parse(dataString);

      // 分片重组
      if (parsed.isFragment) {
        return this.reassembleFragment(parsed);
      }

      const packet = parsed as SyncPacket;

      // 校验重复
      if (this.receivedChecksums.has(packet.checksum)) {
        logger.debug('ProximitySync', `Duplicate packet received: ${packet.id}`);
        return null;
      }

      // 存储校验和
      this.receivedChecksums.add(packet.checksum);

      // 检查冲突
      if (this.pendingPackets.has(packet.id)) {
        const conflict = this.resolveConflict(packet);
        if (conflict !== null) {
          return conflict;
        }
      }

      // 处理数据包
      this.stats.packetsReceived++;
      this.callbacks.onPacketReceived?.(packet);
      this.emit('packet-received', packet);

      return packet;

    } catch (error) {
      logger.error('ProximitySync', 'Parse error', error as Error);
      return null;
    }
  }

  /**
   * 重组分片数据
   */
  private reassembleFragment(fragment: {
    packetId: string;
    totalChunks: number;
    chunkIndex: number;
    data: string;
  }): null {
    logger.debug('ProximitySync', `Fragment received: ${fragment.packetId} ${fragment.chunkIndex + 1}/${fragment.totalChunks}`);
    return null;
  }

  /**
   * 解决冲突
   */
  private resolveConflict(remotePacket: SyncPacket): SyncPacket | null {
    const localPacket = this.pendingPackets.get(remotePacket.id);
    if (!localPacket) return remotePacket;

    const localTime = (localPacket.data as { updatedAt?: number })?.updatedAt || localPacket.timestamp;
    const remoteTime = (remotePacket.data as { updatedAt?: number })?.updatedAt || remotePacket.timestamp;

    switch (this.config.conflictResolution) {
      case 'local-wins':
        if (remoteTime > localTime) {
          this.pendingPackets.delete(remotePacket.id);
          return null;
        }
        break;

      case 'remote-wins':
        if (localTime > remoteTime) {
          return remotePacket;
        }
        this.pendingPackets.delete(remotePacket.id);
        break;

      case 'latest-wins':
        if (localTime > remoteTime) {
          return remotePacket;
        }
        this.pendingPackets.delete(remotePacket.id);
        break;

      case 'manual':
        const conflict: SyncConflict = {
          packetId: remotePacket.id,
          localData: localPacket.data,
          remoteData: remotePacket.data,
          timestamp: remotePacket.timestamp,
        };

        const resolution = this.callbacks.onConflict?.(conflict);
        if (resolution !== undefined) {
          this.stats.conflictsResolved++;
          return remotePacket;
        }
        return null;
    }

    return remotePacket;
  }

  /**
   * 启动自动同步
   */
  public startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncStartTime = Date.now();
    this.callbacks.onSyncStart?.();
    this.emit('sync-start');

    this.syncInterval = window.setInterval(() => {
      this.performSync();
    }, this.config.syncInterval);

    logger.info('ProximitySync', 'Auto-sync started');
  }

  /**
   * 停止自动同步
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.stats.duration = Date.now() - this.syncStartTime;
    this.callbacks.onSyncEnd?.(this.stats);
    this.emit('sync-end', this.stats);

    logger.info('ProximitySync', 'Auto-sync stopped');
  }

  /**
   * 执行同步
   */
  private async performSync(): Promise<void> {
    const pending = Array.from(this.pendingPackets.values());

    for (const packet of pending) {
      await this.sendPacket(packet);
    }

    this.emit('sync-tick', { pendingCount: this.pendingPackets.size });
  }

  /**
   * 同步市民数据
   */
  public syncCitizens(citizens: Array<{
    id: string;
    name: string;
    state: string;
    position: string;
    updatedAt: number;
  }>): void {
    for (const citizen of citizens) {
      const packet = this.createPacket('citizen', 'update', citizen);
      this.sendPacket(packet);
    }
  }

  /**
   * 同步事件数据
   */
  public syncEvent(event: {
    id: string;
    type: string;
    name: string;
    timestamp: number;
    data?: unknown;
  }): void {
    const packet = this.createPacket('event', 'create', event);
    this.sendPacket(packet);
  }

  /**
   * 同步资源数据
   */
  public syncResources(resources: Record<string, {
    type: string;
    amount: number;
    capacity: number;
  }>): void {
    const packet = this.createPacket('resource', 'update', resources);
    this.sendPacket(packet);
  }

  /**
   * 发送快照
   */
  public async sendSnapshot(snapshotData: unknown): Promise<void> {
    const packet = this.createPacket('snapshot', 'create', {
      data: snapshotData,
      createdAt: Date.now(),
    });
    await this.sendPacket(packet);
  }

  /**
   * 获取统计信息
   */
  public getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * 获取待同步数量
   */
  public getPendingCount(): number {
    return this.pendingPackets.size;
  }

  /**
   * 清除历史记录
   */
  public clearHistory(): void {
    this.receivedChecksums.clear();
    this.stats = {
      packetsSent: 0,
      packetsReceived: 0,
      conflictsResolved: 0,
      duration: 0,
    };
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopAutoSync();
    this.pendingPackets.clear();
    this.receivedChecksums.clear();
    this.connectedDevices.clear();
    this.removeAllListeners();
  }
}

export default ProximitySync;
