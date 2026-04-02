/**
 * 内存基准测试模块
 * 3.27.4 节实现：内存分配和访问性能测试
 */

import { logger } from '../core/utils/Logger';

/**
 * 内存基准测试结果
 */
export interface MemoryBenchmarkResult {
  /** 分配速度 (MB/s) */
  allocationMBps: number;
  /** 释放速度 (MB/s) */
  deallocationMBps: number;
  /** 连续访问带宽 (GB/s) */
  sequentialBandwidthGBps: number;
  /** 随机访问带宽 (GB/s) */
  randomBandwidthGBps: number;
  /** 访问延迟 (ns) */
  accessLatencyNs: number;
  /** GC 暂停时间 (ms) */
  gcPauseMs: number;
  /** 内存使用峰值 (MB) */
  peakMemoryMB: number;
  /** 测试类型 */
  testType: 'TypedArray' | 'ArrayBuffer' | 'Object' | 'Mixed';
}

/**
 * 内存基准测试
 */
export class MemoryBenchmark {
  private gcObserver: PerformanceObserver | null = null;
  private gcEvents: PerformanceEntry[] = [];

  constructor() {
    this.setupGCObserver();
  }

  /**
   * 设置 GC 观察器
   */
  private setupGCObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.gcObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'gc') {
              this.gcEvents.push(entry);
            }
          }
        });
        this.gcObserver.observe({ entryTypes: ['gc'] });
      } catch (error) {
        logger.warn('MemoryBenchmark', 'GC performance observer not available in this environment', error as Error);
      }
    }
  }

  /**
   * 运行内存基准测试
   */
  public async run(durationMs: number = 5000): Promise<MemoryBenchmarkResult> {
    // 预热
    await this.warmup();

    // 测试 TypedArray 性能
    const typedArrayResult = await this.testTypedArrays(durationMs);

    // 测试 ArrayBuffer 性能
    const arrayBufferResult = await this.testArrayBuffers(durationMs);

    // 测试对象分配性能
    const objectResult = await this.testObjectAllocation(durationMs);

    // 合并结果 (取平均)
    return {
      allocationMBps: (typedArrayResult.allocationMBps + arrayBufferResult.allocationMBps) / 2,
      deallocationMBps: (typedArrayResult.deallocationMBps + arrayBufferResult.deallocationMBps) / 2,
      sequentialBandwidthGBps: (typedArrayResult.sequentialBandwidthGBps + arrayBufferResult.sequentialBandwidthGBps) / 2,
      randomBandwidthGBps: (typedArrayResult.randomBandwidthGBps + arrayBufferResult.randomBandwidthGBps) / 2,
      accessLatencyNs: Math.min(typedArrayResult.accessLatencyNs, arrayBufferResult.accessLatencyNs),
      gcPauseMs: this.measureGCPause(),
      peakMemoryMB: this.measurePeakMemory(),
      testType: 'Mixed',
    };
  }

  /**
   * 预热
   */
  private async warmup(): Promise<void> {
    const warmupIterations = 10;
    const warmupDuration = 100;

    for (let i = 0; i < warmupIterations; i++) {
      const buffer = new ArrayBuffer(1024 * 1024);
      const view = new Uint32Array(buffer);
      for (let j = 0; j < view.length; j++) {
        view[j] = j;
      }
      await new Promise(resolve => setTimeout(resolve, warmupDuration));
    }
  }

  /**
   * 测试 TypedArray 性能
   */
  private async testTypedArrays(durationMs: number): Promise<MemoryBenchmarkResult> {
    const allocationSize = 1024 * 1024; // 1MB
    let allocations = 0;
    let totalAllocated = 0;

    // 分配测试
    const allocStart = performance.now();
    while (performance.now() - allocStart < durationMs) {
      const buffer = new ArrayBuffer(allocationSize);
      const view = new Float64Array(buffer);
      // 写入一些数据
      for (let i = 0; i < view.length; i += 100) {
        view[i] = i * 1.0;
      }
      totalAllocated += allocationSize;
      allocations++;
    }
    const allocElapsed = (performance.now() - allocStart) / 1000;

    // 顺序访问测试
    const sequentialBuffer = new ArrayBuffer(64 * 1024 * 1024); // 64MB
    const sequentialView = new Float64Array(sequentialBuffer);
    let sequentialSum = 0;

    const seqStart = performance.now();
    const seqIterations = 1000;
    for (let iter = 0; iter < seqIterations; iter++) {
      for (let i = 0; i < sequentialView.length; i += 4) {
        sequentialSum += sequentialView[i];
      }
    }
    const seqElapsed = (performance.now() - seqStart) / 1000;
    const seqBandwidth = (sequentialBuffer.byteLength * seqIterations) / (seqElapsed * 1e9);

    // 随机访问测试
    const randomIndices = new Uint32Array(1024 * 1024);
    for (let i = 0; i < randomIndices.length; i++) {
      randomIndices[i] = Math.floor(Math.random() * sequentialView.length);
    }
    let randomSum = 0;

    const randStart = performance.now();
    const randIterations = 100;
    for (let iter = 0; iter < randIterations; iter++) {
      for (let i = 0; i < randomIndices.length; i++) {
        randomSum += sequentialView[randomIndices[i]];
      }
    }
    const randElapsed = (performance.now() - randStart) / 1000;
    const randBandwidth = (randomIndices.length * 8 * randIterations) / (randElapsed * 1e9);

    // 延迟测试
    const latencyBuffer = new ArrayBuffer(4096);
    const latencyView = new Uint8Array(latencyBuffer);
    const latencyIterations = 100000;
    const latStart = performance.now();
    for (let i = 0; i < latencyIterations; i++) {
      latencyView[0] = i & 0xff;
      const _ = latencyView[0];
    }
    const latElapsed = (performance.now() - latStart) / latencyIterations;

    // 释放测试
    const deallocBuffers: ArrayBuffer[] = [];
    let deallocations = 0;
    let totalDeallocated = 0;

    for (let i = 0; i < 1000; i++) {
      deallocBuffers.push(new ArrayBuffer(allocationSize));
    }

    const deallocStart = performance.now();
    while (deallocBuffers.length > 0) {
      const buffer = deallocBuffers.pop();
      totalDeallocated += allocationSize;
      deallocations++;
    }
    const deallocElapsed = (performance.now() - deallocStart) / 1000;

    return {
      allocationMBps: (totalAllocated / allocElapsed) / 1e6,
      deallocationMBps: (totalDeallocated / deallocElapsed) / 1e6,
      sequentialBandwidthGBps: seqBandwidth,
      randomBandwidthGBps: randBandwidth,
      accessLatencyNs: latElapsed * 1e6,
      gcPauseMs: 0,
      peakMemoryMB: 0,
      testType: 'TypedArray',
    };
  }

  /**
   * 测试 ArrayBuffer 性能
   */
  private async testArrayBuffers(durationMs: number): Promise<MemoryBenchmarkResult> {
    const bufferSize = 4 * 1024 * 1024; // 4MB
    let allocations = 0;
    let totalAllocated = 0;

    // 分配测试
    const allocStart = performance.now();
    while (performance.now() - allocStart < durationMs) {
      const buffer = new ArrayBuffer(bufferSize);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < view.length; i += 1024) {
        view[i] = i & 0xff;
      }
      totalAllocated += bufferSize;
      allocations++;
    }
    const allocElapsed = (performance.now() - allocStart) / 1000;

    // 顺序访问测试
    const sequentialBuffer = new ArrayBuffer(128 * 1024 * 1024); // 128MB
    const sequentialView = new Uint8Array(sequentialBuffer);
    let sequentialSum = 0;

    const seqStart = performance.now();
    const seqIterations = 100;
    for (let iter = 0; iter < seqIterations; iter++) {
      for (let i = 0; i < sequentialView.length; i++) {
        sequentialSum += sequentialView[i];
      }
    }
    const seqElapsed = (performance.now() - seqStart) / 1000;
    const seqBandwidth = (sequentialBuffer.byteLength * seqIterations) / (seqElapsed * 1e9);

    // 随机访问测试
    const randomIndices = new Uint32Array(512 * 1024);
    for (let i = 0; i < randomIndices.length; i++) {
      randomIndices[i] = Math.floor(Math.random() * sequentialView.length);
    }
    let randomSum = 0;

    const randStart = performance.now();
    const randIterations = 50;
    for (let iter = 0; iter < randIterations; iter++) {
      for (let i = 0; i < randomIndices.length; i++) {
        randomSum += sequentialView[randomIndices[i]];
      }
    }
    const randElapsed = (performance.now() - randStart) / 1000;
    const randBandwidth = (randomIndices.length * randIterations) / (randElapsed * 1e9);

    // 延迟测试
    const latencyBuffer = new ArrayBuffer(8192);
    const latencyView = new Uint16Array(latencyBuffer);
    const latencyIterations = 100000;
    const latStart = performance.now();
    for (let i = 0; i < latencyIterations; i++) {
      latencyView[0] = i & 0xffff;
      const _ = latencyView[0];
    }
    const latElapsed = (performance.now() - latStart) / latencyIterations;

    return {
      allocationMBps: (totalAllocated / allocElapsed) / 1e6,
      deallocationMBps: 0,
      sequentialBandwidthGBps: seqBandwidth,
      randomBandwidthGBps: randBandwidth,
      accessLatencyNs: latElapsed * 1e6,
      gcPauseMs: 0,
      peakMemoryMB: 0,
      testType: 'ArrayBuffer',
    };
  }

  /**
   * 测试对象分配性能
   */
  private async testObjectAllocation(durationMs: number): Promise<MemoryBenchmarkResult> {
    interface TestObject {
      x: number;
      y: number;
      z: number;
      data: number[];
      name: string;
    }

    let allocations = 0;
    let totalAllocated = 0;
    const objectSize = 1024; // 估算对象大小

    // 对象分配测试
    const allocStart = performance.now();
    while (performance.now() - allocStart < durationMs) {
      const obj: TestObject = {
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        data: Array.from({ length: 100 }, () => Math.random()),
        name: 'test',
      };
      totalAllocated += objectSize;
      allocations++;
    }
    const allocElapsed = (performance.now() - allocStart) / 1000;

    return {
      allocationMBps: (totalAllocated / allocElapsed) / 1e6,
      deallocationMBps: (totalAllocated / allocElapsed) / 1e6,
      sequentialBandwidthGBps: 0,
      randomBandwidthGBps: 0,
      accessLatencyNs: 0,
      gcPauseMs: this.measureGCPause(),
      peakMemoryMB: 0,
      testType: 'Object',
    };
  }

  /**
   * 测量 GC 暂停时间
   */
  private measureGCPause(): number {
    if (this.gcEvents.length === 0) {
      return 0;
    }

    let totalPause = 0;
    for (const event of this.gcEvents) {
      totalPause += event.duration;
    }

    return totalPause / this.gcEvents.length;
  }

  /**
   * 测量峰值内存使用
   */
  private measurePeakMemory(): number {
    const memory = performance.memory;
    if (memory) {
      return memory.usedJSHeapSize / 1e6;
    }
    return 0;
  }

  /**
   * 测试内存碎片化影响
   */
  public async testFragmentation(durationMs: number): Promise<{
    beforeDefrag: number;
    afterDefrag: number;
    fragmentationRatio: number;
  }> {
    // 分配不同大小的对象
    const buffers: ArrayBuffer[] = [];
    for (let i = 0; i < 1000; i++) {
      const size = 1024 * (1 + (i % 10));
      buffers.push(new ArrayBuffer(size));
    }

    // 释放奇数索引的缓冲区
    for (let i = 0; i < buffers.length; i += 2) {
      buffers[i] = null;
    }

    const memory = performance.memory;
    const beforeDefrag = memory?.usedJSHeapSize / 1e6 || 0;

    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }

    const afterDefrag = memory?.usedJSHeapSize / 1e6 || 0;

    return {
      beforeDefrag,
      afterDefrag,
      fragmentationRatio: beforeDefrag / afterDefrag,
    };
  }

  /**
   * 测试缓存友好性
   */
  public async testCacheFriendliness(): Promise<{
    cacheHitRatio: number;
    cacheMissPenaltyNs: number;
  }> {
    const size = 1024 * 1024; // 1MB
    const buffer = new Float64Array(size);

    // 填充数据
    for (let i = 0; i < size; i++) {
      buffer[i] = i * 1.0;
    }

    // 顺序访问 (缓存友好)
    let seqSum = 0;
    const seqStart = performance.now();
    for (let iter = 0; iter < 100; iter++) {
      for (let i = 0; i < size; i += 1) {
        seqSum += buffer[i];
      }
    }
    const seqElapsed = performance.now() - seqStart;

    // 跳跃访问 (缓存不友好)
    let jumpSum = 0;
    const jumpStart = performance.now();
    for (let iter = 0; iter < 100; iter++) {
      for (let i = 0; i < size; i += 64) { // 64 * 8 = 512 字节跨度
        jumpSum += buffer[i];
      }
    }
    const jumpElapsed = performance.now() - jumpStart;

    // 计算缓存命中率估算
    const cacheHitRatio = 1 - (jumpElapsed / seqElapsed);

    return {
      cacheHitRatio: Math.max(0, cacheHitRatio),
      cacheMissPenaltyNs: (jumpElapsed - seqElapsed) * 1e6 / 100,
    };
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = null;
    }
    this.gcEvents = [];
  }
}
