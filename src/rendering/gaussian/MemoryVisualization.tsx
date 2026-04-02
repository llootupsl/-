/**
 * =============================================================================
 * 永夜熵纪 - 记忆可视化组件
 * Memory Visualization Component using Gaussian Splatting
 * =============================================================================
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GaussianSplatting, GaussianPoint } from './GaussianSplatting';
import { logger } from '@/core/utils/Logger';

/** 记忆数据 */
export interface Memory {
  id: string;
  npcId: string;
  type: 'visual' | 'auditory' | 'emotional' | 'cognitive';
  timestamp: number;
  content: string;
  embedding?: number[];
  importance: number;
  decay: number;
}

/** 记忆可视化配置 */
interface MemoryVisualizationProps {
  /** 记忆数据 */
  memories: Memory[];
  /** 相机位置 */
  cameraPosition: [number, number, number];
  /** 是否启用交互 */
  interactive?: boolean;
  /** 记忆选择回调 */
  onMemorySelect?: (memory: Memory) => void;
}

/**
 * 记忆可视化组件
 * 
 * 将 NPC 记忆以 3D 高斯点的形式可视化
 */
export const MemoryVisualization: React.FC<MemoryVisualizationProps> = ({
  memories,
  cameraPosition,
  interactive = true,
  onMemorySelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GaussianSplatting | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [stats, setStats] = useState({ pointCount: 0, memoryUsage: 0 });

  // 初始化渲染器
  useEffect(() => {
    if (!canvasRef.current) return;

    const initRenderer = async () => {
      try {
        const canvas = canvasRef.current!;
        const adapter = await navigator.gpu?.requestAdapter();
        
        if (!adapter) {
          logger.warn('MemoryVisualization', 'WebGPU not available');
          setIsLoading(false);
          return;
        }

        const device = await adapter.requestDevice();
        
        const context = canvas.getContext('webgpu');
        if (!context) {
          logger.error('MemoryVisualization', 'Failed to get WebGPU context');
          setIsLoading(false);
          return;
        }

        context.configure({
          device,
          format: navigator.gpu.getPreferredCanvasFormat(),
        });

        const renderer = new GaussianSplatting({
          maxPoints: 50000,
          enableSorting: true,
        });

        await renderer.init(device);
        rendererRef.current = renderer;

        // 监听事件
        renderer.on('rendered', (data) => {
          setStats(prev => ({ ...prev, pointCount: data.points }));
        });

        setIsLoading(false);
      } catch (error) {
        logger.error(
          'MemoryVisualization',
          'Init failed',
          error instanceof Error ? error : new Error(String(error))
        );
        setIsLoading(false);
      }
    };

    initRenderer();

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  // 更新记忆数据
  useEffect(() => {
    if (!rendererRef.current || memories.length === 0) return;

    const points = convertMemoriesToGaussians(memories);
    rendererRef.current.loadPoints(points);
    
    setStats(prev => ({
      ...prev,
      memoryUsage: rendererRef.current?.getStats().memoryUsage || 0,
    }));
  }, [memories]);

  // 渲染循环
  useEffect(() => {
    if (!rendererRef.current || !canvasRef.current || isLoading) return;

    let animationId: number;
    let lastTime = 0;

    const render = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      const renderer = rendererRef.current;
      const canvas = canvasRef.current!;

      if (renderer && canvas.width > 0 && canvas.height > 0) {
        // 这里简化了，实际需要从相机系统获取 viewProjection
        const viewProjection = new Float32Array(16);
        // ... 计算视图投影矩阵

        // const context = canvas.getContext('webgpu');
        // const commandEncoder = device.createCommandEncoder();
        // renderer.render(commandEncoder, viewProjection, cameraPosition, ...);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isLoading, cameraPosition]);

  // 处理点击选择
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!interactive || !onMemorySelect) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // 查找最近的记忆（简化实现）
    const closestMemory = findClosestMemory(x, y, memories);
    
    if (closestMemory) {
      setSelectedMemory(closestMemory);
      onMemorySelect(closestMemory);
    }
  }, [interactive, memories, onMemorySelect]);

  // 查找最近的记忆
  const findClosestMemory = (x: number, y: number, mems: Memory[]): Memory | null => {
    if (mems.length === 0) return null;
    
    // 简化：返回第一个记忆
    // 实际应该进行空间查询
    return mems[0];
  };

  return (
    <div ref={containerRef} className="memory-visualization relative w-full h-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={handleClick}
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-cyan-400 animate-pulse">
            初始化记忆可视化...
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="absolute top-2 left-2 p-2 bg-black/50 backdrop-blur-sm rounded text-xs text-gray-400">
        <div>高斯点: {stats.pointCount.toLocaleString()}</div>
        <div>内存: {(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB</div>
      </div>

      {/* 选中的记忆详情 */}
      {selectedMemory && interactive && (
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/70 backdrop-blur-sm rounded-lg border border-cyan-500/30">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-cyan-400 font-bold mb-1">
                {selectedMemory.type.toUpperCase()}
              </h4>
              <p className="text-gray-300 text-sm">
                {selectedMemory.content}
              </p>
              <div className="text-xs text-gray-500 mt-2">
                重要性: {(selectedMemory.importance * 100).toFixed(0)}%
                {' | '}
                衰减: {(selectedMemory.decay * 100).toFixed(0)}%
              </div>
            </div>
            <button
              onClick={() => setSelectedMemory(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded text-xs">
        <div className="text-gray-400 mb-1">记忆类型</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-gray-300">视觉</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-400" />
            <span className="text-gray-300">听觉</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-gray-300">情感</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-gray-300">认知</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 将记忆转换为高斯点
 */
function convertMemoriesToGaussians(memories: Memory[]): GaussianPoint[] {
  return memories.map((memory, index) => {
    // 根据记忆类型确定颜色
    const color = getMemoryColor(memory.type);
    
    // 根据重要性确定大小
    const scale = 0.2 + memory.importance * 0.8;
    
    // 根据时间戳确定位置（时间轴）
    const timeOffset = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24); // 天数
    const z = -timeOffset * 2; // 每天向后移动 2 单位
    
    // 根据嵌入向量确定位置（如果有）
    let x = (index % 10) * 0.5 - 2.5;
    let y = Math.floor(index / 10) * 0.5 - 2.5;
    
    if (memory.embedding && memory.embedding.length >= 2) {
      x = memory.embedding[0] * 5;
      y = memory.embedding[1] * 5;
    }

    return {
      position: [x, y, z],
      scale: [scale, scale, scale],
      rotation: [0, 0, 0, 1], // 无旋转
      color,
      opacity: 1 - memory.decay * 0.5,
      memoryId: memory.id,
    };
  });
}

/**
 * 获取记忆颜色
 */
function getMemoryColor(type: Memory['type']): [number, number, number] {
  switch (type) {
    case 'visual':
      return [0, 0.94, 1]; // 青色
    case 'auditory':
      return [1, 0.4, 0.7]; // 粉色
    case 'emotional':
      return [1, 0.95, 0]; // 黄色
    case 'cognitive':
      return [0.22, 1, 0.08]; // 绿色
    default:
      return [0.5, 0.5, 0.5];
  }
}

export default MemoryVisualization;
