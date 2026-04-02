/**
 * CPU 多核预热模块
 * 4.6.2 节实现：创建 Web Worker 并执行空计算，触发 CPU 升频
 */

import { WarmupPhase } from '@/core/constants/PerformanceMode';
import type { WarmupConfig, IWarmupModule } from './WarmupManager';
import { logger } from '@/core/utils/Logger';

/**
 * CPU 预热模块
 *
 * 预热手段：
 * - 根据 navigator.hardwareConcurrency 创建等量的 Web Worker
 * - 每个 Worker 中实例化核心 Wasm 模块并执行极短时间的空计算 (<5ms)
 * - 触发 CPU 升频与线程池激活
 *
 * 回退方案：
 * - 需配置 COOP/COEP 头以支持 SharedArrayBuffer 和多线程
 * - 若 Worker 创建失败或 Wasm 实例化失败，则至少创建 2 个 Worker
 * - 运行纯 JavaScript 空循环作为回退
 */
export class CPUPreheater implements IWarmupModule {
  name = 'CPU 多核预热';
  phase: WarmupPhase = WarmupPhase.SYNC;

  /**
   * 执行 CPU 预热
   */
  async preheat(config: WarmupConfig): Promise<{ success: boolean; fallback?: string; error?: string }> {
    const workerCount = config.workerCount;

    try {
      // 检查是否支持 Worker
      if (typeof Worker === 'undefined') {
        return { success: false, fallback: 'no-worker', error: 'Web Workers not supported' };
      }

      // 检查 SharedArrayBuffer 支持
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

      // 创建 Worker 数量（至少 2 个作为回退）
      const actualWorkerCount = Math.max(2, workerCount);
      const workers: Worker[] = [];

      // 创建 Worker 并行执行
      const workerPromises: Promise<void>[] = [];

      for (let i = 0; i < actualWorkerCount; i++) {
        const workerPromise = this.createWorker(hasSharedArrayBuffer, i);
        workerPromises.push(workerPromise);
      }

      // 等待所有 Worker 完成（最多 5 秒）
      await Promise.race([
        Promise.all(workerPromises),
        new Promise(resolve => setTimeout(resolve, 5000)),
      ]);

      // 清理 Worker
      workers.forEach(worker => worker.terminate());

      return {
        success: true,
        fallback: hasSharedArrayBuffer ? undefined : 'no-sharedarraybuffer',
      };
    } catch (error) {
      // 回退：使用主线程执行简单计算
      return this.fallback();
    }
  }

  /**
   * 创建单个 Worker
   */
  private async createWorker(hasSharedArrayBuffer: boolean, index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../workers/warmup.worker.ts', import.meta.url),
          { type: 'module' }
        );

        const timeout = setTimeout(() => {
          worker.terminate();
          resolve(); // 超时也视为成功，继续下一步
        }, 5000);

        worker.onmessage = (e) => {
          clearTimeout(timeout);
          if (e.data.type === 'compute-done') {
            resolve();
          } else {
            resolve();
          }
        };

        worker.onerror = (error) => {
          logger.warn('CPUPreheater', `Worker ${index} error`, new Error(String(error)));
          resolve(); // Worker 错误不阻止整体预热
        };

        worker.postMessage({
          type: 'compute',
          durationMs: 5, // 每个 Worker 执行 5ms 空计算
          hasSharedArrayBuffer,
          workerIndex: index,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 回退方案：主线程执行简单计算
   */
  private fallback(): { success: boolean; fallback: string; error?: string } {
    try {
      // 执行简单的数学计算，触发 CPU 升频
      const end = performance.now() + 10; // 10ms
      let result = 0;

      while (performance.now() < end) {
        for (let i = 0; i < 1000; i++) {
          result += Math.sin(i) * Math.cos(i) * Math.tan(i);
        }
      }

      return {
        success: true,
        fallback: 'main-thread',
      };
    } catch (error) {
      return {
        success: false,
        fallback: 'main-thread-failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
