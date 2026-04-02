/**
 * =============================================================================
 * 内存泄漏检测测试
 * Memory Leak Detection Tests
 * =============================================================================
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventCleanupManager } from '../../../src/core/EventCleanupManager';
import { MemoryMonitor } from '../../../src/core/MemoryMonitor';

describe('Memory Leak Detection', () => {
  let eventCleanupManager: EventCleanupManager;
  let memoryMonitor: MemoryMonitor;

  beforeEach(() => {
    eventCleanupManager = EventCleanupManager.getInstance();
    memoryMonitor = MemoryMonitor.getInstance();
  });

  afterEach(() => {
    eventCleanupManager.cleanupAll();
  });

  describe('EventCleanupManager', () => {
    it('should track registered event listeners', () => {
      const target = new EventTarget();
      const handler = vi.fn();
      
      const unregister = eventCleanupManager.register(target, 'test', handler);
      
      expect(eventCleanupManager.getListenerCount()).toBe(1);
      expect(eventCleanupManager.getListenersByEvent('test')).toBe(1);
      
      unregister();
      
      expect(eventCleanupManager.getListenerCount()).toBe(0);
    });

    it('should cleanup all listeners', () => {
      const target1 = new EventTarget();
      const target2 = new EventTarget();
      const handler = vi.fn();
      
      eventCleanupManager.register(target1, 'event1', handler);
      eventCleanupManager.register(target2, 'event2', handler);
      
      expect(eventCleanupManager.getListenerCount()).toBe(2);
      
      const cleanedCount = eventCleanupManager.cleanupAll();
      
      expect(cleanedCount).toBe(2);
      expect(eventCleanupManager.getListenerCount()).toBe(0);
    });

    it('should cleanup by target', () => {
      const target1 = new EventTarget();
      const target2 = new EventTarget();
      const handler = vi.fn();
      
      eventCleanupManager.register(target1, 'event1', handler);
      eventCleanupManager.register(target1, 'event2', handler);
      eventCleanupManager.register(target2, 'event3', handler);
      
      expect(eventCleanupManager.getListenerCount()).toBe(3);
      
      const cleanedCount = eventCleanupManager.cleanupByTarget(target1);
      
      expect(cleanedCount).toBe(2);
      expect(eventCleanupManager.getListenerCount()).toBe(1);
    });

    it('should cleanup by event type', () => {
      const target1 = new EventTarget();
      const target2 = new EventTarget();
      const handler = vi.fn();
      
      eventCleanupManager.register(target1, 'click', handler);
      eventCleanupManager.register(target2, 'click', handler);
      eventCleanupManager.register(target1, 'keydown', handler);
      
      expect(eventCleanupManager.getListenerCount()).toBe(3);
      
      const cleanedCount = eventCleanupManager.cleanupByEvent('click');
      
      expect(cleanedCount).toBe(2);
      expect(eventCleanupManager.getListenerCount()).toBe(1);
    });
  });

  describe('MemoryMonitor', () => {
    it('should include event listener count in memory usage', () => {
      const target = new EventTarget();
      const handler = vi.fn();
      
      eventCleanupManager.register(target, 'test', handler);
      
      const usage = memoryMonitor.getMemoryUsage();
      
      if (usage) {
        expect(usage.eventListenerCount).toBeGreaterThanOrEqual(1);
      }
      
      eventCleanupManager.cleanupAll();
    });

    it('should detect memory pressure levels', () => {
      const info = memoryMonitor.checkMemoryPressure();
      
      expect(['low', 'moderate', 'high', 'critical']).toContain(info.level);
      expect(info.usagePercent).toBeGreaterThanOrEqual(0);
      expect(info.usagePercent).toBeLessThanOrEqual(100);
    });

    it('should track memory trend', () => {
      const trend = memoryMonitor.getMemoryTrend();
      
      expect(['increasing', 'stable', 'decreasing']).toContain(trend);
    });
  });

  describe('React Hooks Memory Leak Prevention', () => {
    it('should demonstrate proper cleanup pattern', () => {
      const cleanupFns: (() => void)[] = [];
      
      const mockUseEffect = (cleanup: () => void) => {
        cleanupFns.push(cleanup);
      };
      
      const target = new EventTarget();
      const handler = vi.fn();
      
      const unregister = eventCleanupManager.register(target, 'test', handler);
      mockUseEffect(unregister);
      
      expect(eventCleanupManager.getListenerCount()).toBe(1);
      
      cleanupFns.forEach(fn => fn());
      
      expect(eventCleanupManager.getListenerCount()).toBe(0);
    });
  });

  describe('Performance Impact', () => {
    it('should handle large number of listeners efficiently', () => {
      const targets: EventTarget[] = [];
      const handlers: (() => void)[] = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const target = new EventTarget();
        targets.push(target);
        const handler = vi.fn();
        const unregister = eventCleanupManager.register(target, `event-${i}`, handler);
        handlers.push(unregister);
      }
      
      const registerTime = performance.now() - startTime;
      
      expect(eventCleanupManager.getListenerCount()).toBe(1000);
      expect(registerTime).toBeLessThan(100);
      
      const cleanupStart = performance.now();
      eventCleanupManager.cleanupAll();
      const cleanupTime = performance.now() - cleanupStart;
      
      expect(eventCleanupManager.getListenerCount()).toBe(0);
      expect(cleanupTime).toBeLessThan(50);
    });
  });
});
