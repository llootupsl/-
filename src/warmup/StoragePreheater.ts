/**
 * 存储预热模块
 * 4.6.2 节实现：初始化 OPFS 和 SQLite Wasm
 */

import { WarmupPhase } from '@/core/constants/PerformanceMode';
import type { WarmupConfig, IWarmupModule } from './WarmupManager';
import { logger } from '@/core/utils/Logger';
import initSqlJs, { SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';

let SQL: SqlJsStatic | null = null;

async function getSqlModule(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
  }
  return SQL;
}

/**
 * 存储预热模块
 *
 * 预热手段：
 * - 使用 OPFS 打开默认数据库文件
 * - 创建 SQLite Wasm 实例并执行一次 SELECT 1 查询
 * - 预热文件系统缓存和 SQLite 引擎
 *
 * 回退方案：
 * - 若 OPFS 不可用，回退到 IndexedDB
 * - 若 SQLite Wasm 初始化失败，使用原生 IndexedDB 操作
 */
export class StoragePreheater implements IWarmupModule {
  name = '存储引擎初始化';
  phase: WarmupPhase = WarmupPhase.ASYNC;

  /**
   * 执行存储预热
   */
  async preheat(config: WarmupConfig): Promise<{ success: boolean; fallback?: string; error?: string }> {
    try {
      // 尝试 OPFS + SQLite
      if (await this.isOPFSSupported()) {
        return await this.opfsWarmup();
      }

      // 回退到 IndexedDB
      return this.indexedDBFallback();
    } catch (error) {
      return {
        success: false,
        fallback: 'unknown',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 检查 OPFS 支持
   */
  private async isOPFSSupported(): Promise<boolean> {
    try {
      return 'getOriginPrivateFileSystem' in navigator.storage;
    } catch (error) {
      logger.warn('StoragePreheater', 'OPFS support check failed', error as Error);
      return false;
    }
  }

  /**
   * OPFS + SQLite 预热
   */
  private async opfsWarmup(): Promise<{ success: boolean; fallback?: string; error?: string }> {
    try {
      // 获取 OPFS 根目录
      const root = await navigator.storage.getOriginPrivateFileSystem();

      // 打开或创建数据库文件
      const dbHandle = await root.getFileHandle('omnis.db', { create: true });

      // 获取文件
      const file = await dbHandle.getFile();

      // 尝试加载 SQL.js（静态导入，避免与 StorageManager 的加载策略冲突）
      try {
        const SQLModule = await getSqlModule();

        // 如果文件存在，加载现有数据
        let db;
        if (file.size > 0) {
          const buffer = await file.arrayBuffer();
          db = new SQLModule.Database(buffer);
        } else {
          db = new SQLModule.Database();
        }

        // 执行一次查询预热
        try {
          db.run('SELECT 1');
        } catch (error) {
          logger.warn('StoragePreheater', 'SQLite warmup query failed', error as Error);
        }

        // 保存数据库引用（保持预热）
        // 注意：实际项目中需要正确管理数据库生命周期
        db.close();

        return { success: true };
      } catch (error) {
        logger.warn('StoragePreheater', 'SQLite Wasm init failed', error as Error);
        return { success: true, fallback: 'sqlite-failed' };
      }
    } catch (error) {
      logger.warn('StoragePreheater', 'OPFS failed, falling back to IndexedDB', error as Error);
      return this.indexedDBFallback();
    }
  }

  /**
   * IndexedDB 回退
   */
  private indexedDBFallback(): Promise<{ success: boolean; fallback: string; error?: string }> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('omnis_warmup', 1);

        request.onerror = () => {
          resolve({
            success: false,
            fallback: 'indexeddb-failed',
            error: 'IndexedDB open failed',
          });
        };

        request.onsuccess = () => {
          const db = request.result;

          // 执行一次空事务
          const tx = db.transaction('store', 'readonly');
          const store = tx.objectStore('store');

          // 添加一条测试数据
          const putRequest = store.put({ id: 'warmup', timestamp: Date.now() }, 'warmup_key');

          putRequest.onsuccess = () => {
            // 获取数据确认
            const getRequest = store.get('warmup_key');
            getRequest.onsuccess = () => {
              db.close();
              resolve({ success: true, fallback: 'indexeddb' });
            };
          };

          putRequest.onerror = () => {
            db.close();
            resolve({ success: true, fallback: 'indexeddb-partial' });
          };

          tx.onerror = () => {
            db.close();
            resolve({ success: true, fallback: 'indexeddb-tx-failed' });
          };
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('store')) {
            db.createObjectStore('store');
          }
        };
      } catch (error) {
        resolve({
          success: false,
          fallback: 'indexeddb-exception',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
}
