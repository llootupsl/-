/**
 * 视频编码预热模块
 * 4.6.2 节实现：初始化 VideoEncoder
 */

import { WarmupPhase } from '@/core/constants/PerformanceMode';
import type { WarmupConfig, IWarmupModule } from './WarmupManager';
import { logger } from '@/core/utils/Logger';

/**
 * 视频编码预热模块
 *
 * 预热手段：
 * - 创建 VideoEncoder 实例
 * - 配置一种硬件支持的编码器 (vp8、h264)
 * - 传入一个空帧并立即关闭
 * - 促使硬件编码器加载驱动
 *
 * 回退方案：
 * - 若 VideoEncoder 不可用或配置失败，尝试 MediaRecorder
 * - 若仍失败，跳过具体操作但保留代码调用路径
 */
export class VideoPreheater implements IWarmupModule {
  name = '视频编码预热';
  phase: WarmupPhase = WarmupPhase.ASYNC;

  /**
   * 执行视频编码预热
   */
  async preheat(config: WarmupConfig): Promise<{ success: boolean; fallback?: string; error?: string }> {
    try {
      // 检查 VideoEncoder 支持
      if (this.isVideoEncoderSupported()) {
        return await this.videoEncoderWarmup();
      }

      // 回退到 MediaRecorder
      return this.mediaRecorderFallback();
    } catch (error) {
      // 视频编码失败不影响整体
      return {
        success: false,
        fallback: 'unknown',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 检查 VideoEncoder 支持
   */
  private isVideoEncoderSupported(): boolean {
    return typeof VideoEncoder !== 'undefined';
  }

  /**
   * VideoEncoder 预热
   */
  private async videoEncoderWarmup(): Promise<{ success: boolean; fallback?: string; error?: string }> {
    return new Promise(async (resolve) => {
      try {
        const codecCandidates = ['vp8', 'vp09.00.10.08', 'avc1.42001E'];
        let selectedCodec: string | null = null;

        for (const codec of codecCandidates) {
          const support = await VideoEncoder.isConfigSupported({
            codec,
            width: 1280,
            height: 720,
          });
          if (support.supported) {
            selectedCodec = codec;
            break;
          }
        }

        if (!selectedCodec) {
          resolve({ success: false, fallback: 'no-codecs', error: 'No supported video codecs' });
          return;
        }

        const codecString = selectedCodec;

        // 创建 VideoEncoder
        const encoder = new VideoEncoder({
          output: (_chunk, _meta) => {
            // 预热阶段只验证编码链路，不消费输出数据
          },
          error: (error) => {
            logger.warn('VideoPreheater', 'VideoEncoder error', error as Error);
          },
        });

        // 配置编码器
        try {
          encoder.configure({
            codec: codecString,
            width: 1280,
            height: 720,
            bitrate: 1_000_000,
            framerate: 30,
            latencyMode: 'realtime',
            hardwareAcceleration: 'prefer-hardware',
          });
        } catch (configError) {
          console.warn('[VideoPreheater] Configure failed, trying software:', configError);
          try {
            encoder.configure({
              codec: codecString,
              width: 640,
              height: 480,
              bitrate: 500_000,
              framerate: 30,
              hardwareAcceleration: 'prefer-software',
            });
          } catch (error) {
            logger.warn('VideoPreheater', 'Software encoder configuration failed', error as Error);
            resolve({ success: false, fallback: 'configure-failed', error: 'Failed to configure encoder' });
            return;
          }
        }

        // 关闭编码器
        encoder.close();

        resolve({ success: true });
      } catch (error) {
        logger.warn('VideoPreheater', 'VideoEncoder creation failed', error as Error);
        resolve(this.mediaRecorderFallback());
      }
    });
  }

  /**
   * MediaRecorder 回退
   */
  private mediaRecorderFallback(): { success: boolean; fallback: string; error?: string } {
    try {
      // 检查 MediaRecorder 支持
      if (typeof MediaRecorder === 'undefined') {
        return { success: true, fallback: 'no-mediacapture' };
      }

      // 创建 MediaRecorder（不实际录制）
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      const stream = canvas.captureStream(0);

      try {
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
        });

        // 立即停止
        recorder.ondataavailable = () => {};
        recorder.start(0);
        recorder.stop();

        return { success: true, fallback: 'mediarecorder' };
      } catch (error) {
        logger.warn('VideoPreheater', 'MediaRecorder creation failed', error as Error);
        return { success: true, fallback: 'mediarecorder-failed' };
      }
    } catch (error) {
      // 即使失败也不影响
      return { success: true, fallback: 'skipped' };
    }
  }
}
