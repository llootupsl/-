/**
 * =============================================================================
 * 数据库同步 - OPFS/SQLite 数据同步引擎
 * 支持 P2P 数据库增量同步与冲突解决
 * =============================================================================
 */

import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import { logger } from '../../core/utils/Logger';

export interface SyncableTable {
  name: string;
  primaryKey: string;
  lastSync: number;
}

export interface SyncRecord {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  primaryKey: string;
  data: unknown;
  timestamp: number;
  peerId: string;
}

export interface SyncManifest {
  tables: SyncableTable[];
  lastSync: number;
  peerId: string;
  version: string;
}

export interface DatabaseSyncConfig {
  opfsPath?: string;
  dbName?: string;
  syncInterval?: number;
  maxRecordsPerSync?: number;
  conflictResolution?: 'local-wins' | 'remote-wins' | 'latest-wins' | 'merge';
}

const defaultConfig: Required<DatabaseSyncConfig> = {
  opfsPath: 'omnis_sync.db',
  dbName: 'omnis_sync',
  syncInterval: 5000,
  maxRecordsPerSync: 1000,
  conflictResolution: 'latest-wins',
};

const VERSION = '1.0.0';

/**
 * 数据库同步引擎
 */
export class DatabaseSync {
  private db: SqlJsDatabase | null = null;
  private SQL: SqlJsStatic | null = null;
  private root: FileSystemDirectoryHandle | null = null;
  private config: Required<DatabaseSyncConfig>;
  private syncQueue: SyncRecord[] = [];
  private pendingChanges: Map<string, SyncRecord[]> = new Map();
  private syncedTables: Set<string> = new Set();
  private syncInterval: number | null = null;
  private peerId: string;
  private initialized: boolean = false;
  private onSyncCallback: ((records: SyncRecord[]) => void) | null = null;
  private onConflictCallback: ((conflicts: SyncConflict[]) => void) | null = null;

  constructor(peerId: string, config?: DatabaseSyncConfig) {
    this.peerId = peerId;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 初始化
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl,
      });

      // 尝试 OPFS
      if ('getOriginPrivateFileSystem' in navigator.storage) {
        await this.initOPFS();
      } else {
        await this.initMemoryDB();
      }

      this.initialized = true;
      logger.info('DatabaseSync', 'Initialized');
    } catch (error) {
      logger.error('DatabaseSync', 'Init error', error as Error);
      throw error;
    }
  }

  /**
   * OPFS 初始化
   */
  private async initOPFS(): Promise<void> {
    this.root = await navigator.storage.getOriginPrivateFileSystem();

    try {
      const dbFile = await this.root.getFileHandle(this.config.opfsPath);
      const file = await dbFile.getFile();
      const buffer = await file.arrayBuffer();
      this.db = new this.SQL!.Database(new Uint8Array(buffer));
      logger.info('DatabaseSync', 'Loaded existing OPFS database');
    } catch (error) {
      logger.warn('DatabaseSync', 'Failed to load existing OPFS database, creating new one', error as Error);
      this.db = new this.SQL!.Database();
      await this.initSchema();
      await this.save();
      console.log('[DatabaseSync] Created new OPFS database');
    }
  }

  /**
   * 内存数据库初始化
   */
  private async initMemoryDB(): Promise<void> {
    this.db = new this.SQL!.Database();
    await this.initSchema();
    console.log('[DatabaseSync] Using in-memory database');
  }

  /**
   * 初始化表结构
   */
  private async initSchema(): Promise<void> {
    if (!this.db) return;

    // 同步表清单
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_tables (
        name TEXT PRIMARY KEY,
        primary_key TEXT NOT NULL,
        last_sync INTEGER DEFAULT 0
      )
    `);

    // 同步记录
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        primary_key TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        peer_id TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);

    // 元数据
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // 索引
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_records_timestamp ON sync_records(timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_records_synced ON sync_records(synced)`);
  }

  /**
   * 保存数据库
   */
  private async save(): Promise<void> {
    if (!this.db || !this.root) return;

    const data = this.db.export();
    const fileHandle = await this.root.getFileHandle(this.config.opfsPath, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Uint8Array(data));
    await writable.close();
  }

  /**
   * 注册需要同步的表
   */
  public registerTable(name: string, primaryKey: string): void {
    if (!this.db) return;

    this.db.run(
      `INSERT OR REPLACE INTO sync_tables (name, primary_key, last_sync) VALUES (?, ?, ?)`,
      [name, primaryKey, 0]
    );

    this.syncedTables.add(name);
    this.save();
  }

  /**
   * 记录变更
   */
  public recordChange(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    primaryKey: string,
    data: unknown
  ): void {
    const record: SyncRecord = {
      table,
      operation,
      primaryKey,
      data,
      timestamp: Date.now(),
      peerId: this.peerId,
    };

    this.syncQueue.push(record);

    if (!this.pendingChanges.has(table)) {
      this.pendingChanges.set(table, []);
    }
    this.pendingChanges.get(table)!.push(record);
  }

  /**
   * 设置同步回调
   */
  public setSyncCallback(callback: (records: SyncRecord[]) => void): void {
    this.onSyncCallback = callback;
  }

  /**
   * 设置冲突解决回调
   */
  public setConflictCallback(callback: (conflicts: SyncConflict[]) => void): void {
    this.onConflictCallback = callback;
  }

  /**
   * 启动定时同步
   */
  public startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = window.setInterval(() => {
      this.flushPendingChanges();
    }, this.config.syncInterval);

    logger.info('DatabaseSync', 'Auto-sync started');
  }

  /**
   * 停止定时同步
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 刷新待同步变更
   */
  public async flushPendingChanges(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const recordsToSync = this.syncQueue.splice(0, this.config.maxRecordsPerSync);

    // 保存到本地数据库
    if (this.db) {
      const stmt = this.db.prepare(
        `INSERT INTO sync_records (table_name, operation, primary_key, data, timestamp, peer_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      recordsToSync.forEach((record) => {
        stmt.run([record.table, record.operation, record.primaryKey, JSON.stringify(record.data), record.timestamp, record.peerId]);
      });

      stmt.free();
      await this.save();
    }

    // 触发同步回调
    if (this.onSyncCallback) {
      this.onSyncCallback(recordsToSync);
    }

    logger.debug('DatabaseSync', `Flushed ${recordsToSync.length} pending changes`);
  }

  /**
   * 获取待同步记录
   */
  public getPendingRecords(): SyncRecord[] {
    if (!this.db) return this.syncQueue;

    const results = this.db.exec(
      `SELECT table_name, operation, primary_key, data, timestamp, peer_id
       FROM sync_records WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?`,
      [this.config.maxRecordsPerSync]
    );

    if (results.length === 0) return [];

    return results[0].values.map((row) => ({
      table: row[0] as string,
      operation: row[1] as 'INSERT' | 'UPDATE' | 'DELETE',
      primaryKey: row[2] as string,
      data: JSON.parse(row[3] as string),
      timestamp: row[4] as number,
      peerId: row[5] as string,
    }));
  }

  /**
   * 获取同步清单
   */
  public getSyncManifest(): SyncManifest {
    const tables: SyncableTable[] = [];

    if (this.db) {
      const results = this.db.exec(`SELECT name, primary_key, last_sync FROM sync_tables`);
      if (results.length > 0) {
        results[0].values.forEach((row) => {
          tables.push({
            name: row[0] as string,
            primaryKey: row[1] as string,
            lastSync: row[2] as number,
          });
        });
      }
    }

    return {
      tables,
      lastSync: Date.now(),
      peerId: this.peerId,
      version: VERSION,
    };
  }

  /**
   * 合并远程数据
   */
  public async mergeRemoteRecords(records: SyncRecord[]): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    if (!this.db) return conflicts;

    for (const record of records) {
      try {
        // 检查本地是否有冲突
        const existing = this.db.exec(
          `SELECT timestamp FROM sync_records WHERE table_name = ? AND primary_key = ?`,
          [record.table, record.primaryKey]
        );

        if (existing.length > 0 && existing[0].values.length > 0) {
          const localTimestamp = existing[0].values[0][0] as number;

          if (localTimestamp > record.timestamp) {
            // 本地更新，直接跳过
            continue;
          } else if (localTimestamp === record.timestamp) {
            // 同时修改，冲突
            conflicts.push({
              table: record.table,
              primaryKey: record.primaryKey,
              localData: this.getLocalData(record.table, record.primaryKey),
              remoteData: record.data,
              resolution: 'none',
            });
            continue;
          }
        }

        // 应用远程变更
        await this.applyRecord(record);

        // 标记为已同步
        this.db.run(
          `UPDATE sync_records SET synced = 1 WHERE table_name = ? AND primary_key = ? AND timestamp = ?`,
          [record.table, record.primaryKey, record.timestamp]
        );

        // 更新最后同步时间
        this.db.run(
          `UPDATE sync_tables SET last_sync = ? WHERE name = ?`,
          [record.timestamp, record.table]
        );
      } catch (error) {
        logger.error('DatabaseSync', 'Merge error', error as Error);
      }
    }

    await this.save();

    // 触发冲突回调
    if (conflicts.length > 0 && this.onConflictCallback) {
      this.onConflictCallback(conflicts);
    }

    logger.info(
      'DatabaseSync',
      `Merged ${records.length} records, ${conflicts.length} conflicts`
    );
    return conflicts;
  }

  /**
   * 获取本地数据
   */
  private getLocalData(table: string, primaryKey: string): unknown {
    if (!this.db) return null;

    // 查找最近的同步记录
    const results = this.db.exec(
      `SELECT data FROM sync_records WHERE table_name = ? AND primary_key = ? ORDER BY timestamp DESC LIMIT 1`,
      [table, primaryKey]
    );

    if (results.length > 0 && results[0].values.length > 0) {
      return JSON.parse(results[0].values[0][0] as string);
    }

    return null;
  }

  /**
   * 应用同步记录
   */
  private async applyRecord(record: SyncRecord): Promise<void> {
    if (!this.db) return;

    switch (record.operation) {
      case 'INSERT':
      case 'UPDATE':
        // 存储数据
        this.db.run(
          `INSERT OR REPLACE INTO sync_records (table_name, operation, primary_key, data, timestamp, peer_id, synced)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [record.table, record.operation, record.primaryKey, JSON.stringify(record.data), record.timestamp, record.peerId]
        );
        break;

      case 'DELETE':
        // 标记删除
        this.db.run(
          `INSERT INTO sync_records (table_name, operation, primary_key, data, timestamp, peer_id, synced)
           VALUES (?, 'DELETE', ?, '', ?, ?, 1)`,
          [record.table, record.primaryKey, record.timestamp, record.peerId]
        );
        break;
    }
  }

  /**
   * 解决冲突
   */
  public resolveConflict(conflict: SyncConflict, resolution: SyncConflict['resolution']): void {
    conflict.resolution = resolution;

    if (resolution === 'local-wins') {
      // 保持本地数据，重新同步
      this.recordChange(conflict.table, 'UPDATE', conflict.primaryKey as string, conflict.localData);
    } else if (resolution === 'remote-wins') {
      // 应用远程数据
      if (this.db) {
        this.db.run(
          `INSERT OR REPLACE INTO sync_records (table_name, operation, primary_key, data, timestamp, peer_id, synced)
           VALUES (?, 'UPDATE', ?, ?, ?, ?, 1)`,
          [conflict.table, conflict.primaryKey, JSON.stringify(conflict.remoteData), Date.now(), this.peerId]
        );
      }
    } else if (resolution === 'merge') {
      // 合并数据（简单策略：远程覆盖）
      if (this.db) {
        this.db.run(
          `INSERT OR REPLACE INTO sync_records (table_name, operation, primary_key, data, timestamp, peer_id, synced)
           VALUES (?, 'UPDATE', ?, ?, ?, ?, 1)`,
          [conflict.table, conflict.primaryKey, JSON.stringify(conflict.remoteData), Date.now(), this.peerId]
        );
      }
    }

    logger.info('DatabaseSync', `Conflict resolved: ${conflict.table}/${conflict.primaryKey} -> ${resolution}`);
  }

  /**
   * 获取待同步计数
   */
  public getPendingCount(): number {
    if (!this.db) return this.syncQueue.length;

    const results = this.db.exec(`SELECT COUNT(*) FROM sync_records WHERE synced = 0`);
    if (results.length > 0) {
      return (results[0].values[0][0] as number) + this.syncQueue.length;
    }

    return this.syncQueue.length;
  }

  /**
   * 获取同步状态
   */
  public getSyncStatus(): {
    initialized: boolean;
    pendingCount: number;
    registeredTables: number;
    autoSyncEnabled: boolean;
  } {
    return {
      initialized: this.initialized,
      pendingCount: this.getPendingCount(),
      registeredTables: this.syncedTables.size,
      autoSyncEnabled: this.syncInterval !== null,
    };
  }

  /**
   * 导出数据库为 JSON
   */
  public exportDatabase(): string {
    if (!this.db) return '{}';

    const tables: Record<string, unknown[]> = {};

    const results = this.db.exec(`SELECT name FROM sync_tables`);
    if (results.length > 0) {
      results[0].values.forEach((row) => {
        const tableName = row[0] as string;
        const tableData = this.db!.exec(`SELECT * FROM ${tableName}`);
        if (tableData.length > 0) {
          tables[tableName] = tableData[0].values.map((rowValues) => {
            const obj: Record<string, unknown> = {};
            tableData[0].columns.forEach((col, i) => {
              obj[col] = rowValues[i];
            });
            return obj;
          });
        }
      });
    }

    return JSON.stringify({
      manifest: this.getSyncManifest(),
      data: tables,
    }, null, 2);
  }

  /**
   * 从 JSON 导入
   */
  public async importDatabase(json: string): Promise<void> {
    try {
      const data = JSON.parse(json);
      await this.mergeRemoteRecords(data.manifest?.tables || []);
      logger.info('DatabaseSync', 'Database imported');
    } catch (error) {
      logger.error('DatabaseSync', 'Import error', error as Error);
      throw error;
    }
  }

  /**
   * 销毁
   */
  public async destroy(): Promise<void> {
    this.stopAutoSync();
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
    }
    this.syncQueue = [];
    this.pendingChanges.clear();
    this.initialized = false;
  }
}

export interface SyncConflict {
  table: string;
  primaryKey: string;
  localData: unknown;
  remoteData: unknown;
  resolution: 'none' | 'local-wins' | 'remote-wins' | 'merge';
}

export default DatabaseSync;
