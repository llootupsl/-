/**
 * 极速预热引擎 - 核心管理器
 * 4.6 节实现：零感知预热所有硬件资源
 */

// 重新导出 PerformanceMode 中的类型
export type {
  WarmupConfig,
  WarmupPhase,
  WarmupState,
  WarmupResult,
} from '@/core/constants/PerformanceMode';

import {
  PerformanceMode,
  WarmupConfig,
  PERFORMANCE_CONFIGS,
  WarmupPhase,
  WarmupState,
  WarmupResult,
  getPerformanceModeName,
} from '@/core/constants/PerformanceMode';
import { logger } from '@/core/utils/Logger';
import { CPUPreheater } from './CPUPreheater';
import { GPUPreheater } from './GPUPreheater';
import { MemoryPreheater } from './MemoryPreheater';
import { NetworkPreheater } from './NetworkPreheater';
import { StoragePreheater } from './StoragePreheater';
import { AudioPreheater } from './AudioPreheater';
import { VideoPreheater } from './VideoPreheater';
import { NeuralPreheater } from './NeuralPreheater';
import { WasmPreheater } from './WasmPreheater';

/**
 * 预热模块接口
 */
export interface IWarmupModule {
  /** 模块名称 */
  name: string;
  /** 预热阶段 */
  phase: WarmupPhase;
  /** 执行预热 */
  preheat(config: WarmupConfig): Promise<{ success: boolean; fallback?: string; error?: string }>;
}

/**
 * 预热进度回调
 */
export type WarmupProgressCallback = (progress: WarmupProgress) => void;

/**
 * 预热进度
 */
export interface WarmupProgress {
  /** 当前阶段 */
  phase: WarmupPhase;
  /** 当前模块 */
  currentModule: string;
  /** 完成模块数 */
  completedModules: number;
  /** 总模块数 */
  totalModules: number;
  /** 进度百分比 */
  percentage: number;
  /** 预估剩余时间 (ms) */
  estimatedRemaining: number;
}

/**
 * 预热完成回调
 */
export type WarmupCompleteCallback = (result: WarmupResult) => void;

/**
 * 极速预热引擎 - 总管理器
 *
 * 设计目标：
 * - 零感知预热：页面加载时立即无感调用所有硬件资源
 * - 无额外授权：所有预热操作均不触发浏览器权限弹窗
 * - 极致性能：消除首次加载延迟和 JIT 编译开销
 * - 用户可控：性能模式控制预热强度
 * - 必选性：所有预热子模块均执行，回退机制保证兼容
 */
export class WarmupManager {
  private static instance: WarmupManager | null = null;

  private mode: PerformanceMode = PerformanceMode.BALANCED;
  private config: WarmupConfig;
  private state: WarmupState = WarmupState.IDLE;

  private modules: IWarmupModule[] = [];
  private progress: Map<string, { success: boolean; fallback?: string; error?: string }> = new Map();

  private progressCallbacks: WarmupProgressCallback[] = [];
  private completeCallbacks: WarmupCompleteCallback[] = [];

  private startTime: number = 0;
  private syncPhaseEndTime: number = 0;
  private asyncPhaseEndTime: number = 0;

  /**
   * 获取单例实例
   */
  public static getInstance(): WarmupManager {
    if (!WarmupManager.instance) {
      WarmupManager.instance = new WarmupManager();
    }
    return WarmupManager.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    this.config = PERFORMANCE_CONFIGS[this.mode];
    this.registerModules();
  }

  /**
   * 注册所有预热模块
   */
  private registerModules(): void {
    this.modules = [
      // 同步阶段 (HTML 解析时执行)
      new MemoryPreheater(),
      new CPUPreheater(),
      new GPUPreheater(),

      // 异步阶段 (页面可见后执行)
      new NetworkPreheater(),
      new StoragePreheater(),
      new AudioPreheater(),
      new VideoPreheater(),
      new NeuralPreheater(),
      new WasmPreheater(),
    ];

    // 按阶段排序
    this.modules.sort((a, b) => {
      const phaseOrder = { [WarmupPhase.SYNC]: 0, [WarmupPhase.ASYNC]: 1, [WarmupPhase.FINAL]: 2 };
      return phaseOrder[a.phase] - phaseOrder[b.phase];
    });
  }

  /**
   * 设置性能模式
   */
  public setMode(mode: PerformanceMode): void {
    this.mode = mode;
    this.config = PERFORMANCE_CONFIGS[mode];

    // 保存到本地存储
    try {
      localStorage.setItem('omnis_performance_mode', mode);
    } catch (error) {
      logger.warn('WarmupManager', 'Failed to save performance mode to localStorage', error as Error);
    }
  }

  /**
   * 获取当前性能模式
   */
  public getMode(): PerformanceMode {
    return this.mode;
  }

  /**
   * 获取当前配置
   */
  public getConfig(): WarmupConfig {
    return { ...this.config };
  }

  /**
   * 获取当前状态
   */
  public getState(): WarmupState {
    return this.state;
  }

  /**
   * 从存储加载性能模式
   */
  public loadSavedMode(): void {
    try {
      const saved = localStorage.getItem('omnis_performance_mode');
      if (saved && Object.values(PerformanceMode).includes(saved as PerformanceMode)) {
        this.setMode(saved as PerformanceMode);
      }
    } catch (error) {
      logger.warn('WarmupManager', 'Failed to load saved performance mode from localStorage', error as Error);
    }
  }

  /**
   * 执行完整预热流程
   */
  public async warmup(mode?: PerformanceMode): Promise<WarmupResult> {
    if (mode) {
      this.setMode(mode);
    }

    if (this.state === WarmupState.RUNNING) {
      logger.warn('WarmupManager', 'Warmup already running');
      return this.createResult(WarmupPhase.SYNC, false);
    }

    this.state = WarmupState.RUNNING;
    this.startTime = performance.now();
    this.progress.clear();

    logger.info('WarmupManager', `Starting warmup in ${getPerformanceModeName(this.mode)} mode`);

    try {
      // 阶段 1: 同步预热 (HTML 解析时)
      await this.runPhase(WarmupPhase.SYNC);
      this.syncPhaseEndTime = performance.now();

      // 阶段 2: 异步预热 (页面可见后)
      await this.runPhase(WarmupPhase.ASYNC);
      this.asyncPhaseEndTime = performance.now();

      // 阶段 3: 最终预热 (用户首次交互前)
      await this.runPhase(WarmupPhase.FINAL);

      this.state = WarmupState.COMPLETED;
      const result = this.createResult(WarmupPhase.FINAL, true);

      console.log(`[WarmupManager] Warmup completed in ${performance.now() - this.startTime}ms`);

      // 通知完成回调
      this.completeCallbacks.forEach(cb => cb(result));

      return result;
    } catch (error) {
      this.state = WarmupState.FAILED;
      const result = this.createResult(WarmupPhase.FINAL, false);

      console.error('[WarmupManager] Warmup failed:', error);

      this.completeCallbacks.forEach(cb => cb(result));

      return result;
    }
  }

  /**
   * 执行指定阶段的预热
   */
  private async runPhase(phase: WarmupPhase): Promise<void> {
    const phaseModules = this.modules.filter(m => m.phase === phase);
    const totalModules = phaseModules.length;

    for (let i = 0; i < phaseModules.length; i++) {
      const module = phaseModules[i];

      // 发送进度更新
      this.emitProgress({
        phase,
        currentModule: module.name,
        completedModules: i,
        totalModules: this.modules.length,
        percentage: Math.round(((i + 1) / this.modules.length) * 100),
        estimatedRemaining: this.estimateRemaining(i + 1),
      });

      try {
        const result = await module.preheat(this.config);
        this.progress.set(module.name, result);

        if (!result.success) {
          logger.warn('WarmupManager', `Module ${module.name} failed: ${result.error}`);
        }
      } catch (error) {
        this.progress.set(module.name, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * 创建预热结果
   */
  private createResult(phase: WarmupPhase, success: boolean): WarmupResult {
    const details: Record<string, { success: boolean; error?: string; fallback?: string }> = {};

    this.progress.forEach((value, key) => {
      details[key] = value;
    });

    return {
      success,
      phase,
      duration: performance.now() - this.startTime,
      details,
    };
  }

  /**
   * 预估剩余时间
   */
  private estimateRemaining(completedModules: number): number {
    if (completedModules === 0) return 0;

    const elapsed = performance.now() - this.startTime;
    const avgTimePerModule = elapsed / completedModules;
    const remainingModules = this.modules.length - completedModules;

    return Math.round(avgTimePerModule * remainingModules);
  }

  /**
   * 发送进度更新
   */
  private emitProgress(progress: WarmupProgress): void {
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  /**
   * 注册进度回调
   */
  public onProgress(callback: WarmupProgressCallback): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index > -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 注册完成回调
   */
  public onComplete(callback: WarmupCompleteCallback): () => void {
    this.completeCallbacks.push(callback);
    return () => {
      const index = this.completeCallbacks.indexOf(callback);
      if (index > -1) {
        this.completeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 获取预热进度
   */
  public getProgress(): WarmupProgress {
    const completedModules = this.progress.size;
    return {
      phase: this.state === WarmupState.COMPLETED ? WarmupPhase.FINAL :
             this.state === WarmupState.RUNNING ? WarmupPhase.ASYNC : WarmupPhase.SYNC,
      currentModule: '',
      completedModules,
      totalModules: this.modules.length,
      percentage: Math.round((completedModules / this.modules.length) * 100),
      estimatedRemaining: this.estimateRemaining(completedModules),
    };
  }

  /**
   * 获取预热统计信息
   */
  public getStatistics(): {
    totalDuration: number;
    syncDuration: number;
    asyncDuration: number;
    successfulModules: number;
    failedModules: number;
    fallbackModules: number;
  } {
    let successful = 0;
    let failed = 0;
    let fallback = 0;

    this.progress.forEach(result => {
      if (result.success) {
        successful++;
        if (result.fallback) fallback++;
      } else {
        failed++;
      }
    });

    return {
      totalDuration: performance.now() - this.startTime,
      syncDuration: this.syncPhaseEndTime - this.startTime,
      asyncDuration: this.asyncPhaseEndTime - this.syncPhaseEndTime,
      successfulModules: successful,
      failedModules: failed,
      fallbackModules: fallback,
    };
  }

  /**
   * 重置预热状态
   */
  public reset(): void {
    this.state = WarmupState.IDLE;
    this.progress.clear();
    this.startTime = 0;
    this.syncPhaseEndTime = 0;
    this.asyncPhaseEndTime = 0;
  }

  /**
   * 销毁管理器
   */
  public dispose(): void {
    this.reset();
    this.progressCallbacks = [];
    this.completeCallbacks = [];
    WarmupManager.instance = null;
  }
}

/**
 * 预热管理器导出
 */
export const warmupManager = WarmupManager.getInstance();
export default warmupManager;
