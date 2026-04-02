/**
 * =============================================================================
 * 永夜熵纪 - 全局光照管理器
 * Global Illumination Manager with SVO Ray Tracing
 * =============================================================================
 * 
 * 实现 GPU 驱动的全局光照系统：
 * - 稀疏体素八叉树 (SVO) 构建
 * - 实时全局光照 (GI)
 * - 光探针网格
 * - 时空降噪
 */

import { SVOBuilder, Voxel } from './SVOBuilder';
import { raytracingShaders } from './shaders/rt-svo.wgsl';
import { logger } from '@/core/utils/Logger';
import { isLabFeatureEnabled } from '@/core/config/FeatureFlags';

/** 光探针数据 */
interface LightProbe {
  position: [number, number, number];
  irradiance: [number, number, number];
  distance: number;
}

/** GI 配置 */
export interface GIConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 最大光线反弹次数 */
  maxBounces: number;
  /** 光探针网格分辨率 */
  probeGridResolution: [number, number, number];
  /** SVO 最大深度 */
  svoMaxDepth: number;
  /** 最小体素尺寸 */
  minVoxelSize: number;
  /** 降噪强度 */
  denoiseStrength: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: GIConfig = {
  enabled: isLabFeatureEnabled('webgpuRealtimeGI_3_30'),
  maxBounces: 3,
  probeGridResolution: [16, 16, 16],
  svoMaxDepth: 8,
  minVoxelSize: 0.5,
  denoiseStrength: 0.5,
};

/**
 * 全局光照管理器
 */
export class GlobalIlluminationManager {
  private device: GPUDevice | null = null;
  private config: GIConfig;
  private svoBuilder: SVOBuilder;

  // GPU 资源
  private nodeBuffer: GPUBuffer | null = null;
  private voxelBuffer: GPUBuffer | null = null;
  private outputBuffer: GPUBuffer | null = null;
  private probeBuffer: GPUBuffer | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private pipeline: GPUComputePipeline | null = null;

  // 动态分辨率
  private currentResolution: [number, number] = [1920, 1080];

  // 光探针
  private probes: LightProbe[] = [];

  // 统计
  private stats = {
    nodeCount: 0,
    voxelCount: 0,
    lastBuildTime: 0,
    giEnabled: false,
  };

  constructor(config: Partial<GIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.svoBuilder = new SVOBuilder({
      maxDepth: this.config.svoMaxDepth,
      minVoxelSize: this.config.minVoxelSize,
    });
  }

  /**
   * 初始化 WebGPU 资源
   */
  public async init(device: GPUDevice): Promise<boolean> {
    if (!device) {
      this.device = null;
      this.stats.giEnabled = false;
      return false;
    }

    this.device = device;

    try {
      // 创建绑定组布局
      await this.createBindGroupLayouts();

      // 创建计算管线
      await this.createComputePipeline();

      // 初始化光探针
      this.initLightProbes();

      logger.info('GI', 'Global Illumination Manager initialized');
      return true;
    } catch (error) {
      logger.error('GI', 'Failed to initialize', error as Error);
      return false;
    }
  }

  /**
   * 创建绑定组布局
   */
  private async createBindGroupLayouts(): Promise<void> {
    if (!this.device) return;

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'GI-BindGroupLayout',
      entries: [
        // Uniforms
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
        // SVO Nodes
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' },
        },
        // Voxels
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' },
        },
        // Light Probes
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' },
        },
        // Output
        {
          binding: 4,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' },
        },
      ],
    });
  }

  /**
   * 创建计算管线
   */
  private async createComputePipeline(): Promise<void> {
    if (!this.device || !this.bindGroupLayout) return;

    const shaderModule = this.device.createShaderModule({
      label: 'GI-RayTracing-Shader',
      code: raytracingShaders.svoTraversal,
    });

    this.pipeline = this.device.createComputePipeline({
      label: 'GI-ComputePipeline',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });
  }

  /**
   * 初始化光探针
   */
  private initLightProbes(): void {
    const [resX, resY, resZ] = this.config.probeGridResolution;
    const probeSpacing = 16; // 16 units between probes

    this.probes = [];

    for (let z = 0; z < resZ; z++) {
      for (let y = 0; y < resY; y++) {
        for (let x = 0; x < resX; x++) {
          this.probes.push({
            position: [
              (x - resX / 2) * probeSpacing,
              (y - resY / 2) * probeSpacing,
              (z - resZ / 2) * probeSpacing,
            ],
            irradiance: [0.1, 0.1, 0.1],
            distance: 0,
          });
        }
      }
    }

    logger.info('GI', `Initialized ${this.probes.length} light probes`);
  }

  /**
   * 从场景几何体构建 SVO
   */
  public buildSVO(
    positions: Float32Array,
    normals: Float32Array,
    colors: Float32Array
  ): void {
    if (!this.device) return;

    const startTime = performance.now();

    // 体素化几何体
    const voxels = SVOBuilder.voxelizeGeometry(
      positions,
      normals,
      colors,
      this.config.minVoxelSize
    );

    // 构建 SVO
    const nodes = this.svoBuilder.build(voxels);

    // 序列化到 GPU
    const { nodes: nodeData, voxels: voxelData } = this.svoBuilder.serializeToGPU();

    // 创建/更新 GPU 缓冲
    this.updateGPUBuffers(nodeData, voxelData);

    // 更新统计
    const stats = this.svoBuilder.getStats();
    this.stats.nodeCount = stats.nodeCount;
    this.stats.voxelCount = stats.voxelCount;
    this.stats.lastBuildTime = performance.now() - startTime;

    logger.info('GI', `SVO built in ${this.stats.lastBuildTime.toFixed(2)}ms`);
  }

  /**
   * 更新 GPU 缓冲
   */
  private updateGPUBuffers(nodeData: Float32Array, voxelData: Float32Array): void {
    if (!this.device) return;

    try {
      // 释放旧缓冲
      this.nodeBuffer?.destroy();
      this.voxelBuffer?.destroy();

      // 创建节点缓冲
      this.nodeBuffer = this.device.createBuffer({
        label: 'GI-NodeBuffer',
        size: nodeData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      const nodeMappedRange = this.nodeBuffer?.getMappedRange?.();
      if (nodeMappedRange) {
        new Float32Array(nodeMappedRange).set(nodeData);
        this.nodeBuffer.unmap();
      } else if (this.nodeBuffer) {
        this.device.queue.writeBuffer(
          this.nodeBuffer,
          0,
          nodeData as unknown as Float32Array<ArrayBuffer>
        );
      }

      // 创建体素缓冲
      this.voxelBuffer = this.device.createBuffer({
        label: 'GI-VoxelBuffer',
        size: voxelData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      const voxelMappedRange = this.voxelBuffer?.getMappedRange?.();
      if (voxelMappedRange) {
        new Float32Array(voxelMappedRange).set(voxelData);
        this.voxelBuffer.unmap();
      } else if (this.voxelBuffer) {
        this.device.queue.writeBuffer(
          this.voxelBuffer,
          0,
          voxelData as unknown as Float32Array<ArrayBuffer>
        );
      }
    } catch (error) {
      logger.warn('GI', 'GPU buffer update fallback', error as Error);
      this.nodeBuffer = null;
      this.voxelBuffer = null;
    }
  }

  /**
   * 计算全局光照
   */
  public computeGI(
    commandEncoder: GPUCommandEncoder,
    cameraPosition: [number, number, number],
    lightDirection: [number, number, number],
    outputTexture: GPUTexture,
    resolution?: [number, number]
  ): void {
    if (!this.config.enabled) {
      this.stats.giEnabled = false;
      return;
    }

    if (!this.device || !this.pipeline || !this.nodeBuffer) {
      this.stats.giEnabled = false;
      return;
    }

    this.stats.giEnabled = true;

    // 使用传入的分辨率或当前分辨率
    const [width, height] = resolution || this.currentResolution;
    this.currentResolution = [width, height];

    // 创建 Uniform 缓冲 - 包含分辨率
    // 布局: camera_position(3+pad), light_direction(3+pad), light_color(3+pad), ambient_color(3+pad), max_depth(1+pad), resolution(2)
    // 总大小: 16 + 16 + 16 + 16 + 8 + 8 = 80 bytes
    const uniformData = new Float32Array(20);
    uniformData.set(cameraPosition, 0);        // offset 0
    uniformData.set(lightDirection, 4);        // offset 4
    uniformData.set([1, 1, 1], 8);             // light color, offset 8
    uniformData.set([0.1, 0.1, 0.15], 12);     // ambient color, offset 12
    
    // 使用 Uint32Array 视图来设置 u32 值
    const uniformView = new DataView(new ArrayBuffer(80));
    // camera_position (offset 0)
    uniformView.setFloat32(0, cameraPosition[0], true);
    uniformView.setFloat32(4, cameraPosition[1], true);
    uniformView.setFloat32(8, cameraPosition[2], true);
    // light_direction (offset 16)
    uniformView.setFloat32(16, lightDirection[0], true);
    uniformView.setFloat32(20, lightDirection[1], true);
    uniformView.setFloat32(24, lightDirection[2], true);
    // light_color (offset 32)
    uniformView.setFloat32(32, 1, true);
    uniformView.setFloat32(36, 1, true);
    uniformView.setFloat32(40, 1, true);
    // ambient_color (offset 48)
    uniformView.setFloat32(48, 0.1, true);
    uniformView.setFloat32(52, 0.1, true);
    uniformView.setFloat32(56, 0.15, true);
    // max_depth (offset 64)
    uniformView.setUint32(64, this.config.maxBounces, true);
    // resolution (offset 72)
    uniformView.setUint32(72, width, true);
    uniformView.setUint32(76, height, true);

    const uniformBuffer = this.device.createBuffer({
      label: 'GI-UniformBuffer',
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint8Array(uniformBuffer.getMappedRange()).set(new Uint8Array(uniformView.buffer));
    uniformBuffer.unmap();

    // 创建输出缓冲 - 使用动态分辨率
    const outputSize = width * height * 4;
    if (!this.outputBuffer || this.outputBuffer.size < outputSize) {
      this.outputBuffer?.destroy();
      this.outputBuffer = this.device.createBuffer({
        label: 'GI-OutputBuffer',
        size: outputSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });
    }

    // 创建绑定组
    const bindGroup = this.device.createBindGroup({
      label: 'GI-BindGroup',
      layout: this.bindGroupLayout!,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: this.nodeBuffer } },
        { binding: 2, resource: { buffer: this.voxelBuffer! } },
        { binding: 3, resource: { buffer: this.probeBuffer || this.createProbeBuffer() } },
        { binding: 4, resource: { buffer: this.outputBuffer } },
      ],
    });

    // 计算通道
    const computePass = commandEncoder.beginComputePass({
      label: 'GI-ComputePass',
    });

    computePass.setPipeline(this.pipeline);
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(
      Math.ceil(width / 8),
      Math.ceil(height / 8),
      1
    );
    computePass.end();

    // 复制到输出纹理
    this.copyToTexture(commandEncoder, outputTexture, width, height);

    // 清理
    uniformBuffer.destroy();
  }

  /**
   * 创建光探针缓冲
   */
  private createProbeBuffer(): GPUBuffer {
    if (!this.device) {
      throw new Error('Device not initialized');
    }

    const probeData = new Float32Array(this.probes.length * 8);
    for (let i = 0; i < this.probes.length; i++) {
      const probe = this.probes[i];
      const offset = i * 8;
      probeData[offset + 0] = probe.position[0];
      probeData[offset + 1] = probe.position[1];
      probeData[offset + 2] = probe.position[2];
      probeData[offset + 3] = probe.distance;
      probeData[offset + 4] = probe.irradiance[0];
      probeData[offset + 5] = probe.irradiance[1];
      probeData[offset + 6] = probe.irradiance[2];
      probeData[offset + 7] = 0; // padding
    }

    try {
      this.probeBuffer = this.device.createBuffer({
        label: 'GI-ProbeBuffer',
        size: probeData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      const mappedRange = this.probeBuffer?.getMappedRange?.();
      if (mappedRange) {
        new Float32Array(mappedRange).set(probeData);
        this.probeBuffer.unmap();
      } else if (this.probeBuffer) {
        this.device.queue.writeBuffer(this.probeBuffer, 0, probeData);
      }
    } catch (error) {
      logger.warn('GI', 'Probe buffer fallback', error as Error);
      this.probeBuffer = null;
      throw error;
    }

    return this.probeBuffer;
  }

  /**
   * 复制结果到纹理
   */
  private copyToTexture(
    commandEncoder: GPUCommandEncoder,
    texture: GPUTexture,
    width: number,
    height: number
  ): void {
    if (!this.outputBuffer) return;

    // 使用动态分辨率复制到纹理
    commandEncoder.copyBufferToTexture(
      {
        buffer: this.outputBuffer,
        bytesPerRow: width * 16,
      },
      {
        texture,
      },
      {
        width,
        height,
        depthOrArrayLayers: 1,
      }
    );
  }

  /**
   * 更新光探针（渐进式）
   */
  public updateProbes(
    positions: Float32Array,
    emissiveColors: Float32Array
  ): void {
    // 简化实现：根据发光物体更新附近探针
    for (let i = 0; i < this.probes.length; i++) {
      const probe = this.probes[i];
      
      // 计算最近发光物体的贡献
      let totalIrradiance: [number, number, number] = [0.1, 0.1, 0.15];
      
      for (let j = 0; j < positions.length; j += 3) {
        const dx = positions[j] - probe.position[0];
        const dy = positions[j + 1] - probe.position[1];
        const dz = positions[j + 2] - probe.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 64) {
          const falloff = 1.0 / (1.0 + dist * dist * 0.01);
          totalIrradiance[0] += emissiveColors[j] * falloff;
          totalIrradiance[1] += emissiveColors[j + 1] * falloff;
          totalIrradiance[2] += emissiveColors[j + 2] * falloff;
        }
      }
      
      probe.irradiance = totalIrradiance;
    }

    // 更新 GPU 缓冲
    if (this.probeBuffer && this.device) {
      const probeData = new Float32Array(this.probes.length * 8);
      for (let i = 0; i < this.probes.length; i++) {
        const probe = this.probes[i];
        const offset = i * 8;
        probeData[offset + 0] = probe.position[0];
        probeData[offset + 1] = probe.position[1];
        probeData[offset + 2] = probe.position[2];
        probeData[offset + 3] = probe.distance;
        probeData[offset + 4] = probe.irradiance[0];
        probeData[offset + 5] = probe.irradiance[1];
        probeData[offset + 6] = probe.irradiance[2];
        probeData[offset + 7] = 0;
      }
      this.device.queue.writeBuffer(this.probeBuffer, 0, probeData);
    }
  }

  /**
   * 获取探针辐照度
   */
  public getProbeIrradiance(position: [number, number, number]): [number, number, number] {
    // 三线性插值
    const [resX, resY, resZ] = this.config.probeGridResolution;
    const probeSpacing = 16;

    const localX = (position[0] / probeSpacing) + resX / 2;
    const localY = (position[1] / probeSpacing) + resY / 2;
    const localZ = (position[2] / probeSpacing) + resZ / 2;

    const x0 = Math.floor(localX);
    const y0 = Math.floor(localY);
    const z0 = Math.floor(localZ);

    const fx = localX - x0;
    const fy = localY - y0;
    const fz = localZ - z0;

    // 获取 8 个相邻探针
    const getProbe = (x: number, y: number, z: number): [number, number, number] => {
      if (x < 0 || x >= resX || y < 0 || y >= resY || z < 0 || z >= resZ) {
        return [0.1, 0.1, 0.15];
      }
      const idx = z * resX * resY + y * resX + x;
      return this.probes[idx]?.irradiance || [0.1, 0.1, 0.15];
    };

    const c000 = getProbe(x0, y0, z0);
    const c100 = getProbe(x0 + 1, y0, z0);
    const c010 = getProbe(x0, y0 + 1, z0);
    const c110 = getProbe(x0 + 1, y0 + 1, z0);
    const c001 = getProbe(x0, y0, z0 + 1);
    const c101 = getProbe(x0 + 1, y0, z0 + 1);
    const c011 = getProbe(x0, y0 + 1, z0 + 1);
    const c111 = getProbe(x0 + 1, y0 + 1, z0 + 1);

    // 三线性插值
    const lerp = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];

    const c00 = lerp(c000, c100, fx);
    const c01 = lerp(c001, c101, fx);
    const c10 = lerp(c010, c110, fx);
    const c11 = lerp(c011, c111, fx);

    const c0 = lerp(c00, c10, fy);
    const c1 = lerp(c01, c11, fy);

    return lerp(c0, c1, fz);
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    return { ...this.stats };
  }

  /**
   * 销毁资源
   */
  public destroy(): void {
    this.nodeBuffer?.destroy();
    this.voxelBuffer?.destroy();
    this.outputBuffer?.destroy();
    this.probeBuffer?.destroy();

    this.nodeBuffer = null;
    this.voxelBuffer = null;
    this.outputBuffer = null;
    this.probeBuffer = null;
    this.pipeline = null;
  }
}

export default GlobalIlluminationManager;
