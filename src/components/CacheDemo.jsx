import React, { useState, useEffect } from 'react';
import CacheService from '../services/cacheService';

const CacheDemo = () => {
  const [cacheKey, setCacheKey] = useState('demo-key');
  const [cacheValue, setCacheValue] = useState('Hello, Cache!');
  const [retrievedValue, setRetrievedValue] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 初始化时获取缓存状态
  useEffect(() => {
    const getStatus = async () => {
      const status = await CacheService.getStatus();
      setCacheStatus(status);
    };
    getStatus();
  }, []);

  // 存储缓存
  const handleSetCache = async () => {
    if (!cacheKey || !cacheValue) {
      setMessage('请输入键和值');
      return;
    }

    setIsLoading(true);
    try {
      await CacheService.set(cacheKey, cacheValue);
      setMessage('缓存存储成功');
      const status = await CacheService.getStatus();
      setCacheStatus(status);
    } catch (error) {
      setMessage('存储失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取缓存
  const handleGetCache = async () => {
    if (!cacheKey) {
      setMessage('请输入键');
      return;
    }

    setIsLoading(true);
    try {
      const value = await CacheService.get(cacheKey);
      setRetrievedValue(value);
      if (value !== null) {
        setMessage('缓存获取成功');
      } else {
        setMessage('缓存不存在或已过期');
      }
    } catch (error) {
      setMessage('获取失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 清理过期缓存
  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const deletedCount = await CacheService.cleanup();
      setMessage(`清理了 ${deletedCount} 个过期缓存`);
      const status = await CacheService.getStatus();
      setCacheStatus(status);
    } catch (error) {
      setMessage('清理失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空所有缓存
  const handleClear = async () => {
    setIsLoading(true);
    try {
      await CacheService.clear();
      setMessage('所有缓存已清空');
      setRetrievedValue(null);
      const status = await CacheService.getStatus();
      setCacheStatus(status);
    } catch (error) {
      setMessage('清空失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cache-demo">
      <h2>智能缓存系统演示</h2>
      
      <div className="cache-status">
        <h3>缓存状态</h3>
        {cacheStatus && (
          <div>
            <p>总缓存项: {cacheStatus.totalItems}</p>
            <p>活跃缓存项: {cacheStatus.activeItems}</p>
            <p>过期缓存项: {cacheStatus.expiredItems}</p>
          </div>
        )}
      </div>

      <div className="cache-operations">
        <h3>缓存操作</h3>
        
        <div className="form-group">
          <label>键:</label>
          <input
            type="text"
            value={cacheKey}
            onChange={(e) => setCacheKey(e.target.value)}
            placeholder="输入缓存键"
          />
        </div>

        <div className="form-group">
          <label>值:</label>
          <input
            type="text"
            value={cacheValue}
            onChange={(e) => setCacheValue(e.target.value)}
            placeholder="输入缓存值"
          />
        </div>

        <div className="button-group">
          <button 
            onClick={handleSetCache} 
            disabled={isLoading}
          >
            {isLoading ? '存储中...' : '存储缓存'}
          </button>
          <button 
            onClick={handleGetCache} 
            disabled={isLoading}
          >
            {isLoading ? '获取中...' : '获取缓存'}
          </button>
          <button 
            onClick={handleCleanup} 
            disabled={isLoading}
          >
            {isLoading ? '清理中...' : '清理过期缓存'}
          </button>
          <button 
            onClick={handleClear} 
            disabled={isLoading}
          >
            {isLoading ? '清空ing...' : '清空所有缓存'}
          </button>
        </div>

        {retrievedValue !== null && (
          <div className="retrieved-value">
            <h4>获取的值:</h4>
            <p>{retrievedValue}</p>
          </div>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}
      </div>

      <div className="offline-info">
        <h3>离线访问能力</h3>
        <p>此缓存系统支持离线访问，当网络不可用时，应用将使用本地缓存的数据。</p>
        <p>尝试断开网络连接，然后刷新页面，您仍然可以访问已缓存的数据。</p>
      </div>
    </div>
  );
};

export default CacheDemo;