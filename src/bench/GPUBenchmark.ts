/**
 * GPU 基准测试模块
 * 3.27.3 节实现：GPU 图形和计算性能测试
 */

import { logger } from '@/core/utils/Logger';
import { FPSCounter } from './BenchmarkSuite';

/**
 * GPU 基准测试结果
 */
export interface GPUBenchmarkResult {
  /** 渲染 FPS */
  renderFPS: number;
  /** 计算吞吐量 (GFLOPs) */
  computeGflops: number;
  /** 显存带宽 (GB/s) */
  memoryBandwidthGBps: number;
  /** 粒子渲染性能 */
  particlePerformance: number;
  /** 体素渲染性能 */
  voxelPerformance: number;
}

/**
 * GPU 基准测试
 */
export class GPUBenchmark {
  private device: GPUDevice | null = null;
  private canvas: OffscreenCanvas | null = null;

  /**
   * 运行基准测试
   */
  public async run(durationMs: number): Promise<GPUBenchmarkResult> {
    // 检查 WebGPU 支持
    if (!navigator.gpu) {
      return this.runWebGLFallback(durationMs);
    }

    try {
      // 初始化 WebGPU
      await this.initWebGPU();

      // 运行渲染测试
      const renderFPS = await this.runRenderTest(durationMs);

      // 运行计算测试
      const computeGflops = await this.runComputeTest(durationMs);

      // 清理
      this.cleanup();

      return {
        renderFPS,
        computeGflops,
        memoryBandwidthGBps: computeGflops * 0.5, // 估算
        particlePerformance: renderFPS * 1000,
        voxelPerformance: renderFPS * 100,
      };
    } catch (error) {
      logger.warn('GPUBenchmark', 'WebGPU failed, using WebGL fallback', error as Error);
      return this.runWebGLFallback(durationMs);
    }
  }

  /**
   * 初始化 WebGPU
   */
  private async initWebGPU(): Promise<void> {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      throw new Error('No GPU adapter found');
    }

    this.device = await adapter.requestDevice();
    this.canvas = new OffscreenCanvas(1920, 1080);

    const context = this.canvas.getContext('webgpu');

    if (!context) {
      throw new Error('Failed to get WebGPU context');
    }

    // V5修复：使用类型断言来解决 WebGPU context 类型问题
    (context as unknown as GPUCanvasContext).configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING,
    });
  }

  /**
   * 渲染测试
   */
  private async runRenderTest(durationMs: number): Promise<number> {
    if (!this.device || !this.canvas) {
      throw new Error('WebGPU not initialized');
    }

    const start = performance.now();
    let frames = 0;

    // 简单的渲染循环
    while (performance.now() - start < durationMs) {
      const commandEncoder = this.device.createCommandEncoder();
      const texture = this.device.createTexture({
        size: [1920, 1080, 1],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: texture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });

      renderPass.end();
      this.device.queue.submit([commandEncoder.finish()]);

      frames++;
    }

    const elapsed = (performance.now() - start) / 1000;
    return frames / elapsed;
  }

  /**
   * 计算测试
   */
  private async runComputeTest(durationMs: number): Promise<number> {
    if (!this.device) {
      throw new Error('WebGPU not initialized');
    }

    const shaderModule = this.device.createShaderModule({
      code: `
        @group(0) @binding(0) var<storage, read_write> data: array<f32>;

        @compute @workgroup_size(256) fn main(
          @builtin(global_invocation_id) id: vec3<u32>
        ) {
          let idx = id.x;
          data[idx] = data[idx] * 2.0 + 1.0;
          data[idx] = sin(data[idx]);
          data[idx] = cos(data[idx]);
        }
      `,
    });

    const computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: { module: shaderModule, entryPoint: 'main' },
    });

    const bufferSize = 1024 * 1024; // 4MB
    const buffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const bindGroup = this.device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer } }],
    });

    const start = performance.now();
    let iterations = 0;

    while (performance.now() - start < durationMs) {
      const commandEncoder = this.device.createCommandEncoder();
      const computePass = commandEncoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(0, bindGroup);
      computePass.dispatchWorkgroups(4096);
      computePass.end();
      this.device.queue.submit([commandEncoder.finish()]);
      iterations++;
    }

    await this.device.queue.onSubmittedWorkDone();

    const elapsed = (performance.now() - start) / 1000;
    const totalOps = iterations * 4096 * 256 * 3; // 每次迭代 3 个操作
    const gflops = (totalOps / elapsed) / 1e9;

    buffer.destroy();

    return gflops;
  }

  /**
   * WebGL 回退测试
   */
  private runWebGLFallback(durationMs: number): Promise<GPUBenchmarkResult> {
    return new Promise((resolve) => {
      const canvas = new OffscreenCanvas(1920, 1080);
      const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' });

      if (!gl) {
        resolve({
          renderFPS: 0,
          computeGflops: 0,
          memoryBandwidthGBps: 0,
          particlePerformance: 0,
          voxelPerformance: 0,
        });
        return;
      }

      const start = performance.now();
      let frames = 0;

      const render = () => {
        if (performance.now() - start >= durationMs) {
          const elapsed = (performance.now() - start) / 1000;
          gl.canvas.width = 1920;
          gl.canvas.height = 1080;
          gl.viewport(0, 0, 1920, 1080);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.flush();
          frames++;

          requestAnimationFrame(render);
        } else {
          const elapsed = (performance.now() - start) / 1000;
          resolve({
            renderFPS: frames / elapsed,
            computeGflops: 0,
            memoryBandwidthGBps: 0,
            particlePerformance: frames / elapsed * 500,
            voxelPerformance: frames / elapsed * 50,
          });
        }
      };

      requestAnimationFrame(render);
    });
  }

  /**
   * 清理
   */
  private cleanup(): void {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.canvas = null;
  }
}
