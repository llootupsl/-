/**
 * CPU 基准测试模块
 * 3.27.3 节实现：CPU 多核性能测试
 */

import { FPSCounter } from './BenchmarkSuite';

/**
 * CPU 基准测试结果
 */
export interface CPUBenchmarkResult {
  /** 单核性能 (MIPS) */
  singleCoreMIPS: number;
  /** 多核性能 (MIPS) */
  multiCoreMIPS: number;
  /** 多核加速比 */
  speedupRatio: number;
  /** 每秒模拟步数 */
  simulationStepsPerSecond: number;
  /** 平均帧时间 */
  averageFrameTime: number;
}

/**
 * CPU 基准测试
 */
export class CPUBenchmark {
  private workers: Worker[] = [];
  private running: boolean = false;

  /**
   * 运行基准测试
   */
  public async run(durationMs: number): Promise<CPUBenchmarkResult> {
    const cpuCores = navigator.hardwareConcurrency || 4;

    // 单核测试
    const singleCoreResult = await this.runSingleCore(durationMs);

    // 多核测试
    const multiCoreResult = await this.runMultiCore(cpuCores, durationMs);

    // 计算结果
    return {
      singleCoreMIPS: singleCoreResult,
      multiCoreMIPS: multiCoreResult,
      speedupRatio: multiCoreResult / singleCoreResult,
      simulationStepsPerSecond: Math.round(multiCoreResult / 1000),
      averageFrameTime: 1000 / multiCoreResult,
    };
  }

  /**
   * 单核测试
   */
  private async runSingleCore(durationMs: number): Promise<number> {
    const start = performance.now();
    let iterations = 0;
    let result = 0;

    while (performance.now() - start < durationMs) {
      for (let i = 0; i < 10000; i++) {
        result += Math.sin(i) * Math.cos(i) * Math.tan(i);
      }
      iterations++;
    }

    const elapsed = performance.now() - start;
    const mips = (iterations * 10000) / elapsed / 1e6; // 每秒百万次操作

    return mips;
  }

  /**
   * 多核测试
   */
  private async runMultiCore(coreCount: number, durationMs: number): Promise<number> {
    const promises: Promise<number>[] = [];

    for (let i = 0; i < coreCount; i++) {
      promises.push(this.runWorker(durationMs));
    }

    const results = await Promise.all(promises);
    return results.reduce((sum, r) => sum + r, 0);
  }

  /**
   * Worker 测试
   */
  private runWorker(durationMs: number): Promise<number> {
    return new Promise((resolve) => {
      const worker = new Worker(
        new URL('./workers/bench.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const timeout = setTimeout(() => {
        worker.terminate();
        resolve(0);
      }, durationMs + 1000);

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(e.data.mips);
      };

      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(0);
      };

      worker.postMessage({ type: 'compute', durationMs });
    });
  }

  /**
   * 清理
   */
  public dispose(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
  }
}

/**
 * 内存带宽基准测试
 */
export class MemoryBenchmark {
  /**
   * 测试内存带宽
   */
  public async run(durationMs: number): Promise<{
    readBandwidthGBps: number;
    writeBandwidthGBps: number;
    copyBandwidthGBps: number;
    latencyNs: number;
  }> {
    const size = 64 * 1024 * 1024; // 64MB

    // 读带宽测试
    const readBandwidth = await this.testRead(size, durationMs);

    // 写带宽测试
    const writeBandwidth = await this.testWrite(size, durationMs);

    // 拷贝带宽测试
    const copyBandwidth = await this.testCopy(size, durationMs);

    // 延迟测试
    const latency = await this.testLatency();

    return {
      readBandwidthGBps: readBandwidth,
      writeBandwidthGBps: writeBandwidth,
      copyBandwidthGBps: copyBandwidth,
      latencyNs: latency,
    };
  }

  private async testRead(size: number, durationMs: number): Promise<number> {
    const buffer = new ArrayBuffer(size);
    const view = new Uint8Array(buffer);

    let totalBytes = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      for (let i = 0; i < size; i += 4096) {
        const _ = view[i];
      }
      totalBytes += size;
    }

    const elapsed = (performance.now() - start) / 1000; // 秒
    return (totalBytes / elapsed) / 1e9; // GB/s
  }

  private async testWrite(size: number, durationMs: number): Promise<number> {
    const buffer = new ArrayBuffer(size);
    const view = new Uint8Array(buffer);

    let totalBytes = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      for (let i = 0; i < size; i += 4096) {
        view[i] = i & 0xff;
      }
      totalBytes += size;
    }

    const elapsed = (performance.now() - start) / 1000;
    return (totalBytes / elapsed) / 1e9;
  }

  private async testCopy(size: number, durationMs: number): Promise<number> {
    const src = new ArrayBuffer(size);
    const dst = new ArrayBuffer(size);
    const srcView = new Uint8Array(src);
    const dstView = new Uint8Array(dst);

    let totalBytes = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      for (let i = 0; i < size; i += 4096) {
        dstView[i] = srcView[i];
      }
      totalBytes += size;
    }

    const elapsed = (performance.now() - start) / 1000;
    return (totalBytes / elapsed) / 1e9;
  }

  private async testLatency(): Promise<number> {
    const buffer = new ArrayBuffer(4096);
    const view = new Uint8Array(buffer);

    const iterations = 10000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      view[0] = i & 0xff;
      const _ = view[0];
    }

    const elapsed = (performance.now() - start) / iterations; // 纳秒
    return elapsed * 1e6; // ns
  }
}
