/**
 * =============================================================================
 * 内存监控工具 - 实时监控内存使用和检测内存泄漏
 * Memory Monitor - Real-time memory tracking and leak detection
 * =============================================================================
 * 
 * 功能：
 * - 实时监控内存使用情况
 * - 检测潜在的内存泄漏
 * - 提供内存使用报告
 * - 自动警告异常内存增长
 */

import { logger } from './utils/Logger';
import { eventCleanupManager } from './EventCleanupManager';

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  listenerCount: number;
  customMetrics: Map<string, number>;
}

export interface MemoryLeakWarning {
  type: 'heap_growth' | 'listener_accumulation' | 'custom_metric';
  message: string;
  details: Record<string, unknown>;
  timestamp: number;
}

export interface MemoryMonitorConfig {
  sampleInterval: number;
  maxSnapshots: number;
  warningThreshold: number;
  listenerGrowthThreshold: number;
  heapGrowthThreshold: number;
  enableAutoWarning: boolean;
}

const DEFAULT_CONFIG: MemoryMonitorConfig = {
  sampleInterval: 5000,
  maxSnapshots: 100,
  warningThreshold: 0.85,
  listenerGrowthThreshold: 50,
  heapGrowthThreshold: 0.1,
  enableAutoWarning: true,
};

export class MemoryMonitor {
  private static instance: MemoryMonitor | null = null;
  private config: MemoryMonitorConfig;
  private snapshots: MemorySnapshot[] = [];
  private customMetrics: Map<string, () => number> = new Map();
  private intervalId: number | null = null;
  private isMonitoring: boolean = false;
  private warnings: MemoryLeakWarning[] = [];
  private onWarningCallback?: (warning: MemoryLeakWarning) => void;
  private getListenerCount: () => number;

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  constructor(
    config: Partial<MemoryMonitorConfig> = {},
    getListenerCount: () => number = () => eventCleanupManager.getListenerCount()
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.getListenerCount = getListenerCount;
  }

  public start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.intervalId = window.setInterval(() => {
      this.takeSnapshot();
    }, this.config.sampleInterval);

    logger.info('MemoryMonitor', 'Started monitoring');
  }

  public stop(): void {
    if (!this.isMonitoring) return;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isMonitoring = false;
    logger.info('MemoryMonitor', 'Stopped monitoring');
  }

  public takeSnapshot(): MemorySnapshot {
    const memory = performance.memory;
    const customMetricsValues = new Map<string, number>();

    for (const [key, getter] of this.customMetrics) {
      try {
        customMetricsValues.set(key, getter());
      } catch (e) {
        logger.warn('MemoryMonitor', `Failed to get custom metric: ${key}`);
      }
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
      listenerCount: this.getListenerCount(),
      customMetrics: customMetricsValues,
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }

    if (this.config.enableAutoWarning) {
      this.checkForLeaks(snapshot);
    }

    return snapshot;
  }

  public registerCustomMetric(name: string, getter: () => number): void {
    this.customMetrics.set(name, getter);
  }

  public unregisterCustomMetric(name: string): void {
    this.customMetrics.delete(name);
  }

  private checkForLeaks(currentSnapshot: MemorySnapshot): void {
    if (this.snapshots.length < 3) return;

    const previousSnapshot = this.snapshots[this.snapshots.length - 2];

    if (currentSnapshot.jsHeapSizeLimit > 0) {
      const usageRatio = currentSnapshot.usedJSHeapSize / currentSnapshot.jsHeapSizeLimit;
      if (usageRatio > this.config.warningThreshold) {
        this.emitWarning({
          type: 'heap_growth',
          message: `内存使用率过高: ${(usageRatio * 100).toFixed(1)}%`,
          details: {
            usedJSHeapSize: currentSnapshot.usedJSHeapSize,
            jsHeapSizeLimit: currentSnapshot.jsHeapSizeLimit,
            usageRatio,
          },
          timestamp: Date.now(),
        });
      }
    }

    const listenerGrowth = currentSnapshot.listenerCount - previousSnapshot.listenerCount;
    if (listenerGrowth > this.config.listenerGrowthThreshold) {
      this.emitWarning({
        type: 'listener_accumulation',
        message: `事件监听器快速增长: +${listenerGrowth}`,
        details: {
          currentCount: currentSnapshot.listenerCount,
          previousCount: previousSnapshot.listenerCount,
          growth: listenerGrowth,
        },
        timestamp: Date.now(),
      });
    }

    if (previousSnapshot.usedJSHeapSize > 0) {
      const heapGrowth = (currentSnapshot.usedJSHeapSize - previousSnapshot.usedJSHeapSize) / previousSnapshot.usedJSHeapSize;
      if (heapGrowth > this.config.heapGrowthThreshold) {
        this.emitWarning({
          type: 'heap_growth',
          message: `堆内存快速增长: +${(heapGrowth * 100).toFixed(1)}%`,
          details: {
            currentHeap: currentSnapshot.usedJSHeapSize,
            previousHeap: previousSnapshot.usedJSHeapSize,
            growthRate: heapGrowth,
          },
          timestamp: Date.now(),
        });
      }
    }

    for (const [key, value] of currentSnapshot.customMetrics) {
      const prevValue = previousSnapshot.customMetrics.get(key);
      if (prevValue !== undefined && value > prevValue * 1.5) {
        this.emitWarning({
          type: 'custom_metric',
          message: `自定义指标 "${key}" 异常增长`,
          details: {
            metric: key,
            currentValue: value,
            previousValue: prevValue,
            growth: value - prevValue,
          },
          timestamp: Date.now(),
        });
      }
    }
  }

  private emitWarning(warning: MemoryLeakWarning): void {
    this.warnings.push(warning);
    logger.warn('MemoryMonitor', `${warning.message}`);

    if (this.onWarningCallback) {
      this.onWarningCallback(warning);
    }
  }

  public onWarning(callback: (warning: MemoryLeakWarning) => void): void {
    this.onWarningCallback = callback;
  }

  public getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  public getWarnings(): MemoryLeakWarning[] {
    return [...this.warnings];
  }

  public clearWarnings(): void {
    this.warnings = [];
  }

  public getReport(): {
    current: MemorySnapshot | null;
    averageHeapSize: number;
    peakHeapSize: number;
    averageListenerCount: number;
    peakListenerCount: number;
    warningCount: number;
    duration: number;
  } {
    if (this.snapshots.length === 0) {
      return {
        current: null,
        averageHeapSize: 0,
        peakHeapSize: 0,
        averageListenerCount: 0,
        peakListenerCount: 0,
        warningCount: this.warnings.length,
        duration: 0,
      };
    }

    const heapSizes = this.snapshots.map(s => s.usedJSHeapSize);
    const listenerCounts = this.snapshots.map(s => s.listenerCount);

    return {
      current: this.snapshots[this.snapshots.length - 1],
      averageHeapSize: heapSizes.reduce((a, b) => a + b, 0) / heapSizes.length,
      peakHeapSize: Math.max(...heapSizes),
      averageListenerCount: listenerCounts.reduce((a, b) => a + b, 0) / listenerCounts.length,
      peakListenerCount: Math.max(...listenerCounts),
      warningCount: this.warnings.length,
      duration: this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp,
    };
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  public printReport(): void {
    const report = this.getReport();
    logger.info('MemoryMonitor', '=== Memory Monitor Report ===');
    logger.info('MemoryMonitor', `Duration: ${(report.duration / 1000).toFixed(1)}s`);
    logger.info('MemoryMonitor', `Current Heap: ${this.formatBytes(report.current?.usedJSHeapSize || 0)}`);
    logger.info('MemoryMonitor', `Average Heap: ${this.formatBytes(report.averageHeapSize)}`);
    logger.info('MemoryMonitor', `Peak Heap: ${this.formatBytes(report.peakHeapSize)}`);
    logger.info('MemoryMonitor', `Current Listeners: ${report.current?.listenerCount || 0}`);
    logger.info('MemoryMonitor', `Average Listeners: ${report.averageListenerCount.toFixed(0)}`);
    logger.info('MemoryMonitor', `Peak Listeners: ${report.peakListenerCount}`);
    logger.info('MemoryMonitor', `Warnings: ${report.warningCount}`);
    logger.info('MemoryMonitor', '=============================');
  }

  public getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number; eventListenerCount: number } | null {
    const memory = performance.memory;
    if (!memory) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        eventListenerCount: this.getListenerCount(),
      };
    }
    return {
      usedJSHeapSize: memory.usedJSHeapSize || 0,
      totalJSHeapSize: memory.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
      eventListenerCount: this.getListenerCount(),
    };
  }

  public checkMemoryPressure(): { level: 'low' | 'moderate' | 'high' | 'critical'; usagePercent: number } {
    const usage = this.getMemoryUsage();
    if (!usage || usage.jsHeapSizeLimit === 0) {
      return { level: 'low', usagePercent: 0 };
    }
    const usagePercent = (usage.usedJSHeapSize / usage.jsHeapSizeLimit) * 100;
    let level: 'low' | 'moderate' | 'high' | 'critical';
    if (usagePercent < 50) {
      level = 'low';
    } else if (usagePercent < 75) {
      level = 'moderate';
    } else if (usagePercent < 90) {
      level = 'high';
    } else {
      level = 'critical';
    }
    return { level, usagePercent };
  }

  public getMemoryTrend(): 'increasing' | 'stable' | 'decreasing' {
    if (this.snapshots.length < 2) {
      return 'stable';
    }
    const recent = this.snapshots.slice(-5);
    if (recent.length < 2) {
      return 'stable';
    }
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / secondHalf.length;
    const change = (secondAvg - firstAvg) / firstAvg;
    if (change > 0.05) {
      return 'increasing';
    } else if (change < -0.05) {
      return 'decreasing';
    }
    return 'stable';
  }

  public destroy(): void {
    this.stop();
    this.snapshots = [];
    this.warnings = [];
    this.customMetrics.clear();
    this.onWarningCallback = undefined;
  }
}

export const createMemoryMonitor = (
  config: Partial<MemoryMonitorConfig> = {},
  getListenerCount?: () => number
): MemoryMonitor => {
  return new MemoryMonitor(config, getListenerCount);
};

export default MemoryMonitor;
