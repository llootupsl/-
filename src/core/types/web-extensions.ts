/**
 * Web API 扩展类型定义
 * 用于处理浏览器 API 的类型安全
 * 
 * 注意：通用浏览器 API 类型已移至 src/types/external.d.ts
 */

/** 存储管理器扩展 */
export interface StorageManagerExtended {
  getOriginPrivateFileSystem(): Promise<FileSystemDirectoryHandle>;
}

declare global {
  interface NavigatorStorage {
    getDirectory(): Promise<FileSystemDirectoryHandle>;
    estimate(): Promise<{ quota: number; usage: number }>;
  }
}

/** ServiceWorker 注册扩展 */
export interface ServiceWorkerRegistrationExtended extends ServiceWorkerRegistration {
  periodicSync?: {
    register(tag: string, options?: { minInterval?: number }): Promise<void>;
    unregister(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

/** 手柄震动执行器扩展 */
export interface GamepadHapticActuatorExtended {
  playEffect(type: string, params: {
    startDelay?: number;
    duration: number;
    weakMagnitude?: number;
    strongMagnitude?: number;
  }): Promise<GamepadHapticsResult>;
}

/** 窗口扩展 - 使用不同的属性名避免冲突 */
export interface WindowExtended {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
  WebTorrent?: WebTorrentConstructor;
}

/** 语音识别事件接口 */
export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

/** 语音识别接口 */
export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

/** GPU 计算通道编码器扩展 */
export type GPUComputePassEncoderExtended = GPUComputePassEncoder;

/** 注视点数据 */
export interface GazePointData {
  x: number;
  y: number;
  confidence: number;
}

/** WebGPU 渲染器扩展接口 */
export interface WebGPURendererExtended {
  setGazePoint?(point: GazePointData): void;
}

/** WebTorrent 客户端类型 */
export interface WebTorrentClient {
  add(torrentId: string | Buffer, options: { announce?: string[] }, callback?: (torrent: unknown) => void): void;
  seed(input: Uint8Array, options: { name: string; announce: string[] }, callback?: (torrent: unknown) => void): void;
  remove(torrentId: string, callback?: () => void): void;
  destroy(callback?: () => void): void;
  torrents: unknown[];
  on(event: string, callback: (data: unknown) => void): void;
}

/** WebTorrent 构造函数选项 */
export interface WebTorrentOptions {
  maxConns?: number;
  dht?: boolean;
  lsd?: boolean;
}

/** WebTorrent 构造函数类型 */
export interface WebTorrentConstructor {
  new (options?: WebTorrentOptions): WebTorrentClient;
}

export {};
