/**
 * Service Worker 管理器
 * 负责 SW 的注册、更新、生命周期管理
 */

export type SWState = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';

export interface SWUpdateInfo {
  needUpdate: boolean;
  registration?: ServiceWorkerRegistration;
  waitingSW?: ServiceWorker;
}

export type SWMessageHandler = (data: unknown) => void;

export type SWMessageType = 
  | 'SKIP_WAITING'
  | 'CLEAR_CACHE'
  | 'CACHE_URLS'
  | 'GET_CACHE_STATUS'
  | 'CACHE_STATUS'
  | 'SAVE_GAME_STATE'
  | 'PHANTOM_COMPUTATION'
  | 'SIMULATE_OFFLINE';

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallback: ((info: SWUpdateInfo) => void) | null = null;
  private stateChangeCallback: ((state: SWState) => void) | null = null;
  private messageHandlers: Map<string, SWMessageHandler[]> = new Map();
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  /**
   * 检查浏览器是否支持 Service Worker
   */
  public isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 注册 Service Worker
   */
  public async register(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('[SW Manager] 浏览器不支持 Service Worker');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        type: 'classic',
      });

      console.log('[SW Manager] Service Worker 注册成功:', this.registration.scope);

      // 监听安装状态变化
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          console.log('[SW Manager] 发现新版本 Service Worker');

          newWorker.addEventListener('statechange', () => {
            const state = newWorker.state as SWState;
            console.log('[SW Manager] SW 状态变化:', state);
            this.stateChangeCallback?.(state);

            // 安装完成但等待中
            if (state === 'installed' && navigator.serviceWorker.controller) {
              this.updateCallback?.({
                needUpdate: true,
                registration: this.registration!,
                waitingSW: newWorker,
              });
            }
          });
        }
      });

      // 监听控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW Manager] 控制器变化，重新加载页面');
        window.location.reload();
      });

      return this.registration;
    } catch (error) {
      console.error('[SW Manager] Service Worker 注册失败:', error);
      return null;
    }
  }

  /**
   * 检查更新
   */
  public async checkForUpdate(): Promise<boolean> {
    if (!this.registration) {
      console.warn('[SW Manager] 尚未注册 Service Worker');
      return false;
    }

    try {
      await this.registration.update();
      return false;
    } catch (error) {
      console.error('[SW Manager] 检查更新失败:', error);
      return false;
    }
  }

  /**
   * 跳过等待并激活新版本
   */
  public async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      console.warn('[SW Manager] 没有等待中的 Service Worker');
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * 发送消息到 Service Worker
   */
  public async postMessage(message: { type: SWMessageType; payload?: unknown }): Promise<void> {
    if (!this.registration?.active) {
      console.warn('[SW Manager] 没有活跃的 Service Worker');
      return;
    }

    this.registration.active.postMessage(message);
  }

  /**
   * 注册消息处理器
   */
  public onMessage(type: string, handler: SWMessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    // 添加 navigator 监听器
    if (!this.messageHandlers.has('_listening')) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type: msgType, ...data } = event.data;
        this.messageHandlers.get(msgType)?.forEach(handler => handler(data));
      });
      this.messageHandlers.set('_listening', []);
    }
  }

  /**
   * 设置更新回调
   */
  public onUpdateFound(callback: (info: SWUpdateInfo) => void): void {
    this.updateCallback = callback;
  }

  /**
   * 设置状态变化回调
   */
  public onStateChange(callback: (state: SWState) => void): void {
    this.stateChangeCallback = callback;
  }

  /**
   * 获取当前状态
   */
  public getState(): SWState | null {
    if (!this.registration) return null;
    if (!this.registration.active) return null;
    
    const state = this.registration.active.state;
    return state as SWState;
  }

  /**
   * 获取缓存状态
   */
  public async getCacheStatus(): Promise<Record<string, number>> {
    return new Promise((resolve) => {
      if (!this.registration?.active) {
        resolve({});
        return;
      }

      const handler = (data: unknown) => {
        resolve(data as Record<string, number>);
      };

      this.onMessage('CACHE_STATUS', handler);
      this.registration.active.postMessage({ type: 'GET_CACHE_STATUS' });

      // 超时处理
      setTimeout(() => resolve({}), 3000);
    });
  }

  /**
   * 清除所有缓存
   */
  public async clearCache(): Promise<void> {
    await this.postMessage({ type: 'CLEAR_CACHE' });
  }

  /**
   * 缓存指定 URL
   */
  public async cacheUrls(urls: string[]): Promise<void> {
    await this.postMessage({ type: 'CACHE_URLS', payload: { urls } });
  }

  /**
   * 进入离线模拟模式
   */
  public async enableOfflineMode(urls: string[]): Promise<void> {
    await this.postMessage({ type: 'SIMULATE_OFFLINE', payload: { urls } });
  }

  /**
   * 卸载 Service Worker
   */
  public async unregister(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.unregister();
      console.log('[SW Manager] Service Worker 已注销');
    } catch (error) {
      console.error('[SW Manager] 注销失败:', error);
    }
  }

  /**
   * 获取注册对象
   */
  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// 单例实例
export const swManager = new ServiceWorkerManager();

// 导出类供测试使用
export { ServiceWorkerManager };
