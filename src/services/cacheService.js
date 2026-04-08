import Dexie from 'dexie';

// 创建数据库实例
class CacheDatabase extends Dexie {
  constructor() {
    super('CacheDatabase');
    this.version(1).stores({
      cache: '++id, key, value, timestamp, expiry'
    });
  }
}

const db = new CacheDatabase();

// 缓存服务类
class CacheService {
  // 存储数据到缓存
  static async set(key, value, expiry = 86400000) { // 默认过期时间1天
    const timestamp = Date.now();
    await db.cache.put({
      key,
      value,
      timestamp,
      expiry: timestamp + expiry
    });
  }

  // 从缓存获取数据
  static async get(key) {
    const item = await db.cache.where('key').equals(key).first();
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      await db.cache.where('key').equals(key).delete();
      return null;
    }

    return item.value;
  }

  // 删除缓存
  static async remove(key) {
    await db.cache.where('key').equals(key).delete();
  }

  // 清空所有缓存
  static async clear() {
    await db.cache.clear();
  }

  // 获取缓存状态
  static async getStatus() {
    const totalItems = await db.cache.count();
    const expiredItems = await db.cache.where('expiry').below(Date.now()).count();
    
    return {
      totalItems,
      expiredItems,
      activeItems: totalItems - expiredItems
    };
  }

  // 清理过期缓存
  static async cleanup() {
    const deletedCount = await db.cache.where('expiry').below(Date.now()).delete();
    return deletedCount;
  }

  // 批量存储
  static async setMultiple(items) {
    const timestamp = Date.now();
    const cacheItems = items.map(({ key, value, expiry = 86400000 }) => ({
      key,
      value,
      timestamp,
      expiry: timestamp + expiry
    }));
    
    await db.cache.bulkPut(cacheItems);
  }

  // 批量获取
  static async getMultiple(keys) {
    const results = {};
    const now = Date.now();
    
    for (const key of keys) {
      const item = await db.cache.where('key').equals(key).first();
      if (item && now <= item.expiry) {
        results[key] = item.value;
      } else {
        results[key] = null;
        if (item) {
          await db.cache.where('key').equals(key).delete();
        }
      }
    }
    
    return results;
  }
}

export default CacheService;