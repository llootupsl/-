/**
 * 内存预热模块
 * 4.6.2 节实现：分配 SharedArrayBuffer 并进行原子操作
 */

import { WarmupPhase } from '@/core/constants/PerformanceMode';
import type { WarmupConfig, IWarmupModule } from './WarmupManager';
import { logger } from '@/core/utils/Logger';

/**
 * 内存预热模块
 *
 * 预热手段：
 * - 页面加载时立即分配大块 SharedArrayBuffer
 * - 用原子操作填充一次，确保内存页被实际映射并预热
 *
 * 回退方案：
 * - 若 SharedArrayBuffer 因 COOP/COEP 未配置而不可用
 * - 则分配普通 ArrayBuffer 作为替代
 */
export class MemoryPreheater implements IWarmupModule {
  name = '内存分配预热';
  phase: WarmupPhase = WarmupPhase.SYNC;

  // 预分配的缓冲区引用（保持存活）
  private buffers: (ArrayBuffer | SharedArrayBuffer)[] = [];

  /**
   * 执行内存预热
   */
  async preheat(config: WarmupConfig): Promise<{ success: boolean; fallback?: string; error?: string }> {
    try {
      const memoryMB = config.memoryMB;
      const byteLength = memoryMB * 1024 * 1024;

      // 检查 SharedArrayBuffer 支持
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

      if (hasSharedArrayBuffer) {
        return this.sharedArrayBufferWarmup(byteLength);
      } else {
        return this.arrayBufferFallback(byteLength);
      }
    } catch (error) {
      return {
        success: false,
        fallback: 'unknown',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * SharedArrayBuffer 预热
   */
  private sharedArrayBufferWarmup(byteLength: number): { success: boolean; fallback?: string; error?: string } {
    try {
      // 分配 SharedArrayBuffer
      const buffer = new SharedArrayBuffer(byteLength);

      // 使用 Int32Array 进行原子操作
      const int32View = new Int32Array(buffer);
      const length = int32View.length;

      // 执行原子操作填充
      for (let i = 0; i < length; i += 1024) {
        Atomics.store(int32View, i, i);
      }

      // 验证写入
      for (let i = 0; i < length; i += 1024) {
        if (Atomics.load(int32View, i) !== i) {
          throw new Error('Atomic operation verification failed');
        }
      }

      // 保持引用（确保内存不被垃圾回收）
      this.buffers.push(buffer);

      return { success: true };
    } catch (error) {
      // 回退到普通 ArrayBuffer
      return this.arrayBufferFallback(byteLength);
    }
  }

  /**
   * ArrayBuffer 回退
   */
  private arrayBufferFallback(byteLength: number): { success: boolean; fallback: string; error?: string } {
    try {
      // 分配普通 ArrayBuffer
      const buffer = new ArrayBuffer(byteLength);

      // 使用 Uint8Array 进行填充
      const uint8View = new Uint8Array(buffer);
      const length = uint8View.length;

      // 简单填充（跳过以加快速度）
      for (let i = 0; i < length; i += 4096) {
        uint8View[i] = i & 0xff;
      }

      // 保持引用
      this.buffers.push(buffer);

      logger.warn('MemoryPreheater', 'SharedArrayBuffer not available, using ArrayBuffer fallback');

      return {
        success: true,
        fallback: 'arraybuffer',
        error: 'SharedArrayBuffer not available',
      };
    } catch (error) {
      // 尝试分配更小的缓冲区
      try {
        const smallerBuffer = new ArrayBuffer(64 * 1024 * 1024); // 64MB
        this.buffers.push(smallerBuffer);

        return {
          success: true,
          fallback: 'arraybuffer-small',
          error: 'Failed to allocate full memory, using 64MB fallback',
        };
      } catch (error) {
        logger.warn('MemoryPreheater', 'Fallback memory allocation failed', error as Error);
        return {
          success: false,
          fallback: 'arraybuffer-failed',
          error: 'Failed to allocate memory',
        };
      }
    }
  }

  /**
   * 释放预分配的内存
   */
  public dispose(): void {
    this.buffers = [];
  }
}
