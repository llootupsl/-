// PWA服务类
class PWAService {
  // 检查是否支持PWA
  static isPWASupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // 注册Service Worker
  static async registerServiceWorker() {
    if (!this.isPWASupported()) {
      console.log('PWA is not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // 检查PWA安装状态
  static getInstallState() {
    return {
      isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                   window.navigator.standalone === true,
      canInstall: 'beforeinstallprompt' in window
    };
  }

  // 订阅推送通知
  static async subscribeToPushNotifications() {
    if (!this.isPWASupported()) {
      console.log('Push notifications are not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // 检查是否已经订阅
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // 创建新的订阅
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
        });
        
        console.log('Push notification subscription created:', subscription);
        // 这里可以将订阅信息发送到服务器
      }
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // 取消推送通知订阅
  static async unsubscribeFromPushNotifications() {
    if (!this.isPWASupported()) {
      console.log('Push notifications are not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push notification subscription removed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // 检查推送通知权限
  static async checkNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications are not supported');
      return 'unsupported';
    }

    return Notification.permission;
  }

  // 请求通知权限
  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications are not supported');
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // 发送本地通知
  static async sendLocalNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.log('Notifications are not supported');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    try {
      new Notification(title, options);
      return true;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return false;
    }
  }

  // 检查后台同步支持
  static isBackgroundSyncSupported() {
    return 'serviceWorker' in navigator && 'SyncManager' in window;
  }

  // 注册后台同步
  static async registerBackgroundSync(tag) {
    if (!this.isBackgroundSyncSupported()) {
      console.log('Background sync is not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered for tag:', tag);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  // 辅助方法：将base64 URL转换为Uint8Array
  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 获取缓存状态
  static async getCacheStatus() {
    if (!('caches' in window)) {
      console.log('Cache API is not supported');
      return null;
    }

    try {
      const cacheNames = await caches.keys();
      const cacheStatus = {};

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        cacheStatus[cacheName] = requests.length;
      }

      return cacheStatus;
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return null;
    }
  }

  // 清理缓存
  static async clearCache() {
    if (!('caches' in window)) {
      console.log('Cache API is not supported');
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('Cache cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
}

export default PWAService;