/**
 * 存储管理器 - OPFS + SQLite Wasm
 * 支持 OPFS 的环境下优先使用 OPFS，否则回退到 IndexedDB
 */

import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import { logger } from '@/core/utils/Logger';

let SQL: SqlJsStatic | null = null;

// OPFS API 类型声明
declare global {
  interface Navigator {
    storage: NavigatorStorage & {
      getOriginPrivateFileSystem(): Promise<FileSystemDirectoryHandle>;
    };
  }
}

/**
 * 初始化 SQL.js
 */
async function initSQL(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }
  return SQL;
}

/**
 * OPFS 存储管理器
 */
export class StorageManager {
  private static instance: StorageManager | null = null;
  private db: SqlJsDatabase | null = null;
  private root: FileSystemDirectoryHandle | null = null;
  private dbPath: string = 'omnis.db';
  private initialized: boolean = false;
  private cryptoKey: CryptoKey | null = null;
  private cryptoIv: Uint8Array | null = null;

  /**
   * 注入物理确权密钥以用于 AES-GCM 加密
   */
  public async unlockWithSoulKey(rawKeyMaterial: Uint8Array): Promise<void> {
    const key = await crypto.subtle.importKey(
      'raw',
      rawKeyMaterial as BufferSource,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // 固定的盐值，仅为本设备生命周期隔离
    const salt = new TextEncoder().encode('OMNIS_APIEN_SOUL_SALT_V13');

    this.cryptoKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // IV 固化在类中（简化演示，实际应连同密文存储）
    this.cryptoIv = new Uint8Array(12);
    this.cryptoIv.set([1, 3, 3, 7, 0, 0, 0, 0, 0, 0, 0, 0]);
    
    console.log('[Storage] 数据库已锚定物理密钥。');
  }

  private async tryDecrypt(buffer: ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
    if (!this.cryptoKey || !this.cryptoIv) {
      return buffer instanceof Uint8Array ? (buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) : buffer;
    }
    const dataBuffer: ArrayBuffer = buffer instanceof Uint8Array
      ? (buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      : buffer;
    try {
      return await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: this.cryptoIv as unknown as BufferSource },
        this.cryptoKey,
        dataBuffer
      );
    } catch (e) {
      console.error('[Storage] 解密失败，可能密钥错误或数据库未加密', e);
      return buffer instanceof Uint8Array ? (buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) : buffer;
    }
  }

  private async tryEncrypt(buffer: ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
    if (!this.cryptoKey || !this.cryptoIv) {
      return buffer instanceof Uint8Array ? (buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) : buffer;
    }
    const dataBuffer: ArrayBuffer = buffer instanceof Uint8Array
      ? (buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      : buffer;
    return await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.cryptoIv as unknown as BufferSource },
      this.cryptoKey,
      dataBuffer
    );
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * 初始化存储系统
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 尝试使用 OPFS
      if ('getOriginPrivateFileSystem' in navigator.storage) {
        await this.initOPFS();
      } else {
        await this.initIndexedDB();
      }
      this.initialized = true;
    } catch (error) {
      logger.error('Storage', '初始化失败', error as Error);
      throw error;
    }
  }

  /**
   * 使用 OPFS 初始化
   */
  private async initOPFS(): Promise<void> {
    console.log('[Storage] Initializing OPFS...');

    this.root = await navigator.storage.getOriginPrivateFileSystem();

    // 尝试加载现有数据库
    try {
      const dbFile = await this.root.getFileHandle(this.dbPath);
      const file = await dbFile.getFile();
      const encryptedBuffer = await file.arrayBuffer();
      
      const buffer = await this.tryDecrypt(encryptedBuffer);

      const sql = await initSQL();
      this.db = new sql.Database(new Uint8Array(buffer));

      console.log('[Storage] OPFS: Loaded existing database');
    } catch (error) {
      console.warn('[Storage] OPFS load failed, creating new database:', error);
      // 数据库不存在，创建新的
      console.log('[Storage] OPFS: Creating new database');

      const sql = await initSQL();
      this.db = new sql.Database();

      await this.initSchema();
      await this.save();
    }
  }

  /**
   * 使用 IndexedDB 初始化（回退）
   */
  private async initIndexedDB(): Promise<void> {
    logger.info('Storage', '初始化 IndexedDB (回退方案)...');

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('omnis_db', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = async () => {
        const db = request.result;

        // 加载数据
        const tx = db.transaction('data', 'readwrite');
        const store = tx.objectStore('data');

        const getRequest = store.get('database');

        getRequest.onsuccess = async () => {
          if (getRequest.result) {
            const sql = await initSQL();
            const decryptedBuffer = await this.tryDecrypt(getRequest.result.value as ArrayBuffer);
            this.db = new sql.Database(new Uint8Array(decryptedBuffer));
            logger.info('Storage', 'IndexedDB: 已加载现有数据库');
          } else {
            const sql = await initSQL();
            this.db = new sql.Database();
            await this.initSchema();
            await this.save();
            logger.info('Storage', 'IndexedDB: 已创建新数据库');
          }
          resolve();
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      };
    });
  }

  /**
   * 初始化数据库表结构
   */
  private async initSchema(): Promise<void> {
    if (!this.db) return;

    // 市民表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS citizens (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        genome TEXT NOT NULL,
        phenotype TEXT NOT NULL,
        state TEXT NOT NULL,
        position TEXT NOT NULL,
        memories TEXT DEFAULT '[]',
        relations TEXT DEFAULT '[]',
        statistics TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // 世界表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS worlds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT NOT NULL,
        state TEXT NOT NULL,
        current_epoch TEXT,
        climate TEXT,
        statistics TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // 事件表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        timestamp INTEGER NOT NULL,
        impact TEXT,
        handled INTEGER DEFAULT 0,
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      )
    `);

    // 经济表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        capacity REAL NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      )
    `);

    // 交易表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        buyer_id TEXT,
        seller_id TEXT,
        resource_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        total REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      )
    `);

    // 快照表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        type TEXT NOT NULL,
        data BLOB NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (world_id) REFERENCES worlds(id)
      )
    `);

    // 创建索引
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_citizens_state ON citizens(state)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_citizens_position ON citizens(position)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_events_world ON events(world_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_resources_world ON resources(world_id)`);

    logger.debug('Storage', '数据库架构已初始化');
  }

  /**
   * 保存数据库到存储
   */
  public async save(): Promise<void> {
    if (!this.db) return;

    const data = this.db.export();
    const encryptedBuffer = await this.tryEncrypt(data.buffer);
    const buffer = new Uint8Array(encryptedBuffer);

    if (this.root) {
      // OPFS 保存
      const fileHandle = await this.root.getFileHandle(this.dbPath, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(buffer);
      await writable.close();
    } else {
      // IndexedDB 保存
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('omnis_db', 1);

        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('data', 'readwrite');
          const store = tx.objectStore('data');

          store.put({ value: buffer }, 'database');

          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };

        request.onerror = () => reject(request.error);
      });
    }
  }

  /**
   * 执行 SQL 查询
   */
  public query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): T[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(sql);
    stmt.bind(params);

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();

    return results;
  }

  /**
   * 执行 SQL 语句（无返回值）
   */
  public execute(sql: string, params: unknown[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
  }

  /**
   * 批量执行
   */
  public transaction(callback: () => void): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run('BEGIN TRANSACTION');
    try {
      callback();
      this.db.run('COMMIT');
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * 插入或更新
   */
  public upsert(
    table: string,
    data: Record<string, unknown>,
    primaryKey: string
  ): void {
    const keys = Object.keys(data);
    const values = Object.values(data);

    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');

    this.execute(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})
       ON CONFLICT(${primaryKey}) DO UPDATE SET ${setClause}`,
      [...values, ...values]
    );
  }

  /**
   * 获取市民列表
   */
  public getCitizens(
    filter?: {
      state?: string;
      limit?: number;
      offset?: number;
    }
  ): Array<{
    id: string;
    name: string;
    state: string;
    position: string;
    updated_at: number;
  }> {
    let sql = 'SELECT id, name, state, position, updated_at FROM citizens';
    const params: unknown[] = [];

    if (filter?.state) {
      sql += ' WHERE state = ?';
      params.push(filter.state);
    }

    sql += ' ORDER BY updated_at DESC';

    if (filter?.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);

      if (filter?.offset) {
        sql += ' OFFSET ?';
        params.push(filter.offset);
      }
    }

    return this.query(sql, params);
  }

  /**
   * 获取市民数量
   */
  public getCitizenCount(state?: string): number {
    let sql = 'SELECT COUNT(*) as count FROM citizens';
    const params: unknown[] = [];

    if (state) {
      sql += ' WHERE state = ?';
      params.push(state);
    }

    const result = this.query<{ count: number }>(sql, params);
    return result[0]?.count || 0;
  }

  /**
   * 获取事件列表
   */
  public getEvents(worldId: string, limit: number = 100): Array<{
    id: string;
    type: string;
    name: string;
    timestamp: number;
  }> {
    return this.query(
      `SELECT id, type, name, timestamp FROM events
       WHERE world_id = ? AND handled = 0
       ORDER BY timestamp DESC LIMIT ?`,
      [worldId, limit]
    );
  }

  /**
   * 创建快照
   */
  public async createSnapshot(
    worldId: string,
    type: string,
    data: unknown
  ): Promise<void> {
    const id = crypto.randomUUID();
    const blob = new TextEncoder().encode(JSON.stringify(data));

    this.execute(
      `INSERT INTO snapshots (id, world_id, type, data, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, worldId, type, blob, Date.now()]
    );

    await this.save();
  }

  /**
   * 获取最新快照
   */
  public getLatestSnapshot(
    worldId: string,
    type: string
  ): { id: string; data: unknown; created_at: number } | null {
    const results = this.query<{ id: string; data: Uint8Array; created_at: number }>(
      `SELECT id, data, created_at FROM snapshots
       WHERE world_id = ? AND type = ?
       ORDER BY created_at DESC LIMIT 1`,
      [worldId, type]
    );

    if (results.length === 0) return null;

    const result = results[0];
    return {
      id: result.id,
      data: JSON.parse(new TextDecoder().decode(result.data)),
      created_at: result.created_at,
    };
  }

  /**
   * 清理旧快照
   */
  public async cleanupSnapshots(worldId: string, keepCount: number = 10): Promise<void> {
    this.execute(
      `DELETE FROM snapshots
       WHERE world_id = ? AND id NOT IN (
         SELECT id FROM snapshots
         WHERE world_id = ?
         ORDER BY created_at DESC LIMIT ?
       )`,
      [worldId, worldId, keepCount]
    );

    await this.save();
  }

  /**
   * 关闭数据库
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
  }

  /**
   * 删除所有数据
   */
  public async clear(): Promise<void> {
    if (this.db) {
      this.db.run('DELETE FROM citizens');
      this.db.run('DELETE FROM worlds');
      this.db.run('DELETE FROM events');
      this.db.run('DELETE FROM resources');
      this.db.run('DELETE FROM transactions');
      this.db.run('DELETE FROM snapshots');
      await this.save();
    }
  }

  /**
   * 设置键值对（用于游戏系统存储）
   */
  public async set(key: string, value: unknown): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const json = JSON.stringify(value);
    this.execute(
      `INSERT OR REPLACE INTO snapshots (id, world_id, type, data, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [key, 'kv_store', 'key_value', new TextEncoder().encode(json), Date.now()]
    );
    await this.save();
  }

  /**
   * 获取键值对
   */
  public async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');
    const results = this.query<{ data: Uint8Array }>(
      `SELECT data FROM snapshots WHERE id = ? AND type = 'kv_store' ORDER BY created_at DESC LIMIT 1`,
      [key]
    );
    if (results.length === 0) return null;
    return JSON.parse(new TextDecoder().decode(results[0].data));
  }
}

/**
 * 导出单例
 */
export const storage = StorageManager.getInstance();
export default storage;
