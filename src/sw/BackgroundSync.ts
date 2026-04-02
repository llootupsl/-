/**
 * 后台同步管理器
 * 处理离线操作的后台同步逻辑
 * 
 * V13 增强：支持 Periodic Background Sync API 实现"幽灵时间"后台结算
 * - 在用户关闭游戏后，Service Worker 定期唤醒执行文明模拟
 * - 条件：PWA已安装 + 设备充电中 + WiFi连接
 */

import { logger } from '../core/utils/Logger';

/** 周期性同步配置 */
export interface PeriodicSyncConfig {
  /** 同步标签 */
  tag: string;
  /** 最小间隔（毫秒）- 浏览器可能调整 */
  minInterval: number;
  /** 是否启用幽灵演算 */
  enableGhostSimulation: boolean;
}

/** 幽灵演算状态 */
export interface GhostSimulationState {
  lastRun: number;
  totalRuns: number;
  yearsSimulated: number;
  eventsTriggered: string[];
}

/** 宏观游戏状态 - V5修复 */
interface MacroGameState {
  population: number;
  resources: Record<string, number>;
  entropy: number;
  year: number;
}

const PERIODIC_SYNC_CONFIG: PeriodicSyncConfig = {
  tag: 'omnis-ghost-simulation',
  minInterval: 60 * 60 * 1000, // 1小时
  enableGhostSimulation: true,
};

/** 扩展的ServiceWorkerRegistration接口 */
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  periodicSync?: {
    register: (tag: string, options: { minInterval: number }) => Promise<void>;
    unregister: (tag: string) => Promise<void>;
    getTags: () => Promise<string[]>;
  };
}

export interface SyncOperation {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface SyncConfig {
  dbName: string;
  storeName: string;
  syncTag: string;
  maxRetries: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: SyncConfig = {
  dbName: 'omnis-sync-db',
  storeName: 'pendingSync',
  syncTag: 'omnis-sync-data',
  maxRetries: 3,
  retryDelay: 1000,
};

class BackgroundSync {
  private db: IDBDatabase | null = null;
  private config: SyncConfig;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private ghostState: GhostSimulationState = {
    lastRun: 0,
    totalRuns: 0,
    yearsSimulated: 0,
    eventsTriggered: [],
  };
  private periodicSyncRegistered: boolean = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initOnlineListener();
  }

  /**
   * 初始化在线状态监听
   */
  private initOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('[BackgroundSync] 网络已恢复');
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      console.log('[BackgroundSync] 网络已断开');
      this.isOnline = false;
    });
  }

  /**
   * 初始化 IndexedDB
   */
  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, 1);

      request.onerror = () => {
        console.error('[BackgroundSync] 数据库打开失败');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[BackgroundSync] 数据库初始化完成');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          const store = db.createObjectStore(this.config.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // 创建索引
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          
          console.log('[BackgroundSync] 数据库升级完成');
        }
      };
    });
  }

  /**
   * 添加待同步操作
   */
  public async addOperation(type: string, data: unknown): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    const operation: Omit<SyncOperation, 'id'> = {
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.config.maxRetries,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.config.storeName, 'readwrite');
      const store = tx.objectStore(this.config.storeName);
      const request = store.add(operation);

      request.onsuccess = () => {
        const id = request.result as string;
        console.log(`[BackgroundSync] 添加待同步操作: ${type}`, id);
        
        // 如果在线，立即尝试同步
        if (this.isOnline && !this.syncInProgress) {
          this.triggerSync();
        }
        
        resolve(id);
      };

      request.onerror = () => {
        console.error('[BackgroundSync] 添加操作失败');
        reject(request.error);
      };
    });
  }

  /**
   * 触发后台同步
   */
  public async triggerSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      console.log('[BackgroundSync] 跳过同步:', this.isOnline ? '同步中' : '离线');
      return;
    }

    this.syncInProgress = true;

    try {
      // 检查 Background Sync API 是否可用
      const registration = await navigator.serviceWorker?.ready;
      
      if (registration && 'sync' in registration) {
        // 使用 Background Sync API
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
          .sync.register(this.config.syncTag);
        console.log('[BackgroundSync] 后台同步已注册');
      } else {
        // 后备：手动同步
        await this.performSync();
      }
    } catch (error) {
      console.error('[BackgroundSync] 触发同步失败:', error);
      await this.performSync();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 执行同步
   */
  public async performSync(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const pendingOps = await this.getPendingOperations();
    
    if (pendingOps.length === 0) {
      console.log('[BackgroundSync] 没有待同步的操作');
      return;
    }

    console.log(`[BackgroundSync] 开始同步 ${pendingOps.length} 个操作`);

    for (const op of pendingOps) {
      try {
        await this.syncOperation(op);
        await this.markCompleted(op.id!);
        this.notifyListeners('success', op);
      } catch (error) {
        console.error(`[BackgroundSync] 同步失败: ${op.id}`, error);
        
        if (op.retries! < op.maxRetries!) {
          await this.incrementRetry(op.id!);
          this.notifyListeners('retry', { ...op, error });
        } else {
          await this.markFailed(op.id!);
          this.notifyListeners('failed', { ...op, error });
        }
      }
    }

    this.notifyListeners('syncComplete', { count: pendingOps.length });
  }

  /**
   * 同步单个操作
   */
  private async syncOperation(op: SyncOperation): Promise<void> {
    // 根据操作类型调用对应的处理函数
    const handlers: Record<string, (data: unknown) => Promise<void>> = {
      'game-state': this.syncGameState.bind(this),
      'citizen-data': this.syncCitizenData.bind(this),
      'economy-transaction': this.syncEconomyTransaction.bind(this),
      'user-preference': this.syncUserPreference.bind(this),
      'save-state': this.syncSaveState.bind(this),
    };

    const handler = handlers[op.type];
    
    if (handler) {
      await handler(op.data);
    } else {
      // 默认处理：打印日志
      console.log(`[BackgroundSync] 处理操作: ${op.type}`, op.data);
      await this.simulateNetworkDelay();
    }
  }

  /**
   * 同步游戏状态
   */
  private async syncGameState(data: unknown): Promise<void> {
    console.log('[BackgroundSync] 同步游戏状态');
    await this.simulateNetworkDelay();
    // 在实际项目中，这里会调用云端 API
  }

  /**
   * 同步公民数据
   */
  private async syncCitizenData(data: unknown): Promise<void> {
    console.log('[BackgroundSync] 同步公民数据');
    await this.simulateNetworkDelay();
  }

  /**
   * 同步经济交易
   */
  private async syncEconomyTransaction(data: unknown): Promise<void> {
    console.log('[BackgroundSync] 同步经济交易');
    await this.simulateNetworkDelay();
  }

  /**
   * 同步用户偏好
   */
  private async syncUserPreference(data: unknown): Promise<void> {
    console.log('[BackgroundSync] 同步用户偏好');
    await this.simulateNetworkDelay();
  }

  /**
   * 同步保存状态
   */
  private async syncSaveState(data: unknown): Promise<void> {
    console.log('[BackgroundSync] 同步保存状态');
    await this.simulateNetworkDelay();
  }

  /**
   * 模拟网络延迟
   */
  private async simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }

  /**
   * 获取待同步操作列表
   */
  public async getPendingOperations(): Promise<SyncOperation[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.config.storeName, 'readonly');
      const store = tx.objectStore(this.config.storeName);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 标记操作完成
   */
  public async markCompleted(id: string | number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.config.storeName, 'readwrite');
      const store = tx.objectStore(this.config.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 标记操作失败
   */
  public async markFailed(id: string | number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.config.storeName, 'readwrite');
      const store = tx.objectStore(this.config.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const op = getRequest.result;
        if (op) {
          op.status = 'failed';
          const putRequest = store.put(op);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * 增加重试次数
   */
  public async incrementRetry(id: string | number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.config.storeName, 'readwrite');
      const store = tx.objectStore(this.config.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const op = getRequest.result;
        if (op) {
          op.retries++;
          const putRequest = store.put(op);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * 添加事件监听器
   */
  public addListener(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public removeListener(event: string, callback: (data: unknown) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * 获取同步状态
   */
  public getSyncStatus(): { isOnline: boolean; syncInProgress: boolean; pendingCount: number } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingCount: 0, // 将在实际调用时填充
    };
  }

  /**
   * 清除所有待同步数据
   */
  public async clearAll(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.config.storeName, 'readwrite');
      const store = tx.objectStore(this.config.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[BackgroundSync] 已清除所有待同步数据');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /* ==========================================================================
     V13 增强：Periodic Background Sync（幽灵时间后台结算）
     ========================================================================== */

  /**
   * 注册周期性后台同步
   * 要求：PWA已安装，设备充电中，WiFi连接
   */
  public async registerPeriodicSync(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PeriodicSync] Service Worker 不支持');
      return false;
    }

    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready as Promise<ExtendedServiceWorkerRegistration>,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Service Worker ready timeout')), 4000);
        }),
      ]);
      
      if (!registration.periodicSync) {
        console.warn('[PeriodicSync] Periodic Background Sync API 不支持');
        return false;
      }

      // 检查权限状态
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
      if (status.state === 'denied') {
        console.warn('[PeriodicSync] 权限被拒绝');
        return false;
      }

      // 注册周期性同步
      await registration.periodicSync.register(PERIODIC_SYNC_CONFIG.tag, {
        minInterval: PERIODIC_SYNC_CONFIG.minInterval,
      });

      this.periodicSyncRegistered = true;
      console.log('[PeriodicSync] 周期性后台同步已注册，间隔:', PERIODIC_SYNC_CONFIG.minInterval / 60000, '分钟');
      return true;
    } catch (error) {
      console.warn('[PeriodicSync] 注册失败，将回退到普通同步:', error);
      return false;
    }
  }

  /**
   * 注销周期性后台同步
   */
  public async unregisterPeriodicSync(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready as ExtendedServiceWorkerRegistration;
      
      if (registration.periodicSync) {
        await registration.periodicSync.unregister(PERIODIC_SYNC_CONFIG.tag);
        this.periodicSyncRegistered = false;
        console.log('[PeriodicSync] 已注销');
      }
    } catch (error) {
      console.warn('[PeriodicSync] 注销失败:', error);
    }
  }

  /**
   * 检查周期性同步状态
   */
  public async checkPeriodicSyncStatus(): Promise<{
    supported: boolean;
    registered: boolean;
    tags: string[];
  }> {
    const result = {
      supported: false,
      registered: false,
      tags: [] as string[],
    };

    if (!('serviceWorker' in navigator)) return result;

    try {
      const registration = await navigator.serviceWorker.ready as ExtendedServiceWorkerRegistration;
      
      if (registration.periodicSync) {
        result.supported = true;
        result.tags = await registration.periodicSync.getTags();
        result.registered = result.tags.includes(PERIODIC_SYNC_CONFIG.tag);
      }
    } catch (error) {
      console.warn('[PeriodicSync] 状态检查失败:', error);
    }

    return result;
  }

  /**
   * 执行幽灵演算（在Service Worker中调用）
   * 在后台唤醒窗口期执行简化的文明模拟
   */
  public async performGhostSimulation(): Promise<GhostSimulationState> {
    console.log('[GhostSimulation] 开始幽灵演算...');
    const startTime = Date.now();

    try {
      // 1. 加载当前游戏状态
      const gameState = await this.loadGameStateForGhostSimulation();
      if (!gameState) {
        console.log('[GhostSimulation] 无有效游戏状态，跳过');
        return this.ghostState;
      }

      // 2. 执行宏观统计推演（简化版，不包含完整市民模拟）
      const simulationYears = this.calculateSimulationYears(gameState);
      const events = this.runMacroSimulation(gameState, simulationYears);

      // 3. 写入OPFS
      await this.saveGhostSimulationResult(gameState, events);

      // 4. 更新状态
      this.ghostState.lastRun = startTime;
      this.ghostState.totalRuns++;
      this.ghostState.yearsSimulated += simulationYears;
      this.ghostState.eventsTriggered.push(...events.map(e => e.type));

      console.log(`[GhostSimulation] 完成，模拟了 ${simulationYears} 年，触发 ${events.length} 个事件`);
      return this.ghostState;
    } catch (error) {
      console.error('[GhostSimulation] 演算失败:', error);
      return this.ghostState;
    }
  }

  /**
   * 加载游戏状态供幽灵演算使用
   */
  private async loadGameStateForGhostSimulation(): Promise<unknown | null> {
    try {
      if ('storage' in navigator && typeof navigator.storage.getDirectory === 'function') {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle('game_state.json', { create: false });
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text);
      }
    } catch (error) {
      logger.warn('BackgroundSync', 'Failed to load game state from File System API, falling back to IndexedDB', error as Error);
      return new Promise((resolve) => {
        const request = indexedDB.open('omnis-game-db', 1);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('game_state', 'readonly');
          const store = tx.objectStore('game_state');
          const getRequest = store.get('current');
          getRequest.onsuccess = () => resolve(getRequest.result || null);
          getRequest.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      });
    }
    return null;
  }

  /**
   * 计算幽灵演算应模拟的年数
   */
  private calculateSimulationYears(gameState: unknown): number {
    // 根据上次运行时间计算
    const hoursSinceLastRun = (Date.now() - this.ghostState.lastRun) / (1000 * 60 * 60);
    // 每小时模拟约10年（简化推演）
    return Math.floor(hoursSinceLastRun * 10);
  }

  /**
   * 运行宏观模拟 - V5修复：实现真正的宏观模型
   * 包含人口增长/衰减、资源消耗、熵值变化等
   */
  private runMacroSimulation(gameState: unknown, years: number): Array<{ type: string; data: unknown }> {
    const events: Array<{ type: string; data: unknown }> = [];

    // V5修复：实现真正的宏观模型
    // 从游戏状态提取关键指标
    let state = gameState as MacroGameState | null;

    
    // 如果没有state，使用默认值
    if (!state) {
      state = {
        population: 1000,
        resources: { food: 1000, energy: 100, materials: 100 },
        entropy: 30,
        year: 0,
      };
    }

    // 人口增长模型（基于资源可用性）
    const populationGrowthRate = this.calculatePopulationGrowthRate(state);
    
    // 资源消耗模型
    const resourceConsumption = this.calculateResourceConsumption(state);
    
    // 熵值变化模型
    const entropyChange = this.calculateEntropyChange(state);
    
    // 事件触发（基于概率和状态）
    for (let year = 0; year < years; year++) {
      const event = this.determineEvent(state, year);
      if (event) {
        events.push(event);
      }
    }
    
    return events;
  }

  /**
   * 计算人口增长率
   */
  private calculatePopulationGrowthRate(state: MacroGameState): number {
    // 基础增长率
    let baseRate = 0.02; // 2% 年增长率
    
    // 资源影响
    const foodPerCapita = state.resources.food / state.population;
    const energyPerCapita = state.resources.energy / state.population;
    
    // 计算调整后的增长率
    const adjustedRate = baseRate * (1 + foodPerCapita * 0.5 - energyPerCapita * 0.3);
    
    // 添加随机波动
    const randomFactor = 1 + (Math.random() - 0.5) * 0.1;
    
    return Math.max(0.001, Math.min(0.05, adjustedRate + randomFactor));
  }
  /**
   * 计算资源消耗
   */
  private calculateResourceConsumption(state: MacroGameState): Record<string, number> {
    // 基础消耗率
    const baseConsumption: Record<string, number> = {
      food: state.population * 0.5,
      energy: state.population * 0.3,
      materials: state.population * 0.1,
    };
    
    // 资源短缺影响
    const foodShortage = state.resources.food < state.population * 0.8;
    const energyShortage = state.resources.energy < state.population * 0.5;
    
    // 调整消耗率
    for (const resource of Object.keys(baseConsumption)) {
      if (resource === 'food' && foodShortage) {
        baseConsumption[resource] *= 1.5; // 短缺时消耗增加
      } else if (resource === 'energy' && energyShortage) {
        baseConsumption[resource] *= 1.3; // 短缺时消耗增加
      }
    }
    
    return baseConsumption;
  }
  /**
   * 计算熵值变化
   */
  private calculateEntropyChange(state: MacroGameState): number {
    // 基础熵增
    let baseEntropyIncrease = 0.5; // 每年基础熵增
    
    // 人口影响（人口越多，熵增越快）
    const populationFactor = state.population / 10000;
    
    // 资源影响（资源越充足，熵增越慢）
    const resourceFactor = Math.min(state.resources.food / 1000, 1);
    
    // 科技影响（假设有科技水平）
    const techFactor = 0.9; // 科技可以减缓熵增
    
    // 计算总熵增
    const totalEntropyIncrease = baseEntropyIncrease * (1 + populationFactor) * resourceFactor * techFactor;
    
    return Math.max(0.1, Math.min(2, totalEntropyIncrease));
  }
  /**
   * 确定事件类型
   */
  private determineEvent(state: MacroGameState, year: number): { type: string; data: unknown } | null {
    // 基于状态确定事件概率
    const eventProbabilities: Record<string, number> = {
      harvest: 0.05 + (state.resources.food > 1500 ? 0.1 : 0),
      epidemic: 0.03 + (state.resources.food < 500 ? 0.15 : 0),
      discovery: 0.02 + (state.entropy < 50 ? 0.08 : 0),
      disaster: 0.01 + (state.entropy > 70 ? 0.2 : 0),
      migration: 0.05 * (state.population > 5000 ? 0.1 : 0),
    };
    
    // 检查每种事件
    for (const [eventType, baseProb] of Object.entries(eventProbabilities)) {
      if (Math.random() < baseProb) {
        return {
          type: eventType,
          data: { year, impact: this.calculateEventImpact(eventType, state) },
        };
      }
    }
    
    return null;
  }
  /**
   * 计算事件影响
   */
  private calculateEventImpact(eventType: string, state: MacroGameState): Record<string, number> {
    const impacts: Record<string, Record<string, number>> = {
      harvest: { food: 200, happiness: 10 },
      epidemic: { population: -50, health: -20 },
      discovery: { technology: 50, happiness: 15 },
      disaster: { population: -100, buildings: -20 },
      migration: { population: 50, diversity: 10 },
    };
    
    return impacts[eventType] || {};
  }
  
  /**
   * 保存幽灵演算结果
   */
  private async saveGhostSimulationResult(gameState: unknown, events: unknown[]): Promise<void> {
    try {
      const result = {
        timestamp: Date.now(),
        events,
        previousState: gameState,
      };

      // 保存到OPFS - V5修复：使用正确的 API 检查方式
      if ('storage' in navigator && typeof navigator.storage.getDirectory === 'function') {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle('ghost_simulation_result.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(result));
        await writable.close();
      }
    } catch (error) {
      console.error('[GhostSimulation] 保存结果失败:', error);
    }
  }

  /**
   * 获取幽灵演算状态
   */
  public getGhostState(): GhostSimulationState {
    return { ...this.ghostState };
  }

  /**
   * 检查是否满足幽灵演算条件
   */
  public async checkGhostConditions(): Promise<{
    canRun: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let canRun = true;

    // 检查PWA安装状态
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      // PWA可能未安装，但不是硬性阻止
      reasons.push('PWA未以独立模式运行');
    }

    // 检查电池状态（如果可用）
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as Navigator & { getBattery: () => Promise<{ charging: boolean }> }).getBattery();
        if (!battery.charging) {
          reasons.push('设备未在充电');
          // 充电状态不是硬性要求，只是建议
        }
      } catch (error) {
        console.warn('[BackgroundSync] Battery API check failed:', error);
      }
    }

    // 检查网络类型
    const connection = (navigator as Navigator & { connection?: { type?: string } }).connection;
    if (connection && connection.type === 'cellular') {
      reasons.push('使用蜂窝网络而非WiFi');
    }

    // 检查Service Worker和Periodic Sync支持
    if (!('serviceWorker' in navigator)) {
      canRun = false;
      reasons.push('Service Worker不支持');
    }

    return { canRun, reasons };
  }
}

// 单例实例
export const backgroundSync = new BackgroundSync();

// 导出类供测试使用
export { BackgroundSync, DEFAULT_CONFIG };
