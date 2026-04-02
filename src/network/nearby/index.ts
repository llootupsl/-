/**
 * =============================================================================
 * 近场通讯模块导出
 * =============================================================================
 */

export { SpacetimeRift, default as SpacetimeRiftDefault } from './SpacetimeRift';
export type { RiftState, NearbyDevice, DeviceType, SpacetimeRiftConfig } from './SpacetimeRift';

export { ProximitySync, default as ProximitySyncDefault } from './ProximitySync';
export type { SyncPacket, ProximitySyncConfig, SyncConflict, ProximitySyncCallbacks, SyncStats } from './ProximitySync';

export { NearbyPanel, default as NearbyPanelDefault } from './NearbyPanel';
export type { NearbyPanelMode, NearbyDeviceUI, NearbyPanelProps } from './NearbyPanel';
