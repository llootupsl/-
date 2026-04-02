/**
 * =============================================================================
 * APEX 核心导出
 * 极致系统统一导出
 * =============================================================================
 */

// 导出核心系统
export * from './OMNISCore';
export * from './ApexRenderer';
export * from './ApexExtreme';
export * from './ApexUI';
export * from './ApexAPIs';
export * from './ApexShaders';

// 导出集成模块
export { SystemIntegrator, systemIntegrator } from './SystemIntegrator';
export type { IntegratorEvents, IntegratorConfig } from './SystemIntegrator';

// 导出经济系统绑定器
export { EconomicSystemBinder, economicSystemBinder } from './economy/EconomicSystemBinder';
export type { EconomicBinderEvents } from './economy/EconomicSystemBinder';

// 导出GNN结果应用器
export { GNNResultApplicator, gnnResultApplicator } from './gnn/GNNResultApplicator';
export type { CitizenState, GNNApplicatorEvents } from './gnn/GNNResultApplicator';

// 导出内存管理系统
export { EventCleanupManager, eventCleanupManager } from './EventCleanupManager';
export type { EventListenerEntry, EventCleanupStats } from './EventCleanupManager';

export { MemoryMonitor, createMemoryMonitor } from './MemoryMonitor';
export type {
  MemorySnapshot,
  MemoryLeakWarning,
  MemoryMonitorConfig,
} from './MemoryMonitor';

export { ResourcePool, ObjectPool, ArrayPool } from './ResourcePool';
export type { PoolableResource, ResourcePoolConfig, ResourcePoolStats } from './ResourcePool';
