/**
 * =============================================================================
 * 永夜熵纪 - 稀疏体素八叉树（SVO）构建器
 * Sparse Voxel Octree Builder for WebGPU Ray Tracing
 * =============================================================================
 * 
 * 用于构建场景的稀疏体素八叉树表示，支持高效的光线追踪。
 * 
 * 特性：
 * - 自适应细分
 * - 紧凑的 GPU 缓冲格式
 * - 支持动态更新
 */

import { Vec3 } from '@/core/types';
import { logger } from '@/core/utils/Logger';

/** 体素数据 */
export interface Voxel {
  /** 世界空间位置 */
  position: [number, number, number];
  /** RGB 颜色 */
  color: [number, number, number];
  /** 法线向量 */
  normal: [number, number, number];
  /** 材质 ID */
  material: number;
  /** 发光强度 */
  emission: number;
}

/** SVO 节点 */
export interface SVONode {
  /** 子节点掩码（8位，每位表示对应八分空间是否有子节点） */
  childMask: number;
  /** 子节点在缓冲区中的起始索引 */
  childPtr: number;
  /** 体素数据索引（叶子节点） */
  voxelIndex: number;
  /** 节点边界框 */
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

/** 构建选项 */
export interface SVOBuildOptions {
  /** 最大深度 */
  maxDepth: number;
  /** 最小体素尺寸 */
  minVoxelSize: number;
  /** 空间边界 */
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

/** 默认构建选项 */
const DEFAULT_OPTIONS: SVOBuildOptions = {
  maxDepth: 8,
  minVoxelSize: 0.5,
  bounds: {
    min: [-128, -128, -128],
    max: [128, 128, 128],
  },
};

/**
 * 稀疏体素八叉树构建器
 */
export class SVOBuilder {
  private options: SVOBuildOptions;
  private nodes: SVONode[] = [];
  private voxels: Voxel[] = [];
  private nodeCount: number = 0;
  private voxelCount: number = 0;

  constructor(options: Partial<SVOBuildOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 从体素数组构建 SVO
   */
  public build(voxels: Voxel[]): SVONode[] {
    this.nodes = [];
    this.voxels = voxels;
    this.nodeCount = 0;
    this.voxelCount = voxels.length;

    if (voxels.length === 0) {
      return this.nodes;
    }

    // 创建根节点
    const root = this.createNode(
      this.options.bounds.min,
      this.options.bounds.max,
      0
    );

    // 递归构建
    this.buildNodeRecursive(root, voxels, 0);

    // 计算子节点指针
    this.computeChildPointers();

    logger.info('SVOBuilder', `Built SVO with ${this.nodeCount} nodes, ${this.voxelCount} voxels`);
    return this.nodes;
  }

  /**
   * 创建节点
   */
  private createNode(
    min: [number, number, number],
    max: [number, number, number],
    depth: number
  ): SVONode {
    const node: SVONode = {
      childMask: 0,
      childPtr: 0,
      voxelIndex: -1,
      bounds: { min: [...min], max: [...max] },
    };

    this.nodes.push(node);
    this.nodeCount++;

    return node;
  }

  /**
   * 递归构建节点
   */
  private buildNodeRecursive(
    node: SVONode,
    voxels: Voxel[],
    depth: number
  ): void {
    const { min, max } = node.bounds;
    const size = max[0] - min[0];

    // 检查终止条件
    if (
      depth >= this.options.maxDepth ||
      size <= this.options.minVoxelSize ||
      voxels.length === 0
    ) {
      // 叶子节点
      if (voxels.length === 1) {
        node.voxelIndex = this.voxels.indexOf(voxels[0]);
      } else if (voxels.length > 1) {
        // 合并多个体素（取平均颜色）
        node.voxelIndex = this.mergeVoxels(voxels);
      }
      return;
    }

    // 计算八分空间
    const halfSize = size / 2;
    const octants = this.computeOctants(min, max, halfSize);

    // 分配体素到八分空间
    const voxelGroups = this.partitionVoxels(voxels, octants);

    // 递归构建子节点
    for (let i = 0; i < 8; i++) {
      if (voxelGroups[i].length > 0) {
        const childNode = this.createNode(
          octants[i].min,
          octants[i].max,
          depth + 1
        );
        
        node.childMask |= (1 << i);
        this.buildNodeRecursive(childNode, voxelGroups[i], depth + 1);
      }
    }
  }

  /**
   * 计算八分空间边界
   */
  private computeOctants(
    min: [number, number, number],
    max: [number, number, number],
    halfSize: number
  ): Array<{ min: [number, number, number]; max: [number, number, number] }> {
    const octants: Array<{ min: [number, number, number]; max: [number, number, number] }> = [];

    for (let i = 0; i < 8; i++) {
      const x = min[0] + (i & 1 ? halfSize : 0);
      const y = min[1] + (i & 2 ? halfSize : 0);
      const z = min[2] + (i & 4 ? halfSize : 0);

      octants.push({
        min: [x, y, z],
        max: [x + halfSize, y + halfSize, z + halfSize],
      });
    }

    return octants;
  }

  /**
   * 将体素分区到八分空间
   */
  private partitionVoxels(
    voxels: Voxel[],
    octants: Array<{ min: [number, number, number]; max: [number, number, number] }>
  ): Voxel[][] {
    const groups: Voxel[][] = Array.from({ length: 8 }, () => []);

    for (const voxel of voxels) {
      for (let i = 0; i < 8; i++) {
        if (this.isVoxelInBounds(voxel, octants[i])) {
          groups[i].push(voxel);
          break;
        }
      }
    }

    return groups;
  }

  /**
   * 检查体素是否在边界内
   */
  private isVoxelInBounds(
    voxel: Voxel,
    bounds: { min: [number, number, number]; max: [number, number, number] }
  ): boolean {
    const [x, y, z] = voxel.position;
    const { min, max } = bounds;

    return (
      x >= min[0] && x < max[0] &&
      y >= min[1] && y < max[1] &&
      z >= min[2] && z < max[2]
    );
  }

  /**
   * 合并多个体素为一个
   */
  private mergeVoxels(voxels: Voxel[]): number {
    // 计算平均颜色
    let r = 0, g = 0, b = 0;
    let nx = 0, ny = 0, nz = 0;
    
    for (const v of voxels) {
      r += v.color[0];
      g += v.color[1];
      b += v.color[2];
      nx += v.normal[0];
      ny += v.normal[1];
      nz += v.normal[2];
    }

    const n = voxels.length;
    const mergedVoxel: Voxel = {
      position: [...voxels[0].position],
      color: [r / n, g / n, b / n],
      normal: this.normalize([nx / n, ny / n, nz / n]),
      material: voxels[0].material,
      emission: voxels.reduce((sum, v) => sum + v.emission, 0) / n,
    };

    this.voxels.push(mergedVoxel);
    return this.voxels.length - 1;
  }

  /**
   * 归一化向量
   */
  private normalize(v: [number, number, number]): [number, number, number] {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (len === 0) return [0, 1, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  /**
   * 计算子节点指针
   */
  private computeChildPointers(): void {
    // 第一遍：标记需要子节点的位置
    let nextFreeSlot = 1; // 根节点在索引 0

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.childMask > 0) {
        node.childPtr = nextFreeSlot;
        nextFreeSlot += this.popcount(node.childMask);
      }
    }
  }

  /**
   * 计算位图中 1 的个数
   */
  private popcount(n: number): number {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>>= 1;
    }
    return count;
  }

  /**
   * 序列化为 GPU 缓冲格式
   * 
   * 节点格式（每个节点 16 字节）：
   * - u32: childMask + padding (4 bytes)
   * - u32: childPtr (4 bytes)
   * - u32: voxelIndex (4 bytes)
   * - u32: padding (4 bytes)
   */
  public serializeToGPU(): { nodes: Float32Array; voxels: Float32Array } {
    // 序列化节点
    const nodeData = new Float32Array(this.nodes.length * 4);
    
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const offset = i * 4;
      
      nodeData[offset + 0] = node.childMask;
      nodeData[offset + 1] = node.childPtr;
      nodeData[offset + 2] = node.voxelIndex >= 0 ? node.voxelIndex : 0xFFFFFFFF;
      nodeData[offset + 3] = 0; // padding
    }

    // 序列化体素
    const voxelData = new Float32Array(this.voxels.length * 8);
    
    for (let i = 0; i < this.voxels.length; i++) {
      const voxel = this.voxels[i];
      const offset = i * 8;
      
      // 位置 (3 floats)
      voxelData[offset + 0] = voxel.position[0];
      voxelData[offset + 1] = voxel.position[1];
      voxelData[offset + 2] = voxel.position[2];
      
      // 颜色 (3 floats)
      voxelData[offset + 3] = voxel.color[0];
      voxelData[offset + 4] = voxel.color[1];
      voxelData[offset + 5] = voxel.color[2];
      
      // 法线 + 发光 (3 floats + 1 float)
      voxelData[offset + 6] = voxel.emission;
      voxelData[offset + 7] = voxel.material;
    }

    return { nodes: nodeData, voxels: voxelData };
  }

  /**
   * 从场景几何体生成体素
   */
  public static voxelizeGeometry(
    positions: Float32Array,
    normals: Float32Array,
    colors: Float32Array,
    voxelSize: number
  ): Voxel[] {
    const voxels: Voxel[] = [];
    const voxelMap = new Map<string, Voxel>();

    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      // 量化到体素网格
      const vx = Math.floor(x / voxelSize) * voxelSize;
      const vy = Math.floor(y / voxelSize) * voxelSize;
      const vz = Math.floor(z / voxelSize) * voxelSize;

      const key = `${vx},${vy},${vz}`;

      if (!voxelMap.has(key)) {
        const voxel: Voxel = {
          position: [vx, vy, vz],
          color: colors ? [
            colors[i * 3] || 0.5,
            colors[i * 3 + 1] || 0.5,
            colors[i * 3 + 2] || 0.5,
          ] : [0.5, 0.5, 0.5],
          normal: normals ? [
            normals[i * 3] || 0,
            normals[i * 3 + 1] || 1,
            normals[i * 3 + 2] || 0,
          ] : [0, 1, 0],
          material: 0,
          emission: 0,
        };

        voxelMap.set(key, voxel);
        voxels.push(voxel);
      }
    }

    return voxels;
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    nodeCount: number;
    voxelCount: number;
    maxDepth: number;
    memoryUsage: number;
  } {
    const nodeMemory = this.nodes.length * 16; // 16 bytes per node
    const voxelMemory = this.voxels.length * 32; // 32 bytes per voxel

    return {
      nodeCount: this.nodeCount,
      voxelCount: this.voxelCount,
      maxDepth: this.options.maxDepth,
      memoryUsage: nodeMemory + voxelMemory,
    };
  }

  /**
   * 清除数据
   */
  public clear(): void {
    this.nodes = [];
    this.voxels = [];
    this.nodeCount = 0;
    this.voxelCount = 0;
  }
}

export default SVOBuilder;
