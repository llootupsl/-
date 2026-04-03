/**
 * =============================================================================
 * 事件发射器 - 轻量级事件系统
 * =============================================================================
 */

type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventListener[]> = new Map();
  private onceEvents: Map<string, EventListener[]> = new Map();

  on(event: string, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  once(event: string, listener: EventListener): this {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }
    this.onceEvents.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener: EventListener): this {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  removeListener(event: string, listener: EventListener): this {
    return this.off(event, listener);
  }

  emit(event: string, ...args: any[]): boolean {
    // 一次性监听器
    const onceListeners = this.onceEvents.get(event);
    if (onceListeners && onceListeners.length > 0) {
      onceListeners.forEach(listener => listener(...args));
      this.onceEvents.delete(event);
    }

    // 持久监听器
    const listeners = this.events.get(event);
    if (listeners && listeners.length > 0) {
      listeners.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
      this.onceEvents.delete(event);
    } else {
      this.events.clear();
      this.onceEvents.clear();
    }
    return this;
  }

  listenerCount(event: string): number {
    return (this.events.get(event)?.length || 0) + (this.onceEvents.get(event)?.length || 0);
  }
}

export default EventEmitter;
