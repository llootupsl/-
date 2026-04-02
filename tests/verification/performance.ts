/**
 * =============================================================================
 * 永夜熵纪 - 性能验证脚本
 * Performance Verification Script
 * =============================================================================
 */

import { performance } from 'perf_hooks';

/** 性能指标 */
interface PerformanceMetrics {
  // 帧率
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameDrops: number; // < 30 FPS
  
  // 内存
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  
  // 渲染
  drawCalls: number;
  triangles: number;
  textures: number;
  buffers: number;
  
  // 模拟
  citizenCount: number;
  entityCount: number;
  systemCount: number;
  
  // 加载
  initTime: number;
  wasmLoadTime: number;
  assetLoadTime: number;
}

/** 性能目标 */
const PERFORMANCE_TARGETS = {
  averageFPS: 60,
  minFPS: 30,
  maxFPS: 120,
  frameDrops: 10, // 最多 10 次掉帧
  
  heapUsedMB: 1024, // 最多 1GB
  heapTotalMB: 2048,
  
  citizenCount: 1000,
  initTime: 3000, // 3 秒
  wasmLoadTime: 500, // 500ms
};

/**
 * 性能验证器
 */
export class PerformanceVerifier {
  private metrics: Partial<PerformanceMetrics> = {};
  private frameTimestamps: number[] = [];
  private isRunning: boolean = false;

  /**
   * 开始监控
   */
  public startMonitoring(): void {
    this.isRunning = true;
    this.frameTimestamps = [];
    
    this.measureFrame();
  }

  /**
   * 测量帧
   */
  private measureFrame(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameTimestamps.push(now);

    // 保留最近 1000 帧
    if (this.frameTimestamps.length > 1000) {
      this.frameTimestamps.shift();
    }

    requestAnimationFrame(() => this.measureFrame());
  }

  /**
   * 停止监控
   */
  public stopMonitoring(): void {
    this.isRunning = false;
    this.calculateFPS();
  }

  /**
   * 计算 FPS
   */
  private calculateFPS(): void {
    if (this.frameTimestamps.length < 2) return;

    const frameTimes: number[] = [];
    
    for (let i = 1; i < this.frameTimestamps.length; i++) {
      frameTimes.push(this.frameTimestamps[i] - this.frameTimestamps[i - 1]);
    }

    const fpsValues = frameTimes.map(t => 1000 / t);
    
    this.metrics.averageFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
    this.metrics.minFPS = Math.min(...fpsValues);
    this.metrics.maxFPS = Math.max(...fpsValues);
    this.metrics.frameDrops = fpsValues.filter(fps => fps < 30).length;
  }

  /**
   * 测量内存
   */
  public measureMemory(): void {
    // @ts-ignore - Node.js memory API
    if (typeof process !== 'undefined' && process.memoryUsage) {
      // @ts-ignore
      const mem = process.memoryUsage();
      this.metrics.heapUsedMB = mem.heapUsed / 1024 / 1024;
      this.metrics.heapTotalMB = mem.heapTotal / 1024 / 1024;
      this.metrics.externalMB = mem.external / 1024 / 1024;
    }
  }

  /**
   * 设置指标
   */
  public setMetric<K extends keyof PerformanceMetrics>(
    key: K,
    value: PerformanceMetrics[K]
  ): void {
    this.metrics[key] = value;
  }

  /**
   * 获取指标
   */
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * 验证是否达标
   */
  public verify(): {
    passed: boolean;
    results: Record<string, { value: number; target: number; passed: boolean }>;
  } {
    const results: Record<string, { value: number; target: number; passed: boolean }> = {};

    // FPS 验证
    if (this.metrics.averageFPS !== undefined) {
      results.averageFPS = {
        value: this.metrics.averageFPS,
        target: PERFORMANCE_TARGETS.averageFPS,
        passed: this.metrics.averageFPS >= PERFORMANCE_TARGETS.averageFPS,
      };
    }

    if (this.metrics.minFPS !== undefined) {
      results.minFPS = {
        value: this.metrics.minFPS,
        target: PERFORMANCE_TARGETS.minFPS,
        passed: this.metrics.minFPS >= PERFORMANCE_TARGETS.minFPS,
      };
    }

    if (this.metrics.frameDrops !== undefined) {
      results.frameDrops = {
        value: this.metrics.frameDrops,
        target: PERFORMANCE_TARGETS.frameDrops,
        passed: this.metrics.frameDrops <= PERFORMANCE_TARGETS.frameDrops,
      };
    }

    // 内存验证
    if (this.metrics.heapUsedMB !== undefined) {
      results.heapUsedMB = {
        value: this.metrics.heapUsedMB,
        target: PERFORMANCE_TARGETS.heapUsedMB,
        passed: this.metrics.heapUsedMB <= PERFORMANCE_TARGETS.heapUsedMB,
      };
    }

    // 加载时间验证
    if (this.metrics.initTime !== undefined) {
      results.initTime = {
        value: this.metrics.initTime,
        target: PERFORMANCE_TARGETS.initTime,
        passed: this.metrics.initTime <= PERFORMANCE_TARGETS.initTime,
      };
    }

    const passed = Object.values(results).every(r => r.passed);

    return { passed, results };
  }

  /**
   * 生成报告
   */
  public generateReport(): string {
    const { passed, results } = this.verify();
    
    let report = '# 性能验证报告\n\n';
    report += `总体状态: ${passed ? '✅ 通过' : '❌ 失败'}\n\n`;
    
    report += '## 详细指标\n\n';
    report += '| 指标 | 实际值 | 目标值 | 状态 |\n';
    report += '|------|--------|--------|------|\n';
    
    for (const [key, result] of Object.entries(results)) {
      const status = result.passed ? '✅' : '❌';
      report += `| ${key} | ${result.value.toFixed(2)} | ${result.target} | ${status} |\n`;
    }
    
    return report;
  }
}

/**
 * 功能验证器
 */
export class FunctionalityVerifier {
  private checks: Map<string, boolean> = new Map();

  /**
   * 添加检查
   */
  public check(name: string, passed: boolean): void {
    this.checks.set(name, passed);
  }

  /**
   * 验证所有功能
   */
  public verify(): {
    passed: boolean;
    total: number;
    passedCount: number;
    failedCount: number;
    failedChecks: string[];
  } {
    const values = Array.from(this.checks.values());
    const passedCount = values.filter(v => v).length;
    const failedCount = values.length - passedCount;
    
    const failedChecks = Array.from(this.checks.entries())
      .filter(([_, passed]) => !passed)
      .map(([name]) => name);

    return {
      passed: failedCount === 0,
      total: values.length,
      passedCount,
      failedCount,
      failedChecks,
    };
  }

  /**
   * 生成报告
   */
  public generateReport(): string {
    const result = this.verify();
    
    let report = '# 功能验证报告\n\n';
    report += `总体状态: ${result.passed ? '✅ 通过' : '❌ 失败'}\n\n`;
    report += `- 总检查数: ${result.total}\n`;
    report += `- 通过: ${result.passedCount}\n`;
    report += `- 失败: ${result.failedCount}\n\n`;
    
    if (result.failedChecks.length > 0) {
      report += '## 失败项\n\n';
      for (const check of result.failedChecks) {
        report += `- ❌ ${check}\n`;
      }
    }
    
    return report;
  }
}

// 默认验证器
export const performanceVerifier = new PerformanceVerifier();
export const functionalityVerifier = new FunctionalityVerifier();

/**
 * 运行完整验证
 */
export async function runFullVerification(): Promise<{
  performance: string;
  functionality: string;
  allPassed: boolean;
}> {
  // 性能验证
  performanceVerifier.startMonitoring();
  await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒监控
  performanceVerifier.stopMonitoring();
  performanceVerifier.measureMemory();

  const performanceReport = performanceVerifier.generateReport();

  // 功能验证
  functionalityVerifier.check('WebGPU Support', typeof navigator !== 'undefined' && 'gpu' in navigator);
  functionalityVerifier.check('WebRTC Support', typeof RTCPeerConnection !== 'undefined');
  functionalityVerifier.check('IndexedDB Support', typeof indexedDB !== 'undefined');
  functionalityVerifier.check('Service Worker Support', 'serviceWorker' in navigator);
  functionalityVerifier.check('WebAuthn Support', typeof PublicKeyCredential !== 'undefined');
  functionalityVerifier.check('Speech API Support', 'speechSynthesis' in window);
  functionalityVerifier.check('Gamepad API Support', 'getGamepads' in navigator);

  const functionalityReport = functionalityVerifier.generateReport();

  const perfResult = performanceVerifier.verify();
  const funcResult = functionalityVerifier.verify();

  return {
    performance: performanceReport,
    functionality: functionalityReport,
    allPassed: perfResult.passed && funcResult.passed,
  };
}

export default {
  PerformanceVerifier,
  FunctionalityVerifier,
  runFullVerification,
};
