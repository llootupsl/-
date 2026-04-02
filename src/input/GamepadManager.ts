/**
 * =============================================================================
 * 永夜熵纪 - 手柄输入管理器
 * Gamepad Input Manager
 * =============================================================================
 */

import { EventEmitter } from 'eventemitter3';
import { logger } from '@/core/utils/Logger';

/** 手柄状态 */
export interface GamepadState {
  index: number;
  id: string;
  connected: boolean;
  buttons: boolean[];
  buttonValues: number[];
  axes: number[];
  timestamp: number;
}

/** 手柄按钮映射 */
export interface ButtonMapping {
  button: number;
  action: string;
}

/** 手柄事件 */
export interface GamepadEvents {
  /** 手柄连接 */
  connected: (gamepad: GamepadState) => void;
  /** 手柄断开 */
  disconnected: (index: number) => void;
  /** 按钮按下 */
  buttonDown: (index: number, button: number) => void;
  /** 按钮释放 */
  buttonUp: (index: number, button: number) => void;
  /** 摇杆移动 */
  axisMove: (index: number, axis: number, value: number) => void;
  /** 状态更新 */
  update: (states: Map<number, GamepadState>) => void;
}

/** 配置 */
export interface GamepadConfig {
  /** 摇杆死区 */
  deadzone: number;
  /** 按钮映射 */
  buttonMappings: ButtonMapping[];
  /** 轮询间隔 (ms) */
  pollInterval: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: GamepadConfig = {
  deadzone: 0.15,
  buttonMappings: [
    { button: 0, action: 'confirm' },
    { button: 1, action: 'cancel' },
    { button: 2, action: 'menu' },
    { button: 3, action: 'options' },
    { button: 4, action: 'l1' },
    { button: 5, action: 'r1' },
    { button: 6, action: 'l2' },
    { button: 7, action: 'r2' },
    { button: 8, action: 'select' },
    { button: 9, action: 'start' },
    { button: 10, action: 'l3' },
    { button: 11, action: 'r3' },
    { button: 12, action: 'dpad_up' },
    { button: 13, action: 'dpad_down' },
    { button: 14, action: 'dpad_left' },
    { button: 15, action: 'dpad_right' },
    { button: 16, action: 'home' },
  ],
  pollInterval: 16, // ~60fps
};

/**
 * 手柄输入管理器
 */
export class GamepadManager extends EventEmitter<GamepadEvents> {
  private config: GamepadConfig;
  private gamepads: Map<number, GamepadState> = new Map();
  private previousButtons: Map<number, boolean[]> = new Map();
  private pollInterval: number | null = null;
  private isPolling: boolean = false;
  private boundOnGamepadConnected: (event: GamepadEvent) => void;
  private boundOnGamepadDisconnected: (event: GamepadEvent) => void;

  constructor(config: Partial<GamepadConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.boundOnGamepadConnected = this.onGamepadConnected.bind(this);
    this.boundOnGamepadDisconnected = this.onGamepadDisconnected.bind(this);
    this.setupEventListeners();
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', this.boundOnGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.boundOnGamepadDisconnected);
  }

  /**
   * 手柄连接
   */
  private onGamepadConnected(event: GamepadEvent): void {
    const gamepad = event.gamepad;
    
    const state: GamepadState = {
      index: gamepad.index,
      id: gamepad.id,
      connected: true,
      buttons: gamepad.buttons.map(b => b.pressed),
      buttonValues: gamepad.buttons.map(b => b.value),
      axes: [...gamepad.axes],
      timestamp: gamepad.timestamp,
    };

    this.gamepads.set(gamepad.index, state);
    this.previousButtons.set(gamepad.index, gamepad.buttons.map(b => b.pressed));

    this.emit('connected', state);
    logger.info('GamepadManager', `Connected: ${gamepad.id}`);

    if (!this.isPolling) {
      this.startPolling();
    }
  }

  private onGamepadDisconnected(event: GamepadEvent): void {
    const index = event.gamepad.index;
    
    this.gamepads.delete(index);
    this.previousButtons.delete(index);

    this.emit('disconnected', index);
    logger.info('GamepadManager', `Disconnected: index ${index}`);

    // 停止轮询
    if (this.gamepads.size === 0) {
      this.stopPolling();
    }
  }

  /**
   * 开始轮询
   */
  public startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollInterval = window.setInterval(
      this.poll.bind(this),
      this.config.pollInterval
    );
  }

  /**
   * 停止轮询
   */
  public stopPolling(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  /**
   * 轮询更新
   */
  private poll(): void {
    const gamepads = navigator.getGamepads();

    for (const gamepad of gamepads) {
      if (!gamepad) continue;

      const index = gamepad.index;
      const state = this.gamepads.get(index);
      const prevButtons = this.previousButtons.get(index);

      if (!state || !prevButtons) continue;

      // 更新按钮状态
      for (let i = 0; i < gamepad.buttons.length; i++) {
        const pressed = gamepad.buttons[i].pressed;
        const value = gamepad.buttons[i].value;

        // 按钮按下
        if (pressed && !prevButtons[i]) {
          this.emit('buttonDown', index, i);
        }

        // 按钮释放
        if (!pressed && prevButtons[i]) {
          this.emit('buttonUp', index, i);
        }

        state.buttons[i] = pressed;
        state.buttonValues[i] = value;
        prevButtons[i] = pressed;
      }

      // 更新摇杆状态
      for (let i = 0; i < gamepad.axes.length; i++) {
        let value = gamepad.axes[i];

        // 应用死区
        if (Math.abs(value) < this.config.deadzone) {
          value = 0;
        }

        // 检测变化
        if (Math.abs(value - state.axes[i]) > 0.01) {
          this.emit('axisMove', index, i, value);
        }

        state.axes[i] = value;
      }

      state.timestamp = gamepad.timestamp;
    }

    this.emit('update', this.gamepads);
  }

  /**
   * 获取手柄状态
   */
  public getState(index: number): GamepadState | undefined {
    return this.gamepads.get(index);
  }

  /**
   * 获取所有手柄
   */
  public getGamepads(): GamepadState[] {
    return Array.from(this.gamepads.values());
  }

  /**
   * 获取摇杆值
   */
  public getAxis(index: number, axis: number): number {
    const state = this.gamepads.get(index);
    return state?.axes[axis] ?? 0;
  }

  /**
   * 获取左摇杆
   */
  public getLeftStick(index: number): { x: number; y: number } {
    return {
      x: this.getAxis(index, 0),
      y: this.getAxis(index, 1),
    };
  }

  /**
   * 获取右摇杆
   */
  public getRightStick(index: number): { x: number; y: number } {
    return {
      x: this.getAxis(index, 2),
      y: this.getAxis(index, 3),
    };
  }

  /**
   * 获取按钮映射动作
   */
  public getButtonAction(button: number): string | undefined {
    const mapping = this.config.buttonMappings.find(m => m.button === button);
    return mapping?.action;
  }

  /**
   * 是否按下按钮
   */
  public isButtonPressed(index: number, button: number): boolean {
    const state = this.gamepads.get(index);
    return state?.buttons[button] ?? false;
  }

  /**
   * 检查手柄是否支持
   */
  public isSupported(): boolean {
    return 'getGamepads' in navigator;
  }

  /**
   * 触发振动
   */
  public async triggerVibration(intensity: 'light' | 'medium' | 'heavy', duration: number): Promise<boolean> {
    const magnitudes = {
      light: { weak: 0.3, strong: 0.3 },
      medium: { weak: 0.6, strong: 0.6 },
      heavy: { weak: 1.0, strong: 1.0 },
    };
    const { weak, strong } = magnitudes[intensity];
    
    for (const [index] of this.gamepads) {
      await this.vibrate(index, duration, weak, strong);
    }
    return true;
  }

  /**
   * 触发振动
   */
  public async vibrate(
    index: number,
    duration: number = 100,
    weakMagnitude: number = 1,
    strongMagnitude: number = 1
  ): Promise<boolean> {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[index];

    if (!gamepad || !('vibrationActuator' in gamepad)) {
      return false;
    }

    try {
      await gamepad.vibrationActuator!.playEffect('dual-rumble', {
        duration,
        weakMagnitude,
        strongMagnitude,
      });
      return true;
    } catch (error) {
      logger.warn('GamepadManager', 'Vibration play failed', error as Error);
      return false;
    }
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopPolling();
    window.removeEventListener('gamepadconnected', this.boundOnGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.boundOnGamepadDisconnected);
    this.gamepads.clear();
    this.previousButtons.clear();
    this.removeAllListeners();
  }
}

// 单例
export const gamepadManager = new GamepadManager();

export default GamepadManager;
