/**
 * =============================================================================
 * 渲染优化器
 * =============================================================================
 * 
 * 功能：
 * - 智能帧率控制
 * - 脏区域检测
 * - 渲染批处理
 * - LOD 自动调整
 */

import { logger } from '@/core/utils/Logger';

export interface RenderOptimizerConfig {
  targetFPS: number;
  minFPS: number;
  maxFPS: number;
  adaptiveQuality: boolean;
  dirtyRectTracking: boolean;
  batchRendering: boolean;
  lodAutoAdjust: boolean;
}

export interface FrameStats {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  idleTime: number;
  droppedFrames: number;
  quality: number;
}

export interface RenderContext {
  needsRender: boolean;
  dirtyRegions: Array<{ x: number; y: number; width: number; height: number }>;
  lodLevel: number;
  skipFrame: boolean;
}

const DEFAULT_CONFIG: RenderOptimizerConfig = {
  targetFPS: 60,
  minFPS: 30,
  maxFPS: 120,
  adaptiveQuality: true,
  dirtyRectTracking: true,
  batchRendering: true,
  lodAutoAdjust: true,
};

export class RenderOptimizer {
  private config: RenderOptimizerConfig;
  
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private updateTimeHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  
  private currentQuality = 1.0;
  private currentLODLevel = 0;
  private droppedFrames = 0;
  private consecutiveSlowFrames = 0;
  private consecutiveFastFrames = 0;
  
  private dirtyRegions: Array<{ x: number; y: number; width: number; height: number }> = [];
  private renderBatch: Array<() => void> = [];
  private pendingRenders = false;
  
  private rafId: number | null = null;
  private running = false;
  
  private updateCallback: ((deltaTime: number) => void) | null = null;
  private renderCallback: ((context: RenderContext) => void) | null = null;

  constructor(config: Partial<RenderOptimizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setUpdateCallback(callback: (deltaTime: number) => void): void {
    this.updateCallback = callback;
  }

  setRenderCallback(callback: (context: RenderContext) => void): void {
    this.renderCallback = callback;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    
    const targetFrameTime = 1000 / this.config.targetFPS;
    const shouldSkipFrame = deltaTime < targetFrameTime * 0.5;
    
    if (shouldSkipFrame && this.config.adaptiveQuality) {
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    const updateStart = performance.now();
    this.updateCallback?.(deltaTime);
    const updateTime = performance.now() - updateStart;

    const renderStart = performance.now();
    const context: RenderContext = {
      needsRender: !shouldSkipFrame,
      dirtyRegions: this.getDirtyRegions(),
      lodLevel: this.currentLODLevel,
      skipFrame: shouldSkipFrame,
    };
    this.renderCallback?.(context);
    const renderTime = performance.now() - renderStart;

    this.recordFrameStats(deltaTime, updateTime, renderTime);
    this.adaptiveQualityAdjust();

    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(this.loop);
  };

  private recordFrameStats(frameTime: number, updateTime: number, renderTime: number): void {
    this.frameCount++;
    
    const fps = 1000 / frameTime;
    this.fpsHistory.push(fps);
    this.frameTimeHistory.push(frameTime);
    this.updateTimeHistory.push(updateTime);
    this.renderTimeHistory.push(renderTime);

    const maxHistory = 60;
    if (this.fpsHistory.length > maxHistory) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
      this.updateTimeHistory.shift();
      this.renderTimeHistory.shift();
    }

    if (fps < this.config.minFPS) {
      this.droppedFrames++;
      this.consecutiveSlowFrames++;
      this.consecutiveFastFrames = 0;
    } else if (fps > this.config.targetFPS * 0.9) {
      this.consecutiveFastFrames++;
      this.consecutiveSlowFrames = 0;
    }
  }

  private adaptiveQualityAdjust(): void {
    if (!this.config.adaptiveQuality) return;

    if (this.consecutiveSlowFrames >= 10) {
      this.currentQuality = Math.max(0.5, this.currentQuality - 0.1);
      this.currentLODLevel = Math.min(3, this.currentLODLevel + 1);
      this.consecutiveSlowFrames = 0;
      logger.info('RenderOptimizer', `Quality reduced to ${this.currentQuality.toFixed(2)}, LOD ${this.currentLODLevel}`);
    }

    if (this.consecutiveFastFrames >= 30 && this.currentQuality < 1.0) {
      this.currentQuality = Math.min(1.0, this.currentQuality + 0.05);
      if (this.currentQuality > 0.9) {
        this.currentLODLevel = Math.max(0, this.currentLODLevel - 1);
      }
      this.consecutiveFastFrames = 0;
      logger.info('RenderOptimizer', `Quality increased to ${this.currentQuality.toFixed(2)}, LOD ${this.currentLODLevel}`);
    }
  }

  markDirty(x: number, y: number, width: number, height: number): void {
    if (!this.config.dirtyRectTracking) return;
    
    this.dirtyRegions.push({ x, y, width, height });
    
    if (this.dirtyRegions.length > 100) {
      this.mergeDirtyRegions();
    }
  }

  markAllDirty(): void {
    this.dirtyRegions = [{ x: -Infinity, y: -Infinity, width: Infinity, height: Infinity }];
  }

  private getDirtyRegions(): Array<{ x: number; y: number; width: number; height: number }> {
    const regions = [...this.dirtyRegions];
    this.dirtyRegions = [];
    return regions;
  }

  private mergeDirtyRegions(): void {
    if (this.dirtyRegions.length <= 1) return;

    const merged: typeof this.dirtyRegions = [];
    const used = new Set<number>();

    for (let i = 0; i < this.dirtyRegions.length; i++) {
      if (used.has(i)) continue;

      let current = { ...this.dirtyRegions[i] };

      for (let j = i + 1; j < this.dirtyRegions.length; j++) {
        if (used.has(j)) continue;

        const other = this.dirtyRegions[j];
        if (this.regionsOverlap(current, other)) {
          current = this.mergeTwoRegions(current, other);
          used.add(j);
        }
      }

      merged.push(current);
      used.add(i);
    }

    this.dirtyRegions = merged;
  }

  private regionsOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(a.x + a.width < b.x || b.x + b.width < a.x ||
             a.y + a.height < b.y || b.y + b.height < a.y);
  }

  private mergeTwoRegions(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): { x: number; y: number; width: number; height: number } {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const right = Math.max(a.x + a.width, b.x + b.width);
    const bottom = Math.max(a.y + a.height, b.y + b.height);
    return { x, y, width: right - x, height: bottom - y };
  }

  addToBatch(renderFn: () => void): void {
    if (!this.config.batchRendering) {
      renderFn();
      return;
    }

    this.renderBatch.push(renderFn);
    this.pendingRenders = true;
  }

  flushBatch(): void {
    if (!this.pendingRenders) return;

    for (const fn of this.renderBatch) {
      fn();
    }
    this.renderBatch = [];
    this.pendingRenders = false;
  }

  getStats(): FrameStats {
    const avgFPS = this.average(this.fpsHistory);
    const avgFrameTime = this.average(this.frameTimeHistory);
    const avgUpdateTime = this.average(this.updateTimeHistory);
    const avgRenderTime = this.average(this.renderTimeHistory);
    const avgIdleTime = Math.max(0, avgFrameTime - avgUpdateTime - avgRenderTime);

    return {
      fps: Math.round(avgFPS),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      updateTime: Math.round(avgUpdateTime * 100) / 100,
      renderTime: Math.round(avgRenderTime * 100) / 100,
      idleTime: Math.round(avgIdleTime * 100) / 100,
      droppedFrames: this.droppedFrames,
      quality: Math.round(this.currentQuality * 100) / 100,
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  getQuality(): number {
    return this.currentQuality;
  }

  getLODLevel(): number {
    return this.currentLODLevel;
  }

  setTargetFPS(fps: number): void {
    this.config.targetFPS = Math.max(this.config.minFPS, Math.min(this.config.maxFPS, fps));
  }

  setQuality(quality: number): void {
    this.currentQuality = Math.max(0.1, Math.min(1.0, quality));
  }

  setLODLevel(level: number): void {
    this.currentLODLevel = Math.max(0, Math.min(4, level));
  }

  reset(): void {
    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.updateTimeHistory = [];
    this.renderTimeHistory = [];
    this.droppedFrames = 0;
    this.consecutiveSlowFrames = 0;
    this.consecutiveFastFrames = 0;
    this.currentQuality = 1.0;
    this.currentLODLevel = 0;
    this.dirtyRegions = [];
    this.renderBatch = [];
  }

  destroy(): void {
    this.stop();
    this.updateCallback = null;
    this.renderCallback = null;
  }
}

export class LazyRenderer<T> {
  private items: Map<string, { data: T; lastAccess: number; priority: number }> = new Map();
  private maxItems: number;
  private loadedItems: Set<string> = new Set();
  private loadingItems: Set<string> = new Set();
  private loader: (id: string) => Promise<T>;
  private unloader: ((id: string, data: T) => void) | null;

  constructor(
    loader: (id: string) => Promise<T>,
    maxItems: number = 100,
    unloader?: (id: string, data: T) => void
  ) {
    this.loader = loader;
    this.maxItems = maxItems;
    this.unloader = unloader || null;
  }

  async get(id: string): Promise<T | null> {
    const existing = this.items.get(id);
    if (existing) {
      existing.lastAccess = Date.now();
      return existing.data;
    }

    if (this.loadingItems.has(id)) {
      return this.waitForLoad(id);
    }

    return this.load(id);
  }

  private async load(id: string): Promise<T | null> {
    this.loadingItems.add(id);

    try {
      const data = await this.loader(id);
      
      this.items.set(id, {
        data,
        lastAccess: Date.now(),
        priority: 0,
      });
      this.loadedItems.add(id);
      this.loadingItems.delete(id);

      this.evictIfNeeded();

      return data;
    } catch (error) {
      this.loadingItems.delete(id);
      console.error(`[LazyRenderer] Failed to load ${id}:`, error);
      return null;
    }
  }

  private async waitForLoad(id: string): Promise<T | null> {
    return new Promise((resolve) => {
      const check = () => {
        const item = this.items.get(id);
        if (item) {
          resolve(item.data);
        } else if (!this.loadingItems.has(id)) {
          resolve(null);
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  private evictIfNeeded(): void {
    if (this.items.size <= this.maxItems) return;

    const entries = Array.from(this.items.entries());
    entries.sort((a, b) => {
      const priorityDiff = b[1].priority - a[1].priority;
      if (priorityDiff !== 0) return priorityDiff;
      return a[1].lastAccess - b[1].lastAccess;
    });

    const toEvict = entries.slice(this.maxItems);
    for (const [id, item] of toEvict) {
      if (this.unloader) {
        this.unloader(id, item.data);
      }
      this.items.delete(id);
      this.loadedItems.delete(id);
    }
  }

  setPriority(id: string, priority: number): void {
    const item = this.items.get(id);
    if (item) {
      item.priority = priority;
    }
  }

  preload(ids: string[]): void {
    for (const id of ids) {
      if (!this.items.has(id) && !this.loadingItems.has(id)) {
        this.load(id);
      }
    }
  }

  unload(id: string): void {
    const item = this.items.get(id);
    if (item) {
      if (this.unloader) {
        this.unloader(id, item.data);
      }
      this.items.delete(id);
      this.loadedItems.delete(id);
    }
  }

  isLoaded(id: string): boolean {
    return this.loadedItems.has(id);
  }

  isLoading(id: string): boolean {
    return this.loadingItems.has(id);
  }

  getLoadedCount(): number {
    return this.loadedItems.size;
  }

  clear(): void {
    if (this.unloader) {
      for (const [id, item] of this.items) {
        this.unloader(id, item.data);
      }
    }
    this.items.clear();
    this.loadedItems.clear();
    this.loadingItems.clear();
  }
}

export const renderOptimizer = new RenderOptimizer();

export default RenderOptimizer;
