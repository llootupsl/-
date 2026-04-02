/**
 * Service Worker 模块导出
 */

export { swManager, ServiceWorkerManager } from './ServiceWorkerManager';
export type { SWState, SWUpdateInfo, SWMessageHandler, SWMessageType } from './ServiceWorkerManager';

export { backgroundSync, BackgroundSync } from './BackgroundSync';
export type { SyncOperation, SyncConfig } from './BackgroundSync';

export { 
  CacheStrategy, 
  CacheStrategyFactory,
  StaleWhileRevalidateHandler,
  CacheFirstHandler,
  NetworkFirstHandler,
  createSWRHandler,
  createCacheFirstHandler,
  createNetworkFirstHandler,
} from './CacheStrategy';
export type { CacheStrategyType, CacheConfig, CacheEntry } from './CacheStrategy';
