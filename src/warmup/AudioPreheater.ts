/**
 * 音频预热模块
 * 4.6.2 节实现：初始化 AudioContext
 */

import { WarmupPhase } from '@/core/constants/PerformanceMode';
import type { WarmupConfig } from '@/core/constants/PerformanceMode';
import type { IWarmupModule } from './WarmupManager';
import { logger } from '@/core/utils/Logger';

/**
 * 音频预热模块
 *
 * 预热手段：
 * - 创建 AudioContext 并立即挂起 (suspend())
 * - 初始化音频图但不播放任何声音
 * - 使音频线程启动并保持就绪
 *
 * 回退方案：
 * - 若 AudioContext 创建失败，使用 OfflineAudioContext
 */
export class AudioPreheater implements IWarmupModule {
  name = '音频系统预热';
  phase: WarmupPhase = WarmupPhase.ASYNC;

  private audioContext: AudioContext | null = null;
  private offlineContext: OfflineAudioContext | null = null;

  /**
   * 执行音频预热
   */
  async preheat(config: WarmupConfig): Promise<{ success: boolean; fallback?: string; error?: string }> {
    try {
      // 尝试 AudioContext
      if (this.isAudioContextSupported()) {
        return this.audioContextWarmup();
      }

      // 回退到 OfflineAudioContext
      return this.offlineAudioContextFallback();
    } catch (error) {
      return {
        success: false,
        fallback: 'unknown',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 检查 AudioContext 支持
   */
  private isAudioContextSupported(): boolean {
    return typeof AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined';
  }

  private audioContextWarmup(): { success: boolean; fallback?: string; error?: string } {
    try {
      const AudioContextClass = AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: 48000,
      });

      // 挂起上下文（不播放，但线程已启动）
      if (this.audioContext.state === 'running') {
        this.audioContext.suspend();
      }

      // 创建音频图但不连接输出
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 设置参数但不启动
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0;

      // 预热完成，停止并断开
      oscillator.stop();
      oscillator.disconnect();
      gainNode.disconnect();

      return { success: true };
    } catch (error) {
      logger.warn('AudioPreheater', 'AudioContext failed, falling back to OfflineAudioContext', error as Error);
      return this.offlineAudioContextFallback();
    }
  }

  /**
   * OfflineAudioContext 回退
   */
  private offlineAudioContextFallback(): { success: boolean; fallback: string; error?: string } {
    try {
      // 创建 OfflineAudioContext（不渲染，但初始化引擎）
      this.offlineContext = new OfflineAudioContext({
        numberOfChannels: 2,
        length: 44100, // 1秒
        sampleRate: 44100,
      });

      // 创建音频图
      const oscillator = this.offlineContext.createOscillator();
      const gainNode = this.offlineContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.offlineContext.destination);

      oscillator.frequency.value = 440;
      gainNode.gain.value = 0;

      oscillator.start();
      oscillator.stop(this.offlineContext.currentTime + 0.001);

      return { success: true, fallback: 'offline' };
    } catch (error) {
      return {
        success: false,
        fallback: 'offline-failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取 AudioContext（供其他模块使用）
   */
  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * 关闭音频上下文
   */
  public close(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
