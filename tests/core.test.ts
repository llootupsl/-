/**
 * 永夜熵纪 - 核心系统测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
  writable: true,
});

describe('OMNISCore 常量系统', () => {
  it('APEX常量应该正确导出', async () => {
    const { APEX } = await import('../src/core/OMNISCore');
    
    expect(APEX).toBeDefined();
    expect(APEX.MAX_CITIZENS_EXTREME).toBe(100_000);
    expect(APEX.MAX_CITIZENS_BALANCED).toBe(10_000);
    expect(APEX.MAX_CITIZENS_ECO).toBe(1_000);
  });

  it('性能模式配置应该正确导出', async () => {
    const { APEX_MODE_CONFIG, PerformanceModeExtended } = await import('../src/core/OMNISCore');
    
    expect(APEX_MODE_CONFIG).toBeDefined();
    expect(APEX_MODE_CONFIG[PerformanceModeExtended.APEX]).toBeDefined();
    expect(APEX_MODE_CONFIG[PerformanceModeExtended.BALANCED]).toBeDefined();
    expect(APEX_MODE_CONFIG[PerformanceModeExtended.ECO]).toBeDefined();
  });
});

describe('宇宙游戏循环', () => {
  it('应该能创建CosmicGameLoop实例', async () => {
    const { CosmicGameLoop } = await import('../src/core/OMNISCore');
    
    const loop = new CosmicGameLoop();
    expect(loop).toBeDefined();
    expect(loop.getStats()).toBeDefined();
    expect(loop.isRunning()).toBe(false);
  });

  it('启动和停止应该正常工作', async () => {
    const { CosmicGameLoop } = await import('../src/core/OMNISCore');
    
    const loop = new CosmicGameLoop();
    loop.start();
    expect(loop.isRunning()).toBe(true);
    
    loop.stop();
    expect(loop.isRunning()).toBe(false);
  });
});

describe('市民系统', () => {
  it('ApexCitizen应该能正常创建', async () => {
    const { CitizenSystem } = await import('../src/core/OMNISCore');
    
    const system = new CitizenSystem(100, 64, 500);
    expect(system).toBeDefined();
  });
});

describe('熵增系统', () => {
  it('EntropySystem应该能正常创建', async () => {
    const { EntropySystem } = await import('../src/core/OMNISCore');
    
    const system = new EntropySystem({ entropyRate: 0.01 });
    expect(system).toBeDefined();
    
    const status = system.getStatus();
    expect(status.entropy).toBeDefined();
    expect(status.epoch).toBeDefined();
  });

  it('熵值应该限制在0-1范围内', async () => {
    const { EntropySystem } = await import('../src/core/OMNISCore');
    
    const system = new EntropySystem({ entropyRate: 0.01 });
    
    // 运行多个更新周期
    for (let i = 0; i < 100; i++) {
      system.update(0.016);
    }
    
    const status = system.getStatus();
    expect(status.entropy).toBeGreaterThanOrEqual(0);
    expect(status.entropy).toBeLessThanOrEqual(1);
  });

  it('时代判定应该正确', async () => {
    const { EntropySystem } = await import('../src/core/OMNISCore');
    
    const system = new EntropySystem({ entropyRate: 0.01 });
    const status = system.getStatus();
    
    const validEpochs = ['黄金时代', '稳定时代', '压力时代', '危机时代', '崩溃边缘', '熵增纪元'];
    expect(validEpochs).toContain(status.epoch);
  });
});

describe('经济学系统', () => {
  it('QuantumConsciousnessNetwork应该能正常创建', async () => {
    const { QuantumConsciousnessNetwork } = await import('../src/core/ApexExtreme');
    
    const network = new QuantumConsciousnessNetwork();
    expect(network).toBeDefined();
    
    // 初始化集体意识
    network.init(['citizen-1', 'citizen-2', 'citizen-3']);
    const state = network.getState();
    expect(state).toBeDefined();
    expect(state?.citizenIds.length).toBe(3);
  });

  it('应该能生成量子思维', async () => {
    const { QuantumConsciousnessNetwork } = await import('../src/core/ApexExtreme');
    
    const network = new QuantumConsciousnessNetwork();
    network.init(['citizen-1', 'citizen-2']);
    
    const thought = network.generateThought('测试思维', ['citizen-1']);
    expect(thought.content).toBe('测试思维');
    expect(thought.amplitude).toBeGreaterThanOrEqual(0);
    expect(thought.amplitude).toBeLessThanOrEqual(1);
  });
});

describe('事件总线', () => {
  it('UniverseEventBus应该能正常创建', async () => {
    const { UniverseEventBus } = await import('../src/core/ApexAPIs');
    
    const bus = new UniverseEventBus();
    expect(bus).toBeDefined();
  });

  it('应该能发布和接收事件', async () => {
    const { UniverseEventBus } = await import('../src/core/ApexAPIs');
    
    const bus = new UniverseEventBus();
    let receivedEvent = false;
    
    bus.subscribe('test.event', async (event) => {
      receivedEvent = true;
    });
    
    bus.publish({
      type: 'test.event' as any,
      timestamp: Date.now(),
      sourceWorldId: 'test-world',
      data: { test: true },
      priority: 'normal',
      propagation: 'local',
    });
    
    // 等待事件处理
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(receivedEvent).toBe(true);
  });
});
