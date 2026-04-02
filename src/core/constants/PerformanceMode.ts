/**
 * 性能模式枚举
 * 用户可在设置中选择三种模式，控制预热强度和资源占用
 */
export enum PerformanceMode {
  APEX = 'apex',              // 神之领域 - 超越一切限制
  EXTREME = 'extreme',        // 极致性能模式 - 追求极限性能
  BALANCED = 'balanced',      // 均衡模式 - 平衡性能与功耗（默认）
  ECO = 'eco'                 // 节能模式 - 降低资源占用
}

/**
 * 性能模式配置接口
 */
export interface WarmupConfig {
  // 内存分配 MB
  memoryMB: number;
  // Worker 数量
  workerCount: number;
  // WebTransport 保活
  webTransportKeepAlive: boolean;
  // 神经计算预热
  neuralComputeEnabled: boolean;
  // 预热总时长 ms
  preheatDuration: number;
  // 帧率上限 null = 无上限
  fpsCap: number | null;
  // 是否在后台节流
  backgroundThrottle: boolean;
  // 粒子数量上限
  particleCount: number;
  // 市民数量上限
  maxCitizens: number;
  // Wasm SIMD 优化
  wasmSimd: boolean;
  // WebNN 启用
  webnnEnabled: boolean;
  // GPU 计算着色器
  gpuComputeEnabled: boolean;
  // 光线追踪启用
  raytracingEnabled: boolean;
}

/**
 * 性能模式配置表
 * 所有预热子模块均执行，性能模式控制参数强度
 */
export const PERFORMANCE_CONFIGS: Record<PerformanceMode, WarmupConfig> = {
  [PerformanceMode.APEX]: {
    memoryMB: 1024,
    workerCount: Math.min(navigator.hardwareConcurrency ?? 4, 32),
    webTransportKeepAlive: true,
    neuralComputeEnabled: true,
    preheatDuration: 8000,
    fpsCap: null,
    backgroundThrottle: false,
    particleCount: 1_000_000,
    maxCitizens: 100_000,
    wasmSimd: true,
    webnnEnabled: true,
    gpuComputeEnabled: true,
    raytracingEnabled: true,
  },
  [PerformanceMode.EXTREME]: {
    memoryMB: 512,
    workerCount: Math.min(navigator.hardwareConcurrency ?? 4, 16),
    webTransportKeepAlive: true,
    neuralComputeEnabled: true,
    preheatDuration: 5000,
    fpsCap: null,
    backgroundThrottle: false,
    particleCount: 100000,
    maxCitizens: 10000,
    wasmSimd: true,
    webnnEnabled: true,
    gpuComputeEnabled: true,
    raytracingEnabled: true,
  },
  [PerformanceMode.BALANCED]: {
    memoryMB: 256,
    workerCount: Math.max(2, Math.floor((navigator.hardwareConcurrency ?? 4) / 2)),
    webTransportKeepAlive: false,
    neuralComputeEnabled: true,
    preheatDuration: 3000,
    fpsCap: 60,
    backgroundThrottle: true,
    particleCount: 50000,
    maxCitizens: 5000,
    wasmSimd: true,
    webnnEnabled: false,
    gpuComputeEnabled: true,
    raytracingEnabled: false,
  },
  [PerformanceMode.ECO]: {
    memoryMB: 128,
    workerCount: 2,
    webTransportKeepAlive: false,
    neuralComputeEnabled: false,
    preheatDuration: 2000,
    fpsCap: 30,
    backgroundThrottle: true,
    particleCount: 10000,
    maxCitizens: 2000,
    wasmSimd: false,
    webnnEnabled: false,
    gpuComputeEnabled: false,
    raytracingEnabled: false,
  },
};

/**
 * 预热阶段枚举
 */
export enum WarmupPhase {
  SYNC = 'sync',           // HTML解析时同步执行
  ASYNC = 'async',         // 页面可见后异步执行
  FINAL = 'final',         // 用户首次交互前完成
}

/**
 * 预热状态枚举
 */
export enum WarmupState {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 预热结果
 */
export interface WarmupResult {
  success: boolean;
  phase: WarmupPhase;
  duration: number;
  details: Record<string, {
    success: boolean;
    error?: string;
    fallback?: string;
  }>;
}

/**
 * 获取性能模式显示名称
 */
export function getPerformanceModeName(mode: PerformanceMode): string {
  switch (mode) {
    case PerformanceMode.APEX:
      return '神之领域';
    case PerformanceMode.EXTREME:
      return '极致性能';
    case PerformanceMode.BALANCED:
      return '均衡模式';
    case PerformanceMode.ECO:
      return '节能模式';
  }
}

/**
 * 获取性能模式描述
 */
export function getPerformanceModeDescription(mode: PerformanceMode): string {
  switch (mode) {
    case PerformanceMode.APEX:
      return '超越物理极限，解锁宇宙法则，适用于顶级硬件';
    case PerformanceMode.EXTREME:
      return '追求极限性能，启用所有硬件加速，不设功耗限制';
    case PerformanceMode.BALANCED:
      return '平衡性能与功耗，适合日常使用（默认）';
    case PerformanceMode.ECO:
      return '降低资源占用，延长设备续航';
  }
}
