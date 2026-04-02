/**
 * =============================================================================
 * 事件清理管理器 - 统一管理所有事件监听器的注册和清理
 * =============================================================================
 * 
 * 功能：
 * - 集中管理所有事件监听器的生命周期
 * - 支持批量清理和按目标清理
 * - 防止内存泄漏
 */

import { logger } from './utils/Logger';

export interface EventListenerEntry {
  target: EventTarget;
  event: string;
  handler: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
}

export interface EventCleanupStats {
  totalListeners: number;
  listenersByTarget: Map<EventTarget, number>;
  listenersByEvent: Map<string, number>;
}

export class EventCleanupManager {
  private listeners: Set<EventListenerEntry> = new Set();
  private targetMap: Map<EventTarget, Set<EventListenerEntry>> = new Map();
  private eventMap: Map<string, Set<EventListenerEntry>> = new Map();

  private static instance: EventCleanupManager | null = null;

  private constructor() {}

  public static getInstance(): EventCleanupManager {
    if (!EventCleanupManager.instance) {
      EventCleanupManager.instance = new EventCleanupManager();
    }
    return EventCleanupManager.instance;
  }

  register(
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    const entry: EventListenerEntry = {
      target,
      event,
      handler,
      options,
    };

    target.addEventListener(event, handler, options);

    this.listeners.add(entry);

    if (!this.targetMap.has(target)) {
      this.targetMap.set(target, new Set());
    }
    this.targetMap.get(target)!.add(entry);

    if (!this.eventMap.has(event)) {
      this.eventMap.set(event, new Set());
    }
    this.eventMap.get(event)!.add(entry);

    return () => this.unregister(target, event, handler);
  }

  unregister(
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject
  ): boolean {
    let found = false;

    for (const entry of this.listeners) {
      if (
        entry.target === target &&
        entry.event === event &&
        entry.handler === handler
      ) {
        target.removeEventListener(event, handler, entry.options);
        this.listeners.delete(entry);
        this.targetMap.get(target)?.delete(entry);
        this.eventMap.get(event)?.delete(entry);
        found = true;
        break;
      }
    }

    return found;
  }

  cleanupAll(): number {
    let count = 0;

    for (const entry of this.listeners) {
      entry.target.removeEventListener(entry.event, entry.handler, entry.options);
      count++;
    }

    this.listeners.clear();
    this.targetMap.clear();
    this.eventMap.clear();

    console.log(`[EventCleanupManager] Cleaned up ${count} listeners`);
    return count;
  }

  cleanupByTarget(target: EventTarget): number {
    const entries = this.targetMap.get(target);
    if (!entries) return 0;

    let count = 0;
    for (const entry of entries) {
      entry.target.removeEventListener(entry.event, entry.handler, entry.options);
      this.listeners.delete(entry);
      this.eventMap.get(entry.event)?.delete(entry);
      count++;
    }

    this.targetMap.delete(target);
    console.log(`[EventCleanupManager] Cleaned up ${count} listeners for target`);
    return count;
  }

  cleanupByEvent(event: string): number {
    const entries = this.eventMap.get(event);
    if (!entries) return 0;

    let count = 0;
    for (const entry of entries) {
      entry.target.removeEventListener(entry.event, entry.handler, entry.options);
      this.listeners.delete(entry);
      this.targetMap.get(entry.target)?.delete(entry);
      count++;
    }

    this.eventMap.delete(event);
    logger.debug('EventCleanupManager', `Cleaned up ${count} listeners for event: ${event}`);
    return count;
  }

  getStats(): EventCleanupStats {
    const listenersByTarget = new Map<EventTarget, number>();
    const listenersByEvent = new Map<string, number>();

    for (const [target, entries] of this.targetMap) {
      listenersByTarget.set(target, entries.size);
    }

    for (const [event, entries] of this.eventMap) {
      listenersByEvent.set(event, entries.size);
    }

    return {
      totalListeners: this.listeners.size,
      listenersByTarget,
      listenersByEvent,
    };
  }

  getListenerCount(): number {
    return this.listeners.size;
  }

  getListenersByTarget(target: EventTarget): number {
    return this.targetMap.get(target)?.size || 0;
  }

  getListenersByEvent(event: string): number {
    return this.eventMap.get(event)?.size || 0;
  }

  hasListener(
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject
  ): boolean {
    for (const entry of this.listeners) {
      if (
        entry.target === target &&
        entry.event === event &&
        entry.handler === handler
      ) {
        return true;
      }
    }
    return false;
  }

  destroy(): void {
    this.cleanupAll();
    EventCleanupManager.instance = null;
    logger.info('EventCleanupManager', 'Destroyed');
  }
}

export const eventCleanupManager = EventCleanupManager.getInstance();
export default EventCleanupManager;
