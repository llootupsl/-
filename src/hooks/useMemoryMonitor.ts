/**
 * =============================================================================
 * 内存监控 Hooks - React 集成
 * Memory Monitor Hooks - React Integration
 * =============================================================================
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { logger } from '@/core/utils/Logger';
import { eventCleanupManager } from '@/core/EventCleanupManager';
import { MemoryMonitor, type MemorySnapshot, type MemoryLeakWarning } from '@/core/MemoryMonitor';

export interface UseMemoryMonitorOptions {
  enableAutoStart?: boolean;
  sampleInterval?: number;
  onWarning?: (warning: MemoryLeakWarning) => void;
}

export interface MemoryMonitorState {
  isMonitoring: boolean;
  currentSnapshot: MemorySnapshot | null;
  warnings: MemoryLeakWarning[];
  listenerCount: number;
}

export function useMemoryMonitor(options: UseMemoryMonitorOptions = {}) {
  const { enableAutoStart = true, sampleInterval = 5000, onWarning } = options;

  const monitorRef = useRef<MemoryMonitor | null>(null);
  const [state, setState] = useState<MemoryMonitorState>({
    isMonitoring: false,
    currentSnapshot: null,
    warnings: [],
    listenerCount: 0,
  });

  useEffect(() => {
    monitorRef.current = new MemoryMonitor(
      {
        sampleInterval,
        enableAutoWarning: true,
      },
      () => eventCleanupManager.getListenerCount()
    );

    if (onWarning) {
      monitorRef.current.onWarning(onWarning);
    }

    if (enableAutoStart) {
      monitorRef.current.start();
      setState(prev => ({ ...prev, isMonitoring: true }));
    }

    const updateInterval = setInterval(() => {
      const listenerCount = eventCleanupManager.getListenerCount();
      const snapshots = monitorRef.current?.getSnapshots() || [];
      const currentSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
      const warnings = monitorRef.current?.getWarnings() || [];

      setState(prev => ({
        ...prev,
        listenerCount,
        currentSnapshot,
        warnings,
      }));
    }, sampleInterval);

    return () => {
      clearInterval(updateInterval);
      monitorRef.current?.destroy();
      monitorRef.current = null;
    };
  }, [enableAutoStart, sampleInterval, onWarning]);

  const start = useCallback(() => {
    if (monitorRef.current && !state.isMonitoring) {
      monitorRef.current.start();
      setState(prev => ({ ...prev, isMonitoring: true }));
    }
  }, [state.isMonitoring]);

  const stop = useCallback(() => {
    if (monitorRef.current && state.isMonitoring) {
      monitorRef.current.stop();
      setState(prev => ({ ...prev, isMonitoring: false }));
    }
  }, [state.isMonitoring]);

  const takeSnapshot = useCallback(() => {
    if (monitorRef.current) {
      const snapshot = monitorRef.current.takeSnapshot();
      setState(prev => ({
        ...prev,
        currentSnapshot: snapshot,
        listenerCount: eventCleanupManager.getListenerCount(),
      }));
      return snapshot;
    }
    return null;
  }, []);

  const getReport = useCallback(() => {
    return monitorRef.current?.getReport() || null;
  }, []);

  const printReport = useCallback(() => {
    monitorRef.current?.printReport();
  }, []);

  const clearWarnings = useCallback(() => {
    monitorRef.current?.clearWarnings();
    setState(prev => ({ ...prev, warnings: [] }));
  }, []);

  return {
    ...state,
    start,
    stop,
    takeSnapshot,
    getReport,
    printReport,
    clearWarnings,
  };
}

export function useCleanupVerification(componentName: string) {
  const listenerCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    listenerCountRef.current = eventCleanupManager.getListenerCount();
    logger.debug(componentName, `Mounted. Current listeners: ${listenerCountRef.current}`);

    return () => {
      isMountedRef.current = false;
      const currentCount = eventCleanupManager.getListenerCount();
      const leakedListeners = currentCount - listenerCountRef.current;

      if (leakedListeners > 0) {
        logger.warn(
          componentName,
          `Potential memory leak detected! Listeners increased by ${leakedListeners} during component lifecycle. Before: ${listenerCountRef.current}, After: ${currentCount}`
        );
      } else {
        logger.debug(
          componentName,
          `Unmounted cleanly. Listeners: ${listenerCountRef.current} -> ${currentCount}`
        );
      }
    };
  }, [componentName]);

  const trackListener = useCallback(<T extends EventTarget>(
    target: T,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    return eventCleanupManager.register(target, event, handler, options);
  }, []);

  return {
    trackListener,
    getListenerCount: () => eventCleanupManager.getListenerCount(),
  };
}

export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (ev: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void;

export function useEventListener(
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void;

export function useEventListener(
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): void {
  useEffect(() => {
    const cleanup = eventCleanupManager.register(window, event, handler, options);
    return cleanup;
  }, [event, handler, options]);
}

export default useMemoryMonitor;
