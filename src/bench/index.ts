/**
 * 性能基准测试模块 - 索引文件
 */

// 核心基准测试套件
export {
  BenchmarkSuite,
  FPSCounter,
  MemoryCounter,
  getDeviceInfo,
  calculatePercentileScore,
} from './BenchmarkSuite';
export type {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkReport,
  DeviceInfo,
  StressTestResult,
} from './BenchmarkSuite';

// CPU 基准测试
export { CPUBenchmark, MemoryBenchmark } from './CPUBenchmark';
export type { CPUBenchmarkResult } from './CPUBenchmark';

// GPU 基准测试
export { GPUBenchmark } from './GPUBenchmark';
export type { GPUBenchmarkResult } from './GPUBenchmark';

// 存储基准测试
export { StorageBenchmark } from './StorageBenchmark';
export type { StorageBenchmarkResult } from './StorageBenchmark';

// 内存基准测试
export { MemoryBenchmark as BenchMemoryBenchmark } from './MemoryBenchmark';
export type { MemoryBenchmarkResult } from './MemoryBenchmark';

// UI 组件
export { BenchmarkPanel } from './BenchmarkPanel';
