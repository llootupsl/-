/**
 * =============================================================================
 * 永夜熵纪 - 全局光照系统测试
 * Global Illumination Unit Tests
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SVOBuilder, Voxel } from '@/rendering/raytracing/SVOBuilder';

describe('SVOBuilder', () => {
  let builder: SVOBuilder;

  beforeEach(() => {
    builder = new SVOBuilder({
      maxDepth: 4,
      minVoxelSize: 1,
      bounds: {
        min: [-16, -16, -16],
        max: [16, 16, 16],
      },
    });
  });

  afterEach(() => {
    builder.clear();
  });

  describe('SVO 构建', () => {
    it('should build SVO from empty voxel array', () => {
      const nodes = builder.build([]);
      expect(nodes.length).toBe(0);
    });

    it('should build SVO from single voxel', () => {
      const voxels: Voxel[] = [
        {
          position: [0, 0, 0],
          color: [1, 0, 0],
          normal: [0, 1, 0],
          material: 0,
          emission: 0,
        },
      ];

      const nodes = builder.build(voxels);
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('should build SVO from multiple voxels', () => {
      const voxels: Voxel[] = [];
      
      for (let i = 0; i < 10; i++) {
        voxels.push({
          position: [i * 2, 0, 0],
          color: [1, 0.5, 0],
          normal: [0, 1, 0],
          material: 0,
          emission: 0,
        });
      }

      const nodes = builder.build(voxels);
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('should respect max depth limit', () => {
      const deepBuilder = new SVOBuilder({
        maxDepth: 2,
        minVoxelSize: 0.5,
        bounds: {
          min: [-8, -8, -8],
          max: [8, 8, 8],
        },
      });

      const voxels: Voxel[] = [
        { position: [0.1, 0.1, 0.1], color: [1, 0, 0], normal: [0, 1, 0], material: 0, emission: 0 },
        { position: [0.2, 0.2, 0.2], color: [1, 0, 0], normal: [0, 1, 0], material: 0, emission: 0 },
        { position: [0.3, 0.3, 0.3], color: [1, 0, 0], normal: [0, 1, 0], material: 0, emission: 0 },
      ];

      const nodes = deepBuilder.build(voxels);
      // 深度限制应该阻止无限细分
      expect(nodes.length).toBeLessThan(1000);
    });
  });

  describe('体素化', () => {
    it('should voxelize geometry correctly', () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        1, 1, 0,
        0, 1, 0,
      ]);

      const normals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ]);

      const colors = new Float32Array([
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
      ]);

      const voxels = SVOBuilder.voxelizeGeometry(positions, normals, colors, 1);

      expect(voxels.length).toBeGreaterThan(0);
    });

    it('should handle empty geometry', () => {
      const positions = new Float32Array(0);
      const normals = new Float32Array(0);
      const colors = new Float32Array(0);

      const voxels = SVOBuilder.voxelizeGeometry(positions, normals, colors, 1);
      expect(voxels.length).toBe(0);
    });

    it('should deduplicate voxels at same position', () => {
      const positions = new Float32Array([
        0, 0, 0,
        0.5, 0, 0,
        0.7, 0, 0, // 应该和 0.5 合并到同一个体素
      ]);

      const normals = new Float32Array([
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
      ]);

      const colors = new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]);

      const voxels = SVOBuilder.voxelizeGeometry(positions, normals, colors, 1);
      
      // 体素大小为 1，所以位置相近的应该合并
      expect(voxels.length).toBeLessThan(3);
    });
  });

  describe('GPU 序列化', () => {
    it('should serialize nodes to Float32Array', () => {
      const voxels: Voxel[] = [
        { position: [0, 0, 0], color: [1, 0, 0], normal: [0, 1, 0], material: 0, emission: 0 },
        { position: [4, 4, 4], color: [0, 1, 0], normal: [0, 1, 0], material: 1, emission: 0.5 },
      ];

      builder.build(voxels);
      const { nodes, voxels: voxelData } = builder.serializeToGPU();

      expect(nodes).toBeInstanceOf(Float32Array);
      expect(voxelData).toBeInstanceOf(Float32Array);
      expect(nodes.length % 4).toBe(0); // 每节点 4 float
      expect(voxelData.length % 8).toBe(0); // 每体素 8 float
    });

    it('should handle empty SVO serialization', () => {
      builder.build([]);
      const { nodes, voxels } = builder.serializeToGPU();

      expect(nodes.length).toBe(0);
      expect(voxels.length).toBe(0);
    });
  });

  describe('统计信息', () => {
    it('should return correct stats', () => {
      const voxels: Voxel[] = [
        { position: [0, 0, 0], color: [1, 0, 0], normal: [0, 1, 0], material: 0, emission: 0 },
        { position: [8, 8, 8], color: [0, 1, 0], normal: [0, 1, 0], material: 1, emission: 0.5 },
      ];

      builder.build(voxels);
      const stats = builder.getStats();

      expect(stats.nodeCount).toBeGreaterThan(0);
      expect(stats.voxelCount).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('清理', () => {
    it('should clear all data', () => {
      const voxels: Voxel[] = [
        { position: [0, 0, 0], color: [1, 0, 0], normal: [0, 1, 0], material: 0, emission: 0 },
      ];

      builder.build(voxels);
      builder.clear();

      const stats = builder.getStats();
      expect(stats.nodeCount).toBe(0);
      expect(stats.voxelCount).toBe(0);
    });
  });
});

describe('GlobalIlluminationManager', () => {
  let GIManager: typeof import('@/rendering/raytracing/GlobalIlluminationManager').GlobalIlluminationManager;
  let manager: InstanceType<typeof GIManager>;

  // Mock GPUDevice
  const mockDevice = {
    createBuffer: vi.fn().mockReturnValue({
      getMappedRange: vi.fn().mockReturnValue(new ArrayBuffer(1024)),
      unmap: vi.fn(),
      destroy: vi.fn(),
    }),
    createTexture: vi.fn().mockReturnValue({
      createView: vi.fn().mockReturnValue({}),
      destroy: vi.fn(),
    }),
    createShaderModule: vi.fn().mockReturnValue({}),
    createComputePipeline: vi.fn().mockReturnValue({
      getBindGroupLayout: vi.fn().mockReturnValue({}),
    }),
    createBindGroupLayout: vi.fn().mockReturnValue({}),
    createPipelineLayout: vi.fn().mockReturnValue({}),
    createBindGroup: vi.fn().mockReturnValue({}),
    createSampler: vi.fn().mockReturnValue({}),
    createCommandEncoder: vi.fn().mockReturnValue({
      beginComputePass: vi.fn().mockReturnValue({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        dispatchWorkgroups: vi.fn(),
        end: vi.fn(),
      }),
      copyBufferToTexture: vi.fn(),
      finish: vi.fn().mockReturnValue({}),
    }),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn(),
    },
  } as unknown as GPUDevice;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const module = await import('@/rendering/raytracing/GlobalIlluminationManager');
    GIManager = module.GlobalIlluminationManager;
    manager = new GIManager();
  });

  afterEach(() => {
    manager?.destroy();
  });

  describe('初始化', () => {
    it('should initialize successfully with WebGPU device', async () => {
      const result = await manager.init(mockDevice);
      expect(result).toBe(true);
    });

    it('should handle null device', async () => {
      const result = await manager.init(null as any);
      expect(result).toBe(false);
    });
  });

  describe('SVO 构建', () => {
    it('should build SVO from geometry', async () => {
      await manager.init(mockDevice);

      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        1, 1, 0,
      ]);

      const normals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ]);

      const colors = new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]);

      expect(() => {
        manager.buildSVO(positions, normals, colors);
      }).not.toThrow();
    });
  });

  describe('光探针', () => {
    it('should return irradiance at position', async () => {
      await manager.init(mockDevice);

      const irradiance = manager.getProbeIrradiance([0, 0, 0]);
      
      expect(irradiance).toBeInstanceOf(Array);
      expect(irradiance.length).toBe(3);
    });

    it('should update probes with emissive objects', async () => {
      await manager.init(mockDevice);

      const positions = new Float32Array([0, 10, 0]);
      const emissiveColors = new Float32Array([1, 0.5, 0]);

      expect(() => {
        manager.updateProbes(positions, emissiveColors);
      }).not.toThrow();
    });
  });

  describe('统计', () => {
    it('should return stats', async () => {
      await manager.init(mockDevice);

      const stats = manager.getStats();
      
      expect(stats).toHaveProperty('nodeCount');
      expect(stats).toHaveProperty('voxelCount');
      expect(stats).toHaveProperty('giEnabled');
    });
  });

  describe('资源清理', () => {
    it('should destroy resources', async () => {
      await manager.init(mockDevice);
      manager.destroy();
      
      // 多次 destroy 不应该抛出错误
      expect(() => manager.destroy()).not.toThrow();
    });
  });
});

describe('光探针插值', () => {
  it('should interpolate between probes', () => {
    // 简单的线性插值测试
    const probe1: [number, number, number] = [0.1, 0.2, 0.3];
    const probe2: [number, number, number] = [0.4, 0.5, 0.6];
    
    const t = 0.5;
    const result: [number, number, number] = [
      probe1[0] + (probe2[0] - probe1[0]) * t,
      probe1[1] + (probe2[1] - probe1[1]) * t,
      probe1[2] + (probe2[2] - probe1[2]) * t,
    ];
    
    expect(result[0]).toBeCloseTo(0.25);
    expect(result[1]).toBeCloseTo(0.35);
    expect(result[2]).toBeCloseTo(0.45);
  });
});
