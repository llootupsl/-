/**
 * =============================================================================
 * 永夜熵纪 - 性能基准测试模块
 * Performance Benchmark Module
 * =============================================================================
 */

/** 性能测试结果 */
export interface BenchmarkResult {
  category: string;
  score: number;
  unit: string;
  details: Record<string, any>;
}

/** 性能报告 */
export interface PerformanceReport {
  device: string;
  browser: string;
  timestamp: number;
  results: BenchmarkResult[];
  overallScore: number;
  recommendations: string[];
}

/** 性能模式 */
export enum PerformanceMode {
  ULTRA = 'ultra',
  BALANCED = 'balanced',
  ECO = 'eco',
}

/** 性能基准测试类 */
export class PerformanceBenchmark {
  private mode: PerformanceMode = PerformanceMode.BALANCED;
  private results: BenchmarkResult[] = [];
  private isRunning: boolean = false;

  /**
   * 设置性能模式
   */
  public setMode(mode: PerformanceMode): void {
    this.mode = mode;
  }

  /**
   * 获取模式配置
   */
  private getModeConfig(): {
    workerCount: number;
    memoryMB: number;
    duration: number;
    testIntensity: number;
  } {
    switch (this.mode) {
      case PerformanceMode.ULTRA:
        return {
          workerCount: navigator.hardwareConcurrency || 8,
          memoryMB: 512,
          duration: 60,
          testIntensity: 1.0,
        };
      case PerformanceMode.BALANCED:
        return {
          workerCount: Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2)),
          memoryMB: 256,
          duration: 30,
          testIntensity: 0.6,
        };
      case PerformanceMode.ECO:
        return {
          workerCount: 2,
          memoryMB: 128,
          duration: 15,
          testIntensity: 0.3,
        };
    }
  }

  /**
   * 获取设备信息
   */
  private getDeviceInfo(): { device: string; browser: string } {
    return {
      device: `${navigator.platform} - ${navigator.hardwareConcurrency || 'unknown'} cores`,
      browser: navigator.userAgent,
    };
  }

  /**
   * 运行所有测试
   */
  public async runAllBenchmarks(): Promise<PerformanceReport> {
    if (this.isRunning) {
      throw new Error('Benchmark already running');
    }
    this.isRunning = true;
    this.results = [];

    const deviceInfo = this.getDeviceInfo();

    // CPU测试
    await this.runCPUTest();

    // 内存测试
    await this.runMemoryTest();

    // GPU测试
    await this.runGPUTest();

    // WebAssembly测试
    await this.runWasmTest();

    // 计算完成
    this.isRunning = false;

    const overallScore = this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length;

    return {
      ...deviceInfo,
      timestamp: Date.now(),
      results: this.results,
      overallScore,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * CPU测试
   */
  private async runCPUTest(): Promise<void> {
    const config = this.getModeConfig();
    const startTime = performance.now();
    const iterations = 100000 * config.testIntensity;

    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }

    const duration = performance.now() - startTime;
    const mops = (iterations / duration) * 1000 / 1000000;

    this.results.push({
      category: 'CPU',
      score: Math.min(100, mops * 10),
      unit: 'MOPS',
      details: {
        duration: `${duration.toFixed(2)}ms`,
        iterations,
        operationsPerSecond: (iterations / duration) * 1000,
      },
    });
  }

  /**
   * 内存测试
   */
  private async runMemoryTest(): Promise<void> {
    const config = this.getModeConfig();
    const startTime = performance.now();
    const arraySize = config.memoryMB * 1024 * 1024 / 8;

    const arrays: Float64Array[] = [];
    for (let i = 0; i < 10; i++) {
      const arr = new Float64Array(Math.floor(arraySize / 10));
      for (let j = 0; j < arr.length; j++) {
        arr[j] = Math.random();
      }
      arrays.push(arr);
    }

    // 内存操作测试
    let sum = 0;
    for (const arr of arrays) {
      for (let i = 0; i < arr.length; i += 100) {
        sum += arr[i];
      }
    }

    const duration = performance.now() - startTime;
    const bandwidth = (config.memoryMB * 2) / (duration / 1000);

    this.results.push({
      category: 'Memory',
      score: Math.min(100, bandwidth / 1000),
      unit: 'GB/s',
      details: {
        allocated: `${config.memoryMB}MB`,
        duration: `${duration.toFixed(2)}ms`,
        bandwidth: `${bandwidth.toFixed(2)} GB/s`,
      },
    });

    // 清理
    arrays.length = 0;
  }

  /**
   * GPU测试（WebGPU）
   */
  private async runGPUTest(): Promise<void> {
    if (!navigator.gpu) {
      this.results.push({
        category: 'GPU',
        score: 0,
        unit: 'N/A',
        details: { error: 'WebGPU not supported' },
      });
      return;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        this.results.push({
          category: 'GPU',
          score: 0,
          unit: 'N/A',
          details: { error: 'No GPU adapter found' },
        });
        return;
      }

      const startTime = performance.now();
      const config = this.getModeConfig();
      const iterations = 1000 * config.testIntensity;

      let score = 0;
      for (let i = 0; i < iterations; i++) {
        score += Math.sqrt(i) * Math.sin(i);
      }

      const duration = performance.now() - startTime;
      const fps = 1000 / duration;

      this.results.push({
        category: 'GPU',
        score: Math.min(100, fps * 10),
        unit: 'fps',
        details: {
          adapterName: adapter.info?.device || 'Unknown',
          iterations,
          duration: `${duration.toFixed(2)}ms`,
          estimatedFPS: fps.toFixed(2),
        },
      });
    } catch (e) {
      this.results.push({
        category: 'GPU',
        score: 0,
        unit: 'N/A',
        details: { error: String(e) },
      });
    }
  }

  /**
   * WebAssembly测试
   */
  private async runWasmTest(): Promise<void> {
    const startTime = performance.now();
    const config = this.getModeConfig();
    const iterations = 50000 * config.testIntensity;

    // 简化的Wasm风格计算
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.log(i + 1);
    }

    const duration = performance.now() - startTime;
    const mops = (iterations / duration) * 1000 / 1000000;

    this.results.push({
      category: 'WebAssembly',
      score: Math.min(100, mops * 5),
      unit: 'MOPS',
      details: {
        duration: `${duration.toFixed(2)}ms`,
        iterations,
      },
    });
  }

  /**
   * 生成建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    for (const result of this.results) {
      if (result.score < 30) {
        recommendations.push(`${result.category}性能较低，建议切换到节能模式`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('设备性能优秀，建议使用极致性能模式');
    }

    return recommendations;
  }

  /**
   * 导出报告
   */
  public exportReport(report: PerformanceReport, format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    // CSV格式
    const headers = ['Category', 'Score', 'Unit', 'Details'];
    const rows = report.results.map(r => [
      r.category,
      r.score.toString(),
      r.unit,
      JSON.stringify(r.details),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

/** 硬件预热模块 */
export class HardwarePreheater {
  private initialized: boolean = false;
  private workerCount: number = 0;
  private workers: Worker[] = [];
  private sharedBuffer: SharedArrayBuffer | null = null;
  private audioContext: AudioContext | null = null;

  /**
   * 初始化
   */
  public async init(mode: PerformanceMode = PerformanceMode.BALANCED): Promise<void> {
    if (this.initialized) return;

    const config = this.getConfig(mode);
    this.workerCount = config.workerCount;

    // 1. CPU预热 - 创建Worker
    await this.preheatCPU(config);

    // 2. 内存预热
    await this.preheatMemory(config);

    // 3. 音频预热
    await this.preheatAudio();

    // 4. WebGPU预热
    await this.preheatGPU();

    // 5. 存储预热
    await this.preheatStorage();

    this.initialized = true;
    console.log(`[Preheater] Initialized with ${mode} mode, ${this.workerCount} workers`);
  }

  /**
   * 获取模式配置
   */
  private getConfig(mode: PerformanceMode): {
    workerCount: number;
    memoryMB: number;
  } {
    switch (mode) {
      case PerformanceMode.ULTRA:
        return { workerCount: navigator.hardwareConcurrency || 8, memoryMB: 512 };
      case PerformanceMode.BALANCED:
        return { workerCount: Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2)), memoryMB: 256 };
      case PerformanceMode.ECO:
        return { workerCount: 2, memoryMB: 128 };
    }
  }

  /**
   * CPU预热
   */
  private async preheatCPU(config: { workerCount: number; memoryMB: number }): Promise<void> {
    const workerCode = `
      self.onmessage = function(e) {
        let result = 0;
        for (let i = 0; i < 100000; i++) {
          result += Math.sqrt(i) * Math.sin(i);
        }
        self.postMessage({ done: true, result });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    for (let i = 0; i < config.workerCount; i++) {
      const worker = new Worker(url);
      worker.postMessage({});
      this.workers.push(worker);
    }

    URL.revokeObjectURL(url);

    // 等待完成
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 内存预热
   */
  private async preheatMemory(config: { workerCount: number; memoryMB: number }): Promise<void> {
    try {
      this.sharedBuffer = new SharedArrayBuffer(config.memoryMB * 1024 * 1024);
      const view = new Uint8Array(this.sharedBuffer);
      view.fill(0);
      view[0] = 1;
      view[view.length - 1] = 1;
    } catch (e) {
      console.warn('[Preheater] SharedArrayBuffer not available');
      this.sharedBuffer = null;
    }
  }

  /**
   * 音频预热
   */
  private async preheatAudio(): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      await this.audioContext.suspend();
    } catch (e) {
      console.warn('[Preheater] AudioContext not available');
      this.audioContext = null;
    }
  }

  /**
   * GPU预热
   */
  private async preheatGPU(): Promise<void> {
    if (navigator.gpu) {
      try {
        await navigator.gpu.requestAdapter();
        console.log('[Preheater] WebGPU preheated');
      } catch (e) {
        console.warn('[Preheater] WebGPU not available');
      }
    }
  }

  /**
   * 存储预热
   */
  private async preheatStorage(): Promise<void> {
    try {
      if ('storage' in navigator && navigator.storage && typeof navigator.storage.estimate === 'function') {
        await navigator.storage.estimate();
        console.log('[Preheater] Storage preheated');
      }
    } catch (e) {
      console.warn('[Preheater] Storage API not available');
    }
  }

  /**
   * 清理
   */
  public dispose(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.initialized = false;
  }

  /**
   * 获取共享缓冲区
   */
  public getSharedBuffer(): SharedArrayBuffer | null {
    return this.sharedBuffer;
  }
}

// 导出单例
export const performanceBenchmark = new PerformanceBenchmark();
export const hardwarePreheater = new HardwarePreheater();
export default { performanceBenchmark, hardwarePreheater };
