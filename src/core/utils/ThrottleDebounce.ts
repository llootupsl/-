/**
 * =============================================================================
 * 防抖与节流工具
 * =============================================================================
 */

import { logger } from '@/core/utils/Logger';

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
  pending(): boolean;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
  pending(): boolean;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let lastCallTime = 0;
  let result: ReturnType<T> | undefined;

  const { leading = true, trailing = true } = options;

  const invokeFunc = (time: number): ReturnType<T> | undefined => {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastCallTime = time;

    if (args) {
      result = func.apply(thisArg, args);
    }
    return result;
  };

  const startTimer = (pendingFunc: () => void, waitTime: number) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(pendingFunc, waitTime);
  };

  const remainingWait = (time: number): number => {
    const timeSinceLastCall = time - lastCallTime;
    return wait - timeSinceLastCall;
  };

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - lastCallTime;
    return lastCallTime === 0 || timeSinceLastCall >= wait;
  };

  const trailingEdge = (time: number): ReturnType<T> | undefined => {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  };

  const timerExpired = () => {
    const currentTime = Date.now();
    if (shouldInvoke(currentTime)) {
      return trailingEdge(currentTime);
    }
    startTimer(timerExpired, remainingWait(currentTime));
  };

  const leadingEdge = (time: number): ReturnType<T> | undefined => {
    timeoutId = null;
    lastCallTime = time;
    if (leading) {
      return invokeFunc(time);
    }
    return result;
  };

  const debounced = (...args: Parameters<T>): ReturnType<T> | undefined => {
    const currentTime = Date.now();
    const isInvoking = shouldInvoke(currentTime);

    lastArgs = args;
    lastThis = this;

    if (isInvoking) {
      if (!timeoutId) {
        return leadingEdge(currentTime);
      }
      lastCallTime = currentTime;
      startTimer(timerExpired, wait);
      return result;
    }

    if (!timeoutId) {
      startTimer(timerExpired, remainingWait(currentTime));
    }
    return result;
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  };

  const flush = (): ReturnType<T> | undefined => {
    return timeoutId ? trailingEdge(Date.now()) : result;
  };

  const pending = (): boolean => {
    return timeoutId !== null;
  };

  (debounced as ThrottledFunction<T>).cancel = cancel;
  (debounced as ThrottledFunction<T>).flush = flush;
  (debounced as ThrottledFunction<T>).pending = pending;

  return debounced as ThrottledFunction<T>;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T> | undefined;
  let lastCallTime = 0;
  let lastInvokeTime = 0;

  const { leading = false, trailing = true, maxWait } = options;

  const invokeFunc = (time: number): ReturnType<T> | undefined => {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;

    if (args) {
      result = func.apply(thisArg, args);
    }
    return result;
  };

  const startTimer = (pendingFunc: () => void, waitTime: number) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(pendingFunc, waitTime);
  };

  const remainingWait = (time: number): number => {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= wait ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const trailingEdge = (time: number): ReturnType<T> | undefined => {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  };

  const timerExpired = () => {
    const currentTime = Date.now();
    if (shouldInvoke(currentTime)) {
      return trailingEdge(currentTime);
    }
    startTimer(timerExpired, remainingWait(currentTime));
  };

  const leadingEdge = (time: number): ReturnType<T> | undefined => {
    timeoutId = null;
    lastInvokeTime = time;
    if (leading) {
      result = invokeFunc(time);
    }
    startTimer(timerExpired, wait);
    return result;
  };

  const debounced = (...args: Parameters<T>): ReturnType<T> | undefined => {
    const currentTime = Date.now();
    const isInvoking = shouldInvoke(currentTime);

    lastArgs = args;
    lastThis = this;
    lastCallTime = currentTime;

    if (isInvoking) {
      if (!timeoutId) {
        return leadingEdge(currentTime);
      }
      if (maxWait !== undefined) {
        startTimer(timerExpired, remainingWait(currentTime));
      }
    }
    if (!timeoutId) {
      startTimer(timerExpired, wait);
    }
    return result;
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = null;
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
    lastInvokeTime = 0;
  };

  const flush = (): ReturnType<T> | undefined => {
    return timeoutId ? trailingEdge(Date.now()) : result;
  };

  const pending = (): boolean => {
    return timeoutId !== null;
  };

  (debounced as DebouncedFunction<T>).cancel = cancel;
  (debounced as DebouncedFunction<T>).flush = flush;
  (debounced as DebouncedFunction<T>).pending = pending;

  return debounced as DebouncedFunction<T>;
}

export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): ThrottledFunction<T> {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T> | undefined;

  const throttled = (...args: Parameters<T>): ReturnType<T> | undefined => {
    lastArgs = args;
    lastThis = this;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          result = func.apply(lastThis, lastArgs);
        }
      });
    }
    return result;
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  const flush = (): ReturnType<T> | undefined => {
    cancel();
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
    }
    return result;
  };

  const pending = (): boolean => {
    return rafId !== null;
  };

  (throttled as ThrottledFunction<T>).cancel = cancel;
  (throttled as ThrottledFunction<T>).flush = flush;
  (throttled as ThrottledFunction<T>).pending = pending;

  return throttled as ThrottledFunction<T>;
}

export class BatchProcessor<T> {
  private queue: T[] = [];
  private processing = false;
  private rafId: number | null = null;
  private batchSize: number;
  private processor: (items: T[]) => void;

  constructor(processor: (items: T[]) => void, batchSize: number = 100) {
    this.processor = processor;
    this.batchSize = batchSize;
  }

  add(item: T): void {
    this.queue.push(item);
    this.scheduleProcess();
  }

  addMany(items: T[]): void {
    this.queue.push(...items);
    this.scheduleProcess();
  }

  private scheduleProcess(): void {
    if (this.processing || this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.process();
    });
  }

  private process(): void {
    if (this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      this.processor(batch);
    } catch (error) {
      logger.error('BatchProcessor', 'Error processing batch', error instanceof Error ? error : new Error(String(error)));
    }

    this.processing = false;

    if (this.queue.length > 0) {
      this.scheduleProcess();
    }
  }

  flush(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      this.processor(batch);
    }
  }

  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.queue = [];
    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

export default {
  throttle,
  debounce,
  rafThrottle,
  BatchProcessor,
};
