/// <reference types="vite/client" />

// Vite 环境变量
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_WEBTRANSPORT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 全局类型声明
declare module '*.wgsl' {
  const content: string;
  export default content;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

// WebGPU 类型扩展
interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference;
  forceFallbackAdapter?: boolean;
}

type GPUPowerPreference = 'low-power' | 'high-performance' | 'default';

// SharedArrayBuffer 检查
declare var SharedArrayBuffer: {
  prototype: SharedArrayBuffer;
  new (byteLength: number): SharedArrayBuffer;
};

// Performance.memory 类型（Chrome 特有）
interface Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

// Service Worker 类型
interface ServiceWorkerGlobalScope {
  skipWaiting(): Promise<void>;
  clients: Clients;
  registration: ServiceWorkerRegistration;
}

interface Clients {
  claim(): Promise<void>;
  matchAll(options?: ClientsMatchOptions): Promise<Client[]>;
  openWindow(url: string): Promise<WindowClient | null>;
}

interface ClientsMatchOptions {
  type?: ClientTypes;
  includeUncontrolled?: boolean;
}

type ClientTypes = 'window' | 'worker' | 'sharedworker' | 'all';

// WebTransport 类型
interface WebTransport {
  ready: Promise<void>;
  closed: Promise<WebTransportCloseInfo>;
  reliability: WebTransportReliabilityMode;
  createBidirectionalStream(): ReadableStream<Uint8Array> & WritableStream<Uint8Array>;
  createUnidirectionalStream(): WritableStream<Uint8Array>;
  datagrams: WebTransportDatagramDuplexStream;
  close(info?: WebTransportCloseInfo): void;
}

interface WebTransportCloseInfo {
  closeCode?: number;
  reason?: string;
}

type WebTransportReliabilityMode = 'reliable' | 'unreliable' | 'peers-based';

interface WebTransportDatagramDuplexStream {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  incomingMaxAge: number;
  outgoingMaxAge: number;
  incomingHighWaterMark: number;
  outgoingHighWaterMark: number;
}

declare var WebTransport: {
  prototype: WebTransport;
  new (url: string, options?: WebTransportOptions): WebTransport;
};

interface WebTransportOptions {
  allowPooling?: boolean;
  requireUnreliable?: boolean;
  protocols?: string[];
}

// OPFS 类型
interface FileSystemDirectoryHandle {
  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  keys(): AsyncIterableIterator<string>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface FileSystemGetFileOptions {
  create?: boolean;
}

interface FileSystemGetDirectoryOptions {
  create?: boolean;
}

interface FileSystemRemoveOptions {
  recursive?: boolean;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean;
}

interface FileSystemWritableFileStream extends WritableStream<BufferSource | Blob | string | WriteParams> {
  write(data: BufferSource | Blob | string | WriteParams): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface WriteParams {
  type: 'write' | 'seek' | 'truncate';
  data?: BufferSource | Blob | string;
  position?: number;
  size?: number;
}

// VideoEncoder 类型
interface VideoEncoder {
  encode(frame: VideoFrame, options?: VideoEncoderEncodeOptions): void;
  flush(): Promise<void>;
  close(): void;
  state: EncoderState;
  encoderConfig: VideoEncoderConfig | undefined;
  ondequeue: ((this: VideoEncoder, ev: Event) => void) | null;
  onerror: ((this: VideoEncoder, ev: Event) => void) | null;
  onready: ((this: VideoEncoder, ev: Event) => void) | null;
}

interface VideoEncoderEncodeOptions {
  keyFrame?: boolean;
  timestamp?: number;
  byteStreamTimestampBase?: number;
}

type EncoderState = 'unconfigured' | 'configured' | 'closed';

interface VideoEncoderConfig {
  codec: string;
  width: number;
  height: number;
  bitrate?: number;
  framerate?: number;
  latencyMode?: LatencyMode;
  hardwareAcceleration?: HardwareAccelerationMode;
}

type LatencyMode = 'quality' | 'realtime';
type HardwareAcceleration = 'no-preference' | 'prefer-hardware' | 'prefer-software';

interface VideoFrame {
  close(): void;
  displayWidth: number;
  displayHeight: number;
  timestamp: number;
  duration?: number;
  format?: VideoPixelFormat;
  allocationSize(options?: FrameCopyToOptions): Promise<number>;
  copyTo(destination: BufferSource, options?: FrameCopyToOptions): Promise<PlaneLayout[]>;
}

interface FrameCopyToOptions {
  rect?: DOMRectInit;
  format?: VideoPixelFormat;
}

type VideoPixelFormat = 'nv12' | 'iyuv' | 'rgba' | 'bgra';

// ML / WebNN 类型
interface ML {
  createContext(options?: MLContextOptions): MLContext;
}

interface MLContext {
  createComputePipeline(graph: MLGraph): Promise<MLComputePipeline>;
  createRenderPipeline(graph: MLGraph): Promise<MLRenderPipeline>;
  compute(pipeline: MLComputePipeline, inputs: Record<string, MLOperand>, outputs: Record<string, MLOperand>): Promise<void>;
  destroy(): void;
}

interface MLContextOptions {
  deviceType?: 'cpu' | 'gpu' | 'npu';
  powerPreference?: 'default' | 'low-power' | 'high-performance';
}

interface MLGraph {}

interface MLComputePipeline {}

interface MLRenderPipeline {}

interface MLOperand {}

declare var ml: ML;

// 压缩纹理格式
type GPUTextureFormat =
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'
  | 'r16unorm'
  | 'r16snorm'
  | 'r16uint'
  | 'r16sint'
  | 'r16float'
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  | 'rg16unorm'
  | 'rg16snorm'
  | 'rg16uint'
  | 'rg16sint'
  | 'rg16float'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'rgba16unorm'
  | 'rgba16snorm'
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'
  | 'r32uint'
  | 'r32sint'
  | 'r32float'
  | 'rg32uint'
  | 'rg32sint'
  | 'rg32float'
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float'
  | 'stencil8'
  | 'depth16unorm'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float'
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-r-unorm'
  | 'bc5-r-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb'
  | 'astc-4x4-unorm'
  | 'astc-4x4-unorm-srgb'
  | 'astc-5x4-unorm'
  | 'astc-5x4-unorm-srgb'
  | 'astc-5x5-unorm'
  | 'astc-5x5-unorm-srgb'
  | 'astc-6x5-unorm'
  | 'astc-6x5-unorm-srgb'
  | 'astc-6x6-unorm'
  | 'astc-6x6-unorm-srgb'
  | 'astc-8x5-unorm'
  | 'astc-8x5-unorm-srgb'
  | 'astc-8x6-unorm'
  | 'astc-8x6-unorm-srgb'
  | 'astc-8x8-unorm'
  | 'astc-8x8-unorm-srgb'
  | 'astc-10x5-unorm'
  | 'astc-10x5-unorm-srgb'
  | 'astc-10x6-unorm'
  | 'astc-10x6-unorm-srgb'
  | 'astc-10x8-unorm'
  | 'astc-10x8-unorm-srgb'
  | 'astc-10x10-unorm'
  | 'astc-10x10-unorm-srgb'
  | 'astc-12x10-unorm'
  | 'astc-12x10-unorm-srgb'
  | 'astc-12x12-unorm'
  | 'astc-12x12-unorm-srgb';

// WGSL 着色器支持的格式扩展
interface GPUDevice {
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
  createSampler(descriptor: GPUSamplerDescriptor): GPUSampler;
  createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
  queue: GPUQueue;
  getPreferredCanvasFormat(): GPUTextureFormat;
  pushErrorScope(filter: GPUErrorFilter): void;
  popErrorScope(): Promise<GPUError | null>;
  onuncapturederror: ((this: GPUDevice, ev: GPUUncapturedErrorEvent) => void) | null;
}

interface GPUShaderModuleDescriptor {
  code: string;
  sourceMap?: object;
  hints?: Record<string, GPUShaderModuleCompilationHint>;
  label?: string;
}

interface GPUShaderModuleCompilationHint {
  bindGroupLayouts?: GPUBindGroupLayout[];
}

type GPUErrorFilter = 'out-of-memory' | 'validation' | 'internal';

interface GPUUncapturedErrorEvent extends Event {
  error: GPUError;
}

type GPUError = GPUOutOfMemoryError | GPUValidationError | GPUInternalError;

interface GPUOutOfMemoryError extends GPUError {
  type: 'out-of-memory';
}

interface GPUValidationError extends GPUError {
  type: 'validation';
  message: string;
}

interface GPUInternalError extends GPUError {
  type: 'internal';
  message: string;
}

interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  limits: GPUSupportedLimits;
  features: GPUSupportedFeatures;
  isFallbackAdapter: boolean;
}

interface GPUDeviceDescriptor {
  requiredLimits?: Record<string, number>;
  requiredFeatures?: string[];
  defaultQueue?: GPUQueueDescriptor;
  label?: string;
}

interface GPUSupportedLimits {
  maxStorageBufferBindingSize: number;
  maxBufferSize: number;
  maxTextureDimension1D: number;
  maxTextureDimension2D: number;
  maxTextureDimension3D: number;
  maxTextureArrayLayers: number;
  maxBindGroups: number;
  maxBindingsPerBindGroup: number;
  maxBufferSize: number;
  maxVertexBuffers: number;
  maxVertexAttributes: number;
}

interface GPUSupportedFeatures {
  has(name: string): boolean;
  [Symbol.iterator](): IterableIterator<string>;
}

interface GPUQueueDescriptor {
  label?: string;
}

interface GPUBuffer {
  mapAsync(mode: GPUMapModeFlags, offset?: number, size?: number): Promise<void>;
  getMappedRange(offset?: number, size?: number): ArrayBuffer;
  unmap(): void;
  destroy(): void;
  label?: string;
}

type GPUMapModeFlags = number;

interface GPUBufferDescriptor {
  size: number;
  usage: GPUBufferUsageFlags;
  mappedAtCreation?: boolean;
  label?: string;
}

type GPUBufferUsageFlags = number;

declare const GPUBufferUsage: {
  MAP_READ: GPUBufferUsageFlags;
  MAP_WRITE: GPUBufferUsageFlags;
  COPY_SRC: GPUBufferUsageFlags;
  COPY_DST: GPUBufferUsageFlags;
  INDEX: GPUBufferUsageFlags;
  VERTEX: GPUBufferUsageFlags;
  UNIFORM: GPUBufferUsageFlags;
  STORAGE: GPUBufferUsageFlags;
  INDIRECT: GPUBufferUsageFlags;
  QUERY_RESOLVE: GPUBufferUsageFlags;
};

interface GPUTexture {
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
  destroy(): void;
  width: number;
  height: number;
  depthOrArrayLayers: number;
  mipLevelCount: number;
  sampleCount: number;
  dimension: GPUTextureDimension;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
  label?: string;
}

interface GPUTextureView {
  label?: string;
}

interface GPUTextureViewDescriptor {
  format?: GPUTextureFormat;
  dimension?: GPUTextureViewDimension;
  aspect?: GPUTextureAspect;
  baseMipLevel?: number;
  mipLevelCount?: number;
  baseArrayLayer?: number;
  arrayLayerCount?: number;
  label?: string;
}

type GPUTextureViewDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
type GPUTextureAspect = 'all' | 'stencil-only' | 'depth-only';
type GPUTextureDimension = '1d' | '2d' | '3d';

type GPUTextureUsageFlags = number;

declare const GPUTextureUsage: {
  COPY_SRC: GPUTextureUsageFlags;
  COPY_DST: GPUTextureUsageFlags;
  TEXTURE_BINDING: GPUTextureUsageFlags;
  STORAGE_BINDING: GPUTextureUsageFlags;
  RENDER_ATTACHMENT: GPUTextureUsageFlags;
};

interface GPUTextureDescriptor {
  size: GPUExtent3D;
  mipLevelCount?: number;
  sampleCount?: number;
  dimension?: GPUTextureDimension;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;
  viewFormats?: GPUTextureFormat[];
  label?: string;
}

type GPUExtent3D = [number, number, number] | { width: number; height?: number; depthOrArrayLayers?: number };

interface GPUSampler {
  label?: string;
}

interface GPUSamplerDescriptor {
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
  addressModeW?: GPUAddressMode;
  magFilter?: GPUFilterMode;
  minFilter?: GPUFilterMode;
  mipmapFilter?: GPUMipmapFilterMode;
  lodMinClamp?: number;
  lodMaxClamp?: number;
  compare?: GPUCompareFunction;
  maxAnisotropy?: number;
  label?: string;
}

type GPUAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
type GPUFilterMode = 'nearest' | 'linear';
type GPUMipmapFilterMode = 'nearest' | 'linear';
type GPUCompareFunction = 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';

interface GPUQuerySet {
  destroy(): void;
  count: number;
  type: GPUQueryType;
  label?: string;
}

interface GPUQuerySetDescriptor {
  type: GPUQueryType;
  count: number;
  pipelineStatistics?: GPUPipelineStatisticName[];
  label?: string;
}

type GPUQueryType = 'occlusion' | 'timestamp' | 'pipeline-statistics';
type GPUPipelineStatisticName = 'vertex-shader-invocations' | 'clipper-invocations' | 'clipper-primitives-out' | 'fragment-shader-invocations' | 'compute-shader-invocations';

interface GPUShaderModule {
  label?: string;
}

interface GPUComputePipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
  label?: string;
}

interface GPURenderPipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
  label?: string;
}

interface GPUBindGroupLayout {
  label?: string;
}

interface GPUBindGroup {
  label?: string;
}

interface GPUComputePipelineDescriptor {
  compute: GPUProgrammableStage;
  layout?: GPUPipelineLayout | 'auto';
  label?: string;
}

interface GPURenderPipelineDescriptor {
  vertex: GPUVertexState;
  fragment?: GPUFragmentState;
  primitive?: GPUPrimitiveState;
  depthStencil?: GPUDepthStencilState;
  multisample?: GPUMultisampleState;
  layout?: GPUPipelineLayout | 'auto';
  label?: string;
}

interface GPUProgrammableStage {
  module: GPUShaderModule;
  entryPoint: string;
  constants?: Record<string, number>;
}

interface GPUVertexState extends GPUProgrammableStage {
  buffers?: GPUVertexBufferLayout[];
}

interface GPUFragmentState extends GPUProgrammableStage {
  targets: (GPUColorTargetState | null)[];
}

interface GPUColorTargetState {
  format: GPUTextureFormat;
  blend?: GPUBlendState;
  writeMask?: GPUColorWriteFlags;
}

interface GPUBlendState {
  color: GPUBlendComponent;
  alpha: GPUBlendComponent;
}

interface GPUBlendComponent {
  operation: GPUBlendOperation;
  srcFactor: GPUBlendFactor;
  dstFactor: GPUBlendFactor;
}

type GPUBlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max';
type GPUBlendFactor = 
  | 'zero' | 'one' | 'src' | 'one-minus-src' 
  | 'src-alpha' | 'one-minus-src-alpha' 
  | 'dst' | 'one-minus-dst' 
  | 'dst-alpha' | 'one-minus-dst-alpha' 
  | 'src-alpha-saturated' | 'constant' | 'one-minus-constant';
type GPUColorWriteFlags = number;

interface GPUPrimitiveState {
  topology?: GPUPrimitiveTopology;
  stripIndexFormat?: GPUIndexFormat;
  frontFace?: GPUFrontFace;
  cullMode?: GPUCullMode;
  unclippedDepth?: boolean;
}

type GPUPrimitiveTopology = 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
type GPUIndexFormat = 'uint16' | 'uint32';
type GPUFrontFace = 'ccw' | 'cw';
type GPUCullMode = 'none' | 'front' | 'back';

interface GPUDepthStencilState {
  format: GPUTextureFormat;
  depthWriteEnabled?: boolean;
  depthCompare?: GPUCompareFunction;
  stencilFront?: GPUStencilFaceState;
  stencilBack?: GPUStencilFaceState;
  stencilReadMask?: number;
  stencilWriteMask?: number;
  depthBias?: number;
  depthBiasSlopeScale?: number;
  depthBiasClamp?: number;
}

interface GPUStencilFaceState {
  compare?: GPUCompareFunction;
  failOp?: GPUStencilOperation;
  depthFailOp?: GPUStencilOperation;
  passOp?: GPUStencilOperation;
}

type GPUStencilOperation = 'keep' | 'zero' | 'replace' | 'invert' | 'increment-clamp' | 'decrement-clamp' | 'increment-wrap' | 'decrement-wrap';

interface GPUMultisampleState {
  count?: number;
  mask?: number;
  alphaToCoverageEnabled?: boolean;
}

interface GPUVertexBufferLayout {
  arrayStride: number;
  stepMode?: GPUVertexStepMode;
  attributes: GPUVertexAttribute[];
}

interface GPUVertexAttribute {
  format: GPUVertexFormat;
  offset: number;
  shaderLocation: number;
}

type GPUVertexStepMode = 'vertex' | 'instance';
type GPUVertexFormat = 
  | 'uint8x2' | 'uint8x4' | 'sint8x2' | 'sint8x4' | 'unorm8x2' | 'unorm8x4' | 'snorm8x2' | 'snorm8x4'
  | 'uint16x2' | 'uint16x4' | 'sint16x2' | 'sint16x4' | 'unorm16x2' | 'unorm16x4' | 'snorm16x2' | 'snorm16x4' | 'float16x2' | 'float16x4'
  | 'float32' | 'float32x2' | 'float32x3' | 'float32x4'
  | 'uint32' | 'uint32x2' | 'uint32x3' | 'uint32x4'
  | 'sint32' | 'sint32x2' | 'sint32x3' | 'sint32x4';

interface GPUPipelineLayout {
  label?: string;
}

interface GPUBindGroupLayoutDescriptor {
  entries: GPUBindGroupLayoutEntry[];
  label?: string;
}

interface GPUBindGroupLayoutEntry {
  binding: number;
  visibility: GPUShaderStageFlags;
  buffer?: GPUBufferBindingLayout;
  sampler?: GPUSamplerBindingLayout;
  texture?: GPUTextureBindingLayout;
  storageTexture?: GPUStorageTextureBindingLayout;
  externalTexture?: GPUExternalTextureBindingLayout;
}

type GPUShaderStageFlags = number;

declare const GPUShaderStage: {
  VERTEX: GPUShaderStageFlags;
  FRAGMENT: GPUShaderStageFlags;
  COMPUTE: GPUShaderStageFlags;
};

interface GPUBufferBindingLayout {
  type?: GPUBufferBindingType;
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
}

type GPUBufferBindingType = 'uniform' | 'storage' | 'read-only-storage';

interface GPUSamplerBindingLayout {
  type?: GPUSamplerBindingType;
}

type GPUSamplerBindingType = 'filtering' | 'non-filtering' | 'comparison';

interface GPUTextureBindingLayout {
  sampleType?: GPUTextureSampleType;
  viewDimension?: GPUTextureViewDimension;
  multisampled?: boolean;
}

type GPUTextureSampleType = 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';

interface GPUStorageTextureBindingLayout {
  access?: GPUStorageTextureAccess;
  format: GPUTextureFormat;
  viewDimension?: GPUTextureViewDimension;
}

type GPUStorageTextureAccess = 'write-only';

interface GPUExternalTextureBindingLayout {}

interface GPUBindGroupDescriptor {
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupEntry[];
  label?: string;
}

interface GPUBindGroupEntry {
  binding: number;
  resource: GPUBindingResource;
}

type GPUBindingResource = GPUBufferBinding | GPUSampler | GPUTextureView | GPUExternalTexture;

interface GPUBufferBinding {
  buffer: GPUBuffer;
  offset?: number;
  size?: number;
}

interface GPUExternalTexture {}

interface GPUQueue {
  submit(commandBuffers: GPUCommandBuffer[]): void;
  writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: BufferSource, dataOffset?: number, size?: number): void;
  writeTexture(destination: GPUImageCopyTexture, data: BufferSource, dataLayout: GPUImageDataLayout, size: GPUExtent3D): void;
  copyExternalImageToTexture(source: GPUImageCopyExternalImageSource, destination: GPUImageCopyExternalImageDestination, copySize: GPUExtent3D): void;
  onsubmittedworkdone(): Promise<void>;
  label?: string;
}

interface GPUImageCopyTexture {
  texture: GPUTexture;
  mipLevel?: number;
  origin?: GPUOrigin3D;
  aspect?: GPUTextureAspect;
}

interface GPUImageDataLayout {
  offset?: number;
  bytesPerRow?: number;
  rowsPerImage?: number;
}

type GPUOrigin3D = [number, number, number] | { x?: number; y?: number; z?: number };
type GPUImageCopyExternalImageSource = ImageBitmap | OffscreenCanvas | HTMLCanvasElement | VideoFrame;
type GPUImageCopyExternalImageDestination = GPUImageCopyTextureTagged;

interface GPUImageCopyTextureTagged {
  texture: GPUTexture;
  mipLevel?: number;
  origin?: GPUOrigin3D;
  aspect?: GPUTextureAspect;
  colorSpace?: PredefinedColorSpace;
  premultipliedAlpha?: boolean;
}

interface GPUCommandBuffer {
  label?: string;
}

interface GPUCommandEncoder {
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
  copyBufferToBuffer(source: GPUBuffer, sourceOffset: number, destination: GPUBuffer, destinationOffset: number, size: number): void;
  copyBufferToTexture(source: GPUImageCopyBuffer, destination: GPUImageCopyTexture, copySize: GPUExtent3D): void;
  copyTextureToBuffer(source: GPUImageCopyTexture, destination: GPUImageCopyBuffer, copySize: GPUExtent3D): void;
  copyTextureToTexture(source: GPUImageCopyTexture, destination: GPUImageCopyTexture, copySize: GPUExtent3D): void;
  clearBuffer(buffer: GPUBuffer, offset?: number, size?: number): void;
  pushDebugGroup(groupLabel: string): void;
  popDebugGroup(): void;
  insertDebugMarker(markerLabel: string): void;
  finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
  label?: string;
}

interface GPUComputePassDescriptor {
  label?: string;
}

interface GPUComputePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsetsData: Uint32Array, dynamicOffsetsDataStart: number, dynamicOffsetsDataLength: number): void;
  dispatchWorkgroups(x: number, y?: number, z?: number): void;
  dispatchWorkgroupsIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  pushDebugGroup(groupLabel: string): void;
  popDebugGroup(): void;
  insertDebugMarker(markerLabel: string): void;
  end(): void;
  label?: string;
}

interface GPURenderPassDescriptor {
  colorAttachments: GPURenderPassColorAttachment[];
  depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
  occlusionQuerySet?: GPUQuerySet;
  timestampWrites?: GPURenderPassTimestampWrites;
  maxDrawCount?: number;
  label?: string;
}

interface GPURenderPassColorAttachment {
  view: GPUTextureView;
  resolveTarget?: GPUTextureView;
  clearValue?: GPUColor;
  loadOp: GPULoadOp;
  storeOp: GPUStoreOp;
}

type GPUColor = [number, number, number, number] | { r: number; g: number; b: number; a: number };
type GPULoadOp = 'load' | 'clear';
type GPUStoreOp = 'store' | 'discard';

interface GPURenderPassDepthStencilAttachment {
  view: GPUTextureView;
  depthClearValue?: number;
  depthLoadOp?: GPULoadOp;
  depthStoreOp?: GPUStoreOp;
  depthReadOnly?: boolean;
  stencilClearValue?: number;
  stencilLoadOp?: GPULoadOp;
  stencilStoreOp?: GPUStoreOp;
  stencilReadOnly?: boolean;
}

interface GPURenderPassTimestampWrites {
  querySet: GPUQuerySet;
  beginningOfPassWriteIndex?: number;
  endOfPassWriteIndex?: number;
}

interface GPURenderPassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsetsData: Uint32Array, dynamicOffsetsDataStart: number, dynamicOffsetsDataLength: number): void;
  setVertexBuffer(slot: number, buffer: GPUBuffer | null, offset?: number, size?: number): void;
  setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: number, size?: number): void;
  draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
  drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
  setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void;
  setScissorRect(x: number, y: number, width: number, height: number): void;
  setBlendConstant(color: GPUColor): void;
  setStencilReference(reference: number): void;
  beginOcclusionQuery(queryIndex: number): void;
  endOcclusionQuery(): void;
  executeBundles(bundles: GPURenderBundle[]): void;
  pushDebugGroup(groupLabel: string): void;
  popDebugGroup(): void;
  insertDebugMarker(markerLabel: string): void;
  end(): void;
  label?: string;
}

interface GPURenderBundle {}

interface GPUImageCopyBuffer extends GPUImageDataLayout {
  buffer: GPUBuffer;
}

interface GPUCommandBufferDescriptor {
  label?: string;
}

// 全局命名空间
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
