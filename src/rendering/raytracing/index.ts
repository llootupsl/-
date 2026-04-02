/**
 * =============================================================================
 * 永夜熵纪 - 光线追踪模块导出
 * Ray Tracing Module Exports
 * =============================================================================
 */

export { SVOBuilder } from './SVOBuilder';
export type { Voxel, SVONode, SVOBuildOptions } from './SVOBuilder';

export { GlobalIlluminationManager } from './GlobalIlluminationManager';
export type { GIConfig } from './GlobalIlluminationManager';

export { raytracingShaders } from './shaders/rt-svo.wgsl';
