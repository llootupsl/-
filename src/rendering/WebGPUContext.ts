/**
 * WebGPU 渲染引擎
 * 实现光线追踪、路径追踪、粒子系统等高级渲染效果
 */

import { logger } from '@/core/utils/Logger';

/**
 * WebGPU 上下文
 */
export class WebGPUContext {
  private device: GPUDevice | null = null;
  private canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat = 'bgra8unorm';
  private width: number = 0;
  private height: number = 0;

  /**
   * 初始化 WebGPU
   */
  public async init(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<void> {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }

    this.canvas = canvas;

    // 请求适配器
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      throw new Error('No GPU adapter found');
    }

    // 请求设备
    this.device = await adapter.requestDevice({
      requiredLimits: {
        maxStorageBufferBindingSize: adapter.limits?.maxStorageBufferBindingSize || 256 * 1024 * 1024,
      },
    });

    // 获取格式
    this.format = navigator.gpu.getPreferredCanvasFormat();

    // 获取上下文
    this.context = canvas.getContext('webgpu') as GPUCanvasContext;

    this.context.configure({
      device: this.device,
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING,
    });

    // 设置大小
    this.resize();

    // 设置错误处理
    this.device.onuncapturederror = (event) => {
      console.error('[WebGPU] Uncaptured error:', event.error);
    };

    console.log('[WebGPU] Initialized successfully');
  }

  /**
   * 调整大小
   */
  public resize(): void {
    if (!this.canvas) return;

    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  /**
   * 获取设备
   */
  public getDevice(): GPUDevice {
    if (!this.device) {
      throw new Error('WebGPU not initialized');
    }
    return this.device;
  }

  /**
   * 获取上下文
   */
  public getContext(): GPUCanvasContext {
    if (!this.context) {
      throw new Error('WebGPU not initialized');
    }
    return this.context;
  }

  /**
   * 获取格式
   */
  public getFormat(): GPUTextureFormat {
    return this.format;
  }

  /**
   * 获取宽度
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * 获取高度
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * 是否可用
   */
  public isAvailable(): boolean {
    return this.device !== null && this.context !== null;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.context = null;
    this.canvas = null;
  }
}

/**
 * 着色器编译辅助
 */
export async function compileShader(
  device: GPUDevice,
  code: string,
  type: 'vertex' | 'fragment' | 'compute'
): Promise<GPUShaderModule> {
  const descriptor: GPUShaderModuleDescriptor = { code };

  try {
    return device.createShaderModule(descriptor);
  } catch (error) {
    logger.error(
      'WebGPU',
      `Shader compilation failed (${type})`,
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * 创建渲染管线
 */
export async function createRenderPipeline(
  device: GPUDevice,
  vertexShader: string,
  fragmentShader: string,
  vertexBufferLayouts: GPUVertexBufferLayout[]
): Promise<GPURenderPipeline> {
  const vertexModule = await compileShader(device, vertexShader, 'vertex');
  const fragmentModule = await compileShader(device, fragmentShader, 'fragment');

  return device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: vertexModule,
      entryPoint: 'main',
      buffers: vertexBufferLayouts,
    },
    fragment: {
      module: fragmentModule,
      entryPoint: 'main',
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    },
  });
}

/**
 * 创建计算管线
 */
export async function createComputePipeline(
  device: GPUDevice,
  computeShader: string
): Promise<GPUComputePipeline> {
  const module = await compileShader(device, computeShader, 'compute');

  return device.createComputePipeline({
    layout: 'auto',
    compute: {
      module,
      entryPoint: 'main',
    },
  });
}

/**
 * 创建缓冲区
 */
export function createBuffer(
  device: GPUDevice,
  size: number,
  usage: GPUBufferUsageFlags,
  mapped: boolean = false
): GPUBuffer {
  return device.createBuffer({
    size,
    usage,
    mappedAtCreation: mapped,
  });
}

/**
 * 创建绑定组
 */
export function createBindGroup(
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  entries: GPUBindGroupEntry[]
): GPUBindGroup {
  return device.createBindGroup({
    layout,
    entries,
  });
}

/**
 * 纹理格式常量
 */
export const TextureFormats = {
  RGBA8: 'rgba8unorm' as GPUTextureFormat,
  BGRA8: 'bgra8unorm' as GPUTextureFormat,
  RGBA16F: 'rgba16float' as GPUTextureFormat,
  RGBA32F: 'rgba32float' as GPUTextureFormat,
  R32F: 'r32float' as GPUTextureFormat,
  Depth24: 'depth24plus' as GPUTextureFormat,
  Depth32F: 'depth32float' as GPUTextureFormat,
};

/**
 * 导出默认上下文
 */
export const webgpuContext = new WebGPUContext();
export default webgpuContext;
