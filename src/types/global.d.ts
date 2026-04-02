/**
 * 全局类型定义 - V5修复版
 */

export interface WasmModule {
  init(): void;
  dispose(): void;
}

export interface WasmQuantumModule extends WasmModule {
  init(qubits: number): void;
  execute(gate: string, qubits: number[]): number[];
  measure(qubit: number): number;
}

export interface WasmSNNModule extends WasmModule {
  init(neurons: number, synapses: number): void;
  stimulate(neuronId: number, intensity: number): void;
  getFiringRates(): Float32Array;
}

export interface WasmPathFinderModule extends WasmModule {
  init(width: number, height: number): void;
  findPath(start: [number, number], end: [number, number]): [number, number][];
}

export interface WasmAudioModule extends WasmModule {
  addOscillator(frequency: number, amplitude: number, waveform: number): void;
  setFilter(type: number, frequency: number, q: number): void;
  setEnvelope(attack: number, decay: number, sustain: number, release: number): void;
  generateSamples(count: number): Float32Array;
  setMasterVolume(volume: number): void;
}

export interface WebSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

export interface MediaPipeFaceMesh {
  setOptions(options: {
    maxNumFaces: number;
    refineLandmarks: boolean;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): void;
  onResults(callback: (results: FaceMeshResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

export interface FaceMeshResults {
  multiFaceLandmarks: Landmark[][];
  multiFaceGeometry?: unknown[];
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface WebTorrentClient {
  add(torrentId: string | Buffer, opts: WebTorrentOptions, callback: (torrent: WebTorrent) => void): void;
  seed(input: Buffer | File, opts: WebTorrentOptions, callback: (torrent: WebTorrent) => void): void;
  remove(torrent: WebTorrent, callback?: () => void): void;
  destroy(callback?: () => void): void;
}

export interface WebTorrent {
  infoHash: string;
  name: string;
  files: WebTorrentFile[];
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: WebTorrentPeer[];
  on(event: string, callback: (...args: unknown[]) => void): void;
  destroy(): void;
}

export interface WebTorrentFile {
  name: string;
  path: string;
  length: number;
  getBlob(callback: (blob: Blob) => void): void;
  getBlobURL(callback: (url: string) => void): void;
}

export interface WebTorrentOptions {
  announce?: string[];
  maxConns?: number;
  path?: string;
}

export interface WebTorrentPeer {
  id: string;
  ip: string;
  port: number;
}

export interface P2PMessagePayload {
  type: string;
  data: unknown;
  timestamp: number;
  sender: string;
}

export interface DHTValue {
  value: unknown;
  timestamp: number;
  ttl: number;
}

export interface GPUParticle {
  position: Float32Array;
  velocity: Float32Array;
  color: Float32Array;
  life: Float32Array;
}

export interface FilterConfig {
  type: 'lowpass' | 'highpass' | 'bandpass';
  frequency: number;
  q: number;
}

export interface CitizenDecisionOption {
  action: string;
  weight: number;
  target?: string;
  params?: Record<string, unknown>;
}

export interface GamepadData {
  button: string;
  pressed: boolean;
  value: number;
}

export interface QRCodeModule {
  toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<void>;
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface GodsData {
  [key: string]: {
    name: string;
    element: string;
    strength: number;
  };
}

export interface EightCharsData {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
}

export interface ResourceData {
  id: string;
  type: string;
  amount: number;
  productionRate: number;
  consumptionRate: number;
  price: number;
}

export interface NarrativeEntry {
  id: string;
  text: string;
  type: 'event' | 'achievement' | 'divine' | 'system';
  timestamp: number;
}

/** V5修复：EntityId 类型 */
export type EntityId = string & { readonly brand: unique symbol };

/** V5修复：创建 EntityId 的辅助函数 */
export function createEntityId(id: string): EntityId {
  return id as EntityId;
}

/** V5修复：LLMMessage 类型 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** V5修复：SaveData 类型 */
export interface SaveData {
  phase?: string;
  time?: Partial<{
    year: number;
    season: number;
    day: number;
    hour: number;
  }>;
  resources?: Partial<{
    food: number;
    energy: number;
    materials: number;
    knowledge: number;
  }>;
  entropy?: number;
  emotion?: Partial<{
    mood: number;
    tension: number;
    hope: number;
  }>;
  achievements?: string[];
  activeLaws?: string[];
  warmupComplete?: boolean;
  externalAPI?: Partial<{
    enabled: boolean;
    provider: string;
    model: string;
  }>;
}

declare global {
  interface Window {
    SpeechRecognition: new () => WebSpeechRecognition;
    webkitSpeechRecognition: new () => WebSpeechRecognition;
    WebTorrent?: new (options?: WebTorrentOptions) => WebTorrentClient;
  }
  
  interface Navigator {
    gpu?: GPU;
    storage: StorageManager & {
      getDirectory?: () => Promise<FileSystemDirectoryHandle>;
    };
  }
  
  interface WorkerNavigator {
    gpu?: GPU;
  }
  
  interface StorageManager {
    getDirectory?: () => Promise<FileSystemDirectoryHandle>;
  }
  
  interface AuthenticatorAssertionResponse {
    getPublicKey?: () => ArrayBuffer;
  }
  
  interface GPUDeviceDescriptor {
    label?: string;
    requiredFeatures?: GPUFeatureName[];
    requiredLimits?: Record<string, number>;
    defaultQueue?: GPUQueueDescriptor;
  }
  
  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
    getPreferredCanvasFormat?(): GPUTextureFormat;
  }
  
  interface GPUAdapter {
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
    info?: GPUAdapterInfo;
    features: GPUSupportedFeatures;
    limits: GPUSupportedLimits;
  }
  
  interface GPUComputePassEncoder {
    dispatchWorkgroups?(x: number, y?: number, z?: number): void;
    end?(): void;
  }
  
  interface GPURenderPassEncoder {
    end?(): void;
  }
  
  interface GPUQueue {
    onSubmittedWorkDone?(): Promise<void>;
  }
  
  interface GPUCanvasContext {
    configure?(configuration: GPUCanvasConfiguration): void;
  }
  
  interface GPUCanvasConfiguration {
    device: GPUDevice;
    format: GPUTextureFormat;
    usage?: GPUTextureUsageFlags;
    viewFormats?: GPUTextureFormat[];
    colorSpace?: 'srgb' | 'display-p3';
    alphaMode?: 'opaque' | 'premultiplied';
  }
  
  type GPUTextureFormat = 'bgra8unorm' | 'rgba8unorm' | 'rgba16float' | 'r16float' | 'r32float' | 'depth24plus' | 'depth24plus-stencil8';
  
  type GPUTextureUsageFlags = number;
  
  interface GPUBindGroupEntry {
    binding: number;
    resource: GPUBindingResource;
  }
  
  interface GPUBindingResource {
    buffer?: GPUBufferBinding;
    sampler?: GPUSampler;
    textureView?: GPUTextureView;
  }
  
  interface GPUBufferBinding {
    buffer: GPUBuffer;
    offset?: number;
    size?: number;
  }
}

export {};
