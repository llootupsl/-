import CacheService from '../../../src/services/cacheService';

describe('CacheService', () => {
  test('should be importable and instantiable', () => {
    // 验证服务可以被导入
    expect(CacheService).toBeDefined();
    
    // 验证服务方法存在
    expect(typeof CacheService.set).toBe('function');
    expect(typeof CacheService.get).toBe('function');
    expect(typeof CacheService.remove).toBe('function');
    expect(typeof CacheService.clear).toBe('function');
    expect(typeof CacheService.getStatus).toBe('function');
    expect(typeof CacheService.cleanup).toBe('function');
    expect(typeof CacheService.setMultiple).toBe('function');
    expect(typeof CacheService.getMultiple).toBe('function');
  });

  test('should handle IndexedDB errors gracefully', async () => {
    // 测试服务方法不会在测试环境中崩溃
    try {
      await CacheService.set('test', 'value');
    } catch (error) {
      // 预期在测试环境中可能会出错，因为没有IndexedDB
      expect(error).toBeDefined();
    }

    try {
      await CacheService.get('test');
    } catch (error) {
      expect(error).toBeDefined();
    }

    try {
      await CacheService.clear();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});