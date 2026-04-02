/**
 * =============================================================================
 * QR码握手 - 二维码扫描实现 P2P 连接建立
 * 支持从机生成、从机扫描、分享房间等功能
 * =============================================================================
 */

import { logger } from '../../core/utils/Logger';

declare global {
  interface Window {
    qrcode?: {
      toCanvas?: (
        canvas: HTMLCanvasElement,
        text: string,
        options?: { width?: number; margin?: number },
        cb?: (error?: unknown) => void
      ) => void | Promise<void>;
      toDataURL?: (
        text: string,
        options?: { width?: number; margin?: number },
        cb?: (error: unknown, url?: string) => void
      ) => string | Promise<string> | void;
    };
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

interface BarcodeDetectorResult {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource): Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

// QR码握手状态
export type QRHandshakeState = 'idle' | 'generating' | 'ready' | 'scanning' | 'connecting' | 'connected' | 'error';

export interface QRHandshakeConfig {
  roomCode: string;
  peerId: string;
  peerName: string;
  timestamp: number;
  signalServers?: string[];
  isHost: boolean;
}

// 连接握手数据
export interface HandshakeData {
  roomCode: string;
  peerId: string;
  peerName: string;
  timestamp: number;
  signalServers?: string[];
  capabilities: string[];
  version: string;
}

export interface QRHandshakeCallbacks {
  onStateChange?: (state: QRHandshakeState, error?: string) => void;
  onRoomCreated?: (roomCode: string) => void;
  onScanned?: (data: HandshakeData) => void;
  onConnected?: (peerInfo: { peerId: string; peerName: string }) => void;
  onError?: (error: string) => void;
}

const CAPABILITIES = ['data-sync', 'chat', 'file-transfer'];
const VERSION = '1.0.0';
const ROOM_CODE_LENGTH = 8;

// 预定义的信号服务器列表（公共 STUN/TURN 服务器）
const SIGNAL_SERVERS = [
  'wss://signaling.omnis-apien.dev',
];

/**
 * 生成随机房间码
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * QR码握手管理器
 */
export class QRHandshake {
  private canvas: HTMLCanvasElement | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private scannerInterval: number | null = null;
  private barcodeDetector: BarcodeDetectorInstance | null = null;
  private callbacks: QRHandshakeCallbacks;
  private state: QRHandshakeState = 'idle';
  private currentRoom: QRHandshakeConfig | null = null;
  private isHost: boolean = false;

  constructor(callbacks: QRHandshakeCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * 创建房间（生成 QR码）
   */
  public async createRoom(canvas: HTMLCanvasElement | null, peerId: string, peerName: string): Promise<string> {
    this.canvas = canvas;

    const roomCode = generateRoomCode();
    this.currentRoom = {
      roomCode,
      peerId,
      peerName,
      timestamp: Date.now(),
      signalServers: SIGNAL_SERVERS,
      isHost: true,
    };
    this.isHost = true;

    await this.setState('generating');

    const handshakeData: HandshakeData = {
      roomCode,
      peerId,
      peerName,
      timestamp: Date.now(),
      signalServers: SIGNAL_SERVERS,
      capabilities: CAPABILITIES,
      version: VERSION,
    };

    await this.generateQRCode(handshakeData);

    await this.setState('ready');
    this.callbacks.onRoomCreated?.(roomCode);

    return roomCode;
  }

  /**
   * 扫描 QR码
   */
  public async scanQRCode(video: HTMLVideoElement): Promise<void> {
    this.video = video;
    this.isHost = false;
    this.currentRoom = null;

    await this.setState('scanning');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      video.srcObject = this.stream;
      await video.play();
      this.barcodeDetector = this.createBarcodeDetector();
      this.startScanning();
    } catch (error) {
      logger.error('QRHandshake', 'Camera access error', error as Error);
      await this.setState('error', '无法访问摄像头');
      this.callbacks.onError?.('无法访问摄像头');
    }
  }

  /**
   * 停止扫描
   */
  public stopScanning(): void {
    if (this.scannerInterval) {
      clearInterval(this.scannerInterval);
      this.scannerInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.setState('idle');
  }

  /**
   * 当前环境是否支持二维码识别
   */
  public isBarcodeDetectionSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function';
  }

  /**
   * 处理扫描到的数据
   */
  public processScannedData(data: string): HandshakeData | null {
    try {
      const parsed = JSON.parse(data) as HandshakeData;
      if (!parsed.roomCode || !parsed.peerId) {
        logger.error('QRHandshake', 'Invalid QR data');
        return null;
      }

      if (parsed.version !== VERSION) {
        logger.warn('QRHandshake', `Version mismatch: ${parsed.version} vs ${VERSION}`);
      }

      this.currentRoom = {
        roomCode: parsed.roomCode,
        peerId: parsed.peerId,
        peerName: parsed.peerName,
        timestamp: parsed.timestamp,
        signalServers: parsed.signalServers,
        isHost: false,
      };
      this.callbacks.onScanned?.(parsed);
      this.setState('connecting');

      return parsed;
    } catch (error) {
      logger.error('QRHandshake', 'Failed to parse QR data', error as Error);
      return null;
    }
  }

  /**
   * 从二维码或手动输入建立连接
   */
  public connectFromPayload(data: string, options: { silent?: boolean } = {}): HandshakeData | null {
    const parsed = this.processScannedData(data);
    if (!parsed) {
      if (!options.silent) {
        this.setState('error', '无法解析连接码');
        this.callbacks.onError?.('无法解析连接码');
      }
      return null;
    }

    this.markConnected(parsed.peerId, parsed.peerName);
    return parsed;
  }

  /**
   * 标记连接完成
   */
  public markConnected(peerId: string, peerName: string): void {
    this.stopScanning();
    this.setState('connected');
    this.callbacks.onConnected?.({ peerId, peerName });
  }

  /**
   * 获取当前房间信息
   */
  public getCurrentRoom(): QRHandshakeConfig | null {
    return this.currentRoom;
  }

  /**
   * 获取握手数据供分享
   */
  public getHandshakeData(): string {
    if (!this.currentRoom) return '';

    const handshakeData: HandshakeData = {
      roomCode: this.currentRoom.roomCode,
      peerId: this.currentRoom.peerId,
      peerName: this.currentRoom.peerName,
      timestamp: this.currentRoom.timestamp,
      signalServers: this.currentRoom.signalServers,
      capabilities: CAPABILITIES,
      version: VERSION,
    };

    return JSON.stringify(handshakeData);
  }

  /**
   * 生成 QR码
   */
  private async generateQRCode(data: HandshakeData): Promise<void> {
    const canvas = this.canvas;
    if (!canvas) return;

    const dataString = JSON.stringify(data);

    if (await this.tryRenderWithQrcodeLibrary(canvas, dataString)) {
      logger.info('QRHandshake', 'QR code generated');
      return;
    }

    this.renderFallbackPayload(canvas, data);
    logger.warn('QRHandshake', 'QR library not found, using fallback payload preview');
  }

  private async tryRenderWithQrcodeLibrary(canvas: HTMLCanvasElement, payload: string): Promise<boolean> {
    const qrcode = window.qrcode;
    if (!qrcode) return false;

    if (typeof qrcode.toCanvas === 'function') {
      await new Promise<void>((resolve, reject) => {
        try {
          const maybe = qrcode.toCanvas(canvas, payload, { width: 300, margin: 2 }, (error?: unknown) => {
            if (error) {
              reject(error instanceof Error ? error : new Error(String(error)));
              return;
            }
            resolve();
          });

          if (maybe && typeof (maybe as Promise<void>).then === 'function') {
            (maybe as Promise<void>).then(() => resolve()).catch(reject);
          }
        } catch (error) {
          reject(error);
        }
      });
      return true;
    }

    if (typeof qrcode.toDataURL === 'function') {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        let settled = false;
        const finish = (value: string | Error | unknown, maybeUrl?: string) => {
          if (settled) return;
          settled = true;

          if (value instanceof Error) {
            reject(value);
            return;
          }

          if (typeof maybeUrl === 'string' && maybeUrl.length > 0) {
            resolve(maybeUrl);
            return;
          }

          if (typeof value === 'string' && value.length > 0) {
            resolve(value);
            return;
          }

          if (value) {
            reject(value instanceof Error ? value : new Error(String(value)));
            return;
          }

          reject(new Error('QRCode library returned empty payload'));
        };

        try {
          const maybe = qrcode.toDataURL(payload, { width: 300, margin: 2 }, (error: unknown, url?: string) => {
            if (error) {
              finish(error);
              return;
            }
            finish(url ?? '');
          });

          if (typeof maybe === 'string') {
            finish(maybe);
            return;
          }

          if (maybe && typeof (maybe as Promise<string>).then === 'function') {
            (maybe as Promise<string>).then((url) => finish(url)).catch(reject);
          }
        } catch (error) {
          reject(error);
        }
      });

      await this.drawDataUrl(canvas, dataUrl);
      return true;
    }

    return false;
  }

  private async drawDataUrl(canvas: HTMLCanvasElement, dataUrl: string): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load QR image'));
      img.src = dataUrl;
    });
  }

  private renderFallbackPayload(canvas: HTMLCanvasElement, data: HandshakeData): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const payload = JSON.stringify(data);
    canvas.width = 320;
    canvas.height = 320;

    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ffff';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    const hash = this.hashPayload(payload);
    const cellSize = 18;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const idx = (x + y * 12) % hash.length;
        if (hash.charCodeAt(idx) % 2 === 0) {
          ctx.fillRect(32 + x * cellSize, 32 + y * cellSize, cellSize - 2, cellSize - 2);
        }
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('连接码已生成', canvas.width / 2, 280);
    ctx.font = '12px monospace';
    ctx.fillText(data.roomCode, canvas.width / 2, 300);
  }

  private hashPayload(payload: string): string {
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  /**
   * 开始扫描
   */
  private startScanning(): void {
    if (!this.video) return;

    if (!this.barcodeDetector) {
      logger.warn('QRHandshake', 'BarcodeDetector not available, manual payload entry required');
      return;
    }

    // 定时检查视频帧
    this.scannerInterval = window.setInterval(async () => {
      if (this.video && this.video.readyState >= this.video.HAVE_ENOUGH_DATA) {
        try {
          await this.detectQRCode();
        } catch (error) {
          logger.debug('QRHandshake', `QR detection frame error: ${error}`);
        }
      }
    }, 200);
  }

  /**
   * 检测 QR码
   */
  private async detectQRCode(): Promise<void> {
    if (!this.video || !this.barcodeDetector) return;

    try {
      const results = await this.barcodeDetector.detect(this.video);
      if (results.length > 0) {
        const data = this.connectFromPayload(results[0].rawValue, { silent: true });
        if (data) {
          clearInterval(this.scannerInterval!);
        }
      }
    } catch (error) {
      logger.warn('QRHandshake', 'QR code detection failed, continuing scan', error as Error);
    }
  }

  private createBarcodeDetector(): BarcodeDetectorInstance | null {
    if (!this.isBarcodeDetectionSupported()) return null;

    try {
      const Detector = window.BarcodeDetector;
      return Detector ? new Detector({ formats: ['qr_code'] }) : null;
    } catch (error) {
      logger.warn('QRHandshake', 'BarcodeDetector initialization failed', error as Error);
      return null;
    }
  }

  /**
   * 更新状态
   */
  private async setState(state: QRHandshakeState, error?: string): Promise<void> {
    this.state = state;
    this.callbacks.onStateChange?.(state, error);
  }

  /**
   * 获取当前状态
   */
  public getState(): QRHandshakeState {
    return this.state;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopScanning();
    this.currentRoom = null;
  }
}

export default QRHandshake;
