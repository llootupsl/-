import React, { useState, useEffect } from 'react';
import PWAService from '../services/pwaService';

const PWADemo = () => {
  const [installState, setInstallState] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [message, setMessage] = useState('');

  // 初始化
  useEffect(() => {
    checkPWAStatus();
    checkNotificationPermission();
    checkCacheStatus();
  }, []);

  // 检查PWA状态
  const checkPWAStatus = async () => {
    const state = PWAService.getInstallState();
    setInstallState(state);
  };

  // 检查通知权限
  const checkNotificationPermission = async () => {
    const permission = await PWAService.checkNotificationPermission();
    setNotificationPermission(permission);
  };

  // 检查缓存状态
  const checkCacheStatus = async () => {
    const status = await PWAService.getCacheStatus();
    setCacheStatus(status);
  };

  // 请求通知权限
  const handleRequestNotificationPermission = async () => {
    const permission = await PWAService.requestNotificationPermission();
    setNotificationPermission(permission);
    setMessage(`通知权限状态: ${permission}`);
  };

  // 发送测试通知
  const handleSendTestNotification = async () => {
    const success = await PWAService.sendLocalNotification('测试通知', {
      body: '这是一条测试通知，用于演示PWA的推送通知功能。',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: '/#pwa'
      },
      actions: [
        {
          action: 'explore',
          title: '查看详情'
        },
        {
          action: 'close',
          title: '关闭'
        }
      ]
    });
    
    if (success) {
      setMessage('测试通知已发送');
    } else {
      setMessage('发送通知失败，请检查通知权限');
    }
  };

  // 订阅推送通知
  const handleSubscribeToPush = async () => {
    const subscription = await PWAService.subscribeToPushNotifications();
    if (subscription) {
      setMessage('推送通知订阅成功');
    } else {
      setMessage('推送通知订阅失败');
    }
  };

  // 清理缓存
  const handleClearCache = async () => {
    const success = await PWAService.clearCache();
    if (success) {
      setMessage('缓存已清理');
      await checkCacheStatus();
    } else {
      setMessage('清理缓存失败');
    }
  };

  // 注册后台同步
  const handleRegisterSync = async () => {
    const success = await PWAService.registerBackgroundSync('sync-data');
    if (success) {
      setMessage('后台同步已注册');
    } else {
      setMessage('注册后台同步失败');
    }
  };

  return (
    <div className="pwa-demo">
      <h2 className="text-2xl font-bold mb-6">PWA 功能演示</h2>
      
      {/* PWA 状态 */}
      <div className="bg-bg-surface p-4 rounded-lg border border-border-default mb-6">
        <h3 className="text-lg font-semibold mb-3">PWA 状态</h3>
        {installState && (
          <div className="space-y-2">
            <p>是否以独立模式运行: {installState.isStandalone ? '是' : '否'}</p>
            <p>是否可以安装: {installState.canInstall ? '是' : '否'}</p>
          </div>
        )}
      </div>

      {/* 通知功能 */}
      <div className="bg-bg-surface p-4 rounded-lg border border-border-default mb-6">
        <h3 className="text-lg font-semibold mb-3">通知功能</h3>
        <div className="space-y-4">
          <p>通知权限状态: {notificationPermission}</p>
          <button 
            className="bg-accent-bg text-accent border border-accent-border px-4 py-2 rounded-md hover:shadow-accent-glow transition-all"
            onClick={handleRequestNotificationPermission}
          >
            请求通知权限
          </button>
          <button 
            className="bg-bg-elevated text-text-primary border border-border-default px-4 py-2 rounded-md hover:border-accent transition-all"
            onClick={handleSendTestNotification}
            disabled={notificationPermission !== 'granted'}
          >
            发送测试通知
          </button>
          <button 
            className="bg-bg-elevated text-text-primary border border-border-default px-4 py-2 rounded-md hover:border-accent transition-all"
            onClick={handleSubscribeToPush}
          >
            订阅推送通知
          </button>
        </div>
      </div>

      {/* 缓存管理 */}
      <div className="bg-bg-surface p-4 rounded-lg border border-border-default mb-6">
        <h3 className="text-lg font-semibold mb-3">缓存管理</h3>
        <div className="space-y-4">
          {cacheStatus && (
            <div>
              <p>缓存状态:</p>
              <ul className="list-disc list-inside text-text-secondary">
                {Object.entries(cacheStatus).map(([name, count]) => (
                  <li key={name}>{name}: {count} 个资源</li>
                ))}
              </ul>
            </div>
          )}
          <button 
            className="bg-bg-elevated text-text-primary border border-border-default px-4 py-2 rounded-md hover:border-accent transition-all"
            onClick={handleClearCache}
          >
            清理缓存
          </button>
          <button 
            className="bg-bg-elevated text-text-primary border border-border-default px-4 py-2 rounded-md hover:border-accent transition-all"
            onClick={checkCacheStatus}
          >
            刷新缓存状态
          </button>
        </div>
      </div>

      {/* 后台同步 */}
      <div className="bg-bg-surface p-4 rounded-lg border border-border-default mb-6">
        <h3 className="text-lg font-semibold mb-3">后台同步</h3>
        <button 
          className="bg-bg-elevated text-text-primary border border-border-default px-4 py-2 rounded-md hover:border-accent transition-all"
          onClick={handleRegisterSync}
        >
          注册后台同步
        </button>
      </div>

      {/* 操作消息 */}
      {message && (
        <div className="bg-bg-elevated p-3 rounded-md border border-border-default">
          {message}
        </div>
      )}

      {/* PWA 信息 */}
      <div className="mt-8 p-4 bg-bg-elevated rounded-lg border border-border-default">
        <h3 className="text-lg font-semibold mb-2">PWA 功能说明</h3>
        <ul className="list-disc list-inside text-text-secondary space-y-2">
          <li>离线访问: 即使没有网络连接，也能访问网站的核心功能</li>
          <li>添加到主屏幕: 可以像原生应用一样添加到设备主屏幕</li>
          <li>推送通知: 即使应用在后台，也能收到通知</li>
          <li>后台同步: 在网络恢复时自动同步数据</li>
          <li>缓存管理: 智能缓存资源，提升加载速度</li>
        </ul>
      </div>
    </div>
  );
};

export default PWADemo;