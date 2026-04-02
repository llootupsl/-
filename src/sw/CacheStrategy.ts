/**
 * 缓存策略管理器
 * 实现多种缓存策略: StaleWhileRevalidate, CacheFirst, NetworkFirst
 */

export type CacheStrategyType = 'stale-while-revalidate' | 'cache-first' | 'network-first' | 'network-only' | 'cache-only';

export interface CacheConfig {
  cacheName: string;
  maxAge?: number;
  maxEntries?: number;
  strategy: CacheStrategyType;
}

export interface CacheEntry {
  url: string;
  response: Response;
  timestamp: number;
  headers?: Headers;
}

// 默认配置
const DEFAULT_CONFIG: Partial<CacheConfig> = {
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  maxEntries: 100,
};

/**
 * 缓存策略类
 */
export class CacheStrategy {
  private cacheName: string;
  private maxAge: number;
  private maxEntries: number;
  private strategy: CacheStrategyType;

  constructor(config: CacheConfig) {
    this.cacheName = config.cacheName;
    this.maxAge = config.maxAge || DEFAULT_CONFIG.maxAge!;
    this.maxEntries = config.maxEntries || DEFAULT_CONFIG.maxEntries!;
    this.strategy = config.strategy;
  }

  /**
   * 获取缓存名称
   */
  public getCacheName(): string {
    return this.cacheName;
  }

  /**
   * 获取策略类型
   */
  public getStrategy(): CacheStrategyType {
    return this.strategy;
  }

  /**
   * 检查缓存是否过期
   */
  public isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age > this.maxAge;
  }

  /**
   * 获取缓存
   */
  public async get(request: Request): Promise<Response | null> {
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(request);
    
    if (response) {
      const timestamp = response.headers.get('sw-cache-time');
      if (timestamp) {
        const entry: CacheEntry = {
          url: request.url,
          response,
          timestamp: parseInt(timestamp, 10),
        };
        
        if (this.isExpired(entry)) {
          await cache.delete(request);
          return null;
        }
      }
      return response;
    }
    
    return null;
  }

  /**
   * 设置缓存
   */
  public async set(request: Request, response: Response): Promise<void> {
    const cache = await caches.open(this.cacheName);
    
    // 添加时间戳
    const headers = new Headers(response.headers);
    headers.set('sw-cache-time', Date.now().toString());
    headers.set('sw-cache-name', this.cacheName);
    
    const responseToCache = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    
    await cache.put(request, responseToCache);
    await this.trim();
  }

  /**
   * 删除缓存
   */
  public async delete(request: Request): Promise<boolean> {
    const cache = await caches.open(this.cacheName);
    return cache.delete(request);
  }

  /**
   * 清理过期和多余的缓存
   */
  public async trim(): Promise<void> {
    const cache = await caches.open(this.cacheName);
    const keys = await cache.keys();
    
    if (keys.length <= this.maxEntries) return;
    
    // 按时间排序，删除最旧的
    const sortedKeys: Array<{ request: Request; timestamp: number }> = [];
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const timestamp = response.headers.get('sw-cache-time');
        sortedKeys.push({
          request,
          timestamp: timestamp ? parseInt(timestamp, 10) : 0,
        });
      }
    }
    
    sortedKeys.sort((a, b) => a.timestamp - b.timestamp);
    
    const deleteCount = keys.length - this.maxEntries;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(sortedKeys[i].request);
    }
  }

  /**
   * 清除所有缓存
   */
  public async clear(): Promise<void> {
    await caches.delete(this.cacheName);
  }
}

/**
 * 缓存策略工厂
 */
export class CacheStrategyFactory {
  private static strategies: Map<string, CacheStrategy> = new Map();

  /**
   * 创建或获取策略
   */
  public static getStrategy(config: CacheConfig): CacheStrategy {
    const key = `${config.cacheName}-${config.strategy}`;
    
    if (!this.strategies.has(key)) {
      this.strategies.set(key, new CacheStrategy(config));
    }
    
    return this.strategies.get(key)!;
  }

  /**
   * 创建 Stale-While-Revalidate 策略
   */
  public static createStaleWhileRevalidate(cacheName: string): CacheStrategy {
    return this.getStrategy({
      cacheName,
      strategy: 'stale-while-revalidate',
      maxAge: 24 * 60 * 60 * 1000,
      maxEntries: 100,
    });
  }

  /**
   * 创建 Cache-First 策略
   */
  public static createCacheFirst(cacheName: string): CacheStrategy {
    return this.getStrategy({
      cacheName,
      strategy: 'cache-first',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      maxEntries: 50,
    });
  }

  /**
   * 创建 Network-First 策略
   */
  public static createNetworkFirst(cacheName: string): CacheStrategy {
    return this.getStrategy({
      cacheName,
      strategy: 'network-first',
      maxAge: 60 * 60 * 1000, // 1小时
      maxEntries: 100,
    });
  }

  /**
   * 创建 Network-Only 策略
   */
  public static createNetworkOnly(cacheName: string): CacheStrategy {
    return this.getStrategy({
      cacheName,
      strategy: 'network-only',
      maxAge: 0,
      maxEntries: 0,
    });
  }

  /**
   * 创建 Cache-Only 策略
   */
  public static createCacheOnly(cacheName: string): CacheStrategy {
    return this.getStrategy({
      cacheName,
      strategy: 'cache-only',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
      maxEntries: 200,
    });
  }

  /**
   * 获取所有策略
   */
  public static getAllStrategies(): CacheStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * 清除所有策略
   */
  public static clearAll(): void {
    this.strategies.clear();
  }
}

/**
 * SWR (Stale-While-Revalidate) 处理器
 */
export class StaleWhileRevalidateHandler {
  private strategy: CacheStrategy;

  constructor(cacheName: string) {
    this.strategy = CacheStrategyFactory.createStaleWhileRevalidate(cacheName);
  }

  /**
   * 处理请求
   */
  public async handle(request: Request): Promise<Response> {
    // 1. 先检查缓存
    const cachedResponse = await this.strategy.get(request);
    
    // 2. 同时发起网络请求
    const fetchPromise = this.fetchAndCache(request);
    
    // 3. 如果有缓存，立即返回；否则等待网络
    if (cachedResponse) {
      // 后台更新缓存，不阻塞响应
      fetchPromise.catch(() => {});
      return cachedResponse;
    }
    
    // 没有缓存，等待网络响应
    return fetchPromise;
  }

  /**
   * 获取并缓存
   */
  private async fetchAndCache(request: Request): Promise<Response> {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await this.strategy.set(request, networkResponse.clone());
    }
    
    return networkResponse;
  }
}

/**
 * Cache-First 处理器
 */
export class CacheFirstHandler {
  private strategy: CacheStrategy;

  constructor(cacheName: string) {
    this.strategy = CacheStrategyFactory.createCacheFirst(cacheName);
  }

  /**
   * 处理请求
   */
  public async handle(request: Request): Promise<Response> {
    // 1. 先检查缓存
    const cachedResponse = await this.strategy.get(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 2. 缓存不存在，尝试网络
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        await this.strategy.set(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // 3. 网络也失败，返回离线响应
      return new Response('离线内容', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
}

/**
 * Network-First 处理器
 */
export class NetworkFirstHandler {
  private strategy: CacheStrategy;

  constructor(cacheName: string) {
    this.strategy = CacheStrategyFactory.createNetworkFirst(cacheName);
  }

  /**
   * 处理请求
   */
  public async handle(request: Request): Promise<Response> {
    try {
      // 1. 优先尝试网络
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        await this.strategy.set(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // 2. 网络失败，尝试缓存
      const cachedResponse = await this.strategy.get(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 3. 都没有，返回离线响应
      return new Response('离线内容', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  }
}

// 导出快捷函数
export const createSWRHandler = (cacheName: string) => new StaleWhileRevalidateHandler(cacheName);
export const createCacheFirstHandler = (cacheName: string) => new CacheFirstHandler(cacheName);
export const createNetworkFirstHandler = (cacheName: string) => new NetworkFirstHandler(cacheName);
