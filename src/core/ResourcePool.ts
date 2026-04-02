/**
 * =============================================================================
 * 资源池 - 泛型资源池化管理
 * =============================================================================
 * 
 * 功能：
 * - 对象池化，减少GC压力
 * - 支持任何可重用资源
 * - 自动扩容和收缩
 * - 资源生命周期管理
 */

import { logger } from './utils/Logger';

export interface PoolableResource {
  reset(): void;
  isAlive?: boolean;
}

export interface ResourcePoolConfig {
  initialSize: number;
  maxSize: number;
  autoExpand: boolean;
  expandStep: number;
  shrinkThreshold: number;
  idleTimeout: number;
}

const DEFAULT_CONFIG: ResourcePoolConfig = {
  initialSize: 10,
  maxSize: 1000,
  autoExpand: true,
  expandStep: 10,
  shrinkThreshold: 0.3,
  idleTimeout: 60000,
};

export interface ResourcePoolStats {
  totalCreated: number;
  totalDestroyed: number;
  currentAvailable: number;
  currentInUse: number;
  totalCapacity: number;
  hitRate: number;
  missRate: number;
}

export class ResourcePool<T extends PoolableResource> {
  private factory: () => T;
  private config: ResourcePoolConfig;

  private available: T[] = [];
  private inUse: Set<T> = new Set();

  private totalCreated = 0;
  private totalDestroyed = 0;
  private hits = 0;
  private misses = 0;

  private lastAccessTime = Date.now();
  private shrinkCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(factory: () => T, config: Partial<ResourcePoolConfig> = {}) {
    this.factory = factory;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.initialize();
    this.startShrinkCheck();
  }

  private initialize(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const resource = this.createResource();
      this.available.push(resource);
    }
    logger.debug('ResourcePool', `Initialized with ${this.available.length} resources`);
  }

  private createResource(): T {
    const resource = this.factory();
    this.totalCreated++;
    return resource;
  }

  acquire(): T {
    this.lastAccessTime = Date.now();

    if (this.available.length > 0) {
      const resource = this.available.pop()!;
      this.inUse.add(resource);
      this.hits++;
      return resource;
    }

    this.misses++;

    if (this.config.autoExpand && this.getTotalCapacity() < this.config.maxSize) {
      const expandCount = Math.min(
        this.config.expandStep,
        this.config.maxSize - this.getTotalCapacity()
      );

      for (let i = 0; i < expandCount; i++) {
        const resource = this.createResource();
        this.available.push(resource);
      }

      logger.debug('ResourcePool', `Expanded by ${expandCount} resources`);

      const resource = this.available.pop()!;
      this.inUse.add(resource);
      return resource;
    }

    logger.warn('ResourcePool', 'Pool exhausted, creating temporary resource');
    const resource = this.createResource();
    this.inUse.add(resource);
    return resource;
  }

  release(resource: T): void {
    if (!this.inUse.has(resource)) {
      logger.warn('ResourcePool', 'Attempting to release a resource not from this pool');
      return;
    }

    this.inUse.delete(resource);

    if (resource.isAlive === false) {
      this.totalDestroyed++;
      return;
    }

    resource.reset();

    if (this.getTotalCapacity() < this.config.maxSize) {
      this.available.push(resource);
    } else {
      this.totalDestroyed++;
    }
  }

  clear(): void {
    const destroyedCount = this.available.length + this.inUse.size;
    this.totalDestroyed += destroyedCount;

    this.available = [];
    this.inUse.clear();

    console.log(`[ResourcePool] Cleared ${destroyedCount} resources`);
  }

  private startShrinkCheck(): void {
    this.shrinkCheckInterval = setInterval(() => {
      this.tryShrink();
    }, this.config.idleTimeout);
  }

  private tryShrink(): void {
    const now = Date.now();
    const idleTime = now - this.lastAccessTime;

    if (idleTime < this.config.idleTimeout) return;

    const totalCapacity = this.getTotalCapacity();
    const minSize = this.config.initialSize;
    const shrinkThreshold = Math.floor(totalCapacity * this.config.shrinkThreshold);

    if (this.available.length > shrinkThreshold && totalCapacity > minSize) {
      const shrinkCount = Math.min(
        this.available.length - minSize,
        this.available.length - shrinkThreshold
      );

      for (let i = 0; i < shrinkCount; i++) {
        this.available.pop();
        this.totalDestroyed++;
      }

      console.log(`[ResourcePool] Shrunk by ${shrinkCount} resources`);
    }
  }

  getTotalCapacity(): number {
    return this.available.length + this.inUse.size;
  }

  getAvailableCount(): number {
    return this.available.length;
  }

  getInUseCount(): number {
    return this.inUse.size;
  }

  getStats(): ResourcePoolStats {
    const total = this.hits + this.misses;
    return {
      totalCreated: this.totalCreated,
      totalDestroyed: this.totalDestroyed,
      currentAvailable: this.available.length,
      currentInUse: this.inUse.size,
      totalCapacity: this.getTotalCapacity(),
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
    };
  }

  prewarm(count: number): void {
    const actualCount = Math.min(count, this.config.maxSize - this.getTotalCapacity());

    for (let i = 0; i < actualCount; i++) {
      const resource = this.createResource();
      this.available.push(resource);
    }

    console.log(`[ResourcePool] Prewarmed ${actualCount} resources`);
  }

  forEachInUse(callback: (resource: T) => void): void {
    for (const resource of this.inUse) {
      callback(resource);
    }
  }

  releaseAll(): void {
    for (const resource of Array.from(this.inUse)) {
      this.release(resource);
    }
  }

  updateConfig(config: Partial<ResourcePoolConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    if (this.shrinkCheckInterval) {
      clearInterval(this.shrinkCheckInterval);
      this.shrinkCheckInterval = null;
    }

    this.clear();
    logger.info('ResourcePool', 'Destroyed');
  }
}

export class ObjectPool<T> extends ResourcePool<T & PoolableResource> {
  constructor(
    factory: () => T & PoolableResource,
    config?: Partial<ResourcePoolConfig>
  ) {
    super(factory, config);
  }
}

export class ArrayPool<T> extends ResourcePool<T[] & PoolableResource> {
  private itemFactory: () => T;

  constructor(
    itemFactory: () => T,
    initialCapacity: number = 10,
    config?: Partial<ResourcePoolConfig>
  ) {
    const arrayFactory = (): T[] & PoolableResource => {
      const arr: T[] & PoolableResource = Object.assign([], { reset: () => { arr.length = 0; } });
      return arr;
    };

    super(arrayFactory, config);
    this.itemFactory = itemFactory;
  }

  acquireWithItems(count: number): T[] {
    const arr = this.acquire();
    while (arr.length < count) {
      arr.push(this.itemFactory());
    }
    return arr;
  }
}

export default ResourcePool;
