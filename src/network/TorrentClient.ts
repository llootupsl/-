/**
 * =============================================================================
 * 永夜熵纪 - WebTorrent P2P 客户端
 * WebTorrent Client for Model Distribution
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';
import type { WindowExtended, WebTorrentOptions } from '@/core/types/web-extensions';
import { logger } from '@/core/utils/Logger';

/** WebTorrent Torrent 类型 */
interface TorrentFile {
  getBlob(callback: (err: Error | null, blob: Blob) => void): void;
}

interface Torrent {
  infoHash: string;
  name: string;
  length: number;
  pieceLength: number;
  pieces: { length: number };
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  timeRemaining: number;
  files: TorrentFile[];
  on(event: 'ready', callback: () => void): void;
  on(event: 'download', callback: () => void): void;
  on(event: 'done', callback: () => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: 'peer', callback: (peerId: string) => void): void;
  destroy(): void;
}

/** WebTorrent 客户端类型 */
interface WebTorrentClient {
  add(torrentId: string | Buffer, options: { announce?: string[] }, callback?: (torrent: Torrent) => void): void;
  seed(input: Uint8Array, options: { name: string; announce: string[] }, callback?: (torrent: Torrent) => void): void;
  remove(torrentId: string, callback?: () => void): void;
  destroy(callback?: () => void): void;
  torrents: Torrent[];
  on(event: 'error', callback: (error: Error) => void): void;
}

/** 种子信息 */
export interface TorrentInfo {
  infoHash: string;
  name: string;
  length: number;
  pieceLength: number;
  pieces: number;
}

/** 下载状态 */
export interface DownloadState {
  infoHash: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
  timeRemaining: number;
}

/** 分发事件 */
export interface TorrentEvents {
  /** 准备就绪 */
  ready: (info: TorrentInfo) => void;
  /** 下载进度 */
  progress: (state: DownloadState) => void;
  /** 下载完成 */
  done: (infoHash: string, data: ArrayBuffer) => void;
  /** 错误 */
  error: (error: Error) => void;
  /** 连接节点 */
  peer: (peerId: string) => void;
}

/**
 * WebTorrent 客户端
 * 
 * 用于 WASM 模型和 WebLLM 模型的 P2P 分发
 */
export class TorrentClient extends EventEmitter<TorrentEvents> {
  private client: WebTorrentClient | null = null;
  private torrents: Map<string, Torrent> = new Map();
  private isSupported: boolean = false;
  private maxRetries: number = 3;
  private retryDelay: number = 2000;

  constructor() {
    super();
    this.checkSupport();
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  private async waitForOnline(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) return true;
    
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeout);
      
      const handler = () => {
        if (this.isOnline()) {
          clearTimeout(timer);
          window.removeEventListener('online', handler);
          resolve(true);
        }
      };
      
      window.addEventListener('online', handler);
    });
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      if (!this.isOnline()) {
        logger.warn('TorrentClient', `${operationName}: 网络离线，等待恢复...`);
        const online = await this.waitForOnline();
        if (!online) {
          throw new Error(`${operationName}: 网络离线超时`);
        }
      }
      
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('TorrentClient', `${operationName}: 尝试 ${attempt}/${this.maxRetries} 失败: ${lastError.message}`);
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError || new Error(`${operationName}: 重试次数耗尽`);
  }

  /**
   * 检查 WebTorrent 支持
   */
  private checkSupport(): void {
    this.isSupported = typeof RTCPeerConnection !== 'undefined';
    
    if (!this.isSupported) {
      logger.warn('TorrentClient', 'WebRTC not supported, P2P disabled');
    }
  }

  /**
   * 初始化客户端
   */
  public async init(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const WebTorrent = await this.loadWebTorrent();
      
      if (!WebTorrent) {
        logger.warn('TorrentClient', 'WebTorrent not available');
        return false;
      }

      this.client = new WebTorrent({
        maxConns: 50,
        dht: true,
        lsd: true,
      });

      this.setupClientHandlers();
      
      logger.info('TorrentClient', 'Initialized');
      return true;
    } catch (error) {
      logger.error('TorrentClient', 'Init failed', error as Error);
      return false;
    }
  }

  /**
   * 加载 WebTorrent 库 - V5修复：使用 CDN 加载避免 Node.js 依赖
   */
  private async loadWebTorrent(): Promise<new (options?: WebTorrentOptions) => WebTorrentClient | null> {
    const win = window as unknown as WindowExtended;
    if (win.WebTorrent) {
      return win.WebTorrent as unknown as new (options?: WebTorrentOptions) => WebTorrentClient;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@2.8.5/webtorrent.min.js';
      script.onload = () => {
        const win = window as unknown as WindowExtended;
        if (win.WebTorrent) {
          resolve(win.WebTorrent as unknown as new (options?: WebTorrentOptions) => WebTorrentClient);
        } else {
          logger.warn('TorrentClient', 'WebTorrent loaded but not available');
          resolve(null);
        }
      };
      script.onerror = () => {
        logger.warn('TorrentClient', 'Failed to load WebTorrent from CDN');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * 设置客户端处理器
   */
  private setupClientHandlers(): void {
    if (!this.client) return;

    this.client.on('error', (error: Error) => {
      logger.error('TorrentClient', 'Client error', error);
      this.emit('error', error);
    });
  }

  /**
   * 开始做种
   */
  public async seed(
    name: string,
    data: ArrayBuffer,
    options: { announce?: string[] } = {}
  ): Promise<TorrentInfo | null> {
    if (!this.client) {
      this.emit('error', new Error('Client not initialized'));
      return null;
    }

    if (!this.isOnline()) {
      this.emit('error', new Error('网络离线，无法开始做种'));
      return null;
    }

    try {
      return await this.retryOperation(async () => {
        return new Promise<TorrentInfo>((resolve, reject) => {
          const opts = {
            name,
            announce: options.announce || [
              'wss://tracker.openwebtorrent.com',
              'wss://tracker.btorrent.xyz',
            ],
          };

          this.client.seed(new Uint8Array(data), opts, (torrent: Torrent) => {
            this.torrents.set(torrent.infoHash, torrent);
            
            const info: TorrentInfo = {
              infoHash: torrent.infoHash,
              name: torrent.name,
              length: torrent.length,
              pieceLength: torrent.pieceLength,
              pieces: torrent.pieces.length,
            };

            this.emit('ready', info);
            resolve(info);
          });

          this.client.on('error', (err: Error) => {
            reject(err);
          });
        });
      }, 'seed');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      logger.error('TorrentClient', `seed 失败: ${err.message}`);
      return null;
    }
  }

  /**
   * 开始下载
   */
  public async download(
    infoHashOrMagnet: string,
    options: { path?: string; announce?: string[] } = {}
  ): Promise<void> {
    if (!this.client) {
      this.emit('error', new Error('Client not initialized'));
      return;
    }

    if (!this.isOnline()) {
      this.emit('error', new Error('网络离线，无法开始下载'));
      return;
    }

    const magnetUri = infoHashOrMagnet.startsWith('magnet:')
      ? infoHashOrMagnet
      : `magnet:?xt=urn:btih:${infoHashOrMagnet}`;

    try {
      await this.retryOperation(async () => {
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('下载连接超时'));
          }, 30000);

          this.client.add(magnetUri, {
            announce: options.announce,
          }, (torrent: Torrent) => {
            clearTimeout(timeout);
            this.setupTorrentHandlers(torrent);
            this.torrents.set(torrent.infoHash, torrent);
            resolve();
          });

          this.client.on('error', (err: Error) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      }, 'download');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      logger.error('TorrentClient', `download 失败: ${err.message}`);
    }
  }

  /**
   * 设置种子处理器
   */
  private setupTorrentHandlers(torrent: Torrent): void {
    torrent.on('ready', () => {
      const info: TorrentInfo = {
        infoHash: torrent.infoHash,
        name: torrent.name,
        length: torrent.length,
        pieceLength: torrent.pieceLength,
        pieces: torrent.pieces.length,
      };

      this.emit('ready', info);
    });

    torrent.on('download', () => {
      const state: DownloadState = {
        infoHash: torrent.infoHash,
        progress: torrent.progress,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        peers: torrent.numPeers,
        timeRemaining: torrent.timeRemaining,
      };

      this.emit('progress', state);
    });

    torrent.on('done', () => {
      // 获取文件数据
      const files = torrent.files;
      if (files.length > 0) {
        files[0].getBlob((err: Error | null, blob: Blob) => {
          if (err) {
            this.emit('error', err);
            return;
          }

          blob.arrayBuffer().then((buffer) => {
            this.emit('done', torrent.infoHash, buffer);
          });
        });
      }
    });

    torrent.on('error', (error: Error) => {
      this.emit('error', error);
    });

    torrent.on('peer', (peerId: string) => {
      this.emit('peer', peerId);
    });
  }

  /**
   * 获取下载状态
   */
  public getState(infoHash: string): DownloadState | null {
    const torrent = this.torrents.get(infoHash);
    
    if (!torrent) return null;

    return {
      infoHash: torrent.infoHash,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      peers: torrent.numPeers,
      timeRemaining: torrent.timeRemaining,
    };
  }

  /**
   * 停止做种/下载
   */
  public stop(infoHash: string): void {
    const torrent = this.torrents.get(infoHash);
    
    if (torrent) {
      torrent.destroy();
      this.torrents.delete(infoHash);
    }
  }

  /**
   * 停止所有
   */
  public stopAll(): void {
    for (const infoHash of this.torrents.keys()) {
      this.stop(infoHash);
    }
  }

  /**
   * 销毁客户端
   */
  public destroy(): void {
    this.stopAll();
    
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    
    this.removeAllListeners();
  }

  /**
   * 检查是否支持
   */
  public isSupportedBrowser(): boolean {
    return this.isSupported;
  }

  /**
   * 获取所有种子
   */
  public getTorrents(): TorrentInfo[] {
    const infos: TorrentInfo[] = [];

    for (const torrent of this.torrents.values()) {
      infos.push({
        infoHash: torrent.infoHash,
        name: torrent.name,
        length: torrent.length,
        pieceLength: torrent.pieceLength,
        pieces: torrent.pieces.length,
      });
    }

    return infos;
  }

  /**
   * V6修复：获取种子状态
   */
  public getTorrentState(infoHash: string): DownloadState | null {
    return this.getState(infoHash);
  }
}

// 单例
export const torrentClient = new TorrentClient();

export default TorrentClient;
