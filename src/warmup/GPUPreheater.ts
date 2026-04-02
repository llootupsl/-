/**
 * GPU 预热模块
 * 4.6.2 节实现：初始化 WebGPU 设备并提交空计算任务
 */

import { WarmupPhase } from '@/core/constants/PerformanceMode';
import type { WarmupConfig, IWarmupModule } from './WarmupManager';
import { logger } from '@/core/utils/Logger';

/**
 * GPU 预热模块
 *
 * 预热手段：
 * - 创建隐藏的 OffscreenCanvas（1x1 或极小尺寸）
 * - 初始化 WebGPU 设备
 * - 提交一个空计算着色器或简单渲染任务
 * - 强制 GPU 驱动进入高频率状态
 *
 * 回退方案：
 * - 若 WebGPU 不可用，回退到 WebGL 2.0
 * - 若 WebGL 亦不可用，则使用 Canvas 2D API
 */
export class GPUPreheater implements IWarmupModule {
  name = 'GPU 图形预热';
  phase: WarmupPhase = WarmupPhase.SYNC;

  /**
   * 执行 GPU 预热
   */
  async preheat(config: WarmupConfig): Promise<{ success: boolean; fallback?: string; error?: string }> {
    try {
      // 尝试 WebGPU
      if (this.isWebGPUSupported()) {
        return await this.webgpuFallback();
      }

      // 回退到 WebGL 2.0
      if (this.isWebGL2Supported()) {
        return this.webglFallback();
      }

      // 最终回退到 Canvas 2D
      return this.canvas2dFallback();
    } catch (error) {
      return {
        success: false,
        fallback: 'unknown',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 检查 WebGPU 支持
   */
  private isWebGPUSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * 检查 WebGL 2.0 支持
   */
  private isWebGL2Supported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (error) {
      logger.warn('GPUPreheater', 'WebGL2 support check failed', error as Error);
      return false;
    }
  }

  /**
   * WebGPU 预热
   */
  private async webgpuFallback(): Promise<{ success: boolean; fallback?: string; error?: string }> {
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) {
        return this.webglFallback();
      }

      const device = await adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: adapter.limits?.maxStorageBufferBindingSize || 256 * 1024 * 1024,
        },
      });

      // 创建隐藏的 OffscreenCanvas
      const canvas = new OffscreenCanvas(1, 1);
      const context = canvas.getContext('webgpu');

      if (!context) {
        device.destroy();
        return this.webglFallback();
      }

      // 配置 WebGPU 上下文
      const format = navigator.gpu.getPreferredCanvasFormat();
      (context as GPUCanvasContext).configure({
        device,
        format,
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
      });

      // 创建计算管线
      const shaderModule = device.createShaderModule({
        code: `
          @group(0) @binding(0) var<storage, read_write> output: array<f32>;

          @compute @workgroup_size(64) fn main(
            @builtin(global_invocation_id) id: vec3<u32>
          ) {
            output[id.x] = f32(id.x) * 0.001;
          }
        `,
      });

      const computePipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      });

      // 创建缓冲区
      const buffer = device.createBuffer({
        size: 256,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });

      // 创建绑定组
      const bindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer,
            },
          },
        ],
      });

      // 提交计算任务
      const commandEncoder = device.createCommandEncoder();
      const computePass = commandEncoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(0, bindGroup);
      computePass.dispatchWorkgroups(1);
      computePass.end();

      device.queue.submit([commandEncoder.finish()]);

      // 等待 GPU 完成
      await device.queue.onSubmittedWorkDone();

      // 清理
      buffer.destroy();
      device.destroy();

      return { success: true };
    } catch (error) {
      console.warn('[GPUPreheater] WebGPU failed, falling back to WebGL:', error);
      return this.webglFallback();
    }
  }

  /**
   * WebGL 2.0 回退
   */
  private webglFallback(): { success: boolean; fallback: string; error?: string } {
    try {
      const canvas = new OffscreenCanvas(1, 1);
      const gl = canvas.getContext('webgl2', {
        powerPreference: 'high-performance',
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });

      if (!gl) {
        return this.canvas2dFallback();
      }

      // 创建简单着色器程序
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `);
      gl.compileShader(fragmentShader);

      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // 创建顶点缓冲区
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0]), gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // 执行一次绘制
      gl.drawArrays(gl.POINTS, 0, 1);

      // 清理
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      return { success: true, fallback: 'webgl2' };
    } catch (error) {
      logger.warn('GPUPreheater', 'WebGL 2.0 failed, falling back to Canvas 2D', error as Error);
      return this.canvas2dFallback();
    }
  }

  /**
   * Canvas 2D 最终回退
   */
  private canvas2dFallback(): { success: boolean; fallback: string } {
    try {
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 执行一次简单的绘制操作，触发 GPU 合成
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1, 1);
      }

      return { success: true, fallback: 'canvas2d' };
    } catch (error) {
      logger.warn('GPUPreheater', 'Canvas 2D fallback failed', error as Error);
      return { success: true, fallback: 'none' };
    }
  }
}
