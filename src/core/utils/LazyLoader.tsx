import React from 'react';
import { logger } from '@/core/utils/Logger';

export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

export interface LazyLoadResult {
  isIntersecting: boolean;
  hasIntersected: boolean;
  entry: IntersectionObserverEntry | null;
}

export type LazyLoadCallback = (result: LazyLoadResult) => void;

export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private callbacks: Map<Element, LazyLoadCallback> = new Map();
  private intersected: Set<Element> = new Set();
  private options: LazyLoadOptions;

  constructor(options: LazyLoadOptions = {}) {
    this.options = {
      rootMargin: options.rootMargin || '100px',
      threshold: options.threshold || 0.1,
      triggerOnce: options.triggerOnce ?? true,
    };

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        this.handleIntersection,
        {
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold,
        }
      );
    }
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    for (const entry of entries) {
      const callback = this.callbacks.get(entry.target);
      if (!callback) continue;

      const hasIntersected = this.intersected.has(entry.target);
      const isIntersecting = entry.isIntersecting;

      if (isIntersecting) {
        this.intersected.add(entry.target);
      }

      callback({
        isIntersecting,
        hasIntersected,
        entry,
      });

      if (this.options.triggerOnce && isIntersecting) {
        this.unobserve(entry.target);
      }
    }
  };

  observe(element: Element, callback: LazyLoadCallback): () => void {
    if (!this.observer) {
      callback({
        isIntersecting: true,
        hasIntersected: true,
        entry: null,
      });
      return () => {};
    }

    this.callbacks.set(element, callback);
    this.observer.observe(element);

    return () => this.unobserve(element);
  }

  unobserve(element: Element): void {
    if (!this.observer) return;

    this.observer.unobserve(element);
    this.callbacks.delete(element);
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.callbacks.clear();
    this.intersected.clear();
  }
}

export class LazyDataLoader<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private loading: Map<string, Promise<T>> = new Map();
  private loader: (key: string) => Promise<T>;
  private maxCacheSize: number;
  private cacheTTL: number;
  private prefetchQueue: string[] = [];
  private prefetching: boolean = false;

  constructor(
    loader: (key: string) => Promise<T>,
    options: { maxCacheSize?: number; cacheTTL?: number } = {}
  ) {
    this.loader = loader;
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000;
  }

  async load(key: string): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const loading = this.loading.get(key);
    if (loading) {
      return loading;
    }

    const promise = this.loader(key);
    this.loading.set(key, promise);

    try {
      const data = await promise;
      this.cache.set(key, { data, timestamp: Date.now() });
      this.evictIfNeeded();
      return data;
    } finally {
      this.loading.delete(key);
    }
  }

  async loadMany(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    await Promise.all(
      keys.map(async (key) => {
        const data = await this.load(key);
        results.set(key, data);
      })
    );
    return results;
  }

  prefetch(keys: string[]): void {
    for (const key of keys) {
      if (!this.cache.has(key) && !this.loading.has(key) && !this.prefetchQueue.includes(key)) {
        this.prefetchQueue.push(key);
      }
    }
    this.processPrefetchQueue();
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.prefetching || this.prefetchQueue.length === 0) return;

    this.prefetching = true;

    while (this.prefetchQueue.length > 0) {
      const key = this.prefetchQueue.shift();
      if (key && !this.cache.has(key) && !this.loading.has(key)) {
        try {
          await this.load(key);
        } catch (error) {
          logger.warn('LazyDataLoader', `Prefetch failed for ${key}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    this.prefetching = false;
  }

  private evictIfNeeded(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toEvict = entries.slice(0, entries.length - this.maxCacheSize);
    for (const [key] of toEvict) {
      this.cache.delete(key);
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTTL;
  }

  isLoading(key: string): boolean {
    return this.loading.has(key);
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getStats(): {
    cacheSize: number;
    loadingCount: number;
    prefetchQueueLength: number;
  } {
    return {
      cacheSize: this.cache.size,
      loadingCount: this.loading.size,
      prefetchQueueLength: this.prefetchQueue.length,
    };
  }
}

export class LazyComponentLoader {
  private loadedComponents: Map<string, React.LazyExoticComponent<React.ComponentType<any>>> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  private loaders: Map<string, () => Promise<{ default: React.ComponentType<any> }>> = new Map();

  register(name: string, loader: () => Promise<{ default: React.ComponentType<any> }>): void {
    this.loaders.set(name, loader);
  }

  get(name: string): React.LazyExoticComponent<React.ComponentType<any>> | null {
    const existing = this.loadedComponents.get(name);
    if (existing) return existing;

    const loader = this.loaders.get(name);
    if (!loader) return null;

    const lazyComponent = React.lazy(loader);
    this.loadedComponents.set(name, lazyComponent);
    return lazyComponent;
  }

  preload(name: string): Promise<void> {
    const existing = this.loadingPromises.get(name);
    if (existing) return existing;

    const loader = this.loaders.get(name);
    if (!loader) return Promise.reject(new Error(`Component "${name}" not registered`));

    const promise = loader().then(() => {});
    this.loadingPromises.set(name, promise);
    return promise;
  }

  preloadMany(names: string[]): Promise<void[]> {
    return Promise.all(names.map((name) => this.preload(name)));
  }

  isLoaded(name: string): boolean {
    return this.loadedComponents.has(name);
  }

  isLoading(name: string): boolean {
    return this.loadingPromises.has(name);
  }

  clear(): void {
    this.loadedComponents.clear();
    this.loadingPromises.clear();
  }
}

export class VirtualListManager<T> {
  private items: T[] = [];
  private itemHeight: number;
  private containerHeight: number = 0;
  private scrollTop: number = 0;
  private overscan: number;
  private renderItem: (item: T, index: number) => React.ReactNode;

  constructor(
    options: {
      itemHeight: number;
      overscan?: number;
      renderItem: (item: T, index: number) => React.ReactNode;
    }
  ) {
    this.itemHeight = options.itemHeight;
    this.overscan = options.overscan || 3;
    this.renderItem = options.renderItem;
  }

  setItems(items: T[]): void {
    this.items = items;
  }

  setContainerHeight(height: number): void {
    this.containerHeight = height;
  }

  setScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  getVisibleRange(): { start: number; end: number } {
    const start = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const end = Math.min(this.items.length, start + visibleCount + this.overscan * 2);
    return { start, end };
  }

  getVisibleItems(): Array<{ item: T; index: number; style: React.CSSProperties }> {
    const { start, end } = this.getVisibleRange();
    const result: Array<{ item: T; index: number; style: React.CSSProperties }> = [];

    for (let i = start; i < end; i++) {
      const item = this.items[i];
      if (!item) continue;

      result.push({
        item,
        index: i,
        style: {
          position: 'absolute',
          top: i * this.itemHeight,
          height: this.itemHeight,
          width: '100%',
        },
      });
    }

    return result;
  }

  getTotalHeight(): number {
    return this.items.length * this.itemHeight;
  }

  render(): React.ReactNode[] {
    return this.getVisibleItems().map(({ item, index, style }) => (
      <div key={index} style={style}>
        {this.renderItem(item, index)}
      </div>
    ));
  }
}

export const lazyLoader = new LazyLoader();

export default {
  LazyLoader,
  LazyDataLoader,
  LazyComponentLoader,
  VirtualListManager,
  lazyLoader,
};
