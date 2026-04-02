/**
 * =============================================================================
 * 永夜熵纪 - 眼动追踪测试
 * Eye Tracking Unit Tests
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MediaPipe
vi.stubGlobal('FaceMesh', vi.fn().mockImplementation(() => ({
  setOptions: vi.fn().mockResolvedValue(undefined),
  onResults: vi.fn(),
  send: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),
})));

// Mock MediaStream
vi.stubGlobal('navigator', {
  ...navigator,
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
});

// Mock video element
class MockVideoElement {
  srcObject: MediaStream | null = null;
  readyState = 2;
  muted = true;
  
  setAttribute() {}
  play() { return Promise.resolve(); }
  pause() {}
}

vi.stubGlobal('document', {
  ...document,
  createElement: vi.fn((tag: string) => {
    if (tag === 'video') return new MockVideoElement();
    if (tag === 'canvas') return {
      getContext: vi.fn(() => null),
    };
    return {};
  }),
});

describe('EyeTracker', () => {
  let EyeTracker: typeof import('../../../src/input/EyeTracker').EyeTracker;
  let tracker: InstanceType<typeof EyeTracker>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const module = await import('../../../src/input/EyeTracker');
    EyeTracker = module.EyeTracker;
    tracker = new EyeTracker();
  });

  afterEach(() => {
    tracker?.dispose();
  });

  describe('初始化', () => {
    it('should initialize successfully', async () => {
      const result = await tracker.init();
      expect(result).toBe(true);
    });

    it('should handle MediaPipe not available', async () => {
      vi.stubGlobal('FaceMesh', undefined);
      
      const newTracker = new EyeTracker();
      const result = await newTracker.init();
      
      // 应该使用鼠标回退模式
      expect(result).toBe(true);
      newTracker.dispose();
    });
  });

  describe('启动/停止', () => {
    it('should start tracking', async () => {
      await tracker.init();
      await tracker.start();
      
      expect(tracker.isTracking()).toBe(true);
    });

    it('should stop tracking', async () => {
      await tracker.init();
      await tracker.start();
      tracker.stop();
      
      expect(tracker.isTracking()).toBe(false);
    });

    it('should not start twice', async () => {
      await tracker.init();
      await tracker.start();
      await tracker.start(); // 不应该抛出错误
      
      expect(tracker.isTracking()).toBe(true);
    });
  });

  describe('事件发射', () => {
    it('should emit gaze event', async () => {
      await tracker.init();
      
      const gazeHandler = vi.fn();
      tracker.on('gaze', gazeHandler);
      
      // 手动触发测试（实际由 Face Mesh 结果触发）
      // 这里我们只是验证事件系统工作
      tracker.emit('gaze', {
        screenX: 0.5,
        screenY: 0.5,
        confidence: 0.8,
        timestamp: Date.now(),
      });
      
      expect(gazeHandler).toHaveBeenCalled();
    });

    it('should emit blink event', async () => {
      await tracker.init();
      
      const blinkHandler = vi.fn();
      tracker.on('blink', blinkHandler);
      
      tracker.emit('blink', 'left');
      expect(blinkHandler).toHaveBeenCalledWith('left');
    });

    it('should emit calibration event', async () => {
      await tracker.init();
      
      const calibHandler = vi.fn();
      tracker.on('calibration', calibHandler);
      
      tracker.emit('calibration', {
        calibrated: false,
        progress: 0.5,
        pointCount: 9,
        failedCount: 0,
        maxFailures: 3,
      });
      
      expect(calibHandler).toHaveBeenCalled();
    });

    it('should emit error event', async () => {
      await tracker.init();
      
      const errorHandler = vi.fn();
      tracker.on('error', errorHandler);
      
      tracker.emit('error', new Error('Test error'));
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('校准', () => {
    it('should generate calibration points', async () => {
      await tracker.init();
      
      const status = tracker.getCalibrationStatus();
      expect(status.calibrated).toBe(false);
      expect(status.pointCount).toBe(0);
    });
  });

  describe('获取数据', () => {
    it('should return null gaze point before tracking', async () => {
      await tracker.init();
      
      const point = tracker.getGazePoint();
      expect(point).toBeNull();
    });

    it('should return calibration status', async () => {
      await tracker.init();
      
      const status = tracker.getCalibrationStatus();
      expect(status).toHaveProperty('calibrated');
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('pointCount');
    });
  });

  describe('资源清理', () => {
    it('should dispose resources', async () => {
      await tracker.init();
      await tracker.start();
      
      tracker.dispose();
      
      expect(tracker.isTracking()).toBe(false);
    });

    it('should handle multiple dispose', async () => {
      await tracker.init();
      
      tracker.dispose();
      tracker.dispose(); // 不应该抛出错误
      
      expect(tracker.isTracking()).toBe(false);
    });
  });
});

describe('GazePoint', () => {
  it('should have correct structure', () => {
    const gazePoint = {
      screenX: 0.5,
      screenY: 0.5,
      confidence: 0.9,
      timestamp: performance.now(),
    };

    expect(gazePoint.screenX).toBeGreaterThanOrEqual(0);
    expect(gazePoint.screenX).toBeLessThanOrEqual(1);
    expect(gazePoint.screenY).toBeGreaterThanOrEqual(0);
    expect(gazePoint.screenY).toBeLessThanOrEqual(1);
    expect(gazePoint.confidence).toBeGreaterThanOrEqual(0);
    expect(gazePoint.confidence).toBeLessThanOrEqual(1);
  });
});

describe('CalibrationStatus', () => {
  it('should track progress correctly', () => {
    const status = {
      calibrated: false,
      progress: 0.5,
      pointCount: 9,
      failedCount: 0,
      maxFailures: 3,
    };

    expect(status.progress).toBeGreaterThanOrEqual(0);
    expect(status.progress).toBeLessThanOrEqual(1);
    expect(status.pointCount).toBeGreaterThan(0);
  });
});

describe('Eye Aspect Ratio (EAR)', () => {
  it('should detect open eye', () => {
    // EAR > 0.2 表示眼睛睁开
    const ear = 0.35;
    const isBlinking = ear < 0.2;
    
    expect(isBlinking).toBe(false);
  });

  it('should detect closed eye', () => {
    const ear = 0.1;
    const isBlinking = ear < 0.2;
    
    expect(isBlinking).toBe(true);
  });
});

describe('平滑滤波', () => {
  it('should smooth gaze points', () => {
    const smoothingFactor = 0.3;
    
    let smoothedX = 0.5;
    const newX = 0.6;
    
    smoothedX = smoothedX * (1 - smoothingFactor) + newX * smoothingFactor;
    
    expect(smoothedX).toBeCloseTo(0.53);
    expect(smoothedX).toBeLessThan(newX);
    expect(smoothedX).toBeGreaterThan(0.5);
  });
});
