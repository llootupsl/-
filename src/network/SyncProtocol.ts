/**
 * =============================================================================
 * 永夜熵纪 - 同步协议
 * Synchronization Protocol for P2P State Sync
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';

/** 同步状态 */
export interface SyncState {
  version: number;
  timestamp: number;
  checksum: string;
}

/** 增量更新 */
export interface DeltaUpdate {
  version: number;
  baseVersion: number;
  changes: Change[];
}

/** 变更操作 */
export interface Change {
  type: 'set' | 'delete' | 'insert' | 'update';
  path: string;
  value?: unknown;
  oldValue?: unknown;
  timestamp: number;
}

/** 同步事件 */
export interface SyncEvents {
  /** 状态更新 */
  stateUpdate: (state: SyncState) => void;
  /** 增量接收 */
  deltaReceived: (delta: DeltaUpdate) => void;
  /** 冲突检测 */
  conflict: (changes: Change[]) => void;
  /** 同步完成 */
  syncComplete: () => void;
}

/**
 * 同步协议管理器
 */
export class SyncProtocol extends EventEmitter<SyncEvents> {
  private localState: Map<string, unknown> = new Map();
  private localVersion: number = 0;
  private pendingChanges: Change[] = [];
  private changeLog: Map<number, Change[]> = new Map();
  
  // 冲突解决策略
  private conflictResolver: 'last-write-wins' | 'merge' = 'last-write-wins';
  
  // 压缩阈值
  private compressionThreshold: number = 100;

  constructor() {
    super();
  }

  /**
   * 设置值
   */
  public set(path: string, value: unknown): void {
    const oldValue = this.localState.get(path);
    
    const change: Change = {
      type: 'set',
      path,
      value,
      oldValue,
      timestamp: Date.now(),
    };

    this.localState.set(path, value);
    this.pendingChanges.push(change);
    this.localVersion++;

    this.changeLog.set(this.localVersion, [change]);
  }

  /**
   * 获取值
   */
  public get(path: string): unknown {
    return this.localState.get(path);
  }

  /**
   * 删除值
   */
  public delete(path: string): void {
    if (!this.localState.has(path)) return;

    const oldValue = this.localState.get(path);
    
    const change: Change = {
      type: 'delete',
      path,
      oldValue,
      timestamp: Date.now(),
    };

    this.localState.delete(path);
    this.pendingChanges.push(change);
    this.localVersion++;

    this.changeLog.set(this.localVersion, [change]);
  }

  /**
   * 获取当前状态
   */
  public getState(): SyncState {
    return {
      version: this.localVersion,
      timestamp: Date.now(),
      checksum: this.computeChecksum(),
    };
  }

  /**
   * 获取完整状态
   */
  public getFullState(): { version: number; state: Record<string, unknown> } {
    return {
      version: this.localVersion,
      state: Object.fromEntries(this.localState),
    };
  }

  /**
   * 创建增量更新
   */
  public createDelta(baseVersion: number): DeltaUpdate | null {
    if (baseVersion >= this.localVersion) {
      return null;
    }

    // 收集所有变更
    const changes: Change[] = [];
    
    for (let v = baseVersion + 1; v <= this.localVersion; v++) {
      const versionChanges = this.changeLog.get(v);
      if (versionChanges) {
        changes.push(...versionChanges);
      }
    }

    // 压缩变更
    const compressed = this.compressChanges(changes);

    return {
      version: this.localVersion,
      baseVersion,
      changes: compressed,
    };
  }

  /**
   * 应用增量更新
   */
  public applyDelta(delta: DeltaUpdate): boolean {
    // 检查版本连续性
    if (delta.baseVersion > this.localVersion) {
      // 需要请求完整状态
      return false;
    }

    // 检测冲突
    const conflicts = this.detectConflicts(delta);
    if (conflicts.length > 0) {
      this.emit('conflict', conflicts);
      this.resolveConflicts(conflicts, delta);
    }

    // 应用变更
    for (const change of delta.changes) {
      this.applyChange(change);
    }

    this.localVersion = delta.version;
    this.emit('deltaReceived', delta);

    return true;
  }

  /**
   * 应用单个变更
   */
  private applyChange(change: Change): void {
    switch (change.type) {
      case 'set':
        if (change.value !== undefined) {
          this.localState.set(change.path, change.value);
        }
        break;
      case 'delete':
        this.localState.delete(change.path);
        break;
      case 'update':
        // 深度更新
        this.deepUpdate(change.path, change.value);
        break;
      case 'insert':
        // 数组插入
        this.arrayInsert(change.path, change.value);
        break;
    }
  }

  /**
   * 深度更新
   */
  private deepUpdate(path: string, value: unknown): void {
    const parts = path.split('.');
    let current: any = this.localState;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * 数组插入
   */
  private arrayInsert(path: string, value: unknown): void {
    const match = path.match(/^(.+)\[(\d+)\]$/);
    if (!match) return;

    const [, arrayPath, indexStr] = match;
    const index = parseInt(indexStr, 10);
    const array = this.localState.get(arrayPath) as unknown[];

    if (Array.isArray(array)) {
      array.splice(index, 0, value);
    }
  }

  /**
   * 检测冲突
   */
  private detectConflicts(delta: DeltaUpdate): Change[] {
    const conflicts: Change[] = [];
    const deltaPaths = new Set(delta.changes.map(c => c.path));

    for (const change of this.pendingChanges) {
      if (deltaPaths.has(change.path)) {
        conflicts.push(change);
      }
    }

    return conflicts;
  }

  /**
   * 解决冲突
   */
  private resolveConflicts(conflicts: Change[], delta: DeltaUpdate): void {
    switch (this.conflictResolver) {
      case 'last-write-wins':
        // 保留时间戳最新的
        for (const conflict of conflicts) {
          const deltaChange = delta.changes.find(c => c.path === conflict.path);
          if (deltaChange && deltaChange.timestamp > conflict.timestamp) {
            // 使用 delta 的变更
            const idx = this.pendingChanges.findIndex(c => c.path === conflict.path);
            if (idx !== -1) {
              this.pendingChanges.splice(idx, 1);
            }
          }
        }
        break;
      case 'merge':
        // 尝试合并（需要特定策略）
        break;
    }
  }

  /**
   * 压缩变更
   */
  private compressChanges(changes: Change[]): Change[] {
    if (changes.length < this.compressionThreshold) {
      return changes;
    }

    // 按路径分组，只保留最终状态
    const compressed: Change[] = [];
    const pathMap = new Map<string, Change>();

    for (const change of changes) {
      pathMap.set(change.path, change);
    }

    for (const change of pathMap.values()) {
      compressed.push(change);
    }

    return compressed;
  }

  /**
   * 计算校验和
   */
  private computeChecksum(): string {
    const stateStr = JSON.stringify(Object.fromEntries(
      [...this.localState.entries()].sort()
    ));
    
    // 简单哈希
    let hash = 0;
    for (let i = 0; i < stateStr.length; i++) {
      const char = stateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(16);
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.localState.clear();
    this.localVersion = 0;
    this.pendingChanges = [];
    this.changeLog.clear();
  }

  /**
   * 获取统计信息
   */
  public getStats(): {
    version: number;
    stateSize: number;
    pendingChanges: number;
    changeLogSize: number;
  } {
    return {
      version: this.localVersion,
      stateSize: this.localState.size,
      pendingChanges: this.pendingChanges.length,
      changeLogSize: this.changeLog.size,
    };
  }
}

export default SyncProtocol;
