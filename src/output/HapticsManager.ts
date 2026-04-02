/**
 * =============================================================================
 * 永夜熵纪 - 触觉反馈管理器
 * Haptics Manager for Vibration Feedback
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';

/** 触觉模式 */
export interface HapticPattern {
  name: string;
  pattern: number | number[];
  description?: string;
}

/** 预定义触觉模式 */
export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  // 基础
  light: { name: 'light', pattern: 10 },
  medium: { name: 'medium', pattern: 25 },
  heavy: { name: 'heavy', pattern: 50 },
  
  // 反馈
  success: { name: 'success', pattern: [30, 50, 80] },
  warning: { name: 'warning', pattern: [50, 100, 50] },
  error: { name: 'error', pattern: [100, 50, 100, 50, 100] },
  
  // 交互
  click: { name: 'click', pattern: 5 },
  tick: { name: 'tick', pattern: 3 },
  bump: { name: 'bump', pattern: [10, 20, 10] },
  
  // 特殊
  heartbeat: { name: 'heartbeat', pattern: [100, 100, 100] },
  pulse: { name: 'pulse', pattern: [20, 100, 20, 100, 20] },
  wave: { name: 'wave', pattern: [10, 50, 20, 50, 30, 50, 40] },
  
  // 游戏特定
  damage: { name: 'damage', pattern: [80, 40, 60, 40, 80] },
  heal: { name: 'heal', pattern: [20, 30, 40, 50, 60] },
  levelup: { name: 'levelup', pattern: [30, 50, 70, 90, 110] },
  discovery: { name: 'discovery', pattern: [20, 40, 60, 40, 20] },
};

/** 触觉事件 */
export interface HapticsEvents {
  /** 振动开始 */
  start: (pattern: string) => void;
  /** 振动结束 */
  end: () => void;
  /** 错误 */
  error: (error: Error) => void;
}

/**
 * 触觉反馈管理器
 */
export class HapticsManager extends EventEmitter<HapticsEvents> {
  private isVibrating: boolean = false;
  private enabled: boolean = true;
  private intensity: number = 1;

  constructor() {
    super();
  }

  /**
   * 检查振动 API 支持
   */
  public isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * 执行振动模式
   */
  public async pattern(name: string): Promise<boolean> {
    if (!this.enabled || !this.isSupported()) return false;

    const hapticPattern = HAPTIC_PATTERNS[name];
    if (!hapticPattern) {
      this.emit('error', new Error(`Unknown pattern: ${name}`));
      return false;
    }

    return this.vibrate(hapticPattern.pattern);
  }

  /**
   * 执行振动
   */
  public async vibrate(pattern: number | number[]): Promise<boolean> {
    if (!this.enabled || !this.isSupported()) return false;

    // 应用强度
    let adjustedPattern: number | number[];
    if (typeof pattern === 'number') {
      adjustedPattern = Math.round(pattern * this.intensity);
    } else {
      adjustedPattern = pattern.map(p => Math.round(p * this.intensity));
    }

    this.isVibrating = true;
    this.emit('start', typeof pattern === 'number' ? 'custom' : 'custom-sequence');

    try {
      const result = navigator.vibrate(adjustedPattern);
      
      // 等待振动完成
      const duration = typeof adjustedPattern === 'number' 
        ? adjustedPattern 
        : adjustedPattern.reduce((a, b) => a + b, 0);
      
      await new Promise(resolve => setTimeout(resolve, duration));
      
      this.isVibrating = false;
      this.emit('end');
      
      return result;
    } catch (error) {
      this.isVibrating = false;
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * 停止振动
   */
  public stop(): void {
    if (this.isSupported()) {
      navigator.vibrate(0);
      this.isVibrating = false;
      this.emit('end');
    }
  }

  /**
   * 启用/禁用
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * 设置强度 (0-1)
   */
  public setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * 获取状态
   */
  public isActive(): boolean {
    return this.isVibrating;
  }

  /**
   * 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取可用模式
   */
  public getAvailablePatterns(): string[] {
    return Object.keys(HAPTIC_PATTERNS);
  }

  /**
   * 获取模式详情
   */
  public getPattern(name: string): HapticPattern | undefined {
    return HAPTIC_PATTERNS[name];
  }

  /**
   * 添加自定义模式
   */
  public addPattern(name: string, pattern: number | number[], description?: string): void {
    HAPTIC_PATTERNS[name] = {
      name,
      pattern,
      description,
    };
  }
}

// 单例
export const hapticsManager = new HapticsManager();

export default HapticsManager;
