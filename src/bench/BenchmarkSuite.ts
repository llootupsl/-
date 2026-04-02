/**
 * 性能基准测试套件
 * 3.27 节实现：专业级硬件性能评测工具
 */

import { PerformanceMode } from '@/core/constants/PerformanceMode';
import type { WarmupConfig } from '@/core/constants/PerformanceMode';

/**
 * 基准测试配置
 */
export interface BenchmarkConfig {
  /** 测试时长（秒） */
  duration: 30 | 60 | 120 | -1;
  /** 负载等级 */
  loadLevel: 'light' | 'standard' | 'extreme';
  /** 预热时长（秒） */
  warmupSeconds: number;
}

/**
 * 单项测试结果
 */
export interface BenchmarkResult {
  /** 测试类别 */
  category: string;
  /** 分数 */
  score: number;
  /** 百分位数 */
  percentile: number;
  /** 详细信息 */
  details: Record<string, number>;
  /** 设备信息 */
  device: DeviceInfo;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  /** 浏览器 */
  browser: string;
  /** 版本 */
  browserVersion: string;
  /** 操作系统 */
  os: string;
  /** CPU 核心数 */
  cpuCores: number;
  /** 内存 (GB) */
  memoryGB: number;
  /** GPU 型号 */
  gpu: string;
  /** GPU 厂商 */
  gpuVendor: string;
  /** 是否支持 WebGPU */
  webgpu: boolean;
  /** 是否支持 WebGL */
  webgl: boolean;
  /** 设备类型 */
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

/**
 * 压力测试结果
 */
export interface StressTestResult {
  /** 最大负载 */
  maxLoad: number;
  /** 崩溃点 */
  crashPoint: number;
  /** 崩溃时的 FPS */
  fpsAtCrash: number;
}

/**
 * 基准测试结果
 */
export interface BenchmarkReport {
  /** 总体分数 */
  overallScore: number;
  /** 单项测试结果 */
  results: BenchmarkResult[];
  /** 设备信息 */
  device: DeviceInfo;
  /** 生成时间 */
  generatedAt: number;
  /** 测试配置 */
  config: BenchmarkConfig;
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  // 检测浏览器
  let browser = 'Unknown';
  let browserVersion = '';

  if (ua.includes('Chrome')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
    browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || '';
  }

  // 检测操作系统
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  // CPU 核心数
  const cpuCores = navigator.hardwareConcurrency || 4;

  // 内存 (GB)
  const memoryGB = navigator.deviceMemory
    ? navigator.deviceMemory
    : Math.round(performance.memory?.jsHeapSizeLimit / 1e9) || 8;

  // GPU 检测
  let gpu = 'Unknown';
  let gpuVendor = 'Unknown';

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
      gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
    }
  }

  // WebGPU 支持
  const webgpu = 'gpu' in navigator;

  // WebGL 支持
  const webgl = !!gl;

  // 设备类型
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/mobile|android|iphone/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  }

  return {
    browser,
    browserVersion,
    os,
    cpuCores,
    memoryGB,
    gpu,
    gpuVendor,
    webgpu,
    webgl,
    deviceType,
  };
}

/**
 * FPS 计数器
 */
export class FPSCounter {
  private frames: number[] = [];
  private lastTime: number = 0;
  private rafId: number = 0;

  /**
   * 开始计数
   */
  public start(): void {
    this.frames = [];
    this.lastTime = globalThis.performance.now();

    const tick = () => {
      const now = globalThis.performance.now();
      const delta = now - this.lastTime;

      if (delta > 0) {
        this.frames.push(1000 / delta);
      }

      this.lastTime = now;
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  /**
   * 停止计数
   */
  public stop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  /**
   * 获取平均 FPS
   */
  public getAverageFPS(): number {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return sum / this.frames.length;
  }

  /**
   * 获取最小 FPS
   */
  public getMinFPS(): number {
    if (this.frames.length === 0) return 0;
    return Math.min(...this.frames);
  }

  /**
   * 获取最大 FPS
   */
  public getMaxFPS(): number {
    if (this.frames.length === 0) return 0;
    return Math.max(...this.frames);
  }

  /**
   * 获取 FPS 统计数据
   */
  public getStats(): { avg: number; min: number; max: number; p1: number; p50: number; p95: number; p99: number } {
    if (this.frames.length === 0) {
      return { avg: 0, min: 0, max: 0, p1: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.frames].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      avg: this.getAverageFPS(),
      min: sorted[0],
      max: sorted[len - 1],
      p1: sorted[Math.floor(len * 0.01)],
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }
}

/**
 * 内存计数器
 */
export class MemoryCounter {
  /**
   * 获取内存使用情况
   */
  public getMemory(): { used: number; total: number; limit: number } | null {
    const memory = performance.memory;

    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize / 1e6,
      total: memory.totalJSHeapSize / 1e6,
      limit: memory.jsHeapSizeLimit / 1e6,
    };
  }
}

/**
 * 计算百分位数分数
 */
export function calculatePercentileScore(
  value: number,
  referenceValues: number[]
): number {
  const sorted = [...referenceValues].sort((a, b) => a - b);
  const rank = sorted.findIndex(v => v >= value);
  if (rank === -1) return 100;
  return Math.round((rank / sorted.length) * 100);
}

/**
 * 基准测试套件类
 */
export class BenchmarkSuite {
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = {
      duration: config.duration ?? 30,
      loadLevel: config.loadLevel ?? 'standard',
      warmupSeconds: config.warmupSeconds ?? 5,
    };
  }

  /**
   * 运行所有基准测试
   */
  public async runAll(): Promise<BenchmarkReport> {
    const device = getDeviceInfo();
    // 这里可以添加具体的测试逻辑
    return {
      overallScore: 0,
      results: this.results,
      device,
      generatedAt: Date.now(),
      config: this.config,
    };
  }

  /**
   * 获取配置
   */
  public getConfig(): BenchmarkConfig {
    return { ...this.config };
  }
}

/**
 * 统一性能指标对象
 */
export const performanceMetrics = {
  fps: 60,
  frameTime: 16.67,
  score: 100,
  getScore: () => 100,
};
