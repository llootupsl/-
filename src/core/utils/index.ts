/**
 * =============================================================================
 * 核心工具导出
 * =============================================================================
 */

export * from './ThrottleDebounce';
export * from './RenderOptimizer';
export * from './LazyLoader';
export * from './Logger';

import { throttle, debounce, rafThrottle, BatchProcessor } from './ThrottleDebounce';
import { RenderOptimizer, LazyRenderer, renderOptimizer } from './RenderOptimizer';
import { 
  LazyLoader, 
  LazyDataLoader, 
  LazyComponentLoader, 
  VirtualListManager,
  lazyLoader 
} from './LazyLoader';
import { Logger, logger } from './Logger';

export const performanceUtils = {
  throttle,
  debounce,
  rafThrottle,
  BatchProcessor,
  RenderOptimizer,
  LazyRenderer,
  renderOptimizer,
  LazyLoader,
  LazyDataLoader,
  LazyComponentLoader,
  VirtualListManager,
  lazyLoader,
  Logger,
  logger,
};

export default performanceUtils;
